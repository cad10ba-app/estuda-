import { DEFAULT_PROFILES, type Autonomy, type AvailabilityWindow, type Level, type Subject } from '@estuda/engine';
import type { Deps, GoalType } from './ports';
import { planWeek } from './usecases';
import { addGoal, attachSubjectToGoal } from './content';

export const LEVEL_LABEL: Record<Level, string> = {
  fund2: 'Ensino Fundamental (anos finais)',
  medio: 'Ensino Médio',
  superior: 'Ensino Superior',
  pos: 'Pesquisa (TCC, especialização, mestrado, doutorado)',
  livre: 'Objetivo livre (concursos, idiomas, certificações)',
};

/** Disciplinas sugeridas por nível (ponto de partida editável). */
export const SUGGESTED_SUBJECTS: Record<Level, string[]> = {
  fund2: ['Matemática', 'Português', 'Ciências', 'História', 'Geografia', 'Inglês'],
  medio: ['Matemática', 'Português', 'Redação', 'Física', 'Química', 'Biologia', 'História', 'Geografia'],
  superior: [],
  pos: [],
  livre: [],
};

export type Period = 'manha' | 'tarde' | 'noite';
export const PERIODS: Record<Period, { label: string; startMin: number; endMin: number }> = {
  manha: { label: 'Manhã (8h–11h)', startMin: 8 * 60, endMin: 11 * 60 },
  tarde: { label: 'Tarde (14h–17h)', startMin: 14 * 60, endMin: 17 * 60 },
  noite: { label: 'Noite (19h–22h)', startMin: 19 * 60, endMin: 22 * 60 },
};

/** Janelas semanais a partir de dias (0=domingo) e períodos escolhidos. */
export function buildWindows(weekdays: number[], periods: Period[]): AvailabilityWindow[] {
  return weekdays.flatMap((weekday) =>
    periods.map((p) => ({ weekday, startMin: PERIODS[p].startMin, endMin: PERIODS[p].endMin })),
  );
}

export const DEFAULT_AUTONOMY: Record<Level, Autonomy> = { fund2: 'guiada', medio: 'media', superior: 'alta', pos: 'alta', livre: 'media' };

export interface OnboardingInput {
  level: Level;
  autonomy?: Autonomy;
  /** Objetivo principal (opcional: dá para começar com poucos dados). */
  goal?: { type: GoalType; title: string; deadline?: string };
  subjectNames: string[];
  weekdays: number[];
  periods: Period[];
}

export function slugId(name: string, taken: Set<string>): string {
  const base = name.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'disciplina';
  let id = base;
  for (let i = 2; taken.has(id); i++) id = `${base}-${i}`;
  taken.add(id);
  return id;
}

/** Conclui o onboarding: perfil do nível, disciplinas, disponibilidade e 1º plano. */
export async function completeOnboarding(deps: Deps, input: OnboardingInput) {
  const names = [...new Set(input.subjectNames.map((n) => n.trim()).filter(Boolean))];
  if (names.length === 0) throw new Error('Informe ao menos uma disciplina.');
  if (input.weekdays.length === 0 || input.periods.length === 0) {
    throw new Error('Informe ao menos um dia e um período de estudo.');
  }
  await deps.store.saveProfile({ ...DEFAULT_PROFILES[input.level], autonomy: input.autonomy ?? DEFAULT_AUTONOMY[input.level] });
  const taken = new Set<string>();
  for (const name of names) {
    const subject: Subject = { id: slugId(name, taken), name, weight: 3, difficulty: 3 };
    await deps.store.saveSubject(subject);
  }
  await deps.store.saveWindows(buildWindows(input.weekdays, input.periods));
  if (input.goal && input.goal.title.trim()) {
    const goal = await addGoal(deps, input.goal);
    for (const sub of await deps.store.listSubjects()) await attachSubjectToGoal(deps, sub.id, goal.id);
  }
  return planWeek(deps);
}
