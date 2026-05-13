import { useEffect } from "react";

export type UndoAction =
  | { kind: "delete"; message: string; onUndo: () => void }
  | { kind: "clear"; message: string; onUndo: () => void };

interface Props {
  action: UndoAction | null;
  lang: "en" | "zh";
  onDismiss: () => void;
  /** ms until auto-dismiss */
  durationMs?: number;
}

export function UndoToast({ action, lang, onDismiss, durationMs = 8000 }: Props) {
  useEffect(() => {
    if (!action) return;
    const t = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(t);
  }, [action, durationMs, onDismiss]);

  if (!action) return null;

  const undoLabel = lang === "zh" ? "撤销" : "Undo";

  return (
    <div
      className="pointer-events-auto fixed bottom-4 left-4 right-4 z-50 mx-auto flex max-w-lg items-center justify-between gap-3 rounded-2xl border border-emerald-900/20 bg-emerald-950 px-4 py-3 text-white shadow-lg sm:left-1/2 sm:right-auto sm:-translate-x-1/2"
      role="status"
      aria-live="polite"
    >
      <p className="min-w-0 flex-1 text-sm font-medium">{action.message}</p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          className="rounded-xl bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/25"
          onClick={() => {
            action.onUndo();
            onDismiss();
          }}
        >
          {undoLabel}
        </button>
        <button
          type="button"
          className="rounded-xl px-2 py-2 text-sm text-white/80 hover:bg-white/10"
          onClick={onDismiss}
          aria-label={lang === "zh" ? "关闭" : "Dismiss"}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
