import { describe, expect, it } from 'vitest';
import { generateWeeklyPlan, pickTopic, DEFAULT_PROFILES, type Topic } from '@estuda/engine';
import { MemoryStore, addTopic, completeTopicReview, completeOnboarding, dueTopicReviews, finishSession, markStudied, planWeek, removeTopic, setTopicStatus, startTimer, type Deps } from '../src';

const DAY = 86_400_000, MIN = 60_000;
const mk = () => {
  const clock = { t: Date.UTC(2026, 10, 24, 12) };
  const deps: Deps = { store: new MemoryStore(), clock: { now: () => new Date(clock.t) } };
  return { deps, clock };
};

describe('tópicos', () => {
  it('seleção de tópico: estudando antes de não visto; revisão só de vistos', () => {
    const ts: Topic[] = [
      { id: 'a', subjectId: 's', title: 'A', order: 1, status: 'nao_visto' },
      { id: 'b', subjectId: 's', title: 'B', order: 2, status: 'estudando' },
      { id: 'c', subjectId: 's', title: 'C', order: 3, status: 'dominado' },
    ];
    expect(pickTopic(ts, 'estudo', 0)?.id).toBe('b');
    expect(pickTopic(ts, 'estudo', 1)?.id).toBe('a');
    expect(['b', 'c']).toContain(pickTopic(ts, 'revisao', 0)?.id);
    expect(pickTopic(ts.slice(0, 1), 'revisao', 0)).toBeUndefined();
  });

  it('plano atribui tópicos aos blocos de estudo', async () => {
    const { deps } = mk();
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Matemática'], weekdays: [0, 1, 2, 3, 4, 5, 6], periods: ['noite'] });
    await addTopic(deps, { subjectId: 'matematica', title: 'Funções' });
    await addTopic(deps, { subjectId: 'matematica', title: 'Geometria' });
    const plan = await deps.store.listPlan();
    const futuros = plan.filter((b) => b.type === 'estudo');
    expect(futuros.length).toBeGreaterThan(0);
    expect(futuros.every((b) => b.topicId)).toBe(true);
    expect(new Set(futuros.map((b) => b.topicId)).size).toBe(2);
  });

  it('markStudied agenda D+1/7/30, é idempotente; vencidas aparecem; 3 feitas → dominado', async () => {
    const { deps, clock } = mk();
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Mat'], weekdays: [1], periods: ['noite'] });
    const t = await addTopic(deps, { subjectId: 'mat', title: 'T' });
    const first = await markStudied(deps, t.id);
    expect(first).toHaveLength(3);
    await markStudied(deps, t.id);
    expect(await deps.store.listTopicReviews()).toHaveLength(3);
    expect((await deps.store.listTopics())[0]!.status).toBe('estudando');
    expect(await dueTopicReviews(deps)).toHaveLength(0);
    clock.t += 31 * DAY;
    const due = await dueTopicReviews(deps);
    expect(due).toHaveLength(3);
    for (const d of due) await completeTopicReview(deps, d.review.id);
    expect((await deps.store.listTopics())[0]!.status).toBe('dominado');
    expect(await dueTopicReviews(deps)).toHaveLength(0);
  });

  it('sessão concluída num bloco com tópico agenda as revisões', async () => {
    const { deps, clock } = mk();
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Mat'], weekdays: [1], periods: ['noite'] });
    const t = await addTopic(deps, { subjectId: 'mat', title: 'T' });
    const t0 = clock.t;
    clock.t += 24 * MIN;
    await finishSession(deps, { timer: startTimer(DEFAULT_PROFILES.medio, t0), subjectId: 'mat', topicId: t.id, startedAt: new Date(t0), plannedMin: 25 });
    expect(await deps.store.listTopicReviews()).toHaveLength(3);
  });

  it('sessão muito curta não conta como estudado; remover tópico limpa revisões', async () => {
    const { deps, clock } = mk();
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Mat'], weekdays: [1], periods: ['noite'] });
    const t = await addTopic(deps, { subjectId: 'mat', title: 'T' });
    const t0 = clock.t;
    clock.t += 5 * MIN;
    await finishSession(deps, { timer: startTimer(DEFAULT_PROFILES.medio, t0), subjectId: 'mat', topicId: t.id, startedAt: new Date(t0), plannedMin: 25 });
    expect(await deps.store.listTopicReviews()).toHaveLength(0);
    await markStudied(deps, t.id);
    await removeTopic(deps, t.id);
    expect(await deps.store.listTopicReviews()).toHaveLength(0);
    await expect(setTopicStatus(deps, 'x', 'dominado')).rejects.toThrow();
    await planWeek(deps);
  });

  it('engine puro: sem tópicos, blocos não têm topicId', () => {
    const r = generateWeeklyPlan({ weekStart: new Date(Date.UTC(2026, 10, 22)), profile: DEFAULT_PROFILES.medio, subjects: [{ id: 'm', name: 'M', weight: 3, difficulty: 3 }], deadlines: [], windows: [{ weekday: 1, startMin: 1080, endMin: 1260 }] });
    expect(r.blocks.every((b) => b.topicId === undefined)).toBe(true);
  });
});
