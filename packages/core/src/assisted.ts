import {
  TECHNIQUE_BY_ID, buildSteps, compatibleTechniques, outcomeOf, recommend, type OutcomeRecord,
  type Level, type PlanBlock, type Recommendation, type RecommendationContext, type SessionStep, type TaskKind, type TechniqueId, type Topic,
} from '@estuda/engine';
import type { ChoiceMode, Deps, Task } from './ports';
import { nextTask } from './content';

/** Tipo de tarefa padrão por tipo de bloco, quando não há tarefa cadastrada. */
export function defaultTaskKind(blockType: PlanBlock['type'] | undefined, mode: Level): TaskKind {
  if (blockType === 'escrita') return 'escrever';
  if (blockType === 'simulado') return 'prova';
  if (blockType === 'revisao') return 'memorizar';
  return mode === 'superior' || mode === 'pos' ? 'ler' : 'memorizar';
}

const MASTERY: Record<Topic['status'], number> = { nao_visto: 1, estudando: 3, dominado: 5 };

export interface SessionTarget {
  subjectId: string;
  topicId?: string;
  taskId?: string;
  blockStart?: Date;
  blockType?: PlanBlock['type'];
  /** Minutos disponíveis; padrão = duração do bloco ou foco do perfil. */
  availableMin?: number;
}

export interface PreparedSession {
  target: SessionTarget;
  task?: Task;
  topic?: Topic;
  taskKind: TaskKind;
  context: RecommendationContext;
  recommendation: Recommendation;
  /** Técnicas possíveis para "Trocar técnica". */
  alternatives: TechniqueId[];
  /** Técnica e etapas atualmente escolhidas pelo estudante. */
  chosen: { technique: TechniqueId; steps: SessionStep[]; choice: ChoiceMode };
}

/** Monta a recomendação para uma sessão (doc 12 §5.4/§6). */
export async function prepareSession(deps: Deps, target: SessionTarget & { blockDurationMin?: number }): Promise<PreparedSession> {
  const profile = await deps.store.getProfile();
  if (!profile) throw new Error('Perfil não configurado.');
  const [subjects, topics, sessions] = await Promise.all([deps.store.listSubjects(), deps.store.listTopics(), deps.store.listSessions()]);
  const subject = subjects.find((s) => s.id === target.subjectId);
  const topic = topics.find((t) => t.id === target.topicId);
  const task = target.taskId
    ? (await deps.store.listTasks()).find((t) => t.id === target.taskId)
    : await nextTask(deps, { topicId: target.topicId, subjectId: target.subjectId });
  const taskKind = task?.kind ?? defaultTaskKind(target.blockType, profile.level);
  const recent = sessions.sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime()).slice(-3).map((s) => s.techniqueId).filter((t): t is TechniqueId => !!t);
  const context: RecommendationContext = {
    mode: profile.level, taskKind, autonomy: profile.autonomy,
    difficulty: subject?.difficulty, mastery: topic ? MASTERY[topic.status] : undefined,
    availableMin: target.availableMin ?? target.blockDurationMin ?? profile.focusMin * 2,
    recentTechniques: recent,
    history: sessions.flatMap((s): OutcomeRecord[] => (s.techniqueId && s.assessment ? [{ technique: s.techniqueId, taskKind: s.taskKind, outcome: outcomeOf(s.assessment), at: s.startedAt.getTime() }] : [])),
  };
  const recommendation = recommend(context);
  return {
    target: { ...target, taskId: task?.id }, task, topic, taskKind, context, recommendation,
    alternatives: compatibleTechniques(context),
    chosen: { technique: recommendation.primary, steps: recommendation.steps, choice: 'recomendada' },
  };
}

/** Trocar técnica: mantém a duração total e regenera as etapas. */
export function swapTechnique(p: PreparedSession, technique: TechniqueId): PreparedSession {
  const total = p.chosen.steps.reduce((a, s) => a + s.minutes, 0);
  const same = technique === p.recommendation.primary;
  return {
    ...p,
    chosen: {
      technique,
      steps: same ? p.recommendation.steps : buildSteps(technique, total || p.recommendation.durationMin, undefined),
      choice: same ? 'recomendada' : 'trocada',
    },
  };
}

/** Personalizar: ajusta a duração das etapas (mínimo 1 min) e/ou remove etapas. */
export function customizeSteps(p: PreparedSession, steps: SessionStep[]): PreparedSession {
  if (steps.length === 0) throw new Error('A sessão precisa de ao menos uma etapa.');
  if (steps.some((s) => !(s.minutes >= 1))) throw new Error('Cada etapa precisa ter ao menos 1 minuto.');
  return { ...p, chosen: { ...p.chosen, steps, choice: 'personalizada' } };
}

export const techniqueName = (id: TechniqueId) => TECHNIQUE_BY_ID[id].name;
