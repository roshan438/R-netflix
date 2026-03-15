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
import { demoSpaces } from "@/lib/demo-data";
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from "@/services/firebase/config";
import type { SpaceAccessRequest, SpaceSummary } from "@/types/domain";

function slugifySpaceInput(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "private-space";
}

async function deleteCollectionDocs(path: string) {
  if (!firestoreDb) return;
  const snapshot = await getDocs(collection(firestoreDb, path));
  await Promise.all(snapshot.docs.map((item) => deleteDoc(item.ref)));
}

export const spaceService = {
  async generateUniqueSpaceSlug(input: string) {
    const baseSlug = slugifySpaceInput(input);
    if (!isFirebaseConfigured || !firestoreDb) {
      return baseSlug;
    }

    let attempt = baseSlug;
    let suffix = 2;

    while (true) {
      const [spaceMatches, requestMatches] = await Promise.all([
        getDocs(query(collection(firestoreDb, "spaces"), where("slug", "==", attempt), limit(1))),
        getDocs(
          query(
            collection(firestoreDb, "spaceAccessRequests"),
            where("requestedSpaceSlug", "==", attempt),
            where("status", "==", "pending"),
            limit(1),
          ),
        ),
      ]);
      if (spaceMatches.empty && requestMatches.empty) {
        return attempt;
      }
      attempt = `${baseSlug}-${suffix}`;
      suffix += 1;
    }
  },

  async getSpaceBySlug(slug: string): Promise<SpaceSummary | null> {
    if (isFirebaseConfigured && firestoreDb) {
      const snapshot = await getDocs(
        query(collection(firestoreDb, "spaces"), where("slug", "==", slug), limit(1)),
      );
      const match = snapshot.docs[0];
      if (!match) return null;
      const data = match.data();
      return {
        id: match.id,
        slug: data.slug,
        name: data.name,
        description: data.description ?? "Private streaming space",
        featuredMediaId: data.featuredMediaId ?? "",
        branding: {
          logoWordmark: data.logoWordmark ?? `Reverie / ${data.name}`,
          accent: data.primaryColor ?? "#cfb07a",
          heroGradient:
            data.heroGradient ??
            "linear-gradient(135deg, rgba(207,176,122,0.32), rgba(255,141,109,0.18) 40%, rgba(18,27,47,0.94) 100%)",
        },
      };
    }
    return demoSpaces.find((space) => space.slug === slug) ?? demoSpaces[0];
  },

  async listSpaces() {
    if (isFirebaseConfigured && firestoreDb) {
      const snapshot = await getDocs(collection(firestoreDb, "spaces"));
      return snapshot.docs.map((spaceDoc) => {
        const data = spaceDoc.data();
        return {
          id: spaceDoc.id,
          slug: data.slug,
          name: data.name,
          description: data.description ?? "Private streaming space",
          featuredMediaId: data.featuredMediaId ?? "",
          branding: {
            logoWordmark: data.logoWordmark ?? `Reverie / ${data.name}`,
            accent: data.primaryColor ?? "#cfb07a",
            heroGradient:
              data.heroGradient ??
              "linear-gradient(135deg, rgba(207,176,122,0.32), rgba(255,141,109,0.18) 40%, rgba(18,27,47,0.94) 100%)",
          },
        } satisfies SpaceSummary;
      });
    }
    return demoSpaces;
  },

  async listPendingRequests() {
    if (!isFirebaseConfigured || !firestoreDb) {
      return [] as SpaceAccessRequest[];
    }

    const snapshot = await getDocs(
      query(collection(firestoreDb, "spaceAccessRequests"), where("status", "==", "pending")),
    );
    return snapshot.docs.map((requestDoc) => {
      const data = requestDoc.data();
      return {
        id: requestDoc.id,
        userId: String(data.userId ?? ""),
        email: String(data.email ?? ""),
        displayName: String(data.displayName ?? ""),
        requestedSpaceName: String(data.requestedSpaceName ?? ""),
        requestedSpaceSlug: String(data.requestedSpaceSlug ?? ""),
        status: "pending",
        authProvider: (data.authProvider as "google" | "password") ?? "password",
        assignedSpaceId: data.assignedSpaceId ? String(data.assignedSpaceId) : undefined,
      } satisfies SpaceAccessRequest;
    });
  },

  async approveRequest(requestId: string) {
    if (!isFirebaseConfigured || !firestoreDb) {
      throw new Error("Firebase is not configured.");
    }

    const actorId = firebaseAuth?.currentUser?.uid;
    if (!actorId) {
      throw new Error("Please sign in again before approving requests.");
    }

    const requestRef = doc(firestoreDb, "spaceAccessRequests", requestId);
    const requestSnapshot = await getDoc(requestRef);
    if (!requestSnapshot.exists()) {
      throw new Error("The signup request no longer exists.");
    }
    const request = requestSnapshot.data();
    const assignedSpaceId = `space_${String(request.requestedSpaceSlug).replace(/[^a-z0-9]+/gi, "_")}`;

    await setDoc(doc(firestoreDb, "spaces", assignedSpaceId), {
      name: request.requestedSpaceName,
      slug: request.requestedSpaceSlug,
      description: `Private streaming space for ${request.requestedSpaceName}`,
      ownerUserId: request.userId,
      status: "active",
      featuredMediaId: "",
      primaryColor: "#cfb07a",
      logoWordmark: `Reverie / ${request.requestedSpaceName}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(firestoreDb, `spaces/${assignedSpaceId}/spaceSettings/default`), {
      spaceId: assignedSpaceId,
      autoplayNextEnabled: true,
      introSoundEnabled: true,
      profileSelectionEnabled: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(firestoreDb, `spaces/${assignedSpaceId}/memberships/${request.userId}`), {
      spaceId: assignedSpaceId,
      email: request.email,
      userId: request.userId,
      role: "space_admin",
      status: "active",
      inviteStatus: "approved",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(firestoreDb, `spaces/${assignedSpaceId}/profiles/profile_${String(request.userId).slice(0, 8)}`), {
      spaceId: assignedSpaceId,
      name: request.displayName || String(request.email).split("@")[0],
      avatarUrl:
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
      subtitle: "Admin profile",
      createdBy: request.userId,
      isActive: true,
      sortOrder: 1,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(firestoreDb, "users", String(request.userId)), {
      defaultSpaceId: assignedSpaceId,
      requestStatus: "approved",
      pendingRequestId: null,
      requestedSpaceName: request.requestedSpaceName,
      requestedSpaceSlug: request.requestedSpaceSlug,
      assignedSpaceId,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(requestRef, {
      status: "approved",
      assignedSpaceId,
      approvedBy: actorId,
      approvedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  async rejectRequest(requestId: string) {
    if (!isFirebaseConfigured || !firestoreDb) {
      throw new Error("Firebase is not configured.");
    }

    const requestRef = doc(firestoreDb, "spaceAccessRequests", requestId);
    const requestSnapshot = await getDoc(requestRef);
    if (!requestSnapshot.exists()) return;
    const request = requestSnapshot.data();

    await updateDoc(requestRef, {
      status: "rejected",
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(firestoreDb, "users", String(request.userId)), {
      requestStatus: "rejected",
      pendingRequestId: null,
      assignedSpaceId: null,
      updatedAt: serverTimestamp(),
    }).catch(() => undefined);
  },

  async createSpace(input: {
    name: string;
    slug: string;
    description?: string;
    ownerEmail?: string;
  }) {
    if (!isFirebaseConfigured || !firestoreDb) {
      return {
        id: `space_${input.slug}`,
        slug: input.slug,
        name: input.name,
        description: input.description ?? "Private streaming space",
        featuredMediaId: "",
        branding: {
          logoWordmark: `Reverie / ${input.name}`,
          accent: "#cfb07a",
          heroGradient:
            "linear-gradient(135deg, rgba(207,176,122,0.32), rgba(255,141,109,0.18) 40%, rgba(18,27,47,0.94) 100%)",
        },
      } satisfies SpaceSummary;
    }

    const actorId = firebaseAuth?.currentUser?.uid;
    if (!actorId) {
      throw new Error("Please sign in again before creating a space.");
    }

    const existing = await getDocs(
      query(collection(firestoreDb, "spaces"), where("slug", "==", input.slug), limit(1)),
    );
    if (!existing.empty) {
      throw new Error("That space slug is already taken.");
    }

    const spaceRef = doc(collection(firestoreDb, "spaces"));
    await setDoc(spaceRef, {
      name: input.name,
      slug: input.slug,
      description: input.description ?? `Private streaming space for ${input.name}`,
      ownerUserId: actorId,
      status: "active",
      featuredMediaId: "",
      primaryColor: "#cfb07a",
      logoWordmark: `Reverie / ${input.name}`,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await setDoc(doc(firestoreDb, `spaces/${spaceRef.id}/spaceSettings/default`), {
      spaceId: spaceRef.id,
      autoplayNextEnabled: true,
      introSoundEnabled: true,
      profileSelectionEnabled: true,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (input.ownerEmail?.trim()) {
      await addDoc(collection(firestoreDb, `spaces/${spaceRef.id}/memberships`), {
        spaceId: spaceRef.id,
        email: input.ownerEmail.trim().toLowerCase(),
        role: "space_admin",
        status: "pending",
        inviteStatus: "pending",
        invitedBy: actorId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    return {
      id: spaceRef.id,
      slug: input.slug,
      name: input.name,
      description: input.description ?? `Private streaming space for ${input.name}`,
      featuredMediaId: "",
      branding: {
        logoWordmark: `Reverie / ${input.name}`,
        accent: "#cfb07a",
        heroGradient:
          "linear-gradient(135deg, rgba(207,176,122,0.32), rgba(255,141,109,0.18) 40%, rgba(18,27,47,0.94) 100%)",
      },
    } satisfies SpaceSummary;
  },

  async deleteSpace(spaceId: string) {
    if (!isFirebaseConfigured || !firestoreDb) {
      throw new Error("Firebase is not configured.");
    }
    const db = firestoreDb;

    const memberships = await getDocs(collection(db, `spaces/${spaceId}/memberships`));
    await Promise.all(
      memberships.docs.map(async (membership) => {
        const userId = membership.data().userId as string | undefined;
        if (userId) {
          await updateDoc(doc(db, "users", userId), {
            defaultSpaceId: null,
            assignedSpaceId: null,
            updatedAt: serverTimestamp(),
          }).catch(() => undefined);
        }
      }),
    );

    const profiles = await getDocs(collection(db, `spaces/${spaceId}/profiles`));
    await Promise.all(
      profiles.docs.map(async (profile) => {
        await deleteCollectionDocs(`spaces/${spaceId}/profiles/${profile.id}/favorites`);
        await deleteCollectionDocs(`spaces/${spaceId}/profiles/${profile.id}/continueWatching`);
        await deleteCollectionDocs(`spaces/${spaceId}/profiles/${profile.id}/watchHistory`);
        await deleteDoc(profile.ref);
      }),
    );

    await Promise.all([
      deleteCollectionDocs(`spaces/${spaceId}/memberships`),
      deleteCollectionDocs(`spaces/${spaceId}/mediaItems`),
      deleteCollectionDocs(`spaces/${spaceId}/mediaAssets`),
      deleteCollectionDocs(`spaces/${spaceId}/collections`),
      deleteCollectionDocs(`spaces/${spaceId}/categories`),
      deleteCollectionDocs(`spaces/${spaceId}/seasons`),
      deleteCollectionDocs(`spaces/${spaceId}/invites`),
      deleteCollectionDocs(`spaces/${spaceId}/spaceSettings`),
      deleteCollectionDocs(`spaces/${spaceId}/activityLogs`),
    ]);

    await deleteDoc(doc(db, "spaces", spaceId));
  },
};
