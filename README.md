# ພິມລາວ · Lao Typing

Free online Lao typing practice built with Next.js and Tailwind CSS.

## Features
- **Lessons** for each row of the Lao (Kedmanee) keyboard, Shift keys and Lao digits
- **Words**, **Sentences** and **Timed** (15/30/60/120 s) modes
- Live WPM, CPM, accuracy, errors and a progress bar
- On-screen keyboard that highlights the next key, Shift and which finger to use
- **Built-in Lao layout**: type Lao without installing a Lao keyboard (maps physical keys)
- Personal bests and recent results saved in the browser
- Lao / English UI, light / dark theme
- Shortcuts: `Tab` restart same text, `Esc` new text, `Ctrl+Backspace` delete word

## Develop
```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Deploy
Push to GitHub and import the repo on [Vercel](https://vercel.com) — no configuration needed.

## Where things live
- `src/lib/layout.ts` – keyboard layout and finger map
- `src/lib/content.ts` – lessons, word and sentence lists
- `src/lib/typing.ts` – typing state, stats, grapheme clustering
- `src/components/TypingApp.tsx` – main UI
- `src/components/Keyboard.tsx` – on-screen keyboard
