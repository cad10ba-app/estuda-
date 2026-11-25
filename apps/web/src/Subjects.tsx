import { useCallback, useEffect, useState } from 'react';
import type { Deadline, DeadlineKind, Subject, Topic, TopicStatus } from '@estuda/engine';
import { addDeadline, addSubject, addTopic, markStudied, removeDeadline, removeSubject, removeTopic, setTopicStatus, updateSubject } from '@estuda/core';
import { deps } from './store';
import { Availability } from './Availability';

const KINDS: DeadlineKind[] = ['prova', 'entrega', 'simulado'];
const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });

export function Subjects({ onChange }: { onChange: () => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setSubjects(await deps.store.listSubjects());
    setDeadlines(await deps.store.listDeadlines());
    setTopics(await deps.store.listTopics());
  }, []);
  useEffect(() => { void load(); }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    try {
      setError('');
      await fn();
      await load();
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <main className="app">
      <h1>Disciplinas</h1>
      <Availability onChange={onChange} />
      {error && <p className="warn">{error}</p>}
      <div className="row">
        <input value={name} placeholder="Nova disciplina" onChange={(e) => setName(e.target.value)} />
        <button onClick={() => run(async () => { await addSubject(deps, { name, weight: 3, difficulty: 3 }); setName(''); })}>Adicionar</button>
      </div>
      <ul className="blocks">
        {subjects.map((s) => (
          <li key={s.id} className="card">
            <div className="row between">
              <strong>{s.name}</strong>
              <button className="link" onClick={() => run(() => removeSubject(deps, s.id))}>Remover</button>
            </div>
            <label>Peso (importância): {s.weight}
              <input type="range" min={1} max={5} value={s.weight} onChange={(e) => run(() => updateSubject(deps, { ...s, weight: +e.target.value }))} />
            </label>
            <label>Dificuldade: {s.difficulty}
              <input type="range" min={1} max={5} value={s.difficulty} onChange={(e) => run(() => updateSubject(deps, { ...s, difficulty: +e.target.value }))} />
            </label>
            {deadlines.filter((d) => d.subjectId === s.id).sort((a, b) => a.date.getTime() - b.date.getTime()).map((d) => (
              <div key={d.id} className="row between muted">
                <span>{d.kind} · {fmtDate(d.date)}</span>
                <button className="link" onClick={() => run(() => removeDeadline(deps, d.id))}>✕</button>
              </div>
            ))}
            <TopicList
              topics={topics.filter((t) => t.subjectId === s.id).sort((a, b) => a.order - b.order)}
              onAdd={(title) => run(() => addTopic(deps, { subjectId: s.id, title }))}
              onRemove={(id) => run(() => removeTopic(deps, id))}
              onStatus={(id, st) => run(() => setTopicStatus(deps, id, st))}
              onStudied={(id) => run(() => markStudied(deps, id))}
            />
            <DeadlineForm onAdd={(kind, date) => run(() => addDeadline(deps, { subjectId: s.id, kind, date }))} />
          </li>
        ))}
      </ul>
    </main>
  );
}

function DeadlineForm({ onAdd }: { onAdd: (kind: DeadlineKind, date: string) => void }) {
  const [kind, setKind] = useState<DeadlineKind>('prova');
  const [date, setDate] = useState('');
  return (
    <div className="row">
      <select value={kind} onChange={(e) => setKind(e.target.value as DeadlineKind)}>
        {KINDS.map((k) => <option key={k}>{k}</option>)}
      </select>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <button className="secondary" disabled={!date} onClick={() => { onAdd(kind, date); setDate(''); }}>+ Prazo</button>
    </div>
  );
}

const STATUS_LABEL: Record<TopicStatus, string> = { nao_visto: 'Não visto', estudando: 'Estudando', dominado: 'Dominado' };

function TopicList({ topics, onAdd, onRemove, onStatus, onStudied }: {
  topics: Topic[];
  onAdd: (title: string) => void;
  onRemove: (id: string) => void;
  onStatus: (id: string, s: TopicStatus) => void;
  onStudied: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const seen = topics.filter((t) => t.status !== 'nao_visto').length;
  return (
    <div className="topics">
      <button className="link" onClick={() => setOpen(!open)}>
        Tópicos ({seen}/{topics.length} vistos) {open ? '▲' : '▼'}
      </button>
      {open && (
        <>
          {topics.map((t) => (
            <div key={t.id} className="row between topic">
              <span className="grow">{t.title}</span>
              <select value={t.status} onChange={(e) => onStatus(t.id, e.target.value as TopicStatus)}>
                {(Object.keys(STATUS_LABEL) as TopicStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
              </select>
              {t.status === 'nao_visto' && <button className="link" title="Marca como estudado e agenda revisões" onClick={() => onStudied(t.id)}>Estudei</button>}
              <button className="link" aria-label="Remover tópico" onClick={() => onRemove(t.id)}>✕</button>
            </div>
          ))}
          <div className="row">
            <input value={title} placeholder="Novo tópico" onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && title.trim()) { onAdd(title); setTitle(''); } }} />
            <button className="secondary" disabled={!title.trim()} onClick={() => { onAdd(title); setTitle(''); }}>+</button>
          </div>
        </>
      )}
    </div>
  );
}
