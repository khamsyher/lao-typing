"use client";

import { useSyncExternalStore } from "react";
import TypingApp from "./TypingApp";

const subscribe = () => () => {};

// The practice text is random and preferences live in localStorage, so the app renders
// on the client only; the server sends a lightweight placeholder.
export default function ClientApp({ signedIn }: { signedIn: boolean }) {
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  if (!mounted) {
    return (
      <div className="grid flex-1 place-items-center font-lao text-muted">
        <span className="animate-pulse">ກຳລັງໂຫຼດ… · Loading…</span>
      </div>
    );
  }
  return <TypingApp signedIn={signedIn} />;
}
