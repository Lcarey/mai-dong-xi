// =============================================================================
// Shared types and API contracts for mai-dong-xi
// =============================================================================

export type DisplayLanguage = "en" | "zh";

export interface ListItem {
  id: string;
  textEn: string;
  textZh: string;
  /** How many of this item to buy. Always ≥ 1. */
  quantity: number;
  checked: boolean;
  addedAt: string;
  checkedAt: string | null;
}

export interface ListItemsResponse {
  items: ListItem[];
}

export interface CreateItemRequest {
  text: string;
  /** Optional initial quantity (≥ 1). Defaults to 1. */
  quantity?: number;
}

export interface CreateItemResponse {
  item: ListItem;
}

export interface PatchItemRequest {
  checked?: boolean;
  /** If set, item text is replaced and re-translated to the other language. */
  text?: string;
  /** If set, replaces the quantity. Must be ≥ 1. */
  quantity?: number;
}

export interface PatchItemResponse {
  item: ListItem;
}

export interface DeleteCheckedResponse {
  deleted: number;
}
