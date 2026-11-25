import { useCallback, useEffect, useState } from 'react';
import type { Project, Subject } from '@estuda/engine';
import { DEFAULT_ACCESSIBILITY, type SessionRun } from '@estuda/core';
import { deps } from './store';
import { displayName } from './names';
import { Onboarding } from './Onboarding';
import { Home } from './Home';
import { Plan } from './Plan';
import { Content } from './Content';
import { Techniques } from './Techniques';
import { Progress } from './Progress';
import { Profile } from './Profile';
import { Review } from './Review';
import { AppBar } from './AppBar';
import { Icon, type IconName } from './Icon';
import { SessionSetup } from './SessionSetup';
import { SessionRunner, loadRun, saveRun } from './SessionRun';
import type { Tab, Target } from './types';

type Overlay = null | { kind: 'setup'; target: Target } | { kind: 'run' } | { kind: 'review' };

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'inicio', label: 'Início', icon: 'home' },
  { id: 'plano', label: 'Plano', icon: 'calendar' },
  { id: 'conteudos', label: 'Conteúdos', icon: 'book' },
  { id: 'tecnicas', label: 'Técnicas', icon: 'bulb' },
  { id: 'progresso', label: 'Progresso', icon: 'chart' },
  { id: 'perfil', label: 'Perfil', icon: 'user' },
];

export function App() {
  const [ready, setReady] = useState<'loading' | 'onboarding' | 'app'>('loading');
  const [tab, setTab] = useState<Tab>('inicio');
  const [overlay, setOverlay] = useState<Overlay>(null);
  const [run, setRun] = useState<SessionRun | null>(loadRun);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    setSubjects(await deps.store.listSubjects());
    setProjects(await deps.store.listProjects());
    const p = await deps.store.getProfile();
    const a = { ...DEFAULT_ACCESSIBILITY, ...p?.accessibility };
    const root = document.documentElement;
    root.style.fontSize = `${16 * a.fontScale}px`;
    root.dataset.contrast = a.highContrast ? 'high' : 'normal';
    root.dataset.motion = a.reduceMotion ? 'reduce' : 'normal';
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    (async () => {
      if (!(await deps.store.getProfile())) return setReady('onboarding');
      await refresh();
      setReady('app');
    })();
  }, [refresh]);

  const name = (id: string) => displayName(id, subjects, projects);

  if (ready === 'loading') return <main className="app"><p className="muted">Carregando…</p></main>;
  if (ready === 'onboarding') return <Onboarding onDone={async () => { await refresh(); setReady('app'); }} />;

  const setRunPersist = (r: SessionRun | null) => { saveRun(r); setRun(r); };

  if (overlay?.kind === 'setup') {
    return (
      <SessionSetup
        target={overlay.target} subjectName={name(overlay.target.subjectId)}
        onBack={() => setOverlay(null)}
        onStart={(r) => { setRunPersist(r); setOverlay({ kind: 'run' }); }}
      />
    );
  }
  if (overlay?.kind === 'run' && run) {
    return (
      <SessionRunner
        run={run} subjectName={name(run.subjectId)} onChange={setRunPersist}
        onClose={() => { setOverlay(null); void refresh(); }}
      />
    );
  }
  if (overlay?.kind === 'review') {
    return <Review onChange={refresh} onBack={() => { setOverlay(null); void refresh(); }} />;
  }

  const go = (t: Tab) => { setTab(t); void refresh(); };
  const open = (target: Target) => setOverlay({ kind: 'setup', target });

  return (
    <>
      <AppBar />
      {tab === 'inicio' && (
        <Home key={version} hasRun={!!run} onOpenSession={open} onOpenRun={() => setOverlay({ kind: 'run' })} onOpenReview={() => setOverlay({ kind: 'review' })} />
      )}
      {tab === 'plano' && <Plan onChange={refresh} onOpenSession={open} />}
      {tab === 'conteudos' && <Content onChange={refresh} />}
      {tab === 'tecnicas' && <Techniques />}
      {tab === 'progresso' && <Progress onChange={refresh} />}
      {tab === 'perfil' && <Profile onChange={refresh} />}
      <nav className="tabs" aria-label="Navegação principal">
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => go(t.id)}>
            <span className="ico"><Icon name={t.icon} size={20} /></span>
            <span>{t.label}{t.id === 'inicio' && run ? ' ●' : ''}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
