import { useCallback, useEffect, useState } from 'react';
import type { PlanBlock, Subject } from '@estuda/engine';
import { blocksForDay, planToICS, planWeek } from '@estuda/core';
import { deps } from './store';
import { Onboarding } from './Onboarding';
import { Subjects } from './Subjects';

const TYPE_LABEL = { estudo: 'Estudo', revisao: 'Revisão', simulado: 'Simulado' } as const;

export function App() {
  const [blocks, setBlocks] = useState<PlanBlock[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [ready, setReady] = useState<'loading' | 'onboarding' | 'app'>('loading');
  const [tab, setTab] = useState<'hoje' | 'disciplinas'>('hoje');

  const refresh = useCallback(async () => {
    setSubjects(await deps.store.listSubjects());
    setBlocks(await blocksForDay(deps));
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
      <button className={tab === 'disciplinas' ? 'on' : ''} onClick={() => setTab('disciplinas')}>Disciplinas</button>
    </nav>
  );
  if (tab === 'disciplinas') {
    return <><Subjects onChange={refresh} />{nav}</>;
  }

  return (
    <>
    <main className="app">
      <header>
        <h1>Hoje</h1>
        <p className="muted">O que estudar agora</p>
      </header>

      {warnings.map((w) => (
        <p key={w} className="warn">{w}</p>
      ))}

      <ul className="blocks">
        {blocks.length === 0 && <li className="muted">Nenhum bloco para hoje.</li>}
        {blocks.map((b) => (
          <li key={b.start.toISOString()} className="block">
            <time>
              {b.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
            </time>
            <div>
              <strong>{name(b.subjectId)}</strong>
              <span className="muted"> · {TYPE_LABEL[b.type]} · {b.durationMin} min</span>
            </div>
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
