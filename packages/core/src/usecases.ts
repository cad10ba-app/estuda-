import { generateWeeklyPlan, type PlanBlock, type PlanResult } from '@estuda/engine';
import type { Deps } from './ports';

const DAY_MS = 86_400_000;

/** 00:00 UTC do dia de `d`. */
export function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/** Gera e persiste o plano dos próximos 7 dias, preservando blocos travados. */
export async function planWeek(deps: Deps): Promise<PlanResult> {
  const { store, clock, notifier } = deps;
  const profile = await store.getProfile();
  if (!profile) throw new Error('Perfil não configurado: conclua o onboarding.');
  const weekStart = startOfDayUTC(clock.now());
  const [subjects, deadlines, windows, current] = await Promise.all([
    store.listSubjects(),
    store.listDeadlines(),
    store.listWindows(),
    store.listPlan(),
  ]);
  const locked = current.filter((b) => b.locked && b.start >= weekStart);
  const result = generateWeeklyPlan({ weekStart, profile, subjects, deadlines, windows, locked });
  await store.savePlan(result.blocks);
  await notifier?.schedule(result.blocks);
  return result;
}

/** Blocos do dia (UTC) de `day`, ordenados. */
export async function blocksForDay(deps: Deps, day: Date = deps.clock.now()): Promise<PlanBlock[]> {
  const from = startOfDayUTC(day).getTime();
  const plan = await deps.store.listPlan();
  return plan
    .filter((b) => b.start.getTime() >= from && b.start.getTime() < from + DAY_MS)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Trava/destrava um bloco para o motor não movê-lo. */
export async function setBlockLocked(deps: Deps, start: Date, locked: boolean): Promise<void> {
  const plan = await deps.store.listPlan();
  await deps.store.savePlan(
    plan.map((b) => (b.start.getTime() === start.getTime() ? { ...b, locked } : b)),
  );
}
