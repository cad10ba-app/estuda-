import type { AvailabilityWindow, Deadline, PlanBlock, Profile, Subject } from '@estuda/engine';

/** Sessão de estudo realizada (REQ-010: tempo real vs planejado). */
export interface StudySession {
  id: string;
  subjectId: string;
  /** Início do bloco planejado a que a sessão se refere (se houver). */
  blockStart?: Date;
  startedAt: Date;
  endedAt: Date;
  plannedMin: number;
  actualMin: number;
  cycles: number;
}

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
  deleteDeadline(id: string): Promise<void>;
  listWindows(): Promise<AvailabilityWindow[]>;
  saveWindows(windows: AvailabilityWindow[]): Promise<void>;
  saveSession(session: StudySession): Promise<void>;
  listSessions(): Promise<StudySession[]>;
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
