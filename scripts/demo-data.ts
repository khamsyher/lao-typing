// Demo typists and results, so the leaderboard has something to show.
// Used by: npm run db:setup -- --demo        (add or refresh the demo data)
//          npm run db:setup -- --clear-demo  (remove it again)
//
// Demo users have no password or Google account, so nobody can sign in as them. They are
// recognised by their e-mail domain, and deleting them also deletes their results.
import type { Client } from "pg";

export const DEMO_EMAIL_DOMAIN = "demo.lao-typing.test";

const DEMO_NAMES = [
  "ສົມພອນ ແກ້ວມະນີ",
  "ບຸນມີ ສີສຸວັນ",
  "ຄຳແພງ ວົງສາ",
  "ພອນສະຫວັນ ອິນທະວົງ",
  "ວັນນະສອນ ພົມມະຈັນ",
  "ແສງເດືອນ ຈັນທະລາ",
  "ທອງໃສ ສຸລິຍະ",
  "ມະນີວອນ ໄຊຍະວົງ",
  "ສຸກສະຫວັດ ບຸບຜາ",
  "ອານຸສອນ ແສງສະຫວ່າງ",
  "ດາລາວັນ ສີພັນດອນ",
  "ຄຳຫຼ້າ ວິໄລທອງ",
  "ບົວພັນ ໄຊສົມບັດ",
  "ຈັນສະໝອນ ອຸດົມສຸກ",
  "Noy Phommasone",
  "Ketsana Vongsa",
];

// The same boards the leaderboard page offers (src/lib/modes.ts → LEADERBOARD_BOARDS).
const BOARDS = [
  "timed:15", "timed:30", "timed:60", "timed:120",
  "words:10", "words:25", "words:50",
  "sentences:1", "sentences:3", "sentences:5",
];
const LESSONS = ["home-left", "home-right", "home-all", "top", "bottom", "number"];

// Seeded random numbers, so every run produces the same demo data.
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Rough length in code points of each test, used to work out how long a run took.
function testChars(modeKey: string): number | null {
  const [mode, value] = modeKey.split(":");
  if (mode === "words") return Number(value) * 6;
  if (mode === "sentences") return Number(value) * 26;
  if (mode === "lessons") return 18 * 4;
  return null; // timed: duration is fixed
}

interface DemoResult {
  userId: string;
  modeKey: string;
  wpm: number;
  cpm: number;
  accuracy: number;
  errors: number;
  seconds: number;
  minutesAgo: number;
}

function makeResults(userIds: string[]): DemoResult[] {
  const rand = mulberry32(20261014);
  const between = (lo: number, hi: number) => lo + rand() * (hi - lo);
  const out: DemoResult[] = [];

  userIds.forEach((userId, i) => {
    // Typists range from beginner (~18 WPM) to fast (~72 WPM).
    const skill = 72 - (i * 54) / (userIds.length - 1) + between(-4, 4);
    const steadiness = between(0.88, 0.99); // how accurate this person usually is

    // Not everyone plays every board, so boards differ a little.
    const boards = BOARDS.filter(() => rand() < 0.8).concat(LESSONS.filter(() => rand() < 0.4).map((l) => `lessons:${l}`));
    for (const modeKey of boards) {
      const runs = 1 + Math.floor(rand() * 5);
      for (let r = 0; r < runs; r++) {
        const short = modeKey === "timed:15" || modeKey === "words:10" || modeKey === "sentences:1";
        const wpm = Math.max(8, skill * (short ? 1.06 : 1) + between(-7, 6));
        const accuracy = Math.min(100, Math.max(80, steadiness * 100 + between(-6, 3)));
        const cpm = wpm * 5;
        const chars = testChars(modeKey);
        const seconds = chars === null ? Number(modeKey.split(":")[1]) : (chars / cpm) * 60;
        const keystrokes = Math.round((cpm * seconds) / 60 / (accuracy / 100));
        const errors = Math.round(keystrokes * (1 - accuracy / 100));
        // Spread over the last 45 days, with a share of runs today and this week.
        const bucket = rand();
        const minutesAgo = Math.round(
          bucket < 0.15 ? between(5, 8 * 60) : bucket < 0.4 ? between(8 * 60, 6 * 24 * 60) : between(7 * 24 * 60, 45 * 24 * 60),
        );
        out.push({
          userId,
          modeKey,
          wpm: round1(wpm),
          cpm: round1(cpm),
          accuracy: round1(accuracy),
          errors,
          seconds: round1(seconds),
          minutesAgo,
        });
      }
    }
  });
  return out;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export async function seedDemo(client: Client) {
  await client.query("BEGIN");
  try {
    const userIds: string[] = [];
    for (const [i, name] of DEMO_NAMES.entries()) {
      const id = `demo-${String(i + 1).padStart(2, "0")}`;
      userIds.push(id);
      await client.query(
        `INSERT INTO "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, false, now() - interval '60 days', now())
         ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
        [id, name, `typist${i + 1}@${DEMO_EMAIL_DOMAIN}`],
      );
    }

    // Replace earlier demo results, so re-running refreshes the dates instead of piling up.
    await client.query(`DELETE FROM result WHERE "userId" = ANY($1)`, [userIds]);
    const results = makeResults(userIds);
    const cols = 8;
    const values: unknown[] = [];
    const rows = results.map((r, i) => {
      values.push(r.userId, r.modeKey, r.wpm, r.cpm, r.accuracy, r.errors, r.seconds, r.minutesAgo);
      const p = (n: number) => `$${i * cols + n}`;
      return `(${p(1)}, ${p(2)}, ${p(3)}, ${p(4)}, ${p(5)}, ${p(6)}, ${p(7)}, now() - make_interval(mins => ${p(8)}::int))`;
    });
    await client.query(
      `INSERT INTO result ("userId", "modeKey", wpm, cpm, accuracy, errors, seconds, "createdAt")
       VALUES ${rows.join(",\n")}`,
      values,
    );
    await client.query("COMMIT");
    console.log(`✓ Demo data: ${userIds.length} typists, ${results.length} results`);
    console.log("    remove it any time with: npm run db:setup -- --clear-demo");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  }
}

export async function clearDemo(client: Client) {
  // Results, sessions and accounts go with the user (ON DELETE CASCADE).
  const res = await client.query(`DELETE FROM "user" WHERE email LIKE $1`, [`%@${DEMO_EMAIL_DOMAIN}`]);
  console.log(`✓ Removed ${res.rowCount} demo typists and their results`);
}
