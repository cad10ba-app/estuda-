import { useCallback, useEffect, useState } from 'react';
import { MODEL_LABEL, type ProjectModel, type ProjectUnit } from '@estuda/engine';
import {
  REFERENCE_TYPES, addReference, createProject, deleteProjectAndReplan, formatABNT, logWriting,
  projectStatus, removeReference, rescheduleProject, setMilestoneDone, type Reference, type ProjectStatus,
} from '@estuda/core';
import { deps } from './store';

const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
const RISK_LABEL = { verde: '🟢 No ritmo', amarelo: '🟡 Atenção', vermelho: '🔴 Em risco' } as const;

export function Projects({ onChange, embedded }: { onChange: () => void; embedded?: boolean }) {
  const [list, setList] = useState<ProjectStatus[]>([]);
  const [refs, setRefs] = useState<Reference[]>([]);
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const load = useCallback(async () => {
    const projects = await deps.store.listProjects();
    setList(await Promise.all(projects.map((p) => projectStatus(deps, p.id))));
    setRefs(await deps.store.listReferences());
  }, []);
  useEffect(() => { void load(); }, [load]);

  const run = async (fn: () => Promise<unknown>) => {
    try {
      setError(''); setInfo('');
      const r = (await fn()) as { warnings?: string[] } | undefined;
      if (r?.warnings?.length) setInfo(r.warnings.join(' '));
      await load();
      onChange();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const Wrap = embedded ? 'section' : 'main';
  return (
    <Wrap className={embedded ? undefined : 'app'}>
      <p className="muted">TCC, dissertação, tese ou artigo, com etapas e metas de escrita.</p>
      {error && <p className="warn">{error}</p>}
      {info && <p className="warn">{info}</p>}

      {list.length === 0 && !creating && <p className="card">Nenhum projeto ainda.</p>}
      {list.map((st) => (
        <ProjectCard key={st.project.id} st={st} refs={refs.filter((r) => r.projectId === st.project.id)}
          open={open === st.project.id} onToggle={() => setOpen(open === st.project.id ? null : st.project.id)} run={run} />
      ))}

      {creating ? (
        <CreateForm onCancel={() => setCreating(false)} onCreate={(input) => run(async () => { const r = await createProject(deps, input); setCreating(false); setOpen(r.project.id); return r; })} />
      ) : (
        <button className="add-toggle" onClick={() => setCreating(true)}>+ Novo projeto</button>
      )}
    </Wrap>
  );
}

function CreateForm({ onCreate, onCancel }: {
  onCreate: (i: { model: ProjectModel; title: string; finalDate: string; hoursPerWeek: number; unit: ProjectUnit; targetUnits?: number }) => void;
  onCancel: () => void;
}) {
  const [model, setModel] = useState<ProjectModel>('tcc');
  const [title, setTitle] = useState('');
  const [finalDate, setFinalDate] = useState('');
  const [hours, setHours] = useState(6);
  const [unit, setUnit] = useState<ProjectUnit>('palavras');
  const [target, setTarget] = useState('');
  return (
    <section className="card">
      <label>Tipo
        <select value={model} onChange={(e) => setModel(e.target.value as ProjectModel)}>
          {(Object.keys(MODEL_LABEL) as ProjectModel[]).map((m) => <option key={m} value={m}>{MODEL_LABEL[m]}</option>)}
        </select>
      </label>
      <label>Título<input value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label>Data final (entrega/defesa)<input type="date" value={finalDate} onChange={(e) => setFinalDate(e.target.value)} /></label>
      <label>Horas por semana: {hours}
        <input type="range" min={1} max={40} value={hours} onChange={(e) => setHours(+e.target.value)} />
      </label>
      <div className="row">
        <input type="number" min={0} placeholder="Meta total (opcional)" value={target} onChange={(e) => setTarget(e.target.value)} />
        <select value={unit} onChange={(e) => setUnit(e.target.value as ProjectUnit)}>
          <option value="palavras">palavras</option><option value="paginas">páginas</option>
        </select>
      </div>
      <div className="row">
        <button className="secondary" onClick={onCancel}>Cancelar</button>
        <button disabled={!title.trim() || !finalDate} onClick={() => onCreate({ model, title, finalDate, hoursPerWeek: hours, unit, targetUnits: target ? +target : undefined })}>Criar</button>
      </div>
    </section>
  );
}

function ProjectCard({ st, refs, open, onToggle, run }: {
  st: ProjectStatus; refs: Reference[]; open: boolean; onToggle: () => void; run: (fn: () => Promise<unknown>) => void;
}) {
  const { project: p, milestones, risk } = st;
  const [amount, setAmount] = useState('');
  return (
    <section className="card project">
      <button className="link title" onClick={onToggle}>
        <strong>{p.title}</strong> <span className="muted">· {MODEL_LABEL[p.model]} · até {fmt(p.finalDate)} {open ? '▲' : '▼'}</span>
      </button>
      <div className="row between">
        <span>{RISK_LABEL[risk.level]}</span>
        <span className="muted">{Math.round(risk.completed * 100)}% feito · esperado {Math.round(risk.expected * 100)}%</span>
      </div>
      <div className="bar"><div style={{ width: `${Math.round(risk.completed * 100)}%` }} /></div>
      {st.nextMilestone && <p className="muted">Próximo marco: {st.nextMilestone.title} ({fmt(st.nextMilestone.targetDate)})</p>}

      {open && (
        <>
          {risk.level !== 'verde' && (
            <p className="warn">Você está atrás do ritmo. <button className="link inline" onClick={() => run(() => rescheduleProject(deps, p.id))}>Redistribuir marcos pendentes</button></p>
          )}

          <h3>Escrita de hoje</h3>
          <p className="muted">
            {st.writtenToday} {p.unit} hoje · {st.written}{p.targetUnits ? `/${p.targetUnits}` : ''} no total
            {st.goalToday !== undefined && <> · meta de hoje: <strong>{st.goalToday}</strong></>}
          </p>
          <div className="row">
            <input type="number" min={1} placeholder={`Quantas ${p.unit}?`} value={amount} onChange={(e) => setAmount(e.target.value)} />
            <button className="secondary" disabled={!amount} onClick={() => run(async () => { await logWriting(deps, { projectId: p.id, amount: +amount }); setAmount(''); })}>Registrar</button>
          </div>

          <h3>Marcos</h3>
          {milestones.map((m) => (
            <label key={m.id} className="check">
              <input type="checkbox" checked={m.done} onChange={(e) => run(() => setMilestoneDone(deps, m.id, e.target.checked))} />
              <span className={m.done ? 'done' : ''}>{m.title}</span>
              <span className="muted">{fmt(m.targetDate)}</span>
            </label>
          ))}

          <h3>Referências (ABNT)</h3>
          <RefForm projectId={p.id} run={run} />
          {refs.map((r) => (
            <div key={r.id} className="row between ref">
              <span className="grow">{formatABNT(r)}</span>
              <button className="link" aria-label="Remover referência" onClick={() => run(() => removeReference(deps, r.id))}>✕</button>
            </div>
          ))}
          {refs.length > 0 && (
            <button className="secondary" onClick={async () => {
              const text = refs.map(formatABNT).sort((a, b) => a.localeCompare(b, 'pt-BR')).join('\n\n');
              try { await navigator.clipboard.writeText(text); } catch { /* sem permissão */ }
            }}>Copiar lista ordenada</button>
          )}

          <button className="link danger" onClick={() => { if (confirm('Excluir este projeto e seus dados?')) run(() => deleteProjectAndReplan(deps, p.id)); }}>Excluir projeto</button>
        </>
      )}
    </section>
  );
}

function RefForm({ projectId, run }: { projectId: string; run: (fn: () => Promise<unknown>) => void }) {
  const [type, setType] = useState<(typeof REFERENCE_TYPES)[number]>('livro');
  const [authors, setAuthors] = useState('');
  const [title, setTitle] = useState('');
  const [source, setSource] = useState('');
  const [year, setYear] = useState('');
  const [url, setUrl] = useState('');
  const add = () => run(async () => {
    await addReference(deps, {
      projectId, type, authors, title, source: source || undefined, year: year ? +year : undefined,
      url: url || undefined, accessedAt: type === 'site' ? new Date().toISOString().slice(0, 10) : undefined,
    });
    setAuthors(''); setTitle(''); setSource(''); setYear(''); setUrl('');
  });
  return (
    <div className="refform">
      <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
        {REFERENCE_TYPES.map((t) => <option key={t}>{t}</option>)}
      </select>
      <input placeholder="Autores: SOBRENOME, Nome; …" value={authors} onChange={(e) => setAuthors(e.target.value)} />
      <input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} />
      {type !== 'site' && <input placeholder={type === 'livro' ? 'Editora' : 'Periódico'} value={source} onChange={(e) => setSource(e.target.value)} />}
      {type === 'site' && <input placeholder="URL" value={url} onChange={(e) => setUrl(e.target.value)} />}
      <input type="number" placeholder="Ano" value={year} onChange={(e) => setYear(e.target.value)} />
      <button className="secondary" onClick={add}>+ Referência</button>
    </div>
  );
}
