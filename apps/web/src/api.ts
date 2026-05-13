import type {
  CreateItemResponse,
  DeleteCheckedResponse,
  ListItemsResponse,
  PatchItemResponse,
} from "@maidongxi/shared";

const api = (path: string) => `/api${path}`;

export async function getItems(): Promise<ListItemsResponse> {
  const res = await fetch(api("/items"));
  if (!res.ok) throw new Error(`GET /items failed: ${res.status}`);
  return (await res.json()) as ListItemsResponse;
}

export async function createItem(text: string): Promise<CreateItemResponse> {
  const res = await fetch(api("/items"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error(`POST /items failed: ${res.status}`);
  return (await res.json()) as CreateItemResponse;
}

export async function patchItem(
  id: string,
  body: { checked?: boolean; text?: string },
): Promise<PatchItemResponse> {
  const res = await fetch(api(`/items/${encodeURIComponent(id)}`), {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`PATCH /items/${id} failed: ${res.status}`);
  return (await res.json()) as PatchItemResponse;
}

export async function deleteItem(id: string): Promise<void> {
  const res = await fetch(api(`/items/${encodeURIComponent(id)}`), {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) throw new Error(`DELETE /items/${id} failed: ${res.status}`);
}

export async function deleteCheckedItems(): Promise<DeleteCheckedResponse> {
  const res = await fetch(api("/items/checked"), { method: "DELETE" });
  if (!res.ok) throw new Error(`DELETE /items/checked failed: ${res.status}`);
  return (await res.json()) as DeleteCheckedResponse;
}
