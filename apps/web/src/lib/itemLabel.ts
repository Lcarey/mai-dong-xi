import type { ListItem } from "@maidongxi/shared";
import { pinyin } from "pinyin-pro";

function titleCaseLatin(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function hasCjk(s: string): boolean {
  return /[\u4e00-\u9fff]/.test(s);
}

/**
 * One line per item: "Broccoli 西兰花 (xī lán huā)" — English (title case), simplified Chinese, pinyin with tone marks.
 */
export function formatItemRichLine(item: ListItem): string {
  const en = item.textEn.trim();
  const zh = item.textZh.trim();

  if (!en && !zh) return "";

  const zhPart = hasCjk(zh) ? zh : hasCjk(en) ? en : "";
  const latinPart = !hasCjk(en) ? en : !hasCjk(zh) ? zh : "";

  if (zhPart) {
    const py = pinyin(zhPart, { toneType: "symbol" }).trim();
    const enFmt =
      latinPart && latinPart !== zhPart && !hasCjk(latinPart) ? titleCaseLatin(latinPart) : "";
    if (enFmt) {
      return `${enFmt} ${zhPart} (${py})`;
    }
    return `${zhPart} (${py})`;
  }

  return titleCaseLatin(latinPart || en || zh);
}
