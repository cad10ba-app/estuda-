import { useState } from 'react';
import type { Level } from '@estuda/engine';
import { LEVEL_LABEL, PERIODS, SUGGESTED_SUBJECTS, completeOnboarding, type Period } from '@estuda/core';
import { deps } from './store';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<Level | null>(null);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [periods, setPeriods] = useState<Period[]>(['noite']);
  const [error, setError] = useState('');

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const pickLevel = (l: Level) => {
    setLevel(l);
    setSubjects(SUGGESTED_SUBJECTS[l]);
    setStep(1);
  };
  const addDraft = () => {
    const n = draft.trim();
    if (n && !subjects.includes(n)) setSubjects([...subjects, n]);
    setDraft('');
  };
  const finish = async () => {
    try {
      await completeOnboarding(deps, { level: level!, subjectNames: subjects, weekdays: days, periods });
      onDone();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <main className="app">
      <p className="muted">Passo {step + 1} de 3</p>
      {step === 0 && (
        <section>
          <h1>Qual é o seu nível?</h1>
          <p className="muted">Usamos isso para ajustar a duração das sessões e as técnicas sugeridas.</p>
          <div className="stack">
            {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => (
              <button key={l} className="secondary big" onClick={() => pickLevel(l)}>{LEVEL_LABEL[l]}</button>
            ))}
          </div>
        </section>
      )}
      {step === 1 && (
        <section>
          <h1>Suas disciplinas</h1>
          <div className="chips">
            {subjects.map((s) => (
              <button key={s} className="chip on" onClick={() => setSubjects(subjects.filter((x) => x !== s))}>{s} ✕</button>
            ))}
            {subjects.length === 0 && <span className="muted">Adicione ao menos uma.</span>}
          </div>
          <div className="row">
            <input value={draft} placeholder="Nova disciplina" onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addDraft()} />
            <button className="secondary" onClick={addDraft}>Adicionar</button>
          </div>
          <div className="row">
            <button className="secondary" onClick={() => setStep(0)}>Voltar</button>
            <button disabled={subjects.length === 0} onClick={() => setStep(2)}>Continuar</button>
          </div>
        </section>
      )}
      {step === 2 && (
        <section>
          <h1>Quando você estuda?</h1>
          <div className="chips">
            {DAYS.map((d, i) => (
              <button key={d} className={`chip ${days.includes(i) ? 'on' : ''}`} onClick={() => setDays(toggle(days, i))}>{d}</button>
            ))}
          </div>
          <div className="chips">
            {(Object.keys(PERIODS) as Period[]).map((p) => (
              <button key={p} className={`chip ${periods.includes(p) ? 'on' : ''}`} onClick={() => setPeriods(toggle(periods, p))}>{PERIODS[p].label}</button>
            ))}
          </div>
          {error && <p className="warn">{error}</p>}
          <div className="row">
            <button className="secondary" onClick={() => setStep(1)}>Voltar</button>
            <button disabled={days.length === 0 || periods.length === 0} onClick={finish}>Gerar meu plano</button>
          </div>
        </section>
      )}
    </main>
  );
}
