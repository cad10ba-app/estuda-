import type { Deadline, Subject } from './types';

const DAY_MS = 86_400_000;

/** Dias até o próximo prazo da disciplina a partir de `from` (null se não houver). */
export function daysToNextDeadline(subjectId: string, deadlines: Deadline[], from: Date): number | null {
  let best: number | null = null;
  for (const d of deadlines) {
    if (d.subjectId !== subjectId) continue;
    const days = Math.ceil((d.date.getTime() - from.getTime()) / DAY_MS);
    if (days < 0) continue;
    const v = Math.max(1, days);
    if (best === null || v < best) best = v;
  }
  return best;
}

/**
 * prioridade = 0.4*peso + 0.3*dificuldade + 0.3*urgencia*5 (+ bônus até 1 por defasagem).
 * urgencia = (1/dias) normalizada pelo maior valor entre as disciplinas (0 sem prazo).
 */
export function computePriorities(subjects: Subject[], deadlines: Deadline[], from: Date): Record<string, number> {
  const raw = subjects.map((s) => {
    const days = daysToNextDeadline(s.id, deadlines, from);
    return days === null ? 0 : 1 / days;
  });
  const max = Math.max(0, ...raw);
  const out: Record<string, number> = {};
  subjects.forEach((s, i) => {
    const urgency = max > 0 ? (raw[i] ?? 0) / max : 0;
    const unseen = s.unseenRatio ?? 0;
    const bonus = unseen > 0.5 ? (unseen - 0.5) * 2 : 0;
    out[s.id] = 0.4 * s.weight + 0.3 * s.difficulty + 0.3 * urgency * 5 + bonus;
  });
  return out;
}
