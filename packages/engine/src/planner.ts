import { computePriorities, daysToNextDeadline } from './priority';
import type { AvailabilityWindow, BlockType, PlanBlock, PlanInput, PlanResult, Profile, Topic } from './types';

const DAY_MS = 86_400_000;
const MIN_MS = 60_000;

interface Slot {
  start: Date;
}

function overlaps(aStart: number, aDur: number, b: PlanBlock): boolean {
  const bs = b.start.getTime();
  const be = bs + b.durationMin * MIN_MS;
  const as = aStart;
  const ae = aStart + aDur * MIN_MS;
  return as < be && bs < ae;
}

/** Todos os horários possíveis de início de bloco nos 7 dias, ignorando limites de carga. */
export function windowSlots(weekStart: Date, profile: Profile, windows: AvailabilityWindow[]): Date[] {
  const step = profile.focusMin + profile.breakMin;
  const out: Date[] = [];
  for (let d = 0; d < 7; d++) {
    const day = new Date(weekStart.getTime() + d * DAY_MS);
    const weekday = day.getUTCDay();
    for (const w of windows.filter((x) => x.weekday === weekday).sort((a, b) => a.startMin - b.startMin)) {
      for (let m = w.startMin; m + profile.focusMin <= w.endMin; m += step) {
        out.push(new Date(day.getTime() + m * MIN_MS));
      }
    }
  }
  return out;
}

function buildSlots(input: PlanInput): Slot[] {
  const { weekStart, profile, windows, locked = [], from } = input;
  const maxPerDay = Math.floor(profile.dailyLoadMin / profile.focusMin);
  const dayIdx = (t: number) => Math.floor((t - weekStart.getTime()) / DAY_MS);
  const used = new Map<number, number>();
  for (const b of locked) used.set(dayIdx(b.start.getTime()), (used.get(dayIdx(b.start.getTime())) ?? 0) + 1);
  const slots: Slot[] = [];
  for (const start of windowSlots(weekStart, profile, windows)) {
    const t = start.getTime();
    if (from && t < from.getTime()) continue;
    if (locked.some((b) => overlaps(t, profile.focusMin, b))) continue;
    const k = dayIdx(t);
    if ((used.get(k) ?? 0) >= maxPerDay) continue;
    used.set(k, (used.get(k) ?? 0) + 1);
    slots.push({ start });
  }
  return slots;
}

/** Garante ao menos `carry[id]` blocos para disciplinas com reposição, tirando das de menor prioridade. */
export function applyCarryOver(
  alloc: Record<string, number>,
  priorities: Record<string, number>,
  carry: Record<string, number>,
): { alloc: Record<string, number>; short: Record<string, number> } {
  const out = { ...alloc };
  const short: Record<string, number> = {};
  const donors = () =>
    Object.keys(out)
      .filter((id) => (out[id] ?? 0) > 1 && !(id in carry))
      .sort((a, b) => (priorities[a] ?? 0) - (priorities[b] ?? 0));
  for (const [id, want] of Object.entries(carry)) {
    if (!(id in out)) continue;
    while ((out[id] ?? 0) < want) {
      const donor = donors()[0];
      if (!donor) break;
      out[donor] = (out[donor] ?? 0) - 1;
      out[id] = (out[id] ?? 0) + 1;
    }
    if ((out[id] ?? 0) < want) short[id] = want - (out[id] ?? 0);
  }
  return { alloc: out, short };
}

/** Distribui `total` blocos proporcionalmente (maior resto), com mínimo 1 por disciplina se couber. */
export function allocateBlocks(priorities: Record<string, number>, total: number): Record<string, number> {
  const ids = Object.keys(priorities);
  const out: Record<string, number> = Object.fromEntries(ids.map((id) => [id, 0]));
  if (ids.length === 0 || total <= 0) return out;
  let remaining = total;
  if (total >= ids.length) {
    for (const id of ids) out[id] = 1;
    remaining -= ids.length;
  }
  const sum = ids.reduce((a, id) => a + (priorities[id] ?? 0), 0) || 1;
  const shares = ids.map((id) => ({ id, exact: (remaining * (priorities[id] ?? 0)) / sum }));
  let given = 0;
  for (const s of shares) {
    const f = Math.floor(s.exact);
    out[s.id] = (out[s.id] ?? 0) + f;
    given += f;
  }
  shares.sort((a, b) => b.exact - Math.floor(b.exact) - (a.exact - Math.floor(a.exact)));
  for (let i = 0; given < remaining; i = (i + 1) % shares.length) {
    const s = shares[i]!;
    out[s.id] = (out[s.id] ?? 0) + 1;
    given++;
  }
  return out;
}

function blockType(daysLeft: number | null, indexInSubject: number): BlockType {
  if (daysLeft === null || daysLeft > 14) return 'estudo';
  if (daysLeft > 3) return indexInSubject % 2 === 0 ? 'estudo' : 'revisao';
  return indexInSubject % 3 === 2 ? 'simulado' : 'revisao';
}

/**
 * Escolhe o tópico do bloco. Estudo: primeiro os "estudando", depois os "não vistos", em ordem.
 * Revisão/simulado: tópicos já vistos (estudando/dominado). Gira por `n` para variar.
 */
export function pickTopic(topics: Topic[], type: BlockType, n: number): Topic | undefined {
  const sorted = [...topics].sort((a, b) => a.order - b.order);
  const pool =
    type === 'estudo'
      ? [...sorted.filter((t) => t.status === 'estudando'), ...sorted.filter((t) => t.status === 'nao_visto')]
      : sorted.filter((t) => t.status !== 'nao_visto');
  return pool.length ? pool[n % pool.length] : undefined;
}

export function generateWeeklyPlan(input: PlanInput): PlanResult {
  const { weekStart, subjects, deadlines, locked = [] } = input;
  const warnings: string[] = [];
  const priorities = computePriorities(subjects, deadlines, weekStart);
  const slots = buildSlots(input);
  const base = allocateBlocks(priorities, slots.length);
  const { alloc: remaining, short } = applyCarryOver(base, priorities, input.carryOver ?? {});
  for (const [id, n] of Object.entries(short)) {
    const nm = subjects.find((x) => x.id === id)?.name ?? id;
    warnings.push(`Não coube repor ${n} bloco(s) de "${nm}": amplie a disponibilidade.`);
  }
  const counts: Record<string, number> = {};
  const typeCounts: Record<string, number> = {};
  const blocks: PlanBlock[] = [];
  let prev: string | null = null;

  for (const slot of slots) {
    const candidates = Object.keys(remaining).filter((id) => (remaining[id] ?? 0) > 0);
    if (candidates.length === 0) break;
    let pool = candidates.filter((id) => id !== prev);
    if (pool.length === 0) pool = candidates;
    pool.sort(
      (a, b) =>
        (remaining[b] ?? 0) - (remaining[a] ?? 0) || (priorities[b] ?? 0) - (priorities[a] ?? 0),
    );
    const id = pool[0]!;
    remaining[id] = (remaining[id] ?? 0) - 1;
    const n = counts[id] ?? 0;
    counts[id] = n + 1;
    const daysLeft = daysToNextDeadline(id, deadlines, slot.start);
    const type = blockType(daysLeft, n);
    const typeCount = (typeCounts[`${id}:${type}`] = (typeCounts[`${id}:${type}`] ?? 0) + 1) - 1;
    const topic = pickTopic((input.topics ?? []).filter((t) => t.subjectId === id), type, typeCount);
    blocks.push({
      start: slot.start,
      durationMin: input.profile.focusMin,
      type,
      subjectId: id,
      ...(topic ? { topicId: topic.id } : {}),
    });
    prev = id;
  }

  if (slots.length === 0) warnings.push('Sem disponibilidade na semana: informe janelas de estudo.');
  for (const s of subjects) {
    const days = daysToNextDeadline(s.id, deadlines, weekStart);
    if (days !== null && days <= 7 && !(counts[s.id] ?? 0)) {
      warnings.push(`Prazo de "${s.name}" em ${days} dia(s) sem cobertura no plano.`);
    }
  }
  const all = [...blocks, ...locked].sort((a, b) => a.start.getTime() - b.start.getTime());
  return { blocks: all, warnings, priorities };
}
