import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  where,
  collectionGroup,
  serverTimestamp,
} from "firebase/firestore";
import { demoCollections, demoMediaItems } from "@/lib/demo-data";
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from "@/services/firebase/config";
import { slugify } from "@/services/utils/slugify";

export const collectionService = {
  async list(spaceId: string) {
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
  async getById(collectionId: string, spaceId?: string) {
    if (isFirebaseConfigured && firestoreDb) {
      if (spaceId) {
        const item = await getDoc(doc(firestoreDb, `spaces/${spaceId}/collections/${collectionId}`));
        if (item.exists()) {
          const data = item.data();
          return {
            id: item.id,
            spaceId: String(data.spaceId ?? ""),
            title: String(data.title ?? ""),
            description: String(data.description ?? ""),
            categoryId: String(data.categoryId ?? ""),
            bannerUrl: String(data.bannerImageUrl ?? data.bannerUrl ?? ""),
            thumbnailUrl: String(data.thumbnailUrl ?? ""),
            seasonId: data.customSeasonId ? String(data.customSeasonId) : undefined,
            featured: Boolean(data.featured),
          };
        }
      }

      const snapshot = await getDocs(
        query(collectionGroup(firestoreDb, "collections"), where("spaceId", "==", spaceId ?? "")),
      ).catch(() => null);
      const item = snapshot?.docs.find((entry) => entry.id === collectionId);
      if (item) {
        const data = item.data();
        return {
          id: item.id,
          spaceId: String(data.spaceId ?? ""),
          title: String(data.title ?? ""),
          description: String(data.description ?? ""),
          categoryId: String(data.categoryId ?? ""),
          bannerUrl: String(data.bannerImageUrl ?? data.bannerUrl ?? ""),
          thumbnailUrl: String(data.thumbnailUrl ?? ""),
          seasonId: data.customSeasonId ? String(data.customSeasonId) : undefined,
          featured: Boolean(data.featured),
        };
      }
    }
    return demoCollections.find((item) => item.id === collectionId);
  },
  async getItems(collectionId: string, spaceId?: string) {
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
        .map((item) => ({
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
        }))
        .sort((a, b) => a.playbackOrder - b.playbackOrder);
    }
    return demoMediaItems
      .filter((item) => item.collectionId === collectionId)
      .sort((a, b) => a.playbackOrder - b.playbackOrder);
  },
  async create(input: {
    spaceId: string;
    title: string;
    description?: string;
    categoryId?: string;
    customSeasonId?: string;
  }) {
    if (!isFirebaseConfigured || !firestoreDb) {
      return {
        id: `collection_${slugify(input.title)}`,
        spaceId: input.spaceId,
        title: input.title,
        description: input.description ?? "",
        categoryId: input.categoryId ?? "",
        bannerUrl: "",
        thumbnailUrl: "",
        seasonId: input.customSeasonId,
        featured: false,
      };
    }

    const createdBy = firebaseAuth?.currentUser?.uid;
    if (!createdBy) {
      throw new Error("Please sign in again before creating a collection.");
    }

    const docRef = await addDoc(collection(firestoreDb, `spaces/${input.spaceId}/collections`), {
      spaceId: input.spaceId,
      title: input.title,
      slug: slugify(input.title),
      description: input.description ?? "",
      categoryId: input.categoryId ?? "",
      bannerImageUrl: "",
      thumbnailUrl: "",
      createdBy,
      customSeasonId: input.customSeasonId ?? null,
      featured: false,
      sortOrder: Date.now(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      spaceId: input.spaceId,
      title: input.title,
      description: input.description ?? "",
      categoryId: input.categoryId ?? "",
      bannerUrl: "",
      thumbnailUrl: "",
      seasonId: input.customSeasonId,
      featured: false,
    };
  },
};
