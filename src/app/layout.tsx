import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Noto_Sans_Lao } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoLao = Noto_Sans_Lao({
  variable: "--font-noto-lao",
  subsets: ["lao", "latin"],
});

export const metadata: Metadata = {
  title: "ພິມລາວ · Lao Typing — ຝຶກພິມພາສາລາວອອນລາຍ",
  description:
    "Free online Lao typing practice: lessons for every row of the Lao keyboard, words, sentences and timed tests with WPM and accuracy. ຝຶກພິມພາສາລາວຟຣີ.",
  keywords: ["Lao typing", "ພິມລາວ", "Lao keyboard", "typing practice", "ຝຶກພິມ"],
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#14161c" },
  ],
};

// Apply the saved (or system) theme before first paint to avoid a flash.
const themeScript = `try{var t=JSON.parse(localStorage.getItem("lao-typing:theme"));if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="lo"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoLao.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
