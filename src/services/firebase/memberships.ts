import {
  collection,
  getDocs,
  limit,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { firestoreDb, isFirebaseConfigured } from "@/services/firebase/config";

export interface SpaceMemberRecord {
  id: string;
  email: string;
  role: "space_admin" | "member";
  status: string;
  userId?: string;
}

export const membershipService = {
  async listMembers(spaceId: string): Promise<SpaceMemberRecord[]> {
    if (!isFirebaseConfigured || !firestoreDb) {
      return [];
    }

    const snapshot = await getDocs(collection(firestoreDb, `spaces/${spaceId}/memberships`));
    return snapshot.docs
      .map((item) => {
        const data = item.data();
        return {
          id: item.id,
          email: String(data.email ?? ""),
          role: (data.role as "space_admin" | "member") ?? "member",
          status: String(data.status ?? "pending"),
          userId: data.userId ? String(data.userId) : undefined,
        } satisfies SpaceMemberRecord;
      })
      .sort((a, b) => a.email.localeCompare(b.email));
  },

  async revokeMember(spaceId: string, email: string) {
    if (!isFirebaseConfigured || !firestoreDb) {
      return;
    }

    const membershipsRef = collection(firestoreDb, `spaces/${spaceId}/memberships`);
    const snapshot = await getDocs(
      query(membershipsRef, where("email", "==", email.toLowerCase()), limit(1)),
    );
    const membershipDoc = snapshot.docs[0];
    if (!membershipDoc) return;

    await updateDoc(membershipDoc.ref, {
      status: "revoked",
      inviteStatus: "revoked",
      updatedAt: serverTimestamp(),
    });
  },
  async updateRole(spaceId: string, email: string, role: "space_admin" | "member") {
    if (!isFirebaseConfigured || !firestoreDb) {
      return;
    }

    const membershipsRef = collection(firestoreDb, `spaces/${spaceId}/memberships`);
    const snapshot = await getDocs(
      query(membershipsRef, where("email", "==", email.toLowerCase()), limit(1)),
    );
    const membershipDoc = snapshot.docs[0];
    if (!membershipDoc) return;

    await updateDoc(membershipDoc.ref, {
      role,
      updatedAt: serverTimestamp(),
    });
  },
};
