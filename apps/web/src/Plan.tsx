import { useCallback, useEffect, useState } from 'react';
import type { PlanBlock, Project, Subject, Topic } from '@estuda/engine';
import { displayName, subjectColor } from './names';
import { freeSlots, groupByDay, markBlockMissed, moveBlock, setBlockLocked } from '@estuda/core';
import { deps } from './store';
import type { Target } from './types';

const TYPE_LABEL = { estudo: 'Estudo', revisao: 'Revisão', simulado: 'Simulado', escrita: 'Escrita' } as const;
const hhmm = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const dayLabel = (d: Date) => d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
const slotLabel = (d: Date) => `${dayLabel(d)} ${hhmm(d)}`;

export function Plan({ onChange, onOpenSession }: { onChange: () => void; onOpenSession: (t: Target) => void }) {
  const [plan, setPlan] = useState<PlanBlock[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [free, setFree] = useState<Date[]>([]);
  const [moving, setMoving] = useState<number | null>(null);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setPlan(await deps.store.listPlan());
    setSubjects(await deps.store.listSubjects());
    setTopics(await deps.store.listTopics());
    setProjects(await deps.store.listProjects());
    setFree(await freeSlots(deps));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    try {
      setMessage('');
      const r = (await fn()) as { warnings?: string[] } | undefined;
      if (r?.warnings?.length) setMessage(r.warnings.join(' '));
      setMoving(null);
      await load();
      onChange();
    } catch (e) {
      setMessage((e as Error).message);
    }
  };

  const name = (id: string) => displayName(id, subjects, projects);
  const now = deps.clock.now();
  const days = groupByDay(plan, now);

  return (
    <main className="app">
      <h1>Meu plano</h1>
      <p className="muted">Próximos 7 dias. 🔒 trava o bloco; "Perdi" repõe o conteúdo em outro horário.</p>
      {message && <p className="warn">{message}</p>}
      {days.map(({ day, blocks }) => (
        <section key={day.toISOString()}>
          <h2>{dayLabel(day)}</h2>
          {blocks.length === 0 && <p className="muted">Sem blocos.</p>}
          <ul className="blocks">
            {blocks.map((b) => {
              const t = b.start.getTime();
              const past = b.start < now;
              return (
                <li key={t} className={`block ${b.missed ? 'missed' : ''}`} style={{ '--c': subjectColor(b.subjectId) } as React.CSSProperties}>
                  <time>{hhmm(b.start)}</time>
                  <div className="grow">
                    <strong>{name(b.subjectId)}</strong>
                    {b.topicId && <span> — {topics.find((t) => t.id === b.topicId)?.title}</span>}
                    <span className="muted"> · {TYPE_LABEL[b.type]} · {b.durationMin} min{b.missed ? ' · perdido' : ''}</span>
                    {moving === t && (
                      <div className="row">
                        <select defaultValue="" onChange={(e) => e.target.value && run(() => moveBlock(deps, b.start, new Date(e.target.value)))}>
                          <option value="" disabled>Mover para…</option>
                          {free.map((f) => <option key={f.toISOString()} value={f.toISOString()}>{slotLabel(f)}</option>)}
                        </select>
                        <button className="link" onClick={() => setMoving(null)}>Cancelar</button>
                      </div>
                    )}
                  </div>
                  {!b.missed && !past && moving !== t && (
                    <div className="mini">
                      <button className="link" aria-label={b.locked ? 'Destravar' : 'Travar'} onClick={() => run(() => setBlockLocked(deps, b.start, !b.locked))}>{b.locked ? '🔒' : '🔓'}</button>
                      <button className="link" onClick={() => onOpenSession({ subjectId: b.subjectId, topicId: b.topicId, blockStart: b.start, blockType: b.type, blockDurationMin: b.durationMin })}>Abrir</button>
                      <button className="link" onClick={() => setMoving(t)}>Mover</button>
                      <button className="link" onClick={() => run(() => markBlockMissed(deps, b.start))}>Perdi</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
