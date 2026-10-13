export interface TypingState {
  chars: string[]; // target text, one entry per code point
  typed: string[];
  start: number | null;
  end: number | null;
  keystrokes: number;
  errors: number;
}

export type TypingAction =
  | { type: "reset"; text: string }
  | { type: "input"; text: string; now: number; stopAtEnd: boolean }
  | { type: "backspace"; word: boolean }
  | { type: "finish"; now: number };

export const initTyping = (text: string): TypingState => ({
  chars: Array.from(text),
  typed: [],
  start: null,
  end: null,
  keystrokes: 0,
  errors: 0,
});

export function typingReducer(state: TypingState, action: TypingAction): TypingState {
  switch (action.type) {
    case "reset":
      return initTyping(action.text);

    case "input": {
      if (state.end !== null || !state.chars.length) return state;
      const typed = [...state.typed];
      let { keystrokes, errors } = state;
      for (const ch of action.text) {
        if (typed.length >= state.chars.length) break;
        keystrokes++;
        if (ch !== state.chars[typed.length]) errors++;
        typed.push(ch);
      }
      const start = state.start ?? action.now;
      const done = action.stopAtEnd && typed.length >= state.chars.length;
      return { ...state, typed, keystrokes, errors, start, end: done ? action.now : null };
    }

    case "backspace": {
      if (state.end !== null || !state.typed.length) return state;
      let cut = state.typed.length - 1;
      if (action.word) {
        // Delete back to the previous space, like Ctrl+Backspace in a text editor.
        while (cut > 0 && state.typed[cut - 1] !== " ") cut--;
      }
      return { ...state, typed: state.typed.slice(0, cut) };
    }

    case "finish":
      if (state.end !== null) return state;
      return { ...state, end: action.now, start: state.start ?? action.now };
  }
}

export interface Stats {
  seconds: number;
  wpm: number;
  cpm: number;
  accuracy: number;
  correct: number;
}

export function computeStats(state: TypingState, now: number): Stats {
  const correct = state.typed.reduce((n, ch, i) => n + (ch === state.chars[i] ? 1 : 0), 0);
  const ms = state.start === null ? 0 : (state.end ?? now) - state.start;
  const minutes = ms / 60000;
  const cpm = minutes > 0.02 ? correct / minutes : 0;
  const accuracy = state.keystrokes
    ? Math.max(0, (state.keystrokes - state.errors) / state.keystrokes) * 100
    : 100;
  return { seconds: ms / 1000, wpm: cpm / 5, cpm, accuracy, correct };
}

// Split text into grapheme clusters (a consonant plus its vowel/tone marks) so marks
// stay attached to their base when rendered as separate spans.
export interface Cluster {
  text: string;
  start: number; // code point index
  end: number; // exclusive
}

export function toClusters(text: string): Cluster[] {
  const out: Cluster[] = [];
  let pos = 0;
  const segments =
    typeof Intl !== "undefined" && "Segmenter" in Intl
      ? Array.from(new Intl.Segmenter("lo", { granularity: "grapheme" }).segment(text), (s) => s.segment)
      : Array.from(text);
  for (const seg of segments) {
    const len = Array.from(seg).length;
    out.push({ text: seg, start: pos, end: pos + len });
    pos += len;
  }
  return out;
}
