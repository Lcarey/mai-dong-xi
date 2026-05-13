import type { DisplayLanguage } from "@maidongxi/shared";
import { setStoredLanguage } from "../lib/language";

interface Props {
  value: DisplayLanguage;
  onChange: (lang: DisplayLanguage) => void;
}

export function LanguageToggle({ value, onChange }: Props) {
  const toggle = () => {
    const next: DisplayLanguage = value === "en" ? "zh" : "en";
    setStoredLanguage(next);
    onChange(next);
  };
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full border-2 border-emerald-800/20 bg-white/90 px-4 py-2 text-sm font-semibold text-emerald-900 shadow-sm active:scale-[0.98]"
      aria-label="Toggle display language"
    >
      {value === "en" ? "English" : "简体中文"}
    </button>
  );
}
