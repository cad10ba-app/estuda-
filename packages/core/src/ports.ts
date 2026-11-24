import type { AvailabilityWindow, Deadline, PlanBlock, Profile, Subject } from '@estuda/engine';

/** Relógio injetável (testes e fuso). */
export interface Clock {
  now(): Date;
}

/**
 * Porta de persistência. Web: Dexie/IndexedDB. Nativo: SQLite.
 * Nada aqui pode depender de APIs de navegador.
 */
export interface StudyStore {
  getProfile(): Promise<Profile | undefined>;
  saveProfile(profile: Profile): Promise<void>;
  listSubjects(): Promise<Subject[]>;
  saveSubject(subject: Subject): Promise<void>;
  deleteSubject(id: string): Promise<void>;
  listDeadlines(): Promise<Deadline[]>;
  saveDeadline(deadline: Deadline): Promise<void>;
  listWindows(): Promise<AvailabilityWindow[]>;
  saveWindows(windows: AvailabilityWindow[]): Promise<void>;
  listPlan(): Promise<PlanBlock[]>;
  savePlan(blocks: PlanBlock[]): Promise<void>;
}

/** Lembretes: Web Push/.ics na web; notificações locais no nativo. */
export interface Notifier {
  schedule(blocks: PlanBlock[]): Promise<void>;
}

export interface Deps {
  store: StudyStore;
  clock: Clock;
  notifier?: Notifier;
}
