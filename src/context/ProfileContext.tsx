import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { profileService } from "@/services/firebase/profiles";
import { useAuth } from "@/context/AuthContext";
import type { Profile } from "@/types/domain";

interface ProfileContextValue {
  profiles: Profile[];
  activeProfile: Profile | null;
  loading: boolean;
  setActiveProfile: (profile: Profile | null) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

const fallbackProfileContext: ProfileContextValue = {
  profiles: [],
  activeProfile: null,
  loading: false,
  setActiveProfile: () => undefined,
};

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { currentSpace } = useAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentSpace) {
      setProfiles([]);
      setActiveProfile(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    profileService.listProfiles(currentSpace.id).then((data) => {
      setProfiles(data);
      const storedId = window.localStorage.getItem("reverie.activeProfileId");
      const stored = data.find((profile) => profile.id === storedId) ?? null;
      setActiveProfile(stored);
    }).finally(() => setLoading(false));
  }, [currentSpace]);

  const value = useMemo(
    () => ({
      profiles,
      activeProfile,
      loading,
      setActiveProfile(profile: Profile | null) {
        setActiveProfile(profile);
        if (profile) {
          window.localStorage.setItem("reverie.activeProfileId", profile.id);
        } else {
          window.localStorage.removeItem("reverie.activeProfileId");
        }
      },
    }),
    [profiles, activeProfile, loading],
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  return ctx ?? fallbackProfileContext;
}
