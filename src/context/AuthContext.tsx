import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { authService } from "@/services/firebase/auth";
import type { SpaceSummary, UserAccount } from "@/types/domain";

const LAST_SPACE_SLUG_KEY = "reverie.lastSpaceSlug";
const LAST_ACTIVITY_KEY = "reverie.lastActivityAt";
const INACTIVITY_TIMEOUT_MS = 3 * 60 * 60 * 1000;

interface AuthContextValue {
  user: UserAccount | null;
  currentSpace: SpaceSummary | null;
  loading: boolean;
  rememberedSpaceSlug: string;
  signIn: (args: {
    email: string;
    password: string;
    spaceSlug: string;
  }) => Promise<{ account: UserAccount; space: SpaceSummary | null }>;
  signUp: (args: {
    email: string;
    password: string;
    spaceSlug: string;
  }) => Promise<{ account: UserAccount; space: SpaceSummary | null }>;
  signInWithGoogle: (spaceSlug: string) => Promise<{ account: UserAccount; space: SpaceSummary | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserAccount | null>(null);
  const [currentSpace, setCurrentSpace] = useState<SpaceSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [rememberedSpaceSlug, setRememberedSpaceSlug] = useState(() =>
    typeof window !== "undefined" ? window.localStorage.getItem(LAST_SPACE_SLUG_KEY) ?? "" : "",
  );

  useEffect(() => {
    const unsubscribe = authService.subscribe(({ account, space }) => {
      setUser(account);
      setCurrentSpace(space);
      if (space?.slug) {
        window.localStorage.setItem(LAST_SPACE_SLUG_KEY, space.slug);
        setRememberedSpaceSlug(space.slug);
      } else if (account?.pendingApproval?.requestedSpaceSlug) {
        window.localStorage.setItem(LAST_SPACE_SLUG_KEY, account.pendingApproval.requestedSpaceSlug);
        setRememberedSpaceSlug(account.pendingApproval.requestedSpaceSlug);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      window.localStorage.removeItem(LAST_ACTIVITY_KEY);
      return;
    }

    const touchSession = () => {
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    };

    const checkExpiry = () => {
      const lastActivity = Number(window.localStorage.getItem(LAST_ACTIVITY_KEY) ?? "0");
      if (lastActivity && Date.now() - lastActivity >= INACTIVITY_TIMEOUT_MS) {
        void authService.signOut().finally(() => {
          window.localStorage.removeItem(LAST_ACTIVITY_KEY);
          window.localStorage.removeItem("reverie.activeProfileId");
          setUser(null);
          setCurrentSpace(null);
        });
      }
    };

    touchSession();
    const events: Array<keyof WindowEventMap> = [
      "pointerdown",
      "pointermove",
      "keydown",
      "scroll",
      "touchstart",
    ];

    const handleActivity = () => {
      if (document.visibilityState === "hidden") return;
      touchSession();
    };

    events.forEach((eventName) => {
      window.addEventListener(eventName, handleActivity, { passive: true });
    });
    document.addEventListener("visibilitychange", handleActivity);

    const timer = window.setInterval(checkExpiry, 60_000);
    checkExpiry();

    return () => {
      events.forEach((eventName) => {
        window.removeEventListener(eventName, handleActivity);
      });
      document.removeEventListener("visibilitychange", handleActivity);
      window.clearInterval(timer);
    };
  }, [user]);

  const value = useMemo(
    () => ({
      user,
      currentSpace,
      loading,
      rememberedSpaceSlug,
      async signIn({
        email,
        password,
        spaceSlug,
      }: {
        email: string;
        password: string;
        spaceSlug: string;
      }) {
        setLoading(true);
        try {
          const { account, space } = await authService.signInWithSpace(
            email,
            password,
            spaceSlug,
          );
          setUser(account);
          setCurrentSpace(space);
          return { account, space };
        } finally {
          setLoading(false);
        }
      },
      async signUp({
        email,
        password,
        spaceSlug,
      }: {
        email: string;
        password: string;
        spaceSlug: string;
      }) {
        setLoading(true);
        try {
          const { account, space } = await authService.signUpWithSpace(
            email,
            password,
            spaceSlug,
          );
          setUser(account);
          setCurrentSpace(space);
          return { account, space };
        } finally {
          setLoading(false);
        }
      },
      async signInWithGoogle(spaceSlug: string) {
        setLoading(true);
        try {
          const { account, space } = await authService.signInWithGoogle(spaceSlug);
          setUser(account);
          setCurrentSpace(space);
          return { account, space };
        } finally {
          setLoading(false);
        }
      },
      async signOut() {
        await authService.signOut();
        window.localStorage.removeItem(LAST_ACTIVITY_KEY);
        window.localStorage.removeItem("reverie.activeProfileId");
        setUser(null);
        setCurrentSpace(null);
      },
    }),
    [user, currentSpace, loading, rememberedSpaceSlug],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
