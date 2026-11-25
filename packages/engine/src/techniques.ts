import type { Level } from './types';

export type TechniqueId =
  | 'recuperacao_ativa' | 'repeticao_espacada' | 'pomodoro' | 'feynman' | 'pratica_exercicios'
  | 'pratica_intercalada' | 'elaboracao' | 'autoexplicacao' | 'mapas' | 'cornell'
  | 'leitura_ativa' | 'fichamento' | 'brain_dump' | 'dupla_codificacao' | 'estudo_problemas';

export interface Technique {
  id: TechniqueId;
  name: string;
  description: string;
  /** Objetivo pedagógico. */
  objective: string;
  /** Tipo de atividade indicado. */
  activities: string[];
  /** Contexto de uso e limitações. */
  limits: string;
  /** Modos para os quais a técnica é mais indicada (referência, não regra rígida). */
  modes: Level[];
  /** Etapas de execução. */
  howTo: string[];
  defaultMin: number;
  materials: string;
  verification: string;
  accessible: string;
  /** Regra de revisão, quando aplicável. */
  review?: string;
  /** Disponível na primeira versão (doc 12 §11). */
  mvp: boolean;
}

const ALL: Level[] = ['fund2', 'medio', 'superior', 'pos', 'livre'];

/** Biblioteca de técnicas (doc 12 §5.3). No MVP só 4 estão ativas; as demais aparecem como "em breve". */
export const TECHNIQUES: Technique[] = [
  {
    id: 'recuperacao_ativa', name: 'Recuperação ativa',
    description: 'Lembrar o conteúdo sem consultar o material, e só depois conferir.',
    objective: 'Fortalecer a memória e mostrar o que ainda não está firme.',
    activities: ['memorizar conceitos', 'preparar prova', 'idiomas'],
    limits: 'Pede algum contato prévio com o assunto; em conteúdo totalmente novo, estude antes.',
    modes: ALL,
    howTo: ['Feche o material.', 'Escreva ou diga tudo o que lembra.', 'Confira com o material.', 'Marque lacunas e tente de novo.'],
    defaultMin: 25, materials: 'Papel ou caderno; perguntas ou cartões (opcional).',
    verification: 'Quantas ideias você recuperou antes de consultar.',
    accessible: 'Responder em voz alta ou por áudio no lugar de escrever.',
    review: 'Programar revisão após o estudo inicial.', mvp: true,
  },
  {
    id: 'repeticao_espacada', name: 'Repetição espaçada',
    description: 'Rever o conteúdo em intervalos crescentes, em vez de tudo de uma vez.',
    objective: 'Manter o conteúdo na memória por mais tempo com menos esforço total.',
    activities: ['memorizar conceitos', 'idiomas', 'preparar prova'],
    limits: 'Funciona melhor com revisões regulares; não substitui entender o assunto.',
    modes: ALL,
    howTo: ['Responda às perguntas ou cartões vencidos.', 'Marque o quanto foi fácil ou difícil.', 'O app agenda a próxima revisão.'],
    defaultMin: 15, materials: 'Cartões ou perguntas criadas por você.',
    verification: 'Acertos e confiança nas revisões.',
    accessible: 'Cartões com texto ampliado ou leitura em voz alta.',
    review: 'Intervalos iniciais D+1, D+7 e D+30, ajustados pelo resultado.', mvp: true,
  },
  {
    id: 'pomodoro', name: 'Blocos de foco (Pomodoro)',
    description: 'Estudar em blocos curtos de foco com pausas planejadas.',
    objective: 'Manter a atenção e começar com menos resistência.',
    activities: ['leitura', 'escrita', 'tarefas longas', 'começar a estudar'],
    limits: 'Ajuda no foco, mas não garante aprendizagem; combine com uma técnica de estudo.',
    modes: ALL,
    howTo: ['Escolha uma tarefa única.', 'Foque pelo tempo do bloco.', 'Faça a pausa.', 'Repita e, depois de alguns blocos, pause mais.'],
    defaultMin: 25, materials: 'Temporizador.',
    verification: 'Concluiu o que se propôs no bloco?',
    accessible: 'Blocos e pausas ajustáveis; alertas por vibração.', mvp: true,
  },
  {
    id: 'pratica_exercicios', name: 'Prática de exercícios',
    description: 'Resolver exercícios e questões, com correção e análise dos erros.',
    objective: 'Aplicar o conteúdo e descobrir onde erra.',
    activities: ['resolver problemas', 'preparar prova', 'simulados'],
    limits: 'Exige material de exercícios; sem análise dos erros rende pouco.',
    modes: ALL,
    howTo: ['Revise o essencial rapidamente.', 'Resolva sem consultar.', 'Corrija e entenda cada erro.', 'Anote o que treinar de novo.'],
    defaultMin: 40, materials: 'Lista de exercícios ou questões.',
    verification: 'Acertos e tipos de erro.',
    accessible: 'Dividir a lista em partes menores; tempo estendido.',
    review: 'Refazer os erros em uma revisão posterior.', mvp: true,
  },
  { id: 'feynman', name: 'Técnica de Feynman', description: 'Explicar o assunto com palavras simples, como para outra pessoa.', objective: 'Revelar lacunas de compreensão.', activities: ['compreender assunto complexo'], limits: 'Chega na próxima fase do app.', modes: ALL, howTo: ['Escolha o tema.', 'Explique de forma simples.', 'Identifique onde travou.', 'Volte ao material e explique de novo.'], defaultMin: 25, materials: 'Papel ou áudio.', verification: 'Consegue explicar sem termos que não entende?', accessible: 'Explicar por áudio.', mvp: false },
  { id: 'pratica_intercalada', name: 'Prática intercalada', description: 'Alternar tipos de problema ou assuntos na mesma sessão.', objective: 'Aprender a escolher o método certo.', activities: ['resolver problemas'], limits: 'Chega na próxima fase do app.', modes: ['medio', 'superior', 'pos', 'livre'], howTo: ['Misture tipos de exercício.', 'Identifique o tipo antes de resolver.'], defaultMin: 40, materials: 'Exercícios variados.', verification: 'Acertou o tipo de problema?', accessible: 'Misturas menores.', mvp: false },
  { id: 'elaboracao', name: 'Elaboração', description: 'Conectar o novo conteúdo ao que já sabe, com exemplos e porquês.', objective: 'Compreensão mais profunda.', activities: ['compreender assunto complexo'], limits: 'Chega na próxima fase do app.', modes: ALL, howTo: ['Pergunte "por quê?" e "como?".', 'Crie exemplos próprios.'], defaultMin: 25, materials: 'Caderno.', verification: 'Consegue dar exemplos novos?', accessible: 'Áudio ou desenho.', mvp: false },
  { id: 'autoexplicacao', name: 'Autoexplicação', description: 'Explicar para si mesmo cada passo de uma resolução.', objective: 'Entender o raciocínio, não só o resultado.', activities: ['resolver problemas'], limits: 'Chega na próxima fase do app.', modes: ALL, howTo: ['Resolva em voz alta.', 'Justifique cada passo.'], defaultMin: 25, materials: 'Exercícios.', verification: 'Cada passo tem uma justificativa?', accessible: 'Gravar áudio.', mvp: false },
  { id: 'mapas', name: 'Mapas mentais e conceituais', description: 'Organizar ideias e relações em um diagrama.', objective: 'Ver a estrutura do conteúdo.', activities: ['organizar conteúdo'], limits: 'Chega na próxima fase do app.', modes: ALL, howTo: ['Liste conceitos.', 'Ligue com verbos de relação.'], defaultMin: 30, materials: 'Papel ou editor.', verification: 'Relações corretas entre conceitos.', accessible: 'Versão em lista hierárquica.', mvp: false },
  { id: 'cornell', name: 'Método Cornell', description: 'Anotações em três áreas: pistas, notas e resumo.', objective: 'Organizar a aula e facilitar a revisão.', activities: ['organizar conteúdo de aula'], limits: 'Chega na próxima fase do app.', modes: ['medio', 'superior', 'pos', 'livre'], howTo: ['Anote na coluna principal.', 'Crie pistas.', 'Resuma ao final.'], defaultMin: 30, materials: 'Caderno ou modelo.', verification: 'Resumo em poucas linhas.', accessible: 'Modelo digital.', mvp: false },
  { id: 'leitura_ativa', name: 'Leitura ativa', description: 'Ler com perguntas, grifos e sínteses por trecho.', objective: 'Compreender e reter o que lê.', activities: ['ler artigo', 'ler texto'], limits: 'Chega na próxima fase do app.', modes: ['medio', 'superior', 'pos', 'livre'], howTo: ['Faça perguntas antes.', 'Leia por partes.', 'Resuma cada parte.'], defaultMin: 40, materials: 'Texto.', verification: 'Síntese por seção.', accessible: 'Leitura em voz alta.', mvp: false },
  { id: 'fichamento', name: 'Fichamento', description: 'Registrar de forma estruturada o que a fonte diz.', objective: 'Reaproveitar leituras em trabalhos.', activities: ['pesquisa'], limits: 'Chega na próxima fase do app.', modes: ['superior', 'pos'], howTo: ['Cite a fonte.', 'Resuma ideias.', 'Registre relevância.'], defaultMin: 40, materials: 'Ficha.', verification: 'Ficha completa.', accessible: 'Modelo guiado.', mvp: false },
  { id: 'brain_dump', name: 'Brain dump', description: 'Despejar no papel tudo o que lembra sobre o tema.', objective: 'Ativar conhecimento prévio e achar lacunas.', activities: ['começar um tema', 'revisar'], limits: 'Chega na próxima fase do app.', modes: ALL, howTo: ['Escreva sem parar.', 'Compare com o material.'], defaultMin: 10, materials: 'Papel.', verification: 'Lacunas identificadas.', accessible: 'Ditado.', mvp: false },
  { id: 'dupla_codificacao', name: 'Dupla codificação', description: 'Combinar palavras e imagens para representar o conteúdo.', objective: 'Criar mais pistas de memória.', activities: ['memorizar'], limits: 'Chega na próxima fase do app.', modes: ALL, howTo: ['Associe cada ideia a uma imagem ou esquema.'], defaultMin: 20, materials: 'Papel ou imagens.', verification: 'Reproduz a ideia pela imagem.', accessible: 'Descrição verbal.', mvp: false },
  { id: 'estudo_problemas', name: 'Estudo baseado em problemas', description: 'Aprender a partir de um problema real ou caso.', objective: 'Aplicar conhecimento em contexto.', activities: ['projetos', 'casos'], limits: 'Chega na próxima fase do app.', modes: ['superior', 'pos', 'livre'], howTo: ['Defina o problema.', 'Levante o que precisa saber.', 'Pesquise e proponha solução.'], defaultMin: 60, materials: 'Caso e fontes.', verification: 'Solução justificada.', accessible: 'Roteiro em etapas.', mvp: false },
];

export const MVP_TECHNIQUES: TechniqueId[] = TECHNIQUES.filter((t) => t.mvp).map((t) => t.id);

export const TECHNIQUE_BY_ID = Object.fromEntries(TECHNIQUES.map((t) => [t.id, t])) as Record<TechniqueId, Technique>;
