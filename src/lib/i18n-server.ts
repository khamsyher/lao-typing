import { cookies } from "next/headers";
import { LANG_COOKIE, parseLang, translate, type Lang, type StringKey } from "./i18n";

export async function getLang(): Promise<Lang> {
  return parseLang((await cookies()).get(LANG_COOKIE)?.value);
}

export async function getTranslator() {
  const lang = await getLang();
  return { lang, t: (key: StringKey) => translate(lang, key) };
}
