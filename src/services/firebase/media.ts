import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  startAfter,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  demoCategories,
  demoCollections,
  demoContinueWatching,
  demoFavorites,
  demoHomepageRows,
  demoMediaItems,
  demoSeasons,
} from "@/lib/demo-data";
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from "@/services/firebase/config";
import { watchHistoryService } from "@/services/firebase/watchHistory";
import { extractYouTubeVideoId } from "@/services/utils/formatting";
import type { HomepageRow, MediaItem, SearchFilters } from "@/types/domain";

function toMediaItem(docId: string, data: Record<string, unknown>): MediaItem {
  return {
    id: docId,
    spaceId: String(data.spaceId ?? ""),
    type: (data.type as "video" | "photo_collection") ?? "video",
    title: String(data.title ?? "Untitled"),
    description: String(data.description ?? ""),
    categoryId: String(data.categoryId ?? ""),
    collectionId: String(data.collectionId ?? ""),
    customSeasonId: data.customSeasonId ? String(data.customSeasonId) : undefined,
    autoYearSeason: Number(data.autoYearSeason ?? 0),
    durationSeconds: Number(data.durationSeconds ?? 0),
    playbackOrder: Number(data.playbackOrder ?? 1),
    featured: Boolean(data.featured),
    dateOfMemory: String(data.dateOfMemory ?? ""),
    bannerUrl: String(data.bannerImageUrl ?? data.bannerUrl ?? ""),
    thumbnailUrl: String(data.thumbnailUrl ?? ""),
    backdropUrl: String(data.bannerImageUrl ?? data.backdropUrl ?? ""),
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    location: data.location ? String(data.location) : undefined,
    youtubeVideoId: data.youtubeVideoId ? String(data.youtubeVideoId) : undefined,
  };
}

function scoreRelatedMedia(candidate: MediaItem, sources: MediaItem[], favoriteIds: Set<string>) {
  let score = 0;

  for (const source of sources) {
    if (candidate.collectionId && candidate.collectionId === source.collectionId) {
      score += 5;
    }
    if (candidate.categoryId && candidate.categoryId === source.categoryId) {
      score += 3;
    }
    if (candidate.customSeasonId && candidate.customSeasonId === source.customSeasonId) {
      score += 2;
    }
    if (candidate.autoYearSeason && candidate.autoYearSeason === source.autoYearSeason) {
      score += 1;
    }
    const sharedTags = candidate.tags.filter((tag) => source.tags.includes(tag)).length;
    score += sharedTags * 2;
  }

  if (favoriteIds.has(candidate.id)) {
    score += 4;
  }

  if (candidate.featured) {
    score += 1;
  }

  return score;
}

export const mediaService = {
  async getFeaturedMedia(spaceId: string) {
    if (isFirebaseConfigured && firestoreDb) {
      const featuredSnapshot = await getDocs(
        query(
          collection(firestoreDb, `spaces/${spaceId}/mediaItems`),
          where("featured", "==", true),
          limit(1),
        ),
      );
      const featuredFirst = featuredSnapshot.docs[0];
      if (featuredFirst) {
        return toMediaItem(featuredFirst.id, featuredFirst.data());
      }

      const publishedSnapshot = await getDocs(
        query(
          collection(firestoreDb, `spaces/${spaceId}/mediaItems`),
          where("published", "==", true),
          limit(12),
        ),
      );
      return publishedSnapshot.docs
        .map((item) => ({
          media: toMediaItem(item.id, item.data()),
          publishedAt:
            typeof item.data().publishedAt?.toMillis === "function"
              ? item.data().publishedAt.toMillis()
              : 0,
        }))
        .sort((a, b) => b.publishedAt - a.publishedAt)[0]?.media;
    }
    return (
      demoMediaItems.find((item) => item.spaceId === spaceId && item.featured) ??
      demoMediaItems
        .filter((item) => item.spaceId === spaceId)
        .sort((a, b) => b.dateOfMemory.localeCompare(a.dateOfMemory))[0]
    );
  },
  async listHomepageRows(_spaceId: string): Promise<HomepageRow[]> {
    return demoHomepageRows;
  },
  async listRecentlyAdded(spaceId: string) {
    if (isFirebaseConfigured && firestoreDb) {
      const snapshot = await getDocs(
        query(
          collection(firestoreDb, `spaces/${spaceId}/mediaItems`),
          where("published", "==", true),
        ),
      );
      return snapshot.docs
        .map((item) => ({
          media: toMediaItem(item.id, item.data()),
          publishedAt:
            typeof item.data().publishedAt?.toMillis === "function"
              ? item.data().publishedAt.toMillis()
              : 0,
        }))
        .sort((a, b) => b.publishedAt - a.publishedAt)
        .map((item) => item.media);
    }
    return demoMediaItems
      .filter((item) => item.spaceId === spaceId)
      .sort((a, b) => b.dateOfMemory.localeCompare(a.dateOfMemory));
  },
  async listForAdmin(
    spaceId: string,
    options?: {
      pageSize?: number;
      cursor?: unknown;
    },
  ) {
    const pageSize = options?.pageSize ?? 10;
    if (isFirebaseConfigured && firestoreDb) {
      const constraints = [
        orderBy("createdAt", "desc"),
        limit(pageSize),
      ] as const;
      const adminQuery = options?.cursor
        ? query(
            collection(firestoreDb, `spaces/${spaceId}/mediaItems`),
            ...constraints,
            startAfter(options.cursor),
          )
        : query(collection(firestoreDb, `spaces/${spaceId}/mediaItems`), ...constraints);
      const snapshot = await getDocs(adminQuery);
      return {
        items: snapshot.docs.map((item) => toMediaItem(item.id, item.data())),
        nextCursor: snapshot.docs.at(-1) ?? null,
        hasMore: snapshot.docs.length === pageSize,
      };
    }
    const sortedItems = demoMediaItems
      .filter((item) => item.spaceId === spaceId)
      .sort((a, b) => b.dateOfMemory.localeCompare(a.dateOfMemory));
    const startIndex = Number((options?.cursor as { index?: number } | null)?.index ?? 0);
    const nextItems = sortedItems.slice(startIndex, startIndex + pageSize);
    return {
      items: nextItems,
      nextCursor:
        startIndex + pageSize < sortedItems.length
          ? ({ index: startIndex + pageSize } as unknown)
          : null,
      hasMore: startIndex + pageSize < sortedItems.length,
    };
  },
  async listByCollection(collectionId: string, spaceId?: string) {
    if (isFirebaseConfigured && firestoreDb) {
      const mediaCollection = spaceId
        ? collection(firestoreDb, `spaces/${spaceId}/mediaItems`)
        : collectionGroup(firestoreDb, "mediaItems");
      const snapshot = await getDocs(
        query(
          mediaCollection,
          where("collectionId", "==", collectionId),
        ),
      );
      return snapshot.docs
        .map((item) => toMediaItem(item.id, item.data()))
        .sort((a, b) => a.playbackOrder - b.playbackOrder);
    }
    return demoMediaItems
      .filter((item) => item.collectionId === collectionId)
      .sort((a, b) => a.playbackOrder - b.playbackOrder);
  },
  async getMediaById(mediaId: string, spaceId?: string) {
    if (isFirebaseConfigured && firestoreDb) {
      if (spaceId) {
        const mediaDoc = await getDoc(doc(firestoreDb, `spaces/${spaceId}/mediaItems/${mediaId}`));
        if (mediaDoc.exists()) {
          return toMediaItem(mediaDoc.id, mediaDoc.data());
        }
      }
    }
    return demoMediaItems.find((item) => item.id === mediaId);
  },
  async getNextInCollection(currentMediaId: string, spaceId?: string) {
    const current = await this.getMediaById(currentMediaId, spaceId);
    if (!current) return undefined;
    const items = await this.listByCollection(current.collectionId, current.spaceId || spaceId);
    return items.find((item) => item.playbackOrder === current.playbackOrder + 1);
  },
  async listCollections(spaceId: string) {
    if (isFirebaseConfigured && firestoreDb) {
      const snapshot = await getDocs(
        query(collection(firestoreDb, `spaces/${spaceId}/collections`), orderBy("sortOrder", "asc")),
      );
      return snapshot.docs.map((item) => ({
        id: item.id,
        spaceId,
        title: String(item.data().title ?? ""),
        description: String(item.data().description ?? ""),
        categoryId: String(item.data().categoryId ?? ""),
        bannerUrl: String(item.data().bannerImageUrl ?? item.data().bannerUrl ?? ""),
        thumbnailUrl: String(item.data().thumbnailUrl ?? ""),
        seasonId: item.data().customSeasonId ? String(item.data().customSeasonId) : undefined,
        featured: Boolean(item.data().featured),
      }));
    }
    return demoCollections.filter((item) => item.spaceId === spaceId);
  },
  async listCategories(spaceId: string) {
    if (isFirebaseConfigured && firestoreDb) {
      const snapshot = await getDocs(collection(firestoreDb, `spaces/${spaceId}/categories`));
      return snapshot.docs.map((item) => ({
        id: item.id,
        spaceId,
        name: String(item.data().name ?? ""),
        description: String(item.data().description ?? ""),
      }));
    }
    return demoCategories.filter((item) => item.spaceId === spaceId);
  },
  async listSeasons(spaceId: string) {
    if (isFirebaseConfigured && firestoreDb) {
      const snapshot = await getDocs(
        query(collection(firestoreDb, `spaces/${spaceId}/seasons`), orderBy("sortOrder", "asc")),
      );
      return snapshot.docs.map((item) => ({
        id: item.id,
        spaceId,
        title: String(item.data().title ?? ""),
        type: (item.data().type as "auto_year" | "custom") ?? "custom",
        year: item.data().year ? Number(item.data().year) : undefined,
      }));
    }
    return demoSeasons.filter((item) => item.spaceId === spaceId);
  },
  async listFavorites(profileId: string, spaceId?: string): Promise<MediaItem[]> {
    if (isFirebaseConfigured && firestoreDb && spaceId) {
      const snapshot = await getDocs(
        collection(firestoreDb, `spaces/${spaceId}/profiles/${profileId}/favorites`),
      ).catch(() => null);
      const ids = snapshot?.docs.map((item) => String(item.data().mediaItemId ?? "")).filter(Boolean) ?? [];
      const items = await Promise.all(
        ids.map((id) => this.getMediaById(id, spaceId)),
      );
      return items.filter((item): item is MediaItem => Boolean(item));
    }
    const ids = new Set(
      demoFavorites
        .filter((record) => record.profileId === profileId)
        .map((record) => record.mediaItemId),
    );
    return demoMediaItems.filter((item) => ids.has(item.id));
  },
  async listContinueWatching(profileId: string, spaceId?: string) {
    if (isFirebaseConfigured && firestoreDb && spaceId) {
      const snapshot = await getDocs(
        query(
          collection(firestoreDb, `spaces/${spaceId}/profiles/${profileId}/continueWatching`),
          orderBy("updatedAt", "desc"),
        ),
      ).catch(() => null);
      const rows =
        snapshot?.docs.map((item) => ({
          profileId,
          mediaItemId: String(item.data().mediaItemId ?? ""),
          progressSeconds: Number(item.data().progressSeconds ?? 0),
          updatedAt: String(item.data().updatedAt ?? ""),
          completed: Boolean(item.data().completed),
        })) ?? [];
      const mediaItems = await Promise.all(
        rows.map((row) => this.getMediaById(row.mediaItemId, spaceId)),
      );
      return rows
        .map((row, index) => ({
          ...row,
          media: mediaItems[index],
        }))
        .filter((item): item is typeof item & { media: MediaItem } => Boolean(item.media));
    }
    return demoContinueWatching
      .filter((record) => record.profileId === profileId)
      .map((record) => ({
        ...record,
        media: demoMediaItems.find((item) => item.id === record.mediaItemId)!,
      }))
      .filter((item) => Boolean(item.media));
  },
  async listTopPicks(profileId: string, spaceId: string) {
    const [allMedia, favorites, continueWatching, watchHistory] = await Promise.all([
      this.listRecentlyAdded(spaceId),
      this.listFavorites(profileId, spaceId),
      this.listContinueWatching(profileId, spaceId),
      watchHistoryService.listHistory(spaceId, profileId),
    ]);

    const favoriteIds = new Set(favorites.map((item) => item.id));
    const currentIds = new Set(continueWatching.map((item) => item.media.id));
    const historyIds = new Set(watchHistory.map((item) => item.mediaItemId));
    const sourceIds = new Set([...favoriteIds, ...currentIds, ...historyIds]);

    const sourceMedia = allMedia.filter((item) => sourceIds.has(item.id));
    if (!sourceMedia.length) {
      return allMedia.slice(0, 10);
    }

    return allMedia
      .filter((candidate) => !currentIds.has(candidate.id))
      .map((candidate) => ({
        media: candidate,
        score: scoreRelatedMedia(candidate, sourceMedia, favoriteIds),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || b.media.dateOfMemory.localeCompare(a.media.dateOfMemory))
      .slice(0, 10)
      .map((item) => item.media);
  },
  async getBecauseYouWatched(profileId: string, spaceId: string) {
    const [allMedia, watchHistory] = await Promise.all([
      this.listRecentlyAdded(spaceId),
      watchHistoryService.listHistory(spaceId, profileId),
    ]);

    const anchorHistory = watchHistory[0];
    if (!anchorHistory) {
      return { title: "Because You Watched", items: [] as MediaItem[] };
    }

    const anchorMedia = allMedia.find((item) => item.id === anchorHistory.mediaItemId);
    if (!anchorMedia) {
      return { title: "Because You Watched", items: [] as MediaItem[] };
    }

    const items = allMedia
      .filter((candidate) => candidate.id !== anchorMedia.id)
      .map((candidate) => ({
        media: candidate,
        score: scoreRelatedMedia(candidate, [anchorMedia], new Set<string>()),
      }))
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || b.media.dateOfMemory.localeCompare(a.media.dateOfMemory))
      .slice(0, 10)
      .map((item) => item.media);

    return {
      title: `Because You Watched ${anchorMedia.title}`,
      items,
    };
  },
  async search(spaceId: string, filters: SearchFilters) {
    if (isFirebaseConfigured && firestoreDb) {
      const all = await this.listRecentlyAdded(spaceId);
      const queryText = filters.query.trim().toLowerCase();
      return all.filter((item) => {
        if (filters.type && filters.type !== "all" && item.type !== filters.type) return false;
        if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
        if (filters.seasonId && item.customSeasonId !== filters.seasonId) return false;
        if (!queryText) return true;
        return `${item.title} ${item.description}`.toLowerCase().includes(queryText);
      });
    }
    const query = filters.query.trim().toLowerCase();
    return demoMediaItems.filter((item) => {
      if (item.spaceId !== spaceId) return false;
      if (filters.type && filters.type !== "all" && item.type !== filters.type) {
        return false;
      }
      if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
      if (filters.seasonId && item.customSeasonId !== filters.seasonId) return false;
      if (!query) return true;
      return [
        item.title,
        item.description,
        demoCollections.find((collection) => collection.id === item.collectionId)?.title ?? "",
        demoCategories.find((category) => category.id === item.categoryId)?.name ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  },
  async createVideoFromYouTubeLink(input: {
    spaceId: string;
    title: string;
    description: string;
    youtubeUrl: string;
    collectionId: string;
    categoryId: string;
    dateOfMemory: string;
    customSeasonId?: string;
    tags?: string[];
    location?: string;
    thumbnailUrl?: string;
    bannerImageUrl?: string;
  }) {
    const youtubeVideoId = extractYouTubeVideoId(input.youtubeUrl);
    if (!youtubeVideoId) {
      throw new Error("That YouTube link does not look valid. Paste a full YouTube watch/share URL.");
    }

    if (!isFirebaseConfigured || !firestoreDb) {
      return {
        mediaItemId: `media_${youtubeVideoId}`,
        mediaAssetId: `asset_${youtubeVideoId}`,
        youtubeVideoId,
      };
    }

    const createdBy = firebaseAuth?.currentUser?.uid;
    if (!createdBy) {
      throw new Error("Please sign in again before creating media.");
    }

    const assetRef = await addDoc(collection(firestoreDb, `spaces/${input.spaceId}/mediaAssets`), {
      spaceId: input.spaceId,
      assetType: "video",
      provider: "youtube",
      providerAssetId: youtubeVideoId,
      originalFilename: input.title,
      playbackUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
      streamingUrl: `https://www.youtube.com/embed/${youtubeVideoId}`,
      downloadUrl: `https://www.youtube.com/watch?v=${youtubeVideoId}`,
      metadata: {
        sourceUrl: input.youtubeUrl,
      },
      createdBy,
      createdAt: serverTimestamp(),
    });

    const publishedAt = serverTimestamp();
    const mediaRef = await addDoc(collection(firestoreDb, `spaces/${input.spaceId}/mediaItems`), {
      spaceId: input.spaceId,
      type: "video",
      title: input.title,
      slug: input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      description: input.description,
      collectionId: input.collectionId,
      categoryId: input.categoryId,
      customSeasonId: input.customSeasonId ?? null,
      autoYearSeason: Number(input.dateOfMemory.slice(0, 4)),
      dateOfMemory: input.dateOfMemory,
      thumbnailUrl:
        input.thumbnailUrl || `https://img.youtube.com/vi/${youtubeVideoId}/hqdefault.jpg`,
      bannerImageUrl:
        input.bannerImageUrl || `https://img.youtube.com/vi/${youtubeVideoId}/maxresdefault.jpg`,
      mediaAssetId: assetRef.id,
      youtubeVideoId,
      durationSeconds: 0,
      featured: false,
      tags: input.tags ?? [],
      location: input.location ?? null,
      playbackOrder: 1,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      published: true,
      publishedAt,
      visibility: "private",
    });

    return {
      mediaItemId: mediaRef.id,
      mediaAssetId: assetRef.id,
      youtubeVideoId,
    };
  },
  async updateMediaDetails(input: {
    spaceId: string;
    mediaId: string;
    title: string;
    description: string;
    categoryId: string;
    collectionId: string;
    customSeasonId?: string;
    location?: string;
    dateOfMemory: string;
    tags?: string[];
    thumbnailUrl?: string;
    bannerUrl?: string;
    featured?: boolean;
  }) {
    if (!isFirebaseConfigured || !firestoreDb) {
      return;
    }
    await updateDoc(doc(firestoreDb, `spaces/${input.spaceId}/mediaItems/${input.mediaId}`), {
      title: input.title,
      slug: input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      description: input.description,
      categoryId: input.categoryId,
      collectionId: input.collectionId,
      customSeasonId: input.customSeasonId ?? null,
      location: input.location ?? null,
      dateOfMemory: input.dateOfMemory,
      autoYearSeason: Number(input.dateOfMemory.slice(0, 4)),
      tags: input.tags ?? [],
      thumbnailUrl: input.thumbnailUrl ?? "",
      bannerImageUrl: input.bannerUrl ?? "",
      featured: Boolean(input.featured),
      updatedAt: serverTimestamp(),
    });
  },
  async deleteMediaItem(spaceId: string, mediaId: string) {
    if (!isFirebaseConfigured || !firestoreDb) {
      return;
    }
    const mediaRef = doc(firestoreDb, `spaces/${spaceId}/mediaItems/${mediaId}`);
    const mediaSnapshot = await getDoc(mediaRef);
    if (!mediaSnapshot.exists()) {
      return;
    }
    const data = mediaSnapshot.data();
    const mediaAssetId = String(data.mediaAssetId ?? "");

    await deleteDoc(mediaRef);
    if (mediaAssetId) {
      await deleteDoc(doc(firestoreDb, `spaces/${spaceId}/mediaAssets/${mediaAssetId}`)).catch(
        () => undefined,
      );
    }
  },
};
