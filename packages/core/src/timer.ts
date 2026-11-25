import type { Profile } from '@estuda/engine';

export type TimerPhase = 'focus' | 'break';

/**
 * Estado puro do timer (Pomodoro e variações). Baseado em timestamps,
 * então continua correto se o app ficar em segundo plano ou for recarregado.
 */
export interface TimerState {
  phase: TimerPhase;
  /** ms epoch do início da fase atual. */
  phaseStart: number;
  /** Foco concluído em fases anteriores (ms). */
  focusMs: number;
  /** Ciclos de foco concluídos. */
  cycle: number;
  focusLen: number;
  breakLen: number;
  longBreakLen: number;
}

const MIN = 60_000;
/** Pausa longa a cada N ciclos de foco. */
export const CYCLES_PER_LONG_BREAK = 4;

export function startTimer(profile: Pick<Profile, 'focusMin' | 'breakMin'>, now: number): TimerState {
  return {
    phase: 'focus',
    phaseStart: now,
    focusMs: 0,
    cycle: 0,
    focusLen: profile.focusMin * MIN,
    breakLen: profile.breakMin * MIN,
    longBreakLen: profile.breakMin * 3 * MIN,
  };
}

export function phaseLengthMs(s: TimerState): number {
  if (s.phase === 'focus') return s.focusLen;
  return s.cycle % CYCLES_PER_LONG_BREAK === 0 ? s.longBreakLen : s.breakLen;
}

export function remainingMs(s: TimerState, now: number): number {
  return Math.max(0, phaseLengthMs(s) - (now - s.phaseStart));
}

export function isPhaseOver(s: TimerState, now: number): boolean {
  return remainingMs(s, now) === 0;
}

/** Avança para a próxima fase; a fase concluída conta o tempo cheio de foco. */
export function nextPhase(s: TimerState, now: number): TimerState {
  if (s.phase === 'focus') {
    return { ...s, phase: 'break', phaseStart: now, focusMs: s.focusMs + s.focusLen, cycle: s.cycle + 1 };
  }
  return { ...s, phase: 'focus', phaseStart: now };
}

/** Avança fases já vencidas (ex.: app voltou do segundo plano). Limite de segurança de 100 voltas. */
export function catchUp(s: TimerState, now: number): TimerState {
  let cur = s;
  for (let i = 0; i < 100 && isPhaseOver(cur, now); i++) {
    cur = nextPhase(cur, cur.phaseStart + phaseLengthMs(cur));
  }
  return cur;
}

/** Total de foco em ms, incluindo a fração da fase de foco em andamento. */
export function totalFocusMs(s: TimerState, now: number): number {
  if (s.phase !== 'focus') return s.focusMs;
  return s.focusMs + Math.min(Math.max(0, now - s.phaseStart), s.focusLen);
}
