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

## Setup
1. **Create the database in Navicat.** Connect to your local PostgreSQL, right-click → *New Database* →
   name it `lao_typing_app`. Use a new, empty database — not one shared with another app.
2. **Configure env.** Copy `.env.example` to `.env.local` and set `DATABASE_URL` to your Navicat connection:
   ```
   DATABASE_URL=postgresql://postgres:<your-password>@localhost:5432/lao_typing_app
   ```
   URL-encode special characters in the password (`@` → `%40`). Set `BETTER_AUTH_SECRET` to a random string.
3. **Create the tables:**
   ```
   npm run db:setup
   ```
   Or, instead: run `db/schema.sql` in a Navicat query window.
4. `npm install` and `npm run dev` → http://localhost:3000

### Upgrading an existing database
Run `npm run db:setup` again after pulling new code. The schema only adds what is missing and never
renames, drops or deletes anything.

## Deploy (Vercel + hosted PostgreSQL)
1. Create a PostgreSQL database (Neon, Supabase, Railway, Vercel Postgres, …) and copy its
   connection string (add `?sslmode=require` if the provider needs SSL).
2. Run `npm run db:setup` once with `DATABASE_URL` pointing at it (or run `db/schema.sql` in its SQL console).
3. Import the repo on Vercel and set `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL` (your site URL) and
   `DATABASE_URL`. On serverless, use the provider's pooled connection string.
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
- `src/lib/db.ts` – PostgreSQL connection pool (`pg`, no ORM) with `query` / `queryOne` / `transaction`
- `db/schema.sql` – the whole database schema; `scripts/db-setup.ts` applies it (`npm run db:setup`)
- `src/lib/results.ts` – SQL for saving results, history and the leaderboard
- `src/app/api/results` – saves results (speed recomputed and checked on the server)
- `src/app/history`, `src/app/leaderboard`, `src/app/sign-in`, `src/app/sign-up` – pages
