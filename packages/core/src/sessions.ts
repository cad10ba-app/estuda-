import type { PlanBlock } from '@estuda/engine';
import type { Deps, StudySession } from './ports';
import { startOfDayUTC } from './usecases';
import { totalFocusMs, type TimerState } from './timer';

const DAY_MS = 86_400_000;

/** Encerra o timer e registra a sessão (REQ-010). Não registra se < 1 min de foco. */
export async function finishSession(
  deps: Deps,
  input: { timer: TimerState; subjectId: string; blockStart?: Date; startedAt: Date; plannedMin: number },
): Promise<StudySession | null> {
  const now = deps.clock.now();
  const actualMin = Math.round(totalFocusMs(input.timer, now.getTime()) / 60_000);
  if (actualMin < 1) return null;
  const session: StudySession = {
    id: `${input.startedAt.getTime()}-${input.subjectId}`,
    subjectId: input.subjectId,
    blockStart: input.blockStart,
    startedAt: input.startedAt,
    endedAt: now,
    plannedMin: input.plannedMin,
    actualMin,
    cycles: input.timer.cycle,
  };
  await deps.store.saveSession(session);
  return session;
}

/** Minutos realizados por bloco planejado (chave = ISO do início do bloco). */
export function doneByBlock(sessions: StudySession[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of sessions) {
    if (!s.blockStart) continue;
    const k = s.blockStart.toISOString();
    out.set(k, (out.get(k) ?? 0) + s.actualMin);
  }
  return out;
}

export function isBlockDone(block: PlanBlock, done: Map<string, number>): boolean {
  return (done.get(block.start.toISOString()) ?? 0) >= block.durationMin * 0.8;
}

/** Resumo do dia: planejado vs realizado (minutos). */
export async function daySummary(deps: Deps, day: Date = deps.clock.now()) {
  const from = startOfDayUTC(day).getTime();
  const [plan, sessions] = await Promise.all([deps.store.listPlan(), deps.store.listSessions()]);
  const inDay = (t: number) => t >= from && t < from + DAY_MS;
  return {
    plannedMin: plan.filter((b) => inDay(b.start.getTime())).reduce((a, b) => a + b.durationMin, 0),
    actualMin: sessions.filter((s) => inDay(s.startedAt.getTime())).reduce((a, s) => a + s.actualMin, 0),
  };
}
