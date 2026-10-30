# Kawaii Streak Flipbook

i want a website which basically is like a github green page type streak counter type...i need it to maintain my streakd of varioud activities like lets say exercise for 30 days and doing dsa for some days etc etc ...i should be able to add streak boxes onto the page the design of the ui should be like an aesthetic calender style ui where you can filp pages of the calender to see the dofferent streakd you have and then strike out each day after finishing maintain the generak rules of a streak like you cant click done for all days in one day and also you cant undo previous done streak and syuff like thay make it kawaii

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://kawaii-streak-flipbook.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/7eeedc6d-8061-4c04-ac72-5655570398d7).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

## Deploy to Vercel

The app builds for Vercel automatically when Vercel runs the build (it sets
`VERCEL=1`, and `vite.config.ts` switches the output format). The database and
sign-in stay on Lovable Cloud — Vercel only hosts the app itself.

1. Push this repository to GitHub (in Lovable: **More → Git → Connect**).
2. In Vercel: **Add New → Project → Import** the repository.
3. Framework preset: **Other**. Build command `npm run build`, output left as
   default — the build emits `.vercel/output` itself.
4. Add the four environment variables from `.env.example`
   (Settings → Environment Variables).
5. Deploy.

The same database serves both the Lovable-hosted site and the Vercel one, so
streaks stay in sync between them.
