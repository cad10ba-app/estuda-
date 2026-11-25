import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PROFILES,
  NEW_CARD,
  allocateBlocks,
  capDailyReviews,
  computePriorities,
  generateWeeklyPlan,
  reviewCard,
  topicReviewDates,
  type AvailabilityWindow,
  type Subject,
} from '../src';

// 2026-11-22 é domingo
const weekStart = new Date(Date.UTC(2026, 10, 22));
const day = (n: number) => new Date(weekStart.getTime() + n * 86_400_000);

const subjects: Subject[] = [
  { id: 'mat', name: 'Matemática', weight: 5, difficulty: 4 },
  { id: 'his', name: 'História', weight: 3, difficulty: 2 },
  { id: 'qui', name: 'Química', weight: 4, difficulty: 5 },
];
const windows: AvailabilityWindow[] = [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
  weekday,
  startMin: 18 * 60,
  endMin: 21 * 60,
}));

describe('prioridade', () => {
  it('disciplina com prova próxima tem maior prioridade', () => {
    const p = computePriorities(subjects, [{ id: 'd1', subjectId: 'mat', date: day(5), kind: 'prova' }], weekStart);
    expect(p.mat!).toBeGreaterThan(p.qui!);
    expect(p.qui!).toBeGreaterThan(p.his!);
  });
});

describe('alocação', () => {
  it('soma exatamente o total e dá mínimo 1', () => {
    const r = allocateBlocks({ a: 5, b: 1, c: 1 }, 10);
    expect(Object.values(r).reduce((x, y) => x + y, 0)).toBe(10);
    expect(Math.min(...Object.values(r))).toBeGreaterThanOrEqual(1);
  });
});

describe('plano semanal', () => {
  const profile = DEFAULT_PROFILES.medio;
  const deadlines = [{ id: 'd1', subjectId: 'mat', date: day(5), kind: 'prova' as const }];

  it('respeita janelas, carga diária e não sobrepõe blocos', () => {
    const { blocks } = generateWeeklyPlan({ weekStart, profile, subjects, deadlines, windows });
    expect(blocks.length).toBeGreaterThan(0);
    const perDay = new Map<number, number>();
    for (const b of blocks) {
      const mins = (b.start.getTime() - Date.UTC(b.start.getUTCFullYear(), b.start.getUTCMonth(), b.start.getUTCDate())) / 60000;
      expect(mins).toBeGreaterThanOrEqual(18 * 60);
      expect(mins + b.durationMin).toBeLessThanOrEqual(21 * 60);
      const k = Math.floor((b.start.getTime() - weekStart.getTime()) / 86_400_000);
      perDay.set(k, (perDay.get(k) ?? 0) + b.durationMin);
    }
    for (const v of perDay.values()) expect(v).toBeLessThanOrEqual(profile.dailyLoadMin);
  });

  it('intercala disciplinas (nunca duas seguidas iguais)', () => {
    const { blocks } = generateWeeklyPlan({ weekStart, profile, subjects, deadlines, windows });
    for (let i = 1; i < blocks.length; i++) expect(blocks[i]!.subjectId).not.toBe(blocks[i - 1]!.subjectId);
  });

  it('disciplina com prova em ≤7 dias recebe blocos e mais que as sem prazo', () => {
    const { blocks } = generateWeeklyPlan({ weekStart, profile, subjects, deadlines, windows });
    const count = (id: string) => blocks.filter((b) => b.subjectId === id).length;
    expect(count('mat')).toBeGreaterThan(0);
    expect(count('mat')).toBeGreaterThan(count('his'));
  });

  it('prova em ≤3 dias gera revisão/simulado, não estudo novo', () => {
    const near = [{ id: 'd1', subjectId: 'mat', date: day(2), kind: 'prova' as const }];
    const { blocks } = generateWeeklyPlan({ weekStart, profile, subjects, deadlines: near, windows });
    const early = blocks.filter((b) => b.subjectId === 'mat' && b.start.getTime() < day(2).getTime());
    expect(early.length).toBeGreaterThan(0);
    expect(early.every((b) => b.type !== 'estudo')).toBe(true);
  });

  it('não move blocos travados e evita sobreposição', () => {
    const lockedBlock = { start: new Date(day(1).getTime() + 18 * 3_600_000), durationMin: 25, type: 'estudo' as const, subjectId: 'his', locked: true };
    const { blocks } = generateWeeklyPlan({ weekStart, profile, subjects, deadlines, windows, locked: [lockedBlock] });
    expect(blocks).toContainEqual(lockedBlock);
    const same = blocks.filter((b) => b.start.getTime() === lockedBlock.start.getTime());
    expect(same).toHaveLength(1);
  });

  it('avisa quando não há disponibilidade', () => {
    const r = generateWeeklyPlan({ weekStart, profile, subjects, deadlines, windows: [] });
    expect(r.blocks).toHaveLength(0);
    expect(r.warnings.length).toBeGreaterThan(0);
  });

  it('avisa prazo sem cobertura quando faltam slots', () => {
    const few: AvailabilityWindow[] = [{ weekday: 0, startMin: 18 * 60, endMin: 18 * 60 + 25 }];
    const r = generateWeeklyPlan({ weekStart, profile, subjects, deadlines, windows: few });
    expect(r.blocks).toHaveLength(1);
    expect(r.warnings.some((w) => w.includes('Matemática'))).toBe(false);
    const r2 = generateWeeklyPlan({ weekStart, profile, subjects, deadlines: [{ id: 'x', subjectId: 'his', date: day(3), kind: 'prova' }], windows: few });
    expect(r2.warnings.some((w) => w.includes('História'))).toBe(r2.blocks[0]!.subjectId !== 'his');
  });
});

describe('SM-2', () => {
  it('intervalos crescem 1 → 6 → *ease', () => {
    let s = reviewCard(NEW_CARD, 'bom');
    expect(s.intervalDays).toBe(1);
    s = reviewCard(s, 'bom');
    expect(s.intervalDays).toBe(6);
    s = reviewCard(s, 'bom');
    expect(s.intervalDays).toBeGreaterThan(6);
  });
  it('errar reseta repetições e mantém ease ≥ 1.3', () => {
    let s = reviewCard(reviewCard(NEW_CARD, 'facil'), 'facil');
    s = reviewCard(s, 'errou');
    expect(s.repetitions).toBe(0);
    expect(s.intervalDays).toBe(1);
    for (let i = 0; i < 20; i++) s = reviewCard(s, 'errou');
    expect(s.ease).toBeGreaterThanOrEqual(1.3);
  });
});

describe('revisões de tópico', () => {
  it('gera D+1, D+7, D+30', () => {
    const d = topicReviewDates(weekStart);
    expect(d.map((x) => (x.getTime() - weekStart.getTime()) / 86_400_000)).toEqual([1, 7, 30]);
  });
  it('teto diário rola excedente para o dia seguinte', () => {
    const due = Array.from({ length: 5 }, () => new Date(weekStart));
    const out = capDailyReviews(due, 2);
    const byDay = new Map<number, number>();
    out.forEach((d) => byDay.set(Math.floor(d.getTime() / 86_400_000), (byDay.get(Math.floor(d.getTime() / 86_400_000)) ?? 0) + 1));
    expect(Math.max(...byDay.values())).toBeLessThanOrEqual(2);
    expect(out).toHaveLength(5);
  });
});

describe('replanejamento', () => {
  const profile = DEFAULT_PROFILES.medio;

  it('from ignora horários passados', () => {
    const from = new Date(weekStart.getTime() + 20 * 3_600_000); // 20h do dia 0
    const { blocks } = generateWeeklyPlan({ weekStart, profile, subjects, deadlines: [], windows, from });
    expect(blocks.every((b) => b.start.getTime() >= from.getTime())).toBe(true);
  });

  it('carry-over garante blocos de reposição, tirando das de menor prioridade', () => {
    const base = generateWeeklyPlan({ weekStart, profile, subjects, deadlines: [], windows });
    const hisBase = base.blocks.filter((b) => b.subjectId === 'his').length;
    const r = generateWeeklyPlan({ weekStart, profile, subjects, deadlines: [], windows, carryOver: { his: hisBase + 3 } });
    expect(r.blocks.filter((b) => b.subjectId === 'his').length).toBeGreaterThanOrEqual(hisBase + 3);
    expect(r.blocks.length).toBe(base.blocks.length);
  });

  it('avisa quando não cabe repor', () => {
    const few: AvailabilityWindow[] = [{ weekday: 0, startMin: 18 * 60, endMin: 18 * 60 + 25 }];
    const r = generateWeeklyPlan({ weekStart, profile, subjects, deadlines: [], windows: few, carryOver: { mat: 3 } });
    expect(r.warnings.some((w) => w.includes('repor'))).toBe(true);
  });
});
