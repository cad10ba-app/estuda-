import { windowSlots, type PlanBlock } from '@estuda/engine';
import type { Deps } from './ports';
import { planWeek, startOfDayUTC } from './usecases';

const DAY_MS = 86_400_000;
const MIN_MS = 60_000;

/** REQ-007: marca o bloco como perdido (vira histórico) e replana o restante, repondo o conteúdo. */
export async function markBlockMissed(deps: Deps, start: Date) {
  const plan = await deps.store.listPlan();
  if (!plan.some((b) => b.start.getTime() === start.getTime())) throw new Error('Bloco não encontrado.');
  await deps.store.savePlan(
    plan.map((b) => (b.start.getTime() === start.getTime() ? { ...b, missed: true, locked: false } : b)),
  );
  return planWeek(deps);
}

/** Horários livres (futuros, dentro das janelas) onde um bloco pode ser colocado. */
export async function freeSlots(deps: Deps): Promise<Date[]> {
  const profile = await deps.store.getProfile();
  if (!profile) return [];
  const [windows, plan] = await Promise.all([deps.store.listWindows(), deps.store.listPlan()]);
  const now = deps.clock.now().getTime();
  const weekStart = startOfDayUTC(deps.clock.now());
  return windowSlots(weekStart, profile, windows).filter(
    (s) => s.getTime() >= now && !plan.some((b) => overlapsBlock(s.getTime(), profile.focusMin, b)),
  );
}

function overlapsBlock(start: number, dur: number, b: PlanBlock): boolean {
  const bs = b.start.getTime();
  return start < bs + b.durationMin * MIN_MS && bs < start + dur * MIN_MS;
}

/** REQ-008: move um bloco para um horário livre; o bloco fica travado na nova posição. */
export async function moveBlock(deps: Deps, from: Date, to: Date) {
  const plan = await deps.store.listPlan();
  const block = plan.find((b) => b.start.getTime() === from.getTime());
  if (!block) throw new Error('Bloco não encontrado.');
  const free = await freeSlots(deps);
  if (!free.some((s) => s.getTime() === to.getTime())) throw new Error('Esse horário não está livre.');
  await deps.store.savePlan(
    plan.map((b) => (b === block ? { ...b, start: to, locked: true } : b)).sort((a, b) => a.start.getTime() - b.start.getTime()),
  );
}

/** Agrupa blocos por dia (UTC), na ordem, para os próximos 7 dias a partir de hoje. */
export function groupByDay(plan: PlanBlock[], today: Date): { day: Date; blocks: PlanBlock[] }[] {
  const base = startOfDayUTC(today).getTime();
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(base + i * DAY_MS);
    return {
      day,
      blocks: plan
        .filter((b) => b.start.getTime() >= day.getTime() && b.start.getTime() < day.getTime() + DAY_MS)
        .sort((a, b) => a.start.getTime() - b.start.getTime()),
    };
  });
}
