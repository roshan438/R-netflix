import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MediaRail } from "@/components/home/MediaRail";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { mediaService } from "@/services/firebase/media";
import type { MediaItem } from "@/types/domain";

export function ContinueWatchingPage() {
  const { currentSpace } = useAuth();
  const { activeProfile } = useProfile();
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!activeProfile || !currentSpace) return;
    mediaService
      .listContinueWatching(activeProfile.id, currentSpace.id)
      .then((records) => setItems(records.map((record) => record.media)));
  }, [activeProfile, currentSpace]);

  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-gold/80">Resume</p>
        <h1 className="mt-3 font-display text-6xl text-white">Continue Watching</h1>
      </section>
      <MediaRail eyebrow="Resume" items={items} title="Pick Up Where You Left Off" />
    </DashboardLayout>
  );
}
