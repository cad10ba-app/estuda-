import { useEffect, useState } from 'react';
import type { Autonomy, Level, Profile as ProfileT } from '@estuda/engine';
import { DEFAULT_ACCESSIBILITY, LEVEL_LABEL, changeMode, planToICS, setAccessibility, setAutonomy, setFocusMinutes } from '@estuda/core';
import { deps } from './store';
import { Availability } from './Availability';
import { Privacy } from './Privacy';

const AUTONOMY_LABEL: Record<Autonomy, string> = { guiada: 'Guiada', media: 'Média', alta: 'Alta' };

export function Profile({ onChange }: { onChange: () => void }) {
  const [profile, setProfile] = useState<ProfileT | null>(null);
  const [error, setError] = useState('');
  const load = async () => setProfile((await deps.store.getProfile()) ?? null);
  useEffect(() => { void load(); }, []);

  const run = async (fn: () => Promise<unknown>) => {
    try { setError(''); await fn(); await load(); onChange(); } catch (e) { setError((e as Error).message); }
  };

  const exportIcs = async () => {
    const ics = planToICS(await deps.store.listPlan(), await deps.store.listSubjects());
    const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
    Object.assign(document.createElement('a'), { href: url, download: 'estuda.ics' }).click();
    URL.revokeObjectURL(url);
  };

  if (!profile) return <main className="app"><p className="muted">Carregando…</p></main>;
  const a11y = { ...DEFAULT_ACCESSIBILITY, ...profile.accessibility };

  return (
    <main className="app">
      <h1>Perfil e configurações</h1>
      {error && <p className="warn">{error}</p>}

      <section className="card">
        <label>Modo de uso
          <select value={profile.level} onChange={(e) => run(() => changeMode(deps, e.target.value as Level))}>
            {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
          </select>
        </label>
        <p className="muted">Trocar o modo reajusta a duração das sessões e a carga diária.</p>
        <label>Autonomia
          <select value={profile.autonomy ?? 'media'} onChange={(e) => run(() => setAutonomy(deps, e.target.value as Autonomy))}>
            {(Object.keys(AUTONOMY_LABEL) as Autonomy[]).map((a) => <option key={a} value={a}>{AUTONOMY_LABEL[a]}</option>)}
          </select>
        </label>
        <label>Duração do bloco de foco: {profile.focusMin} min
          <input type="range" min={10} max={120} step={5} value={profile.focusMin} onChange={(e) => run(() => setFocusMinutes(deps, +e.target.value))} />
        </label>
      </section>

      <Availability onChange={onChange} />

      <section className="card">
        <strong>Acessibilidade</strong>
        <label>Tamanho do texto
          <select value={a11y.fontScale} onChange={(e) => run(() => setAccessibility(deps, { fontScale: +e.target.value }))}>
            <option value={1}>Padrão</option><option value={1.15}>Grande</option><option value={1.3}>Muito grande</option>
          </select>
        </label>
        <label className="check"><input type="checkbox" checked={a11y.highContrast} onChange={(e) => run(() => setAccessibility(deps, { highContrast: e.target.checked }))} /><span>Alto contraste</span></label>
        <label className="check"><input type="checkbox" checked={a11y.reduceMotion} onChange={(e) => run(() => setAccessibility(deps, { reduceMotion: e.target.checked }))} /><span>Reduzir animações</span></label>
      </section>

      <section className="card">
        <strong>Agenda</strong>
        <p className="muted">Leve seu plano para o calendário do celular.</p>
        <button className="secondary" onClick={exportIcs}>Exportar agenda (.ics)</button>
      </section>

      <Privacy embedded />
    </main>
  );
}
