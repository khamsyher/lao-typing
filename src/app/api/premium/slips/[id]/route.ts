import { accountsEnabled } from "@/lib/features";
import { getSlip, getViewer } from "@/lib/premium";

// A transfer slip image. Only the member who sent it and admins may see it.
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!accountsEnabled) return new Response("Not found", { status: 404 });
  const viewer = await getViewer();
  if (!viewer) return new Response("Unauthorized", { status: 401 });

  const id = Number((await params).id);
  const slip = Number.isInteger(id) ? await getSlip(id) : null;
  if (!slip || (slip.userId !== viewer.id && !viewer.isAdmin)) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(slip.slipData), {
    headers: {
      "Content-Type": slip.slipType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
