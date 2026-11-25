import type { Deps, Reference, ReferenceType } from './ports';

/** Formata uma referência em ABNT (NBR 6023), em texto simples. */
export function formatABNT(r: Reference): string {
  const authors = r.authors.trim().replace(/\.$/, '').toUpperCase().replace(/;\s*/g, '; ');
  const year = r.year ? `${r.year}` : 's.d.';
  if (r.type === 'livro') {
    const pub = [r.place || 's.l.', r.source || 's.n.'].join(': ');
    return `${authors}. ${r.title}. ${pub}, ${year}.`;
  }
  if (r.type === 'artigo') {
    const parts = [r.source, r.volume && `v. ${r.volume}`, r.pages && `p. ${r.pages}`, year].filter(Boolean);
    return `${authors}. ${r.title}. ${parts.join(', ')}.`;
  }
  const access = r.accessedAt ? ` Acesso em: ${formatBR(r.accessedAt)}.` : '';
  return `${authors}. ${r.title}. ${year}. Disponível em: ${r.url ?? ''}.${access}`;
}

function formatBR(iso: string): string {
  const [y, m, d] = iso.split('-');
  const meses = ['jan.', 'fev.', 'mar.', 'abr.', 'maio', 'jun.', 'jul.', 'ago.', 'set.', 'out.', 'nov.', 'dez.'];
  return `${Number(d)} ${meses[Number(m) - 1] ?? ''} ${y}`;
}

export async function addReference(deps: Deps, input: Omit<Reference, 'id'>): Promise<Reference> {
  if (!input.authors.trim() || !input.title.trim()) throw new Error('Autor(es) e título são obrigatórios.');
  if (input.type === 'site' && !input.url?.trim()) throw new Error('Informe a URL do site.');
  const ref: Reference = { ...input, id: `${deps.clock.now().getTime()}-${Math.random().toString(36).slice(2, 6)}` };
  await deps.store.saveReference(ref);
  return ref;
}

export async function removeReference(deps: Deps, id: string) {
  await deps.store.deleteReference(id);
}

/** Lista de referências do projeto em ordem alfabética (ABNT), uma por linha. */
export async function referencesABNT(deps: Deps, projectId: string): Promise<string[]> {
  const refs = (await deps.store.listReferences()).filter((r) => r.projectId === projectId);
  return refs.map(formatABNT).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

export const REFERENCE_TYPES: ReferenceType[] = ['livro', 'artigo', 'site'];
