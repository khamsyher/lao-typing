import { NextResponse } from "next/server";
import { accountsEnabled } from "@/lib/features";
import { addKeyStats, parseKeyStats } from "@/lib/keystats";
import { MODE_KEY_RE } from "@/lib/modes";
import { getViewer } from "@/lib/premium";
import { saveResult } from "@/lib/results";

const MAX_CPM = 1500; // 300 WPM — anything faster is not a human typing

// Save a finished test for the signed-in user. Speed and accuracy are recomputed here from
// the raw counts rather than trusted from the client.
export async function POST(request: Request) {
  if (!accountsEnabled) return NextResponse.json({ error: "accounts are not enabled" }, { status: 404 });
  const viewer = await getViewer();
  if (!viewer) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { modeKey, correct, keystrokes, errors, seconds, keyStats } = (body ?? {}) as Record<string, unknown>;

  const ints = [correct, keystrokes, errors].every((n) => Number.isInteger(n) && (n as number) >= 0);
  if (
    typeof modeKey !== "string" ||
    !MODE_KEY_RE.test(modeKey) ||
    !ints ||
    typeof seconds !== "number" ||
    !Number.isFinite(seconds) ||
    seconds < 1 ||
    seconds > 3600 ||
    (correct as number) > (keystrokes as number) ||
    (errors as number) > (keystrokes as number)
  ) {
    return NextResponse.json({ error: "invalid result" }, { status: 400 });
  }

  // Timed tests must last (about) their full duration.
  if (modeKey.startsWith("timed:")) {
    const limit = Number(modeKey.split(":")[1]);
    if (Math.abs(seconds - limit) > 2) return NextResponse.json({ error: "invalid duration" }, { status: 400 });
  }

  // Weak-key, custom and advanced practice are Premium features.
  const premiumMode = modeKey === "lessons:weak-keys" || modeKey === "custom" || modeKey.startsWith("advanced:");
  if (premiumMode && !viewer.isPremium) return NextResponse.json({ error: "premium required" }, { status: 403 });

  const stats = parseKeyStats(keyStats, keystrokes as number);
  if (!stats) return NextResponse.json({ error: "invalid key stats" }, { status: 400 });

  const cpm = ((correct as number) / seconds) * 60;
  if (cpm > MAX_CPM) return NextResponse.json({ error: "implausible speed" }, { status: 400 });
  const accuracy = (keystrokes as number) > 0 ? (1 - (errors as number) / (keystrokes as number)) * 100 : 0;

  const id = await saveResult({
    userId: viewer.id,
    modeKey,
    cpm,
    wpm: cpm / 5,
    accuracy,
    errors: errors as number,
    seconds,
  });

  // Key counts are collected for every member, so weak-key training has data from day one of Premium.
  await addKeyStats(viewer.id, stats);

  return NextResponse.json({ id });
}
