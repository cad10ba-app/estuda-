import type { Deadline, DeadlineKind, Subject } from '@estuda/engine';
import type { Deps } from './ports';
import { slugId } from './onboarding';
import { planWeek } from './usecases';

const clamp15 = (n: number) => Math.min(5, Math.max(1, Math.round(n)));

/** REQ-002: cadastra disciplina e replaneja. */
export async function addSubject(deps: Deps, input: { name: string; weight: number; difficulty: number }) {
  const name = input.name.trim();
  if (!name) throw new Error('Nome da disciplina é obrigatório.');
  const existing = await deps.store.listSubjects();
  const id = slugId(name, new Set(existing.map((s) => s.id)));
  const subject: Subject = { id, name, weight: clamp15(input.weight), difficulty: clamp15(input.difficulty) };
  await deps.store.saveSubject(subject);
  await planWeek(deps);
  return subject;
}

export async function updateSubject(deps: Deps, subject: Subject) {
  await deps.store.saveSubject({ ...subject, weight: clamp15(subject.weight), difficulty: clamp15(subject.difficulty) });
  await planWeek(deps);
}

/** Remove a disciplina e seus prazos; replaneja. */
export async function removeSubject(deps: Deps, id: string) {
  for (const d of await deps.store.listDeadlines()) {
    if (d.subjectId === id) await deps.store.deleteDeadline(d.id);
  }
  await deps.store.deleteSubject(id);
  await planWeek(deps);
}

/** REQ-004: cadastra prazo (data local YYYY-MM-DD → UTC 00:00) e replaneja. */
export async function addDeadline(deps: Deps, input: { subjectId: string; kind: DeadlineKind; date: string }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) throw new Error('Data inválida.');
  const date = new Date(`${input.date}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) throw new Error('Data inválida.');
  const id = `${input.subjectId}-${input.kind}-${input.date}`;
  const deadline: Deadline = { id, subjectId: input.subjectId, kind: input.kind, date };
  await deps.store.saveDeadline(deadline);
  await planWeek(deps);
  return deadline;
}

export async function removeDeadline(deps: Deps, id: string) {
  await deps.store.deleteDeadline(id);
  await planWeek(deps);
}
