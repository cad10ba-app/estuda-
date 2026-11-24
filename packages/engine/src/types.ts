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

export type TopicStatus = 'nao_visto' | 'estudando' | 'dominado';

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  order: number;
  status: TopicStatus;
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
  topicId?: string;
  locked?: boolean;
  /** Bloco não realizado; fica no histórico e gera reposição no próximo replanejamento. */
  missed?: boolean;
}

export interface PlanInput {
  /** Segunda/domingo 00:00 UTC do início do horizonte (7 dias). */
  weekStart: Date;
  profile: Profile;
  subjects: Subject[];
  deadlines: Deadline[];
  windows: AvailabilityWindow[];
  /** Tópicos das disciplinas: usados para escolher o conteúdo de cada bloco. */
  topics?: Topic[];
  /** Blocos fixos (travados, passados, já realizados); nunca são movidos e ocupam a carga do dia. */
  locked?: PlanBlock[];
  /** Só gera blocos a partir deste instante (replanejamento no meio do dia). */
  from?: Date;
  /** Blocos perdidos a repor por disciplina (id → quantidade). */
  carryOver?: Record<string, number>;
}

export interface PlanResult {
  blocks: PlanBlock[];
  warnings: string[];
  priorities: Record<string, number>;
}
