import { DEFAULT_PROFILES } from '@estuda/engine';
import { type Deps } from '@estuda/core';
import { DexieStore } from '@estuda/data';

/** Composição web: injeta Dexie e o relógio do sistema nos casos de uso. */
export const deps: Deps = { store: new DexieStore(), clock: { now: () => new Date() } };

/** Dados iniciais de demonstração até existir o onboarding (REQ-001). */
export async function seedIfEmpty(): Promise<void> {
  if (await deps.store.getProfile()) return;
  await deps.store.saveProfile(DEFAULT_PROFILES.medio);
  await deps.store.saveSubject({ id: 'mat', name: 'Matemática', weight: 5, difficulty: 4 });
  await deps.store.saveSubject({ id: 'qui', name: 'Química', weight: 4, difficulty: 5 });
  await deps.store.saveSubject({ id: 'his', name: 'História', weight: 3, difficulty: 2 });
  await deps.store.saveWindows(
    [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({ weekday, startMin: 19 * 60, endMin: 22 * 60 })),
  );
}
