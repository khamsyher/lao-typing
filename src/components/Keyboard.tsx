"use client";

import { FULL_KEYBOARD, KEY_BY_CODE, KEYBOARD_UNITS, isCombining, type Finger, type KeyHint } from "@/lib/layout";

const FINGER_COLORS: Record<Finger, string> = {
  lp: "bg-finger-1",
  lr: "bg-finger-2",
  lm: "bg-finger-3",
  li: "bg-finger-4",
  ri: "bg-finger-5",
  rm: "bg-finger-6",
  rr: "bg-finger-7",
  rp: "bg-finger-8",
  thumb: "bg-finger-0",
};

const show = (ch: string) => {
  if ([...ch].some(isCombining) && !/[ກ-ຮ]/.test(ch)) return "◌" + ch;
  return ch;
};

// Grid columns are quarter key units so 1.25u / 1.75u / 2.25u keys line up exactly.
const SUB = 4;
// Grid row for a key row: the function row, a small gap, then the five main rows.
const gridRow = (y: number) => (y === 0 ? 1 : y + 2);

interface Props {
  hint: KeyHint | null;
  pressed: Set<string>;
}

export default function Keyboard({ hint, pressed }: Props) {
  // Shift is pressed with the hand opposite the target key.
  const hintKeyLeft = hint ? isLeftHand(hint.code) : false;
  const shiftCode = hint?.shift ? (hintKeyLeft ? "ShiftRight" : "ShiftLeft") : null;

  return (
    <div className="w-full overflow-x-auto pb-1" aria-hidden="true">
      <div
        className="mx-auto grid min-w-[920px] select-none"
        style={{
          gridTemplateColumns: `repeat(${KEYBOARD_UNITS * SUB}, minmax(0, 1fr))`,
          gridTemplateRows: "2.5rem 0.5rem repeat(5, 3.25rem)",
        }}
      >
        {FULL_KEYBOARD.map(({ key, x, y, w, h }) => {
          const isTarget = hint?.code === key.code || shiftCode === key.code;
          const isDown = pressed.has(key.code);
          const isHome = key.code === "KeyF" || key.code === "KeyJ";
          const typing = !!key.lao.trim();
          return (
            <div
              key={key.code}
              className="p-[3px]"
              style={{
                gridColumn: `${x * SUB + 1} / span ${w * SUB}`,
                gridRow: `${gridRow(y)} / span ${h}`,
              }}
            >
              <div
                className={[
                  "relative flex h-full min-w-0 flex-col justify-between rounded-lg border px-1.5 py-1 transition-all duration-100",
                  isTarget
                    ? "border-accent bg-accent text-accent-fg shadow-[0_0_0_3px_var(--accent-ring)] -translate-y-0.5"
                    : isDown
                      ? "border-line bg-key-down translate-y-px"
                      : typing || key.code === "Space"
                        ? "border-line bg-key"
                        : "border-line bg-key/60",
                ].join(" ")}
              >
                {!isTarget && key.finger && (
                  <span
                    className={`absolute inset-x-2 bottom-0.5 h-0.5 rounded-full opacity-70 ${FINGER_COLORS[key.finger]}`}
                  />
                )}
                {typing ? (
                  <>
                    <div className="flex items-start justify-between leading-none">
                      <span className={`text-[10px] ${isTarget ? "opacity-80" : "text-muted"}`}>{key.en}</span>
                      <span className={`font-lao text-[11px] ${isTarget ? "opacity-90" : "text-muted"}`}>
                        {show(key.laoShift)}
                      </span>
                    </div>
                    <span className="font-lao self-center text-lg leading-none">{show(key.lao)}</span>
                  </>
                ) : (
                  <span className="m-auto truncate text-[10px] font-medium text-muted">{key.en}</span>
                )}
                {isHome && !isTarget && (
                  <span className="absolute bottom-2 left-1/2 h-0.5 w-2 -translate-x-1/2 rounded bg-muted/60" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const LEFT = new Set<Finger>(["lp", "lr", "lm", "li"]);
const isLeftHand = (code: string) => {
  const finger = KEY_BY_CODE[code]?.finger;
  return finger ? LEFT.has(finger) : false;
};
