export type Level = 'fund2' | 'medio' | 'superior' | 'pos';

export interface Profile {
  level: Level;
  focusMin: number;
  breakMin: number;
  /** Carga máxima de estudo por dia, em minutos. */
  dailyLoadMin: number;
  /** Teto diário de revisões. */
  reviewCap: number;
}

export interface Subject {
  id: string;
  name: string;
  /** 1–5 */
  weight: number;
  /** 1–5 */
  difficulty: number;
  /** Fração (0–1) de tópicos ainda não vistos. */
  unseenRatio?: number;
}

export type DeadlineKind = 'prova' | 'entrega' | 'simulado' | 'marco';

export interface Deadline {
  id: string;
  subjectId: string;
  date: Date;
  kind: DeadlineKind;
}

/** Janela de disponibilidade: minutos desde 00:00 UTC do dia. weekday 0=domingo. */
export interface AvailabilityWindow {
  weekday: number;
  startMin: number;
  endMin: number;
}

export type BlockType = 'estudo' | 'revisao' | 'simulado';

export interface PlanBlock {
  start: Date;
  durationMin: number;
  type: BlockType;
  subjectId: string;
  locked?: boolean;
}

export interface PlanInput {
  /** Segunda/domingo 00:00 UTC do início do horizonte (7 dias). */
  weekStart: Date;
  profile: Profile;
  subjects: Subject[];
  deadlines: Deadline[];
  windows: AvailabilityWindow[];
  /** Blocos travados manualmente; nunca são movidos. */
  locked?: PlanBlock[];
}

export interface PlanResult {
  blocks: PlanBlock[];
  warnings: string[];
  priorities: Record<string, number>;
}
