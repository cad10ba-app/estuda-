import type { AvailabilityWindow, Deadline, PlanBlock, Profile, Subject, Topic } from '@estuda/engine';

/** Sessão de estudo realizada (REQ-010: tempo real vs planejado). */
export interface StudySession {
  id: string;
  subjectId: string;
  topicId?: string;
  /** Início do bloco planejado a que a sessão se refere (se houver). */
  blockStart?: Date;
  startedAt: Date;
  endedAt: Date;
  plannedMin: number;
  actualMin: number;
  cycles: number;
}

/** Cartão de estudo com estado de repetição espaçada (REQ-012/013). */
export interface Card {
  id: string;
  subjectId: string;
  front: string;
  back: string;
  intervalDays: number;
  ease: number;
  repetitions: number;
  /** Próxima revisão. */
  due: Date;
  lastReviewedAt?: Date;
  lapses: number;
}

/** Revisão agendada de um tópico (D+1, D+7, D+30) — REQ-014. */
export interface TopicReview {
  id: string;
  topicId: string;
  due: Date;
  done: boolean;
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
  saveCard(card: Card): Promise<void>;
  listCards(): Promise<Card[]>;
  deleteCard(id: string): Promise<void>;
  listTopics(): Promise<Topic[]>;
  saveTopic(topic: Topic): Promise<void>;
  deleteTopic(id: string): Promise<void>;
  listTopicReviews(): Promise<TopicReview[]>;
  saveTopicReview(review: TopicReview): Promise<void>;
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
