import { topicReviewDates, type Topic, type TopicStatus } from '@estuda/engine';
import type { Deps, TopicReview } from './ports';
import { planWeek } from './usecases';

/** REQ-003: cria tópico no fim da lista da disciplina e replaneja. */
export async function addTopic(deps: Deps, input: { subjectId: string; title: string }): Promise<Topic> {
  const title = input.title.trim();
  if (!title) throw new Error('Título do tópico é obrigatório.');
  const all = await deps.store.listTopics();
  const mine = all.filter((t) => t.subjectId === input.subjectId);
  const topic: Topic = {
    id: `${deps.clock.now().getTime()}-${Math.random().toString(36).slice(2, 7)}`,
    subjectId: input.subjectId,
    title,
    order: mine.reduce((m, t) => Math.max(m, t.order), 0) + 1,
    status: 'nao_visto',
  };
  await deps.store.saveTopic(topic);
  await planWeek(deps);
  return topic;
}

export async function removeTopic(deps: Deps, id: string) {
  await deps.store.deleteTopic(id);
  await planWeek(deps);
}

export async function setTopicStatus(deps: Deps, id: string, status: TopicStatus) {
  const t = (await deps.store.listTopics()).find((x) => x.id === id);
  if (!t) throw new Error('Tópico não encontrado.');
  await deps.store.saveTopic({ ...t, status });
  await planWeek(deps);
}

/**
 * REQ-014: marca o tópico como estudado e agenda revisões em D+1, D+7 e D+30.
 * Idempotente: se já há revisões pendentes, não duplica.
 */
export async function markStudied(deps: Deps, topicId: string): Promise<TopicReview[]> {
  const topic = (await deps.store.listTopics()).find((t) => t.id === topicId);
  if (!topic) throw new Error('Tópico não encontrado.');
  if (topic.status === 'nao_visto') await deps.store.saveTopic({ ...topic, status: 'estudando' });
  const existing = (await deps.store.listTopicReviews()).filter((r) => r.topicId === topicId);
  if (existing.some((r) => !r.done)) return existing;
  const at = deps.clock.now();
  const created = topicReviewDates(at).map((due, i) => ({
    id: `${topicId}-${at.getTime()}-${i}`,
    topicId,
    due,
    done: false,
  }));
  for (const r of created) await deps.store.saveTopicReview(r);
  return created;
}

export interface DueTopicReview {
  review: TopicReview;
  topic: Topic;
}

/** Revisões de tópicos vencidas e ainda não feitas, mais atrasadas primeiro. */
export async function dueTopicReviews(deps: Deps): Promise<DueTopicReview[]> {
  const now = deps.clock.now().getTime();
  const [reviews, topics] = await Promise.all([deps.store.listTopicReviews(), deps.store.listTopics()]);
  return reviews
    .filter((r) => !r.done && r.due.getTime() <= now)
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .flatMap((review) => {
      const topic = topics.find((t) => t.id === review.topicId);
      return topic ? [{ review, topic }] : [];
    });
}

/** Conclui uma revisão; ao concluir todas as 3, o tópico vira "dominado". */
export async function completeTopicReview(deps: Deps, reviewId: string) {
  const reviews = await deps.store.listTopicReviews();
  const r = reviews.find((x) => x.id === reviewId);
  if (!r) throw new Error('Revisão não encontrada.');
  await deps.store.saveTopicReview({ ...r, done: true });
  const group = reviews.filter((x) => x.topicId === r.topicId);
  if (group.every((x) => x.id === r.id || x.done)) {
    const t = (await deps.store.listTopics()).find((x) => x.id === r.topicId);
    if (t) await deps.store.saveTopic({ ...t, status: 'dominado' });
    await planWeek(deps);
  }
}
