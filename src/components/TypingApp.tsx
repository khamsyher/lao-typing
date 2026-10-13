"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Keyboard from "./Keyboard";
import { LESSONS, makeLessonText, makeSentencesText, makeWordsText } from "@/lib/content";
import { MESSAGES, translate, type Lang, type StringKey } from "@/lib/i18n";
import { FINGER_NAMES, HINT_BY_CHAR, KEY_BY_CODE, isCombining } from "@/lib/layout";
import { load, save } from "@/lib/storage";
import {
  computeStats,
  initTyping,
  toClusters,
  typingReducer,
  type TypingAction,
  type TypingState,
} from "@/lib/typing";

type Mode = "lessons" | "words" | "sentences" | "timed";

interface Prefs {
  lang: Lang;
  mode: Mode;
  lessonId: string;
  wordCount: number;
  sentenceCount: number;
  seconds: number;
  builtIn: boolean;
  keyboard: boolean;
}

interface Result {
  key: string;
  label: string;
  wpm: number;
  cpm: number;
  accuracy: number;
  at: number;
}

const DEFAULT_PREFS: Prefs = {
  lang: "lo",
  mode: "lessons",
  lessonId: LESSONS[0].id,
  wordCount: 25,
  sentenceCount: 3,
  seconds: 30,
  builtIn: true,
  keyboard: true,
};

const MODES: Mode[] = ["lessons", "words", "sentences", "timed"];
const WORD_COUNTS = [10, 25, 50];
const SENTENCE_COUNTS = [1, 3, 5];
const SECONDS = [15, 30, 60, 120];

function buildText(p: Prefs): string {
  switch (p.mode) {
    case "lessons":
      return makeLessonText(LESSONS.find((l) => l.id === p.lessonId) ?? LESSONS[0]);
    case "words":
      return makeWordsText(p.wordCount);
    case "sentences":
      return makeSentencesText(p.sentenceCount);
    case "timed":
      return makeWordsText(300);
  }
}

function resultKey(p: Prefs): string {
  switch (p.mode) {
    case "lessons":
      return `lessons:${p.lessonId}`;
    case "words":
      return `words:${p.wordCount}`;
    case "sentences":
      return `sentences:${p.sentenceCount}`;
    case "timed":
      return `timed:${p.seconds}`;
  }
}

function resultLabel(p: Prefs, lang: Lang): string {
  const tr = (k: StringKey) => translate(lang, k);
  switch (p.mode) {
    case "lessons":
      return (LESSONS.find((l) => l.id === p.lessonId) ?? LESSONS[0]).title[lang];
    case "words":
      return `${tr("words")} · ${p.wordCount}`;
    case "sentences":
      return `${tr("sentences")} · ${p.sentenceCount}`;
    case "timed":
      return `${tr("timed")} · ${p.seconds}${tr("seconds")}`;
  }
}

const displayChar = (ch: string) => (ch === " " ? "␣" : isCombining(ch) ? "◌" + ch : ch);

export default function TypingApp() {
  const [prefs, setPrefs] = useState<Prefs>(() => ({ ...DEFAULT_PREFS, ...load("prefs", {}) }));
  const [typing, setTyping] = useState<TypingState>(() => initTyping(buildText(prefs)));
  const [history, setHistory] = useState<Result[]>(() => load("history", []));
  const [best, setBest] = useState<Record<string, number>>(() => load("best", {}));
  const [finishInfo, setFinishInfo] = useState<{ isBest: boolean } | null>(null);
  const [now, setNow] = useState(0);
  const [focused, setFocused] = useState(false);
  const [pressed, setPressed] = useState<Set<string>>(() => new Set());
  const [latinWarn, setLatinWarn] = useState(false);

  const typingRef = useRef(typing);
  const prefsRef = useRef(prefs);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);

  const t = (k: StringKey) => translate(prefs.lang, k);

  const recordResult = useCallback((state: TypingState) => {
    const p = prefsRef.current;
    const stats = computeStats(state, state.end ?? Date.now());
    if (stats.correct === 0) return setFinishInfo({ isBest: false });
    const result: Result = {
      key: resultKey(p),
      label: resultLabel(p, p.lang),
      wpm: Math.round(stats.wpm),
      cpm: Math.round(stats.cpm),
      accuracy: Math.round(stats.accuracy),
      at: Date.now(),
    };
    const nextHistory = [result, ...history].slice(0, 20);
    setHistory(nextHistory);
    save("history", nextHistory);
    const isBest = result.wpm > (best[result.key] ?? 0);
    setFinishInfo({ isBest });
    if (isBest) {
      const nextBest = { ...best, [result.key]: result.wpm };
      setBest(nextBest);
      save("best", nextBest);
    }
  }, [history, best]);

  const apply = useCallback(
    (action: TypingAction) => {
      const prev = typingRef.current;
      const next = typingReducer(prev, action);
      if (next === prev) return;
      typingRef.current = next;
      setTyping(next);
      if (next.end !== null && prev.end === null) recordResult(next);
    },
    [recordResult],
  );

  const restart = useCallback(
    (p: Prefs = prefsRef.current, sameText = false) => {
      const text = sameText ? typingRef.current.chars.join("") : buildText(p);
      apply({ type: "reset", text });
      setFinishInfo(null);
      setLatinWarn(false);
      setNow(0);
      inputRef.current?.focus();
    },
    [apply],
  );

  const updatePrefs = (patch: Partial<Prefs>, regenerate = true) => {
    const next = { ...prefsRef.current, ...patch };
    prefsRef.current = next;
    setPrefs(next);
    save("prefs", next);
    if (regenerate) restart(next);
  };

  const typeText = (text: string) => {
    setLatinWarn(/[A-Za-z]/.test(text));
    apply({ type: "input", text, now: Date.now(), stopAtEnd: true });
  };

  // Tick the clock while a test is running; end timed tests when time runs out.
  useEffect(() => {
    if (typing.start === null || typing.end !== null) return;
    const start = typing.start;
    const id = setInterval(() => {
      const tNow = Date.now();
      setNow(tNow);
      const p = prefsRef.current;
      if (p.mode === "timed" && tNow - start >= p.seconds * 1000) {
        apply({ type: "finish", now: start + p.seconds * 1000 });
      }
    }, 100);
    return () => clearInterval(id);
  }, [typing.start, typing.end, apply]);

  // Highlight physical keys while they are held, and focus the input on any key press.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      setPressed((s) => (s.has(e.code) ? s : new Set(s).add(e.code)));
      const el = inputRef.current;
      if (el && document.activeElement !== el && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const target = e.target as HTMLElement;
        if (target.closest("button, select, a, input, textarea")) return;
        if (e.key.length === 1) el.focus();
      }
    };
    const up = (e: KeyboardEvent) =>
      setPressed((s) => {
        if (!s.has(e.code)) return s;
        const n = new Set(s);
        n.delete(e.code);
        return n;
      });
    const clear = () => setPressed(new Set());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);

  // Keep the caret's line in view (show the previous line for context).
  useEffect(() => {
    const box = boxRef.current;
    const caret = caretRef.current;
    if (!box || !caret) return;
    const lineHeight = parseFloat(getComputedStyle(box).lineHeight) || 60;
    box.scrollTo({ top: Math.max(0, caret.offsetTop - lineHeight), behavior: "smooth" });
  }, [typing.typed.length, typing.chars]);

  useEffect(() => {
    document.documentElement.lang = prefs.lang;
  }, [prefs.lang]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Tab") {
      e.preventDefault();
      restart(prefsRef.current, true);
      return;
    }
    if (e.key === "Escape") {
      e.preventDefault();
      restart();
      return;
    }
    if (typingRef.current.end !== null) {
      if (e.key === "Enter") {
        e.preventDefault();
        restart();
      }
      return;
    }
    if (e.key === "Backspace") {
      e.preventDefault();
      apply({ type: "backspace", word: e.ctrlKey || e.altKey });
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      return;
    }
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (prefsRef.current.builtIn) {
      const key = KEY_BY_CODE[e.code];
      if (key?.lao) {
        e.preventDefault();
        typeText(e.shiftKey ? key.laoShift : key.lao);
      }
    }
  };

  // Text from the OS keyboard (Lao layout installed, or mobile keyboards).
  const onInput = (e: React.FormEvent<HTMLInputElement>) => {
    const el = e.currentTarget;
    const value = el.value;
    el.value = "";
    if (value) typeText(value);
  };

  const clusters = useMemo(() => toClusters(typing.chars.join("")), [typing.chars]);
  const cursor = typing.typed.length;
  const finished = typing.end !== null;
  const stats = computeStats(typing, finished ? typing.end! : Math.max(now, typing.start ?? 0));
  const remaining = Math.max(0, prefs.seconds - stats.seconds);
  const progress =
    prefs.mode === "timed"
      ? Math.min(1, stats.seconds / prefs.seconds)
      : typing.chars.length
        ? cursor / typing.chars.length
        : 0;

  const expected = typing.chars[cursor];
  const hint = !finished && expected ? (HINT_BY_CHAR[expected] ?? null) : null;
  const hintKey = hint ? KEY_BY_CODE[hint.code] : null;
  const recent = history.slice(0, 8);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 sm:py-8">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-accent font-lao text-2xl leading-none text-accent-fg shadow-sm">
            ກ
          </div>
          <div>
            <h1 className="font-lao text-xl font-bold leading-tight">ພິມລາວ · Lao Typing</h1>
            <p className="font-lao text-sm text-muted">{t("tagline")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-line bg-surface p-0.5 text-sm">
            {(["lo", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => updatePrefs({ lang: l }, false)}
                className={`rounded-md px-3 py-1 font-lao transition-colors ${
                  prefs.lang === l ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"
                }`}
              >
                {l === "lo" ? "ລາວ" : "EN"}
              </button>
            ))}
          </div>
          <ThemeToggle />
        </div>
      </header>

      {/* Mode selection */}
      <section className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 sm:p-4">
        <div className="flex flex-wrap gap-1.5">
          {MODES.map((m) => (
            <button
              key={m}
              onClick={() => updatePrefs({ mode: m })}
              className={`rounded-lg px-4 py-2 font-lao text-sm font-medium transition-colors ${
                prefs.mode === m ? "bg-accent text-accent-fg" : "text-muted hover:bg-bg hover:text-fg"
              }`}
            >
              {t(m)}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-line pt-3">
          {prefs.mode === "lessons" &&
            LESSONS.map((l, i) => (
              <Chip key={l.id} active={prefs.lessonId === l.id} onClick={() => updatePrefs({ lessonId: l.id })}>
                <span className="mr-1 text-muted">{i + 1}.</span>
                {l.title[prefs.lang]}
                {best[`lessons:${l.id}`] ? <span className="ml-1.5 text-xs text-success">★</span> : null}
              </Chip>
            ))}
          {prefs.mode === "words" &&
            WORD_COUNTS.map((n) => (
              <Chip key={n} active={prefs.wordCount === n} onClick={() => updatePrefs({ wordCount: n })}>
                {n} {t("wordsUnit")}
              </Chip>
            ))}
          {prefs.mode === "sentences" &&
            SENTENCE_COUNTS.map((n) => (
              <Chip key={n} active={prefs.sentenceCount === n} onClick={() => updatePrefs({ sentenceCount: n })}>
                {n} {t("sentences")}
              </Chip>
            ))}
          {prefs.mode === "timed" &&
            SECONDS.map((n) => (
              <Chip key={n} active={prefs.seconds === n} onClick={() => updatePrefs({ seconds: n })}>
                {n} {t("seconds")}
              </Chip>
            ))}
        </div>
      </section>

      {/* Live stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("wpm")} value={Math.round(stats.wpm)} highlight />
        <Stat label={t("accuracy")} value={`${Math.round(stats.accuracy)}%`} />
        <Stat label={t("errors")} value={typing.errors} />
        <Stat
          label={t("time")}
          value={prefs.mode === "timed" ? `${Math.ceil(remaining)}s` : `${Math.floor(stats.seconds)}s`}
        />
      </section>

      {/* Typing area */}
      <section className="relative">
        <div className="mb-2 h-1 overflow-hidden rounded-full bg-line">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-150"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {finished ? (
          <ResultCard
            stats={stats}
            errors={typing.errors}
            isBest={finishInfo?.isBest ?? false}
            best={best[resultKey(prefs)]}
            t={t}
            onRestart={() => restart(prefs, true)}
            onNext={() => restart()}
          />
        ) : (
          <div
            onClick={() => inputRef.current?.focus()}
            className={`relative cursor-text rounded-2xl border bg-surface px-5 py-4 transition-colors sm:px-8 sm:py-6 ${
              focused ? "border-accent/60" : "border-line"
            }`}
          >
            <div
              ref={boxRef}
              className={`font-lao relative h-[calc(3*2.4em)] overflow-hidden text-[26px] leading-[2.4] break-words sm:text-[32px] ${
                focused ? "" : "blur-[3px] opacity-60"
              }`}
            >
              {clusters.map((c) => {
                const isCurrent = cursor >= c.start && cursor < c.end;
                const typedPart = typing.typed.slice(c.start, Math.min(cursor, c.end));
                const hasError = typedPart.some((ch, i) => ch !== typing.chars[c.start + i]);
                const done = cursor >= c.end;
                const isSpace = c.text === " ";
                let cls = "text-muted/70";
                if (hasError) cls = isSpace ? "bg-error/30 rounded" : "text-error bg-error/10 rounded";
                else if (done) cls = "text-fg";
                else if (isCurrent) cls = "text-accent";
                return (
                  <span key={c.start} className={`relative ${cls}`}>
                    {isCurrent ? (
                      <span
                        ref={caretRef}
                        className="caret absolute -left-px top-[22%] h-[56%] w-[2.5px] rounded-full bg-accent"
                      />
                    ) : null}
                    {c.text}
                  </span>
                );
              })}
            </div>

            {!focused && (
              <div className="absolute inset-0 grid place-items-center rounded-2xl">
                <span className="rounded-full border border-line bg-surface px-4 py-2 font-lao text-sm text-fg shadow-sm">
                  ⌨ {t("clickToFocus")}
                </span>
              </div>
            )}

            <input
              ref={inputRef}
              onKeyDown={onKeyDown}
              onInput={onInput}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoFocus
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Typing input"
              className="absolute inset-0 h-full w-full cursor-text opacity-0"
            />
          </div>
        )}

        {latinWarn && !finished && (
          <p className="mt-3 rounded-lg border border-warn/40 bg-warn/10 px-3 py-2 font-lao text-sm text-fg">
            ⚠ {t("latinWarning")}
          </p>
        )}
      </section>

      {/* Next key + settings */}
      <section className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <div className="flex min-h-9 items-center gap-2 font-lao text-muted">
          {hint && hintKey && expected ? (
            <>
              <span>{t("nextKey")}:</span>
              <kbd className="rounded-md border border-line bg-surface px-2 py-0.5 text-lg text-fg">
                {displayChar(expected)}
              </kbd>
              <span>=</span>
              <kbd className="rounded-md border border-line bg-surface px-2 py-0.5 font-sans text-fg">
                {hint.shift ? "Shift + " : ""}
                {hintKey.en}
              </kbd>
              <span className="hidden sm:inline">
                · {t("useFinger")} {FINGER_NAMES[hintKey.finger][prefs.lang]}
              </span>
            </>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Toggle
            checked={prefs.builtIn}
            onChange={(v) => updatePrefs({ builtIn: v }, false)}
            label={t("builtInLayout")}
            title={t("builtInHelp")}
          />
          <Toggle checked={prefs.keyboard} onChange={(v) => updatePrefs({ keyboard: v }, false)} label={t("keyboard")} />
          <button
            onClick={() => restart(prefs, true)}
            className="rounded-lg border border-line bg-surface px-3 py-1.5 font-lao text-fg transition-colors hover:border-accent hover:text-accent"
          >
            ↻ {t("restart")}
          </button>
        </div>
      </section>

      {prefs.keyboard && <Keyboard hint={hint} pressed={pressed} />}

      <p className="text-center font-lao text-xs text-muted">{t("shortcuts")}</p>

      {/* History */}
      <section className="rounded-2xl border border-line bg-surface p-4">
        <h2 className="mb-3 font-lao text-sm font-semibold">{t("history")}</h2>
        {recent.length === 0 ? (
          <p className="font-lao text-sm text-muted">{t("noHistory")}</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {recent.map((r) => (
              <li key={r.at} className="flex items-center justify-between gap-3 py-2">
                <span className="truncate font-lao">{r.label}</span>
                <span className="flex shrink-0 items-center gap-4 font-mono tabular-nums text-muted">
                  <span>
                    <b className="text-fg">{r.wpm}</b> {MESSAGES.en.wpm}
                  </span>
                  <span className="hidden sm:inline">{r.cpm} CPM</span>
                  <span>{r.accuracy}%</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="pb-2 text-center font-lao text-xs text-muted">{t("footer")}</footer>
    </div>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3 py-1 font-lao text-sm transition-colors ${
        active ? "border-accent bg-accent/10 text-accent" : "border-line text-muted hover:border-fg/30 hover:text-fg"
      }`}
    >
      {children}
    </button>
  );
}

function Stat({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="rounded-2xl border border-line bg-surface px-4 py-3">
      <div className="font-lao text-xs text-muted">{label}</div>
      <div className={`font-mono text-2xl font-semibold tabular-nums ${highlight ? "text-accent" : "text-fg"}`}>
        {value}
      </div>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  label,
  title,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  title?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 font-lao text-fg" title={title}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-accent" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
      {label}
    </label>
  );
}

function ResultCard({
  stats,
  errors,
  isBest,
  best,
  t,
  onRestart,
  onNext,
}: {
  stats: ReturnType<typeof computeStats>;
  errors: number;
  isBest: boolean;
  best?: number;
  t: (k: StringKey) => string;
  onRestart: () => void;
  onNext: () => void;
}) {
  return (
    <div className="rounded-2xl border border-accent/40 bg-surface px-5 py-8 text-center sm:px-8">
      <p className="font-lao text-lg font-semibold">{isBest ? `🏆 ${t("newBest")}` : `🎉 ${t("finished")}`}</p>
      <div className="mt-4 font-mono text-6xl font-bold tabular-nums text-accent">{Math.round(stats.wpm)}</div>
      <div className="font-lao text-sm text-muted">{t("wpm")}</div>
      <div className="mx-auto mt-6 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label={t("cpm")} value={Math.round(stats.cpm)} />
        <MiniStat label={t("accuracy")} value={`${Math.round(stats.accuracy)}%`} />
        <MiniStat label={t("errors")} value={errors} />
        <MiniStat label={t("time")} value={`${stats.seconds.toFixed(1)}s`} />
      </div>
      {best ? (
        <p className="mt-4 font-lao text-sm text-muted">
          {t("best")}: <b className="font-mono text-fg">{best}</b> {t("wpm")}
        </p>
      ) : null}
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={onRestart}
          className="rounded-lg border border-line px-4 py-2 font-lao text-sm transition-colors hover:border-accent hover:text-accent"
        >
          ↻ {t("restart")}
        </button>
        <button
          autoFocus
          onClick={onNext}
          className="rounded-lg bg-accent px-5 py-2 font-lao text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
        >
          {t("next")} →
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-bg px-3 py-2">
      <div className="font-lao text-xs text-muted">{label}</div>
      <div className="font-mono text-lg font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function ThemeToggle() {
  const toggle = () => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    save("theme", next);
  };
  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="grid size-9 place-items-center rounded-lg border border-line bg-surface text-muted transition-colors hover:text-fg"
    >
      <svg viewBox="0 0 24 24" className="size-4.5 fill-none stroke-current stroke-2" aria-hidden>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
      </svg>
    </button>
  );
}
