import { describe, expect, it } from 'vitest';
import { generateWeeklyPlan, DEFAULT_PROFILES } from '@estuda/engine';
import { MemoryStore, blocksForDay, completeOnboarding, ensureFreshPlan, groupByDay, planWeek, setPlanStart, startOfDay, type Deps } from '../src';

const HOUR = 3_600_000, DAY = 86_400_000;
const BRT = -180;
const mk = (t: number) => {
  const clock = { t };
  const deps: Deps = { store: new MemoryStore(), clock: { now: () => new Date(clock.t), offsetMin: () => BRT } };
  return { deps, clock };
};
// 24/11/2026 21:00 em Brasília = 25/11 00:00 UTC
const NIGHT = Date.UTC(2026, 10, 25, 0, 0);
const hourLocal = (d: Date) => (d.getUTCHours() + 24 - 3) % 24;

describe('fuso horário', () => {
  it('janela "noite" (19h–22h) vira 19h–22h no horário LOCAL, não em UTC', () => {
    const weekStart = new Date(Date.UTC(2026, 10, 24, 3)); // meia-noite BRT
    const r = generateWeeklyPlan({
      weekStart, profile: DEFAULT_PROFILES.medio, subjects: [{ id: 'm', name: 'M', weight: 3, difficulty: 3 }],
      deadlines: [], windows: [{ weekday: 2, startMin: 19 * 60, endMin: 22 * 60 }], tzOffsetMin: BRT, // terça local
    });
    expect(r.blocks.length).toBeGreaterThan(0);
    for (const b of r.blocks) {
      expect(hourLocal(b.start)).toBeGreaterThanOrEqual(19);
      expect(hourLocal(b.start)).toBeLessThan(22);
    }
  });

  it('abrir às 21h locais: nenhum bloco no passado e o primeiro bloco vem a seguir', async () => {
    const { deps } = mk(NIGHT);
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Mat', 'His'], weekdays: [0, 1, 2, 3, 4, 5, 6], periods: ['noite'] });
    const plan = await deps.store.listPlan();
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.every((b) => b.start.getTime() >= NIGHT)).toBe(true);
    const first = plan.sort((a, b) => a.start.getTime() - b.start.getTime())[0]!;
    expect(hourLocal(first.start)).toBeGreaterThanOrEqual(21);
    // todos os blocos caem dentro de 19h–22h locais
    for (const b of plan) expect(hourLocal(b.start)).toBeGreaterThanOrEqual(19);
  });

  it('"hoje" respeita o dia local (21h BRT ainda é o dia 24)', async () => {
    const { deps } = mk(NIGHT);
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Mat'], weekdays: [0, 1, 2, 3, 4, 5, 6], periods: ['noite'] });
    const today = await blocksForDay(deps);
    const start = startOfDay(new Date(NIGHT), BRT);
    expect(start.getTime()).toBe(Date.UTC(2026, 10, 24, 3));
    expect(today.every((b) => b.start.getTime() >= start.getTime() && b.start.getTime() < start.getTime() + DAY)).toBe(true);
  });
});

describe('data de início do plano', () => {
  it('plano só começa na data escolhida; voltar a "hoje" replaneja', async () => {
    const { deps } = mk(Date.UTC(2026, 10, 24, 15)); // 12h BRT
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Mat'], weekdays: [0, 1, 2, 3, 4, 5, 6], periods: ['noite'], planStart: '2026-12-01' });
    const plan = await deps.store.listPlan();
    const startInstant = Date.UTC(2026, 11, 1, 3);
    expect(plan.length).toBeGreaterThan(0);
    expect(plan.every((b) => b.start.getTime() >= startInstant)).toBe(true);
    expect(groupByDay(plan, new Date(startInstant), BRT)[0]!.blocks.length).toBeGreaterThan(0);
    await setPlanStart(deps, undefined);
    const again = await deps.store.listPlan();
    expect(again.some((b) => b.start.getTime() < startInstant)).toBe(true);
    await expect(setPlanStart(deps, 'amanhã')).rejects.toThrow();
  });

  it('data de início no passado é ignorada', async () => {
    const { deps } = mk(Date.UTC(2026, 10, 24, 15));
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Mat'], weekdays: [0, 1, 2, 3, 4, 5, 6], periods: ['noite'], planStart: '2026-11-01' });
    const plan = await deps.store.listPlan();
    expect(plan.every((b) => b.start.getTime() >= Date.UTC(2026, 10, 24, 15))).toBe(true);
  });
});

describe('plano atualizado ao abrir o app', () => {
  it('gera de novo quando só restam horários passados; não mexe se há cobertura', async () => {
    const { deps, clock } = mk(Date.UTC(2026, 10, 24, 15));
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Mat'], weekdays: [0, 1, 2, 3, 4, 5, 6], periods: ['noite'] });
    expect(await ensureFreshPlan(deps)).toBe(false);
    clock.t += 10 * DAY; // volta 10 dias depois: tudo passou
    expect((await deps.store.listPlan()).filter((b) => b.start.getTime() >= clock.t)).toHaveLength(0);
    expect(await ensureFreshPlan(deps)).toBe(true);
    const future = (await deps.store.listPlan()).filter((b) => b.start.getTime() >= clock.t);
    expect(future.length).toBeGreaterThan(0);
    await planWeek(deps);
  });
});
