import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { demoMediaItems, demoSeasons } from "@/lib/demo-data";
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from "@/services/firebase/config";
import { slugify } from "@/services/utils/slugify";

export const seasonService = {
  async list(spaceId: string) {
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
  async getById(seasonId: string, spaceId?: string) {
    if (isFirebaseConfigured && firestoreDb) {
      const item = spaceId
        ? await getDoc(doc(firestoreDb, `spaces/${spaceId}/seasons/${seasonId}`)).catch(() => null)
        : null;
      if (item?.exists()) {
        return {
          id: item.id,
          spaceId: String(item.data().spaceId ?? ""),
          title: String(item.data().title ?? ""),
          type: (item.data().type as "auto_year" | "custom") ?? "custom",
          year: item.data().year ? Number(item.data().year) : undefined,
        };
      }

      const snapshot = await getDocs(
        query(collectionGroup(firestoreDb, "seasons"), where("spaceId", "==", spaceId ?? "")),
      ).catch(() => null);
      const groupedItem = snapshot?.docs.find((entry) => entry.id === seasonId);
      const seasonItem = groupedItem;
      if (seasonItem) {
        return {
          id: seasonItem.id,
          spaceId: String(seasonItem.data().spaceId ?? ""),
          title: String(seasonItem.data().title ?? ""),
          type: (seasonItem.data().type as "auto_year" | "custom") ?? "custom",
          year: seasonItem.data().year ? Number(seasonItem.data().year) : undefined,
        };
      }
    }
    return demoSeasons.find((item) => item.id === seasonId);
  },
  async getItems(seasonId: string, spaceId?: string) {
    const season =
      (isFirebaseConfigured && firestoreDb ? await this.getById(seasonId, spaceId) : null) ??
      demoSeasons.find((item) => item.id === seasonId);
    if (!season) return [];
    if (isFirebaseConfigured && firestoreDb) {
      const mediaCollection = spaceId
        ? collection(firestoreDb, `spaces/${spaceId}/mediaItems`)
        : collectionGroup(firestoreDb, "mediaItems");
      const snapshot = await getDocs(
        query(
          mediaCollection,
          season.type === "auto_year"
            ? where("autoYearSeason", "==", season.year)
            : where("customSeasonId", "==", season.id),
        ),
      );
      return snapshot.docs.map((item) => ({
        id: item.id,
        spaceId: String(item.data().spaceId ?? ""),
        type: (item.data().type as "video" | "photo_collection") ?? "video",
        title: String(item.data().title ?? ""),
        description: String(item.data().description ?? ""),
        categoryId: String(item.data().categoryId ?? ""),
        collectionId: String(item.data().collectionId ?? ""),
        customSeasonId: item.data().customSeasonId ? String(item.data().customSeasonId) : undefined,
        autoYearSeason: Number(item.data().autoYearSeason ?? 0),
        durationSeconds: Number(item.data().durationSeconds ?? 0),
        playbackOrder: Number(item.data().playbackOrder ?? 1),
        featured: Boolean(item.data().featured),
        dateOfMemory: String(item.data().dateOfMemory ?? ""),
        bannerUrl: String(item.data().bannerImageUrl ?? item.data().bannerUrl ?? ""),
        thumbnailUrl: String(item.data().thumbnailUrl ?? ""),
        backdropUrl: String(item.data().bannerImageUrl ?? item.data().backdropUrl ?? ""),
        tags: Array.isArray(item.data().tags) ? (item.data().tags as string[]) : [],
        location: item.data().location ? String(item.data().location) : undefined,
        youtubeVideoId: item.data().youtubeVideoId ? String(item.data().youtubeVideoId) : undefined,
      }));
    }
    return demoMediaItems.filter(
      (item) =>
        item.customSeasonId === season.id ||
        (season.type === "auto_year" && item.autoYearSeason === season.year),
    );
  },
  async create(input: { spaceId: string; title: string; description?: string }) {
    if (!isFirebaseConfigured || !firestoreDb) {
      return {
        id: `season_${slugify(input.title)}`,
        spaceId: input.spaceId,
        title: input.title,
        type: "custom" as const,
      };
    }

    const createdBy = firebaseAuth?.currentUser?.uid;
    if (!createdBy) {
      throw new Error("Please sign in again before creating a season.");
    }

    const docRef = await addDoc(collection(firestoreDb, `spaces/${input.spaceId}/seasons`), {
      spaceId: input.spaceId,
      type: "custom",
      title: input.title,
      slug: slugify(input.title),
      description: input.description ?? "",
      sortOrder: Date.now(),
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      spaceId: input.spaceId,
      title: input.title,
      type: "custom" as const,
    };
  },
};
