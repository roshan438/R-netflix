import { useEffect, useState } from "react";
import { Play } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { MediaCard } from "@/components/home/MediaCard";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { collectionService } from "@/services/firebase/collections";
import { formatMemoryDate } from "@/services/utils/dates";
import type { Collection, MediaItem } from "@/types/domain";

export function CollectionDetailPage() {
  const { collectionId = "", spaceSlug = "luna-house" } = useParams();
  const { currentSpace } = useAuth();
  const [collection, setCollection] = useState<Collection | null>(null);
  const [items, setItems] = useState<MediaItem[]>([]);

  useEffect(() => {
    if (!currentSpace || !collectionId) return;
    collectionService.getById(collectionId, currentSpace.id).then((item) => setCollection(item ?? null));
    collectionService.getItems(collectionId, currentSpace.id).then(setItems);
  }, [collectionId, currentSpace]);

  if (!collection) {
    return (
      <DashboardLayout>
        <div className="glass-panel rounded-[2rem] p-8 text-white/65">Loading collection...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10">
        <img alt={collection.title} className="h-[52vh] w-full object-cover" src={collection.bannerUrl} />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-8 lg:max-w-3xl">
          <p className="text-xs uppercase tracking-[0.34em] text-gold/80">Collection</p>
          <h1 className="mt-3 font-display text-6xl text-white">{collection.title}</h1>
          <p className="mt-4 text-base leading-7 text-white/70">{collection.description}</p>
          {items[0] ? (
            <Link className="mt-7 inline-block" to={`/${spaceSlug}/player/${items[0].id}`}>
              <Button size="lg">
                <Play className="h-4 w-4 fill-current" />
                Play All
              </Button>
            </Link>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-4">
            {items.map((item) => (
              <Link
                key={item.id}
                className="glass-panel flex gap-4 rounded-[1.6rem] p-4 transition hover:border-gold/40"
                to={`/${spaceSlug}/player/${item.id}`}
              >
                <img alt={item.title} className="h-28 w-44 rounded-[1.25rem] object-cover" src={item.thumbnailUrl} />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="font-display text-3xl text-white">{item.title}</h2>
                    <span className="text-sm text-white/50">{item.playbackOrder}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/65">{item.description}</p>
                  <p className="mt-3 text-xs uppercase tracking-[0.24em] text-white/45">
                    {formatMemoryDate(item.dateOfMemory)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="space-y-4">
            {items.slice(0, 2).map((item) => (
              <MediaCard key={item.id} aspect="poster" media={item} />
            ))}
          </div>
        </div>
      </section>
    </DashboardLayout>
  );
}
