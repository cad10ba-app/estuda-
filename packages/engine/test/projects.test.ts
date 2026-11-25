import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILES, PROJECT_TEMPLATES, dailyGoal, generateWeeklyPlan, projectRisk, scheduleDates, scheduleMilestones, slackMs, type Milestone, type Project } from '../src';

const DAY = 86_400_000;
const start = new Date(Date.UTC(2026, 0, 1));
const final = new Date(Date.UTC(2026, 11, 1)); // ~334 dias

describe('templates e cronograma reverso', () => {
  it('cada template soma 100% de esforço e termina com marco de esforço 0', () => {
    for (const [model, t] of Object.entries(PROJECT_TEMPLATES)) {
      expect(t.reduce((a, m) => a + m.share, 0)).toBeCloseTo(1, 5);
      expect(t[t.length - 1]!.share, model).toBe(0);
    }
  });
  it('datas crescentes, folga ≥ 10% antes da entrega e marcos 0 na data final', () => {
    const ms = scheduleMilestones('tcc', start, final);
    for (let i = 1; i < ms.length; i++) expect(ms[i]!.targetDate.getTime()).toBeGreaterThanOrEqual(ms[i - 1]!.targetDate.getTime());
    const lastWork = ms.filter((m) => m.share > 0).at(-1)!;
    expect(final.getTime() - lastWork.targetDate.getTime()).toBeGreaterThanOrEqual((final.getTime() - start.getTime()) * 0.1 - DAY);
    expect(ms.at(-1)!.targetDate.getTime()).toBe(final.getTime());
  });
  it('prazo curto: folga mínima de 7 dias, no máximo metade do prazo', () => {
    expect(slackMs(start, new Date(start.getTime() + 20 * DAY))).toBe(7 * DAY);
    expect(slackMs(start, new Date(start.getTime() + 10 * DAY))).toBe(5 * DAY);
    expect(() => scheduleDates([1], final, start)).toThrow();
  });
});

describe('risco e meta diária', () => {
  const project: Project = { id: 'p', title: 'T', model: 'tcc', startDate: start, finalDate: final, hoursPerWeek: 8, unit: 'palavras', targetUnits: 12000 };
  const ms = (doneCount: number): Milestone[] =>
    scheduleMilestones('tcc', start, final).map((m, i) => ({ id: `m${i}`, projectId: 'p', title: m.title, targetDate: m.targetDate, effortShare: m.share, done: i < doneCount, order: i }));

  it('verde no início, vermelho com atraso grande', () => {
    expect(projectRisk(project, ms(0), start).level).toBe('verde');
    const late = new Date(start.getTime() + 200 * DAY);
    expect(projectRisk(project, ms(0), late).level).toBe('vermelho');
    expect(projectRisk(project, ms(5), late).level).not.toBe('vermelho');
  });
  it('amarelo entre 10% e 25%', () => {
    const t = new Date(start.getTime() + 0.2 * (final.getTime() - start.getTime() - slackMs(start, final)));
    const r = projectRisk(project, ms(0), t);
    expect(r.gap).toBeCloseTo(0.2, 1);
    expect(r.level).toBe('amarelo');
  });
  it('meta diária cai conforme se escreve e nunca é negativa', () => {
    const a = dailyGoal(project, 0, start)!;
    const b = dailyGoal(project, 6000, start)!;
    expect(a).toBeGreaterThan(b);
    expect(dailyGoal(project, 99999, start)).toBe(0);
    expect(dailyGoal({ ...project, targetUnits: undefined }, 0, start)).toBeUndefined();
  });
});

describe('reserva de blocos de escrita no plano', () => {
  const weekStart = new Date(Date.UTC(2026, 10, 22));
  const windows = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, startMin: 1080, endMin: 1260 }));
  const subjects = [{ id: 'mat', name: 'Mat', weight: 3, difficulty: 3 }];
  const profile = DEFAULT_PROFILES.superior;

  it('reserva blocos espalhados em dias distintos, tipo escrita', () => {
    const r = generateWeeklyPlan({ weekStart, profile, subjects, deadlines: [], windows, projectSlots: [{ id: 'p1', blocks: 4 }] });
    const w = r.blocks.filter((b) => b.type === 'escrita');
    expect(w).toHaveLength(4);
    expect(w.every((b) => b.subjectId === 'project:p1')).toBe(true);
    expect(new Set(w.map((b) => Math.floor(b.start.getTime() / DAY))).size).toBe(4);
    expect(r.blocks.some((b) => b.subjectId === 'mat')).toBe(true);
    const starts = r.blocks.map((b) => b.start.getTime());
    expect(new Set(starts).size).toBe(starts.length);
  });
  it('limita a 60% dos slots e avisa', () => {
    const r = generateWeeklyPlan({ weekStart, profile, subjects, deadlines: [], windows, projectSlots: [{ id: 'p1', blocks: 99 }] });
    const total = r.blocks.length;
    expect(r.blocks.filter((b) => b.type === 'escrita').length).toBeLessThanOrEqual(Math.ceil(total * 0.65));
    expect(r.warnings.some((x) => x.includes('escrita'))).toBe(true);
  });
});
