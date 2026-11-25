import { NEW_CARD, firstReview, fromLegacy, nextIntervalDays, reviewFsrs, type FsrsGrade, type ReviewGrade } from '@estuda/engine';
import type { Card, Deps } from './ports';
import { startOfDay, tzOffset } from './usecases';

const DAY_MS = 86_400_000;

/** REQ-012: cria cartão novo, disponível para revisão imediatamente. */
export async function addCard(deps: Deps, input: { subjectId: string; front: string; back: string }): Promise<Card> {
  const front = input.front.trim();
  const back = input.back.trim();
  if (!front || !back) throw new Error('Frente e verso são obrigatórios.');
  const now = deps.clock.now();
  const card: Card = {
    id: `${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    subjectId: input.subjectId,
    front,
    back,
    ...NEW_CARD,
    due: now,
    lapses: 0,
  };
  await deps.store.saveCard(card);
  return card;
}

/**
 * Fila de revisão do dia: vencidos, mais atrasados primeiro, respeitando o teto
 * diário do perfil descontando o que já foi revisado hoje (REQ-013).
 */
export async function reviewQueue(deps: Deps): Promise<{ queue: Card[]; dueTotal: number; reviewedToday: number }> {
  const now = deps.clock.now();
  const dayStart = startOfDay(now, tzOffset(deps)).getTime();
  const [cards, profile] = await Promise.all([deps.store.listCards(), deps.store.getProfile()]);
  const cap = profile?.reviewCap ?? 40;
  const reviewedToday = cards.filter((c) => c.lastReviewedAt && c.lastReviewedAt.getTime() >= dayStart).length;
  const due = cards.filter((c) => c.due.getTime() <= now.getTime()).sort((a, b) => a.due.getTime() - b.due.getTime());
  return { queue: due.slice(0, Math.max(0, cap - reviewedToday)), dueTotal: due.length, reviewedToday };
}

const GRADE: Record<ReviewGrade, FsrsGrade> = { errou: 1, dificil: 2, bom: 3, facil: 4 };

/** Aplica o resultado da revisão (FSRS-4.5) e agenda a próxima para a retenção desejada do perfil. */
export async function gradeCard(deps: Deps, cardId: string, grade: ReviewGrade): Promise<Card> {
  const [cards, profile] = await Promise.all([deps.store.listCards(), deps.store.getProfile()]);
  const card = cards.find((c) => c.id === cardId);
  if (!card) throw new Error('Cartão não encontrado.');
  const now = deps.clock.now();
  const t = now.getTime();
  const retention = profile?.retention ?? 0.9;
  const g = GRADE[grade];
  let state;
  if (card.stability !== undefined && card.difficulty !== undefined && card.lastReviewedAt) {
    state = reviewFsrs({ stability: card.stability, difficulty: card.difficulty, lastReview: card.lastReviewedAt.getTime(), reps: card.repetitions, lapses: card.lapses }, g, t);
  } else if (card.repetitions > 0 && card.lastReviewedAt) {
    // Cartão antigo (SM-2): converte o intervalo atual em estabilidade e segue com FSRS.
    state = reviewFsrs(fromLegacy(card.intervalDays, card.repetitions, card.lastReviewedAt.getTime()), g, t);
  } else {
    state = firstReview(g, t);
  }
  const interval = nextIntervalDays(state.stability, retention);
  const updated: Card = {
    ...card,
    stability: state.stability,
    difficulty: state.difficulty,
    repetitions: g === 1 ? 0 : state.reps,
    intervalDays: interval,
    due: new Date(t + interval * DAY_MS),
    lastReviewedAt: now,
    lapses: state.lapses,
  };
  await deps.store.saveCard(updated);
  return updated;
}
