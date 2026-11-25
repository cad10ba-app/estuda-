import { useState } from 'react';
import { Subjects } from './Subjects';
import { Projects } from './Projects';

export function Content({ onChange }: { onChange: () => void }) {
  const [seg, setSeg] = useState<'disciplinas' | 'projetos'>('disciplinas');
  return (
    <main className="app">
      <h1>Conteúdos e projetos</h1>
      <div className="seg" role="tablist">
        <button role="tab" aria-selected={seg === 'disciplinas'} className={seg === 'disciplinas' ? 'on' : ''} onClick={() => setSeg('disciplinas')}>Disciplinas</button>
        <button role="tab" aria-selected={seg === 'projetos'} className={seg === 'projetos' ? 'on' : ''} onClick={() => setSeg('projetos')}>Projetos</button>
      </div>
      {seg === 'disciplinas' ? <Subjects onChange={onChange} /> : <Projects onChange={onChange} embedded />}
    </main>
  );
}
