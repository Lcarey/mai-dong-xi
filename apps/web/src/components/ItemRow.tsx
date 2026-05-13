import { useState, type TouchEvent } from "react";
import type { ListItem } from "@maidongxi/shared";
import { formatItemRichLine } from "../lib/itemLabel";

interface Props {
  item: ListItem;
  onToggle: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
  deleteLabel: string;
}

export function ItemRow({ item, onToggle, onDelete, deleteLabel }: Props) {
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const label = formatItemRichLine(item);

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
