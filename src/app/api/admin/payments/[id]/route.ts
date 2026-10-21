import { NextResponse } from "next/server";
import { accountsEnabled } from "@/lib/features";
import { approvePayment, getViewer, rejectPayment } from "@/lib/premium";

// Admin review of a pending payment: { action: "approve" } or { action: "reject", note }.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!accountsEnabled) return NextResponse.json({ error: "accounts are not enabled" }, { status: 404 });
  const viewer = await getViewer();
  if (!viewer?.isAdmin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const id = Number((await params).id);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "invalid id" }, { status: 400 });
  const body = (await request.json().catch(() => null)) as { action?: string; note?: unknown } | null;

  if (body?.action === "approve") {
    const premiumUntil = await approvePayment(id, viewer.email);
    if (!premiumUntil) return NextResponse.json({ error: "payment is not pending" }, { status: 409 });
    return NextResponse.json({ premiumUntil });
  }
  if (body?.action === "reject") {
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";
    if (!note) return NextResponse.json({ error: "a reason is required" }, { status: 400 });
    const ok = await rejectPayment(id, viewer.email, note);
    if (!ok) return NextResponse.json({ error: "payment is not pending" }, { status: 409 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
