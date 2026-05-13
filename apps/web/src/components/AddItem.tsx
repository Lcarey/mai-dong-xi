import { useCallback, useEffect, useRef, useState } from "react";

interface Props {
  onAdd: (text: string, quantity: number) => void | Promise<unknown>;
  disabled?: boolean;
  placeholder: string;
  addLabel: string;
  decLabel: string;
  incLabel: string;
  qtyLabel: string;
}

const MIN_QTY = 1;
const MAX_QTY = 999;

/**
 * Chrome on iOS often shows the payment autofill strip on plain text inputs.
 * We use a single-line `<textarea>` plus tiny honeypot fields (see below).
 *
 * We do **not** use readOnly-then-unlock: on iOS Safari/Chrome that races with
 * focus and the keyboard never appears on first tap.
 */
export function AddItem({
  onAdd,
  disabled,
  placeholder,
  addLabel,
  decLabel,
  incLabel,
  qtyLabel,
}: Props) {
  const [text, setText] = useState("");
  const [quantity, setQuantity] = useState(1);
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  const dec = useCallback(() => {
    setQuantity((q) => Math.max(MIN_QTY, q - 1));
  }, []);
  const inc = useCallback(() => {
    setQuantity((q) => Math.min(MAX_QTY, q + 1));
  }, []);

  const submitItem = useCallback(async () => {
    const t = text.trim();
    if (!t || disabled) return;
    try {
      await onAdd(t, quantity);
      setText("");
      setQuantity(1);
      requestAnimationFrame(() => {
        const el = fieldRef.current;
        if (el) {
          el.focus({ preventScroll: true });
          el.select();
        }
      });
    } catch {
      /* parent handles errors */
    }
  }, [disabled, onAdd, quantity, text]);

  useEffect(() => {
    if (disabled) return;
    const t = window.setTimeout(() => {
      fieldRef.current?.focus({ preventScroll: true });
    }, 50);
    return () => window.clearTimeout(t);
  }, [disabled]);

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
    <form autoComplete="off" onSubmit={handleSubmit} className="relative flex w-full flex-col gap-2" method="post">
      <div className="flex w-full gap-2">
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
          autoFocus={!disabled}
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
      </div>

      <div className="flex items-center justify-end gap-2" aria-label={qtyLabel}>
        <button
          type="button"
          onClick={dec}
          disabled={disabled || quantity <= MIN_QTY}
          aria-label={decLabel}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-emerald-900/15 bg-white/95 text-2xl font-semibold text-emerald-900 shadow-sm active:bg-emerald-100 disabled:opacity-40"
        >
          −
        </button>
        <div
          className="min-w-[3rem] text-center text-lg font-semibold tabular-nums text-emerald-950"
          aria-live="polite"
        >
          ×&nbsp;{quantity}
        </div>
        <button
          type="button"
          onClick={inc}
          disabled={disabled || quantity >= MAX_QTY}
          aria-label={incLabel}
          className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-emerald-900/15 bg-white/95 text-2xl font-semibold text-emerald-900 shadow-sm active:bg-emerald-100 disabled:opacity-40"
        >
          +
        </button>
      </div>
    </form>
  );
}
