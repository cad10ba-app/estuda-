import { describe, expect, it } from 'vitest';
import {
  EVIDENCE, FSRS_WEIGHTS, MARGIN, MIN_SESSIONS, MVP_TECHNIQUES, SOURCES, SOURCE_BY_ID, TECHNIQUES, firstReview, fromLegacy, intervalFor,
  nextIntervalDays, outcomeOf, personalize, recommend, retrievability, reviewFsrs, sourcesFor, statsFor, type OutcomeRecord,
} from '../src';

const DAY = 86_400_000;

describe('FSRS-4.5', () => {
  it('usa os 17 pesos padrão conferidos na documentação oficial', () => {
    expect(FSRS_WEIGHTS).toHaveLength(17);
    expect(FSRS_WEIGHTS[0]).toBe(0.4872);
    expect(FSRS_WEIGHTS[16]).toBe(2.8755);
  });

  it('retrievability(S, S) = 90% e intervalo com retenção 90% = S', () => {
    for (const s of [0.5, 3.7145, 30, 365]) {
      expect(retrievability(s, s)).toBeCloseTo(0.9, 10);
      expect(intervalFor(s, 0.9)).toBeCloseTo(s, 8);
    }
    expect(retrievability(0, 5)).toBe(1);
    expect(intervalFor(10, 0.95)).toBeLessThan(10);
    expect(intervalFor(10, 0.85)).toBeGreaterThan(10);
  });

  it('primeira revisão: S0 = w[g-1]; D0(3) = w4; bom/fácil dão intervalos maiores', () => {
    const t = 1_000_000;
    expect(firstReview(3, t).stability).toBe(3.7145);
    expect(firstReview(3, t).difficulty).toBeCloseTo(5.1618, 6);
    expect(firstReview(1, t).stability).toBe(0.4872);
    expect(firstReview(1, t).difficulty).toBeGreaterThan(firstReview(4, t).difficulty);
    expect(nextIntervalDays(firstReview(4, t).stability)).toBeGreaterThan(nextIntervalDays(firstReview(3, t).stability));
    expect(nextIntervalDays(firstReview(3, t).stability)).toBe(4);
    expect(nextIntervalDays(firstReview(1, t).stability)).toBe(1);
  });

  it('acerto aumenta a estabilidade; revisar mais tarde (R menor) aumenta mais; erro derruba', () => {
    const t0 = 0;
    let s = firstReview(3, t0);
    const early = reviewFsrs(s, 3, t0 + 1 * DAY);
    const onTime = reviewFsrs(s, 3, t0 + s.stability * DAY);
    const late = reviewFsrs(s, 3, t0 + 3 * s.stability * DAY);
    expect(early.stability).toBeGreaterThan(s.stability);
    expect(onTime.stability).toBeGreaterThan(early.stability);
    expect(late.stability).toBeGreaterThan(onTime.stability);
    const lapse = reviewFsrs(onTime, 1, t0 + 20 * DAY);
    expect(lapse.stability).toBeLessThan(onTime.stability);
    expect(lapse.lapses).toBe(1);
    s = onTime;
    expect(reviewFsrs(s, 2, t0 + 10 * DAY).stability).toBeLessThan(reviewFsrs(s, 3, t0 + 10 * DAY).stability);
    expect(reviewFsrs(s, 4, t0 + 10 * DAY).stability).toBeGreaterThan(reviewFsrs(s, 3, t0 + 10 * DAY).stability);
  });

  it('dificuldade fica entre 1 e 10 e sobe com erros repetidos', () => {
    let s = firstReview(3, 0);
    for (let i = 1; i <= 30; i++) s = reviewFsrs(s, 1, i * DAY);
    expect(s.difficulty).toBeGreaterThan(5.16);
    expect(s.difficulty).toBeLessThanOrEqual(10);
    let e = firstReview(4, 0);
    for (let i = 1; i <= 30; i++) e = reviewFsrs(e, 4, i * 30 * DAY);
    expect(e.difficulty).toBeGreaterThanOrEqual(1);
    expect(e.difficulty).toBeLessThan(5.16);
  });

  it('migração do SM-2 preserva o intervalo atual como estabilidade', () => {
    const s = fromLegacy(12, 3, 0);
    expect(s.stability).toBe(12);
    expect(nextIntervalDays(s.stability)).toBe(12);
  });
});

describe('base de evidência', () => {
  it('toda técnica do catálogo tem entrada; fontes citadas existem; nenhuma marcada como revisada sem revisão', () => {
    for (const t of TECHNIQUES) {
      const e = EVIDENCE[t.id];
      expect(e, t.id).toBeTruthy();
      for (const id of e.sourceIds) expect(SOURCE_BY_ID[id], `${t.id} → ${id}`).toBeTruthy();
      expect(e.review).toBe('a_revisar');
    }
    expect(SOURCES.every((s) => s.verified === false)).toBe(true);
  });
  it('técnicas com evidência "forte" ou "moderada" citam ao menos uma fonte; "não avaliada" não finge ter evidência', () => {
    for (const e of Object.values(EVIDENCE)) {
      if (e.strength === 'forte' || e.strength === 'moderada') expect(e.sourceIds.length, e.technique).toBeGreaterThan(0);
      if (e.strength === 'nao_avaliada') expect(e.summary).toMatch(/Ainda não|Sem fonte|Prática|Método/);
    }
    expect(sourcesFor('recuperacao_ativa').length).toBeGreaterThanOrEqual(3);
  });
  it('as 4 técnicas ativas no MVP têm grau de evidência declarado; Pomodoro é "limitada"', () => {
    expect(EVIDENCE.recuperacao_ativa.strength).toBe('forte');
    expect(EVIDENCE.repeticao_espacada.strength).toBe('forte');
    expect(EVIDENCE.pomodoro.strength).toBe('limitada');
    expect(MVP_TECHNIQUES.every((t) => EVIDENCE[t])).toBe(true);
  });
  it('a recomendação traz a base científica das técnicas sugeridas', () => {
    const r = recommend({ mode: 'medio', taskKind: 'memorizar', availableMin: 60 });
    expect(r.evidence.map((e) => e.technique)).toEqual([r.primary, r.complementary]);
  });
});

describe('personalização pelos resultados', () => {
  const rec = (technique: OutcomeRecord['technique'], outcome: number, n: number, kind: OutcomeRecord['taskKind'] = 'memorizar'): OutcomeRecord[] =>
    Array.from({ length: n }, (_, i) => ({ technique, outcome, taskKind: kind, at: i }));

  it('resultado normalizado combina confiança e acertos', () => {
    expect(outcomeOf({ confidence: 5 })).toBe(1);
    expect(outcomeOf({ confidence: 5, correct: 5, total: 10 })).toBeCloseTo(0.75, 6);
    expect(outcomeOf({ confidence: 1, correct: 0, total: 10 })).toBeCloseTo(0.1, 6);
  });

  it('poucos dados não mudam nada; dados suficientes com diferença clara trocam a ordem', () => {
    const few = [...rec('recuperacao_ativa', 0.2, MIN_SESSIONS - 1), ...rec('repeticao_espacada', 0.9, MIN_SESSIONS - 1)];
    expect(recommend({ mode: 'medio', taskKind: 'memorizar', availableMin: 60, history: few }).primary).toBe('recuperacao_ativa');
    const enough = [...rec('recuperacao_ativa', 0.3, 5), ...rec('repeticao_espacada', 0.9, 5)];
    const r = recommend({ mode: 'medio', taskKind: 'memorizar', availableMin: 60, history: enough });
    expect(r.primary).toBe('repeticao_espacada');
    expect(r.complementary).toBe('recuperacao_ativa');
    expect(r.personalized).toBe(true);
    expect(r.justification.join(' ')).toMatch(/não prova de eficácia/);
  });

  it('diferença pequena não troca; nunca sai do conjunto permitido pela regra', () => {
    const close = [...rec('recuperacao_ativa', 0.7, 5), ...rec('repeticao_espacada', 0.75, 5)];
    expect(personalize('recuperacao_ativa', 'repeticao_espacada', close, 'memorizar', {}).primary).toBe('recuperacao_ativa');
    const withOther = [...rec('recuperacao_ativa', 0.3, 5), ...rec('pomodoro', 1, 20), ...rec('repeticao_espacada', 0.35, 5)];
    expect(['recuperacao_ativa', 'repeticao_espacada']).toContain(recommend({ mode: 'medio', taskKind: 'memorizar', availableMin: 60, history: withOther }).primary);
    expect(MARGIN).toBeGreaterThan(0);
  });

  it('prior evita conclusões com 1 ou 2 sessões', () => {
    const s = statsFor(rec('feynman', 1, 2), 'feynman', 'memorizar');
    expect(s.shrunk).toBeLessThan(0.8);
    expect(s.n).toBe(2);
  });
});
