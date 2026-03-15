import {
  collection,
  getDocs,
  orderBy,
  query,
} from "firebase/firestore";
import { demoProfiles } from "@/lib/demo-data";
import { firestoreDb, isFirebaseConfigured } from "@/services/firebase/config";
import type { Profile } from "@/types/domain";

export const profileService = {
  async listProfiles(spaceId: string): Promise<Profile[]> {
    if (isFirebaseConfigured && firestoreDb) {
      const snapshot = await getDocs(
        query(
          collection(firestoreDb, `spaces/${spaceId}/profiles`),
          orderBy("sortOrder", "asc"),
        ),
      );

      return snapshot.docs.map((profileDoc) => {
        const data = profileDoc.data();
        return {
          id: profileDoc.id,
          spaceId,
          name: data.name ?? "Profile",
          avatarUrl:
            data.avatarUrl ??
            "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
          subtitle:
            data.subtitle ??
            (data.isKids ? "Kids profile" : "Personal watch history and favorites"),
          sortOrder: typeof data.sortOrder === "number" ? data.sortOrder : 0,
        } satisfies Profile;
      });
    }

    return demoProfiles
      .filter((profile) => profile.spaceId === spaceId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },
};
