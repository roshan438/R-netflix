import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MediaRail } from "@/components/home/MediaRail";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { mediaService } from "@/services/firebase/media";
import type { MediaItem } from "@/types/domain";

export function FavoritesPage() {
  const { currentSpace } = useAuth();
  const { activeProfile } = useProfile();
  const [favorites, setFavorites] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!activeProfile || !currentSpace) return;
    mediaService.listFavorites(activeProfile.id, currentSpace.id).then(setFavorites);
  }, [activeProfile, currentSpace]);

  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-gold/80">Favorites</p>
        <h1 className="mt-3 font-display text-6xl text-white">My List</h1>
      </section>
      <MediaRail eyebrow="Saved" items={favorites} title="Keep Close" />
    </DashboardLayout>
  );
}
