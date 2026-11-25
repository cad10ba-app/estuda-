import { useCallback, useEffect, useState } from 'react';
import type { Deadline, DeadlineKind, Subject, TaskKind, Topic, TopicStatus } from '@estuda/engine';
import { TASK_KIND_LABEL } from '@estuda/engine';
import {
  GOAL_LABEL, addDeadline, addGoal, addSubject, addTask, addTopic, addUnit, attachSubjectToGoal, markStudied, moveTopicToUnit,
  removeDeadline, removeGoal, removeSubject, removeTask, removeTopic, removeUnit, setTaskDone, setTopicStatus, updateSubject,
  type Goal, type GoalType, type Task,
} from '@estuda/core';
import { deps } from './store';

const KINDS: DeadlineKind[] = ['prova', 'entrega', 'simulado'];
const fmtDate = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
const STATUS_LABEL: Record<TopicStatus, string> = { nao_visto: 'Não visto', estudando: 'Estudando', dominado: 'Dominado' };

export function Subjects({ onChange }: { onChange: () => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setSubjects(await deps.store.listSubjects());
    setDeadlines(await deps.store.listDeadlines());
    setTopics(await deps.store.listTopics());
    setTasks(await deps.store.listTasks());
    setGoals(await deps.store.listGoals());
  }, []);
  useEffect(() => { void load(); }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    try { setError(''); await fn(); await load(); onChange(); } catch (e) { setError((e as Error).message); }
  };

  return (
    <section>
      {error && <p className="warn">{error}</p>}

      <h2>Objetivos</h2>
      <GoalForm onAdd={(i) => run(() => addGoal(deps, i))} />
      {goals.map((g) => (
        <div key={g.id} className="row between">
          <span>{g.title} <span className="muted">· {GOAL_LABEL[g.type]}{g.deadline ? ` · até ${fmtDate(g.deadline)}` : ''}</span></span>
          <button className="link" aria-label="Remover objetivo" onClick={() => run(() => removeGoal(deps, g.id))}>✕</button>
        </div>
      ))}

      <h2>Disciplinas e áreas</h2>
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
            <label>Importância: {s.weight}
              <input type="range" min={1} max={5} value={s.weight} onChange={(e) => run(() => updateSubject(deps, { ...s, weight: +e.target.value }))} />
            </label>
            <label>Dificuldade: {s.difficulty}
              <input type="range" min={1} max={5} value={s.difficulty} onChange={(e) => run(() => updateSubject(deps, { ...s, difficulty: +e.target.value }))} />
            </label>
            {goals.length > 0 && (
              <label>Objetivo
                <select value={s.goalId ?? ''} onChange={(e) => run(() => attachSubjectToGoal(deps, s.id, e.target.value || undefined))}>
                  <option value="">Nenhum</option>
                  {goals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
                </select>
              </label>
            )}
            {deadlines.filter((d) => d.subjectId === s.id).sort((a, b) => a.date.getTime() - b.date.getTime()).map((d) => (
              <div key={d.id} className="row between muted">
                <span>{d.kind} · {fmtDate(d.date)}</span>
                <button className="link" onClick={() => run(() => removeDeadline(deps, d.id))}>✕</button>
              </div>
            ))}
            <DeadlineForm onAdd={(kind, date) => run(() => addDeadline(deps, { subjectId: s.id, kind, date }))} />
            <Tree subject={s} topics={topics.filter((t) => t.subjectId === s.id)} tasks={tasks.filter((t) => t.subjectId === s.id)} run={run} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function GoalForm({ onAdd }: { onAdd: (i: { type: GoalType; title: string; deadline?: string }) => void }) {
  const [type, setType] = useState<GoalType>('prova');
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  return (
    <div className="card">
      <select value={type} onChange={(e) => setType(e.target.value as GoalType)}>
        {(Object.keys(GOAL_LABEL) as GoalType[]).map((g) => <option key={g} value={g}>{GOAL_LABEL[g]}</option>)}
      </select>
      <input placeholder="Nome do objetivo" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
      <button className="secondary" disabled={!title.trim()} onClick={() => { onAdd({ type, title, deadline: deadline || undefined }); setTitle(''); setDeadline(''); }}>+ Objetivo</button>
    </div>
  );
}

function DeadlineForm({ onAdd }: { onAdd: (kind: DeadlineKind, date: string) => void }) {
  const [kind, setKind] = useState<DeadlineKind>('prova');
  const [date, setDate] = useState('');
  return (
    <div className="row">
      <select value={kind} onChange={(e) => setKind(e.target.value as DeadlineKind)}>{KINDS.map((k) => <option key={k}>{k}</option>)}</select>
      <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      <button className="secondary" disabled={!date} onClick={() => { onAdd(kind, date); setDate(''); }}>+ Prazo</button>
    </div>
  );
}

function Tree({ subject, topics, tasks, run }: { subject: Subject; topics: Topic[]; tasks: Task[]; run: (fn: () => Promise<unknown>) => void }) {
  const [open, setOpen] = useState(false);
  const [topicTitle, setTopicTitle] = useState('');
  const [unitTitle, setUnitTitle] = useState('');
  const units = topics.filter((t) => t.kind === 'unidade').sort((a, b) => a.order - b.order);
  const real = topics.filter((t) => t.kind !== 'unidade').sort((a, b) => a.order - b.order);
  const seen = real.filter((t) => t.status !== 'nao_visto').length;

  const topicRow = (t: Topic) => (
    <div key={t.id} className="topic-block">
      <div className="row between topic">
        <span className="grow">{t.title}</span>
        <select value={t.status} onChange={(e) => run(() => setTopicStatus(deps, t.id, e.target.value as TopicStatus))}>
          {(Object.keys(STATUS_LABEL) as TopicStatus[]).map((k) => <option key={k} value={k}>{STATUS_LABEL[k]}</option>)}
        </select>
        {t.status === 'nao_visto' && <button className="link" onClick={() => run(() => markStudied(deps, t.id))}>Estudei</button>}
        <button className="link" aria-label="Remover tópico" onClick={() => run(() => removeTopic(deps, t.id))}>✕</button>
      </div>
      {units.length > 0 && (
        <select aria-label="Unidade" value={t.parentId ?? ''} onChange={(e) => run(() => moveTopicToUnit(deps, t.id, e.target.value || undefined))}>
          <option value="">Sem unidade</option>
          {units.map((u) => <option key={u.id} value={u.id}>{u.title}</option>)}
        </select>
      )}
      <TaskList tasks={tasks.filter((x) => x.topicId === t.id)} onAdd={(i) => run(() => addTask(deps, { ...i, subjectId: subject.id, topicId: t.id }))} run={run} />
    </div>
  );

  return (
    <div className="topics">
      <button className="link" onClick={() => setOpen(!open)}>Conteúdo ({seen}/{real.length} vistos) {open ? '▲' : '▼'}</button>
      {open && (
        <>
          {units.map((u) => (
            <div key={u.id} className="unit">
              <div className="row between"><strong>{u.title}</strong>
                <button className="link" aria-label="Remover unidade" onClick={() => run(() => removeUnit(deps, u.id))}>✕</button></div>
              {real.filter((t) => t.parentId === u.id).map(topicRow)}
            </div>
          ))}
          {real.filter((t) => !t.parentId || !units.some((u) => u.id === t.parentId)).map(topicRow)}
          <div className="row">
            <input placeholder="Nova unidade" value={unitTitle} onChange={(e) => setUnitTitle(e.target.value)} />
            <button className="secondary" disabled={!unitTitle.trim()} onClick={() => { run(() => addUnit(deps, { subjectId: subject.id, title: unitTitle })); setUnitTitle(''); }}>+ Unidade</button>
          </div>
          <div className="row">
            <input placeholder="Novo tópico" value={topicTitle} onChange={(e) => setTopicTitle(e.target.value)} />
            <button className="secondary" disabled={!topicTitle.trim()} onClick={() => { run(() => addTopic(deps, { subjectId: subject.id, title: topicTitle })); setTopicTitle(''); }}>+ Tópico</button>
          </div>
          <p className="muted">Tarefas gerais da disciplina:</p>
          <TaskList tasks={tasks.filter((x) => !x.topicId)} onAdd={(i) => run(() => addTask(deps, { ...i, subjectId: subject.id }))} run={run} />
        </>
      )}
    </div>
  );
}

function TaskList({ tasks, onAdd, run }: {
  tasks: Task[]; onAdd: (i: { title: string; kind: TaskKind; estimatedMin: number }) => void; run: (fn: () => Promise<unknown>) => void;
}) {
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<TaskKind>('memorizar');
  return (
    <div className="tasks">
      {tasks.map((t) => (
        <label key={t.id} className="check">
          <input type="checkbox" checked={t.done} onChange={(e) => run(() => setTaskDone(deps, t.id, e.target.checked))} />
          <span className={t.done ? 'done' : ''}>{t.title} <span className="muted">· {TASK_KIND_LABEL[t.kind]} · {t.estimatedMin} min</span></span>
          <button type="button" className="link" aria-label="Remover tarefa" onClick={(e) => { e.preventDefault(); run(() => removeTask(deps, t.id)); }}>✕</button>
        </label>
      ))}
      <div className="row">
        <input placeholder="Nova tarefa" value={title} onChange={(e) => setTitle(e.target.value)} />
        <select value={kind} onChange={(e) => setKind(e.target.value as TaskKind)} aria-label="Tipo de tarefa">
          {(Object.keys(TASK_KIND_LABEL) as TaskKind[]).map((k) => <option key={k} value={k}>{TASK_KIND_LABEL[k]}</option>)}
        </select>
        <button className="secondary" disabled={!title.trim()} onClick={() => { onAdd({ title, kind, estimatedMin: 30 }); setTitle(''); }}>+</button>
      </div>
    </div>
  );
}
