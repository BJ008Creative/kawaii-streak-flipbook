import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import "@lovable.dev/cloud-auth-js/styles.css";

import { useAuth } from "@/hooks/use-auth";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in ✿ Streaky" },
      {
        name: "description",
        content: "Sign in to your Streaky account to open your kawaii habit streak calendar.",
      },
      { property: "og:title", content: "Sign in ✿ Streaky" },
      { property: "og:description", content: "Sign in to your Streaky habit streak calendar." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (search: Record<string, unknown>): { mode: "signin" | "signup" } => ({
    mode: search["mode"] === "signup" ? "signup" : "signin",
  }),
  component: Auth,
});

function Auth() {
  const { mode } = Route.useSearch();
  const { session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const signup = mode === "signup";

  const goCalendar = () => navigate({ to: "/calendar", replace: true });

  const social = async (provider: "google" | "lovable") => {
    setBusy(true);
    setNote("");
    try {
      sessionStorage.setItem("streaky-next", "/calendar");
    } catch {
      /* storage blocked; the landing page still offers a way in */
    }
    const result = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    setBusy(false);
    if (result.error) setNote(result.error.message);
  };

  const submit = async () => {
    setBusy(true);
    setNote("");
    if (signup) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(false);
      if (error) return setNote(error.message);
      if (data.session) return goCalendar();
      return setNote("Almost there ~ confirm your email, then sign in ♡");
    }
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) return setNote(error.message);
    goCalendar();
  };

  if (session) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4">
        <div className="rounded-3xl border-2 bg-paper p-8 text-center shadow-cute">
          <div className="text-5xl">🐰</div>
          <p className="font-display mt-3 text-xl text-primary">you're already in ♡</p>
          <button onClick={goCalendar} className="mt-4 rounded-full bg-primary px-5 py-2 text-primary-foreground">
            open my calendar
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border-2 bg-paper p-6 shadow-cute">
        <a href="/" className="font-display text-primary">
          Streaky ✿
        </a>
        <h1 className="font-display mt-3 text-2xl text-primary">{signup ? "make an account" : "welcome back"}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {signup ? "one little box a day, saved to your account ♡" : "your pages are waiting for you"}
        </p>

        <div className="mt-5 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your email"
            className="w-full rounded-xl border-2 bg-card px-3 py-2 outline-none focus:border-primary"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="password"
            className="w-full rounded-xl border-2 bg-card px-3 py-2 outline-none focus:border-primary"
          />
          <button
            onClick={submit}
            disabled={busy || !email.includes("@") || password.length < 6}
            className="w-full rounded-full bg-primary px-4 py-2 text-primary-foreground disabled:opacity-40"
          >
            {signup ? "create account" : "sign in"}
          </button>
        </div>

        {note && <p className="mt-3 text-center text-sm text-primary">{note}</p>}

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" /> or keep it quick <span className="h-px flex-1 bg-border" />
        </div>

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => social("google")}
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-input bg-card px-4 py-2 hover:bg-muted disabled:opacity-50"
          >
            <span aria-hidden>🇬</span> continue with google
          </button>
          <button type="button" className="lovable-auth-button" onClick={() => social("lovable")} disabled={busy}>
            Continue with Lovable
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
          <a
            href={signup ? "/auth" : "/auth?mode=signup"}
            className="underline"
            onClick={(e) => {
              e.preventDefault();
              navigate({ to: "/auth", search: { mode: signup ? "signin" : "signup" }, replace: true });
            }}
          >
            {signup ? "I already have an account" : "new here? make one"}
          </a>
          <a href="/reset-password" className="underline">
            forgot password?
          </a>
        </div>
      </div>
    </main>
  );
}
