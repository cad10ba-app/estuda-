/**
 * FSRS-4.5 (Free Spaced Repetition Scheduler) com os parâmetros padrão.
 * Fórmulas e pesos conferidos na documentação oficial do projeto
 * (open-spaced-repetition/awesome-fsrs, wiki "The Algorithm", seção FSRS-4.5).
 * Versões mais novas (FSRS-5/6) existem; atualizar exige conferir os pesos e a migração.
 */
export const FSRS_WEIGHTS = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755] as const;

const DECAY = -0.5;
const FACTOR = 19 / 81;
const w = FSRS_WEIGHTS;

/** 1 = errou, 2 = difícil, 3 = bom, 4 = fácil. */
export type FsrsGrade = 1 | 2 | 3 | 4;

export interface FsrsState {
  /** Estabilidade: dias até a lembrança cair a 90%. */
  stability: number;
  /** Dificuldade 1–10. */
  difficulty: number;
  /** Instante (ms) da última revisão. */
  lastReview: number;
  reps: number;
  lapses: number;
}

const DAY_MS = 86_400_000;
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const clampD = (d: number) => clamp(d, 1, 10);
const MIN_S = 0.01;

/** Probabilidade de lembrar após `elapsedDays` dado a estabilidade. */
export function retrievability(elapsedDays: number, stability: number): number {
  return Math.pow(1 + (FACTOR * Math.max(0, elapsedDays)) / stability, DECAY);
}

/** Intervalo (dias, fracionário) para atingir a retenção desejada. */
export function intervalFor(stability: number, desiredRetention = 0.9): number {
  return (stability / FACTOR) * (Math.pow(desiredRetention, 1 / DECAY) - 1);
}

const initialStability = (g: FsrsGrade) => Math.max(MIN_S, w[g - 1]!);
const initialDifficulty = (g: FsrsGrade) => clampD(w[4]! - (g - 3) * w[5]!);

/** Primeira revisão de um cartão novo. */
export function firstReview(grade: FsrsGrade, now: number): FsrsState {
  return { stability: initialStability(grade), difficulty: initialDifficulty(grade), lastReview: now, reps: 1, lapses: grade === 1 ? 1 : 0 };
}

/** Revisão de um cartão já conhecido. */
export function reviewFsrs(s: FsrsState, grade: FsrsGrade, now: number): FsrsState {
  const elapsed = Math.max(0, (now - s.lastReview) / DAY_MS);
  const r = retrievability(elapsed, s.stability);
  const d1 = s.difficulty - w[6]! * (grade - 3);
  const difficulty = clampD(w[7]! * initialDifficulty(3) + (1 - w[7]!) * d1);
  let stability: number;
  if (grade === 1) {
    stability = w[11]! * Math.pow(s.difficulty, -w[12]!) * (Math.pow(s.stability + 1, w[13]!) - 1) * Math.exp(w[14]! * (1 - r));
  } else {
    const hard = grade === 2 ? w[15]! : 1;
    const easy = grade === 4 ? w[16]! : 1;
    stability = s.stability * (Math.exp(w[8]!) * (11 - s.difficulty) * Math.pow(s.stability, -w[9]!) * (Math.exp(w[10]! * (1 - r)) - 1) * hard * easy + 1);
  }
  return { stability: Math.max(MIN_S, stability), difficulty, lastReview: now, reps: s.reps + 1, lapses: s.lapses + (grade === 1 ? 1 : 0) };
}

/** Converte o estado antigo (SM-2) em um estado FSRS aproximado, para não perder o histórico. */
export function fromLegacy(intervalDays: number, repetitions: number, lastReview: number): FsrsState {
  return { stability: Math.max(0.5, intervalDays), difficulty: 5, lastReview, reps: Math.max(1, repetitions), lapses: 0 };
}

/** Dias inteiros até a próxima revisão (mínimo 1). */
export function nextIntervalDays(stability: number, desiredRetention = 0.9): number {
  return Math.max(1, Math.round(intervalFor(stability, desiredRetention)));
}
