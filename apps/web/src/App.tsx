import { useCallback, useEffect, useState } from 'react';
import type { PlanBlock, Subject, Topic } from '@estuda/engine';
import { blocksForDay, daySummary, doneByBlock, isBlockDone, planToICS, planWeek, reviewQueue, dueTopicReviews } from '@estuda/core';
import { deps } from './store';
import { Onboarding } from './Onboarding';
import { Subjects } from './Subjects';
import { Plan } from './Plan';
import { Review } from './Review';
import { Focus, beginSession, loadActive, type ActiveSession } from './Focus';

const TYPE_LABEL = { estudo: 'Estudo', revisao: 'Revisão', simulado: 'Simulado' } as const;

export function App() {
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [ready, setReady] = useState<'loading' | 'onboarding' | 'app'>('loading');
  const [tab, setTab] = useState<'hoje' | 'plano' | 'foco' | 'revisar' | 'disciplinas'>('hoje');
  const [active, setActive] = useState<ActiveSession | null>(loadActive);
  const [done, setDone] = useState<Map<string, number>>(new Map());
  const [dueCount, setDueCount] = useState(0);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [summary, setSummary] = useState({ plannedMin: 0, actualMin: 0 });

  const refresh = useCallback(async () => {
    setSubjects(await deps.store.listSubjects());
    setBlocks(await blocksForDay(deps));
    setDone(doneByBlock(await deps.store.listSessions()));
    setSummary(await daySummary(deps));
    setDueCount((await reviewQueue(deps)).queue.length + (await dueTopicReviews(deps)).length);
    setTopics(await deps.store.listTopics());
  }, []);

  const replan = useCallback(async () => {
    const r = await planWeek(deps);
    setWarnings(r.warnings);
    await refresh();
  }, [refresh]);

  useEffect(() => {
    (async () => {
      if (!(await deps.store.getProfile())) return setReady('onboarding');
      await refresh();
      setReady('app');
    })();
  }, [refresh]);

  const name = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;

  const exportIcs = async () => {
    const ics = planToICS(await deps.store.listPlan(), subjects);
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'estuda.ics' });
    a.click();
    URL.revokeObjectURL(url);
  };

  if (ready === 'loading') return <main className="app"><p className="muted">Carregando…</p></main>;
  if (ready === 'onboarding') {
    return <Onboarding onDone={async () => { await refresh(); setReady('app'); }} />;
  }

  const nav = (
    <nav className="tabs">
      <button className={tab === 'hoje' ? 'on' : ''} onClick={() => { setTab('hoje'); void refresh(); }}>Hoje</button>
      <button className={tab === 'plano' ? 'on' : ''} onClick={() => setTab('plano')}>Plano</button>
      <button className={tab === 'foco' ? 'on' : ''} onClick={() => setTab('foco')}>Foco{active ? ' ●' : ''}</button>
      <button className={tab === 'revisar' ? 'on' : ''} onClick={() => setTab('revisar')}>Revisar{dueCount > 0 ? ` (${dueCount})` : ''}</button>
      <button className={tab === 'disciplinas' ? 'on' : ''} onClick={() => setTab('disciplinas')}>Disciplinas</button>
    </nav>
  );
  if (tab === 'plano') {
    return <><Plan onChange={refresh} />{nav}</>;
  }
  if (tab === 'revisar') {
    return <><Review onChange={refresh} />{nav}</>;
  }
  if (tab === 'foco') {
    return <><Focus active={active} subjects={subjects} onChange={setActive} onFinished={() => { void refresh(); setTab('hoje'); }} />{nav}</>;
  }
  if (tab === 'disciplinas') {
    return <><Subjects onChange={refresh} />{nav}</>;
  }

  return (
    <>
    <main className="app">
      <header>
        <h1>Hoje</h1>
        <p className="muted">
          Hoje: {summary.actualMin} de {summary.plannedMin} min planejados
        </p>
      </header>

      {dueCount > 0 && (
        <p className="card"><strong>{dueCount}</strong> revisão(ões) esperando. <button className="link inline" onClick={() => setTab('revisar')}>Revisar agora</button></p>
      )}
      {warnings.map((w) => (
        <p key={w} className="warn">{w}</p>
      ))}

      <ul className="blocks">
        {blocks.length === 0 && <li className="muted">Nenhum bloco para hoje.</li>}
        {blocks.map((b) => (
          <li key={b.start.toISOString()} className={`block ${b.missed ? 'missed' : ''}`}>
            <time>
              {b.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </time>
            <div className="grow">
              <strong>{name(b.subjectId)}</strong>
              {b.topicId && <span> — {topics.find((t) => t.id === b.topicId)?.title}</span>}
              <span className="muted"> · {TYPE_LABEL[b.type]} · {b.durationMin} min{b.missed ? ' · perdido' : ''}</span>
              {(done.get(b.start.toISOString()) ?? 0) > 0 && (
                <div className="muted">{isBlockDone(b, done) ? '✓ ' : ''}{done.get(b.start.toISOString())} min feitos</div>
              )}
            </div>
            {!isBlockDone(b, done) && !b.missed && (
              <button className="link" onClick={async () => { setActive(await beginSession(b.subjectId, b)); setTab('foco'); }}>Iniciar</button>
            )}
          </li>
        ))}
      </ul>

      <footer className="actions">
        <button onClick={replan}>Replanejar semana</button>
        <button className="secondary" onClick={exportIcs}>Exportar agenda (.ics)</button>
      </footer>
    </main>
    {nav}
    </>
  );
}
