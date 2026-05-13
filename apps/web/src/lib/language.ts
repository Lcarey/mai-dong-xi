import type { DisplayLanguage } from "@maidongxi/shared";

const LANG_KEY = "maidongxi-display-lang";

export function getStoredLanguage(): DisplayLanguage {
  try {
    const v = localStorage.getItem(LANG_KEY);
    if (v === "zh" || v === "en") return v;
  } catch {
    /* ignore */
  }
  return "en";
}

export function setStoredLanguage(lang: DisplayLanguage): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}
