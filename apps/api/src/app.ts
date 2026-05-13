// =============================================================================
// Hono API — shared shopping list (no auth)
// =============================================================================

import { Hono } from "hono";
import { cors } from "hono/cors";
import { randomUUID } from "node:crypto";
import type {
  CreateItemRequest,
  CreateItemResponse,
  DeleteCheckedResponse,
  ListItemsResponse,
  PatchItemRequest,
  PatchItemResponse,
} from "@maidongxi/shared";
import {
  deleteAllChecked,
  deleteItem,
  ensureMeta,
  getItem,
  listItems,
  putItem,
  updateItemChecked,
  updateItemQuantity,
  updateItemText,
} from "./db.js";

function normalizeQuantity(raw: unknown): number | null {
  if (raw === undefined) return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return null;
  const floored = Math.floor(n);
  if (floored < 1) return null;
  return Math.min(floored, 999);
}
import { bilingualFromInput } from "./translate.js";

const app = new Hono();

app.use(
  "*",
  cors({
    origin: (origin) => origin ?? "*",
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type"],
  }),
);

app.get("/items", async (c) => {
  await ensureMeta();
  const items = await listItems();
  const body: ListItemsResponse = { items };
  return c.json(body);
});

app.post("/items", async (c) => {
  let body: CreateItemRequest;
  try {
    body = (await c.req.json()) as CreateItemRequest;
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const text = typeof body.text === "string" ? body.text : "";
  if (!text.trim()) {
    return c.json({ error: "text is required" }, 400);
  }
  const quantity = normalizeQuantity(body.quantity) ?? 1;
  await ensureMeta();
  const { textEn, textZh } = await bilingualFromInput(text);
  const now = new Date().toISOString();
  const item = {
    id: randomUUID(),
    textEn,
    textZh,
    quantity,
    checked: false,
    addedAt: now,
    checkedAt: null as string | null,
  };
  await putItem(item);
  const res: CreateItemResponse = { item };
  return c.json(res, 201);
});

app.patch("/items/:id", async (c) => {
  const id = c.req.param("id");
  let body: PatchItemRequest;
  try {
    body = (await c.req.json()) as PatchItemRequest;
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }
  const existing = await getItem(id);
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }
  if (body.text !== undefined) {
    const t = typeof body.text === "string" ? body.text : "";
    if (!t.trim()) {
      return c.json({ error: "text must be non-empty" }, 400);
    }
    const { textEn, textZh } = await bilingualFromInput(t);
    await updateItemText({ ...existing, textEn, textZh });
  }
  if (body.quantity !== undefined) {
    const q = normalizeQuantity(body.quantity);
    if (q == null) {
      return c.json({ error: "quantity must be an integer ≥ 1" }, 400);
    }
    await updateItemQuantity(id, q);
  }
  if (body.checked !== undefined) {
    const checked = Boolean(body.checked);
    const checkedAt = checked ? new Date().toISOString() : null;
    await updateItemChecked(id, checked, checkedAt);
  }
  const item = await getItem(id);
  if (!item) return c.json({ error: "Not found" }, 404);
  const res: PatchItemResponse = { item };
  return c.json(res);
});

app.delete("/items/checked", async (c) => {
  const deleted = await deleteAllChecked();
  const res: DeleteCheckedResponse = { deleted };
  return c.json(res);
});

app.delete("/items/:id", async (c) => {
  const id = c.req.param("id");
  const existing = await getItem(id);
  if (!existing) {
    return c.json({ error: "Not found" }, 404);
  }
  await deleteItem(id);
  return c.body(null, 204);
});

app.get("/health", (c) => c.json({ ok: true }));

export default app;
