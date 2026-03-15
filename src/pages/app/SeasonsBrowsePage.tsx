import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { TaxonomyGrid } from "@/components/home/TaxonomyGrid";
import { useAuth } from "@/context/AuthContext";
import { seasonService } from "@/services/firebase/seasons";
import type { Season } from "@/types/domain";

export function SeasonsBrowsePage() {
  const { currentSpace } = useAuth();
  const [seasons, setSeasons] = useState<Season[]>([]);

  useEffect(() => {
    if (!currentSpace) return;
    seasonService.list(currentSpace.id).then(setSeasons);
  }, [currentSpace]);

  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-gold/80">Browse</p>
        <h1 className="mt-3 font-display text-6xl text-white">Seasons</h1>
        <p className="mt-4 text-sm leading-7 text-white/65">
          Explore memories by year or by hand-curated eras like Dating Era and Marriage Era.
        </p>
      </section>
      <TaxonomyGrid
        basePath="seasons"
        items={seasons.map((season) => ({
          id: season.id,
          title: season.title,
          description:
            season.type === "auto_year" ? "Automatic year grouping" : "Custom life era",
        }))}
        title="All Seasons"
      />
    </DashboardLayout>
  );
}
