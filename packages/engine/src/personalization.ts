import type { TaskKind } from './recommendation';
import type { TechniqueId } from './techniques';

/** Resultado de uma sessão passada, normalizado de 0 a 1. */
export interface OutcomeRecord {
  technique: TechniqueId;
  taskKind?: TaskKind;
  /** 0–1: média da confiança (÷5) e do aproveitamento, quando houver. */
  outcome: number;
  at: number;
}

export function outcomeOf(a: { confidence: number; correct?: number; total?: number }): number {
  const parts = [Math.min(1, Math.max(0, a.confidence / 5))];
  if (a.total && a.total > 0 && a.correct !== undefined) parts.push(Math.min(1, Math.max(0, a.correct / a.total)));
  return parts.reduce((x, y) => x + y, 0) / parts.length;
}

/** Quantas sessões com avaliação são necessárias para o histórico influenciar a recomendação. */
export const MIN_SESSIONS = 3;
/** Diferença mínima de resultado (0–1) para trocar a técnica principal. */
export const MARGIN = 0.12;
const PRIOR_MEAN = 0.6;
const PRIOR_WEIGHT = 4;

export interface TechniqueStats { n: number; mean: number; shrunk: number }

/** Média do resultado com “encolhimento” para o prior: poucos dados pesam pouco. */
export function statsFor(history: OutcomeRecord[], technique: TechniqueId, taskKind?: TaskKind): TechniqueStats {
  const specific = history.filter((h) => h.technique === technique && taskKind !== undefined && h.taskKind === taskKind);
  const rows = specific.length >= MIN_SESSIONS ? specific : history.filter((h) => h.technique === technique);
  const n = rows.length;
  const sum = rows.reduce((a, r) => a + r.outcome, 0);
  return { n, mean: n ? sum / n : 0, shrunk: (sum + PRIOR_MEAN * PRIOR_WEIGHT) / (n + PRIOR_WEIGHT) };
}

const pct = (x: number) => `${Math.round(x * 100)}%`;

/**
 * Ajusta a escolha entre as técnicas que a regra baseada em evidência já permite
 * (principal e complementar). Só troca com dados suficientes de AMBAS e diferença clara.
 * Nunca introduz uma técnica fora do conjunto permitido.
 */
export function personalize(
  primary: TechniqueId,
  complementary: TechniqueId | undefined,
  history: OutcomeRecord[],
  taskKind: TaskKind,
  names: Record<string, string>,
): { primary: TechniqueId; complementary?: TechniqueId; note?: string } {
  if (!complementary) return { primary, complementary };
  const a = statsFor(history, primary, taskKind);
  const b = statsFor(history, complementary, taskKind);
  if (a.n >= MIN_SESSIONS && b.n >= MIN_SESSIONS && b.shrunk - a.shrunk >= MARGIN) {
    return {
      primary: complementary, complementary: primary,
      note: `Nas suas últimas sessões, ${names[complementary] ?? complementary} teve melhor resultado (${pct(b.mean)}) do que ${names[primary] ?? primary} (${pct(a.mean)}). Seu histórico é uma indicação, não prova de eficácia.`,
    };
  }
  return { primary, complementary };
}
