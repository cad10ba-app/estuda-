import Dexie, { type EntityTable } from 'dexie';
import type { AvailabilityWindow, Deadline, PlanBlock, Profile, Subject, Topic, Milestone, Project } from '@estuda/engine';
import type { Card, Reference, StudySession, StudyStore, TopicReview, WritingLog } from '@estuda/core';

interface Row<T> { id: string; value: T }

/** Adaptador web da porta StudyStore (IndexedDB). No nativo, trocar por SQLite. */
export class DexieStore extends Dexie implements StudyStore {
  private kv!: EntityTable<Row<unknown>, 'id'>;
  private subjects!: EntityTable<Subject, 'id'>;
  private deadlines!: EntityTable<Deadline, 'id'>;
  private sessions!: EntityTable<StudySession, 'id'>;
  private cards!: EntityTable<Card, 'id'>;
  private topics!: EntityTable<Topic, 'id'>;
  private topicReviews!: EntityTable<TopicReview, 'id'>;
  private projects!: EntityTable<Project, 'id'>;
  private milestones!: EntityTable<Milestone, 'id'>;
  private writingLogs!: EntityTable<WritingLog, 'id'>;
  private refs!: EntityTable<Reference, 'id'>;
  private plan!: EntityTable<PlanBlock & { id: number }, 'id'>;

  constructor(name = 'estuda') {
    super(name);
    this.version(1).stores({
      kv: 'id',
      subjects: 'id',
      deadlines: 'id, subjectId',
      plan: '++id, start',
    });
    this.version(2).stores({
      kv: 'id',
      subjects: 'id',
      deadlines: 'id, subjectId',
      plan: '++id, start',
      sessions: 'id, startedAt',
    });
    this.version(3).stores({
      kv: 'id',
      subjects: 'id',
      deadlines: 'id, subjectId',
      plan: '++id, start',
      sessions: 'id, startedAt',
      cards: 'id, subjectId, due',
    });
    this.version(4).stores({
      kv: 'id',
      subjects: 'id',
      deadlines: 'id, subjectId',
      plan: '++id, start',
      sessions: 'id, startedAt',
      cards: 'id, subjectId, due',
      topics: 'id, subjectId',
      topicReviews: 'id, topicId, due',
    });
    this.version(5).stores({
      kv: 'id',
      subjects: 'id',
      deadlines: 'id, subjectId',
      plan: '++id, start',
      sessions: 'id, startedAt',
      cards: 'id, subjectId, due',
      topics: 'id, subjectId',
      topicReviews: 'id, topicId, due',
      projects: 'id',
      milestones: 'id, projectId',
      writingLogs: 'id, projectId',
      refs: 'id, projectId',
    });
  }

  private async getKv<T>(id: string): Promise<T | undefined> {
    return (await this.kv.get(id))?.value as T | undefined;
  }
  private async setKv<T>(id: string, value: T): Promise<void> {
    await this.kv.put({ id, value });
  }

  getProfile() { return this.getKv<Profile>('profile'); }
  saveProfile(p: Profile) { return this.setKv('profile', p); }
  listSubjects() { return this.subjects.toArray(); }
  async saveSubject(s: Subject) { await this.subjects.put(s); }
  deleteSubject(id: string) { return this.subjects.delete(id); }
  listDeadlines() { return this.deadlines.toArray(); }
  async saveDeadline(d: Deadline) { await this.deadlines.put(d); }
  deleteDeadline(id: string) { return this.deadlines.delete(id); }
  async listWindows() { return (await this.getKv<AvailabilityWindow[]>('windows')) ?? []; }
  saveWindows(w: AvailabilityWindow[]) { return this.setKv('windows', w); }
  async saveSession(s: StudySession) { await this.sessions.put(s); }
  listSessions() { return this.sessions.orderBy('startedAt').toArray(); }
  async saveCard(c: Card) { await this.cards.put(c); }
  listCards() { return this.cards.toArray(); }
  deleteCard(id: string) { return this.cards.delete(id); }
  listTopics() { return this.topics.toArray(); }
  async saveTopic(t: Topic) { await this.topics.put(t); }
  async deleteTopic(id: string) {
    await this.topics.delete(id);
    await this.topicReviews.where('topicId').equals(id).delete();
  }
  listTopicReviews() { return this.topicReviews.toArray(); }
  async saveTopicReview(r: TopicReview) { await this.topicReviews.put(r); }
  listProjects() { return this.projects.toArray(); }
  async saveProject(p: Project) { await this.projects.put(p); }
  async deleteProject(id: string) {
    await this.transaction('rw', [this.projects, this.milestones, this.writingLogs, this.refs], async () => {
      await this.projects.delete(id);
      await this.milestones.where('projectId').equals(id).delete();
      await this.writingLogs.where('projectId').equals(id).delete();
      await this.refs.where('projectId').equals(id).delete();
    });
  }
  listMilestones() { return this.milestones.toArray(); }
  async saveMilestone(m: Milestone) { await this.milestones.put(m); }
  listWritingLogs() { return this.writingLogs.toArray(); }
  async saveWritingLog(l: WritingLog) { await this.writingLogs.put(l); }
  listReferences() { return this.refs.toArray(); }
  async saveReference(r: Reference) { await this.refs.put(r); }
  deleteReference(id: string) { return this.refs.delete(id); }
  async listPlan() {
    return (await this.plan.orderBy('start').toArray()).map(({ id: _id, ...b }) => b as PlanBlock);
  }
  async savePlan(blocks: PlanBlock[]) {
    await this.transaction('rw', this.plan, async () => {
      await this.plan.clear();
      await this.plan.bulkAdd(blocks as (PlanBlock & { id: number })[]);
    });
  }
}
