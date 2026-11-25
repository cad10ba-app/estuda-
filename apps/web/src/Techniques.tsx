import { useState } from 'react';
import { EVIDENCE, STRENGTH_LABEL, TECHNIQUES, sourcesFor, type Technique } from '@estuda/engine';

const MODE_LABEL = { fund2: 'Fundamental', medio: 'Médio', superior: 'Superior', pos: 'Pesquisa', livre: 'Objetivo livre' } as const;

export function Techniques() {
  const [open, setOpen] = useState<string | null>(null);
  const available = TECHNIQUES.filter((t) => t.mvp);
  const soon = TECHNIQUES.filter((t) => !t.mvp);
  const card = (t: Technique) => (
    <li key={t.id} className="card">
      <button className="link title" onClick={() => setOpen(open === t.id ? null : t.id)}>
        <strong>{t.name}</strong> {!t.mvp && <span className="badge">em breve</span>} <span className="muted">{open === t.id ? '▲' : '▼'}</span>
      </button>
      <p><span className={`ev ev-${EVIDENCE[t.id].strength}`}>{STRENGTH_LABEL[EVIDENCE[t.id].strength]}</span></p>
      <p className="muted">{t.description}</p>
      {open === t.id && (
        <div className="detail">
          <p><strong>Objetivo:</strong> {t.objective}</p>
          <p><strong>Indicada para:</strong> {t.activities.join(', ')}</p>
          <p><strong>Modos:</strong> {t.modes.map((m) => MODE_LABEL[m]).join(', ')}</p>
          <p><strong>Como fazer:</strong></p>
          <ol>{t.howTo.map((h) => <li key={h}>{h}</li>)}</ol>
          <p><strong>Duração sugerida:</strong> {t.defaultMin} min (ajustável)</p>
          <p><strong>Materiais:</strong> {t.materials}</p>
          <p><strong>Como verificar:</strong> {t.verification}</p>
          <p><strong>Alternativa acessível:</strong> {t.accessible}</p>
          {t.review && <p><strong>Revisão:</strong> {t.review}</p>}
          <p className="muted"><strong>Limites:</strong> {t.limits}</p>
          <div className="evidence">
            <p><strong>O que a pesquisa indica:</strong> {EVIDENCE[t.id].summary}</p>
            <p><strong>Cuidados:</strong> {EVIDENCE[t.id].caveat}</p>
            {sourcesFor(t.id).length > 0 && (
              <>
                <p><strong>Fontes:</strong></p>
                <ul>{sourcesFor(t.id).map((src) => <li key={src.id}>{src.citation}</li>)}</ul>
              </>
            )}
            <p className="muted">Referências reunidas pelo app e ainda em revisão por especialista. Evidência não é garantia de resultado individual.</p>
          </div>
        </div>
      )}
    </li>
  );
  return (
    <main className="app">
      <h1>Técnicas</h1>
      <p className="muted">O app recomenda uma técnica para cada sessão e explica por quê. Você pode aceitar, trocar ou personalizar. Nenhuma técnica garante resultado.</p>
      <h2>Disponíveis agora</h2>
      <ul className="blocks">{available.map(card)}</ul>
      <h2>Próximas fases</h2>
      <ul className="blocks">{soon.map(card)}</ul>
    </main>
  );
}
