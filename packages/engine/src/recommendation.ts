import { MVP_TECHNIQUES, TECHNIQUE_BY_ID, type TechniqueId } from './techniques';
import { EVIDENCE, type TechniqueEvidence } from './evidence';
import { personalize, type OutcomeRecord } from './personalization';
import type { Autonomy, Level } from './types';

/** Tipo de tarefa/contexto de estudo (doc 12 §5.4). */
export type TaskKind =
  | 'memorizar' | 'resolver' | 'compreender' | 'prova' | 'ler' | 'escrever' | 'idioma' | 'organizar' | 'geral';

export const TASK_KIND_LABEL: Record<TaskKind, string> = {
  memorizar: 'Memorizar conceitos',
  resolver: 'Resolver problemas',
  compreender: 'Compreender assunto complexo',
  prova: 'Preparar prova',
  ler: 'Ler artigo ou texto',
  escrever: 'Escrever',
  idioma: 'Aprender idioma',
  organizar: 'Organizar conteúdo de aula',
  geral: 'Estudo geral',
};

export interface RecommendationContext {
  mode: Level;
  taskKind: TaskKind;
  autonomy?: Autonomy;
  /** 1–5 (autodeclarada). */
  difficulty?: number;
  /** 1–5 (autodeclarado). */
  mastery?: number;
  availableMin: number;
  /** Técnicas recentes, para sugerir variar quando uma não estiver ajudando. */
  recentTechniques?: TechniqueId[];
  /** Técnicas habilitadas (padrão: as 4 do MVP). */
  enabled?: TechniqueId[];
  /** Resultados de sessões passadas do próprio estudante (personalização). */
  history?: OutcomeRecord[];
}

export type StepKind = 'recuperacao' | 'estudo' | 'pratica' | 'foco' | 'pausa' | 'reflexao' | 'revisao';

export interface SessionStep {
  id: string;
  label: string;
  minutes: number;
  instruction: string;
  kind: StepKind;
}

export interface Recommendation {
  primary: TechniqueId;
  complementary?: TechniqueId;
  /** Frases curtas que explicam por que (explicabilidade, doc 12 §2). */
  justification: string[];
  durationMin: number;
  steps: SessionStep[];
  verification: string;
  reviewSuggested: boolean;
  /** Base científica das técnicas recomendadas (grau de evidência e fontes). */
  evidence: TechniqueEvidence[];
  /** A ordem principal/complementar foi ajustada pelos resultados do estudante. */
  personalized: boolean;
}

/** Regras iniciais (doc 12 §5.4): ideal por contexto, antes de filtrar pelas técnicas habilitadas. */
const IDEAL: Record<TaskKind, { primary: TechniqueId[]; why: string }> = {
  memorizar: { primary: ['recuperacao_ativa', 'repeticao_espacada'], why: 'Para memorizar, lembrar sem consultar e rever com intervalos funciona melhor do que reler.' },
  resolver: { primary: ['pratica_exercicios', 'autoexplicacao'], why: 'Para resolver problemas, praticar exercícios e analisar os erros é o caminho mais direto.' },
  compreender: { primary: ['elaboracao', 'feynman'], why: 'Para compreender um assunto complexo, explicar com suas palavras mostra onde falta entendimento.' },
  prova: { primary: ['recuperacao_ativa', 'pratica_exercicios'], why: 'Para a prova, combine lembrar sem consultar com questões e revisões.' },
  ler: { primary: ['leitura_ativa', 'fichamento'], why: 'Para ler com proveito, leia em partes e registre o que entendeu.' },
  escrever: { primary: ['pomodoro'], why: 'Para escrever, blocos de foco com pausas ajudam a manter o ritmo.' },
  idioma: { primary: ['recuperacao_ativa', 'repeticao_espacada'], why: 'Para idiomas, recuperar vocabulário e revisar em intervalos distribui a prática.' },
  organizar: { primary: ['cornell', 'mapas'], why: 'Para organizar o conteúdo da aula, anotações estruturadas ou mapas ajudam.' },
  geral: { primary: ['pomodoro'], why: 'Para começar, blocos de foco reduzem a resistência e criam ritmo.' },
};

/** Alternativa quando a técnica ideal ainda não está habilitada. */
const FALLBACK: Partial<Record<TechniqueId, TechniqueId>> = {
  autoexplicacao: 'recuperacao_ativa', elaboracao: 'recuperacao_ativa', feynman: 'recuperacao_ativa',
  leitura_ativa: 'pomodoro', fichamento: 'recuperacao_ativa', cornell: 'pomodoro', mapas: 'recuperacao_ativa',
};

const BASE_MIN: Record<Level, number> = { fund2: 25, medio: 40, superior: 50, pos: 60, livre: 40 };

const round5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

/** Técnicas habilitadas compatíveis com o contexto, da mais à menos indicada (para "Trocar técnica"). */
export function compatibleTechniques(ctx: Pick<RecommendationContext, 'taskKind' | 'enabled'>): TechniqueId[] {
  const enabled = ctx.enabled ?? MVP_TECHNIQUES;
  const ideal = IDEAL[ctx.taskKind].primary.map((t) => (enabled.includes(t) ? t : FALLBACK[t])).filter((t): t is TechniqueId => !!t && enabled.includes(t));
  return [...new Set([...ideal, ...enabled])];
}

export function recommend(ctx: RecommendationContext): Recommendation {
  const enabled = ctx.enabled ?? MVP_TECHNIQUES;
  const rule = IDEAL[ctx.taskKind];
  const justification = [rule.why];

  const resolved: TechniqueId[] = [];
  for (const t of rule.primary) {
    if (enabled.includes(t)) resolved.push(t);
    else {
      const fb = FALLBACK[t];
      if (fb && enabled.includes(fb) && !resolved.includes(fb)) {
        resolved.push(fb);
        justification.push(`${TECHNIQUE_BY_ID[t].name} seria o ideal, mas ainda não está disponível; usamos ${TECHNIQUE_BY_ID[fb].name}.`);
      }
    }
  }
  let primary = resolved[0] ?? enabled[0]!;
  let complementary: TechniqueId | undefined = resolved.find((t) => t !== primary);

  // Personalização pelos resultados do próprio estudante (só entre técnicas já permitidas pela regra).
  let personalized = false;
  const names = Object.fromEntries(Object.entries(TECHNIQUE_BY_ID).map(([k, t]) => [k, t.name]));
  const adj = personalize(primary, complementary, ctx.history ?? [], ctx.taskKind, names);
  if (adj.note) { primary = adj.primary; complementary = adj.complementary; justification.push(adj.note); personalized = true; }

  // Variar se a mesma técnica foi usada várias vezes seguidas sem pedir troca.
  const recent = ctx.recentTechniques ?? [];
  if (!personalized && recent.length >= 3 && recent.slice(-3).every((t) => t === primary) && complementary) {
    [primary, complementary] = [complementary, primary];
    justification.push('Você usou a mesma técnica várias vezes seguidas; sugerimos experimentar outra abordagem.');
  }

  let duration = BASE_MIN[ctx.mode];
  if (ctx.autonomy === 'guiada') { duration *= 0.8; justification.push('Sessão um pouco mais curta e guiada, para facilitar o início.'); }
  if ((ctx.difficulty ?? 3) >= 4 && (ctx.mastery ?? 3) <= 2) justification.push('Conteúdo difícil e pouco dominado: vale ir com calma e priorizar o essencial.');
  if (ctx.availableMin < duration) justification.push(`Ajustamos a duração ao tempo disponível (${ctx.availableMin} min).`);
  const durationMin = Math.max(5, Math.min(round5(duration), Math.max(5, Math.floor(ctx.availableMin))));

  const reviewSuggested = primary === 'recuperacao_ativa' || primary === 'repeticao_espacada' || complementary === 'repeticao_espacada' || ctx.taskKind === 'prova';
  if (reviewSuggested) justification.push('Uma revisão será programada depois da sessão.');

  return {
    primary, complementary, justification, durationMin,
    steps: buildSteps(primary, durationMin, complementary),
    verification: TECHNIQUE_BY_ID[primary].verification,
    reviewSuggested,
    evidence: [primary, ...(complementary ? [complementary] : [])].map((t) => EVIDENCE[t]),
    personalized,
  };
}

interface StepTemplate { label: string; share: number; kind: StepKind; instruction: string }

const TEMPLATES: Partial<Record<TechniqueId, StepTemplate[]>> = {
  recuperacao_ativa: [
    { label: 'Lembrar sem consultar', share: 0.2, kind: 'recuperacao', instruction: 'Escreva ou diga tudo o que lembra do assunto, sem olhar o material.' },
    { label: 'Estudar o conteúdo', share: 0.4, kind: 'estudo', instruction: 'Consulte o material e foque no que faltou.' },
    { label: 'Testar-se de novo', share: 0.3, kind: 'recuperacao', instruction: 'Feche o material e responda de novo às perguntas.' },
    { label: 'Reflexão', share: 0.1, kind: 'reflexao', instruction: 'O que ficou firme? O que precisa voltar?' },
  ],
  pratica_exercicios: [
    { label: 'Revisar o essencial', share: 0.15, kind: 'estudo', instruction: 'Releia só o que precisa para começar os exercícios.' },
    { label: 'Resolver exercícios', share: 0.6, kind: 'pratica', instruction: 'Resolva sem consultar. Tente antes de ver a resposta.' },
    { label: 'Correção e análise dos erros', share: 0.2, kind: 'pratica', instruction: 'Para cada erro, descubra o porquê e anote o que treinar.' },
    { label: 'Reflexão', share: 0.05, kind: 'reflexao', instruction: 'Quais tipos de erro apareceram?' },
  ],
  repeticao_espacada: [
    { label: 'Revisão de perguntas e cartões', share: 0.8, kind: 'revisao', instruction: 'Responda aos itens vencidos e marque o quanto foi fácil ou difícil.' },
    { label: 'Registro da confiança', share: 0.2, kind: 'reflexao', instruction: 'Anote a sua confiança e o que precisa de reforço.' },
  ],
};

/** Divide `total` minutos pelas etapas; garante soma exata e mínimo de 1 min por etapa. */
export function buildSteps(technique: TechniqueId, total: number, complementary?: TechniqueId): SessionStep[] {
  if (technique === 'pomodoro') return pomodoroSteps(total);
  const tpl = [...(TEMPLATES[technique] ?? TEMPLATES.recuperacao_ativa!)];
  if (complementary === 'repeticao_espacada' && technique !== 'repeticao_espacada') {
    tpl.splice(tpl.length - 1, 0, { label: 'Criar perguntas para revisão', share: 0.1, kind: 'revisao', instruction: 'Escreva 3 a 5 perguntas ou cartões para revisar depois.' });
  }
  const usable = tpl.filter((s) => s.share * total >= 1 || s.kind === 'reflexao' && total >= 8);
  const list = usable.length ? usable : tpl.slice(0, 1);
  const sumShare = list.reduce((a, s) => a + s.share, 0);
  const mins = list.map((s) => Math.max(1, Math.floor((s.share / sumShare) * total)));
  const biggest = Math.max(0, list.findIndex((s) => s.share === Math.max(...list.map((x) => x.share))));
  mins[biggest] = (mins[biggest] ?? 0) + total - mins.reduce((a, b) => a + b, 0);
  return list.map((s, i) => ({ id: `${technique}-${i}`, label: s.label, minutes: mins[i]!, instruction: s.instruction, kind: s.kind }));
}

function pomodoroSteps(total: number): SessionStep[] {
  const focus = total >= 50 ? 25 : total >= 25 ? 20 : Math.max(5, total - 5);
  const steps: SessionStep[] = [];
  let left = total, i = 0;
  while (left > 0) {
    const f = Math.min(focus, left);
    steps.push({ id: `pomodoro-f${i}`, label: `Foco ${i + 1}`, minutes: f, instruction: 'Uma tarefa só. Sem celular nem outras abas.', kind: 'foco' });
    left -= f;
    if (left >= 8) { steps.push({ id: `pomodoro-p${i}`, label: 'Pausa', minutes: 5, instruction: 'Levante, respire, beba água.', kind: 'pausa' }); left -= 5; }
    i++;
  }
  return steps;
}
