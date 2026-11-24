import type { AvailabilityWindow, Deadline, PlanBlock, Profile, Subject } from '@estuda/engine';
import type { Card, StudySession, StudyStore } from './ports';

/** Implementação em memória: testes e demos. */
export class MemoryStore implements StudyStore {
  private profile?: Profile;
  private subjects = new Map<string, Subject>();
  private deadlines = new Map<string, Deadline>();
  private windows: AvailabilityWindow[] = [];
  private plan: PlanBlock[] = [];
  private sessions: StudySession[] = [];
  private cards = new Map<string, Card>();

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
  async listPlan() { return [...this.plan]; }
  async savePlan(b: PlanBlock[]) { this.plan = [...b]; }
}
