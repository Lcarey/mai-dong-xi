// =============================================================================
// Shared types and API contracts for mai-dong-xi
// =============================================================================

export type DisplayLanguage = "en" | "zh";

export interface ListItem {
  id: string;
  textEn: string;
  textZh: string;
  checked: boolean;
  addedAt: string;
  checkedAt: string | null;
}

export interface ListItemsResponse {
  items: ListItem[];
}

export interface CreateItemRequest {
  text: string;
}

export interface CreateItemResponse {
  item: ListItem;
}

export interface PatchItemRequest {
  checked?: boolean;
  /** If set, item text is replaced and re-translated to the other language. */
  text?: string;
}

export interface PatchItemResponse {
  item: ListItem;
}

export interface DeleteCheckedResponse {
  deleted: number;
}
