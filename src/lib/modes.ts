import { ADVANCED_EXERCISES, LESSONS } from "./content";
import { translate, type Lang } from "./i18n";

// Every result is stored under a mode key such as "timed:60" or "lessons:top".
// Premium practice is stored too: "lessons:weak-keys", "custom" and "advanced:<exercise>".
export const MODE_KEY_RE =
  /^(lessons:[a-z-]+|words:(10|25|50)|sentences:(1|3|5)|timed:(15|30|60|120)|custom|advanced:[a-z-]+)$/;

// Tests with comparable text, so they get a public leaderboard. Lessons are drills and do not.
export const LEADERBOARD_BOARDS = [
  "timed:15",
  "timed:30",
  "timed:60",
  "timed:120",
  "words:10",
  "words:25",
  "words:50",
  "sentences:1",
  "sentences:3",
  "sentences:5",
] as const;

export const DEFAULT_BOARD = "timed:60";

export function labelForKey(key: string, lang: Lang): string {
  const [mode, value] = key.split(":");
  const t = (k: Parameters<typeof translate>[1]) => translate(lang, k);
  switch (mode) {
    case "lessons":
      if (value === "weak-keys") return t("weakKeys");
      return (LESSONS.find((l) => l.id === value) ?? LESSONS[0]).title[lang];
    case "custom":
      return t("custom");
    case "advanced":
      return `${t("advanced")} · ${ADVANCED_EXERCISES.find((e) => e.id === value)?.title[lang] ?? value}`;
    case "words":
      return `${t("words")} · ${value}`;
    case "sentences":
      return `${t("sentences")} · ${value}`;
    case "timed":
      return `${t("timed")} · ${value}${t("seconds")}`;
    default:
      return key;
  }
}
