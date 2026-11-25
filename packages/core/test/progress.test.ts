import { describe, expect, it } from 'vitest';
import { applyRetrospective, completeOnboarding, finishSession, startTimer, suggestionsFor, markBlockMissed, weeklyReport, addCard, gradeCard, type Deps, type WeeklyReport } from '../src';
import { DEFAULT_PROFILES } from '@estuda/engine';
import { MemoryStore } from '../src';

const DAY = 86_400_000, MIN = 60_000;
function mk() {
  const clock = { t: Date.UTC(2026, 10, 24, 12) };
  const deps: Deps = { store: new MemoryStore(), clock: { now: () => new Date(clock.t) } };
  return { deps, clock };
}

describe('progresso', () => {
  it('relatório soma planejado/realizado, aderência, faltas, streak e cartões', async () => {
    const { deps, clock } = mk();
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Mat', 'His'], weekdays: [0, 1, 2, 3, 4, 5, 6], periods: ['noite'] });
    // avança para depois das 20h do dia 24 para haver blocos passados (19:00 e 19:30)
    clock.t = Date.UTC(2026, 10, 24, 20, 30);
    const plan = await deps.store.listPlan();
    const past = plan.filter((b) => b.start.getTime() < clock.t);
    expect(past.length).toBeGreaterThanOrEqual(2);
    // cumpre o primeiro bloco
    const b0 = past[0]!;
    const t0 = b0.start.getTime();
    const stop = clock.t; clock.t = t0 + 25 * MIN;
    await finishSession(deps, { timer: startTimer(DEFAULT_PROFILES.medio, t0), subjectId: b0.subjectId, blockStart: b0.start, startedAt: b0.start, plannedMin: 25 });
    clock.t = stop;
    // perde o segundo bloco (futuro) para testar contagem
    const fut = (await deps.store.listPlan()).find((b) => b.start.getTime() > clock.t)!;
    await markBlockMissed(deps, fut.start);
    const c = await addCard(deps, { subjectId: 'mat', front: 'q', back: 'a' });
    await gradeCard(deps, c.id, 'bom');
    const r = await weeklyReport(deps);
    expect(r.blocksDone).toBe(1);
    expect(r.actualMin).toBe(25);
    expect(r.blocksPast).toBe(past.length);
    expect(r.adherence).toBeCloseTo(1 / past.length);
    expect(r.streak).toBe(1);
    expect(r.cardsReviewed).toBe(1);
    expect(r.bySubject.find((s) => s.subjectId === b0.subjectId)!.actualMin).toBe(25);
  });

  it('streak conta de ontem se hoje ainda não estudou, e quebra com lacuna', async () => {
    const { deps, clock } = mk();
    await deps.store.saveProfile(DEFAULT_PROFILES.medio);
    const studyOn = async (dayOffset: number) => {
      const s = Date.UTC(2026, 10, 24 + dayOffset, 10);
      await deps.store.saveSession({ id: `s${dayOffset}`, subjectId: 'm', startedAt: new Date(s), endedAt: new Date(s + 25 * MIN), plannedMin: 25, actualMin: 25, cycles: 1 });
    };
    await studyOn(-1); await studyOn(-2); await studyOn(-4);
    expect((await weeklyReport(deps)).streak).toBe(2);
    await studyOn(0);
    expect((await weeklyReport(deps)).streak).toBe(3);
    clock.t += 10 * DAY;
    expect((await weeklyReport(deps)).streak).toBe(0);
  });

  it('sugestões por regras', () => {
    const base: WeeklyReport = { from: new Date(0), to: new Date(0), plannedMin: 200, actualMin: 40, blocksPast: 8, blocksDone: 2, blocksMissed: 4, adherence: 0.25, streak: 0, cardsReviewed: 0, bySubject: [{ subjectId: 'mat', plannedMin: 100, actualMin: 10 }] };
    const kinds = suggestionsFor(base).map((s) => s.kind);
    expect(kinds).toEqual(expect.arrayContaining(['carga', 'faltas', 'disciplina']));
    expect(suggestionsFor({ ...base, blocksPast: 0 })[0]!.kind).toBe('ok');
    expect(suggestionsFor({ ...base, adherence: 0.9, blocksMissed: 0, bySubject: [] })[0]!.kind).toBe('ok');
  });

  it('retrospectiva ajusta carga e dificuldade, com limites', async () => {
    const { deps } = mk();
    await completeOnboarding(deps, { level: 'medio', subjectNames: ['Mat'], weekdays: [1, 2, 3], periods: ['noite'] });
    const ch = await applyRetrospective(deps, { load: 'pesada', hardSubjectId: 'mat' });
    expect((await deps.store.getProfile())!.dailyLoadMin).toBe(145);
    expect((await deps.store.listSubjects())[0]!.difficulty).toBe(4);
    expect(ch).toHaveLength(2);
    for (let i = 0; i < 10; i++) await applyRetrospective(deps, { load: 'pesada' });
    expect((await deps.store.getProfile())!.dailyLoadMin).toBe(50); // piso = 2 blocos de foco
    const none = await applyRetrospective(deps, { load: 'ok' });
    expect(none[0]).toMatch(/Nenhum ajuste/);
  });
});
