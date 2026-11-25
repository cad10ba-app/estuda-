import { describe, expect, it } from 'vitest';
import { DEFAULT_AUTONOMY, MemoryStore, addCard, changeMode, completeOnboarding, finishRun, learningSummary, prepareSession, setAccessibility, setAutonomy, setFocusMinutes, startRun, nextStep, type Deps } from '../src';

const MIN = 60_000;
const mk = () => {
  const clock = { t: Date.UTC(2026, 10, 24, 12) };
  const deps: Deps = { store: new MemoryStore(), clock: { now: () => new Date(clock.t) } };
  return { deps, clock };
};

describe('onboarding por modo e perfil', () => {
  it('define autonomia padrão do modo e cria objetivo com prazo nas disciplinas', async () => {
    const { deps } = mk();
    await completeOnboarding(deps, { level: 'fund2', subjectNames: ['Mat'], weekdays: [1, 2], periods: ['tarde'], goal: { type: 'prova', title: 'Prova final', deadline: '2026-12-10' } });
    expect((await deps.store.getProfile())?.autonomy).toBe(DEFAULT_AUTONOMY.fund2);
    expect(await deps.store.listGoals()).toHaveLength(1);
    expect((await deps.store.listSubjects())[0]!.goalId).toBeTruthy();
    expect(await deps.store.listDeadlines()).toHaveLength(1);
  });

  it('modos novos (pesquisa e objetivo livre) têm perfil e a recomendação funciona', async () => {
    for (const level of ['pos', 'livre'] as const) {
      const { deps } = mk();
      await completeOnboarding(deps, { level, subjectNames: ['Tema'], weekdays: [1, 2, 3, 4, 5], periods: ['noite'] });
      const p = await prepareSession(deps, { subjectId: 'tema', blockType: 'estudo', blockDurationMin: 60 });
      expect(p.recommendation.steps.length).toBeGreaterThan(0);
    }
  });

  it('trocar modo preserva autonomia e acessibilidade; valida duração e fonte', async () => {
    const { deps } = mk();
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Mat'], weekdays: [1, 2, 3], periods: ['noite'] });
    await setAutonomy(deps, 'guiada');
    await setAccessibility(deps, { fontScale: 1.3, highContrast: true });
    await changeMode(deps, 'superior');
    const p = (await deps.store.getProfile())!;
    expect(p).toMatchObject({ level: 'superior', focusMin: 50, autonomy: 'guiada' });
    expect(p.accessibility).toMatchObject({ fontScale: 1.3, highContrast: true });
    await expect(setFocusMinutes(deps, 5)).rejects.toThrow();
    await setFocusMinutes(deps, 32);
    expect((await deps.store.getProfile())!.focusMin).toBe(30);
    await expect(setAccessibility(deps, { fontScale: 2 })).rejects.toThrow();
  });
});

describe('resumo de aprendizagem (4 dimensões)', () => {
  it('separa atividade, desempenho, percepção e progresso; conta recomendações', async () => {
    const { deps, clock } = mk();
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Mat'], weekdays: [0, 1, 2, 3, 4, 5, 6], periods: ['noite'] });
    expect((await learningSummary(deps)).performance.accuracy).toBeNull();
    const p = await prepareSession(deps, { subjectId: 'mat', blockDurationMin: 25 });
    let r = startRun(p, clock.t);
    clock.t += 25 * MIN;
    for (let i = 0; i < r.steps.length; i++) r = nextStep(r, clock.t);
    await finishRun(deps, r, { difficulty: 4, confidence: 2, correct: 6, total: 10 });
    await addCard(deps, { subjectId: 'mat', front: 'a', back: 'b' });
    const s = await learningSummary(deps);
    expect(s.activity.sessions).toBe(1);
    expect(s.performance).toEqual({ answered: 10, accuracy: 0.6 });
    expect(s.perception).toMatchObject({ rated: 1, confidence: 2, difficulty: 4 });
    expect(s.recommendations).toEqual({ recomendada: 1, trocada: 0, personalizada: 0 });
    expect(s.reviews.pending).toBe(1);
  });
});
