import type { Project, Subject } from '@estuda/engine';

/** Nome exibível de uma "disciplina" do plano: disciplina real ou projeto (`project:<id>`). */
export function displayName(id: string, subjects: Subject[], projects: Project[]): string {
  const s = subjects.find((x) => x.id === id);
  if (s) return s.name;
  if (id.startsWith('project:')) return projects.find((p) => `project:${p.id}` === id)?.title ?? 'Projeto';
  return id;
}

const PALETTE = ['#6366f1', '#14b8a6', '#f59e0b', '#ec4899', '#22c55e', '#0ea5e9', '#f97316', '#a855f7'];

/** Cor estável por disciplina/projeto (mesma cor em todas as telas). */
export function subjectColor(id: string): string {
  if (id.startsWith('project:')) return '#8b5cf6';
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length]!;
}
