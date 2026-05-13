import { useCallback, useRef, useState } from "react";

interface Props {
  onAdd: (text: string) => void | Promise<unknown>;
  disabled?: boolean;
  placeholder: string;
  addLabel: string;
}

/**
 * Chrome on iOS often shows the payment / card autofill strip on plain `<input
 * type="text">` inside forms. Mitigations:
 * - Use a single-line `<textarea>` (different control class → fewer payment heuristics).
 * - Tiny honeypot fields before the real control (visually hidden, not display:none).
 * - Short readOnly-until-focus window so the first autofill pass does not see an editable “generic” text input.
 */
export function AddItem({ onAdd, disabled, placeholder, addLabel }: Props) {
  const [text, setText] = useState("");
  const [autofillLock, setAutofillLock] = useState(true);
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  const submitItem = useCallback(async () => {
    const t = text.trim();
    if (!t || disabled) return;
    try {
      await onAdd(t);
      setText("");
      setAutofillLock(true);
      requestAnimationFrame(() => {
        const el = fieldRef.current;
        if (el) {
          el.focus();
          el.select();
        }
      });
    } catch {
      /* parent handles errors */
    }
  }, [disabled, onAdd, text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitItem();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submitItem();
    }
  };

  return (
    <form autoComplete="off" onSubmit={handleSubmit} className="relative flex w-full gap-2" method="post">
      {/* Honeypots: in DOM order before the real field; visually hidden (not display:none). */}
      <div className="sr-only" aria-hidden="true">
        <input type="text" readOnly tabIndex={-1} autoComplete="organization" defaultValue="" name="mdx_hp_org" />
        <input type="text" readOnly tabIndex={-1} autoComplete="nickname" defaultValue="" name="mdx_hp_nick" />
        <input type="text" readOnly tabIndex={-1} autoComplete="off" defaultValue="" name="mdx_hp_off" />
      </div>

      <textarea
        ref={fieldRef}
        className="min-h-[3.25rem] min-w-0 flex-1 resize-none overflow-hidden rounded-2xl border-2 border-emerald-900/15 bg-white/95 px-4 py-3 text-base leading-normal text-emerald-950 shadow-inner outline-none ring-emerald-600 focus:ring-2"
        rows={1}
        wrap="soft"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setAutofillLock(false)}
        placeholder={placeholder}
        disabled={disabled}
        enterKeyHint="done"
        inputMode="text"
        name="maidongxi-shopping-line"
        id="maidongxi-shopping-line"
        autoComplete="off"
        autoCorrect="on"
        autoCapitalize="sentences"
        spellCheck={true}
        readOnly={autofillLock && !disabled}
        data-lpignore="true"
        data-bwignore="true"
        aria-autocomplete="none"
        aria-label={placeholder}
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="shrink-0 self-start rounded-2xl bg-emerald-700 px-5 py-3 font-semibold text-white shadow-md disabled:opacity-40"
      >
        {addLabel}
      </button>
    </form>
  );
}
