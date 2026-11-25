import { DEFAULT_PROFILES, type Accessibility, type Autonomy, type Level, type Profile } from '@estuda/engine';
import type { Deps } from './ports';
import { planWeek } from './usecases';

export const DEFAULT_ACCESSIBILITY: Accessibility = { fontScale: 1, highContrast: false, reduceMotion: false };

export async function getProfileOrThrow(deps: Deps): Promise<Profile> {
  const p = await deps.store.getProfile();
  if (!p) throw new Error('Perfil não configurado.');
  return p;
}

/** Troca o modo de uso: aplica os padrões do novo modo e preserva autonomia e acessibilidade. */
export async function changeMode(deps: Deps, level: Level) {
  const cur = await getProfileOrThrow(deps);
  await deps.store.saveProfile({ ...DEFAULT_PROFILES[level], autonomy: cur.autonomy, accessibility: cur.accessibility });
  return planWeek(deps);
}

export async function setAutonomy(deps: Deps, autonomy: Autonomy) {
  const cur = await getProfileOrThrow(deps);
  await deps.store.saveProfile({ ...cur, autonomy });
}

/** Preferência de duração do bloco de foco (10–120 min, múltiplos de 5). */
export async function setFocusMinutes(deps: Deps, minutes: number) {
  if (!(minutes >= 10 && minutes <= 120)) throw new Error('A duração deve ficar entre 10 e 120 minutos.');
  const cur = await getProfileOrThrow(deps);
  const focusMin = Math.round(minutes / 5) * 5;
  await deps.store.saveProfile({ ...cur, focusMin, dailyLoadMin: Math.max(cur.dailyLoadMin, focusMin * 2) });
  return planWeek(deps);
}

export async function setAccessibility(deps: Deps, patch: Partial<Accessibility>) {
  const cur = await getProfileOrThrow(deps);
  const a = { ...DEFAULT_ACCESSIBILITY, ...cur.accessibility, ...patch };
  if (![1, 1.15, 1.3].includes(a.fontScale)) throw new Error('Tamanho de fonte inválido.');
  await deps.store.saveProfile({ ...cur, accessibility: a });
  return a;
}

/** Define a data (YYYY-MM-DD, horário local) a partir da qual o plano é gerado. Vazio = hoje. */
export async function setPlanStart(deps: Deps, date: string | undefined) {
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Data inválida.');
  const cur = await getProfileOrThrow(deps);
  await deps.store.saveProfile({ ...cur, planStart: date || undefined });
  return planWeek(deps);
}
