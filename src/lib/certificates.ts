import "server-only";
import { randomBytes } from "node:crypto";
import { COURSES, MIN_ACCURACY, findCourse, type Course } from "./courses";
import { query, queryOne } from "./db";

export interface CertificateRow {
  id: string;
  userId: string;
  course: string;
  holderName: string;
  wpm: number;
  accuracy: number;
  issuedAt: Date;
}

export interface RequirementProgress {
  modeKey: string;
  minWpm: number;
  bestWpm: number | null; // best run with enough accuracy, or null if none yet
  bestAccuracy: number | null;
  done: boolean;
}

export interface CourseProgress {
  course: Course;
  requirements: RequirementProgress[];
  complete: boolean;
  certificate: CertificateRow | null;
}

// Each test's best run (by speed) among runs with at least MIN_ACCURACY accuracy.
async function bestQualifyingRuns(userId: string) {
  const rows = await query<{ modeKey: string; wpm: number; accuracy: number }>(
    `SELECT DISTINCT ON ("modeKey") "modeKey", wpm, accuracy
       FROM result
      WHERE "userId" = $1 AND accuracy >= $2
      ORDER BY "modeKey", wpm DESC, accuracy DESC`,
    [userId, MIN_ACCURACY],
  );
  return new Map(rows.map((r) => [r.modeKey, r]));
}

export async function getCourseProgress(userId: string): Promise<CourseProgress[]> {
  const [best, certs] = await Promise.all([
    bestQualifyingRuns(userId),
    query<CertificateRow>(`SELECT * FROM certificate WHERE "userId" = $1`, [userId]),
  ]);
  return COURSES.map((course) => {
    const requirements = course.requirements.map((r) => {
      const run = best.get(r.modeKey);
      return {
        ...r,
        bestWpm: run?.wpm ?? null,
        bestAccuracy: run?.accuracy ?? null,
        done: !!run && run.wpm >= r.minWpm,
      };
    });
    return {
      course,
      requirements,
      complete: requirements.every((r) => r.done),
      certificate: certs.find((c) => c.course === course.id) ?? null,
    };
  });
}

export class CourseNotComplete extends Error {}

// Issue (or return the existing) certificate for a completed course. The certificate records the
// average speed and accuracy of the runs that met the requirements.
export async function issueCertificate(userId: string, holderName: string, courseId: string): Promise<CertificateRow> {
  if (!findCourse(courseId)) throw new CourseNotComplete();
  const progress = (await getCourseProgress(userId)).find((p) => p.course.id === courseId)!;
  if (progress.certificate) return progress.certificate;
  if (!progress.complete) throw new CourseNotComplete();

  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const wpm = avg(progress.requirements.map((r) => r.bestWpm!));
  const accuracy = avg(progress.requirements.map((r) => r.bestAccuracy!));
  const row = await queryOne<CertificateRow>(
    `INSERT INTO certificate (id, "userId", course, "holderName", wpm, accuracy)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT ("userId", course) DO UPDATE SET course = EXCLUDED.course
     RETURNING *`,
    [randomBytes(9).toString("base64url"), userId, courseId, holderName, wpm, accuracy],
  );
  return row!;
}

export async function getCertificate(id: string): Promise<CertificateRow | null> {
  if (!/^[A-Za-z0-9_-]{6,32}$/.test(id)) return null;
  return queryOne<CertificateRow>(`SELECT * FROM certificate WHERE id = $1`, [id]);
}
