import { useCallback, useEffect, useState } from 'react';
import type { Subject } from '@estuda/engine';
import { applyRetrospective, suggestionsFor, weeklyReport, type RetrospectiveAnswers, type WeeklyReport } from '@estuda/core';
import { deps } from './store';

const pct = (n: number) => `${Math.round(n * 100)}%`;

export function Progress({ onChange }: { onChange: () => void }) {
  const [report, setReport] = useState<WeeklyReport | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [retro, setRetro] = useState(false);
  const [load, setLoad] = useState<RetrospectiveAnswers['load']>('ok');
  const [hard, setHard] = useState('');
  const [result, setResult] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    setReport(await weeklyReport(deps));
    setSubjects(await deps.store.listSubjects());
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);

  if (!report) return <main className="app"><p className="muted">Carregando…</p></main>;
  const name = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;
  const suggestions = suggestionsFor(report);

  const apply = async () => {
    setResult(await applyRetrospective(deps, { load, hardSubjectId: hard || undefined }));
    setRetro(false);
    await refresh();
    onChange();
  };

  return (
    <main className="app">
      <h1>Progresso</h1>
      <p className="muted">Últimos 7 dias</p>

      <div className="stats">
        <div className="stat"><strong>{report.streak}</strong><span>dias seguidos</span></div>
        <div className="stat"><strong>{report.blocksPast ? pct(report.adherence) : '—'}</strong><span>blocos cumpridos</span></div>
        <div className="stat"><strong>{report.actualMin}</strong><span>de {report.plannedMin} min</span></div>
        <div className="stat"><strong>{report.cardsReviewed}</strong><span>cartões revisados</span></div>
      </div>

      <h2>Por disciplina</h2>
      {report.bySubject.length === 0 && <p className="muted">Sem dados ainda.</p>}
      {report.bySubject.map((s) => {
        const ratio = s.plannedMin ? Math.min(1, s.actualMin / s.plannedMin) : s.actualMin ? 1 : 0;
        return (
          <div key={s.subjectId} className="bar-row">
            <div className="row between"><span>{name(s.subjectId)}</span><span className="muted">{s.actualMin}/{s.plannedMin} min</span></div>
            <div className="bar" role="img" aria-label={`${Math.round(ratio * 100)}% do planejado`}><div style={{ width: pct(ratio) }} /></div>
          </div>
        );
      })}

      <h2>Retrospectiva semanal</h2>
      {suggestions.map((s) => (
        <p key={s.text} className={s.kind === 'ok' ? 'muted' : 'card'}>
          {s.subjectId ? <strong>{name(s.subjectId)}: </strong> : null}{s.text}
        </p>
      ))}
      {result.length > 0 && <p className="card">{result.map((r) => <span key={r}>{r}<br /></span>)}</p>}

      {!retro ? (
        <button className="secondary add-toggle" onClick={() => setRetro(true)}>Fazer retrospectiva</button>
      ) : (
        <section className="card">
          <label>1. Como foi a carga desta semana?
            <select value={load} onChange={(e) => setLoad(e.target.value as RetrospectiveAnswers['load'])}>
              <option value="leve">Leve (posso mais)</option>
              <option value="ok">Boa</option>
              <option value="pesada">Pesada demais</option>
            </select>
          </label>
          <label>2. Qual disciplina pareceu mais difícil?
            <select value={hard} onChange={(e) => setHard(e.target.value)}>
              <option value="">Nenhuma</option>
              {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
          <p className="muted">3. Pense: o que funcionou e o que você muda na próxima semana?</p>
          <div className="row">
            <button className="secondary" onClick={() => setRetro(false)}>Cancelar</button>
            <button onClick={apply}>Aplicar ao plano</button>
          </div>
        </section>
      )}
    </main>
  );
}
