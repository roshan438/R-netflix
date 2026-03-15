import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { CollectionStrip } from "@/components/home/CollectionStrip";
import { useAuth } from "@/context/AuthContext";
import { collectionService } from "@/services/firebase/collections";
import type { Collection } from "@/types/domain";

export function CollectionsBrowsePage() {
  const { currentSpace } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);

  useEffect(() => {
    if (!currentSpace) return;
    collectionService.list(currentSpace.id).then(setCollections);
  }, [currentSpace]);

  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-gold/80">Library</p>
        <h1 className="mt-3 font-display text-6xl text-white">Collections</h1>
        <p className="mt-4 text-sm leading-7 text-white/65">
          Series-style story worlds grouped by trips, seasons of life, and milestones.
        </p>
      </section>
      <CollectionStrip items={collections} />
    </DashboardLayout>
  );
}
