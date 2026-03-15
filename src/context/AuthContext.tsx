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

interface AuthContextValue {
  user: UserAccount | null;
  currentSpace: SpaceSummary | null;
  loading: boolean;
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

  useEffect(() => {
    const unsubscribe = authService.subscribe(({ account, space }) => {
      setUser(account);
      setCurrentSpace(space);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      user,
      currentSpace,
      loading,
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
        const { account, space } = await authService.signInWithSpace(
          email,
          password,
          spaceSlug,
        );
        setUser(account);
        setCurrentSpace(space);
        setLoading(false);
        return { account, space };
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
        const { account, space } = await authService.signUpWithSpace(
          email,
          password,
          spaceSlug,
        );
        setUser(account);
        setCurrentSpace(space);
        setLoading(false);
        return { account, space };
      },
      async signInWithGoogle(spaceSlug: string) {
        setLoading(true);
        const { account, space } = await authService.signInWithGoogle(spaceSlug);
        setUser(account);
        setCurrentSpace(space);
        setLoading(false);
        return { account, space };
      },
      async signOut() {
        await authService.signOut();
        setUser(null);
        setCurrentSpace(null);
      },
    }),
    [user, currentSpace, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
