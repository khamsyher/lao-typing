import { NextResponse } from "next/server";
import { accountsEnabled } from "@/lib/features";
import {
  MAX_SLIP_BYTES,
  MONTH_OPTIONS,
  PendingPaymentExists,
  createPayment,
  getViewer,
} from "@/lib/premium";

// What the file really is, from its first bytes — the browser's file type can't be trusted.
function sniffImage(bytes: Buffer): string | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.length > 8 && bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])))
    return "image/png";
  if (bytes.length > 12 && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP")
    return "image/webp";
  return null;
}

// A member submits a transfer slip for N months of Premium; an admin reviews it.
export async function POST(request: Request) {
  if (!accountsEnabled) return NextResponse.json({ error: "accounts are not enabled" }, { status: 404 });
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const form = await request.formData().catch(() => null);
  const months = Number(form?.get("months"));
  const slip = form?.get("slip");
  if (!(MONTH_OPTIONS as readonly number[]).includes(months)) {
    return NextResponse.json({ error: "invalid months" }, { status: 400 });
  }
  if (!(slip instanceof File) || slip.size === 0) return NextResponse.json({ error: "slip missing" }, { status: 400 });
  if (slip.size > MAX_SLIP_BYTES) return NextResponse.json({ error: "slip too large" }, { status: 413 });

  const bytes = Buffer.from(await slip.arrayBuffer());
  const type = sniffImage(bytes);
  if (!type) return NextResponse.json({ error: "slip must be a JPG, PNG or WebP image" }, { status: 415 });

  try {
    const id = await createPayment({ userId: viewer.id, months, slipType: type, slipData: bytes });
    return NextResponse.json({ id });
  } catch (err) {
    if (err instanceof PendingPaymentExists) {
      return NextResponse.json({ error: "a payment is already waiting for review" }, { status: 409 });
    }
    throw err;
  }
}
