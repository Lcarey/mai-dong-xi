import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import type { DisplayLanguage } from "@maidongxi/shared";
import { createItem, deleteCheckedItems, deleteItem, getItems, patchItem } from "../api";
import { AddItem } from "../components/AddItem";
import { DeployStamp } from "../components/DeployStamp";
import { ItemRow } from "../components/ItemRow";
import { LanguageToggle } from "../components/LanguageToggle";
import { getStoredLanguage } from "../lib/language";

export function ShoppingList() {
  const qc = useQueryClient();
  const [lang, setLang] = useState<DisplayLanguage>(() => getStoredLanguage());
  const [pullOffset, setPullOffset] = useState(0);
  const pullStartY = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const itemsQuery = useQuery({
    queryKey: ["items"],
    queryFn: getItems,
  });

  const addMutation = useMutation({
    mutationFn: (text: string) => createItem(text),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) => patchItem(id, { checked }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });

  const clearDoneMutation = useMutation({
    mutationFn: () => deleteCheckedItems(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["items"] }),
  });

  const refetch = useCallback(() => itemsQuery.refetch(), [itemsQuery]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [refetch]);

  const onTouchStart = (e: TouchEvent) => {
    const el = scrollRef.current;
    if (!el || el.scrollTop > 0) return;
    pullStartY.current = e.touches[0].clientY;
  };

  const onTouchMove = (e: TouchEvent) => {
    if (pullStartY.current == null) return;
    const el = scrollRef.current;
    if (!el || el.scrollTop > 0) return;
    const dy = e.touches[0].clientY - pullStartY.current;
    if (dy > 0) {
      setPullOffset(Math.min(dy * 0.5, 72));
    }
  };

  const onTouchEnd = async () => {
    if (pullOffset > 40) {
      await refetch();
    }
    pullStartY.current = null;
    setPullOffset(0);
  };

  const items = itemsQuery.data?.items ?? [];
  const open = items.filter((i) => !i.checked);
  const done = items.filter((i) => i.checked);

  const ph =
    lang === "zh"
      ? "牛奶、面包、苹果…"
      : "Milk, bread, apples…";

  return (
    <div className="mx-auto flex min-h-full max-w-lg flex-col px-4 pb-10 pt-8">
      <header className="flex items-start justify-between gap-3 py-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-emerald-950">mai-dong-xi</h1>
          <p className="mt-1 text-sm text-emerald-900/70">
            {lang === "zh" ? "家庭购物清单 — 一起编辑" : "Household list — edit together"}
          </p>
        </div>
        <LanguageToggle value={lang} onChange={setLang} />
      </header>

      <div
        ref={scrollRef}
        className="flex flex-1 flex-col gap-4 overflow-y-auto"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        style={{ transform: pullOffset ? `translateY(${pullOffset}px)` : undefined, transition: "transform 0.15s" }}
      >
        {pullOffset > 8 && (
          <div className="text-center text-xs font-medium text-emerald-800/70">
            {pullOffset > 40 ? (lang === "zh" ? "松开刷新" : "Release to refresh") : lang === "zh" ? "下拉刷新" : "Pull to refresh"}
          </div>
        )}

        <AddItem
          onAdd={async (t) => addMutation.mutateAsync(t)}
          disabled={addMutation.isPending}
          placeholder={ph}
        />

        {itemsQuery.isError && (
          <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            {lang === "zh" ? "无法加载清单。API 是否在运行？" : "Could not load the list. Is the API running?"}
          </p>
        )}

        <section>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-900/60">
            {lang === "zh" ? "要买" : "To buy"} ({open.length})
          </h2>
          <div className="flex flex-col gap-2">
            {open.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                lang={lang}
                onToggle={(id, checked) => toggleMutation.mutate({ id, checked })}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
            {open.length === 0 && !itemsQuery.isLoading && (
              <p className="rounded-2xl border border-dashed border-emerald-800/20 bg-white/50 px-4 py-6 text-center text-sm text-emerald-900/60">
                {lang === "zh" ? "暂无商品 — 在上方添加" : "Nothing here yet — add above."}
              </p>
            )}
          </div>
        </section>

        {done.length > 0 && (
          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-emerald-900/60">
                {lang === "zh" ? "已完成" : "Done"} ({done.length})
              </h2>
              <button
                type="button"
                className="text-xs font-semibold text-emerald-800 underline-offset-2 hover:underline"
                onClick={() => clearDoneMutation.mutate()}
                disabled={clearDoneMutation.isPending}
              >
                {lang === "zh" ? "清除已完成" : "Clear done"}
              </button>
            </div>
            <div className="flex flex-col gap-2 opacity-90">
              {done.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  lang={lang}
                  onToggle={(id, checked) => toggleMutation.mutate({ id, checked })}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </div>
          </section>
        )}

        <button
          type="button"
          className="mt-2 self-center rounded-full border border-emerald-800/20 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-900"
          onClick={() => refetch()}
          disabled={itemsQuery.isFetching}
        >
          {itemsQuery.isFetching ? (lang === "zh" ? "刷新中…" : "Refreshing…") : lang === "zh" ? "刷新" : "Refresh"}
        </button>
      </div>

      <DeployStamp />
    </div>
  );
}
