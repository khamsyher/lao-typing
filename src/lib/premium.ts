import "server-only";
import { getSession } from "./auth";
import { query, queryOne, transaction } from "./db";

export const PRICE_PER_MONTH_LAK = 50_000;
export const MONTH_OPTIONS = [1, 3, 6, 12] as const;
export const MAX_SLIP_BYTES = 3 * 1024 * 1024;
export const SLIP_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

// Admins are the accounts whose email is listed in ADMIN_EMAILS (comma separated).
export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

// Where members send the money. Set these in .env.local on the VPS; unset ones are not shown.
export function paymentDetails() {
  return {
    bank: process.env.PAYMENT_BANK || null,
    accountName: process.env.PAYMENT_ACCOUNT_NAME || null,
    accountNumber: process.env.PAYMENT_ACCOUNT_NUMBER || null,
    qrImage: process.env.PAYMENT_QR_IMAGE || null, // e.g. /assets/payment/qr.png
  };
}

export async function getPremiumUntil(userId: string): Promise<Date | null> {
  const row = await queryOne<{ premiumUntil: Date }>(`SELECT "premiumUntil" FROM membership WHERE "userId" = $1`, [
    userId,
  ]);
  return row?.premiumUntil ?? null;
}

export const isActive = (until: Date | null) => !!until && until.getTime() > Date.now();

export interface Viewer {
  id: string;
  name: string;
  email: string;
  premiumUntil: Date | null;
  isPremium: boolean;
  isAdmin: boolean;
}

// The signed-in user with their Premium and admin status, or null when signed out.
export async function getViewer(): Promise<Viewer | null> {
  const session = await getSession();
  if (!session) return null;
  // Read in the layout on every page: if the database hiccups, show the user as not Premium
  // rather than breaking the page. Premium-only routes re-check and fail safe the same way.
  const premiumUntil = await getPremiumUntil(session.user.id).catch((err) => {
    console.error("[premium] Could not read membership", err);
    return null;
  });
  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    premiumUntil,
    isPremium: isActive(premiumUntil),
    isAdmin: isAdminEmail(session.user.email),
  };
}

// ---- Payments ----

export type PaymentStatus = "pending" | "approved" | "rejected";

export interface PaymentRow {
  id: number;
  userId: string;
  months: number;
  amountLak: number;
  status: PaymentStatus;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
}

export interface AdminPaymentRow extends PaymentRow {
  name: string;
  email: string;
  premiumUntil: Date | null;
}

const PAYMENT_COLUMNS = `p.id, p."userId", p.months, p."amountLak", p.status, p."reviewNote", p."reviewedBy",
  p."reviewedAt", p."createdAt"`;

export class PendingPaymentExists extends Error {}

export async function createPayment(input: {
  userId: string;
  months: number;
  slipType: string;
  slipData: Buffer;
}): Promise<number> {
  try {
    const row = await queryOne<{ id: number }>(
      `INSERT INTO premium_payment ("userId", months, "amountLak", "slipType", "slipData")
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [input.userId, input.months, input.months * PRICE_PER_MONTH_LAK, input.slipType, input.slipData],
    );
    return row!.id;
  } catch (err) {
    // The partial unique index allows only one pending payment per member.
    if ((err as { code?: string }).code === "23505") throw new PendingPaymentExists();
    throw err;
  }
}

export async function listMyPayments(userId: string): Promise<PaymentRow[]> {
  return query<PaymentRow>(
    `SELECT ${PAYMENT_COLUMNS} FROM premium_payment p WHERE p."userId" = $1 ORDER BY p."createdAt" DESC LIMIT 20`,
    [userId],
  );
}

export async function listPaymentsForAdmin(status: PaymentStatus, limit = 50): Promise<AdminPaymentRow[]> {
  return query<AdminPaymentRow>(
    `SELECT ${PAYMENT_COLUMNS}, u.name, u.email, m."premiumUntil"
       FROM premium_payment p
       JOIN "user" u ON u.id = p."userId"
       LEFT JOIN membership m ON m."userId" = p."userId"
      WHERE p.status = $1
      ORDER BY ${status === "pending" ? `p."createdAt" ASC` : `p."reviewedAt" DESC`}
      LIMIT $2`,
    [status, limit],
  );
}

export async function getSlip(id: number) {
  return queryOne<{ userId: string; slipType: string; slipData: Buffer }>(
    `SELECT "userId", "slipType", "slipData" FROM premium_payment WHERE id = $1`,
    [id],
  );
}

// Approve a pending payment and extend Premium, in one transaction. Returns the new end date,
// or null if the payment was not pending (already reviewed, or it doesn't exist).
export async function approvePayment(id: number, adminEmail: string): Promise<Date | null> {
  return transaction(async (client) => {
    const pay = await client.query<{ userId: string; months: number }>(
      `UPDATE premium_payment SET status = 'approved', "reviewedBy" = $2, "reviewedAt" = now()
        WHERE id = $1 AND status = 'pending' RETURNING "userId", months`,
      [id, adminEmail],
    );
    if (!pay.rowCount) return null;
    const { userId, months } = pay.rows[0];
    const m = await client.query<{ premiumUntil: Date }>(
      `INSERT INTO membership ("userId", "premiumUntil") VALUES ($1, now() + make_interval(months => $2))
       ON CONFLICT ("userId") DO UPDATE
         SET "premiumUntil" = GREATEST(membership."premiumUntil", now()) + make_interval(months => $2),
             "updatedAt" = now()
       RETURNING "premiumUntil"`,
      [userId, months],
    );
    return m.rows[0].premiumUntil;
  });
}

export async function rejectPayment(id: number, adminEmail: string, note: string): Promise<boolean> {
  const row = await queryOne<{ id: number }>(
    `UPDATE premium_payment SET status = 'rejected', "reviewedBy" = $2, "reviewedAt" = now(), "reviewNote" = $3
      WHERE id = $1 AND status = 'pending' RETURNING id`,
    [id, adminEmail, note],
  );
  return !!row;
}
