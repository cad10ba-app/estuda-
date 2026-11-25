import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILES } from '@estuda/engine';
import { MemoryStore, addCard, gradeCard, reviewQueue, setRetention, updateAvailability, windowsToSelection, completeOnboarding, type Deps } from '../src';

const DAY = 86_400_000;
function mk(t = Date.UTC(2026, 10, 24, 12)) {
  const clock = { t };
  const store = new MemoryStore();
  const deps: Deps = { store, clock: { now: () => new Date(clock.t) } };
  return { deps, clock, store };
}

describe('cartões e revisão espaçada', () => {
  it('cartão novo entra na fila; resposta "bom" agenda pelo FSRS (4 dias) e some da fila', async () => {
    const { deps, clock } = mk();
    await deps.store.saveProfile(DEFAULT_PROFILES.medio);
    const c = await addCard(deps, { subjectId: 'mat', front: '2+2', back: '4' });
    expect((await reviewQueue(deps)).queue).toHaveLength(1);
    const r = await gradeCard(deps, c.id, 'bom');
    expect(r.intervalDays).toBe(4);
    expect(r.stability).toBeCloseTo(3.7145, 4);
    expect((await reviewQueue(deps)).queue).toHaveLength(0);
    clock.t += 3 * DAY;
    expect((await reviewQueue(deps)).queue).toHaveLength(0);
    clock.t += DAY;
    expect((await reviewQueue(deps)).queue).toHaveLength(1);
  });

  it('errar conta lapso e volta no dia seguinte', async () => {
    const { deps } = mk();
    const c = await addCard(deps, { subjectId: 'mat', front: 'a', back: 'b' });
    const r = await gradeCard(deps, c.id, 'errou');
    expect(r.lapses).toBe(1);
    expect(r.repetitions).toBe(0);
    expect(r.due.getTime() - deps.clock.now().getTime()).toBe(DAY);
  });

  it('respeita o teto diário do perfil (Fund. II = 15)', async () => {
    const { deps } = mk();
    await deps.store.saveProfile(DEFAULT_PROFILES.fund2);
    for (let i = 0; i < 20; i++) await addCard(deps, { subjectId: 'mat', front: `q${i}`, back: 'a' });
    const q = await reviewQueue(deps);
    expect(q.queue).toHaveLength(15);
    expect(q.dueTotal).toBe(20);
    await gradeCard(deps, q.queue[0]!.id, 'facil');
    const q2 = await reviewQueue(deps);
    expect(q2.reviewedToday).toBe(1);
    expect(q2.queue).toHaveLength(14); // 15 - 1 já feito (fila só dos 19 vencidos, limitada a 14)
  });

  it('valida entrada vazia e id inexistente', async () => {
    const { deps } = mk();
    await expect(addCard(deps, { subjectId: 'x', front: ' ', back: 'b' })).rejects.toThrow();
    await expect(gradeCard(deps, 'nope', 'bom')).rejects.toThrow();
  });
});

describe('FSRS nos cartões', () => {
  it('fácil agenda mais longe que bom; errar volta em 1 dia e conta lapso', async () => {
    const { deps } = mk();
    const a = await addCard(deps, { subjectId: 'm', front: 'a', back: 'b' });
    const b = await addCard(deps, { subjectId: 'm', front: 'c', back: 'd' });
    expect((await gradeCard(deps, a.id, 'facil')).intervalDays).toBe(14);
    expect((await gradeCard(deps, b.id, 'errou')).intervalDays).toBe(1);
    expect((await deps.store.listCards()).find((c) => c.id === b.id)?.lapses).toBe(1);
  });

  it('segunda revisão no prazo cresce o intervalo; retenção maior encurta, menor alonga', async () => {
    const run = async (retention: number) => {
      const { deps, clock } = mk();
      await deps.store.saveProfile({ ...DEFAULT_PROFILES.medio, retention });
      const c = await addCard(deps, { subjectId: 'm', front: 'a', back: 'b' });
      const first = await gradeCard(deps, c.id, 'bom');
      clock.t = first.due.getTime();
      return { first: first.intervalDays, second: (await gradeCard(deps, c.id, 'bom')).intervalDays };
    };
    const normal = await run(0.9);
    expect(normal.second).toBeGreaterThan(normal.first);
    const strict = await run(0.95);
    const loose = await run(0.85);
    expect(strict.first).toBeLessThan(normal.first);
    expect(loose.first).toBeGreaterThan(normal.first);
  });

  it('cartão antigo (SM-2) é migrado sem perder o intervalo', async () => {
    const { deps, clock } = mk();
    const old = await addCard(deps, { subjectId: 'm', front: 'a', back: 'b' });
    const t0 = clock.t - 10 * DAY;
    await deps.store.saveCard({ ...old, intervalDays: 10, ease: 2.5, repetitions: 3, lastReviewedAt: new Date(t0), due: new Date(clock.t) });
    const r = await gradeCard(deps, old.id, 'bom');
    expect(r.stability).toBeGreaterThan(10);
    expect(r.intervalDays).toBeGreaterThan(10);
    expect(r.difficulty).toBeDefined();
  });

  it('retenção fora de 80–95% é recusada', async () => {
    const { deps } = mk();
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['M'], weekdays: [1], periods: ['noite'] });
    await setRetention(deps, 0.93);
    expect((await deps.store.getProfile())?.retention).toBe(0.93);
    await expect(setRetention(deps, 0.99)).rejects.toThrow();
    await expect(setRetention(deps, 0.5)).rejects.toThrow();
  });
});

describe('disponibilidade', () => {
  it('atualiza janelas e replaneja; round-trip da seleção', async () => {
    const { deps } = mk();
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Mat'], weekdays: [1, 2], periods: ['noite'] });
    await updateAvailability(deps, [1, 3, 5], ['manha', 'tarde']);
    const sel = windowsToSelection(await deps.store.listWindows());
    expect(sel).toEqual({ weekdays: [1, 3, 5], periods: ['manha', 'tarde'] });
    await expect(updateAvailability(deps, [], ['noite'])).rejects.toThrow();
  });
});
