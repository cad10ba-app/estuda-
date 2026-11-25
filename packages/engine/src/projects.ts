export type ProjectModel = 'tcc' | 'dissertacao' | 'tese' | 'artigo';
export type ProjectUnit = 'palavras' | 'paginas';

export interface Project {
  id: string;
  title: string;
  model: ProjectModel;
  startDate: Date;
  finalDate: Date;
  hoursPerWeek: number;
  unit: ProjectUnit;
  targetUnits?: number;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  targetDate: Date;
  /** Fração do esforço total (0 = marco de entrega/defesa, na data final). */
  effortShare: number;
  done: boolean;
  order: number;
}

export const MODEL_LABEL: Record<ProjectModel, string> = {
  tcc: 'TCC',
  dissertacao: 'Dissertação',
  tese: 'Tese',
  artigo: 'Artigo científico',
};

/** Templates de marcos (docs/05). Participações de esforço somam 1; marcos com 0 caem na data final. */
export const PROJECT_TEMPLATES: Record<ProjectModel, { title: string; share: number }[]> = {
  tcc: [
    { title: 'Definir tema e orientador', share: 0.05 },
    { title: 'Projeto / proposta', share: 0.1 },
    { title: 'Revisão da literatura', share: 0.18 },
    { title: 'Metodologia', share: 0.1 },
    { title: 'Coleta / desenvolvimento', share: 0.2 },
    { title: 'Análise e resultados', share: 0.15 },
    { title: 'Escrita final', share: 0.14 },
    { title: 'Revisão do orientador', share: 0.05 },
    { title: 'Formatação ABNT', share: 0.03 },
    { title: 'Entrega', share: 0 },
    { title: 'Banca', share: 0 },
  ],
  dissertacao: [
    { title: 'Disciplinas e créditos', share: 0.1 },
    { title: 'Projeto de pesquisa', share: 0.08 },
    { title: 'Qualificação', share: 0.12 },
    { title: 'Revisão sistemática', share: 0.15 },
    { title: 'Coleta de dados', share: 0.17 },
    { title: 'Análise', share: 0.13 },
    { title: 'Escrita dos capítulos', share: 0.15 },
    { title: 'Revisão do orientador', share: 0.05 },
    { title: 'Depósito', share: 0.05 },
    { title: 'Defesa', share: 0 },
  ],
  tese: [
    { title: 'Disciplinas e créditos', share: 0.08 },
    { title: 'Projeto de pesquisa', share: 0.07 },
    { title: 'Qualificação', share: 0.1 },
    { title: 'Revisão da literatura', share: 0.12 },
    { title: 'Coleta de dados', share: 0.2 },
    { title: 'Análise', share: 0.15 },
    { title: 'Artigos publicados', share: 0.08 },
    { title: 'Escrita dos capítulos', share: 0.12 },
    { title: 'Revisão do orientador', share: 0.04 },
    { title: 'Depósito', share: 0.04 },
    { title: 'Defesa', share: 0 },
  ],
  artigo: [
    { title: 'Pergunta de pesquisa', share: 0.05 },
    { title: 'Revisão da literatura', share: 0.2 },
    { title: 'Método', share: 0.15 },
    { title: 'Resultados', share: 0.2 },
    { title: 'Rascunho', share: 0.25 },
    { title: 'Revisão dos coautores', share: 0.1 },
    { title: 'Submissão', share: 0.05 },
    { title: 'Revisões do periódico', share: 0 },
  ],
};

const DAY_MS = 86_400_000;
const dayStart = (t: number) => Math.floor(t / DAY_MS) * DAY_MS;

/** Folga antes da entrega: máx(7 dias, 10% do prazo), limitada a metade do prazo. */
export function slackMs(start: Date, final: Date): number {
  const total = final.getTime() - start.getTime();
  return Math.min(total / 2, Math.max(7 * DAY_MS, total * 0.1));
}

/**
 * Engenharia reversa: distribui os marcos de `start` até `final - folga`,
 * proporcionalmente ao esforço. Marcos de esforço 0 ficam na data final.
 */
export function scheduleDates(shares: number[], start: Date, final: Date): Date[] {
  const total = final.getTime() - start.getTime();
  if (total <= 0) throw new Error('A data final deve ser posterior ao início.');
  const usable = total - slackMs(start, final);
  const sum = shares.reduce((a, b) => a + b, 0) || 1;
  let cum = 0;
  return shares.map((sh) => {
    if (sh === 0) return new Date(dayStart(final.getTime()));
    cum += sh;
    return new Date(dayStart(start.getTime() + (usable * cum) / sum));
  });
}

export function scheduleMilestones(model: ProjectModel, start: Date, final: Date): { title: string; share: number; targetDate: Date }[] {
  const t = PROJECT_TEMPLATES[model];
  const dates = scheduleDates(t.map((m) => m.share), start, final);
  return t.map((m, i) => ({ title: m.title, share: m.share, targetDate: dates[i]! }));
}

export type RiskLevel = 'verde' | 'amarelo' | 'vermelho';

export interface ProjectRisk {
  /** Progresso esperado até agora (0–1), linear até o fim do trabalho útil. */
  expected: number;
  /** Progresso concluído (0–1) pelo esforço dos marcos feitos. */
  completed: number;
  gap: number;
  level: RiskLevel;
}

/** REQ-024: risco = esperado − concluído. Verde < 10%, amarelo ≤ 25%, vermelho > 25%. */
export function projectRisk(project: Project, milestones: Milestone[], now: Date): ProjectRisk {
  const work = milestones.filter((m) => m.effortShare > 0);
  const totalShare = work.reduce((a, m) => a + m.effortShare, 0) || 1;
  const completed = work.filter((m) => m.done).reduce((a, m) => a + m.effortShare, 0) / totalShare;
  const usableEnd = project.finalDate.getTime() - slackMs(project.startDate, project.finalDate);
  const span = usableEnd - project.startDate.getTime();
  const expected = span <= 0 ? 1 : Math.min(1, Math.max(0, (now.getTime() - project.startDate.getTime()) / span));
  const gap = expected - completed;
  return { expected, completed, gap, level: gap < 0.1 ? 'verde' : gap <= 0.25 ? 'amarelo' : 'vermelho' };
}

/** Meta diária de escrita: unidades restantes / dias até o fim do trabalho útil. */
export function dailyGoal(project: Project, written: number, now: Date): number | undefined {
  if (!project.targetUnits) return undefined;
  const usableEnd = project.finalDate.getTime() - slackMs(project.startDate, project.finalDate);
  const days = Math.max(1, Math.ceil((usableEnd - now.getTime()) / DAY_MS));
  return Math.max(0, Math.ceil((project.targetUnits - written) / days));
}
