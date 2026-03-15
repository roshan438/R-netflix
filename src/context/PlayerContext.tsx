import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { MediaItem } from "@/types/domain";

interface PlayerContextValue {
  activeMedia: MediaItem | null;
  setActiveMedia: (media: MediaItem | null) => void;
  introTransitioning: boolean;
  setIntroTransitioning: (value: boolean) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const [activeMedia, setActiveMedia] = useState<MediaItem | null>(null);
  const [introTransitioning, setIntroTransitioning] = useState(false);

  const value = useMemo(
    () => ({
      activeMedia,
      setActiveMedia,
      introTransitioning,
      setIntroTransitioning,
    }),
    [activeMedia, introTransitioning],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}
