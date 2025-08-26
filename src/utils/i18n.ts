import * as Localization from "expo-localization";

export const pick = (loc: {en: string; el: string}, locale?: string) => {
  const lang = (locale ?? Localization.getLocales()[0]?.languageCode ?? "en").toLowerCase();
  return lang.startsWith("el") ? (loc.el || loc.en) : (loc.en || loc.el);
};