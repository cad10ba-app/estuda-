import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILES } from '@estuda/engine';
import { MemoryStore, blocksForDay, planWeek, planToICS, setBlockLocked, type Deps } from '../src';

const now = new Date(Date.UTC(2026, 10, 24, 12));
async function setup() {
  const store = new MemoryStore();
  await store.saveProfile(DEFAULT_PROFILES.medio);
  await store.saveSubject({ id: 'mat', name: 'Matemática', weight: 5, difficulty: 4 });
  await store.saveSubject({ id: 'his', name: 'História', weight: 3, difficulty: 2 });
  await store.saveWindows([0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, startMin: 1080, endMin: 1260 })));
  const deps: Deps = { store, clock: { now: () => now } };
  return { store, deps };
}

describe('casos de uso', () => {
  it('planWeek persiste o plano e blocksForDay filtra o dia', async () => {
    const { deps, store } = await setup();
    const r = await planWeek(deps);
    expect(r.blocks.length).toBeGreaterThan(0);
    expect((await store.listPlan()).length).toBe(r.blocks.length);
    const today = await blocksForDay(deps);
    expect(today.every((b) => b.start.getUTCDate() === 24)).toBe(true);
  });

  it('falha sem perfil', async () => {
    const deps: Deps = { store: new MemoryStore(), clock: { now: () => now } };
    await expect(planWeek(deps)).rejects.toThrow();
  });

  it('bloco travado sobrevive a um novo planejamento', async () => {
    const { deps, store } = await setup();
    await planWeek(deps);
    const first = (await store.listPlan())[0]!;
    await setBlockLocked(deps, first.start, true);
    await planWeek(deps);
    const again = (await store.listPlan()).find((b) => b.start.getTime() === first.start.getTime())!;
    expect(again.locked).toBe(true);
    expect(again.subjectId).toBe(first.subjectId);
  });

  it('gera .ics válido', async () => {
    const { deps, store } = await setup();
    await planWeek(deps);
    const ics = planToICS(await store.listPlan(), await store.listSubjects());
    expect(ics.startsWith('BEGIN:VCALENDAR')).toBe(true);
    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics.endsWith('END:VCALENDAR')).toBe(true);
  });
});
