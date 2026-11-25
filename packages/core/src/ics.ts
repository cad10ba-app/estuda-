import type { PlanBlock, Subject } from '@estuda/engine';

const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

/** Exporta o plano como iCalendar (.ics), útil como lembrete sem Web Push. */
export function planToICS(blocks: PlanBlock[], subjects: Subject[]): string {
  const name = new Map(subjects.map((s) => [s.id, s.name]));
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Estuda//PT-BR//', 'CALSCALE:GREGORIAN'];
  blocks.forEach((b, i) => {
    const end = new Date(b.start.getTime() + b.durationMin * 60_000);
    lines.push(
      'BEGIN:VEVENT',
      `UID:estuda-${b.start.getTime()}-${i}@estuda`,
      `DTSTAMP:${fmt(new Date(0))}`,
      `DTSTART:${fmt(b.start)}`,
      `DTEND:${fmt(end)}`,
      `SUMMARY:${b.type[0]!.toUpperCase()}${b.type.slice(1)}: ${name.get(b.subjectId) ?? b.subjectId}`,
      'END:VEVENT',
    );
  });
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}
