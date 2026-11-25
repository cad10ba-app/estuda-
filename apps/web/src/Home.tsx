import { useCallback, useEffect, useState } from 'react';
import type { PlanBlock, Project, Subject, Topic } from '@estuda/engine';
import { TECHNIQUE_BY_ID } from '@estuda/engine';
import { blocksForDay, doneByBlock, dueTopicReviews, isBlockDone, markBlockMissed, prepareSession, reviewQueue, type PreparedSession } from '@estuda/core';
import { deps } from './store';
import { displayName, subjectColor } from './names';
import type { Target } from './types';

const hhmm = (d: Date) => d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
const TYPE_LABEL = { estudo: 'Estudo', revisao: 'Revisão', simulado: 'Simulado', escrita: 'Escrita' } as const;

export function blockTarget(b: PlanBlock): Target {
  return { subjectId: b.subjectId, topicId: b.topicId, blockStart: b.start, blockType: b.type, blockDurationMin: b.durationMin };
}

export function Home({ hasRun, onOpenSession, onOpenRun, onOpenReview }: {
  hasRun: boolean;
  onOpenSession: (t: Target) => void;
  onOpenRun: () => void;
  onOpenReview: () => void;
}) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [done, setDone] = useState<Map<string, number>>(new Map());
  const [due, setDue] = useState(0);
  const [next, setNext] = useState<PreparedSession | null>(null);
  const [nextBlock, setNextBlock] = useState<PlanBlock | null>(null);
  const [pick, setPick] = useState('');
  const [msg, setMsg] = useState('');

  const load = useCallback(async () => {
    const [subs, projs, tops, day, sessions, q, tr] = await Promise.all([
      deps.store.listSubjects(), deps.store.listProjects(), deps.store.listTopics(), blocksForDay(deps),
      deps.store.listSessions(), reviewQueue(deps), dueTopicReviews(deps),
    ]);
    setSubjects(subs); setProjects(projs); setTopics(tops); setBlocks(day);
    const d = doneByBlock(sessions);
    setDone(d);
    setDue(q.queue.length + tr.length);
    setPick((cur) => cur || subs[0]?.id || '');
    const now = deps.clock.now();
    // Próxima sessão: o próximo bloco que ainda não começou (hoje ou nos dias seguintes). Nunca um horário que já passou.
    const all = await deps.store.listPlan();
    const upcoming = all
      .filter((b) => !b.missed && b.start >= now && !isBlockDone(b, d))
      .sort((a, b) => a.start.getTime() - b.start.getTime());
    const nb = upcoming[0];
    setNextBlock(nb ?? null);
    setNext(nb ? await prepareSession(deps, blockTarget(nb)) : null);
  }, []);
  useEffect(() => { void load(); }, [load]);

  const name = (id: string) => displayName(id, subjects, projects);
  const now = deps.clock.now();
  const passed = blocks.filter((b) => !b.missed && !isBlockDone(b, done) && b.start.getTime() + b.durationMin * 60_000 < now.getTime());

  const replan = async () => {
    for (const b of passed) await markBlockMissed(deps, b.start);
    setMsg(`${passed.length} bloco(s) replanejado(s). O conteúdo foi redistribuído nos próximos dias.`);
    await load();
  };

  const nb = nextBlock ?? undefined;
  const when = nb
    ? (nb.start.toDateString() === now.toDateString() ? '' : nb.start.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ' · ') + hhmm(nb.start)
    : '';
  const rec = next?.recommendation;

  return (
    <main className="app">
      <header>
        <h1>Início</h1>
        <p className="muted">O que fazer agora</p>
      </header>

      {hasRun && (
        <p className="card"><strong>Sessão em andamento.</strong> <button className="link inline" onClick={onOpenRun}>Continuar</button></p>
      )}
      {msg && <p className="muted">{msg}</p>}

      {next && rec && (
        <section className="card hero">
          <p className="muted">Próxima sessão{when ? ` · ${when}` : ''}</p>
          <h2 className="hero-title">
            {name(next.target.subjectId)}{next.topic ? ` — ${next.topic.title}` : ''}
          </h2>
          <p className="muted">
            {nb ? TYPE_LABEL[nb.type] + ' · ' : ''}{rec.durationMin} min · {TECHNIQUE_BY_ID[rec.primary].name}
            {rec.complementary ? ` + ${TECHNIQUE_BY_ID[rec.complementary].name}` : ''}
          </p>
          <p className="why">💡 {rec.justification[0]}</p>
          <button onClick={() => onOpenSession(next.target)}>Ver sessão</button>
        </section>
      )}

      {!next && (
        <section className="card">
          <p><strong>Nenhuma sessão futura no plano.</strong></p>
          <p className="muted">Confira os horários de estudo em Perfil ou comece uma sessão livre agora.</p>
          <div className="row">
            <select value={pick} onChange={(e) => setPick(e.target.value)}>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button disabled={!pick} onClick={() => onOpenSession({ subjectId: pick, blockDurationMin: 30 })}>Sessão livre</button>
          </div>
        </section>
      )}

      {passed.length > 0 && (
        <section className="card">
          <p>{passed.length} bloco(s) de hoje já passaram sem sessão.</p>
          <button className="secondary" onClick={replan}>Replanejar agora</button>
        </section>
      )}

      {due > 0 && (
        <section className="card">
          <p><strong>{due}</strong> revisão(ões) pendente(s).</p>
          <button className="secondary" onClick={onOpenReview}>Revisar agora</button>
        </section>
      )}

      <h2>Hoje</h2>
      <ul className="blocks">
        {blocks.length === 0 && <li className="muted">Nenhum bloco para hoje.</li>}
        {blocks.map((b) => (
          <li key={b.start.toISOString()} className={`block ${b.missed ? 'missed' : ''}`} style={{ '--c': subjectColor(b.subjectId) } as React.CSSProperties}>
            <time>{hhmm(b.start)}</time>
            <div className="grow">
              <strong>{name(b.subjectId)}</strong>
              {b.topicId && <span> — {topics.find((t) => t.id === b.topicId)?.title}</span>}
              <span className="muted"> · {TYPE_LABEL[b.type]} · {b.durationMin} min{b.missed ? ' · perdido' : ''}</span>
              {isBlockDone(b, done) && <div className="muted">✓ concluído</div>}
            </div>
            {!b.missed && !isBlockDone(b, done) && <button className="link" onClick={() => onOpenSession(blockTarget(b))}>Abrir</button>}
          </li>
        ))}
      </ul>
    </main>
  );
}
