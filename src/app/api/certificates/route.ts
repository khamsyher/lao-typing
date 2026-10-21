import { NextResponse } from "next/server";
import { CourseNotComplete, issueCertificate } from "@/lib/certificates";
import { accountsEnabled } from "@/lib/features";
import { getViewer } from "@/lib/premium";

// Premium: claim the certificate for a completed course. Body: { course: "foundations" }.
export async function POST(request: Request) {
  if (!accountsEnabled) return NextResponse.json({ error: "accounts are not enabled" }, { status: 404 });
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (!viewer.isPremium) return NextResponse.json({ error: "premium required" }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { course?: unknown } | null;
  if (typeof body?.course !== "string") return NextResponse.json({ error: "course missing" }, { status: 400 });
  try {
    const cert = await issueCertificate(viewer.id, viewer.name, body.course);
    return NextResponse.json({ id: cert.id });
  } catch (err) {
    if (err instanceof CourseNotComplete) {
      return NextResponse.json({ error: "course not complete" }, { status: 409 });
    }
    throw err;
  }
}
