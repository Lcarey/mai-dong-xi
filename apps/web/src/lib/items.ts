import type { ListItem } from "@maidongxi/shared";

export function sortListItems(items: ListItem[]): ListItem[] {
  return [...items].sort((a, b) => {
    if (a.checked !== b.checked) return a.checked ? 1 : -1;
    return a.addedAt.localeCompare(b.addedAt);
  });
}
