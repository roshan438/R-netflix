import {
  addDoc,
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { demoCategories, demoMediaItems } from "@/lib/demo-data";
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from "@/services/firebase/config";
import { slugify } from "@/services/utils/slugify";

export const categoryService = {
  async list(spaceId: string) {
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
  async getById(categoryId: string, spaceId?: string) {
    if (isFirebaseConfigured && firestoreDb) {
      const item = spaceId
        ? await getDoc(doc(firestoreDb, `spaces/${spaceId}/categories/${categoryId}`)).catch(() => null)
        : null;
      if (item?.exists()) {
        return {
          id: item.id,
          spaceId: String(item.data().spaceId ?? ""),
          name: String(item.data().name ?? ""),
          description: String(item.data().description ?? ""),
        };
      }

      const snapshot = await getDocs(
        query(collectionGroup(firestoreDb, "categories"), where("spaceId", "==", spaceId ?? "")),
      ).catch(() => null);
      const groupedItem = snapshot?.docs.find((entry) => entry.id === categoryId);
      const categoryItem = groupedItem;
      if (categoryItem) {
        return {
          id: categoryItem.id,
          spaceId: String(categoryItem.data().spaceId ?? ""),
          name: String(categoryItem.data().name ?? ""),
          description: String(categoryItem.data().description ?? ""),
        };
      }
    }
    return demoCategories.find((item) => item.id === categoryId);
  },
  async getItems(categoryId: string, spaceId?: string) {
    if (isFirebaseConfigured && firestoreDb) {
      const mediaCollection = spaceId
        ? collection(firestoreDb, `spaces/${spaceId}/mediaItems`)
        : collectionGroup(firestoreDb, "mediaItems");
      const snapshot = await getDocs(query(mediaCollection, where("categoryId", "==", categoryId)));
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
    return demoMediaItems.filter((item) => item.categoryId === categoryId);
  },
  async create(input: { spaceId: string; name: string; description?: string }) {
    if (!isFirebaseConfigured || !firestoreDb) {
      return {
        id: `category_${slugify(input.name)}`,
        spaceId: input.spaceId,
        name: input.name,
        description: input.description ?? "",
      };
    }

    const createdBy = firebaseAuth?.currentUser?.uid;
    if (!createdBy) {
      throw new Error("Please sign in again before creating a category.");
    }

    const docRef = await addDoc(collection(firestoreDb, `spaces/${input.spaceId}/categories`), {
      spaceId: input.spaceId,
      name: input.name,
      slug: slugify(input.name),
      description: input.description ?? "",
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: docRef.id,
      spaceId: input.spaceId,
      name: input.name,
      description: input.description ?? "",
    };
  },
};
