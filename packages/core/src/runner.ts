import type { SessionStep, TechniqueId } from '@estuda/engine';
import type { Assessment, ChoiceMode, Deps, StudySession } from './ports';
import type { PreparedSession } from './assisted';
import { buildSteps } from '@estuda/engine';
import { markStudied } from './topics';
import { setTaskDone } from './content';

const MIN = 60_000;

/**
 * Estado puro da execução (doc 12 §5.6). Baseado em timestamps, resiste a
 * segundo plano e recarga. `elapsed[i]` = tempo já gasto na etapa i (ms).
 */
export interface SessionRun {
  subjectId: string;
  topicId?: string;
  taskId?: string;
  blockStart?: number;
  technique: TechniqueId;
  recommended: TechniqueId;
  choice: ChoiceMode;
  steps: SessionStep[];
  index: number;
  elapsed: number[];
  /** Início do trecho em andamento da etapa atual (ms); undefined se pausado. */
  runningSince?: number;
  startedAt: number;
}

export function startRun(p: PreparedSession, now: number): SessionRun {
  return {
    subjectId: p.target.subjectId, topicId: p.target.topicId, taskId: p.target.taskId,
    blockStart: p.target.blockStart?.getTime(),
    technique: p.chosen.technique, recommended: p.recommendation.primary, choice: p.chosen.choice,
    steps: p.chosen.steps, index: 0, elapsed: p.chosen.steps.map(() => 0), runningSince: now, startedAt: now,
  };
}

export const isPaused = (r: SessionRun) => r.runningSince === undefined;
export const plannedMin = (r: SessionRun) => r.steps.reduce((a, s) => a + s.minutes, 0);

/** Tempo gasto na etapa i até `now`. */
export function spentMs(r: SessionRun, i: number, now: number): number {
  const base = r.elapsed[i] ?? 0;
  return i === r.index && r.runningSince !== undefined ? base + Math.max(0, now - r.runningSince) : base;
}

export function stepRemainingMs(r: SessionRun, now: number): number {
  const step = r.steps[r.index];
  return step ? Math.max(0, step.minutes * MIN - spentMs(r, r.index, now)) : 0;
}

export const stepDue = (r: SessionRun, now: number) => stepRemainingMs(r, now) === 0;
export const isLastStep = (r: SessionRun) => r.index >= r.steps.length - 1;

export function pause(r: SessionRun, now: number): SessionRun {
  if (isPaused(r)) return r;
  const elapsed = [...r.elapsed];
  elapsed[r.index] = spentMs(r, r.index, now);
  return { ...r, elapsed, runningSince: undefined };
}

export function resume(r: SessionRun, now: number): SessionRun {
  return isPaused(r) ? { ...r, runningSince: now } : r;
}

/** Avança para a próxima etapa (se houver). Mantém o estado de pausa. */
export function nextStep(r: SessionRun, now: number): SessionRun {
  if (isLastStep(r)) return r;
  const elapsed = [...r.elapsed];
  elapsed[r.index] = spentMs(r, r.index, now);
  return { ...r, elapsed, index: r.index + 1, runningSince: isPaused(r) ? undefined : now };
}

/** Trocar a técnica no meio: substitui as etapas restantes, mantendo o tempo restante planejado. */
export function swapTechniqueMidRun(r: SessionRun, technique: TechniqueId, now: number): SessionRun {
  const cur = pause(r, now);
  const doneSteps = cur.steps.slice(0, cur.index);
  const here = cur.steps[cur.index]!;
  const remainingPlanned = Math.max(1, Math.ceil(cur.steps.slice(cur.index).reduce((a, s) => a + s.minutes, 0) - (cur.elapsed[cur.index] ?? 0) / MIN));
  const fresh = buildSteps(technique, remainingPlanned);
  void here;
  return {
    ...cur, technique, choice: technique === cur.recommended ? cur.choice : 'trocada',
    steps: [...doneSteps, ...fresh], elapsed: [...cur.elapsed.slice(0, cur.index), ...fresh.map(() => 0)],
    runningSince: r.runningSince === undefined ? undefined : now,
  };
}

/** Minutos de foco efetivo (etapas que não são pausa), até `now`. */
export function focusMin(r: SessionRun, now: number): number {
  const ms = r.steps.reduce((a, s, i) => a + (s.kind === 'pausa' ? 0 : spentMs(r, i, now)), 0);
  return Math.round(ms / MIN);
}

export interface FollowUp {
  kind: 'revisao_programada' | 'pratica_adicional' | 'sessao_curta';
  text: string;
}

export interface FinishResult {
  session: StudySession | null;
  followUps: FollowUp[];
}

/** Resultado baixo: confiança ≤ 2 ou menos de 60% de acertos. */
export function isLowResult(a: Assessment): boolean {
  const score = a.total && a.total > 0 && a.correct !== undefined ? a.correct / a.total : undefined;
  return a.confidence <= 2 || (score !== undefined && score < 0.6);
}

/**
 * Encerra a sessão: registra tempo real, técnica escolhida (e se foi recomendada, trocada
 * ou personalizada) e a avaliação; programa revisão e sugere próximos passos (doc 12 §7).
 */
export async function finishRun(deps: Deps, run: SessionRun, assessment?: Assessment): Promise<FinishResult> {
  const nowDate = deps.clock.now();
  const now = nowDate.getTime();
  const actualMin = focusMin(run, now);
  const followUps: FollowUp[] = [];
  if (actualMin < 1) return { session: null, followUps };

  const planned = plannedMin(run);
  const session: StudySession = {
    id: `${run.startedAt}-${run.subjectId}`,
    subjectId: run.subjectId, topicId: run.topicId, taskId: run.taskId,
    blockStart: run.blockStart !== undefined ? new Date(run.blockStart) : undefined,
    startedAt: new Date(run.startedAt), endedAt: nowDate,
    plannedMin: planned, actualMin, cycles: run.steps.filter((s) => s.kind === 'foco').length,
    techniqueId: run.technique, recommendedTechniqueId: run.recommended, choice: run.choice, assessment,
  };
  await deps.store.saveSession(session);

  const enough = actualMin >= planned * 0.5;
  if (run.topicId && enough) {
    await markStudied(deps, run.topicId);
    followUps.push({ kind: 'revisao_programada', text: 'Revisões programadas para amanhã, em 7 e em 30 dias.' });
  }
  if (run.taskId && enough) await setTaskDone(deps, run.taskId, true);
  if (assessment && isLowResult(assessment)) {
    followUps.push({ kind: 'pratica_adicional', text: 'O resultado ficou abaixo do esperado. Vale uma prática adicional ou uma revisão curta em breve.' });
  }
  if (!enough) followUps.push({ kind: 'sessao_curta', text: 'Sessão mais curta que o planejado. Tudo bem: você pode retomar quando quiser.' });
  return { session, followUps };
}
