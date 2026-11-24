import { generateWeeklyPlan, type PlanBlock, type PlanResult } from '@estuda/engine';
import type { Deps } from './ports';

const DAY_MS = 86_400_000;

/** 00:00 UTC do dia de `d`. */
export function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Gera e persiste o plano dos próximos 7 dias.
 * Mantém como fixos: blocos já passados (histórico) e blocos travados futuros.
 * Blocos perdidos recentes geram reposição (carry-over).
 */
export async function planWeek(deps: Deps): Promise<PlanResult> {
  const { store, clock, notifier } = deps;
  const profile = await store.getProfile();
  if (!profile) throw new Error('Perfil não configurado: conclua o onboarding.');
  const now = clock.now();
  const weekStart = startOfDayUTC(now);
  const [subjects, deadlines, windows, current] = await Promise.all([
    store.listSubjects(),
    store.listDeadlines(),
    store.listWindows(),
    store.listPlan(),
  ]);
  const horizon = weekStart.getTime() + 7 * DAY_MS;
  const inHorizon = current.filter((b) => b.start.getTime() >= weekStart.getTime() && b.start.getTime() < horizon);
  const fixed = inHorizon.filter((b) => b.start < now || b.locked || b.missed);
  // Histórico de dias anteriores (até 14 dias) é preservado.
  const history = current.filter((b) => b.start.getTime() < weekStart.getTime() && b.start.getTime() >= weekStart.getTime() - 14 * DAY_MS);
  // Perdidos de hoje em diante (do início do dia) pedem reposição.
  const carryOver: Record<string, number> = {};
  for (const b of inHorizon) if (b.missed) carryOver[b.subjectId] = (carryOver[b.subjectId] ?? 0) + 1;
  const result = generateWeeklyPlan({ weekStart, profile, subjects, deadlines, windows, locked: fixed, from: now, carryOver });
  await store.savePlan([...history, ...result.blocks]);
  await notifier?.schedule(result.blocks.filter((b) => b.start >= now && !b.missed));
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
