import { describe, it, expect } from "vitest";
import {
  assertMarkable,
  canMark,
  currentStreak,
  localDayKey,
  markToday,
  type Streak,
} from "@/lib/streaks";

const base: Streak = { id: "1", name: "x", emoji: "🌸", goal: 30, color: "pink", createdAt: "2026-10-01", done: [] };
const today = new Date(2026, 9, 30);

describe("streak rules", () => {
  it("only today can be marked", () => {
    expect(canMark(base, "2026-10-30", today)).toBe(true);
    expect(canMark(base, "2026-10-29", today)).toBe(false);
    expect(canMark(base, "2026-10-31", today)).toBe(false);
  });
  it("done days cannot be undone or re-marked", () => {
    const s = markToday(base, today);
    expect(s.done).toEqual(["2026-10-30"]);
    expect(markToday(s, today).done).toEqual(["2026-10-30"]);
  });
  it("missing a day breaks the streak", () => {
    expect(currentStreak({ ...base, done: ["2026-10-28", "2026-10-29"] }, today)).toBe(2);
    expect(currentStreak({ ...base, done: ["2026-10-27", "2026-10-28"] }, today)).toBe(0);
  });
});

describe("server-side day rule", () => {
  const now = new Date("2026-10-30T17:25:00Z");

  it("uses the viewer's own timezone for today", () => {
    expect(localDayKey(330, now)).toBe("2026-10-30"); // Calcutta, UTC+5:30
    expect(localDayKey(-300, now)).toBe("2026-10-30"); // New York, still Oct 30
    expect(localDayKey(600, now)).toBe("2026-10-31"); // Sydney, already Oct 31
  });

  it("rejects a day that is not today for that viewer", () => {
    expect(() => assertMarkable("2026-10-30", 330, now)).not.toThrow();
    expect(() => assertMarkable("2026-10-29", 330, now)).toThrow(/past/);
    expect(() => assertMarkable("2026-10-31", 330, now)).toThrow(/time travel/);
  });

  it("rejects tomorrow in the viewer's timezone", () => {
    expect(() => assertMarkable("2026-10-31", 330, now)).toThrow(/time travel/);
  });
});
