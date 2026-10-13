import type { Lang } from "./i18n";

// Pages are rendered on the server, so dates use Laos time rather than the server's zone.
export function formatDate(date: Date, lang: Lang, withTime = true) {
  return new Intl.DateTimeFormat(lang === "lo" ? "lo-LA" : "en-GB", {
    timeZone: "Asia/Vientiane",
    day: "numeric",
    month: "short",
    year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
}

export function formatDuration(totalSeconds: number) {
  const s = Math.round(totalSeconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s % 60}s`;
  return `${s}s`;
}
