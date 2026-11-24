export type MoreScreen = 'menu' | 'progresso' | 'projetos' | 'disciplinas';

export function More({ onPick }: { onPick: (s: MoreScreen) => void }) {
  const items: { id: MoreScreen; title: string; sub: string }[] = [
    { id: 'progresso', title: 'Progresso', sub: 'Resumo da semana e retrospectiva' },
    { id: 'projetos', title: 'Projetos', sub: 'TCC, dissertação, tese, artigo' },
    { id: 'disciplinas', title: 'Disciplinas', sub: 'Disciplinas, tópicos, prazos e disponibilidade' },
  ];
  return (
    <main className="app">
      <h1>Mais</h1>
      <div className="stack">
        {items.map((i) => (
          <button key={i.id} className="secondary big" onClick={() => onPick(i.id)}>
            <strong>{i.title}</strong><br /><span className="muted">{i.sub}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
