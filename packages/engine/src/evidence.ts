import type { TechniqueId } from './techniques';

/**
 * Base de evidência (docs/14). Cada técnica aponta suas fontes e um grau de evidência.
 * ATENÇÃO: as referências foram reunidas a partir de literatura bem conhecida, mas ainda
 * NÃO foram conferidas por um especialista (`verified: false`). Nada aqui é promessa de resultado.
 */
export type EvidenceStrength = 'forte' | 'moderada' | 'limitada' | 'nao_avaliada';

export interface Source {
  id: string;
  citation: string;
  kind: 'meta-analise' | 'revisao' | 'experimento' | 'guia' | 'algoritmo' | 'origem-do-metodo';
  /** Conferida por pessoa/especialista? */
  verified: boolean;
}

export const SOURCES: Source[] = [
  { id: 'dunlosky2013', kind: 'revisao', verified: false, citation: 'Dunlosky, J.; Rawson, K. A.; Marsh, E. J.; Nathan, M. J.; Willingham, D. T. (2013). Improving students’ learning with effective learning techniques. Psychological Science in the Public Interest, 14(1), 4–58.' },
  { id: 'roediger2006', kind: 'experimento', verified: false, citation: 'Roediger, H. L.; Karpicke, J. D. (2006). Test-enhanced learning: taking memory tests improves long-term retention. Psychological Science, 17(3), 249–255.' },
  { id: 'karpicke2011', kind: 'experimento', verified: false, citation: 'Karpicke, J. D.; Blunt, J. R. (2011). Retrieval practice produces more learning than elaborative studying with concept mapping. Science, 331(6018), 772–775.' },
  { id: 'adesope2017', kind: 'meta-analise', verified: false, citation: 'Adesope, O. O.; Trevisan, D. A.; Sundararajan, N. (2017). Rethinking the use of tests: a meta-analysis of practice testing. Review of Educational Research, 87(3), 659–701.' },
  { id: 'cepeda2006', kind: 'meta-analise', verified: false, citation: 'Cepeda, N. J.; Pashler, H.; Vul, E.; Wixted, J. T.; Rohrer, D. (2006). Distributed practice in verbal recall tasks: a review and quantitative synthesis. Psychological Bulletin, 132(3), 354–380.' },
  { id: 'pashler2007', kind: 'guia', verified: false, citation: 'Pashler, H.; Bain, P.; Bottge, B.; Graesser, A.; Koedinger, K.; McDaniel, M.; Metcalfe, J. (2007). Organizing instruction and study to improve student learning (NCER 2007-2004). Institute of Education Sciences.' },
  { id: 'brunmair2019', kind: 'meta-analise', verified: false, citation: 'Brunmair, M.; Richter, T. (2019). Similarity matters: a meta-analysis of interleaved learning and its moderators. Psychological Bulletin, 145(11), 1029–1052.' },
  { id: 'rohrer2020', kind: 'experimento', verified: false, citation: 'Rohrer, D.; Dedrick, R. F.; Hartwig, M. K.; Cheung, C.-N. (2020). A randomized controlled trial of interleaved mathematics practice. Journal of Educational Psychology, 112(1), 40–52.' },
  { id: 'chi1994', kind: 'experimento', verified: false, citation: 'Chi, M. T. H.; de Leeuw, N.; Chiu, M.-H.; LaVancher, C. (1994). Eliciting self-explanations improves understanding. Cognitive Science, 18(3), 439–477.' },
  { id: 'ariga2011', kind: 'experimento', verified: false, citation: 'Ariga, A.; Lleras, A. (2011). Brief and rare mental “breaks” keep you focused: deactivation and reactivation of task goals preempt vigilance decrements. Cognition, 118(3), 439–443.' },
  { id: 'cirillo2006', kind: 'origem-do-metodo', verified: false, citation: 'Cirillo, F. (2006). The Pomodoro Technique. Descrição do método (não é estudo científico).' },
  { id: 'ye2022', kind: 'algoritmo', verified: false, citation: 'Ye, J.; Su, J.; Cao, Y. (2022). A stochastic shortest path algorithm for optimizing spaced repetition scheduling. KDD ’22. (Base do FSRS; trata do agendamento, não prova ganho de aprendizagem por si só.)' },
];

export interface TechniqueEvidence {
  technique: TechniqueId;
  strength: EvidenceStrength;
  /** O que a literatura sugere, em linguagem simples. */
  summary: string;
  /** Limites e condições (onde a evidência é menor). */
  caveat: string;
  sourceIds: string[];
  /** Situação da revisão por especialista. */
  review: 'a_revisar' | 'revisada';
}

export const STRENGTH_LABEL: Record<EvidenceStrength, string> = {
  forte: 'Evidência forte', moderada: 'Evidência moderada', limitada: 'Evidência limitada', nao_avaliada: 'Ainda não avaliada',
};

export const EVIDENCE: Record<TechniqueId, TechniqueEvidence> = {
  recuperacao_ativa: {
    technique: 'recuperacao_ativa', strength: 'forte', review: 'a_revisar',
    summary: 'Tentar lembrar sem consultar tende a gerar mais retenção a longo prazo do que reler ou reestudar, em diversos conteúdos e idades.',
    caveat: 'Os efeitos variam com o material e a idade; ajuda mais quando há feedback e algum estudo prévio.',
    sourceIds: ['roediger2006', 'dunlosky2013', 'adesope2017', 'karpicke2011'],
  },
  repeticao_espacada: {
    technique: 'repeticao_espacada', strength: 'forte', review: 'a_revisar',
    summary: 'Distribuir as revisões ao longo do tempo costuma reter mais do que concentrar tudo de uma vez; o intervalo ideal depende de quanto tempo se quer lembrar.',
    caveat: 'A maior parte dos estudos usa tarefas de memória; não substitui entender o assunto. O FSRS organiza os intervalos, mas o ganho depende de a pessoa revisar com regularidade.',
    sourceIds: ['cepeda2006', 'dunlosky2013', 'pashler2007', 'ye2022'],
  },
  pratica_exercicios: {
    technique: 'pratica_exercicios', strength: 'moderada', review: 'a_revisar',
    summary: 'Resolver exercícios com correção e feedback combina testagem e prática; as diretrizes educacionais recomendam quizzes e prática com feedback.',
    caveat: 'Evidência em parte indireta (testagem e prática com feedback). Sem analisar os erros, o ganho tende a ser menor.',
    sourceIds: ['pashler2007', 'adesope2017'],
  },
  pomodoro: {
    technique: 'pomodoro', strength: 'limitada', review: 'a_revisar',
    summary: 'Pausas breves podem ajudar a sustentar a atenção em tarefas longas. Não há evidência forte de que o formato 25/5 minutos seja o ideal.',
    caveat: 'Ajuda no foco, não é técnica de aprendizagem por si só; combine com recuperação ativa ou prática.',
    sourceIds: ['ariga2011', 'cirillo2006'],
  },
  pratica_intercalada: {
    technique: 'pratica_intercalada', strength: 'moderada', review: 'a_revisar',
    summary: 'Alternar tipos de problema ajuda a escolher o método certo; há bons resultados em matemática e em categorias visuais.',
    caveat: 'O efeito depende da semelhança entre os itens e do conteúdo; revisões anteriores encontraram evidência menor.',
    sourceIds: ['brunmair2019', 'rohrer2020', 'dunlosky2013'],
  },
  feynman: {
    technique: 'feynman', strength: 'moderada', review: 'a_revisar',
    summary: 'Explicar o assunto com as próprias palavras se aproxima da autoexplicação, que melhora a compreensão em vários estudos.',
    caveat: 'Evidência indireta: não foi testada como método Feynman nomeado. Pede algum conhecimento prévio.',
    sourceIds: ['chi1994', 'dunlosky2013'],
  },
  autoexplicacao: {
    technique: 'autoexplicacao', strength: 'moderada', review: 'a_revisar',
    summary: 'Justificar cada passo de uma resolução melhora a compreensão do raciocínio.',
    caveat: 'Os efeitos variam com a tarefa e o nível de conhecimento prévio.',
    sourceIds: ['chi1994', 'dunlosky2013'],
  },
  elaboracao: {
    technique: 'elaboracao', strength: 'moderada', review: 'a_revisar',
    summary: 'Perguntar "por quê?" e ligar ao que já se sabe ajuda a compreender, principalmente com conhecimento prévio.',
    caveat: 'Evidência menor para iniciantes sem base no assunto.',
    sourceIds: ['dunlosky2013'],
  },
  mapas: {
    technique: 'mapas', strength: 'limitada', review: 'a_revisar',
    summary: 'Mapas ajudam a organizar ideias, mas em um estudo a recuperação ativa superou o estudo com mapas conceituais.',
    caveat: 'Útil para organizar e planejar; menos eficaz que testar a si mesmo para reter.',
    sourceIds: ['karpicke2011'],
  },
  brain_dump: {
    technique: 'brain_dump', strength: 'moderada', review: 'a_revisar',
    summary: 'Escrever tudo o que lembra é uma forma de recuperação livre, que tende a favorecer a retenção.',
    caveat: 'Evidência indireta, vinda dos estudos de recuperação livre.',
    sourceIds: ['karpicke2011', 'roediger2006'],
  },
  cornell: { technique: 'cornell', strength: 'nao_avaliada', review: 'a_revisar', summary: 'Método de organização de anotações. Ainda não há fonte conferida sobre seu efeito na aprendizagem.', caveat: 'Use como ferramenta de organização; o ganho depende de revisar as pistas com recuperação ativa.', sourceIds: [] },
  leitura_ativa: { technique: 'leitura_ativa', strength: 'nao_avaliada', review: 'a_revisar', summary: 'Ainda não há fonte conferida para este método específico.', caveat: 'Revisões gerais apontam que reler e grifar rendem pouco sozinhos; faça perguntas e teste-se.', sourceIds: ['dunlosky2013'] },
  fichamento: { technique: 'fichamento', strength: 'nao_avaliada', review: 'a_revisar', summary: 'Prática acadêmica de registro de leituras. Sem fonte conferida sobre efeito na aprendizagem.', caveat: 'Valor principal: organização do trabalho de pesquisa.', sourceIds: [] },
  dupla_codificacao: { technique: 'dupla_codificacao', strength: 'nao_avaliada', review: 'a_revisar', summary: 'Ainda não há fonte conferida.', caveat: 'A ser avaliada.', sourceIds: [] },
  estudo_problemas: { technique: 'estudo_problemas', strength: 'nao_avaliada', review: 'a_revisar', summary: 'Ainda não há fonte conferida.', caveat: 'A ser avaliada.', sourceIds: [] },
};

export const SOURCE_BY_ID = Object.fromEntries(SOURCES.map((s) => [s.id, s])) as Record<string, Source>;

export function sourcesFor(technique: TechniqueId): Source[] {
  return EVIDENCE[technique].sourceIds.map((id) => SOURCE_BY_ID[id]!).filter(Boolean);
}
