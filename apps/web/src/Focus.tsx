import { useEffect, useState } from 'react';
import type { PlanBlock, Subject } from '@estuda/engine';
import { catchUp, finishSession, remainingMs, startTimer, type TimerState } from '@estuda/core';
import { deps } from './store';

export interface ActiveSession {
  timer: TimerState;
  subjectId: string;
  topicId?: string;
  blockStart?: string; // ISO
  startedAt: string; // ISO
  plannedMin: number;
}

const KEY = 'estuda.activeSession';
export const loadActive = (): ActiveSession | null => {
  try { return JSON.parse(localStorage.getItem(KEY) ?? 'null'); } catch { return null; }
};
export const saveActive = (a: ActiveSession | null) => {
  try { a ? localStorage.setItem(KEY, JSON.stringify(a)) : localStorage.removeItem(KEY); } catch { /* sem storage */ }
};

export async function beginSession(subjectId: string, block?: PlanBlock): Promise<ActiveSession> {
  const profile = (await deps.store.getProfile())!;
  const now = Date.now();
  const a: ActiveSession = {
    timer: startTimer(profile, now),
    subjectId,
    topicId: block?.topicId,
    blockStart: block?.start.toISOString(),
    startedAt: new Date(now).toISOString(),
    plannedMin: block?.durationMin ?? profile.focusMin,
  };
  saveActive(a);
  return a;
}

const fmt = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

export function Focus({ active, subjects, nameOf, onChange, onFinished }: {
  active: ActiveSession | null;
  subjects: Subject[];
  nameOf: (id: string) => string;
  onChange: (a: ActiveSession | null) => void;
  onFinished: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const [pick, setPick] = useState(subjects[0]?.id ?? '');

  useEffect(() => {
    if (!active) return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      const next = catchUp(active.timer, n);
      if (next !== active.timer) {
        const upd = { ...active, timer: next };
        saveActive(upd);
        onChange(upd);
        navigator.vibrate?.(200);
      }
    }, 500);
    return () => clearInterval(t);
  }, [active, onChange]);

  if (!active) {
    return (
      <main className="app">
        <h1>Foco</h1>
        <p className="muted">Escolha uma disciplina e comece. Dica: para começar, 5 minutos já valem.</p>
        <div className="row">
          <select value={pick} onChange={(e) => setPick(e.target.value)}>
            {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <button disabled={!pick} onClick={async () => onChange(await beginSession(pick))}>Iniciar</button>
        </div>
      </main>
    );
  }

  const name = nameOf(active.subjectId);
  const t = active.timer;
  const finish = async () => {
    await finishSession(deps, {
      timer: t, subjectId: active.subjectId, topicId: active.topicId,
      blockStart: active.blockStart ? new Date(active.blockStart) : undefined,
      startedAt: new Date(active.startedAt), plannedMin: active.plannedMin,
    });
    saveActive(null);
    onChange(null);
    onFinished();
  };

  return (
    <main className="app center">
      <p className="muted">{t.phase === 'focus' ? 'Foco' : 'Pausa'} · ciclo {t.cycle + (t.phase === 'focus' ? 1 : 0)}</p>
      <h1>{name}</h1>
      <div className="clock" aria-live="off">{fmt(remainingMs(t, now))}</div>
      <button onClick={finish}>Concluir sessão</button>
      <button className="link" onClick={() => { saveActive(null); onChange(null); }}>Descartar</button>
    </main>
  );
}
