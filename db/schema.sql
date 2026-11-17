-- Lao Typing — database schema (PostgreSQL)
-- Run this in Navicat (Query window) against your database, or use `npm run db:setup`.
-- Safe to re-run: every object is created only if it does not already exist, and nothing
-- is ever renamed or dropped.
--
-- Column names are camelCase (quoted) because Better Auth reads and writes these tables
-- using its own field names.

-- ---------------------------------------------------------------------------
-- Better Auth: accounts and sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "user" (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT false,
  image           TEXT,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS session (
  id          TEXT PRIMARY KEY,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  token       TEXT NOT NULL UNIQUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "userId"    TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON session ("userId");

-- One row per way of signing in: providerId 'credential' (email + password hash) or 'google'.
CREATE TABLE IF NOT EXISTS account (
  id                      TEXT PRIMARY KEY,
  "accountId"             TEXT NOT NULL,
  "providerId"            TEXT NOT NULL,
  "userId"                TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  "accessToken"           TEXT,
  "refreshToken"          TEXT,
  "idToken"               TEXT,
  "accessTokenExpiresAt"  TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  scope                   TEXT,
  password                TEXT,
  "createdAt"             TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt"             TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "account_userId_idx" ON account ("userId");

-- Short-lived tokens, e.g. the OAuth state while someone is on Google's sign-in page.
CREATE TABLE IF NOT EXISTS verification (
  id          TEXT PRIMARY KEY,
  identifier  TEXT NOT NULL,
  value       TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON verification (identifier);

-- ---------------------------------------------------------------------------
-- Typing results
-- ---------------------------------------------------------------------------
-- modeKey is the test that was typed: "timed:60", "words:25", "sentences:3", "lessons:top", …
-- Speed and accuracy are computed by the server from the raw counts, never taken from the browser.
CREATE TABLE IF NOT EXISTS result (
  id          INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "userId"    TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  "modeKey"   TEXT NOT NULL,
  wpm         DOUBLE PRECISION NOT NULL,
  cpm         DOUBLE PRECISION NOT NULL,
  accuracy    DOUBLE PRECISION NOT NULL,
  errors      INTEGER NOT NULL,
  seconds     DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- History page: one user's results, newest first.
CREATE INDEX IF NOT EXISTS "result_user_created_idx" ON result ("userId", "createdAt");
-- Leaderboard: best speeds per test.
CREATE INDEX IF NOT EXISTS "result_mode_wpm_idx" ON result ("modeKey", wpm);

-- ---------------------------------------------------------------------------
-- Premium membership (50,000 LAK per month)
-- ---------------------------------------------------------------------------
-- A member pays by QR / bank transfer and uploads the slip; an admin (ADMIN_EMAILS) checks it.
-- Approving extends the member's Premium by `months`, starting from today or from the end of
-- their current Premium, whichever is later.
CREATE TABLE IF NOT EXISTS premium_payment (
  id            INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "userId"      TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  months        INTEGER NOT NULL CHECK (months BETWEEN 1 AND 12),
  "amountLak"   INTEGER NOT NULL CHECK ("amountLak" > 0),
  -- The transfer slip image is stored in the database so it works without persistent local storage.
  "slipType"    TEXT NOT NULL CHECK ("slipType" IN ('image/jpeg', 'image/png', 'image/webp')),
  "slipData"    BYTEA NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  "reviewNote"  TEXT,          -- reason shown to the member when a payment is rejected
  "reviewedBy"  TEXT,          -- admin's email
  "reviewedAt"  TIMESTAMPTZ,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status = 'pending' OR "reviewedAt" IS NOT NULL),
  CHECK (status <> 'rejected' OR "reviewNote" IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS "premium_payment_user_idx" ON premium_payment ("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "premium_payment_pending_idx" ON premium_payment ("createdAt") WHERE status = 'pending';
-- At most one slip waiting for review per member.
CREATE UNIQUE INDEX IF NOT EXISTS "premium_payment_one_pending" ON premium_payment ("userId") WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS membership (
  "userId"        TEXT PRIMARY KEY REFERENCES "user" (id) ON DELETE CASCADE,
  "premiumUntil"  TIMESTAMPTZ NOT NULL,
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Premium features
-- ---------------------------------------------------------------------------
-- Weak-key training: how often each character was typed and missed, summed over all tests.
CREATE TABLE IF NOT EXISTS key_stat (
  "userId"   TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  ch         TEXT NOT NULL,
  attempts   INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  misses     INTEGER NOT NULL DEFAULT 0 CHECK (misses >= 0),
  PRIMARY KEY ("userId", ch)
);

-- Certificates, with a public page at /certificate/<id> so anyone can verify them.
CREATE TABLE IF NOT EXISTS certificate (
  id          TEXT PRIMARY KEY,                -- random, unguessable
  "userId"    TEXT NOT NULL REFERENCES "user" (id) ON DELETE CASCADE,
  course      TEXT NOT NULL,                   -- see src/lib/courses.ts
  "holderName" TEXT NOT NULL,                  -- name at the time it was issued
  wpm         DOUBLE PRECISION NOT NULL,
  accuracy    DOUBLE PRECISION NOT NULL,
  "issuedAt"  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE ("userId", course)
);
