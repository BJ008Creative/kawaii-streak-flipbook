import { describe, it, expect } from "vitest";
import { canMark, markToday, currentStreak, type Streak } from "@/lib/streaks";

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
