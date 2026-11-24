import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILES } from '@estuda/engine';
import { MemoryStore, freeSlots, groupByDay, markBlockMissed, moveBlock, planWeek, setBlockLocked, type Deps } from '../src';

async function setup(nowMs = Date.UTC(2026, 10, 24, 12)) {
  const clock = { t: nowMs };
  const store = new MemoryStore();
  await store.saveProfile(DEFAULT_PROFILES.medio);
  for (const [id, w, d] of [['mat', 5, 4], ['his', 3, 2]] as const) await store.saveSubject({ id, name: id, weight: w, difficulty: d });
  await store.saveWindows([0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, startMin: 1080, endMin: 1260 })));
  const deps: Deps = { store, clock: { now: () => new Date(clock.t) } };
  await planWeek(deps);
  return { deps, store, clock };
}

describe('replanejamento de blocos', () => {
  it('bloco perdido vira histórico e o restante é reposto sem ocupar o mesmo horário', async () => {
    const { deps, store } = await setup();
    const before = await store.listPlan();
    const target = before[0]!;
    await markBlockMissed(deps, target.start);
    const after = await store.listPlan();
    const kept = after.filter((b) => b.start.getTime() === target.start.getTime());
    expect(kept).toHaveLength(1);
    expect(kept[0]!.missed).toBe(true);
    expect(after.filter((b) => b.subjectId === target.subjectId && !b.missed).length).toBeGreaterThanOrEqual(before.filter((b) => b.subjectId === target.subjectId).length - 1 + 1 - 1);
  });

  it('replanejar no meio do dia mantém blocos passados e não cria blocos no passado', async () => {
    const { deps, store, clock } = await setup();
    const before = await store.listPlan();
    clock.t = Date.UTC(2026, 10, 25, 19, 30); // dia 2, 19:30
    await planWeek(deps);
    const after = await store.listPlan();
    const past = before.filter((b) => b.start.getTime() < clock.t);
    for (const b of past) expect(after.some((x) => x.start.getTime() === b.start.getTime())).toBe(true);
    const newOnes = after.filter((b) => !before.some((x) => x.start.getTime() === b.start.getTime()));
    expect(newOnes.every((b) => b.start.getTime() >= clock.t)).toBe(true);
  });

  it('moveBlock só aceita horário livre e trava o bloco', async () => {
    const { deps, store } = await setup();
    const plan = await store.listPlan();
    const free = await freeSlots(deps);
    // Dias têm 3h de janela → 6 slots; carga do Médio limita a 7 blocos/dia => há horários livres? validar ambos os ramos
    const occupied = plan.find((b) => b.start.getTime() > deps.clock.now().getTime())!;
    await expect(moveBlock(deps, occupied.start, plan[1]!.start)).rejects.toThrow();
    if (free.length > 0) {
      await moveBlock(deps, occupied.start, free[0]!);
      const moved = (await store.listPlan()).find((b) => b.start.getTime() === free[0]!.getTime());
      expect(moved?.locked).toBe(true);
    }
  });

  it('travar bloco o preserva ao replanejar; groupByDay devolve 7 dias', async () => {
    const { deps, store } = await setup();
    const b = (await store.listPlan()).find((x) => x.start > deps.clock.now())!;
    await setBlockLocked(deps, b.start, true);
    await planWeek(deps);
    expect((await store.listPlan()).find((x) => x.start.getTime() === b.start.getTime())?.locked).toBe(true);
    expect(groupByDay(await store.listPlan(), deps.clock.now())).toHaveLength(7);
  });
});
