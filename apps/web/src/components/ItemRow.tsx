import { useState, type TouchEvent } from "react";
import type { ListItem } from "@maidongxi/shared";
import { formatItemRichLine } from "../lib/itemLabel";

interface Props {
  item: ListItem;
  onToggle: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  deleteLabel: string;
  decLabel: string;
  incLabel: string;
}

const MIN_QTY = 1;
const MAX_QTY = 999;

export function ItemRow({
  item,
  onToggle,
  onDelete,
  onQuantityChange,
  deleteLabel,
  decLabel,
  incLabel,
}: Props) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const label = formatItemRichLine(item);
  const qty = Math.max(MIN_QTY, Math.floor(item.quantity || 1));

  const onTouchStart = (e: TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX == null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    setTouchStartX(null);
    if (dx < -80) {
      onDelete(item.id);
    }
  };

  const dec = () => {
    if (qty <= MIN_QTY) return;
    onQuantityChange(item.id, qty - 1);
  };
  const inc = () => {
    if (qty >= MAX_QTY) return;
    onQuantityChange(item.id, qty + 1);
  };

  return (
    <div
      className="flex items-stretch gap-2 rounded-2xl border border-emerald-900/10 bg-white/90 shadow-sm"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 px-3 py-3 text-left"
        onClick={() => onToggle(item.id, !item.checked)}
      >
        <span
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 ${
            item.checked ? "border-emerald-600 bg-emerald-600 text-white" : "border-emerald-800/30 bg-white"
          }`}
          aria-hidden
        >
          {item.checked ? "✓" : ""}
        </span>
        <span
          className={`min-w-0 flex-1 text-base leading-snug ${item.checked ? "text-emerald-800/50 line-through" : "text-emerald-950"}`}
        >
          {label}
        </span>
      </button>

      <div className="flex shrink-0 items-center gap-1 pr-1">
        <button
          type="button"
          onClick={dec}
          disabled={qty <= MIN_QTY}
          aria-label={decLabel}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-900/15 bg-white text-xl font-semibold text-emerald-900 active:bg-emerald-100 disabled:opacity-30"
        >
          −
        </button>
        <span
          className={`min-w-[2.25rem] text-center text-base font-semibold tabular-nums ${
            item.checked ? "text-emerald-800/50" : "text-emerald-950"
          }`}
          aria-label={`${qty}`}
        >
          ×&nbsp;{qty}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={qty >= MAX_QTY}
          aria-label={incLabel}
          className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-emerald-900/15 bg-white text-xl font-semibold text-emerald-900 active:bg-emerald-100 disabled:opacity-30"
        >
          +
        </button>
      </div>

      <button
        type="button"
        className="shrink-0 px-3 text-sm font-medium text-rose-600 hover:bg-rose-50"
        onClick={() => onDelete(item.id)}
      >
        {deleteLabel}
      </button>
    </div>
  );
}
