import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { callFunction } from "@/services/firebase/callables";
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from "@/services/firebase/config";

export const inviteService = {
  async createInvite(input: {
    email: string;
    role: "member" | "space_admin";
    spaceId: string;
    spaceSlug: string;
  }) {
    const email = input.email.trim().toLowerCase();
    const token = crypto.randomUUID();
    const link = `${window.location.origin}/invite/${input.spaceSlug}/${token}`;

    if (!isFirebaseConfigured || !firestoreDb) {
      return {
        id: token,
        email,
        role: input.role,
        link,
      };
    }

    const userId = firebaseAuth?.currentUser?.uid;
    if (!userId) {
      throw new Error("Please sign in again before creating an invite.");
    }

    const membershipsRef = collection(firestoreDb, `spaces/${input.spaceId}/memberships`);
    const existingMembershipSnapshot = await getDocs(
      query(membershipsRef, where("email", "==", email), limit(1)),
    );
    const existingMembership = existingMembershipSnapshot.docs[0];

    const membershipPayload = {
      spaceId: input.spaceId,
      email,
      role: input.role,
      status: "pending",
      inviteStatus: "pending",
      invitedBy: userId,
      updatedAt: serverTimestamp(),
      createdAt: existingMembership?.data().createdAt ?? serverTimestamp(),
    };

    if (existingMembership) {
      await updateDoc(existingMembership.ref, membershipPayload);
    } else {
      await addDoc(membershipsRef, membershipPayload);
    }

    await setDoc(doc(firestoreDb, `spaces/${input.spaceId}/invites/${token}`), {
      spaceId: input.spaceId,
      spaceSlug: input.spaceSlug,
      email,
      role: input.role,
      tokenHash: token,
      status: "pending",
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdBy: userId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      id: token,
      email,
      role: input.role,
      link,
    };
  },
  async getInvite(spaceId: string, token: string) {
    if (!isFirebaseConfigured || !firestoreDb) {
      return {
        id: token,
        email: "",
        role: "member" as const,
        status: "pending",
      };
    }

    const snapshot = await getDoc(doc(firestoreDb, `spaces/${spaceId}/invites/${token}`));
    if (!snapshot.exists()) return null;
    const data = snapshot.data();

    return {
      id: snapshot.id,
      email: String(data.email ?? ""),
      role: (data.role as "member" | "space_admin") ?? "member",
      status: String(data.status ?? "pending"),
    };
  },
  async listInvites(spaceId: string) {
    if (!isFirebaseConfigured || !firestoreDb) {
      return [];
    }

    const snapshot = await getDocs(collection(firestoreDb, `spaces/${spaceId}/invites`));
    return snapshot.docs
      .map((item) => {
        const data = item.data();
        return {
          id: item.id,
          email: String(data.email ?? ""),
          role: (data.role as "member" | "space_admin") ?? "member",
          status: String(data.status ?? "pending"),
          createdAt:
            typeof data.createdAt?.toMillis === "function" ? data.createdAt.toMillis() : 0,
          link: `${window.location.origin}/invite/${String(data.spaceSlug ?? "") || ""}/${item.id}`,
        };
      })
      .filter((item) => item.email && item.status !== "revoked")
      .sort((a, b) => b.createdAt - a.createdAt);
  },
  async sendInviteEmail(input: { spaceId: string; email: string; inviteLink: string }) {
    if (!isFirebaseConfigured || !firestoreDb) {
      return { sent: false, reason: "firebase_not_configured" };
    }

    return callFunction<typeof input, { sent: boolean; reason?: string }>("sendInviteEmail", input);
  },
  async revokeInvite(input: { spaceId: string; inviteId: string; email: string }) {
    if (!isFirebaseConfigured || !firestoreDb) {
      return;
    }

    await deleteDoc(doc(firestoreDb, `spaces/${input.spaceId}/invites/${input.inviteId}`));

    const membershipsRef = collection(firestoreDb, `spaces/${input.spaceId}/memberships`);
    const membershipSnapshot = await getDocs(
      query(membershipsRef, where("email", "==", input.email.toLowerCase()), limit(1)),
    );
    const membershipDoc = membershipSnapshot.docs[0];
    if (membershipDoc) {
      await updateDoc(membershipDoc.ref, {
        status: "revoked",
        inviteStatus: "revoked",
        updatedAt: serverTimestamp(),
      });
    }
  },
};
