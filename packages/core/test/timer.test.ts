import { describe, expect, it } from 'vitest';
import { DEFAULT_PROFILES } from '@estuda/engine';
import { MemoryStore, catchUp, daySummary, doneByBlock, finishSession, isBlockDone, nextPhase, phaseLengthMs, remainingMs, startTimer, totalFocusMs, type Deps } from '../src';

const MIN = 60_000;
const t0 = Date.UTC(2026, 10, 24, 19);
const p = DEFAULT_PROFILES.medio; // 25/5

describe('timer', () => {
  it('conta regressiva e acumula foco', () => {
    const s = startTimer(p, t0);
    expect(remainingMs(s, t0 + 10 * MIN)).toBe(15 * MIN);
    expect(totalFocusMs(s, t0 + 10 * MIN)).toBe(10 * MIN);
    expect(totalFocusMs(s, t0 + 99 * MIN)).toBe(25 * MIN); // limitado à duração da fase
  });
  it('alterna foco/pausa e usa pausa longa a cada 4 ciclos', () => {
    let s = startTimer(p, t0);
    let now = t0;
    for (let i = 1; i <= 4; i++) {
      now += 25 * MIN;
      s = nextPhase(s, now);
      expect(s.phase).toBe('break');
      expect(phaseLengthMs(s)).toBe(i === 4 ? 15 * MIN : 5 * MIN);
      now += phaseLengthMs(s);
      s = nextPhase(s, now);
      expect(s.phase).toBe('focus');
    }
    expect(s.cycle).toBe(4);
    expect(s.focusMs).toBe(100 * MIN);
  });
  it('catchUp após segundo plano', () => {
    const s = catchUp(startTimer(p, t0), t0 + 60 * MIN); // 25 foco + 5 pausa + 25 foco + 5 pausa = 60
    expect(s.cycle).toBe(2);
    expect(s.phase).toBe('focus');
  });
});

describe('sessões', () => {
  const mk = (nowMs: number): Deps => ({ store: new MemoryStore(), clock: { now: () => new Date(nowMs) } });

  it('registra tempo real vs planejado e marca bloco como feito', async () => {
    const deps = mk(t0 + 24 * MIN);
    const timer = startTimer(p, t0);
    const s = await finishSession(deps, { timer, subjectId: 'mat', blockStart: new Date(t0), startedAt: new Date(t0), plannedMin: 25 });
    expect(s?.actualMin).toBe(24);
    const done = doneByBlock(await deps.store.listSessions());
    expect(isBlockDone({ start: new Date(t0), durationMin: 25, type: 'estudo', subjectId: 'mat' }, done)).toBe(true);
    expect(isBlockDone({ start: new Date(t0 + 1), durationMin: 25, type: 'estudo', subjectId: 'mat' }, done)).toBe(false);
  });
  it('ignora sessão com menos de 1 min', async () => {
    const deps = mk(t0 + 20_000);
    expect(await finishSession(deps, { timer: startTimer(p, t0), subjectId: 'mat', startedAt: new Date(t0), plannedMin: 25 })).toBeNull();
  });
  it('daySummary soma planejado e realizado', async () => {
    const deps = mk(t0 + 25 * MIN);
    await deps.store.savePlan([{ start: new Date(t0), durationMin: 25, type: 'estudo', subjectId: 'mat' }, { start: new Date(t0 + 30 * MIN), durationMin: 25, type: 'estudo', subjectId: 'his' }]);
    await finishSession(deps, { timer: startTimer(p, t0), subjectId: 'mat', startedAt: new Date(t0), plannedMin: 25 });
    expect(await daySummary(deps)).toEqual({ plannedMin: 50, actualMin: 25 });
  });
});
