import { useCallback, useEffect, useState } from 'react';
import type { ReviewGrade, Subject } from '@estuda/engine';
import { addCard, completeTopicReview, dueTopicReviews, gradeCard, reviewQueue, type Card, type DueTopicReview } from '@estuda/core';
import { deps } from './store';

const GRADES: { g: ReviewGrade; label: string }[] = [
  { g: 'errou', label: 'Errei' },
  { g: 'dificil', label: 'Difícil' },
  { g: 'bom', label: 'Bom' },
  { g: 'facil', label: 'Fácil' },
];

export function Review({ onChange }: { onChange: () => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [queue, setQueue] = useState<Card[]>([]);
  const [topicDue, setTopicDue] = useState<DueTopicReview[]>([]);
  const [stats, setStats] = useState({ dueTotal: 0, reviewedToday: 0 });
  const [total, setTotal] = useState(0);
  const [shown, setShown] = useState(false);
  const [adding, setAdding] = useState(false);
  const [subjectId, setSubjectId] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const subs = await deps.store.listSubjects();
    setSubjects(subs);
    setSubjectId((cur) => cur || subs[0]?.id || '');
    const r = await reviewQueue(deps);
    setQueue(r.queue);
    setStats({ dueTotal: r.dueTotal, reviewedToday: r.reviewedToday });
    setTotal((await deps.store.listCards()).length);
    setTopicDue(await dueTopicReviews(deps));
  }, []);
  useEffect(() => { void load(); }, [load]);

  const current = queue[0];
  const subjectName = (id: string) => subjects.find((s) => s.id === id)?.name ?? id;

  const grade = async (g: ReviewGrade) => {
    if (!current) return;
    await gradeCard(deps, current.id, g);
    setShown(false);
    await load();
    onChange();
  };

  const add = async () => {
    try {
      setError('');
      await addCard(deps, { subjectId, front, back });
      setFront(''); setBack('');
      await load();
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <main className="app">
      <h1>Revisar</h1>
      <p className="muted">
        {stats.dueTotal} vencido(s) · {stats.reviewedToday} revisado(s) hoje · {total} cartão(ões)
      </p>

      {topicDue.length > 0 && (
        <section className="card">
          <strong>Revisões de tópicos</strong>
          <p className="muted">Releia/explique de memória e marque como revisado.</p>
          {topicDue.map(({ review, topic }) => (
            <div key={review.id} className="row between">
              <span className="grow">{subjectName(topic.subjectId)} · {topic.title}</span>
              <button className="secondary" onClick={async () => { await completeTopicReview(deps, review.id); await load(); onChange(); }}>Revisei</button>
            </div>
          ))}
        </section>
      )}

      {current ? (
        <section className="card flash">
          <p className="muted">{subjectName(current.subjectId)}</p>
          <p className="big-text">{current.front}</p>
          {shown ? (
            <>
              <p className="big-text answer">{current.back}</p>
              <div className="row">
                {GRADES.map(({ g, label }) => (
                  <button key={g} className={g === 'errou' ? 'secondary' : ''} onClick={() => grade(g)}>{label}</button>
                ))}
              </div>
            </>
          ) : (
            <button onClick={() => setShown(true)}>Mostrar resposta</button>
          )}
        </section>
      ) : (
        <p className="card">{total === 0 ? 'Crie seu primeiro cartão abaixo.' : '🎉 Nada para revisar agora.'}</p>
      )}

      <button className="secondary add-toggle" onClick={() => setAdding(!adding)}>{adding ? 'Fechar' : '+ Novo cartão'}</button>
      {adding && (
        <section className="card">
          {subjects.length === 0 ? (
            <p className="muted">Cadastre uma disciplina primeiro.</p>
          ) : (
            <>
              <select value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <textarea placeholder="Pergunta (frente)" value={front} onChange={(e) => setFront(e.target.value)} />
              <textarea placeholder="Resposta (verso)" value={back} onChange={(e) => setBack(e.target.value)} />
              {error && <p className="warn">{error}</p>}
              <button onClick={add}>Salvar cartão</button>
            </>
          )}
        </section>
      )}
    </main>
  );
}
