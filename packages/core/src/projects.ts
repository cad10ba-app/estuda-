import {
  dailyGoal, projectRisk, scheduleDates, scheduleMilestones,
  type Milestone, type Project, type ProjectModel, type ProjectRisk, type ProjectUnit,
} from '@estuda/engine';
import type { Deps } from './ports';
import { planWeek, startOfDayUTC } from './usecases';

const DAY_MS = 86_400_000;
const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export interface CreateProjectInput {
  model: ProjectModel;
  title: string;
  /** YYYY-MM-DD */
  finalDate: string;
  hoursPerWeek: number;
  unit?: ProjectUnit;
  targetUnits?: number;
}

/** REQ-020/021: cria projeto a partir do modelo, com marcos calculados de trás para frente. */
export async function createProject(deps: Deps, input: CreateProjectInput) {
  const title = input.title.trim();
  if (!title) throw new Error('Título do projeto é obrigatório.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.finalDate)) throw new Error('Data final inválida.');
  const finalDate = new Date(`${input.finalDate}T00:00:00Z`);
  const startDate = startOfDayUTC(deps.clock.now());
  if (!(finalDate.getTime() - startDate.getTime() >= 7 * DAY_MS)) throw new Error('A data final deve estar a pelo menos 7 dias de hoje.');
  if (!(input.hoursPerWeek > 0 && input.hoursPerWeek <= 60)) throw new Error('Horas por semana deve estar entre 0 e 60.');
  const id = `${deps.clock.now().getTime()}-${Math.random().toString(36).slice(2, 6)}`;
  const project: Project = {
    id, title, model: input.model, startDate, finalDate,
    hoursPerWeek: input.hoursPerWeek, unit: input.unit ?? 'palavras', targetUnits: input.targetUnits || undefined,
  };
  await deps.store.saveProject(project);
  const milestones: Milestone[] = scheduleMilestones(input.model, startDate, finalDate).map((m, i) => ({
    id: `${id}-m${i}`, projectId: id, title: m.title, targetDate: m.targetDate, effortShare: m.share, done: false, order: i,
  }));
  for (const m of milestones) await deps.store.saveMilestone(m);
  const plan = await planWeek(deps);
  return { project, milestones, warnings: plan.warnings };
}

export async function deleteProjectAndReplan(deps: Deps, id: string) {
  await deps.store.deleteProject(id);
  await planWeek(deps);
}

/** Marca/desmarca um marco como concluído; ao concluir todos os de esforço, a escrita sai do plano. */
export async function setMilestoneDone(deps: Deps, milestoneId: string, done: boolean) {
  const m = (await deps.store.listMilestones()).find((x) => x.id === milestoneId);
  if (!m) throw new Error('Marco não encontrado.');
  await deps.store.saveMilestone({ ...m, done });
  await planWeek(deps);
}

/** REQ-022: registra quantidade escrita no dia (soma com o registro existente do mesmo dia). */
export async function logWriting(deps: Deps, input: { projectId: string; amount: number; date?: string }) {
  if (!(input.amount > 0)) throw new Error('Informe uma quantidade maior que zero.');
  const date = input.date ?? isoDay(deps.clock.now());
  const id = `${input.projectId}-${date}`;
  const prev = (await deps.store.listWritingLogs()).find((l) => l.id === id);
  await deps.store.saveWritingLog({ id, projectId: input.projectId, date, amount: (prev?.amount ?? 0) + input.amount });
}

export interface ProjectStatus {
  project: Project;
  milestones: Milestone[];
  written: number;
  writtenToday: number;
  goalToday?: number;
  risk: ProjectRisk;
  nextMilestone?: Milestone;
}

export async function projectStatus(deps: Deps, projectId: string): Promise<ProjectStatus> {
  const now = deps.clock.now();
  const [projects, allMs, logs] = await Promise.all([deps.store.listProjects(), deps.store.listMilestones(), deps.store.listWritingLogs()]);
  const project = projects.find((p) => p.id === projectId);
  if (!project) throw new Error('Projeto não encontrado.');
  const milestones = allMs.filter((m) => m.projectId === projectId).sort((a, b) => a.order - b.order);
  const mine = logs.filter((l) => l.projectId === projectId);
  const written = mine.reduce((a, l) => a + l.amount, 0);
  const today = isoDay(now);
  const writtenToday = mine.filter((l) => l.date === today).reduce((a, l) => a + l.amount, 0);
  // Meta de hoje = o que falta ÷ dias restantes, calculada sem contar o já escrito hoje.
  const goalToday = dailyGoal(project, written - writtenToday, now);
  return {
    project, milestones, written, writtenToday, goalToday,
    risk: projectRisk(project, milestones, now),
    nextMilestone: milestones.find((m) => !m.done),
  };
}

/** Redistribui só os marcos ainda não concluídos entre hoje e o fim do trabalho útil (após atraso). */
export async function rescheduleProject(deps: Deps, projectId: string) {
  const { project, milestones } = await projectStatus(deps, projectId);
  const today = startOfDayUTC(deps.clock.now());
  const pending = milestones.filter((m) => !m.done);
  if (pending.length === 0) return;
  if (project.finalDate.getTime() - today.getTime() < DAY_MS) throw new Error('Prazo final já está encerrado ou é hoje.');
  const dates = scheduleDates(pending.map((m) => m.effortShare), today, project.finalDate);
  for (let i = 0; i < pending.length; i++) await deps.store.saveMilestone({ ...pending[i]!, targetDate: dates[i]! });
}
