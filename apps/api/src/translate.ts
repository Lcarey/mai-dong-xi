// =============================================================================
// AWS Translate wrapper — EN <-> zh (Simplified)
// =============================================================================

import { TranslateClient, TranslateTextCommand } from "@aws-sdk/client-translate";

const region = process.env.AWS_REGION || "us-east-1";
const local = process.env.DDB_LOCAL === "1";

const client = new TranslateClient({ region });

/** True if the string contains CJK ideographs (heuristic for Chinese input). */
export function looksLikeChinese(text: string): boolean {
  return /[\u4e00-\u9fff]/.test(text);
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
    // Offline dev: no paid Translate calls; mirror text so the app still works.
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
  try {
    if (looksLikeChinese(text)) {
      const textZh = text;
      const textEn = await translateText(text, "zh", "en");
      return { textEn: textEn || textZh, textZh };
    }
    const textEn = text;
    const textZh = await translateText(text, "en", "zh");
    return { textEn, textZh: textZh || textEn };
  } catch {
    return { textEn: text, textZh: text };
  }
}
