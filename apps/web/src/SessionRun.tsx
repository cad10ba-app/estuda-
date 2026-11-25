import { useEffect, useRef, useState } from 'react';
import { MVP_TECHNIQUES, TECHNIQUE_BY_ID, type TechniqueId } from '@estuda/engine';
import {
  finishRun, focusMin, isLastStep, isPaused, nextStep, pause, resume, stepDue, stepRemainingMs, swapTechniqueMidRun,
  type Assessment, type FinishResult, type SessionRun as Run,
} from '@estuda/core';
import { deps } from './store';

const RUN_KEY = 'estuda.run';
export const loadRun = (): Run | null => { try { return JSON.parse(localStorage.getItem(RUN_KEY) ?? 'null'); } catch { return null; } };
export const saveRun = (r: Run | null) => { try { r ? localStorage.setItem(RUN_KEY, JSON.stringify(r)) : localStorage.removeItem(RUN_KEY); } catch { /* sem storage */ } };

const fmt = (ms: number) => {
  const s = Math.ceil(ms / 1000);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
};

type Phase = 'run' | 'swap' | 'assess' | 'result';

export function SessionRunner({ run, subjectName, onChange, onClose }: {
  run: Run; subjectName: string; onChange: (r: Run | null) => void; onClose: () => void;
}) {
  const [now, setNow] = useState(Date.now());
  const [phase, setPhase] = useState<Phase>('run');
  const [result, setResult] = useState<FinishResult | null>(null);
  const [difficulty, setDifficulty] = useState(3);
  const [confidence, setConfidence] = useState(3);
  const [correct, setCorrect] = useState('');
  const [total, setTotal] = useState('');
  const [error, setError] = useState('');
  const alerted = useRef(-1);

  const update = (r: Run) => { saveRun(r); onChange(r); };

  useEffect(() => {
    if (phase !== 'run') return;
    const t = setInterval(() => {
      const n = Date.now();
      setNow(n);
      if (!isPaused(run) && stepDue(run, n) && alerted.current !== run.index) {
        alerted.current = run.index;
        navigator.vibrate?.(250);
      }
    }, 500);
    return () => clearInterval(t);
  }, [run, phase]);

  const step = run.steps[run.index]!;
  const due = stepDue(run, now);

  const submit = async (withAssessment: boolean) => {
    try {
      const c = correct === '' ? undefined : +correct;
      const t = total === '' ? undefined : +total;
      if (withAssessment && ((c !== undefined) !== (t !== undefined) || (c !== undefined && t !== undefined && (c < 0 || t <= 0 || c > t)))) {
        setError('Informe acertos e total válidos (acertos não podem passar do total).'); return;
      }
      const a: Assessment | undefined = withAssessment ? { difficulty, confidence, correct: c, total: t } : undefined;
      const res = await finishRun(deps, pause(run, Date.now()), a);
      saveRun(null);
      setResult(res);
      setPhase('result');
    } catch (e) { setError((e as Error).message); }
  };

  if (phase === 'result') {
    return (
      <main className="app center">
        <h1>Sessão registrada</h1>
        {result?.session ? <p>{result.session.actualMin} min de foco · {TECHNIQUE_BY_ID[result.session.techniqueId!].name}</p> : <p className="muted">Nenhum foco foi registrado.</p>}
        {result?.followUps.map((f) => <p key={f.text} className="card">{f.text}</p>)}
        <button onClick={() => { onChange(null); onClose(); }}>Concluir</button>
      </main>
    );
  }

  if (phase === 'assess') {
    const scale = (value: number, set: (n: number) => void, label: string) => (
      <div>
        <p><strong>{label}</strong></p>
        <div className="scale">{[1, 2, 3, 4, 5].map((n) => <button key={n} className={`chip ${value === n ? 'on' : ''}`} onClick={() => set(n)}>{n}</button>)}</div>
      </div>
    );
    return (
      <main className="app">
        <h1>Como foi a sessão?</h1>
        <p className="muted">{focusMin(pause(run, now), now)} min de foco · {subjectName}</p>
        {scale(difficulty, setDifficulty, 'Dificuldade (1 fácil – 5 difícil)')}
        {scale(confidence, setConfidence, 'Confiança no conteúdo (1 baixa – 5 alta)')}
        <p className="muted">Se fez perguntas ou exercícios (opcional):</p>
        <div className="row">
          <input type="number" min={0} placeholder="Acertos" value={correct} onChange={(e) => setCorrect(e.target.value)} />
          <input type="number" min={1} placeholder="Total" value={total} onChange={(e) => setTotal(e.target.value)} />
        </div>
        {error && <p className="warn">{error}</p>}
        <div className="stack">
          <button onClick={() => submit(true)}>Salvar</button>
          <button className="secondary" onClick={() => submit(false)}>Pular avaliação</button>
          <button className="link danger" onClick={() => { saveRun(null); onChange(null); onClose(); }}>Descartar sessão</button>
        </div>
      </main>
    );
  }

  if (phase === 'swap') {
    return (
      <main className="app">
        <h1>Trocar técnica</h1>
        <p className="muted">As etapas restantes serão refeitas com o mesmo tempo.</p>
        <div className="stack">
          {MVP_TECHNIQUES.map((id: TechniqueId) => (
            <button key={id} className={`big ${id === run.technique ? '' : 'secondary'}`} onClick={() => { update(swapTechniqueMidRun(run, id, Date.now())); setPhase('run'); }}>
              <strong>{TECHNIQUE_BY_ID[id].name}</strong><br /><span className="muted">{TECHNIQUE_BY_ID[id].description}</span>
            </button>
          ))}
          <button className="link" onClick={() => setPhase('run')}>Cancelar</button>
        </div>
      </main>
    );
  }

  return (
    <main className="app center">
      <p className="muted">{subjectName} · {TECHNIQUE_BY_ID[run.technique].name}</p>
      <p className="muted">Etapa {run.index + 1} de {run.steps.length}</p>
      <h1>{step.label}</h1>
      <div className="clock" aria-live="off">{fmt(stepRemainingMs(run, now))}</div>
      <p>{step.instruction}</p>
      {due && <p className="card">Tempo da etapa concluído. Avance quando estiver pronto.</p>}
      <div className="stack full">
        {isPaused(run)
          ? <button onClick={() => update(resume(run, Date.now()))}>Retomar</button>
          : <button className="secondary" onClick={() => update(pause(run, Date.now()))}>Pausar</button>}
        {isLastStep(run)
          ? <button onClick={() => setPhase('assess')}>Finalizar</button>
          : <button className={due ? '' : 'secondary'} onClick={() => update(nextStep(run, Date.now()))}>Próxima etapa</button>}
        <div className="row">
          <button className="secondary" onClick={() => setPhase('swap')}>Trocar técnica</button>
          <button className="secondary" onClick={() => setPhase('assess')}>Encerrar</button>
        </div>
        <button className="link" onClick={onClose}>Sair (a sessão continua salva)</button>
      </div>
    </main>
  );
}
