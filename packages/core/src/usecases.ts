import { generateWeeklyPlan, type PlanBlock, type PlanResult } from '@estuda/engine';
import type { Deps } from './ports';

const DAY_MS = 86_400_000;

/** 00:00 UTC do dia de `d`. */
export function startOfDayUTC(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

const MIN_MS = 60_000;

/** Deslocamento do fuso do usuário (minutos a leste do UTC) no instante atual. */
export const tzOffset = (deps: Pick<Deps, 'clock'>): number => deps.clock.offsetMin?.(deps.clock.now()) ?? 0;

/** Meia-noite local (como instante) do dia local de `d`. */
export function startOfDay(d: Date, offsetMin = 0): Date {
  const local = d.getTime() + offsetMin * MIN_MS;
  return new Date(Math.floor(local / DAY_MS) * DAY_MS - offsetMin * MIN_MS);
}

/** Dia local no formato YYYY-MM-DD. */
export function localDayKey(d: Date, offsetMin = 0): string {
  return new Date(d.getTime() + offsetMin * MIN_MS).toISOString().slice(0, 10);
}

/** Instante em que o plano passa a ser gerado: o maior entre agora e a data de início do perfil. */
export async function planStartInstant(deps: Deps): Promise<Date> {
  const now = deps.clock.now();
  const off = tzOffset(deps);
  const profile = await deps.store.getProfile();
  if (profile?.planStart && /^\d{4}-\d{2}-\d{2}$/.test(profile.planStart)) {
    const [y, m, d] = profile.planStart.split('-').map(Number) as [number, number, number];
    const startLocal = new Date(Date.UTC(y, m - 1, d) - off * MIN_MS);
    if (startLocal.getTime() > now.getTime()) return startLocal;
  }
  return now;
}

/**
 * Gera e persiste o plano dos próximos 7 dias.
 * Mantém como fixos: blocos já passados (histórico) e blocos travados futuros.
 * Blocos perdidos recentes geram reposição (carry-over).
 */
export async function planWeek(deps: Deps): Promise<PlanResult> {
  const { store, clock, notifier } = deps;
  const profile = await store.getProfile();
  if (!profile) throw new Error('Perfil não configurado: conclua o onboarding.');
  const realNow = clock.now();
  const now = await planStartInstant(deps); // início efetivo do plano (hoje ou a data escolhida)
  const off = tzOffset(deps);
  const weekStart = startOfDay(now, off);
  const [rawSubjects, deadlines, windows, current, topics, projects, milestones] = await Promise.all([
    store.listSubjects(),
    store.listDeadlines(),
    store.listWindows(),
    store.listPlan(),
    store.listTopics(),
    store.listProjects(),
    store.listMilestones(),
  ]);
  const projectSlots = projects
    .filter((p) => p.finalDate > now && milestones.some((m) => m.projectId === p.id && !m.done && m.effortShare > 0))
    .map((p) => ({ id: p.id, blocks: Math.max(1, Math.round((p.hoursPerWeek * 60) / profile.focusMin)) }));
  const subjects = rawSubjects.map((s) => {
    const ts = topics.filter((t) => t.subjectId === s.id && t.kind !== 'unidade');
    return ts.length ? { ...s, unseenRatio: ts.filter((t) => t.status === 'nao_visto').length / ts.length } : s;
  });
  const horizon = weekStart.getTime() + 7 * DAY_MS;
  const inHorizon = current.filter((b) => b.start.getTime() >= weekStart.getTime() && b.start.getTime() < horizon);
  const fixed = inHorizon.filter((b) => b.start < realNow || b.locked || b.missed);
  // Histórico anterior ao início do plano (até 14 dias): o que já passou ou foi travado/perdido.
  const history = current.filter(
    (b) => b.start.getTime() < weekStart.getTime() && b.start.getTime() >= weekStart.getTime() - 14 * DAY_MS && (b.start < realNow || b.locked || b.missed),
  );
  // Perdidos de hoje em diante (do início do dia) pedem reposição.
  const carryOver: Record<string, number> = {};
  for (const b of inHorizon) if (b.missed) carryOver[b.subjectId] = (carryOver[b.subjectId] ?? 0) + 1;
  const result = generateWeeklyPlan({ weekStart, profile, subjects, deadlines, windows, topics, locked: fixed, from: now, carryOver, projectSlots, tzOffsetMin: off });
  await store.savePlan([...history, ...result.blocks]);
  await notifier?.schedule(result.blocks.filter((b) => b.start >= realNow && !b.missed));
  return result;
}

/** Blocos do dia local de `day`, ordenados. */
export async function blocksForDay(deps: Deps, day: Date = deps.clock.now()): Promise<PlanBlock[]> {
  const from = startOfDay(day, tzOffset(deps)).getTime();
  const plan = await deps.store.listPlan();
  return plan
    .filter((b) => b.start.getTime() >= from && b.start.getTime() < from + DAY_MS)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
}

/** Trava/destrava um bloco para o motor não movê-lo. */
export async function setBlockLocked(deps: Deps, start: Date, locked: boolean): Promise<void> {
  const plan = await deps.store.listPlan();
  await deps.store.savePlan(
    plan.map((b) => (b.start.getTime() === start.getTime() ? { ...b, locked } : b)),
  );
}

/**
 * Gera o plano de novo ao abrir o app quando ele ficou velho: sem nenhum bloco futuro
 * ou com cobertura menor que 2 dias. Evita mostrar só horários que já passaram.
 */
export async function ensureFreshPlan(deps: Deps): Promise<boolean> {
  const profile = await deps.store.getProfile();
  if (!profile) return false;
  const now = deps.clock.now().getTime();
  const plan = await deps.store.listPlan();
  const future = plan.filter((b) => !b.missed && b.start.getTime() >= now);
  const lastFuture = future.reduce((m, b) => Math.max(m, b.start.getTime()), 0);
  if (future.length > 0 && lastFuture >= now + 2 * DAY_MS) return false;
  await planWeek(deps);
  return true;
}
