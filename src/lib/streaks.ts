export type Streak = {
  id: string;
  name: string;
  emoji: string;
  goal: number; // target days
  color: "pink" | "mint" | "lav" | "peach" | "sky";
  createdAt: string; // YYYY-MM-DD
  done: string[]; // YYYY-MM-DD
};

export const dayKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};

/** Only today can be marked done. Past and future days are locked. */
export function canMark(streak: Streak, key: string, today: Date): boolean {
  return key === dayKey(today) && !streak.done.includes(key);
}

/** Marking today is final: no undoing done days. */
export function markToday(streak: Streak, today: Date): Streak {
  const key = dayKey(today);
  if (!canMark(streak, key, today)) return streak;
  return { ...streak, done: [...streak.done, key] };
}

/** Current streak: consecutive done days ending today (or yesterday if today not done yet). */
export function currentStreak(streak: Streak, today: Date): number {
  const set = new Set(streak.done);
  let cursor = set.has(dayKey(today)) ? today : addDays(today, -1);
  let n = 0;
  while (set.has(dayKey(cursor))) {
    n++;
    cursor = addDays(cursor, -1);
  }
  return n;
}

export function bestStreak(streak: Streak): number {
  const sorted = [...streak.done].sort();
  let best = 0, run = 0, prev: string | null = null;
  for (const k of sorted) {
    const d = new Date(k + "T00:00:00");
    run = prev && dayKey(addDays(new Date(prev + "T00:00:00"), 1)) === k ? run + 1 : 1;
    best = Math.max(best, run);
    prev = dayKey(d);
  }
  return best;
}
