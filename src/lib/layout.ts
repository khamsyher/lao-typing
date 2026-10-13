// Lao Kedmanee keyboard layout (standard Lao keyboard on Windows / macOS / Linux).

export type Finger =
  | "lp" | "lr" | "lm" | "li"
  | "ri" | "rm" | "rr" | "rp"
  | "thumb";

export interface KeyDef {
  code: string; // KeyboardEvent.code
  en: string; // label on a US keyboard
  lao: string; // output without shift
  laoShift: string; // output with shift
  finger: Finger;
  width?: number; // relative width (1 = normal key)
}

const k = (
  code: string,
  en: string,
  lao: string,
  laoShift: string,
  finger: Finger,
  width?: number,
): KeyDef => ({ code, en, lao, laoShift, finger, width });

export const KEY_ROWS: KeyDef[][] = [
  [
    k("Backquote", "`", "`", "~", "lp"),
    k("Digit1", "1", "ຢ", "໑", "lp"),
    k("Digit2", "2", "ຟ", "໒", "lr"),
    k("Digit3", "3", "ໂ", "໓", "lm"),
    k("Digit4", "4", "ຖ", "໔", "li"),
    k("Digit5", "5", "ຸ", "໌", "li"),
    k("Digit6", "6", "ູ", "ຼ", "ri"),
    k("Digit7", "7", "ຄ", "໕", "ri"),
    k("Digit8", "8", "ຕ", "໖", "rm"),
    k("Digit9", "9", "ຈ", "໗", "rr"),
    k("Digit0", "0", "ຂ", "໘", "rp"),
    k("Minus", "-", "ຊ", "໙", "rp"),
    k("Equal", "=", "ໍ", "ໍ່", "rp"),
    k("Backspace", "⌫", "", "", "rp", 2),
  ],
  [
    k("Tab", "Tab", "", "", "lp", 1.5),
    k("KeyQ", "Q", "ົ", "ົ້", "lp"),
    k("KeyW", "W", "ໄ", "໐", "lr"),
    k("KeyE", "E", "ຳ", "ຳ້", "lm"),
    k("KeyR", "R", "ພ", "_", "li"),
    k("KeyT", "T", "ະ", "+", "li"),
    k("KeyY", "Y", "ິ", "ິ້", "ri"),
    k("KeyU", "U", "ີ", "ີ້", "ri"),
    k("KeyI", "I", "ຮ", "ຣ", "rm"),
    k("KeyO", "O", "ນ", "ໜ", "rr"),
    k("KeyP", "P", "ຍ", "ຽ", "rp"),
    k("BracketLeft", "[", "ບ", "-", "rp"),
    k("BracketRight", "]", "ລ", "ຫຼ", "rp"),
    k("Backslash", "\\", "\"", "/", "rp", 1.5),
  ],
  [
    k("CapsLock", "Caps", "", "", "lp", 1.75),
    k("KeyA", "A", "ັ", "ັ້", "lp"),
    k("KeyS", "S", "ຫ", ";", "lr"),
    k("KeyD", "D", "ກ", ".", "lm"),
    k("KeyF", "F", "ດ", ",", "li"),
    k("KeyG", "G", "ເ", ":", "li"),
    k("KeyH", "H", "້", "໊", "ri"),
    k("KeyJ", "J", "່", "໋", "ri"),
    k("KeyK", "K", "າ", "!", "rm"),
    k("KeyL", "L", "ສ", "?", "rr"),
    k("Semicolon", ";", "ວ", "%", "rp"),
    k("Quote", "'", "ງ", "=", "rp"),
    k("Enter", "Enter", "", "", "rp", 2.25),
  ],
  [
    k("ShiftLeft", "Shift", "", "", "lp", 2.25),
    k("KeyZ", "Z", "ຜ", "₭", "lp"),
    k("KeyX", "X", "ປ", "(", "lr"),
    k("KeyC", "C", "ແ", "ຯ", "lm"),
    k("KeyV", "V", "ອ", "x", "li"),
    k("KeyB", "B", "ຶ", "ຶ້", "li"),
    k("KeyN", "N", "ື", "ື້", "ri"),
    k("KeyM", "M", "ທ", "ໆ", "ri"),
    k("Comma", ",", "ມ", "ໝ", "rm"),
    k("Period", ".", "ໃ", "$", "rr"),
    k("Slash", "/", "ຝ", ")", "rp"),
    k("ShiftRight", "Shift", "", "", "rp", 2.75),
  ],
  [k("Space", "Space", " ", " ", "thumb", 6.25)],
];

const ALL_KEYS = KEY_ROWS.flat();

export const KEY_BY_CODE: Record<string, KeyDef> = Object.fromEntries(
  ALL_KEYS.map((key) => [key.code, key]),
);

export interface KeyHint {
  code: string;
  shift: boolean;
}

// Reverse lookup: which key (and whether Shift is needed) types a single character.
// Unshifted keys win over shifted ones when a character appears on both.
export const HINT_BY_CHAR: Record<string, KeyHint> = (() => {
  const map: Record<string, KeyHint> = {};
  for (const key of ALL_KEYS) {
    if ([...key.laoShift].length === 1 && !map[key.laoShift]) {
      map[key.laoShift] = { code: key.code, shift: true };
    }
  }
  for (const key of ALL_KEYS) {
    if ([...key.lao].length === 1) map[key.lao] = { code: key.code, shift: false };
  }
  return map;
})();

// Characters that combine with the previous consonant (vowel signs above/below and tone marks).
// Rendered on a dotted circle when shown on their own.
export const isCombining = (ch: string) => /[ັິ-ຼ່-ໍ]/.test(ch);

export const FINGER_NAMES: Record<Finger, { en: string; lo: string }> = {
  lp: { en: "Left pinky", lo: "ນິ້ວກ້ອຍຊ້າຍ" },
  lr: { en: "Left ring", lo: "ນິ້ວນາງຊ້າຍ" },
  lm: { en: "Left middle", lo: "ນິ້ວກາງຊ້າຍ" },
  li: { en: "Left index", lo: "ນິ້ວຊີ້ຊ້າຍ" },
  ri: { en: "Right index", lo: "ນິ້ວຊີ້ຂວາ" },
  rm: { en: "Right middle", lo: "ນິ້ວກາງຂວາ" },
  rr: { en: "Right ring", lo: "ນິ້ວນາງຂວາ" },
  rp: { en: "Right pinky", lo: "ນິ້ວກ້ອຍຂວາ" },
  thumb: { en: "Thumb", lo: "ນິ້ວໂປ້" },
};
