import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { addStreak, importStreaks, listStreaks, markStreakDay, removeStreak } from "@/lib/streaks.functions";
import { bestStreak, currentStreak, dayKey, type Streak } from "@/lib/streaks";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "My calendar ✿ Streaky" },
      {
        name: "description",
        content: "Flip through your habit pages, cross off today, and keep every streak alive.",
      },
      { property: "og:title", content: "My calendar ✿ Streaky" },
      { property: "og:description", content: "Your kawaii habit streak calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Calendar,
});

const KEY = "streaky-v1";
const COLORS: Streak["color"][] = ["pink", "mint", "lav", "peach", "sky"];
const BG: Record<Streak["color"], string> = {
  pink: "bg-pink",
  mint: "bg-mint",
  lav: "bg-lav",
  peach: "bg-peach",
  sky: "bg-sky",
};
const EMOJIS = ["🌸", "🏃‍♀️", "💻", "📚", "🧘", "💧", "🎨", "🍓", "🐱", "⭐"];
const WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function Calendar() {
  const { session, signOut } = useAuth();
  const queryClient = useQueryClient();
  const fetchStreaks = useServerFn(listStreaks);
  const doAdd = useServerFn(addStreak);
  const doMark = useServerFn(markStreakDay);
  const doRemove = useServerFn(removeStreak);
  const doImport = useServerFn(importStreaks);

  const { data: streaks = [], isLoading } = useQuery({
    queryKey: ["streaks"],
    queryFn: () => fetchStreaks({ data: {} }),
  });

  const [page, setPage] = useState(0);
  const [month, setMonth] = useState(() => new Date());
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");
  const today = new Date();
  const carriedOver = useRef(false);

  const say = (t: string) => {
    setMsg(t);
    setTimeout(() => setMsg(""), 2400);
  };

  // streaks saved in this browser before sign-in get carried up to the account, once
  useEffect(() => {
    if (carriedOver.current || isLoading || streaks.length) return;
    carriedOver.current = true;
    let raw: string | null = null;
    try {
      raw = localStorage.getItem(KEY);
    } catch {
      return;
    }
    if (!raw) return;
    let local: Streak[];
    try {
      local = JSON.parse(raw);
    } catch {
      return;
    }
    if (!Array.isArray(local) || !local.length) return;
    doImport({
      data: {
        streaks: local.map((s) => ({
          name: s.name,
          emoji: s.emoji,
          color: s.color,
          goal: s.goal,
          createdAt: s.createdAt,
          done: s.done,
        })),
      },
    })
      .then(() => {
        try {
          localStorage.removeItem(KEY);
        } catch {
          /* nothing saved locally */
        }
        queryClient.invalidateQueries({ queryKey: ["streaks"] });
      })
      .catch(() => {
        carriedOver.current = false;
      });
  }, [isLoading, streaks.length, doImport, queryClient]);

  const safePage = Math.min(page, Math.max(0, streaks.length - 1));
  const s = streaks[safePage];

  const mark = useMutation({
    mutationFn: (key: string) =>
      doMark({ data: { id: s?.id ?? "", key, offsetMinutes: -new Date().getTimezoneOffset() } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
      say("Yay! Streak +1 (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧");
    },
    onError: (e: Error) => say(e.message),
  });

  const add = useMutation({
    mutationFn: (v: { name: string; emoji: string; color: Streak["color"]; goal: number }) =>
      doAdd({ data: { ...v, createdOn: dayKey(new Date()) } }),
    onSuccess: () => {
      setPage(streaks.length);
      setMonth(new Date());
      setAdding(false);
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
    },
    onError: (e: Error) => say(e.message),
  });

  const tear = useMutation({
    mutationFn: (id: string) => doRemove({ data: { id } }),
    onSuccess: () => {
      setPage((p) => Math.max(0, p - 1));
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
    },
  });

  const cells = useMemo(() => {
    const y = month.getFullYear(),
      m = month.getMonth();
    const first = new Date(y, m, 1).getDay();
    const n = new Date(y, m + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: n }, (_, i) => new Date(y, m, i + 1))];
  }, [month]);

  const clickDay = (key: string) => {
    if (!s) return;
    if (s.done.includes(key)) return say("Already done! No take-backs ✿");
    if (key !== dayKey(today))
      return say(
        key > dayKey(today) ? "No time travel~ come back that day! ⏳" : "That day is past, only today counts (｡•́︿•̀｡)",
      );
    mark.mutate(key);
  };

  const flip = (d: number) => {
    setPage((p) => Math.min(Math.max(p + d, 0), streaks.length - 1));
    setMonth(new Date());
  };

  return (
    <main className="min-h-screen px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-5 flex items-center justify-between text-sm">
          <a href="/" className="font-display text-primary">
            Streaky ✿
          </a>
          <div className="flex items-center gap-3">
            <span className="hidden text-muted-foreground sm:inline">{session?.user.email}</span>
            <button onClick={() => void signOut()} className="rounded-full border-2 border-primary px-3 py-1 text-primary hover:bg-muted">
              sign out
            </button>
          </div>
        </div>

        <header className="mb-6 text-center">
          <h1 className="font-display text-3xl text-primary sm:text-4xl">
            Streaky <span className="wiggle inline-block">✿</span>
          </h1>
          <p className="mt-1 text-muted-foreground">one little box a day ~ keep the chain cute (◕‿◕)</p>
        </header>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          {streaks.map((x, i) => (
            <button
              key={x.id}
              onClick={() => {
                setPage(i);
                setMonth(new Date());
              }}
              className={`rounded-full border-2 px-3 py-1 text-sm transition ${
                i === safePage ? `${BG[x.color]} border-foreground/30 font-semibold` : "bg-card hover:-translate-y-0.5"
              }`}
            >
              {x.emoji} {x.name}
            </button>
          ))}
          <button
            onClick={() => setAdding(true)}
            className="rounded-full border-2 border-dashed border-primary bg-card px-3 py-1 text-sm text-primary hover:bg-muted"
          >
            + new streak
          </button>
        </div>

        <div className="relative">
          <div className="absolute -top-3 left-0 right-0 z-10 flex justify-around">
            {Array.from({ length: 8 }).map((_, i) => (
              <span key={i} className="h-7 w-3 rounded-full border-2 border-ring-bind bg-background" />
            ))}
          </div>

          {isLoading ? (
            <div className="rounded-3xl border-2 bg-paper p-12 text-center shadow-cute">
              <div className="text-6xl">🐰</div>
              <p className="font-display mt-4 text-xl">opening your calendar~</p>
            </div>
          ) : s ? (
            <div key={s.id} className="page-flip overflow-hidden rounded-3xl border-2 bg-paper shadow-cute">
              <div className={`${BG[s.color]} px-6 pb-5 pt-8 text-center`}>
                <div className="text-5xl">{s.emoji}</div>
                <h2 className="font-display mt-2 text-2xl">{s.name}</h2>
                <div className="mt-3 flex justify-center gap-3 text-sm">
                  <Stat label="streak" value={`🔥 ${currentStreak(s, today)}`} />
                  <Stat label="best" value={`🏆 ${bestStreak(s)}`} />
                  <Stat label="goal" value={`${s.done.length}/${s.goal}`} />
                </div>
                <div className="mx-auto mt-3 h-3 max-w-xs overflow-hidden rounded-full bg-card">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${Math.min(100, (s.done.length / s.goal) * 100)}%` }}
                  />
                </div>
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <button
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
                    className="rounded-full px-3 py-1 hover:bg-muted"
                  >
                    ‹
                  </button>
                  <span className="font-display">{month.toLocaleString("en", { month: "long", year: "numeric" })}</span>
                  <button
                    onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
                    className="rounded-full px-3 py-1 hover:bg-muted"
                  >
                    ›
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {WEEK.map((w) => (
                    <div key={w} className="text-xs font-semibold text-muted-foreground">
                      {w}
                    </div>
                  ))}
                  {cells.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const k = dayKey(d);
                    const done = s.done.includes(k);
                    const isToday = k === dayKey(today);
                    const future = k > dayKey(today);
                    return (
                      <button
                        key={i}
                        onClick={() => clickDay(k)}
                        aria-label={`${k}${done ? " done" : ""}`}
                        className={`relative aspect-square rounded-xl border-2 text-sm transition
                          ${done ? `${BG[s.color]} border-foreground/20` : "bg-card"}
                          ${isToday && !done ? "border-primary ring-2 ring-primary/40 hover:scale-105 cursor-pointer" : ""}
                          ${future ? "opacity-40" : ""} ${!isToday ? "cursor-not-allowed" : ""}`}
                      >
                        <span className={done ? "line-through decoration-2 decoration-foreground/60" : ""}>
                          {d.getDate()}
                        </span>
                        {done && (
                          <span className="pop absolute inset-0 flex items-center justify-center text-xl">✕</span>
                        )}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 h-5 text-center text-sm text-primary">
                  {msg ||
                    (s.done.includes(dayKey(today))
                      ? "today's box is crossed off ♡ see you tomorrow"
                      : "tap today's box when you finish!")}
                </p>
              </div>

              <div className="flex items-center justify-between border-t-2 border-dashed px-5 py-3 text-sm">
                <button
                  disabled={safePage === 0}
                  onClick={() => flip(-1)}
                  className="rounded-full px-3 py-1 hover:bg-muted disabled:opacity-30"
                >
                  ← prev page
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Tear off "${s.name}" page forever?`)) tear.mutate(s.id);
                  }}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  tear off
                </button>
                <button
                  disabled={safePage >= streaks.length - 1}
                  onClick={() => flip(1)}
                  className="rounded-full px-3 py-1 hover:bg-muted disabled:opacity-30"
                >
                  next page →
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border-2 bg-paper p-12 text-center shadow-cute">
              <div className="text-6xl">🐰</div>
              <p className="font-display mt-4 text-xl">your calendar is empty~</p>
              <button
                onClick={() => setAdding(true)}
                className="mt-5 rounded-full bg-primary px-5 py-2 text-primary-foreground shadow-cute hover:-translate-y-0.5"
              >
                + add your first streak
              </button>
            </div>
          )}
        </div>
      </div>

      {adding && (
        <AddDialog
          busy={add.isPending}
          onClose={() => setAdding(false)}
          onAdd={(v) => add.mutate(v)}
        />
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-card/70 px-3 py-1">
      <div className="font-semibold">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function AddDialog({
  busy,
  onClose,
  onAdd,
}: {
  busy: boolean;
  onClose: () => void;
  onAdd: (v: { name: string; emoji: string; color: Streak["color"]; goal: number }) => void;
}) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(30);
  const [emoji, setEmoji] = useState<string>("🌸");
  const [color, setColor] = useState<Streak["color"]>("pink");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" onClick={onClose}>
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          onAdd({ name: name.trim(), goal: Math.max(1, goal), emoji, color });
        }}
        className="pop w-full max-w-sm space-y-4 rounded-3xl border-2 bg-paper p-6 shadow-cute"
      >
        <h3 className="font-display text-xl text-primary">new streak page ✿</h3>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Exercise, DSA..."
          className="w-full rounded-xl border-2 bg-card px-3 py-2 outline-none focus:border-primary"
        />
        <label className="block text-sm">
          goal (days)
          <input
            type="number"
            min={1}
            value={goal}
            onChange={(e) => setGoal(+e.target.value)}
            className="mt-1 w-full rounded-xl border-2 bg-card px-3 py-2 outline-none focus:border-primary"
          />
        </label>
        <div className="flex flex-wrap gap-1">
          {EMOJIS.map((e) => (
            <button
              type="button"
              key={e}
              onClick={() => setEmoji(e)}
              className={`rounded-xl p-1.5 text-xl ${emoji === e ? "bg-accent" : ""}`}
            >
              {e}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {COLORS.map((c) => (
            <button
              type="button"
              key={c}
              aria-label={c}
              onClick={() => setColor(c)}
              className={`h-8 w-8 rounded-full border-2 ${BG[c]} ${color === c ? "border-foreground scale-110" : "border-card"}`}
            />
          ))}
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 hover:bg-muted">
            cancel
          </button>
          <button disabled={busy} className="rounded-full bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">
            add page
          </button>
        </div>
      </form>
    </div>
  );
}
