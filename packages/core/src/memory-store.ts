import type { AvailabilityWindow, Deadline, PlanBlock, Profile, Subject, Topic } from '@estuda/engine';
import type { Card, StudySession, StudyStore, TopicReview } from './ports';

/** Implementação em memória: testes e demos. */
export class MemoryStore implements StudyStore {
  private profile?: Profile;
  private subjects = new Map<string, Subject>();
  private deadlines = new Map<string, Deadline>();
  private windows: AvailabilityWindow[] = [];
  private plan: PlanBlock[] = [];
  private sessions: StudySession[] = [];
  private cards = new Map<string, Card>();
  private topics = new Map<string, Topic>();
  private reviews = new Map<string, TopicReview>();

  async getProfile() { return this.profile; }
  async saveProfile(p: Profile) { this.profile = p; }
  async listSubjects() { return [...this.subjects.values()]; }
  async saveSubject(s: Subject) { this.subjects.set(s.id, s); }
  async deleteSubject(id: string) { this.subjects.delete(id); }
  async listDeadlines() { return [...this.deadlines.values()]; }
  async saveDeadline(d: Deadline) { this.deadlines.set(d.id, d); }
  async deleteDeadline(id: string) { this.deadlines.delete(id); }
  async listWindows() { return [...this.windows]; }
  async saveWindows(w: AvailabilityWindow[]) { this.windows = [...w]; }
  async saveSession(s: StudySession) { this.sessions.push(s); }
  async listSessions() { return [...this.sessions]; }
  async saveCard(c: Card) { this.cards.set(c.id, c); }
  async listCards() { return [...this.cards.values()]; }
  async deleteCard(id: string) { this.cards.delete(id); }
  async listTopics() { return [...this.topics.values()]; }
  async saveTopic(t: Topic) { this.topics.set(t.id, t); }
  async deleteTopic(id: string) { this.topics.delete(id); for (const [k, r] of this.reviews) if (r.topicId === id) this.reviews.delete(k); }
  async listTopicReviews() { return [...this.reviews.values()]; }
  async saveTopicReview(r: TopicReview) { this.reviews.set(r.id, r); }
  async listPlan() { return [...this.plan]; }
  async savePlan(b: PlanBlock[]) { this.plan = [...b]; }
}
