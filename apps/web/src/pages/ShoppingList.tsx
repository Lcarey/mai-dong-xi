import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState, type TouchEvent } from "react";
import type { DisplayLanguage, ListItem, ListItemsResponse } from "@maidongxi/shared";
import { createItem, deleteCheckedItems, deleteItem, getItems, patchItem } from "../api";
import { AddItem } from "../components/AddItem";
import { DeployStamp } from "../components/DeployStamp";
import { ItemRow } from "../components/ItemRow";
import { LanguageToggle } from "../components/LanguageToggle";
import { ListSkeleton } from "../components/ListSkeleton";
import type { UndoAction } from "../components/UndoToast";
import { UndoToast } from "../components/UndoToast";
import { sortListItems } from "../lib/items";
import { getStoredLanguage } from "../lib/language";

export function ShoppingList() {
  const qc = useQueryClient();
  const [lang, setLang] = useState<DisplayLanguage>(() => getStoredLanguage());
  const [pullOffset, setPullOffset] = useState(0);
  const pullStartY = useRef<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const itemsQuery = useQuery({
    queryKey: ["items"],
    queryFn: getItems,
  });

  const dismissUndo = useCallback(() => setUndoAction(null), []);

  const addMutation = useMutation({
    mutationFn: ({ text, quantity }: { text: string; quantity: number }) =>
      createItem(text, quantity),
    onMutate: async ({ text, quantity }) => {
      await qc.cancelQueries({ queryKey: ["items"] });
      const previous = qc.getQueryData<ListItemsResponse>(["items"]);
      const tempId = `temp:${crypto.randomUUID()}`;
      const now = new Date().toISOString();
      const optimistic: ListItem = {
        id: tempId,
        textEn: text.trim(),
        textZh: text.trim(),
        quantity,
        checked: false,
        addedAt: now,
        checkedAt: null,
      };
      qc.setQueryData<ListItemsResponse>(["items"], (old) => ({
        items: sortListItems([...(old?.items ?? []), optimistic]),
      }));
      setSaveError(null);
      return { previous, tempId };
    },
    onSuccess: (data, _vars, ctx) => {
      qc.setQueryData<ListItemsResponse>(["items"], (old) => ({
        items: sortListItems(
          (old?.items ?? []).map((i) => (i.id === ctx?.tempId ? data.item : i)),
        ),
      }));
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(["items"], ctx.previous);
      } else {
        void qc.invalidateQueries({ queryKey: ["items"] });
      }
      setSaveError(
        lang === "zh" ? "无法添加商品，请重试。" : "Could not add that item. Try again.",
      );
    },
  });

  const quantityMutation = useMutation({
    mutationFn: ({ id, quantity }: { id: string; quantity: number }) =>
      patchItem(id, { quantity }),
    onMutate: async ({ id, quantity }) => {
      await qc.cancelQueries({ queryKey: ["items"] });
      const previous = qc.getQueryData<ListItemsResponse>(["items"]);
      qc.setQueryData<ListItemsResponse>(["items"], (old) => ({
        items: sortListItems(
          (old?.items ?? []).map((i) => (i.id === id ? { ...i, quantity } : i)),
        ),
      }));
      setSaveError(null);
      return { previous };
    },
    onSuccess: (data) => {
      qc.setQueryData<ListItemsResponse>(["items"], (old) => ({
        items: sortListItems(
          (old?.items ?? []).map((i) => (i.id === data.item.id ? data.item : i)),
        ),
      }));
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(["items"], ctx.previous);
      }
      setSaveError(
        lang === "zh" ? "无法更新数量，请重试。" : "Could not update the quantity. Try again.",
      );
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, checked }: { id: string; checked: boolean }) => patchItem(id, { checked }),
    onMutate: async ({ id, checked }) => {
      await qc.cancelQueries({ queryKey: ["items"] });
      const previous = qc.getQueryData<ListItemsResponse>(["items"]);
      const checkedAt = checked ? new Date().toISOString() : null;
      qc.setQueryData<ListItemsResponse>(["items"], (old) => ({
        items: sortListItems(
          (old?.items ?? []).map((i) =>
            i.id === id ? { ...i, checked, checkedAt } : i,
          ),
        ),
      }));
      setSaveError(null);
      return { previous };
    },
    onSuccess: (data) => {
      qc.setQueryData<ListItemsResponse>(["items"], (old) => ({
        items: sortListItems(
          (old?.items ?? []).map((i) => (i.id === data.item.id ? data.item : i)),
        ),
      }));
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(["items"], ctx.previous);
      }
      setSaveError(
        lang === "zh" ? "无法更新勾选状态，请重试。" : "Could not update the item. Try again.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteItem(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ["items"] });
      const previous = qc.getQueryData<ListItemsResponse>(["items"]);
      const deletedItem = previous?.items.find((i) => i.id === id);
      qc.setQueryData<ListItemsResponse>(["items"], (old) => ({
        items: (old?.items ?? []).filter((i) => i.id !== id),
      }));
      setSaveError(null);
      return { previous, deletedItem };
    },
    onSuccess: (_void, _id, ctx) => {
      const snap = ctx?.deletedItem;
      if (!snap) return;
      const textToRestore = snap.textEn.trim() || snap.textZh.trim();
      setUndoAction({
        kind: "delete",
        message:
          lang === "zh"
            ? `已删除：${textToRestore.slice(0, 48)}${textToRestore.length > 48 ? "…" : ""}`
            : `Removed: ${textToRestore.slice(0, 48)}${textToRestore.length > 48 ? "…" : ""}`,
        onUndo: async () => {
          try {
            await createItem(textToRestore, snap.quantity);
            await qc.invalidateQueries({ queryKey: ["items"] });
          } catch {
            setSaveError(lang === "zh" ? "撤销失败，请手动添加。" : "Undo failed — add the item again.");
          }
        },
      });
    },
    onError: (_e, _id, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(["items"], ctx.previous);
      }
      setSaveError(
        lang === "zh" ? "无法删除，请重试。" : "Could not delete that item. Try again.",
      );
    },
  });

  const clearDoneMutation = useMutation({
    mutationFn: () => deleteCheckedItems(),
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["items"] });
      const previous = qc.getQueryData<ListItemsResponse>(["items"]);
      const clearedItems = (previous?.items ?? []).filter((i) => i.checked);
      qc.setQueryData<ListItemsResponse>(["items"], (old) => ({
        items: sortListItems((old?.items ?? []).filter((i) => !i.checked)),
      }));
      setSaveError(null);
      return { previous, clearedItems };
    },
    onSuccess: (_data, _vars, ctx) => {
      const snaps = ctx?.clearedItems ?? [];
      if (snaps.length === 0) return;
      const snapshot = [...snaps];
      setUndoAction({
        kind: "clear",
        message:
          lang === "zh"
            ? `已清除 ${snapshot.length} 件已完成商品`
            : `Cleared ${snapshot.length} done item${snapshot.length === 1 ? "" : "s"}`,
        onUndo: async () => {
          try {
            for (const s of snapshot) {
              const t = s.textEn.trim() || s.textZh.trim();
              if (t) await createItem(t, s.quantity);
            }
            await qc.invalidateQueries({ queryKey: ["items"] });
          } catch {
            setSaveError(lang === "zh" ? "恢复失败，请检查网络。" : "Undo failed — check your connection.");
          }
        },
      });
    },
    onError: (_e, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(["items"], ctx.previous);
      }
      setSaveError(
        lang === "zh" ? "无法清除已完成，请重试。" : "Could not clear done items. Try again.",
      );
    },
  });

  const refetch = useCallback(() => itemsQuery.refetch(), [itemsQuery]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible") void refetch();
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
  const hasData = itemsQuery.data !== undefined;
  const loadingInitial = itemsQuery.isPending && !hasData;
  const loadFailed = itemsQuery.isError;
  const emptyList = hasData && items.length === 0;

  const ph =
    lang === "zh"
      ? "牛奶、面包、苹果…"
      : "Milk, bread, apples…";

  const addLabel = lang === "zh" ? "添加" : "Add";
  const deleteLabel = lang === "zh" ? "删除" : "Delete";
  const decLabel = lang === "zh" ? "减少数量" : "Decrease quantity";
  const incLabel = lang === "zh" ? "增加数量" : "Increase quantity";
  const qtyLabel = lang === "zh" ? "数量" : "Quantity";

  const saveErrorDismiss = lang === "zh" ? "关闭" : "Dismiss";
  const retryLabel = lang === "zh" ? "重试" : "Retry";

  return (
    <div className="relative mx-auto flex min-h-full max-w-lg flex-col px-4 pb-10 pt-8">
      <header className="flex items-start justify-between gap-3 py-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-emerald-950">mai-dong-xi</h1>
          <p className="mt-1 text-sm text-emerald-900/70">
            {lang === "zh" ? "家庭购物清单 — 一起编辑" : "Household list — edit together"}
          </p>
        </div>
        <LanguageToggle value={lang} onChange={setLang} />
      </header>

      {saveError && (
        <div
          className="mb-3 flex items-start justify-between gap-3 rounded-2xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-amber-950 shadow-sm"
          role="alert"
        >
          <span className="min-w-0 flex-1 leading-snug">{saveError}</span>
          <button
            type="button"
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-amber-900/80 hover:bg-amber-100"
            onClick={() => setSaveError(null)}
          >
            {saveErrorDismiss}
          </button>
        </div>
      )}

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
          onAdd={(text, quantity) => addMutation.mutateAsync({ text, quantity })}
          disabled={addMutation.isPending || loadingInitial || loadFailed}
          placeholder={ph}
          addLabel={addLabel}
          decLabel={decLabel}
          incLabel={incLabel}
          qtyLabel={qtyLabel}
        />

        {loadFailed && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-900 shadow-sm">
            <p className="font-medium">
              {lang === "zh" ? "无法加载清单" : "We couldn’t load your list"}
            </p>
            <p className="mt-1 text-rose-800/90">
              {lang === "zh"
                ? "请检查网络或 API，然后重试。"
                : "Check your connection or API, then try again."}
            </p>
            <button
              type="button"
              className="mt-3 rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800"
              onClick={() => void refetch()}
            >
              {retryLabel}
            </button>
          </div>
        )}

        {loadingInitial && !loadFailed && (
          <div className="space-y-2" aria-busy="true" aria-label={lang === "zh" ? "加载中" : "Loading"}>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-900/50">
              {lang === "zh" ? "加载中…" : "Loading…"}
            </p>
            <ListSkeleton rows={6} />
          </div>
        )}

        {!loadingInitial && !loadFailed && (
          <>
            <section>
              <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-emerald-900/60">
                {lang === "zh" ? "要买" : "To buy"} ({open.length})
              </h2>
              <div className="flex flex-col gap-2">
                {itemsQuery.isFetching && hasData && (
                  <p className="text-xs text-emerald-800/60" aria-live="polite">
                    {lang === "zh" ? "正在同步…" : "Syncing…"}
                  </p>
                )}
                {open.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    deleteLabel={deleteLabel}
                    decLabel={decLabel}
                    incLabel={incLabel}
                    onToggle={(id, checked) => toggleMutation.mutate({ id, checked })}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onQuantityChange={(id, quantity) => quantityMutation.mutate({ id, quantity })}
                  />
                ))}
                {open.length === 0 && emptyList && (
                  <p className="rounded-2xl border border-dashed border-emerald-800/20 bg-white/50 px-4 py-6 text-center text-sm text-emerald-900/60">
                    {lang === "zh" ? "清单是空的 — 在上方添加第一件商品" : "Your list is empty — add something above."}
                  </p>
                )}
                {open.length === 0 && !emptyList && (
                  <p className="rounded-2xl border border-dashed border-emerald-800/20 bg-white/50 px-4 py-6 text-center text-sm text-emerald-900/60">
                    {lang === "zh" ? "这里没有未完成商品 — 在上方添加" : "Nothing left to buy here — add above."}
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
                      deleteLabel={deleteLabel}
                      decLabel={decLabel}
                      incLabel={incLabel}
                      onToggle={(id, checked) => toggleMutation.mutate({ id, checked })}
                      onDelete={(id) => deleteMutation.mutate(id)}
                      onQuantityChange={(id, quantity) => quantityMutation.mutate({ id, quantity })}
                    />
                  ))}
                </div>
              </section>
            )}
          </>
        )}

        {!loadFailed && (
          <button
            type="button"
            className="mt-2 self-center rounded-full border border-emerald-800/20 bg-white/80 px-4 py-2 text-sm font-medium text-emerald-900"
            onClick={() => void refetch()}
            disabled={itemsQuery.isFetching}
          >
            {itemsQuery.isFetching ? (lang === "zh" ? "刷新中…" : "Refreshing…") : lang === "zh" ? "刷新" : "Refresh"}
          </button>
        )}
      </div>

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center p-4">
        <UndoToast action={undoAction} lang={lang} onDismiss={dismissUndo} />
      </div>

      <DeployStamp />
    </div>
  );
}
