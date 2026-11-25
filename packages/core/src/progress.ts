import type { Profile } from '@estuda/engine';
import type { Deps } from './ports';
import { doneByBlock, isBlockDone } from './sessions';
import { planWeek, startOfDay, tzOffset } from './usecases';

const DAY_MS = 86_400_000;

export interface SubjectProgress {
  subjectId: string;
  plannedMin: number;
  actualMin: number;
}

export interface WeeklyReport {
  from: Date;
  to: Date;
  plannedMin: number;
  actualMin: number;
  blocksPast: number;
  blocksDone: number;
  blocksMissed: number;
  /** Fração 0–1 de blocos passados concluídos (0 se não houve blocos). */
  adherence: number;
  /** Dias consecutivos com estudo, contando a partir de hoje (ou de ontem se hoje ainda não teve). */
  streak: number;
  cardsReviewed: number;
  bySubject: SubjectProgress[];
}

/** REQ-026: relatório dos últimos 7 dias (hoje incluído). */
export async function weeklyReport(deps: Deps): Promise<WeeklyReport> {
  const now = deps.clock.now();
  const off = tzOffset(deps);
  const today = startOfDay(now, off).getTime();
  const from = new Date(today - 6 * DAY_MS);
  const [plan, sessions, cards] = await Promise.all([deps.store.listPlan(), deps.store.listSessions(), deps.store.listCards()]);
  const inWindow = (t: number) => t >= from.getTime() && t < today + DAY_MS;
  const past = plan.filter((b) => inWindow(b.start.getTime()) && b.start < now);
  const winSessions = sessions.filter((s) => inWindow(s.startedAt.getTime()));
  const done = doneByBlock(winSessions);
  const blocksDone = past.filter((b) => !b.missed && isBlockDone(b, done)).length;

  const subj = new Map<string, SubjectProgress>();
  const row = (id: string) => {
    let r = subj.get(id);
    if (!r) subj.set(id, (r = { subjectId: id, plannedMin: 0, actualMin: 0 }));
    return r;
  };
  for (const b of past) row(b.subjectId).plannedMin += b.durationMin;
  for (const s of winSessions) row(s.subjectId).actualMin += s.actualMin;

  const studiedDays = new Set(sessions.map((s) => Math.floor(startOfDay(s.startedAt, off).getTime() / DAY_MS)));
  let d = Math.floor(today / DAY_MS);
  if (!studiedDays.has(d)) d -= 1;
  let streak = 0;
  while (studiedDays.has(d)) { streak++; d--; }

  return {
    from,
    to: new Date(today),
    plannedMin: past.reduce((a, b) => a + b.durationMin, 0),
    actualMin: winSessions.reduce((a, s) => a + s.actualMin, 0),
    blocksPast: past.length,
    blocksDone,
    blocksMissed: past.filter((b) => b.missed).length,
    adherence: past.length ? blocksDone / past.length : 0,
    streak,
    cardsReviewed: cards.filter((c) => c.lastReviewedAt && inWindow(c.lastReviewedAt.getTime())).length,
    bySubject: [...subj.values()].sort((a, b) => b.plannedMin - a.plannedMin),
  };
}

export interface Suggestion {
  kind: 'carga' | 'faltas' | 'disciplina' | 'ok';
  text: string;
  subjectId?: string;
}

/** Sugestões baseadas em regras a partir do relatório (apoia a retrospectiva). */
export function suggestionsFor(r: WeeklyReport): Suggestion[] {
  const out: Suggestion[] = [];
  if (r.blocksPast === 0) return [{ kind: 'ok', text: 'Ainda não há blocos passados nesta semana para avaliar.' }];
  if (r.adherence < 0.5) out.push({ kind: 'carga', text: `Você concluiu ${Math.round(r.adherence * 100)}% dos blocos. Vale reduzir a carga diária.` });
  if (r.blocksMissed >= 3) out.push({ kind: 'faltas', text: `${r.blocksMissed} blocos perdidos. Teste outros horários ou períodos de estudo.` });
  for (const s of r.bySubject) {
    if (s.plannedMin >= 50 && s.actualMin < s.plannedMin * 0.5) {
      out.push({ kind: 'disciplina', subjectId: s.subjectId, text: 'Esta disciplina ficou abaixo de 50% do planejado.' });
    }
  }
  if (out.length === 0) out.push({ kind: 'ok', text: 'Boa semana! Mantenha o ritmo.' });
  return out;
}

export interface RetrospectiveAnswers {
  /** Como foi a carga da semana. */
  load: 'leve' | 'ok' | 'pesada';
  /** Disciplina que pareceu mais difícil (opcional): sobe a dificuldade em 1. */
  hardSubjectId?: string;
}

/** REQ-027: aplica as respostas da retrospectiva ao perfil/disciplinas e replaneja. */
export async function applyRetrospective(deps: Deps, a: RetrospectiveAnswers): Promise<string[]> {
  const changes: string[] = [];
  const profile = await deps.store.getProfile();
  if (!profile) throw new Error('Perfil não configurado.');
  const minLoad = profile.focusMin * 2;
  let next: Profile = profile;
  if (a.load === 'pesada') {
    next = { ...profile, dailyLoadMin: Math.max(minLoad, Math.round((profile.dailyLoadMin * 0.8) / 5) * 5) };
  } else if (a.load === 'leve') {
    next = { ...profile, dailyLoadMin: Math.round((profile.dailyLoadMin * 1.2) / 5) * 5 };
  }
  if (next.dailyLoadMin !== profile.dailyLoadMin) {
    await deps.store.saveProfile(next);
    changes.push(`Carga diária: ${profile.dailyLoadMin} → ${next.dailyLoadMin} min.`);
  }
  if (a.hardSubjectId) {
    const s = (await deps.store.listSubjects()).find((x) => x.id === a.hardSubjectId);
    if (s && s.difficulty < 5) {
      await deps.store.saveSubject({ ...s, difficulty: s.difficulty + 1 });
      changes.push(`Dificuldade de ${s.name}: ${s.difficulty} → ${s.difficulty + 1}.`);
    }
  }
  await planWeek(deps);
  if (changes.length === 0) changes.push('Nenhum ajuste necessário; plano mantido.');
  return changes;
}

export interface LearningSummary {
  /** Atividade: o estudante realizou sessões. */
  activity: { sessions: number; minutes: number };
  /** Desempenho: acertos em perguntas/exercícios (null sem dados). */
  performance: { answered: number; accuracy: number | null };
  /** Percepção: confiança e dificuldade autodeclaradas (null sem dados). */
  perception: { rated: number; confidence: number | null; difficulty: number | null };
  /** Progresso: tarefas, tópicos e marcos concluídos. */
  progress: { tasksDone: number; tasksTotal: number; topicsSeen: number; topicsTotal: number; milestonesDone: number; milestonesTotal: number };
  /** Como o estudante usou as recomendações (doc 12 §14). */
  recommendations: { recomendada: number; trocada: number; personalizada: number };
  /** Revisões feitas (cartões revisados e revisões de tópicos concluídas) e pendentes. */
  reviews: { pending: number };
}

/** Doc 12 §5.8: separa atividade, desempenho, percepção e progresso. Janela: últimos 7 dias para sessões. */
export async function learningSummary(deps: Deps): Promise<LearningSummary> {
  const now = deps.clock.now();
  const from = startOfDay(now, tzOffset(deps)).getTime() - 6 * DAY_MS;
  const [sessions, tasks, topics, milestones, reviews, cards] = await Promise.all([
    deps.store.listSessions(), deps.store.listTasks(), deps.store.listTopics(), deps.store.listMilestones(),
    deps.store.listTopicReviews(), deps.store.listCards(),
  ]);
  const win = sessions.filter((s) => s.startedAt.getTime() >= from);
  const rated = win.filter((s) => s.assessment);
  const scored = rated.filter((s) => s.assessment!.total && s.assessment!.correct !== undefined);
  const totalQ = scored.reduce((a, s) => a + s.assessment!.total!, 0);
  const rightQ = scored.reduce((a, s) => a + s.assessment!.correct!, 0);
  const avg = (f: (s: (typeof rated)[number]) => number) => rated.length ? rated.reduce((a, s) => a + f(s), 0) / rated.length : null;
  const real = topics.filter((t) => t.kind !== 'unidade');
  const choice = (c: 'recomendada' | 'trocada' | 'personalizada') => win.filter((s) => s.choice === c).length;
  const nowMs = now.getTime();
  return {
    activity: { sessions: win.length, minutes: win.reduce((a, s) => a + s.actualMin, 0) },
    performance: { answered: totalQ, accuracy: totalQ > 0 ? rightQ / totalQ : null },
    perception: { rated: rated.length, confidence: avg((s) => s.assessment!.confidence), difficulty: avg((s) => s.assessment!.difficulty) },
    progress: {
      tasksDone: tasks.filter((t) => t.done).length, tasksTotal: tasks.length,
      topicsSeen: real.filter((t) => t.status !== 'nao_visto').length, topicsTotal: real.length,
      milestonesDone: milestones.filter((m) => m.done).length, milestonesTotal: milestones.length,
    },
    recommendations: { recomendada: choice('recomendada'), trocada: choice('trocada'), personalizada: choice('personalizada') },
    reviews: {
      pending: reviews.filter((r) => !r.done && r.due.getTime() <= nowMs).length + cards.filter((c) => c.due.getTime() <= nowMs).length,
    },
  };
}
