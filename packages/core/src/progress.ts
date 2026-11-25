import type { Profile } from '@estuda/engine';
import type { Deps } from './ports';
import { doneByBlock, isBlockDone } from './sessions';
import { planWeek, startOfDayUTC } from './usecases';

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
  const today = startOfDayUTC(now).getTime();
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

  const studiedDays = new Set(sessions.map((s) => Math.floor(startOfDayUTC(s.startedAt).getTime() / DAY_MS)));
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
