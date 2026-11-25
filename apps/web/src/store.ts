import { type Deps } from '@estuda/core';
import { DexieStore } from '@estuda/data';

/** Composição web: injeta Dexie e o relógio do sistema nos casos de uso. */
export const deps: Deps = { store: new DexieStore(), clock: { now: () => new Date(), offsetMin: (at: Date) => -at.getTimezoneOffset() } };
