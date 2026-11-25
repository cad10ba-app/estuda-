import { describe, expect, it } from 'vitest';
import { DELETE_CONFIRMATION, markStudied, MemoryStore, addCard, addTopic, completeOnboarding, createProject, deleteAllData, exportData, exportDataJSON, finishSession, logWriting, startTimer, addReference, type Deps } from '../src';
import { DEFAULT_PROFILES } from '@estuda/engine';

const mk = () => {
  const clock = { t: Date.UTC(2026, 10, 24, 12) };
  const deps: Deps = { store: new MemoryStore(), clock: { now: () => new Date(clock.t) } };
  return { deps, clock };
};
async function populate() {
  const m = mk();
  const { deps, clock } = m;
  await completeOnboarding(deps, { level: 'superior', subjectNames: ['Cálculo'], weekdays: [0, 1, 2, 3, 4, 5, 6], periods: ['noite'] });
  const topic = await addTopic(deps, { subjectId: 'calculo', title: 'Limites' });
  await markStudied(deps, topic.id);
  await addCard(deps, { subjectId: 'calculo', front: 'a', back: 'b' });
  const { project } = await createProject(deps, { model: 'artigo', title: 'A', finalDate: '2027-03-01', hoursPerWeek: 3 });
  await logWriting(deps, { projectId: project.id, amount: 100 });
  await addReference(deps, { projectId: project.id, type: 'livro', authors: 'X, Y', title: 'Z' });
  const t0 = clock.t; clock.t += 25 * 60_000;
  await finishSession(deps, { timer: startTimer(DEFAULT_PROFILES.superior, t0), subjectId: 'calculo', startedAt: new Date(t0), plannedMin: 50 });
  return m;
}

describe('LGPD: exportar e excluir', () => {
  it('exporta todas as entidades em JSON com datas ISO', async () => {
    const { deps } = await populate();
    const out = await exportData(deps);
    expect(out.app).toBe('estuda');
    for (const k of ['subjects', 'plan', 'sessions', 'cards', 'topics', 'topicReviews', 'projects', 'milestones', 'writingLogs', 'references', 'windows'] as const) {
      expect((out.data[k] as unknown[]).length, k).toBeGreaterThan(0);
    }
    expect(out.data.profile?.level).toBe('superior');
    const parsed = JSON.parse(await exportDataJSON(deps));
    expect(parsed.data.sessions[0].startedAt).toMatch(/^2026-11-24T/);
    expect(parsed.exportedAt).toBe('2026-11-24T12:25:00.000Z');
  });

  it('excluir exige a frase exata e apaga tudo', async () => {
    const { deps } = await populate();
    await expect(deleteAllData(deps, 'sim')).rejects.toThrow();
    expect(await deps.store.getProfile()).toBeDefined();
    await deleteAllData(deps, ` ${DELETE_CONFIRMATION} `);
    const out = await exportData(deps);
    expect(out.data.profile).toBeUndefined();
    for (const [k, v] of Object.entries(out.data)) if (Array.isArray(v)) expect(v.length, k).toBe(0);
  });
});
