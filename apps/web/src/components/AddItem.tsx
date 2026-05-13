import { useState } from "react";

interface Props {
  onAdd: (text: string) => void | Promise<unknown>;
  disabled?: boolean;
  placeholder: string;
}

export function AddItem({ onAdd, disabled, placeholder }: Props) {
  const [text, setText] = useState("");
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || disabled) return;
    await onAdd(t);
    setText("");
  };
  return (
    <form onSubmit={submit} className="flex gap-2">
      <input
        className="min-w-0 flex-1 rounded-2xl border-2 border-emerald-900/15 bg-white/95 px-4 py-3 text-base text-emerald-950 shadow-inner outline-none ring-emerald-600 focus:ring-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        enterKeyHint="done"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="shrink-0 rounded-2xl bg-emerald-700 px-5 py-3 font-semibold text-white shadow-md disabled:opacity-40"
      >
        Add
      </button>
    </form>
  );
}
