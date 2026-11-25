import { describe, expect, it } from 'vitest';
import { MemoryStore, addDeadline, addSubject, buildWindows, completeOnboarding, removeSubject, slugId, type Deps } from '../src';

const now = new Date(Date.UTC(2026, 10, 24, 12));
const mk = (): Deps => ({ store: new MemoryStore(), clock: { now: () => now } });

describe('onboarding', () => {
  it('cria perfil do nível, disciplinas, janelas e plano', async () => {
    const deps = mk();
    const r = await completeOnboarding(deps, { level: 'fund2', subjectNames: ['Matemática', ' Português ', 'matemática'], weekdays: [1, 2, 3], periods: ['tarde'] });
    expect((await deps.store.getProfile())?.focusMin).toBe(20);
    expect((await deps.store.listSubjects()).map((s) => s.id).sort()).toEqual(['matematica', 'matematica-2', 'portugues'].sort());
    expect(await deps.store.listWindows()).toHaveLength(3);
    expect(r.blocks.length).toBeGreaterThan(0);
  });
  it('valida entradas', async () => {
    const deps = mk();
    await expect(completeOnboarding(deps, { level: 'medio', subjectNames: [], weekdays: [1], periods: ['noite'] })).rejects.toThrow();
    await expect(completeOnboarding(deps, { level: 'medio', subjectNames: ['A'], weekdays: [], periods: ['noite'] })).rejects.toThrow();
  });
  it('buildWindows e slugId', () => {
    expect(buildWindows([1, 2], ['manha', 'noite'])).toHaveLength(4);
    expect(slugId('Física Quântica', new Set())).toBe('fisica-quantica');
  });
});

describe('disciplinas e prazos', () => {
  it('add/remove disciplina e prazo replanejam', async () => {
    const deps = mk();
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Matemática'], weekdays: [0, 1, 2, 3, 4, 5, 6], periods: ['noite'] });
    const s = await addSubject(deps, { name: 'Química', weight: 9, difficulty: 0 });
    expect(s.weight).toBe(5);
    expect(s.difficulty).toBe(1);
    await addDeadline(deps, { subjectId: 'quimica', kind: 'prova', date: '2026-11-27' });
    expect(await deps.store.listDeadlines()).toHaveLength(1);
    await expect(addDeadline(deps, { subjectId: 'quimica', kind: 'prova', date: 'xx' })).rejects.toThrow();
    await removeSubject(deps, 'quimica');
    expect(await deps.store.listDeadlines()).toHaveLength(0);
    expect((await deps.store.listPlan()).every((b) => b.subjectId === 'matematica')).toBe(true);
  });
});
