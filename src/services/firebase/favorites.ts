import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firestoreDb, isFirebaseConfigured } from "@/services/firebase/config";

export const favoritesService = {
  async isFavorite(spaceId: string, profileId: string, mediaItemId: string) {
    if (!isFirebaseConfigured || !firestoreDb) return false;
    const snapshot = await getDoc(
      doc(firestoreDb, `spaces/${spaceId}/profiles/${profileId}/favorites/${mediaItemId}`),
    );
    return snapshot.exists();
  },

  async toggleFavorite(spaceId: string, profileId: string, mediaItemId: string) {
    if (!isFirebaseConfigured || !firestoreDb) {
      return { favorite: true };
    }

    const ref = doc(firestoreDb, `spaces/${spaceId}/profiles/${profileId}/favorites/${mediaItemId}`);
    const snapshot = await getDoc(ref);

    if (snapshot.exists()) {
      await deleteDoc(ref);
      return { favorite: false };
    }

    await setDoc(ref, {
      spaceId,
      profileId,
      mediaItemId,
      createdAt: serverTimestamp(),
    });
    return { favorite: true };
  },
};
