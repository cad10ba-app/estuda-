import type { TaskKind, Topic } from '@estuda/engine';
import type { Deps, Goal, GoalType, Task } from './ports';
import { planWeek, startOfDayUTC } from './usecases';

const uid = (deps: Deps) => `${deps.clock.now().getTime()}-${Math.random().toString(36).slice(2, 7)}`;

export const GOAL_LABEL: Record<GoalType, string> = {
  rotina: 'Estudar regularmente', prova: 'Preparar prova', concurso: 'Concurso', idioma: 'Idioma',
  disciplina: 'Disciplina específica', projeto: 'TCC, dissertação ou tese', outro: 'Outro objetivo',
};

/** Objetivo → Disciplina → Unidade → Tópico → Tarefa (doc 12 §5.2). */
export async function addGoal(deps: Deps, input: { type: GoalType; title: string; deadline?: string }): Promise<Goal> {
  const title = input.title.trim();
  if (!title) throw new Error('Dê um nome ao objetivo.');
  let deadline: Date | undefined;
  if (input.deadline) {
    deadline = new Date(`${input.deadline}T00:00:00Z`);
    if (Number.isNaN(deadline.getTime())) throw new Error('Data inválida.');
  }
  const goal: Goal = { id: uid(deps), type: input.type, title, deadline };
  await deps.store.saveGoal(goal);
  return goal;
}

export async function removeGoal(deps: Deps, id: string) {
  await deps.store.deleteGoal(id);
  for (const s of await deps.store.listSubjects()) {
    if (s.goalId === id) await deps.store.saveSubject({ ...s, goalId: undefined });
  }
}

/** Associa a disciplina a um objetivo e, se o objetivo tem prazo, cria o prazo da disciplina (prova/entrega). */
export async function attachSubjectToGoal(deps: Deps, subjectId: string, goalId: string | undefined) {
  const subject = (await deps.store.listSubjects()).find((s) => s.id === subjectId);
  if (!subject) throw new Error('Disciplina não encontrada.');
  await deps.store.saveSubject({ ...subject, goalId });
  const goal = goalId ? (await deps.store.listGoals()).find((g) => g.id === goalId) : undefined;
  if (goal?.deadline) {
    await deps.store.saveDeadline({ id: `goal-${goal.id}-${subjectId}`, subjectId, date: goal.deadline, kind: goal.type === 'prova' || goal.type === 'concurso' ? 'prova' : 'entrega' });
  }
  await planWeek(deps);
}

/** Unidade: agrupa tópicos de uma disciplina. Não entra diretamente no plano. */
export async function addUnit(deps: Deps, input: { subjectId: string; title: string }): Promise<Topic> {
  const title = input.title.trim();
  if (!title) throw new Error('Título da unidade é obrigatório.');
  const mine = (await deps.store.listTopics()).filter((t) => t.subjectId === input.subjectId);
  const unit: Topic = {
    id: uid(deps), subjectId: input.subjectId, title, kind: 'unidade',
    order: mine.reduce((m, t) => Math.max(m, t.order), 0) + 1, status: 'nao_visto',
  };
  await deps.store.saveTopic(unit);
  return unit;
}

/** Move um tópico para uma unidade (ou para fora de qualquer unidade). */
export async function moveTopicToUnit(deps: Deps, topicId: string, unitId: string | undefined) {
  const topics = await deps.store.listTopics();
  const t = topics.find((x) => x.id === topicId);
  if (!t || t.kind === 'unidade') throw new Error('Tópico não encontrado.');
  if (unitId && !topics.some((x) => x.id === unitId && x.kind === 'unidade' && x.subjectId === t.subjectId)) throw new Error('Unidade inválida.');
  await deps.store.saveTopic({ ...t, parentId: unitId });
}

/** Remove a unidade; seus tópicos ficam soltos na disciplina. */
export async function removeUnit(deps: Deps, unitId: string) {
  for (const t of await deps.store.listTopics()) if (t.parentId === unitId) await deps.store.saveTopic({ ...t, parentId: undefined });
  await deps.store.deleteTopic(unitId);
}

export async function addTask(
  deps: Deps,
  input: { subjectId?: string; topicId?: string; milestoneId?: string; title: string; kind?: TaskKind; estimatedMin?: number },
): Promise<Task> {
  const title = input.title.trim();
  if (!title) throw new Error('Descreva a tarefa.');
  if (!input.subjectId && !input.topicId && !input.milestoneId) throw new Error('A tarefa precisa estar ligada a uma disciplina, tópico ou etapa.');
  const task: Task = {
    id: uid(deps), subjectId: input.subjectId, topicId: input.topicId, milestoneId: input.milestoneId,
    title, kind: input.kind ?? 'geral', estimatedMin: Math.max(5, Math.round(input.estimatedMin ?? 30)), done: false,
  };
  await deps.store.saveTask(task);
  return task;
}

export async function setTaskDone(deps: Deps, id: string, done: boolean) {
  const t = (await deps.store.listTasks()).find((x) => x.id === id);
  if (!t) throw new Error('Tarefa não encontrada.');
  await deps.store.saveTask({ ...t, done });
}

export async function removeTask(deps: Deps, id: string) {
  await deps.store.deleteTask(id);
}

/** Próxima tarefa pendente de um tópico (ou da disciplina, se não houver do tópico). */
export async function nextTask(deps: Deps, ref: { topicId?: string; subjectId?: string }): Promise<Task | undefined> {
  const tasks = (await deps.store.listTasks()).filter((t) => !t.done);
  return tasks.find((t) => ref.topicId && t.topicId === ref.topicId) ?? tasks.find((t) => !t.topicId && ref.subjectId && t.subjectId === ref.subjectId);
}

export { startOfDayUTC };
