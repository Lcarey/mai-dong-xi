import { useCallback, useEffect, useRef, useState } from "react";

const MIN_QTY = 1;
const MAX_QTY = 999;
const INACTIVITY_MS = 3000;

export interface QuantityStepperProps {
  quantity: number;
  checked: boolean;
  onDecrease: () => void;
  onIncrease: () => void;
  decLabel: string;
  incLabel: string;
  /** Full aria-label for the collapsed badge (e.g. "Quantity: 2. Tap to adjust") */
  collapsedAriaLabel: string;
  /** Short label for the expanded control group (e.g. "Quantity" / "数量") */
  quantityGroupAriaLabel: string;
}

export function QuantityStepper({
  quantity: qty,
  checked,
  onDecrease,
  onIncrease,
  decLabel,
  incLabel,
  collapsedAriaLabel,
  quantityGroupAriaLabel,
}: QuantityStepperProps) {
  const [expanded, setExpanded] = useState(false);
  const [pop, setPop] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inactivityRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearInactivity = useCallback(() => {
    if (inactivityRef.current != null) {
      clearTimeout(inactivityRef.current);
      inactivityRef.current = null;
    }
  }, []);

  const scheduleCollapse = useCallback(() => {
    clearInactivity();
    inactivityRef.current = setTimeout(() => {
      setExpanded(false);
      inactivityRef.current = null;
    }, INACTIVITY_MS);
  }, [clearInactivity]);

  useEffect(() => {
    return () => clearInactivity();
  }, [clearInactivity]);

  useEffect(() => {
    if (!expanded) return;

    const onPointerDown = (e: PointerEvent) => {
      const el = rootRef.current;
      if (!el || el.contains(e.target as Node)) return;
      setExpanded(false);
      clearInactivity();
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [expanded, clearInactivity]);

  useEffect(() => {
    if (!expanded) return;
    scheduleCollapse();
    return () => {
      clearInactivity();
    };
  }, [expanded, scheduleCollapse, clearInactivity]);

  const open = () => {
    setExpanded(true);
    setPop(true);
    window.setTimeout(() => setPop(false), 280);
    clearInactivity();
  };

  const dec = () => {
    if (qty <= MIN_QTY) return;
    onDecrease();
    scheduleCollapse();
  };

  const inc = () => {
    if (qty >= MAX_QTY) return;
    onIncrease();
    scheduleCollapse();
  };

  const qtyMuted = checked ? "text-emerald-800/50" : "text-emerald-950";

  return (
    <div
      ref={rootRef}
      className={`relative flex h-11 shrink-0 items-center self-center overflow-hidden rounded-full border-2 border-emerald-900/15 bg-white transition-[width] duration-200 ease-out motion-reduce:transition-none ${
        expanded ? "w-[9.25rem]" : "w-11"
      }`}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchEnd={(e) => e.stopPropagation()}
    >
      <div
        className={`flex h-full w-full items-stretch justify-center ${
          pop ? "motion-safe:origin-center motion-safe:scale-[1.04] motion-reduce:scale-100" : "scale-100"
        } motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out motion-reduce:transition-none`}
      >
      {!expanded ? (
        <button
          type="button"
          onClick={open}
          aria-label={collapsedAriaLabel}
          aria-expanded={false}
          className={`flex h-full min-h-[44px] w-full min-w-[44px] items-center justify-center text-base font-semibold tabular-nums outline-none ring-emerald-600/40 focus-visible:ring-2 ${qtyMuted}`}
        >
          {qty}
        </button>
      ) : (
        <div
          className="flex h-full w-full items-center justify-between px-0.5"
          role="group"
          aria-label={quantityGroupAriaLabel}
        >
          <button
            type="button"
            onClick={dec}
            disabled={qty <= MIN_QTY}
            aria-label={decLabel}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-semibold text-emerald-900 active:bg-emerald-100 disabled:opacity-30"
          >
            −
          </button>
          <span
            className={`min-w-[1.5rem] px-0.5 text-center text-base font-semibold tabular-nums ${qtyMuted}`}
            aria-live="polite"
          >
            {qty}
          </span>
          <button
            type="button"
            onClick={inc}
            disabled={qty >= MAX_QTY}
            aria-label={incLabel}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xl font-semibold text-emerald-900 active:bg-emerald-100 disabled:opacity-30"
          >
            +
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
