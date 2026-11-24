import type { Level, Profile } from './types';

/** Defaults por nível (docs/02-perfis-por-idade-e-nivel.md). */
export const DEFAULT_PROFILES: Record<Level, Profile> = {
  fund2: { level: 'fund2', focusMin: 20, breakMin: 5, dailyLoadMin: 90, reviewCap: 15 },
  medio: { level: 'medio', focusMin: 25, breakMin: 5, dailyLoadMin: 180, reviewCap: 40 },
  superior: { level: 'superior', focusMin: 50, breakMin: 10, dailyLoadMin: 180, reviewCap: 50 },
  pos: { level: 'pos', focusMin: 90, breakMin: 15, dailyLoadMin: 300, reviewCap: 40 },
};
