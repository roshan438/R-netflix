import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MediaRail } from "@/components/home/MediaRail";
import { useAuth } from "@/context/AuthContext";
import { seasonService } from "@/services/firebase/seasons";
import type { MediaItem, Season } from "@/types/domain";

export function SeasonPage() {
  const { seasonId = "" } = useParams();
  const { currentSpace } = useAuth();
  const [season, setSeason] = useState<Season | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!currentSpace || !seasonId) return;
    seasonService.getById(seasonId, currentSpace.id).then((item) => setSeason(item ?? null));
    seasonService.getItems(seasonId, currentSpace.id).then(setItems);
  }, [currentSpace, seasonId]);

  if (!season) {
    return (
      <DashboardLayout>
        <div className="glass-panel rounded-[2rem] p-8 text-white/65">Loading season...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-gold/80">Season</p>
        <h1 className="mt-3 font-display text-6xl text-white">{season.title}</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/65">
          {season.type === "auto_year"
            ? "Automatically grouped from memory dates."
            : "A curated narrative season from your shared life."}
        </p>
      </section>
      <MediaRail eyebrow="Season Arc" items={items} title={season.title} />
    </DashboardLayout>
  );
}
