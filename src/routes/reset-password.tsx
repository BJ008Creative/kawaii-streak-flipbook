import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset your password ✿ Streaky" },
      {
        name: "description",
        content: "Set a new password for your Streaky account and get back to your habit calendar.",
      },
      { property: "og:title", content: "Reset your password ✿ Streaky" },
      { property: "og:description", content: "Set a new password for your Streaky account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) setNote("Pick a new password below ✿");
  }, [session]);

  const askLink = async () => {
    setBusy(true);
    setNote("");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setBusy(false);
    setNote(error ? error.message : "Check your inbox for the reset link ♡");
  };

  const save = async () => {
    setBusy(true);
    setNote("");
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) return setNote(error.message);
    navigate({ to: "/calendar", replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm rounded-3xl border-2 bg-paper p-6 shadow-cute">
        <div className="text-center text-4xl">🔑</div>
        <h1 className="font-display mt-3 text-center text-xl text-primary">new password</h1>

        {session ? (
          <div className="mt-5 space-y-3">
            <input
              autoFocus
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="new password"
              className="w-full rounded-xl border-2 bg-card px-3 py-2 outline-none focus:border-primary"
            />
            <button
              onClick={save}
              disabled={busy || password.length < 6}
              className="w-full rounded-full bg-primary px-4 py-2 text-primary-foreground disabled:opacity-40"
            >
              save it
            </button>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            <input
              autoFocus
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your email"
              className="w-full rounded-xl border-2 bg-card px-3 py-2 outline-none focus:border-primary"
            />
            <button
              onClick={askLink}
              disabled={busy || !email.includes("@")}
              className="w-full rounded-full bg-primary px-4 py-2 text-primary-foreground disabled:opacity-40"
            >
              send reset link
            </button>
          </div>
        )}

        {note && <p className="mt-3 text-center text-sm text-primary">{note}</p>}
        <p className="mt-4 text-center text-xs text-muted-foreground">
          <a href="/auth" className="underline">
            back to sign in
          </a>
        </p>
      </div>
    </main>
  );
}
