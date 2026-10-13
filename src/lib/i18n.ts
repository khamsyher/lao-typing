import en from "@/locales/en.json";
import lo from "@/locales/lo.json";

export type Lang = "lo" | "en";

// en.json is the reference: every other locale must provide the same keys.
export type StringKey = keyof typeof en;
type Messages = Record<StringKey, string>;

export const MESSAGES: Record<Lang, Messages> = { en, lo: lo satisfies Messages };

export const translate = (lang: Lang, key: StringKey) => MESSAGES[lang][key];

// The chosen language is kept in a cookie so server-rendered pages use it too.
export const LANG_COOKIE = "lang";
export const parseLang = (value: string | undefined): Lang => (value === "en" ? "en" : "lo");
