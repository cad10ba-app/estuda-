export type ReviewGrade = 'errou' | 'dificil' | 'bom' | 'facil';

export interface CardState {
  intervalDays: number;
  ease: number;
  repetitions: number;
}

export const NEW_CARD: CardState = { intervalDays: 0, ease: 2.5, repetitions: 0 };

const QUALITY: Record<ReviewGrade, number> = { errou: 1, dificil: 3, bom: 4, facil: 5 };

/** SM-2 clássico. Retorna novo estado e dias até a próxima revisão. */
export function reviewCard(state: CardState, grade: ReviewGrade): CardState {
  const q = QUALITY[grade];
  const ease = Math.max(1.3, state.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));
  if (q < 3 || grade === 'errou') {
    return { intervalDays: 1, ease, repetitions: 0 };
  }
  const repetitions = state.repetitions + 1;
  let intervalDays: number;
  if (repetitions === 1) intervalDays = 1;
  else if (repetitions === 2) intervalDays = 6;
  else intervalDays = Math.round(state.intervalDays * ease);
  return { intervalDays, ease, repetitions };
}
