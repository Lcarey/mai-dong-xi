import type { DisplayLanguage, ListItem } from "@maidongxi/shared";

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

export function displayText(item: ListItem, lang: DisplayLanguage): string {
  if (lang === "zh") {
    return item.textZh.trim() || item.textEn;
  }
  return item.textEn.trim() || item.textZh;
}

/** Other-language line for bilingual preview; null when redundant or empty. */
export function subtitleText(item: ListItem, lang: DisplayLanguage): string | null {
  const other: DisplayLanguage = lang === "en" ? "zh" : "en";
  const sub = displayText(item, other).trim();
  const main = displayText(item, lang).trim();
  if (!sub || sub === main) return null;
  return sub;
}

