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
extended by that many months) or rejects with a reason. Set these values in `.env.local` on the VPS:
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
not both set, or `BETTER_AUTH_URL` is missing, it is in **practice-only mode**: all typing practice
works (results are kept in the browser), while account features are hidden and their pages redirect
to practice.

To enable accounts and the other account-based features, configure all three variables on the VPS
and restart the app.

## Deploy on a VPS
This app runs as a Node.js server. Put it behind a reverse proxy such as Nginx and enable HTTPS for
your domain.

1. Install a supported Node.js LTS release and PostgreSQL on the VPS, or create a PostgreSQL database
   with a provider reachable from the VPS.
2. Clone the repository on the VPS, enter the project directory, and install dependencies:
   ```
   npm ci
   ```
3. Create `.env.local` from `.env.example`. Set these required production values:
   ```
   DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/lao_typing_app
   BETTER_AUTH_SECRET=<a-random-secret-at-least-32-characters>
   BETTER_AUTH_URL=https://your-domain.example
   ```
   Use the public HTTPS address for `BETTER_AUTH_URL`. Keep `.env.local` private and do not commit it.
4. Create or update the production database schema:
   ```
   npm run db:setup
   ```
5. Build and start the production server:
   ```
   npm run build
   npm run start -- --hostname 127.0.0.1 --port 3000
   ```
   Keep the process running with a service manager such as systemd or PM2, and configure Nginx to
   proxy HTTPS traffic for your domain to `127.0.0.1:3000`.
6. Optional Google sign-in: create an OAuth client in Google Cloud, add the redirect URI
   `https://your-domain.example/api/auth/callback/google`, and set `GOOGLE_CLIENT_ID` and
   `GOOGLE_CLIENT_SECRET` in `.env.local`, then restart the app.
7. For Premium payments, set `ADMIN_EMAILS` and the payment details described above in `.env.local`,
   then restart the app.

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
