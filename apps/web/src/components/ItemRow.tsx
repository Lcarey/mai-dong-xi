import { useCallback, useRef, useState, type TouchEvent } from "react";
import type { ListItem } from "@maidongxi/shared";
import { formatItemRichLine } from "../lib/itemLabel";
import { QuantityStepper } from "./QuantityStepper";

const SWIPE_THRESHOLD_PX = 80;
const MAX_SWIPE_PX = 120;

interface Props {
  item: ListItem;
  onToggle: (id: string, checked: boolean) => void;
  onDelete: (id: string) => void;
  onQuantityChange: (id: string, quantity: number) => void;
  decLabel: string;
  incLabel: string;
  qtyLabel: string;
  quantityCollapsedHint: string;
  swipeAriaLabel: string;
}

const MIN_QTY = 1;
const MAX_QTY = 999;

export function ItemRow({
  item,
  onToggle,
  onDelete,
  onQuantityChange,
  decLabel,
  incLabel,
  qtyLabel,
  quantityCollapsedHint,
  swipeAriaLabel,
}: Props) {
  const label = formatItemRichLine(item);
  const qty = Math.max(MIN_QTY, Math.floor(item.quantity || 1));

  const [translateX, setTranslateX] = useState(0);
  const [sliding, setSliding] = useState(false);
  const touchStartXRef = useRef<number | null>(null);

  const resetPosition = useCallback(() => {
    setSliding(true);
    setTranslateX(0);
    window.setTimeout(() => setSliding(false), 200);
  }, []);

  const onTouchStart = (e: TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    setSliding(false);
  };

  const onTouchMove = (e: TouchEvent) => {
    if (touchStartXRef.current == null) return;
    const dx = e.touches[0].clientX - touchStartXRef.current;
    const clamped = Math.max(-MAX_SWIPE_PX, Math.min(MAX_SWIPE_PX, dx));
    setTranslateX(clamped);
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartXRef.current == null) return;
    const endX = e.changedTouches[0].clientX;
    const dx = endX - touchStartXRef.current;
    touchStartXRef.current = null;

    if (dx <= -SWIPE_THRESHOLD_PX) {
      onDelete(item.id);
      setTranslateX(0);
      return;
    }
    if (dx >= SWIPE_THRESHOLD_PX) {
      onToggle(item.id, item.checked ? false : true);
      resetPosition();
      return;
    }
    resetPosition();
  };

  const onTouchCancel = () => {
    touchStartXRef.current = null;
    resetPosition();
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
    <div className="relative overflow-hidden rounded-2xl border border-emerald-900/10 shadow-sm">
      {/* Revealed when swiping right (content moves →): mark bought / unmark */}
      <div
        className={`absolute inset-y-0 left-0 flex w-[min(28%,7rem)] items-center justify-center ${
          item.checked ? "bg-amber-500" : "bg-emerald-500"
        }`}
        aria-hidden
      >
        <span className="text-xl text-white">{item.checked ? "↩" : "✓"}</span>
      </div>
      {/* Revealed when swiping left (content moves ←): delete */}
      <div
        className="absolute inset-y-0 right-0 flex w-[min(28%,7rem)] items-center justify-center bg-rose-500"
        aria-hidden
      >
        <span className="text-2xl font-light leading-none text-white" aria-hidden>
          ×
        </span>
      </div>

      <div
        role="group"
        aria-label={swipeAriaLabel}
        className={`flex touch-pan-y items-stretch gap-2 bg-white/90 py-0 pl-2 pr-1 ${
          sliding ? "transition-transform duration-200 ease-out" : ""
        }`}
        style={{ transform: `translateX(${translateX}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchCancel}
      >
        <div className="flex min-w-0 flex-1 items-center py-3 pr-1">
          <span
            className={`min-w-0 flex-1 text-base leading-snug ${
              item.checked ? "text-emerald-800/50 line-through" : "text-emerald-950"
            }`}
          >
            {label}
          </span>
        </div>

        <QuantityStepper
          quantity={qty}
          checked={item.checked}
          onDecrease={dec}
          onIncrease={inc}
          decLabel={decLabel}
          incLabel={incLabel}
          collapsedAriaLabel={`${qtyLabel}: ${qty}. ${quantityCollapsedHint}`}
          quantityGroupAriaLabel={qtyLabel}
        />
      </div>
    </div>
  );
}
