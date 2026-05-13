// =============================================================================
// AWS Translate wrapper — EN <-> zh (Simplified)
// =============================================================================
//
// If Amazon Translate is unavailable or returns non-Chinese for en→zh, we fall
// back to MyMemory’s public API (server-side fetch from Lambda) so the UI
// always gets real 简体 for Latin grocery-style input when possible.

import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";
import { glossaryMatchChinese, glossaryMatchEnglish } from "./food-glossary.js";

const region = process.env.AWS_REGION || "us-east-1";
const local = process.env.DDB_LOCAL === "1";

const client = new TranslateClient({ region });

/** True if the string contains CJK ideographs (heuristic for Chinese input). */
export function looksLikeChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
}

/** MyMemory returns this when quota is exceeded — treat as failure. */
function isMyMemoryGarbage(s: string): boolean {
  return /MYMEMORY\s+WARNING/i.test(s) || /QUERY LENGTH LIMIT EXCEEDED/i.test(s);
}

/**
 * Best-effort en→zh (Simplified) via MyMemory when AWS Translate is down or wrong.
 * Only used from Lambda (no browser CORS issues).
 */
async function translateEnToZhPublicFallback(latin: string): Promise<string | null> {
  const q = latin.trim().slice(0, 500);
  if (!q) return null;
  try {
    const u = new URL("https://api.mymemory.translated.net/get");
    u.searchParams.set("q", q);
    u.searchParams.set("langpair", "en|zh-CN");
    const res = await fetch(u, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { responseData?: { translatedText?: string } };
    const t = data.responseData?.translatedText?.trim();
    if (!t || t === q || isMyMemoryGarbage(t)) return null;
    return looksLikeChinese(t) ? t : null;
  } catch {
    return null;
  }
}

async function translateZhToEnPublicFallback(zh: string): Promise<string | null> {
  const q = zh.trim().slice(0, 500);
  if (!q) return null;
  try {
    const u = new URL("https://api.mymemory.translated.net/get");
    u.searchParams.set("q", q);
    u.searchParams.set("langpair", "zh-CN|en");
    const res = await fetch(u, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) return null;
    const data = (await res.json()) as { responseData?: { translatedText?: string } };
    const t = data.responseData?.translatedText?.trim();
    if (!t || t === q || isMyMemoryGarbage(t)) return null;
    return looksLikeChinese(t) ? null : t;
  } catch {
    return null;
  }
}

export async function translateText(
  text: string,
  source: "en" | "zh",
  target: "en" | "zh",
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (source === target) return trimmed;
  if (local) {
    // Offline dev: no AWS — use public fallback so en↔zh still produces real bilingual strings.
    if (source === "en" && target === "zh") {
      return (await translateEnToZhPublicFallback(trimmed)) || trimmed;
    }
    if (source === "zh" && target === "en") {
      return (await translateZhToEnPublicFallback(trimmed)) || trimmed;
    }
    return trimmed;
  }
  const out = await client.send(
    new TranslateTextCommand({
      Text: trimmed,
      SourceLanguageCode: source,
      TargetLanguageCode: target,
    }),
  );
  return (out.TranslatedText ?? trimmed).trim();
}

/** Produce both English and Simplified Chinese strings from user input. */
export async function bilingualFromInput(raw: string): Promise<{ textEn: string; textZh: string }> {
  const text = raw.trim();
  if (!text) {
    return { textEn: "", textZh: "" };
  }
  if (looksLikeChinese(text)) {
    const g = glossaryMatchChinese(text);
    if (g) return { textEn: g.en, textZh: g.zh };
  } else {
    const g = glossaryMatchEnglish(text);
    if (g) return { textEn: g.en, textZh: g.zh };
  }
  try {
    if (looksLikeChinese(text)) {
      const textZh = text;
      let textEn = await translateText(text, "zh", "en");
      if (!textEn.trim() || looksLikeChinese(textEn)) {
        const fb = await translateZhToEnPublicFallback(textZh);
        if (fb) textEn = fb;
      }
      return { textEn: (textEn || textZh).trim(), textZh };
    }
    const textEn = text;
    let textZh = await translateText(text, "en", "zh");
    if (!looksLikeChinese(textZh)) {
      const fb = await translateEnToZhPublicFallback(textEn);
      if (fb) textZh = fb;
    }
    return { textEn, textZh: (textZh || textEn).trim() };
  } catch {
    if (looksLikeChinese(text)) {
      const fb = await translateZhToEnPublicFallback(text);
      return { textEn: (fb || text).trim(), textZh: text };
    }
    const fb = await translateEnToZhPublicFallback(text);
    return { textEn: text, textZh: (fb || text).trim() };
  }
}
