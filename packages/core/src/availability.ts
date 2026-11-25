import type { AvailabilityWindow } from '@estuda/engine';
import type { Deps } from './ports';
import { PERIODS, buildWindows, type Period } from './onboarding';
import { planWeek } from './usecases';

/** Converte janelas salvas de volta em dias + períodos (para o editor). */
export function windowsToSelection(windows: AvailabilityWindow[]): { weekdays: number[]; periods: Period[] } {
  const weekdays = [...new Set(windows.map((w) => w.weekday))].sort();
  const periods = (Object.keys(PERIODS) as Period[]).filter((p) =>
    windows.some((w) => w.startMin === PERIODS[p].startMin && w.endMin === PERIODS[p].endMin),
  );
  return { weekdays, periods };
}

/** REQ-005: altera a disponibilidade semanal e replaneja. */
export async function updateAvailability(deps: Deps, weekdays: number[], periods: Period[]) {
  if (weekdays.length === 0 || periods.length === 0) throw new Error('Informe ao menos um dia e um período.');
  await deps.store.saveWindows(buildWindows(weekdays, periods));
  return planWeek(deps);
}
