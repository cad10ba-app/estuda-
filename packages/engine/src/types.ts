/** Modo de uso. fund2 = Fundamental (anos finais); pos = Pesquisa (TCC a doutorado); livre = Objetivo livre. */
export type Level = 'fund2' | 'medio' | 'superior' | 'pos' | 'livre';

export type Autonomy = 'guiada' | 'media' | 'alta';

export interface Accessibility {
  /** Escala de fonte: 1, 1.15 ou 1.3. */
  fontScale: number;
  highContrast: boolean;
  reduceMotion: boolean;
}

export interface Profile {
  level: Level;
  focusMin: number;
  breakMin: number;
  /** Carga máxima de estudo por dia, em minutos. */
  dailyLoadMin: number;
  /** Teto diário de revisões. */
  reviewCap: number;
  /** Nível de autonomia do estudante (doc 12 §3). */
  autonomy?: Autonomy;
  accessibility?: Accessibility;
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
  /** Objetivo ao qual a disciplina pertence (doc 12 §5.2). */
  goalId?: string;
}

export type TopicStatus = 'nao_visto' | 'estudando' | 'dominado';

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  order: number;
  status: TopicStatus;
  /** 'unidade' agrupa tópicos (não entra no plano); padrão 'topico'. */
  kind?: 'unidade' | 'topico';
  /** Unidade à qual o tópico pertence. */
  parentId?: string;
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

export type BlockType = 'estudo' | 'revisao' | 'simulado' | 'escrita';

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
  /** Blocos semanais reservados a projetos longos (id da disciplina sintética `project:<id>`). */
  projectSlots?: { id: string; blocks: number }[];
}

export interface PlanResult {
  blocks: PlanBlock[];
  warnings: string[];
  priorities: Record<string, number>;
}
