import { useEffect, useState } from "react";
import { CollectionStrip } from "@/components/home/CollectionStrip";
import { HeroBanner } from "@/components/home/HeroBanner";
import { MediaRail } from "@/components/home/MediaRail";
import { TaxonomyGrid } from "@/components/home/TaxonomyGrid";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { mediaService } from "@/services/firebase/media";
import type { Collection, MediaItem, Season, Category } from "@/types/domain";

export function HomePage() {
  const { currentSpace } = useAuth();
  const { activeProfile } = useProfile();
  const [featured, setFeatured] = useState<MediaItem | null>(null);
  const [recent, setRecent] = useState<MediaItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
  const [favorites, setFavorites] = useState<MediaItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);

  useEffect(() => {
    if (!currentSpace || !activeProfile) return;
    mediaService.listRecentlyAdded(currentSpace.id).then((items) => {
      setRecent(items);
      setFeatured((current) => current ?? items[0] ?? null);
    });
    mediaService.getFeaturedMedia(currentSpace.id).then((item) => setFeatured(item ?? null));
    mediaService
      .listContinueWatching(activeProfile.id, currentSpace.id)
      .then((items) => setContinueWatching(items.map((item) => item.media)));
    mediaService.listFavorites(activeProfile.id, currentSpace.id).then(setFavorites);
    mediaService.listCollections(currentSpace.id).then(setCollections);
    mediaService.listCategories(currentSpace.id).then(setCategories);
    mediaService.listSeasons(currentSpace.id).then(setSeasons);
  }, [activeProfile, currentSpace]);

  return (
    <DashboardLayout>
      {featured ? <HeroBanner media={featured} /> : null}
      <MediaRail eyebrow="Priority Row" items={recent} title="Recently Added" />
      <MediaRail eyebrow="Resume" items={continueWatching} title="Continue Watching" />
      <TaxonomyGrid
        basePath="seasons"
        items={seasons.map((season) => ({
          id: season.id,
          title: season.title,
          description: season.type === "auto_year" ? "Automatic year grouping" : "Curated era",
        }))}
        title="Seasons"
      />
      <CollectionStrip items={collections} />
      <TaxonomyGrid
        basePath="categories"
        items={categories.map((category) => ({
          id: category.id,
          title: category.name,
          description: category.description,
        }))}
        title="Categories"
      />
      <MediaRail eyebrow="Personal" items={favorites} title="My List" />
    </DashboardLayout>
  );
}
