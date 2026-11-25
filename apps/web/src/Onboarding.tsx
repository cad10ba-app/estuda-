import { useState } from 'react';
import type { Autonomy, Level } from '@estuda/engine';
import { DEFAULT_AUTONOMY, GOAL_LABEL, LEVEL_LABEL, PERIODS, SUGGESTED_SUBJECTS, completeOnboarding, type GoalType, type Period } from '@estuda/core';
import { deps } from './store';
import { Logo } from './Logo';

const DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const AUTONOMY_LABEL: Record<Autonomy, string> = {
  guiada: 'Guiada — passo a passo, sessões mais curtas',
  media: 'Média — sugestões com alguma liberdade',
  alta: 'Alta — eu decido, o app apoia',
};
const STEPS = 5;

export function Onboarding({ onDone }: { onDone: () => void }) {
  const [step, setStep] = useState(0);
  const [level, setLevel] = useState<Level | null>(null);
  const [goalType, setGoalType] = useState<GoalType>('rotina');
  const [goalTitle, setGoalTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [autonomy, setAutonomy] = useState<Autonomy>('media');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [draft, setDraft] = useState('');
  const [days, setDays] = useState<number[]>([1, 2, 3, 4, 5]);
  const [periods, setPeriods] = useState<Period[]>(['noite']);
  const [planStart, setPlanStart] = useState('');
  const [error, setError] = useState('');

  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const pickLevel = (l: Level) => {
    setLevel(l);
    setAutonomy(DEFAULT_AUTONOMY[l]);
    setSubjects(SUGGESTED_SUBJECTS[l]);
    setGoalType(l === 'pos' ? 'projeto' : l === 'livre' ? 'concurso' : l === 'medio' ? 'prova' : 'rotina');
    setStep(1);
  };
  const addDraft = () => {
    const n = draft.trim();
    if (n && !subjects.includes(n)) setSubjects([...subjects, n]);
    setDraft('');
  };
  const finish = async () => {
    try {
      await completeOnboarding(deps, {
        level: level!, autonomy, subjectNames: subjects, weekdays: days, periods, planStart: planStart || undefined,
        goal: goalTitle.trim() ? { type: goalType, title: goalTitle, deadline: deadline || undefined } : undefined,
      });
      onDone();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const nav = (back: number, next: () => void, disabled = false, label = 'Continuar') => (
    <div className="row">
      <button className="secondary" onClick={() => setStep(back)}>Voltar</button>
      <button disabled={disabled} onClick={next}>{label}</button>
    </div>
  );

  return (
    <main className="app">
      <div className="progress-dots" aria-label={`Passo ${step + 1} de ${STEPS}`}>{Array.from({ length: STEPS }, (_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
      {step === 0 && (
        <section>
          <div className="welcome"><Logo size={72} /><div className="wordmark big-word">Estuda</div><p className="muted">Planeje, estude e revise com a técnica certa para cada momento.</p></div>
          <h1>Como você vai usar o Estuda?</h1>
          <p className="muted">Isso ajusta as sessões, a linguagem e as sugestões. Você pode mudar depois.</p>
          <div className="stack">
            {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => (
              <button key={l} className="secondary big" onClick={() => pickLevel(l)}>{LEVEL_LABEL[l]}</button>
            ))}
          </div>
        </section>
      )}
      {step === 1 && (
        <section>
          <h1>Qual é o seu objetivo?</h1>
          <label>Tipo
            <select value={goalType} onChange={(e) => setGoalType(e.target.value as GoalType)}>
              {(Object.keys(GOAL_LABEL) as GoalType[]).map((g) => <option key={g} value={g}>{GOAL_LABEL[g]}</option>)}
            </select>
          </label>
          <label>Nome do objetivo (opcional)
            <input value={goalTitle} placeholder="Ex.: ENEM, prova de Biologia, TCC" onChange={(e) => setGoalTitle(e.target.value)} />
          </label>
          <label>Prazo (opcional)
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
          </label>
          {nav(0, () => setStep(2))}
        </section>
      )}
      {step === 2 && (
        <section>
          <h1>Quanta orientação você quer?</h1>
          <div className="stack">
            {(Object.keys(AUTONOMY_LABEL) as Autonomy[]).map((a) => (
              <button key={a} className={`big ${autonomy === a ? '' : 'secondary'}`} onClick={() => setAutonomy(a)}>{AUTONOMY_LABEL[a]}</button>
            ))}
          </div>
          {nav(1, () => setStep(3))}
        </section>
      )}
      {step === 3 && (
        <section>
          <h1>Suas disciplinas ou áreas</h1>
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
          {nav(2, () => setStep(4), subjects.length === 0)}
        </section>
      )}
      {step === 4 && (
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
          <label>Começar o plano em (opcional)
            <input type="date" value={planStart} min={new Date().toLocaleDateString('en-CA')} onChange={(e) => setPlanStart(e.target.value)} />
          </label>
          <p className="muted">Sem data, o plano começa agora e usa só os horários que ainda não passaram.</p>
          {error && <p className="warn">{error}</p>}
          {nav(3, finish, days.length === 0 || periods.length === 0, 'Gerar meu plano')}
        </section>
      )}
    </main>
  );
}
