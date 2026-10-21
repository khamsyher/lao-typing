"use client";

export default function PrintButton({ label }: { label: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="rounded-lg bg-accent px-5 py-2.5 font-lao text-sm font-medium text-accent-fg hover:opacity-90 print:hidden"
    >
      🖨 {label}
    </button>
  );
}
