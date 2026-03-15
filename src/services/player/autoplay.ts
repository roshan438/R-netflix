import type { MediaItem } from "@/types/domain";

export function getAutoplayCountdownSeconds() {
  return 5;
}

export function findNextMediaInCollection(
  mediaItems: MediaItem[],
  currentMediaId: string,
) {
  const current = mediaItems.find((item) => item.id === currentMediaId);
  if (!current) return undefined;
  return mediaItems
    .filter((item) => item.collectionId === current.collectionId)
    .sort((a, b) => a.playbackOrder - b.playbackOrder)
    .find((item) => item.playbackOrder === current.playbackOrder + 1);
}
