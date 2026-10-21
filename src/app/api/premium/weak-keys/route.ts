import { NextResponse } from "next/server";
import { accountsEnabled } from "@/lib/features";
import { getWeakKeys } from "@/lib/keystats";
import { getViewer } from "@/lib/premium";

// Premium: the signed-in member's weakest keys, used to build their personal drill.
export async function GET() {
  if (!accountsEnabled) return NextResponse.json({ error: "accounts are not enabled" }, { status: 404 });
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!viewer.isPremium) return NextResponse.json({ error: "premium required" }, { status: 403 });
  return NextResponse.json({ keys: await getWeakKeys(viewer.id) });
}
