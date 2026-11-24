import type { Project, Subject } from '@estuda/engine';

/** Nome exibível de uma "disciplina" do plano: disciplina real ou projeto (`project:<id>`). */
export function displayName(id: string, subjects: Subject[], projects: Project[]): string {
  const s = subjects.find((x) => x.id === id);
  if (s) return s.name;
  if (id.startsWith('project:')) return projects.find((p) => `project:${p.id}` === id)?.title ?? 'Projeto';
  return id;
}
