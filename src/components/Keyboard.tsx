"use client";

import { KEY_BY_CODE, KEY_ROWS, isCombining, type Finger, type KeyHint } from "@/lib/layout";

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
      <div className="mx-auto flex min-w-[640px] max-w-3xl flex-col gap-1.5 select-none">
        {KEY_ROWS.map((row, r) => (
          <div key={r} className={`flex gap-1.5 ${r === 4 ? "justify-center" : ""}`}>
            {row.map((key) => {
              const isTarget = hint?.code === key.code || shiftCode === key.code;
              const isDown = pressed.has(key.code);
              const isHome = key.code === "KeyF" || key.code === "KeyJ";
              const special = !key.lao.trim() && key.code !== "Space";
              return (
                <div
                  key={key.code}
                  style={{ flexGrow: key.width ?? 1, flexBasis: 0 }}
                  className={[
                    "relative flex h-12 min-w-0 flex-col justify-between rounded-lg border px-1.5 py-1 text-left transition-all duration-100",
                    isTarget
                      ? "border-accent bg-accent text-accent-fg shadow-[0_0_0_3px_var(--accent-ring)] -translate-y-0.5"
                      : isDown
                        ? "border-line bg-key-down translate-y-px"
                        : "border-line bg-key",
                  ].join(" ")}
                >
                  {!isTarget && !special && (
                    <span className={`absolute inset-x-2 bottom-0.5 h-0.5 rounded-full opacity-70 ${FINGER_COLORS[key.finger]}`} />
                  )}
                  {special ? (
                    <span className="m-auto text-[11px] font-medium text-muted">{key.en}</span>
                  ) : key.code === "Space" ? (
                    <span className="m-auto text-[11px] text-muted">Space</span>
                  ) : (
                    <>
                      <div className="flex items-start justify-between leading-none">
                        <span className={`text-[10px] ${isTarget ? "opacity-80" : "text-muted"}`}>{key.en}</span>
                        <span className={`font-lao text-[11px] ${isTarget ? "opacity-90" : "text-muted"}`}>
                          {show(key.laoShift)}
                        </span>
                      </div>
                      <span className="font-lao self-center text-lg leading-none">
                        {show(key.lao)}
                      </span>
                    </>
                  )}
                  {isHome && !isTarget && (
                    <span className="absolute bottom-2 left-1/2 h-0.5 w-2 -translate-x-1/2 rounded bg-muted/60" />
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

const LEFT = new Set<Finger>(["lp", "lr", "lm", "li"]);
const isLeftHand = (code: string) => LEFT.has(KEY_BY_CODE[code]?.finger);
