import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Streaky ✿ Kawaii Habit Streak Calendar" },
      {
        name: "description",
        content:
          "A cute flip-calendar streak tracker: give every habit its own page, cross off today, and keep your chains alive.",
      },
      { property: "og:title", content: "Streaky ✿ Kawaii Habit Streak Calendar" },
      { property: "og:description", content: "Flip through cute calendar pages and keep your habit streaks alive." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const DEMO = [false, true, true, true, false, true, true, true, false, true, true, true, true, false];

function Landing() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  // a social sign-in round-trip lands here; finish the trip the user started
  useEffect(() => {
    if (!session) return;
    let next: string | null = null;
    try {
      next = sessionStorage.getItem("streaky-next");
      if (next) sessionStorage.removeItem("streaky-next");
    } catch {
      next = null;
    }
    if (next === "/calendar") navigate({ to: "/calendar", replace: true });
  }, [session, navigate]);

  return (
    <main className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center justify-between">
          <span className="font-display text-primary">Streaky ✿</span>
          <div className="flex gap-2 text-sm">
            {session ? (
              <button
                onClick={() => navigate({ to: "/calendar" })}
                className="rounded-full bg-primary px-4 py-1.5 text-primary-foreground shadow-cute hover:-translate-y-0.5"
              >
                open my calendar
              </button>
            ) : (
              <>
                <a
                  href="/auth"
                  className="rounded-full border-2 border-primary px-4 py-1.5 text-primary hover:bg-muted"
                >
                  sign in
                </a>
                <a
                  href="/auth?mode=signup"
                  className="rounded-full bg-primary px-4 py-1.5 text-primary-foreground shadow-cute hover:-translate-y-0.5"
                >
                  create account
                </a>
              </>
            )}
          </div>
        </div>

        <section className="rounded-3xl border-2 bg-paper p-8 text-center shadow-cute">
          <h1 className="font-display text-4xl leading-tight text-primary sm:text-5xl">
            every habit gets <span className="wiggle inline-block">✿</span> its own page
          </h1>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            exercise, dsa, drinking water, reading before bed ~ flip through your little calendar and strike out the
            day you finished. miss one and the chain starts over, so keep it cute.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="/auth?mode=signup"
              className="rounded-full bg-primary px-6 py-3 text-primary-foreground shadow-cute hover:-translate-y-0.5"
            >
              start a streak ♡
            </a>
            <a href="/auth" className="rounded-full border-2 border-primary px-6 py-3 text-primary hover:bg-muted">
              I already have an account
            </a>
          </div>
          {loading && <p className="mt-4 text-xs text-muted-foreground">waking up your calendar~</p>}
        </section>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card emoji="📅" title="pages you flip">
            each habit is its own calendar page. flip forward and back like a real desk calendar.
          </Card>
          <Card emoji="✕" title="honest streaks">
            only today's box can be crossed off, and once it's crossed it stays crossed. no time travel.
          </Card>
          <Card emoji="☁️" title="follows you around">
            your pages live in your account, so the same streaks open on your phone and your laptop.
          </Card>
        </section>

        <section className="mt-6 rounded-3xl border-2 bg-paper p-5 shadow-cute">
          <div className="mb-3 flex items-center justify-between text-sm">
            <span className="font-display text-primary">🏃‍♀️ exercise</span>
            <span className="text-muted-foreground">🔥 5 day streak</span>
          </div>
          <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
            {WEEK.map((w) => (
              <div key={w} className="font-semibold text-muted-foreground">
                {w}
              </div>
            ))}
            {DEMO.map((done, i) => (
              <div
                key={i}
                className={`flex aspect-square items-center justify-center rounded-xl border-2 ${
                  done ? "border-foreground/20 bg-pink" : "bg-card"
                }`}
              >
                {done ? <span className="text-base">✕</span> : i + 1}
              </div>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">a page looks a bit like this ♡</p>
        </section>
      </div>
    </main>
  );
}

function Card({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border-2 bg-card p-5 shadow-cute">
      <div className="text-3xl">{emoji}</div>
      <h3 className="font-display mt-2 text-primary">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{children}</p>
    </div>
  );
}
