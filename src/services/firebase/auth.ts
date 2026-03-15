import {
  GoogleAuthProvider,
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  collection,
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
import { demoSpaces, demoUser } from "@/lib/demo-data";
import { firebaseAuth, firestoreDb, isFirebaseConfigured } from "@/services/firebase/config";
import { spaceService } from "@/services/firebase/spaces";
import type { SpaceAccessRequest, SpaceSummary, UserAccount } from "@/types/domain";

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account",
});
googleProvider.addScope("email");
googleProvider.addScope("profile");

function toSpaceId(slug: string) {
  return `space_${slug.replace(/[^a-z0-9]+/gi, "_").replace(/^_+|_+$/g, "").toLowerCase()}`;
}

function slugifySpaceInput(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "private-space";
}

function titleCaseFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function syncUserDoc(user: User) {
  if (!firestoreDb) return;
  const userRef = doc(firestoreDb, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const existing = snapshot.data();
  await setDoc(
    userRef,
    {
      email: user.email ?? "",
      displayName: user.displayName ?? user.email?.split("@")[0] ?? "Reverie User",
      photoURL: user.photoURL ?? existing?.photoURL ?? null,
      platformRole: existing?.platformRole ?? "none",
      status: existing?.status ?? "active",
      defaultSpaceId: existing?.defaultSpaceId ?? null,
      requestStatus: existing?.requestStatus ?? null,
      pendingRequestId: existing?.pendingRequestId ?? null,
      requestedSpaceName: existing?.requestedSpaceName ?? null,
      requestedSpaceSlug: existing?.requestedSpaceSlug ?? null,
      assignedSpaceId: existing?.assignedSpaceId ?? null,
      createdAt: existing?.createdAt ?? serverTimestamp(),
      updatedAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
    },
    { merge: true },
  );
}

async function resolveMembershipByUid(spaceId: string, uid: string) {
  if (!firestoreDb) return null;
  const membershipRef = doc(firestoreDb, `spaces/${spaceId}/memberships/${uid}`);
  const snapshot = await getDoc(membershipRef);
  if (!snapshot.exists()) return null;
  const data = snapshot.data();
  return {
    ref: membershipRef,
    id: snapshot.id,
    role: data.role as "space_admin" | "member",
    status: data.status as string,
  };
}

async function resolveMembershipByEmail(spaceId: string, email: string) {
  if (!firestoreDb) return null;
  const membershipsRef = collection(firestoreDb, `spaces/${spaceId}/memberships`);
  const snapshot = await getDocs(
    query(membershipsRef, where("email", "==", email.toLowerCase()), limit(1)),
  );
  const membership = snapshot.docs[0];
  if (!membership) return null;
  const data = membership.data();
  return {
    ref: membership.ref,
    id: membership.id,
    role: data.role as "space_admin" | "member",
    status: data.status as string,
    userId: data.userId as string | undefined,
  };
}

async function ensureProfileForMember(
  spaceId: string,
  firebaseUser: User,
  membershipRole: "space_admin" | "member",
) {
  if (!firestoreDb) return;
  const profilesRef = collection(firestoreDb, `spaces/${spaceId}/profiles`);
  const existing = await getDocs(
    query(profilesRef, where("createdBy", "==", firebaseUser.uid), limit(1)),
  );

  if (!existing.empty) return;

  const allProfiles = await getDocs(query(profilesRef, limit(100)));
  const sortOrder = allProfiles.size + 1;
  const fallbackName =
    firebaseUser.displayName ??
    firebaseUser.email?.split("@")[0] ??
    (membershipRole === "space_admin" ? "Admin" : "Member");

  await setDoc(
    doc(firestoreDb, `spaces/${spaceId}/profiles/profile_${firebaseUser.uid.slice(0, 8)}`),
    {
      spaceId,
      name: fallbackName,
      avatarUrl:
        firebaseUser.photoURL ??
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
      subtitle: membershipRole === "space_admin" ? "Admin profile" : "Personal watch history and favorites",
      createdBy: firebaseUser.uid,
      isActive: true,
      sortOrder,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

async function findExistingPendingRequest(userId: string) {
  if (!firestoreDb) return null;
  const snapshot = await getDocs(
    query(
      collection(firestoreDb, "spaceAccessRequests"),
      where("userId", "==", userId),
      where("status", "==", "pending"),
      limit(1),
    ),
  );
  const requestDoc = snapshot.docs[0];
  if (!requestDoc) return null;
  const data = requestDoc.data();
  return {
    id: requestDoc.id,
    userId: String(data.userId ?? ""),
    email: String(data.email ?? ""),
    displayName: String(data.displayName ?? ""),
    requestedSpaceName: String(data.requestedSpaceName ?? ""),
    requestedSpaceSlug: String(data.requestedSpaceSlug ?? ""),
    status: "pending" as const,
    authProvider: (data.authProvider as "google" | "password") ?? "password",
    assignedSpaceId: data.assignedSpaceId ? String(data.assignedSpaceId) : undefined,
  } satisfies SpaceAccessRequest;
}

async function createApprovalRequest(
  firebaseUser: User,
  desiredSpaceInput: string,
  authProvider: "google" | "password",
) {
  if (!firestoreDb) {
    throw new Error("Firestore is not configured.");
  }

  const requestedSpaceSlug = await spaceService.generateUniqueSpaceSlug(desiredSpaceInput);
  const requestedSpaceName =
    desiredSpaceInput.trim() || titleCaseFromSlug(requestedSpaceSlug);

  const existingRequest = await findExistingPendingRequest(firebaseUser.uid);
  if (existingRequest) {
    await updateDoc(doc(firestoreDb, "users", firebaseUser.uid), {
      requestStatus: "pending",
      pendingRequestId: existingRequest.id,
      requestedSpaceName: existingRequest.requestedSpaceName,
      requestedSpaceSlug: existingRequest.requestedSpaceSlug,
      updatedAt: serverTimestamp(),
    });
    return existingRequest;
  }

  const requestRef = doc(collection(firestoreDb, "spaceAccessRequests"));
  await setDoc(requestRef, {
    userId: firebaseUser.uid,
    email: firebaseUser.email?.toLowerCase() ?? "",
    displayName:
      firebaseUser.displayName ?? firebaseUser.email?.split("@")[0] ?? "Reverie User",
    requestedSpaceName,
    requestedSpaceSlug,
    status: "pending",
    authProvider,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await updateDoc(doc(firestoreDb, "users", firebaseUser.uid), {
    defaultSpaceId: null,
    requestStatus: "pending",
    pendingRequestId: requestRef.id,
    requestedSpaceName,
    requestedSpaceSlug,
    updatedAt: serverTimestamp(),
  });

  return {
    id: requestRef.id,
    userId: firebaseUser.uid,
    email: firebaseUser.email?.toLowerCase() ?? "",
    displayName:
      firebaseUser.displayName ?? firebaseUser.email?.split("@")[0] ?? "Reverie User",
    requestedSpaceName,
    requestedSpaceSlug,
    status: "pending",
    authProvider,
  } satisfies SpaceAccessRequest;
}

async function toFriendlyAuthError(error: unknown, email?: string) {
  const code =
    typeof error === "object" && error && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  if (
    firebaseAuth &&
    email &&
    (code === "auth/invalid-credential" ||
      code === "auth/wrong-password" ||
      code === "auth/user-not-found" ||
      code === "auth/invalid-login-credentials")
  ) {
    const methods = (await fetchSignInMethodsForEmail(firebaseAuth, email).catch(
      () => [],
    )) as string[];
    if (methods.includes("google.com") && !methods.includes("password")) {
      return new Error("This account uses Google sign-in. Please click Continue with Google.");
    }
  }

  if (code === "auth/email-already-in-use") {
    return new Error("That email is already registered. Sign in instead, or use Google if that is how you created it.");
  }

  if (code === "auth/popup-closed-by-user") {
    return new Error("Google sign-in was closed before it finished.");
  }

  if (code === "auth/popup-blocked") {
    return new Error("Your browser blocked the Google sign-in popup. Please allow popups and try again.");
  }

  return error instanceof Error
    ? error
    : new Error("Authentication failed. Please try again.");
}

async function resolveAccountForSpace(
  firebaseUser: User,
  spaceSlug: string,
  authProvider: "google" | "password",
): Promise<{ account: UserAccount; space: SpaceSummary | null }> {
  if (!isFirebaseConfigured || !firestoreDb) {
    const space = (await spaceService.getSpaceBySlug(spaceSlug)) ?? demoSpaces[0];
    return {
      account: {
        ...demoUser,
        id: firebaseUser.uid,
        email: firebaseUser.email ?? demoUser.email,
        displayName:
          firebaseUser.displayName ?? firebaseUser.email?.split("@")[0] ?? demoUser.displayName,
        photoURL: firebaseUser.photoURL ?? undefined,
      },
      space,
    };
  }

  await syncUserDoc(firebaseUser);
  const requestedSlug = slugifySpaceInput(spaceSlug);
  const space = await spaceService.getSpaceBySlug(requestedSlug);

  const email = firebaseUser.email?.toLowerCase();
  if (!email) {
    throw new Error("Your Firebase account does not have an email address.");
  }

  if (!space) {
    const pendingRequest = await createApprovalRequest(firebaseUser, spaceSlug, authProvider);
    return {
      account: {
        id: firebaseUser.uid,
        email,
        displayName: firebaseUser.displayName ?? email.split("@")[0],
        photoURL: firebaseUser.photoURL ?? undefined,
        platformRole: "none",
        defaultSpaceId: undefined,
        pendingApproval: {
          requestId: pendingRequest.id,
          status: pendingRequest.status,
          requestedSpaceName: pendingRequest.requestedSpaceName,
          requestedSpaceSlug: pendingRequest.requestedSpaceSlug,
        },
        memberships: [],
      },
      space: null,
    };
  }

  const existingByUid = await resolveMembershipByUid(space.id, firebaseUser.uid);
  const membership =
    existingByUid ?? (await resolveMembershipByEmail(space.id, email));

  if (!membership || membership.status === "revoked" || membership.status === "suspended") {
    throw new Error("This private space is not assigned to your account. Wait for approval or ask your admin to invite this email.");
  }

  if (membership.ref.id !== firebaseUser.uid) {
    await updateDoc(membership.ref, {
      userId: firebaseUser.uid,
      status: "active",
      updatedAt: serverTimestamp(),
    });
  }

  const userSnapshot = await getDoc(doc(firestoreDb, "users", firebaseUser.uid));
  const userData = userSnapshot.data();

  if (!userData?.defaultSpaceId) {
    await updateDoc(doc(firestoreDb, "users", firebaseUser.uid), {
      defaultSpaceId: space.id,
      updatedAt: serverTimestamp(),
    });
  }

  await ensureProfileForMember(space.id, firebaseUser, membership.role);

  const account: UserAccount = {
    id: firebaseUser.uid,
    email,
    displayName:
      firebaseUser.displayName ??
      userData?.displayName ??
      email.split("@")[0],
    photoURL: firebaseUser.photoURL ?? userData?.photoURL ?? undefined,
    platformRole: userData?.platformRole === "super_admin" ? "super_admin" : "none",
    defaultSpaceId: userData?.defaultSpaceId ?? space.id,
    pendingApproval: undefined,
    memberships: [
      {
        spaceId: space.id,
        role: membership.role,
      },
    ],
  };

  return { account, space };
}

export const authService = {
  subscribe(
    onChange: (payload: { account: UserAccount | null; space: SpaceSummary | null }) => void,
  ) {
    if (!isFirebaseConfigured || !firebaseAuth) {
      onChange({ account: null, space: null });
      return () => undefined;
    }

    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        onChange({ account: null, space: null });
        return;
      }

      try {
        await syncUserDoc(firebaseUser);
        const userSnapshot = await getDoc(doc(firestoreDb!, "users", firebaseUser.uid));
        const userData = userSnapshot.data();
        const defaultSpaceId = userData?.defaultSpaceId as string | undefined;

        if (!defaultSpaceId) {
          const pendingApproval =
            userData?.requestStatus === "pending"
              ? {
                  requestId: String(userData?.pendingRequestId ?? ""),
                  status: "pending" as const,
                  requestedSpaceName: String(userData?.requestedSpaceName ?? "Private Space"),
                  requestedSpaceSlug: String(userData?.requestedSpaceSlug ?? ""),
                  assignedSpaceId: userData?.assignedSpaceId ? String(userData.assignedSpaceId) : undefined,
                }
              : undefined;
          onChange({
            account: {
              id: firebaseUser.uid,
              email: firebaseUser.email ?? "",
              displayName:
                firebaseUser.displayName ??
                firebaseUser.email?.split("@")[0] ??
                "Reverie User",
              photoURL: firebaseUser.photoURL ?? undefined,
              platformRole:
                userData?.platformRole === "super_admin" ? "super_admin" : "none",
              defaultSpaceId: undefined,
              pendingApproval,
              memberships: [],
            },
            space: null,
          });
          return;
        }

        const spaces = await spaceService.listSpaces();
        const space = spaces.find((item) => item.id === defaultSpaceId) ?? null;
        const membership = space
          ? await resolveMembershipByUid(space.id, firebaseUser.uid)
          : null;

        onChange({
          account: {
            id: firebaseUser.uid,
            email: firebaseUser.email ?? "",
            displayName:
              firebaseUser.displayName ??
              userData?.displayName ??
              firebaseUser.email?.split("@")[0] ??
              "Reverie User",
            photoURL: firebaseUser.photoURL ?? userData?.photoURL ?? undefined,
            platformRole:
              userData?.platformRole === "super_admin" ? "super_admin" : "none",
            defaultSpaceId,
            pendingApproval:
              userData?.requestStatus === "pending"
                ? {
                    requestId: String(userData?.pendingRequestId ?? ""),
                    status: "pending",
                    requestedSpaceName: String(userData?.requestedSpaceName ?? "Private Space"),
                    requestedSpaceSlug: String(userData?.requestedSpaceSlug ?? ""),
                    assignedSpaceId: userData?.assignedSpaceId ? String(userData.assignedSpaceId) : undefined,
                  }
                : undefined,
            memberships:
              space && membership
                ? [{ spaceId: space.id, role: membership.role }]
                : [],
          },
          space,
        });
      } catch {
        onChange({ account: null, space: null });
      }
    });
  },

  async signInWithSpace(email: string, password: string, spaceSlug: string) {
    if (!isFirebaseConfigured || !firebaseAuth) {
      return {
        account: {
          ...demoUser,
          email,
        },
        space: (await spaceService.getSpaceBySlug(spaceSlug)) ?? demoSpaces[0],
      };
    }

    try {
      await setPersistence(firebaseAuth, browserLocalPersistence);
      const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
      return resolveAccountForSpace(credential.user, spaceSlug, "password");
    } catch (error) {
      throw await toFriendlyAuthError(error, email);
    }
  },

  async signUpWithSpace(email: string, password: string, spaceSlug: string) {
    if (!isFirebaseConfigured || !firebaseAuth) {
      return {
        account: {
          ...demoUser,
          email,
        },
        space: (await spaceService.getSpaceBySlug(spaceSlug)) ?? demoSpaces[0],
      };
    }

    try {
      await setPersistence(firebaseAuth, browserLocalPersistence);
      const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      return resolveAccountForSpace(credential.user, spaceSlug, "password");
    } catch (error) {
      throw await toFriendlyAuthError(error, email);
    }
  },

  async signInWithGoogle(spaceSlug: string) {
    if (!isFirebaseConfigured || !firebaseAuth) {
      return {
        account: demoUser,
        space: (await spaceService.getSpaceBySlug(spaceSlug)) ?? demoSpaces[0],
      };
    }

    try {
      await setPersistence(firebaseAuth, browserLocalPersistence);
      const credential = await signInWithPopup(firebaseAuth, googleProvider);
      return resolveAccountForSpace(credential.user, spaceSlug, "google");
    } catch (error) {
      throw await toFriendlyAuthError(error);
    }
  },

  async signOut() {
    if (firebaseAuth) {
      await firebaseSignOut(firebaseAuth);
    }
    return Promise.resolve();
  },
};
