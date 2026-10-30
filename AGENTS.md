<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

# Architecture rules

- Habit data lives in the cloud database behind sign-in. Streaks must never be
  kept only in browser storage; browser storage is a one-time carry-over source.
- The streak day rule (only today can be crossed off, no undoing) is enforced in
  server functions, not only in the UI.
- Protected pages live under `src/routes/_authenticated/`; the public landing
  page stays at `src/routes/index.tsx`, and the two must never both claim `/`.
- Database schema changes go through the migration tool so the SQL lands in
  `drizzle/migrations/` and the generated types stay in sync.
- Sign-in uses the generated Cloud Auth helper (`@/integrations/lovable`) for
  social providers and the generated Supabase client for email flows.
- The build has two targets: Lovable's default edge format, and Vercel's when
  `process.env["VERCEL"]` is set (see `vite.config.ts`). Never force the Vercel
  preset unconditionally — it would break Lovable preview/publish.
