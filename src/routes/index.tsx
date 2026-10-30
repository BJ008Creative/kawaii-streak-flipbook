import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { bestStreak, canMark, currentStreak, dayKey, markToday, type Streak } from "@/lib/streaks";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Streaky ✿ Kawaii Habit Calendar" },
      { name: "description", content: "A cute flip-calendar streak tracker for your habits: exercise, DSA and more." },
      { property: "og:title", content: "Streaky ✿ Kawaii Habit Calendar" },
      { property: "og:description", content: "Flip through cute calendar pages and keep your habit streaks alive." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const KEY = "streaky-v1";
const COLORS: Streak["color"][] = ["pink", "mint", "lav", "peach", "sky"];
const BG: Record<Streak["color"], string> = { pink: "bg-pink", mint: "bg-mint", lav: "bg-lav", peach: "bg-peach", sky: "bg-sky" };
const EMOJIS = ["🌸", "🏃‍♀️", "💻", "📚", "🧘", "💧", "🎨", "🍓", "🐱", "⭐"];
const WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

function Index() {
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [page, setPage] = useState(0);
  const [month, setMonth] = useState(() => new Date());
  const [adding, setAdding] = useState(false);
  const [msg, setMsg] = useState("");
  const today = new Date();

  useEffect(() => {
    try { setStreaks(JSON.parse(localStorage.getItem(KEY) || "[]")); } catch {}
    setLoaded(true);
  }, []);
  useEffect(() => { if (loaded) localStorage.setItem(KEY, JSON.stringify(streaks)); }, [streaks, loaded]);

  const s = streaks[page];
  const say = (t: string) => { setMsg(t); setTimeout(() => setMsg(""), 2200); };

  const clickDay = (key: string) => {
    if (!s) return;
    if (s.done.includes(key)) return say("Already done! No take-backs ✿");
    if (!canMark(s, key, today)) return say(key > dayKey(today) ? "No time travel~ come back that day! ⏳" : "That day is past, only today counts (｡•́︿•̀｡)");
    setStreaks((all) => all.map((x, i) => (i === page ? markToday(x, today) : x)));
    say("Yay! Streak +1 (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧");
  };

  const cells = useMemo(() => {
    const y = month.getFullYear(), m = month.getMonth();
    const first = new Date(y, m, 1).getDay();
    const n = new Date(y, m + 1, 0).getDate();
    return [...Array(first).fill(null), ...Array.from({ length: n }, (_, i) => new Date(y, m, i + 1))];
  }, [month]);

  const flip = (d: number) => { setPage((p) => Math.min(Math.max(p + d, 0), streaks.length - 1)); setMonth(new Date()); };
  const remove = () => {
    if (!s || !confirm(`Tear off "${s.name}" page forever?`)) return;
    setStreaks((a) => a.filter((_, i) => i !== page));
    setPage((p) => Math.max(0, p - 1));
  };

  return (
    <main className="min-h-screen px-4 py-10">
      <header className="mx-auto mb-8 max-w-2xl text-center">
        <h1 className="font-display text-4xl text-primary sm:text-5xl">Streaky <span className="inline-block wiggle">✿</span></h1>
        <p className="mt-2 text-muted-foreground">one little box a day ~ keep the chain cute (◕‿◕)</p>
      </header>

      <div className="mx-auto max-w-2xl">
        {/* tabs */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {streaks.map((x, i) => (
            <button key={x.id} onClick={() => { setPage(i); setMonth(new Date()); }}
              className={`rounded-full border-2 px-3 py-1 text-sm transition ${i === page ? `${BG[x.color]} border-foreground/30 font-semibold` : "bg-card hover:-translate-y-0.5"}`}>
              {x.emoji} {x.name}
            </button>
          ))}
          <button onClick={() => setAdding(true)} className="rounded-full border-2 border-dashed border-primary bg-card px-3 py-1 text-sm text-primary hover:bg-muted">+ new streak</button>
        </div>

        {/* calendar */}
        <div className="relative">
          <div className="absolute -top-3 left-0 right-0 z-10 flex justify-around">
            {Array.from({ length: 8 }).map((_, i) => <span key={i} className="h-7 w-3 rounded-full border-2 border-ring-bind bg-background" />)}
          </div>
          {s ? (
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
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${Math.min(100, (s.done.length / s.goal) * 100)}%` }} />
                </div>
              </div>

              <div className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} className="rounded-full px-3 py-1 hover:bg-muted">‹</button>
                  <span className="font-display">{month.toLocaleString("en", { month: "long", year: "numeric" })}</span>
                  <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} className="rounded-full px-3 py-1 hover:bg-muted">›</button>
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {WEEK.map((w) => <div key={w} className="text-xs font-semibold text-muted-foreground">{w}</div>)}
                  {cells.map((d, i) => {
                    if (!d) return <div key={i} />;
                    const k = dayKey(d);
                    const done = s.done.includes(k);
                    const isToday = k === dayKey(today);
                    const future = k > dayKey(today);
                    return (
                      <button key={i} onClick={() => clickDay(k)} aria-label={`${k}${done ? " done" : ""}`}
                        className={`relative aspect-square rounded-xl border-2 text-sm transition
                          ${done ? `${BG[s.color]} border-foreground/20` : "bg-card"}
                          ${isToday && !done ? "border-primary ring-2 ring-primary/40 hover:scale-105 cursor-pointer" : ""}
                          ${future ? "opacity-40" : ""} ${!isToday ? "cursor-not-allowed" : ""}`}>
                        <span className={done ? "line-through decoration-2 decoration-foreground/60" : ""}>{d.getDate()}</span>
                        {done && <span className="pop absolute inset-0 flex items-center justify-center text-xl">✕</span>}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-3 h-5 text-center text-sm text-primary">{msg || (s.done.includes(dayKey(today)) ? "today's box is crossed off ♡ see you tomorrow" : "tap today's box when you finish!")}</p>
              </div>

              <div className="flex items-center justify-between border-t-2 border-dashed px-5 py-3 text-sm">
                <button disabled={page === 0} onClick={() => flip(-1)} className="rounded-full px-3 py-1 hover:bg-muted disabled:opacity-30">← prev page</button>
                <button onClick={remove} className="text-xs text-muted-foreground hover:text-destructive">tear off</button>
                <button disabled={page >= streaks.length - 1} onClick={() => flip(1)} className="rounded-full px-3 py-1 hover:bg-muted disabled:opacity-30">next page →</button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border-2 bg-paper p-12 text-center shadow-cute">
              <div className="text-6xl">🐰</div>
              <p className="font-display mt-4 text-xl">your calendar is empty~</p>
              <button onClick={() => setAdding(true)} className="mt-5 rounded-full bg-primary px-5 py-2 text-primary-foreground shadow-cute hover:-translate-y-0.5">+ add your first streak</button>
            </div>
          )}
        </div>
      </div>

      {adding && <AddDialog onClose={() => setAdding(false)} onAdd={(x) => { setStreaks((a) => [...a, x]); setPage(streaks.length); setMonth(new Date()); setAdding(false); }} />}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl bg-card/70 px-3 py-1"><div className="font-semibold">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>;
}

function AddDialog({ onClose, onAdd }: { onClose: () => void; onAdd: (s: Streak) => void }) {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState(30);
  const [emoji, setEmoji] = useState<string>("🌸");
  const [color, setColor] = useState<Streak["color"]>("pink");
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/30 p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); if (!name.trim()) return;
          onAdd({ id: crypto.randomUUID(), name: name.trim(), goal: Math.max(1, goal), emoji, color, createdAt: dayKey(new Date()), done: [] }); }}
        className="pop w-full max-w-sm space-y-4 rounded-3xl border-2 bg-paper p-6 shadow-cute">
        <h3 className="font-display text-xl text-primary">new streak page ✿</h3>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Exercise, DSA..." className="w-full rounded-xl border-2 bg-card px-3 py-2 outline-none focus:border-primary" />
        <label className="block text-sm">goal (days)
          <input type="number" min={1} value={goal} onChange={(e) => setGoal(+e.target.value)} className="mt-1 w-full rounded-xl border-2 bg-card px-3 py-2 outline-none focus:border-primary" />
        </label>
        <div className="flex flex-wrap gap-1">{EMOJIS.map((e) => <button type="button" key={e} onClick={() => setEmoji(e)} className={`rounded-xl p-1.5 text-xl ${emoji === e ? "bg-accent" : ""}`}>{e}</button>)}</div>
        <div className="flex gap-2">{COLORS.map((c) => <button type="button" key={c} aria-label={c} onClick={() => setColor(c)} className={`h-8 w-8 rounded-full border-2 ${BG[c]} ${color === c ? "border-foreground scale-110" : "border-card"}`} />)}</div>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-full px-4 py-2 hover:bg-muted">cancel</button>
          <button className="rounded-full bg-primary px-4 py-2 text-primary-foreground">add page</button>
        </div>
      </form>
    </div>
  );
}
