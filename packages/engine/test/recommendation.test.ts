import { describe, expect, it } from 'vitest';
import { MVP_TECHNIQUES, TECHNIQUES, TECHNIQUE_BY_ID, buildSteps, compatibleTechniques, recommend, type TaskKind } from '../src';

describe('catálogo de técnicas', () => {
  it('tem as 15 técnicas do documento e 4 ativas no MVP', () => {
    expect(TECHNIQUES).toHaveLength(15);
    expect(new Set(TECHNIQUES.map((t) => t.id)).size).toBe(15);
    expect(MVP_TECHNIQUES.sort()).toEqual(['pomodoro', 'pratica_exercicios', 'recuperacao_ativa', 'repeticao_espacada']);
    for (const t of TECHNIQUES) {
      expect(t.howTo.length, t.id).toBeGreaterThan(0);
      expect(t.verification, t.id).toBeTruthy();
      expect(t.accessible, t.id).toBeTruthy();
    }
  });
});

describe('recomendação', () => {
  const kinds: TaskKind[] = ['memorizar', 'resolver', 'compreender', 'prova', 'ler', 'escrever', 'idioma', 'organizar', 'geral'];

  it('sempre recomenda técnica habilitada, com justificativa e passos que somam a duração', () => {
    for (const k of kinds) for (const mode of ['fund2', 'medio', 'superior', 'pos', 'livre'] as const) {
      const r = recommend({ mode, taskKind: k, availableMin: 60 });
      expect(MVP_TECHNIQUES, `${mode}/${k}`).toContain(r.primary);
      if (r.complementary) expect(MVP_TECHNIQUES).toContain(r.complementary);
      expect(r.justification.length).toBeGreaterThan(0);
      expect(r.steps.reduce((a, s) => a + s.minutes, 0), `${mode}/${k}`).toBe(r.durationMin);
      expect(r.steps.every((s) => s.minutes >= 1)).toBe(true);
    }
  });

  it('segue a tabela do documento', () => {
    expect(recommend({ mode: 'medio', taskKind: 'memorizar', availableMin: 60 })).toMatchObject({ primary: 'recuperacao_ativa', complementary: 'repeticao_espacada', reviewSuggested: true });
    expect(recommend({ mode: 'medio', taskKind: 'resolver', availableMin: 60 }).primary).toBe('pratica_exercicios');
    expect(recommend({ mode: 'medio', taskKind: 'prova', availableMin: 60 })).toMatchObject({ primary: 'recuperacao_ativa', complementary: 'pratica_exercicios' });
    expect(recommend({ mode: 'pos', taskKind: 'escrever', availableMin: 90 }).primary).toBe('pomodoro');
  });

  it('explica quando usa alternativa por técnica ainda indisponível', () => {
    const r = recommend({ mode: 'superior', taskKind: 'compreender', availableMin: 60 });
    expect(r.justification.join(' ')).toMatch(/ainda não está disponível/);
  });

  it('ajusta ao tempo disponível e à autonomia', () => {
    const short = recommend({ mode: 'superior', taskKind: 'resolver', availableMin: 20 });
    expect(short.durationMin).toBeLessThanOrEqual(20);
    const guided = recommend({ mode: 'medio', taskKind: 'resolver', availableMin: 120, autonomy: 'guiada' });
    const free = recommend({ mode: 'medio', taskKind: 'resolver', availableMin: 120, autonomy: 'alta' });
    expect(guided.durationMin).toBeLessThan(free.durationMin);
  });

  it('sugere variar após uso repetido da mesma técnica', () => {
    const r = recommend({ mode: 'medio', taskKind: 'memorizar', availableMin: 60, recentTechniques: ['recuperacao_ativa', 'recuperacao_ativa', 'recuperacao_ativa'] });
    expect(r.primary).toBe('repeticao_espacada');
    expect(r.justification.join(' ')).toMatch(/outra abordagem/);
  });

  it('compatíveis para trocar: só habilitadas, sem repetir, ideal primeiro', () => {
    const c = compatibleTechniques({ taskKind: 'resolver' });
    expect(c[0]).toBe('pratica_exercicios');
    expect(new Set(c).size).toBe(c.length);
    expect(c.every((t) => TECHNIQUE_BY_ID[t].mvp)).toBe(true);
  });

  it('pomodoro alterna foco e pausa; tempos curtos geram etapa única', () => {
    const s = buildSteps('pomodoro', 60);
    expect(s.reduce((a, x) => a + x.minutes, 0)).toBe(60);
    expect(s.some((x) => x.kind === 'pausa')).toBe(true);
    expect(buildSteps('recuperacao_ativa', 5).reduce((a, x) => a + x.minutes, 0)).toBe(5);
  });
});
