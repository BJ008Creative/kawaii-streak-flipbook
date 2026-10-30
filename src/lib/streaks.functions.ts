import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertMarkable, type Streak } from "@/lib/streaks";

const COLORS: Streak["color"][] = ["pink", "mint", "lav", "peach", "sky"];
const DAY = /^\d{4}-\d{2}-\d{2}$/;

type Row = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  color: string;
  goal: number;
  created_on: string;
  done: string[] | null;
};

const toStreak = (r: Row): Streak => ({
  id: r.id,
  name: r.name,
  emoji: r.emoji,
  goal: r.goal,
  color: COLORS.includes(r.color as Streak["color"]) ? (r.color as Streak["color"]) : "pink",
  createdAt: r.created_on,
  done: r.done ?? [],
});

const cleanColor = (c: string) => (COLORS.includes(c as Streak["color"]) ? c : "pink");
const cleanGoal = (g: number) => Math.max(1, Math.min(3650, Math.floor(Number(g) || 1)));
const cleanName = (n: string) => n.trim().slice(0, 60);

export const listStreaks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Record<string, never>) => input)
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("streaks")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []).map(toStreak);
  });

export const addStreak = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { name: string; emoji: string; color: string; goal: number; createdOn: string }) => input)
  .handler(async ({ data, context }) => {
    const name = cleanName(data.name);
    if (!name) throw new Error("Your streak needs a name");
    const row = {
      user_id: context.userId,
      name,
      emoji: data.emoji.slice(0, 8) || "🌸",
      color: cleanColor(data.color),
      goal: cleanGoal(data.goal),
      created_on: DAY.test(data.createdOn) ? data.createdOn : new Date().toISOString().slice(0, 10),
      done: [],
    };
    const { data: inserted, error } = await context.supabase
      .from("streaks")
      .insert(row)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return toStreak(inserted);
  });

/** Only the viewer's own current day can be crossed off, and never twice. */
export const markStreakDay = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string; key: string; offsetMinutes: number }) => input)
  .handler(async ({ data, context }) => {
    const offset = Math.max(-840, Math.min(840, Math.round(Number(data.offsetMinutes) || 0)));
    assertMarkable(data.key, offset);
    const { data: row, error } = await context.supabase
      .from("streaks")
      .select("*")
      .eq("id", data.id)
      .single();
    if (error || !row) throw new Error("That streak page is gone");
    if ((row.done ?? []).includes(data.key)) return toStreak(row);
    const done = [...(row.done ?? []), data.key];
    const { error: updateError } = await context.supabase
      .from("streaks")
      .update({ done })
      .eq("id", data.id);
    if (updateError) throw new Error(updateError.message);
    return toStreak({ ...row, done });
  });

export const removeStreak = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("streaks").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Carry streaks saved in this browser up to the account, once. */
export const importStreaks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      streaks: { name: string; emoji: string; color: string; goal: number; createdAt: string; done: string[] }[];
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const rows = (data.streaks ?? [])
      .slice(0, 50)
      .map((s) => ({
        user_id: context.userId,
        name: cleanName(s.name) || "streak",
        emoji: (s.emoji ?? "").slice(0, 8) || "🌸",
        color: cleanColor(s.color ?? "pink"),
        goal: cleanGoal(s.goal),
        created_on: DAY.test(s.createdAt) ? s.createdAt : new Date().toISOString().slice(0, 10),
        done: (s.done ?? []).filter((k) => DAY.test(k)).slice(0, 400),
      }));
    if (!rows.length) return [];
    const { data: inserted, error } = await context.supabase.from("streaks").insert(rows).select("*");
    if (error) throw new Error(error.message);
    return (inserted ?? []).map(toStreak);
  });
