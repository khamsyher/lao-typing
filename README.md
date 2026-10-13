# ພິມລາວ · Lao Typing

Free online Lao typing practice built with Next.js and Tailwind CSS.

## Features
- **Lessons** for each row of the Lao (Kedmanee) keyboard, Shift keys and Lao digits
- **Words**, **Sentences** and **Timed** (15/30/60/120 s) modes
- Live WPM, CPM, accuracy, errors and a progress bar
- On-screen keyboard that highlights the next key, Shift and which finger to use
- **Built-in Lao layout**: type Lao without installing a Lao keyboard (maps physical keys)
- Personal bests and recent results saved in the browser
- **Accounts** (email + password, optional Google): results are saved to your history at `/history`
- **Public leaderboard** at `/leaderboard`: best speed per typist for timed, word and sentence tests (90%+ accuracy), all time / month / week / today
- Lao / English UI, light / dark theme
- Shortcuts: `Tab` restart same text, `Esc` new text, `Ctrl+Backspace` delete word

## Develop
```bash
npm install
cp .env.example .env.local   # then set BETTER_AUTH_SECRET and DATABASE_URL
createdb lao_typing_app      # use a new, empty database (not one shared with another app)
npm run db:push              # create the tables in your PostgreSQL database
npm run dev                  # http://localhost:3000
```

## Deploy (Vercel + hosted PostgreSQL)
1. Create a PostgreSQL database (Neon, Supabase, Railway, Vercel Postgres, …) and copy its
   connection string (add `?sslmode=require` if the provider needs SSL).
2. Run `npm run db:push` once with `DATABASE_URL` pointing at it.
3. Import the repo on Vercel and set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (your site URL) and
   `DATABASE_URL`. On serverless, a pooled connection string and a small `DATABASE_POOL_MAX` (e.g. 3) work best.
4. Optional Google sign-in: create an OAuth client in Google Cloud, add the redirect URI
   `<site>/api/auth/callback/google`, and set `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

## Where things live
- `src/lib/layout.ts` – keyboard layout and finger map
- `src/lib/content.ts` – lessons, word and sentence lists
- `src/lib/typing.ts` – typing state, stats, grapheme clustering
- `src/components/TypingApp.tsx` – main UI
- `src/components/Keyboard.tsx` – on-screen keyboard
- `src/locales/*.json` – UI text (English / Lao)
- `src/lib/auth.ts` – Better Auth config; `src/app/api/auth` – auth endpoints
- `src/db/index.ts` – PostgreSQL connection pool (node-postgres + Drizzle)
- `src/db/schema.ts`, `src/db/queries.ts` – database tables and leaderboard/history queries
- `src/app/api/results` – saves results (speed recomputed and checked on the server)
- `src/app/history`, `src/app/leaderboard`, `src/app/sign-in`, `src/app/sign-up` – pages
