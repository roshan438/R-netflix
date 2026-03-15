import type { MediaItem, SearchFilters } from "@/types/domain";

export function filterMediaItems(items: MediaItem[], filters: SearchFilters) {
  const query = filters.query.trim().toLowerCase();
  return items.filter((item) => {
    if (filters.type && filters.type !== "all" && item.type !== filters.type) {
      return false;
    }
    if (query) {
      return `${item.title} ${item.description}`.toLowerCase().includes(query);
    }
    return true;
  });
}
