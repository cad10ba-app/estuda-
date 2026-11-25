import { useState } from 'react';
import { DELETE_CONFIRMATION, deleteAllData, exportDataJSON } from '@estuda/core';
import { deps } from './store';
import { saveRun } from './SessionRun';

export function Privacy({ embedded }: { embedded?: boolean }) {
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const exportNow = async () => {
    const json = await exportDataJSON(deps);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: `estuda-dados-${new Date().toISOString().slice(0, 10)}.json` });
    a.click();
    URL.revokeObjectURL(url);
    setMsg('Arquivo gerado. Ele contém todos os seus dados deste aparelho.');
  };

  const wipe = async () => {
    try {
      await deleteAllData(deps, confirm);
      saveRun(null);
      location.reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const Wrap = embedded ? 'section' : 'main';
  return (
    <Wrap className={embedded ? undefined : 'app'}>
      {embedded ? <h2>Privacidade e dados</h2> : <h1>Privacidade e dados</h1>}
      <p className="muted">Seus dados ficam somente neste aparelho. Nada é enviado a servidores.</p>

      <section className="card">
        <strong>Exportar meus dados</strong>
        <p className="muted">Baixa um arquivo JSON com disciplinas, plano, sessões, cartões, projetos e referências.</p>
        <button onClick={exportNow}>Baixar JSON</button>
        {msg && <p className="muted">{msg}</p>}
      </section>

      <section className="card">
        <strong>Excluir todos os dados</strong>
        <p className="muted">Apaga tudo permanentemente, sem como desfazer. Exporte antes, se quiser guardar uma cópia.</p>
        <input placeholder={`Digite ${DELETE_CONFIRMATION}`} value={confirm} onChange={(e) => { setConfirm(e.target.value); setError(''); }} />
        {error && <p className="warn">{error}</p>}
        <button className="danger-btn" disabled={confirm.trim() !== DELETE_CONFIRMATION} onClick={wipe}>Excluir tudo</button>
      </section>
    </Wrap>
  );
}
