import { describe, expect, it } from 'vitest';
import { MemoryStore, addReference, completeOnboarding, createProject, deleteProjectAndReplan, formatABNT, logWriting, projectStatus, referencesABNT, rescheduleProject, setMilestoneDone, type Deps } from '../src';

const DAY = 86_400_000;
const mk = () => {
  const clock = { t: Date.UTC(2026, 10, 24, 12) };
  const deps: Deps = { store: new MemoryStore(), clock: { now: () => new Date(clock.t) } };
  return { deps, clock };
};
async function base() {
  const m = mk();
  await completeOnboarding(m.deps, { level: 'superior', subjectNames: ['Cálculo'], weekdays: [0, 1, 2, 3, 4, 5, 6], periods: ['noite'] });
  return m;
}

describe('projetos longos', () => {
  it('cria projeto com marcos e insere blocos de escrita no plano', async () => {
    const { deps } = await base();
    const r = await createProject(deps, { model: 'tcc', title: 'Meu TCC', finalDate: '2027-06-30', hoursPerWeek: 5, targetUnits: 12000 });
    expect(r.milestones.length).toBe(11);
    const plan = await deps.store.listPlan();
    const w = plan.filter((b) => b.type === 'escrita');
    expect(w.length).toBeGreaterThan(0);
    expect(w.every((b) => b.subjectId === `project:${r.project.id}`)).toBe(true);
  });

  it('valida entradas', async () => {
    const { deps } = await base();
    await expect(createProject(deps, { model: 'tcc', title: '', finalDate: '2027-01-01', hoursPerWeek: 5 })).rejects.toThrow();
    await expect(createProject(deps, { model: 'tcc', title: 'x', finalDate: '2026-11-25', hoursPerWeek: 5 })).rejects.toThrow();
    await expect(createProject(deps, { model: 'tcc', title: 'x', finalDate: 'abc', hoursPerWeek: 5 })).rejects.toThrow();
    await expect(createProject(deps, { model: 'tcc', title: 'x', finalDate: '2027-01-01', hoursPerWeek: 0 })).rejects.toThrow();
  });

  it('meta diária e registro de escrita acumulam por dia', async () => {
    const { deps } = await base();
    const { project } = await createProject(deps, { model: 'artigo', title: 'Art', finalDate: '2027-02-24', hoursPerWeek: 4, targetUnits: 6000 });
    const s0 = await projectStatus(deps, project.id);
    expect(s0.goalToday).toBeGreaterThan(0);
    await logWriting(deps, { projectId: project.id, amount: 300 });
    await logWriting(deps, { projectId: project.id, amount: 200 });
    const s1 = await projectStatus(deps, project.id);
    expect(s1.written).toBe(500);
    expect(s1.writtenToday).toBe(500);
    expect(s1.goalToday).toBe(s0.goalToday); // meta de hoje não muda por já ter escrito hoje
    await expect(logWriting(deps, { projectId: project.id, amount: 0 })).rejects.toThrow();
  });

  it('risco sobe com o tempo e cai ao concluir marcos; reagendar recalcula só os pendentes', async () => {
    const { deps, clock } = await base();
    const { project, milestones } = await createProject(deps, { model: 'tcc', title: 'T', finalDate: '2027-06-30', hoursPerWeek: 5 });
    expect((await projectStatus(deps, project.id)).risk.level).toBe('verde');
    clock.t += 150 * DAY;
    const late = await projectStatus(deps, project.id);
    expect(late.risk.level).not.toBe('verde');
    for (const m of milestones.slice(0, 4)) await setMilestoneDone(deps, m.id, true);
    expect((await projectStatus(deps, project.id)).risk.gap).toBeLessThan(late.risk.gap);
    const before = (await projectStatus(deps, project.id)).milestones;
    await rescheduleProject(deps, project.id);
    const after = (await projectStatus(deps, project.id)).milestones;
    expect(after.slice(0, 4).map((m) => m.targetDate.getTime())).toEqual(before.slice(0, 4).map((m) => m.targetDate.getTime()));
    expect(after[4]!.targetDate.getTime()).toBeGreaterThanOrEqual(clock.t - DAY);
  });

  it('concluir todos os marcos de esforço tira a escrita do plano; excluir limpa tudo', async () => {
    const { deps } = await base();
    const { project, milestones } = await createProject(deps, { model: 'artigo', title: 'A', finalDate: '2027-02-24', hoursPerWeek: 4 });
    for (const m of milestones.filter((x) => x.effortShare > 0)) await setMilestoneDone(deps, m.id, true);
    expect((await deps.store.listPlan()).some((b) => b.type === 'escrita')).toBe(false);
    await deleteProjectAndReplan(deps, project.id);
    expect(await deps.store.listMilestones()).toHaveLength(0);
  });
});

describe('referências ABNT', () => {
  it('formata livro, artigo e site e ordena', async () => {
    const { deps } = mk();
    const p = 'p1';
    await addReference(deps, { projectId: p, type: 'livro', authors: 'Silva, João', title: 'Metodologia científica', source: 'Atlas', place: 'São Paulo', year: 2020 });
    await addReference(deps, { projectId: p, type: 'artigo', authors: 'Costa, Ana; Lima, Paulo', title: 'Estudo de caso', source: 'Revista X', volume: '12', pages: '10-20', year: 2021 });
    await addReference(deps, { projectId: p, type: 'site', authors: 'Brasil', title: 'Lei 13.709', year: 2018, url: 'https://exemplo.gov.br', accessedAt: '2026-03-05' });
    const lines = await referencesABNT(deps, p);
    expect(lines[0]).toContain('BRASIL. Lei 13.709. 2018. Disponível em: https://exemplo.gov.br. Acesso em: 5 mar. 2026.');
    expect(lines[1]).toBe('COSTA, ANA; LIMA, PAULO. Estudo de caso. Revista X, v. 12, p. 10-20, 2021.');
    expect(lines[2]).toBe('SILVA, JOÃO. Metodologia científica. São Paulo: Atlas, 2020.');
    expect(formatABNT({ id: '1', projectId: p, type: 'livro', authors: 'A, B', title: 'T' })).toBe('A, B. T. s.l.: s.n., s.d..');
    await expect(addReference(deps, { projectId: p, type: 'site', authors: 'X', title: 'Y' })).rejects.toThrow();
  });
});
