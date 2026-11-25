import type { Deps } from './ports';

export const EXPORT_VERSION = 1;

/**
 * REQ-032 (LGPD): exporta todos os dados do usuário em JSON portável.
 * Datas viram strings ISO-8601 (via JSON.stringify).
 */
export async function exportData(deps: Deps) {
  const s = deps.store;
  const [profile, subjects, deadlines, windows, plan, sessions, cards, topics, topicReviews, projects, milestones, writingLogs, references, goals, tasks] =
    await Promise.all([
      s.getProfile(), s.listSubjects(), s.listDeadlines(), s.listWindows(), s.listPlan(), s.listSessions(), s.listCards(),
      s.listTopics(), s.listTopicReviews(), s.listProjects(), s.listMilestones(), s.listWritingLogs(), s.listReferences(), s.listGoals(), s.listTasks(),
    ]);
  return {
    app: 'estuda',
    version: EXPORT_VERSION,
    exportedAt: deps.clock.now().toISOString(),
    data: { profile, subjects, deadlines, windows, plan, sessions, cards, topics, topicReviews, projects, milestones, writingLogs, references, goals, tasks },
  };
}

export async function exportDataJSON(deps: Deps): Promise<string> {
  return JSON.stringify(await exportData(deps), null, 2);
}

/** Frase que o usuário precisa digitar para confirmar a exclusão. */
export const DELETE_CONFIRMATION = 'EXCLUIR';

/** REQ-032: exclui todos os dados locais. Exige a frase de confirmação exata. */
export async function deleteAllData(deps: Deps, confirmation: string): Promise<void> {
  if (confirmation.trim() !== DELETE_CONFIRMATION) throw new Error(`Digite ${DELETE_CONFIRMATION} para confirmar.`);
  await deps.store.clearAll();
}
