import { useRef, useState } from "react";

interface Props {
  onAdd: (text: string) => void | Promise<unknown>;
  disabled?: boolean;
  placeholder: string;
  addLabel: string;
}

export function AddItem({ onAdd, disabled, placeholder, addLabel }: Props) {
  const [text, setText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || disabled) return;
    try {
      await onAdd(t);
      setText("");
      requestAnimationFrame(() => {
        const el = inputRef.current;
        if (el) {
          el.focus();
          el.select();
        }
      });
    } catch {
      /* parent handles errors */
    }
  };

  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        ref={inputRef}
        className="min-w-0 flex-1 rounded-2xl border-2 border-emerald-900/15 bg-white/95 px-4 py-3 text-base text-emerald-950 shadow-inner outline-none ring-emerald-600 focus:ring-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        enterKeyHint="done"
        autoComplete="off"
        spellCheck={true}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="shrink-0 rounded-2xl bg-emerald-700 px-5 py-3 font-semibold text-white shadow-md disabled:opacity-40"
      >
        {addLabel}
      </button>
    </form>
  );
}
