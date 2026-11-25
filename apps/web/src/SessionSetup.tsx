import { useEffect, useState } from 'react';
import { STRENGTH_LABEL, TECHNIQUE_BY_ID, type SessionStep } from '@estuda/engine';
import { customizeSteps, prepareSession, startRun, swapTechnique, type PreparedSession, type SessionRun } from '@estuda/core';
import { deps } from './store';
import type { Target } from './types';

type Mode = 'ver' | 'trocar' | 'personalizar';
const CHOICE_LABEL = { recomendada: 'Recomendação do app', trocada: 'Técnica trocada por você', personalizada: 'Sessão personalizada' } as const;

export function SessionSetup({ target, subjectName, onStart, onBack }: {
  target: Target; subjectName: string; onStart: (r: SessionRun) => void; onBack: () => void;
}) {
  const [prep, setPrep] = useState<PreparedSession | null>(null);
  const [mode, setMode] = useState<Mode>('ver');
  const [draft, setDraft] = useState<SessionStep[]>([]);
  const [error, setError] = useState('');

  useEffect(() => { prepareSession(deps, target).then(setPrep).catch((e) => setError((e as Error).message)); }, [target]);
  if (!prep) return <main className="app"><button className="link back" onClick={onBack}>‹ Voltar</button><p className={error ? 'warn' : 'muted'}>{error || 'Preparando…'}</p></main>;

  const rec = prep.recommendation;
  const chosen = prep.chosen;
  const total = chosen.steps.reduce((a, s) => a + s.minutes, 0);
  const tech = TECHNIQUE_BY_ID[chosen.technique];
  const start = () => onStart(startRun(prep, Date.now()));

  const openCustom = () => { setDraft(chosen.steps.map((s) => ({ ...s }))); setMode('personalizar'); setError(''); };
  const saveCustom = () => {
    try { setPrep(customizeSteps(prep, draft)); setMode('ver'); setError(''); } catch (e) { setError((e as Error).message); }
  };
  const bump = (i: number, d: number) => setDraft(draft.map((s, j) => (j === i ? { ...s, minutes: Math.max(1, s.minutes + d) } : s)));

  return (
    <main className="app">
      <button className="link back" onClick={onBack}>‹ Voltar</button>
      <p className="muted">Sessão</p>
      <h1>{subjectName}{prep.topic ? ` — ${prep.topic.title}` : ''}</h1>
      {prep.task && <p className="muted">Tarefa: {prep.task.title}</p>}

      <section className="card">
        <p className="muted">{CHOICE_LABEL[chosen.choice]}</p>
        <h2 className="hero-title">{tech.name}{chosen.choice === 'recomendada' && rec.complementary ? ` + ${TECHNIQUE_BY_ID[rec.complementary].name}` : ''}</h2>
        <p className="muted">{total} min · {chosen.steps.length} etapa(s)</p>
        {chosen.choice === 'recomendada' && (
          <>
            <strong>Por que esta sugestão?</strong>
            <ul className="why-list">{rec.justification.map((j) => <li key={j}>{j}</li>)}</ul>
            <details className="evidence">
              <summary>Base científica</summary>
              {rec.evidence.map((e) => (
                <p key={e.technique}><span className={`ev ev-${e.strength}`}>{STRENGTH_LABEL[e.strength]}</span> <strong>{TECHNIQUE_BY_ID[e.technique].name}:</strong> {e.summary}</p>
              ))}
              <p className="muted">Fontes completas em Técnicas. Referências ainda em revisão por especialista.</p>
            </details>
          </>
        )}
        {chosen.choice !== 'recomendada' && (
          <p className="muted">O app sugeria: {TECHNIQUE_BY_ID[rec.primary].name}. <button className="link inline" onClick={() => { setPrep({ ...prep, chosen: { technique: rec.primary, steps: rec.steps, choice: 'recomendada' } }); setMode('ver'); }}>Voltar à recomendação</button></p>
        )}
      </section>

      {mode !== 'personalizar' && (
        <ol className="steps">
          {chosen.steps.map((s) => (
            <li key={s.id}><strong>{s.label}</strong> <span className="muted">· {s.minutes} min</span><br /><span className="muted">{s.instruction}</span></li>
          ))}
        </ol>
      )}
      <p className="muted">Como saber se deu certo: {rec.verification}</p>

      {mode === 'ver' && (
        <div className="stack">
          <button onClick={start}>{chosen.choice === 'recomendada' ? 'Usar recomendação e começar' : 'Começar'}</button>
          <div className="row">
            <button className="secondary" onClick={() => setMode('trocar')}>Trocar técnica</button>
            <button className="secondary" onClick={openCustom}>Personalizar</button>
          </div>
        </div>
      )}

      {mode === 'trocar' && (
        <section className="card">
          <strong>Escolha outra técnica</strong>
          {prep.alternatives.map((id) => (
            <button key={id} className={`big ${id === chosen.technique ? '' : 'secondary'}`} onClick={() => { setPrep(swapTechnique(prep, id)); setMode('ver'); }}>
              <strong>{TECHNIQUE_BY_ID[id].name}</strong><br /><span className="muted">{TECHNIQUE_BY_ID[id].description}</span>
            </button>
          ))}
          <button className="link" onClick={() => setMode('ver')}>Cancelar</button>
        </section>
      )}

      {mode === 'personalizar' && (
        <section className="card">
          <strong>Ajuste as etapas</strong>
          {draft.map((s, i) => (
            <div key={s.id} className="row between">
              <span className="grow">{s.label}</span>
              <button className="link" aria-label="Menos 1 minuto" onClick={() => bump(i, -1)}>−</button>
              <span>{s.minutes} min</span>
              <button className="link" aria-label="Mais 1 minuto" onClick={() => bump(i, 1)}>+</button>
              <button className="link" aria-label="Remover etapa" onClick={() => setDraft(draft.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
          {error && <p className="warn">{error}</p>}
          <div className="row">
            <button className="secondary" onClick={() => setMode('ver')}>Cancelar</button>
            <button onClick={saveCustom}>Salvar ajustes</button>
          </div>
        </section>
      )}
    </main>
  );
}
