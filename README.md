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
   To fill the leaderboard with sample typists, add demo data (and remove it again before going live):
   ```
   npm run db:setup -- --demo        # 16 demo typists with results on every board
   npm run db:setup -- --clear-demo  # remove them
   ```
   Demo users have no password, so nobody can sign in as them.
4. `npm install` and `npm run dev` → http://localhost:3000

### Upgrading an existing database
Run `npm run db:setup` again after pulling new code. The schema only adds what is missing and never
renames, drops or deletes anything.

## Premium membership — 50,000 LAK / month
Basic practice stays free. Premium (needs accounts, i.e. a database) adds:
- **Weak-key training** — every test records which keys were missed; Premium builds a drill from the worst ones.
- **Progress reports** — full history, average speed per day (chart), per-test summary and weak keys
  (free accounts see their last 10 results).
- **Custom text & advanced exercises** — paste your own text; Lao digits/prices, punctuation and long
  passages; *strict mode* (mistakes must be fixed before moving on).
- **Certificates** — Lao Keyboard Foundations, Speed 30 WPM, Speed 50 WPM (≥ 95% accuracy), with a
  public, printable page at `/certificate/<id>` for verification.

**How payment works:** the member picks 1/3/6/12 months on `/premium`, transfers the total by QR or bank
transfer, and uploads the slip. An admin reviews it at `/admin/payments` and approves (Premium is
extended by that many months) or rejects with a reason. Set in `.env.local` / Vercel:
```
ADMIN_EMAILS=you@example.com            # comma-separated
PAYMENT_BANK=BCEL
PAYMENT_ACCOUNT_NAME=...
PAYMENT_ACCOUNT_NUMBER=...
PAYMENT_QR_IMAGE=/assets/payment/qr.png # put your QR at public/assets/payment/qr.png
```
Run `npm run db:setup` after pulling this, to add the new tables.

## Deploy: practice-only first
The site runs without any environment variables. When `DATABASE_URL` and `BETTER_AUTH_SECRET` are
not both set, it is in **practice-only mode**: all typing practice works (results are kept in the
browser), while sign-in, history and the leaderboard are hidden and their pages redirect to practice.
So you can import the repo on Vercel and deploy straight away — no database needed.

To switch accounts on later, follow the steps below and redeploy; nothing in the code changes.

## Deploy (Vercel + hosted PostgreSQL)
1. Create a PostgreSQL database (Neon, Supabase, Railway, Vercel Postgres, …) and copy its
   connection string (add `?sslmode=require` if the provider needs SSL).
2. Run `npm run db:setup` once with `DATABASE_URL` pointing at it (or run `db/schema.sql` in its SQL console).
3. Import the repo on Vercel and, under *Settings → Environment Variables*, set `DATABASE_URL` and
   `BETTER_AUTH_SECRET` (`.env.local` is never uploaded). `BETTER_AUTH_URL` is optional there: without it
   the Vercel domain is used; set it if you add a custom domain. Redeploy after changing variables. On serverless, use the provider's pooled connection string.
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
- `src/lib/results.ts` – SQL for saving results, history, the leaderboard and Premium reports
- `src/lib/premium.ts` – price, Premium status, payments and admin review; `src/lib/keystats.ts` – weak keys
- `src/lib/courses.ts`, `src/lib/certificates.ts` – courses and certificates
- `src/app/api/results` – saves results (speed recomputed and checked on the server)
- `src/app/history`, `src/app/leaderboard`, `src/app/sign-in`, `src/app/sign-up` – pages
