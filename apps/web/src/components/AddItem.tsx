import { useRef, useState } from "react";

interface Props {
  onAdd: (text: string) => void | Promise<unknown>;
  disabled?: boolean;
  placeholder: string;
  addLabel: string;
}

/**
 * Chrome (especially on Android) may offer payment/credit-card autofill on plain
 * text fields. A brief readOnly-until-focus cycle plus explicit non-payment
 * autocomplete hints reduces that without hurting normal typing.
 */
export function AddItem({ onAdd, disabled, placeholder, addLabel }: Props) {
  const [text, setText] = useState("");
  const [autofillLock, setAutofillLock] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || disabled) return;
    try {
      await onAdd(t);
      setText("");
      setAutofillLock(true);
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
    <form
      autoComplete="off"
      onSubmit={submit}
      className="flex gap-2"
      method="post"
    >
      <input
        ref={inputRef}
        className="min-w-0 flex-1 rounded-2xl border-2 border-emerald-900/15 bg-white/95 px-4 py-3 text-base text-emerald-950 shadow-inner outline-none ring-emerald-600 focus:ring-2"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onFocus={() => setAutofillLock(false)}
        placeholder={placeholder}
        disabled={disabled}
        enterKeyHint="done"
        inputMode="text"
        type="text"
        name="maidongxi-shopping-line"
        id="maidongxi-shopping-line"
        autoComplete="off"
        autoCorrect="on"
        spellCheck={true}
        readOnly={autofillLock && !disabled}
        data-1p-ignore
        data-lpignore="true"
        data-bwignore
        aria-autocomplete="none"
        aria-label={placeholder}
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
