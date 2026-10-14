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
