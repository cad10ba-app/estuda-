const DAY_MS = 86_400_000;

/** Datas de revisão de um tópico estudado (padrão D+1, D+7, D+30). */
export function topicReviewDates(studiedAt: Date, offsets: number[] = [1, 7, 30]): Date[] {
  return offsets.map((d) => new Date(studiedAt.getTime() + d * DAY_MS));
}

/** Aplica teto diário: excedente rola para o dia seguinte, mais atrasados primeiro. */
export function capDailyReviews(due: Date[], cap: number): Date[] {
  const sorted = [...due].sort((a, b) => a.getTime() - b.getTime());
  const perDay = new Map<number, number>();
  return sorted.map((d) => {
    let day = Math.floor(d.getTime() / DAY_MS);
    while ((perDay.get(day) ?? 0) >= cap) day++;
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
    return new Date(Math.max(d.getTime(), day * DAY_MS));
  });
}
