import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILES } from '@estuda/engine';
import {
  MemoryStore, addGoal, addTask, addTopic, addUnit, attachSubjectToGoal, completeOnboarding, customizeSteps, defaultTaskKind,
  finishRun, isLastStep, isLowResult, isPaused, moveTopicToUnit, nextStep, pause, prepareSession, stepRemainingMs, removeUnit,
  resume, setTaskDone, startRun, stepDue, swapTechnique, swapTechniqueMidRun, focusMin, exportData, type Deps,
} from '../src';

const MIN = 60_000;
const mk = () => {
  const clock = { t: Date.UTC(2026, 10, 24, 12) };
  const deps: Deps = { store: new MemoryStore(), clock: { now: () => new Date(clock.t) } };
  return { deps, clock };
};
async function base(level: 'medio' | 'superior' = 'medio') {
  const m = mk();
  await completeOnboarding(m.deps, { level, subjectNames: ['Matemática'], weekdays: [0, 1, 2, 3, 4, 5, 6], periods: ['noite'] });
  return m;
}

describe('hierarquia: objetivo → disciplina → unidade → tópico → tarefa', () => {
  it('objetivo com prazo cria prazo na disciplina; unidades agrupam tópicos sem entrar no plano', async () => {
    const { deps } = await base();
    const goal = await addGoal(deps, { type: 'prova', title: 'ENEM', deadline: '2026-12-05' });
    await attachSubjectToGoal(deps, 'matematica', goal.id);
    const dl = await deps.store.listDeadlines();
    expect(dl.some((d) => d.subjectId === 'matematica' && d.kind === 'prova')).toBe(true);
    const unit = await addUnit(deps, { subjectId: 'matematica', title: 'Funções' });
    const t = await addTopic(deps, { subjectId: 'matematica', title: 'Função afim' });
    await moveTopicToUnit(deps, t.id, unit.id);
    expect((await deps.store.listTopics()).find((x) => x.id === t.id)?.parentId).toBe(unit.id);
    const plan = await deps.store.listPlan();
    expect(plan.some((b) => b.topicId === unit.id)).toBe(false);
    await expect(moveTopicToUnit(deps, unit.id, undefined)).rejects.toThrow();
    await removeUnit(deps, unit.id);
    expect((await deps.store.listTopics()).find((x) => x.id === t.id)?.parentId).toBeUndefined();
  });

  it('tarefas: validação, próxima pendente e conclusão', async () => {
    const { deps } = await base();
    const t = await addTopic(deps, { subjectId: 'matematica', title: 'Equações' });
    await expect(addTask(deps, { title: 'x' })).rejects.toThrow();
    const task = await addTask(deps, { topicId: t.id, subjectId: 'matematica', title: 'Lista 1', kind: 'resolver', estimatedMin: 40 });
    const p = await prepareSession(deps, { subjectId: 'matematica', topicId: t.id });
    expect(p.task?.id).toBe(task.id);
    expect(p.taskKind).toBe('resolver');
    expect(p.recommendation.primary).toBe('pratica_exercicios');
    await setTaskDone(deps, task.id, true);
    expect((await prepareSession(deps, { subjectId: 'matematica', topicId: t.id })).task).toBeUndefined();
  });
});

describe('sessão assistida: usar, trocar, personalizar', () => {
  it('recomendação traz justificativa; trocar regenera etapas; personalizar valida', async () => {
    const { deps } = await base();
    const p = await prepareSession(deps, { subjectId: 'matematica', blockType: 'estudo', blockDurationMin: 40 });
    expect(p.recommendation.justification.length).toBeGreaterThan(0);
    expect(p.chosen.choice).toBe('recomendada');
    const swapped = swapTechnique(p, 'pomodoro');
    expect(swapped.chosen.choice).toBe('trocada');
    expect(swapped.chosen.steps.reduce((a, s) => a + s.minutes, 0)).toBe(p.chosen.steps.reduce((a, s) => a + s.minutes, 0));
    expect(swapTechnique(swapped, p.recommendation.primary).chosen.choice).toBe('recomendada');
    const custom = customizeSteps(p, p.chosen.steps.map((s) => ({ ...s, minutes: s.minutes + 1 })));
    expect(custom.chosen.choice).toBe('personalizada');
    expect(() => customizeSteps(p, [])).toThrow();
    expect(() => customizeSteps(p, [{ ...p.chosen.steps[0]!, minutes: 0 }])).toThrow();
    expect(defaultTaskKind('escrita', 'pos')).toBe('escrever');
  });

  it('modo superior sem tarefa recomenda leitura (blocos de foco) por padrão', async () => {
    const { deps } = await base('superior');
    const p = await prepareSession(deps, { subjectId: 'matematica', blockType: 'estudo', blockDurationMin: 60 });
    expect(p.taskKind).toBe('ler');
  });
});

describe('executor em etapas', () => {
  async function prepared() {
    const { deps, clock } = await base();
    const t = await addTopic(deps, { subjectId: 'matematica', title: 'T' });
    const task = await addTask(deps, { topicId: t.id, subjectId: 'matematica', title: 'Ex', kind: 'memorizar' });
    const p = await prepareSession(deps, { subjectId: 'matematica', topicId: t.id, blockDurationMin: 40, blockStart: new Date(clock.t) });
    return { deps, clock, p, task, t };
  }

  it('contagem, pausa, retomada e avanço de etapa', async () => {
    const { clock, p } = await prepared();
    let r = startRun(p, clock.t);
    const first = r.steps[0]!.minutes;
    expect(stepRemainingMs(r, clock.t + 60_000)).toBe((first - 1) * MIN);
    r = pause(r, clock.t + 2 * MIN);
    expect(isPaused(r)).toBe(true);
    expect(stepRemainingMs(r, clock.t + 50 * MIN)).toBe((first - 2) * MIN); // pausado: não corre
    r = resume(r, clock.t + 10 * MIN);
    expect(stepRemainingMs(r, clock.t + 11 * MIN)).toBe((first - 3) * MIN);
    expect(stepDue(r, clock.t + 10 * MIN + first * MIN)).toBe(true);
    r = nextStep(r, clock.t + 11 * MIN);
    expect(r.index).toBe(1);
    expect(isLastStep(r)).toBe(false);
  });

  it('trocar técnica no meio mantém o tempo restante e marca como trocada', async () => {
    const { clock, p } = await prepared();
    const r0 = startRun(p, clock.t);
    const total = r0.steps.reduce((a, s) => a + s.minutes, 0);
    const r1 = swapTechniqueMidRun(r0, 'pomodoro', clock.t + 5 * MIN);
    expect(r1.choice).toBe('trocada');
    expect(r1.technique).toBe('pomodoro');
    const rest = r1.steps.slice(r1.index).reduce((a, s) => a + s.minutes, 0);
    expect(rest).toBe(total - 5);
  });

  it('encerrar grava técnica, escolha, avaliação; programa revisão e conclui a tarefa', async () => {
    const { deps, clock, p, task, t } = await prepared();
    let r = startRun(p, clock.t);
    const total = r.steps.reduce((a, s) => a + s.minutes, 0);
    clock.t += total * MIN;
    r = nextStep(nextStep(r, clock.t), clock.t);
    const res = await finishRun(deps, r, { difficulty: 3, confidence: 4, correct: 8, total: 10 });
    expect(res.session?.techniqueId).toBe(p.chosen.technique);
    expect(res.session?.choice).toBe('recomendada');
    expect(res.session?.assessment?.confidence).toBe(4);
    expect(res.followUps.map((f) => f.kind)).toContain('revisao_programada');
    expect(await deps.store.listTopicReviews()).toHaveLength(3);
    expect((await deps.store.listTasks()).find((x) => x.id === task.id)?.done).toBe(true);
    expect((await deps.store.listTopics()).find((x) => x.id === t.id)?.status).toBe('estudando');
  });

  it('resultado baixo sugere prática adicional; sessão curta não programa revisão', async () => {
    const { deps, clock, p } = await prepared();
    expect(isLowResult({ difficulty: 3, confidence: 2 })).toBe(true);
    expect(isLowResult({ difficulty: 3, confidence: 4, correct: 5, total: 10 })).toBe(true);
    expect(isLowResult({ difficulty: 3, confidence: 4, correct: 9, total: 10 })).toBe(false);
    let r = startRun(p, clock.t);
    clock.t += 3 * MIN;
    r = pause(r, clock.t);
    expect(focusMin(r, clock.t)).toBe(3);
    const res = await finishRun(deps, r, { difficulty: 4, confidence: 1 });
    expect(res.followUps.map((f) => f.kind)).toEqual(expect.arrayContaining(['pratica_adicional', 'sessao_curta']));
    expect(await deps.store.listTopicReviews()).toHaveLength(0);
  });

  it('sessão sem foco registrado retorna nulo; exportação inclui objetivos e tarefas', async () => {
    const { deps, clock, p } = await prepared();
    const r = startRun(p, clock.t);
    expect((await finishRun(deps, r)).session).toBeNull();
    await addGoal(deps, { type: 'rotina', title: 'Rotina' });
    const out = await exportData(deps);
    expect(out.data.goals.length).toBe(1);
    expect(out.data.tasks.length).toBeGreaterThan(0);
  });
});
