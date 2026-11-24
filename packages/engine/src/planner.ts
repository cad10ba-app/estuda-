import { computePriorities, daysToNextDeadline } from './priority';
import type { BlockType, PlanBlock, PlanInput, PlanResult } from './types';

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

function buildSlots(input: PlanInput): Slot[] {
  const { weekStart, profile, windows, locked = [] } = input;
  const step = profile.focusMin + profile.breakMin;
  const maxPerDay = Math.floor(profile.dailyLoadMin / profile.focusMin);
  const slots: Slot[] = [];
  for (let d = 0; d < 7; d++) {
    const day = new Date(weekStart.getTime() + d * DAY_MS);
    const weekday = day.getUTCDay();
    const daySlots: Slot[] = [];
    const lockedToday = locked.filter(
      (b) => Math.floor((b.start.getTime() - weekStart.getTime()) / DAY_MS) === d,
    ).length;
    for (const w of windows.filter((x) => x.weekday === weekday).sort((a, b) => a.startMin - b.startMin)) {
      for (let m = w.startMin; m + profile.focusMin <= w.endMin; m += step) {
        const start = day.getTime() + m * MIN_MS;
        if (locked.some((b) => overlaps(start, profile.focusMin, b))) continue;
        daySlots.push({ start: new Date(start) });
      }
    }
    slots.push(...daySlots.slice(0, Math.max(0, maxPerDay - lockedToday)));
  }
  return slots;
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

export function generateWeeklyPlan(input: PlanInput): PlanResult {
  const { weekStart, subjects, deadlines, locked = [] } = input;
  const warnings: string[] = [];
  const priorities = computePriorities(subjects, deadlines, weekStart);
  const slots = buildSlots(input);
  const remaining = allocateBlocks(priorities, slots.length);
  const counts: Record<string, number> = {};
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
    blocks.push({
      start: slot.start,
      durationMin: input.profile.focusMin,
      type: blockType(daysLeft, n),
      subjectId: id,
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
