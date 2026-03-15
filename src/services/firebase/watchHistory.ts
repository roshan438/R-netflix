import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { firestoreDb, isFirebaseConfigured } from "@/services/firebase/config";

const COMPLETE_THRESHOLD_SECONDS = 8;

export const watchHistoryService = {
  async listHistory(spaceId: string, profileId: string) {
    if (!isFirebaseConfigured || !firestoreDb) return [] as Array<{
      mediaItemId: string;
      progressSeconds: number;
      durationSeconds: number;
      completed: boolean;
      percentComplete: number;
    }>;

    const snapshot = await getDocs(
      query(
        collection(firestoreDb, `spaces/${spaceId}/profiles/${profileId}/watchHistory`),
        orderBy("watchedAt", "desc"),
      ),
    ).catch(() => null);

    return (
      snapshot?.docs.map((item) => {
        const data = item.data();
        const durationSeconds = Number(data.durationSeconds ?? 0);
        const progressSeconds = Number(data.progressSeconds ?? 0);
        return {
          mediaItemId: String(data.mediaItemId ?? item.id),
          progressSeconds,
          durationSeconds,
          completed: Boolean(data.completed),
          percentComplete:
            durationSeconds > 0
              ? Math.min(Math.round((progressSeconds / durationSeconds) * 100), 100)
              : 0,
        };
      }) ?? []
    );
  },

  async getResumePoint(spaceId: string, profileId: string, mediaItemId: string) {
    if (!isFirebaseConfigured || !firestoreDb) return 0;
    const snapshot = await getDoc(
      doc(firestoreDb, `spaces/${spaceId}/profiles/${profileId}/continueWatching/${mediaItemId}`),
    );
    if (!snapshot.exists()) return 0;
    return Number(snapshot.data().progressSeconds ?? 0);
  },

  async saveProgress(input: {
    spaceId: string;
    profileId: string;
    mediaItemId: string;
    progressSeconds: number;
    durationSeconds: number;
  }) {
    if (!isFirebaseConfigured || !firestoreDb) return;

    const completed =
      input.durationSeconds > 0 &&
      input.progressSeconds >= Math.max(input.durationSeconds - COMPLETE_THRESHOLD_SECONDS, 1);

    await setDoc(
      doc(
        firestoreDb,
        `spaces/${input.spaceId}/profiles/${input.profileId}/watchHistory/${input.mediaItemId}`,
      ),
      {
        spaceId: input.spaceId,
        profileId: input.profileId,
        mediaItemId: input.mediaItemId,
        progressSeconds: Math.floor(input.progressSeconds),
        durationSeconds: Math.floor(input.durationSeconds),
        completed,
        watchedAt: serverTimestamp(),
      },
      { merge: true },
    );

    const continueRef = doc(
      firestoreDb,
      `spaces/${input.spaceId}/profiles/${input.profileId}/continueWatching/${input.mediaItemId}`,
    );

    if (completed) {
      await deleteDoc(continueRef).catch(() => undefined);
      return;
    }

    await setDoc(
      continueRef,
      {
        spaceId: input.spaceId,
        profileId: input.profileId,
        mediaItemId: input.mediaItemId,
        progressSeconds: Math.floor(input.progressSeconds),
        durationSeconds: Math.floor(input.durationSeconds),
        percentComplete:
          input.durationSeconds > 0
            ? Math.min(Math.round((input.progressSeconds / input.durationSeconds) * 100), 99)
            : 0,
        updatedAt: serverTimestamp(),
        completed: false,
      },
      { merge: true },
    );
  },
};
