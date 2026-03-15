import { useEffect, useState } from "react";
import { CollectionStrip } from "@/components/home/CollectionStrip";
import { HeroBanner } from "@/components/home/HeroBanner";
import { MediaRail } from "@/components/home/MediaRail";
import { TaxonomyGrid } from "@/components/home/TaxonomyGrid";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { mediaService } from "@/services/firebase/media";
import { watchHistoryService } from "@/services/firebase/watchHistory";
import type { Collection, MediaItem, Season, Category } from "@/types/domain";

export function HomePage() {
  const { currentSpace } = useAuth();
  const { activeProfile } = useProfile();
  const [featured, setFeatured] = useState<MediaItem | null>(null);
  const [recent, setRecent] = useState<MediaItem[]>([]);
  const [continueWatching, setContinueWatching] = useState<MediaItem[]>([]);
  const [favorites, setFavorites] = useState<MediaItem[]>([]);
  const [recentlyWatched, setRecentlyWatched] = useState<MediaItem[]>([]);
  const [topPicks, setTopPicks] = useState<MediaItem[]>([]);
  const [becauseYouWatched, setBecauseYouWatched] = useState<{
    title: string;
    items: MediaItem[];
  }>({
    title: "Because You Watched",
    items: [],
  });
  const [moreLikeThis, setMoreLikeThis] = useState<MediaItem[]>([]);
  const [fromFavoriteCollection, setFromFavoriteCollection] = useState<{
    title: string;
    items: MediaItem[];
  }>({
    title: "From Your Favorite Collection",
    items: [],
  });
  const [progressByMediaId, setProgressByMediaId] = useState<Record<string, number>>({});
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);

  useEffect(() => {
    if (!currentSpace || !activeProfile) return;
    Promise.all([
      mediaService.listRecentlyAdded(currentSpace.id),
      mediaService.getFeaturedMedia(currentSpace.id),
      mediaService.listContinueWatching(activeProfile.id, currentSpace.id),
      mediaService.listFavorites(activeProfile.id, currentSpace.id),
      mediaService.listRecentlyWatched(activeProfile.id, currentSpace.id),
      mediaService.listTopPicks(activeProfile.id, currentSpace.id),
      mediaService.getBecauseYouWatched(activeProfile.id, currentSpace.id),
      mediaService.getMoreLikeThis(activeProfile.id, currentSpace.id),
      mediaService.getFromFavoriteCollection(activeProfile.id, currentSpace.id),
      mediaService.listCollections(currentSpace.id),
      mediaService.listCategories(currentSpace.id),
      mediaService.listSeasons(currentSpace.id),
      watchHistoryService.listHistory(currentSpace.id, activeProfile.id),
    ]).then(([
      recentItems,
      featuredItem,
      continueRows,
      favoriteItems,
      recentlyWatchedItems,
      topPickItems,
      becauseYouWatchedRow,
      moreLikeThisItems,
      fromFavoriteCollectionRow,
      collectionItems,
      categoryItems,
      seasonItems,
      historyRows,
    ]) => {
      setRecent(recentItems);
      setFeatured(featuredItem ?? recentItems[0] ?? null);
      setContinueWatching(continueRows.map((item) => item.media));
      setFavorites(favoriteItems);
      setRecentlyWatched(recentlyWatchedItems);
      setTopPicks(topPickItems);
      setBecauseYouWatched(becauseYouWatchedRow);
      setMoreLikeThis(moreLikeThisItems);
      setFromFavoriteCollection(fromFavoriteCollectionRow);
      setCollections(collectionItems);
      setCategories(categoryItems);
      setSeasons(seasonItems);
      setProgressByMediaId(
        Object.fromEntries(
          historyRows
            .filter((row) => row.percentComplete > 0 && row.percentComplete < 100)
            .map((row) => [row.mediaItemId, row.percentComplete]),
        ),
      );
    });
  }, [activeProfile, currentSpace]);

  return (
    <DashboardLayout>
      {featured ? <HeroBanner media={featured} /> : null}
      <MediaRail
        eyebrow="Priority Row"
        items={recent}
        progressByMediaId={progressByMediaId}
        title="Recently Added"
      />
      <MediaRail
        eyebrow="Resume"
        items={continueWatching}
        progressByMediaId={progressByMediaId}
        title="Continue Watching"
      />
      {topPicks.length ? (
        <MediaRail
          eyebrow="Top Picks"
          items={topPicks}
          progressByMediaId={progressByMediaId}
          title="Picked For This Profile"
        />
      ) : null}
      {recentlyWatched.length ? (
        <MediaRail
          eyebrow="Recent History"
          items={recentlyWatched}
          progressByMediaId={progressByMediaId}
          title="Recently Watched"
        />
      ) : null}
      {becauseYouWatched.items.length ? (
        <MediaRail
          eyebrow="Because You Watched"
          items={becauseYouWatched.items}
          progressByMediaId={progressByMediaId}
          title={becauseYouWatched.title}
        />
      ) : null}
      {moreLikeThis.length ? (
        <MediaRail
          eyebrow="Discover"
          items={moreLikeThis}
          progressByMediaId={progressByMediaId}
          title="More Like This"
        />
      ) : null}
      {fromFavoriteCollection.items.length ? (
        <MediaRail
          eyebrow="Favorites"
          items={fromFavoriteCollection.items}
          progressByMediaId={progressByMediaId}
          title={fromFavoriteCollection.title}
        />
      ) : null}
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
      <MediaRail
        eyebrow="Personal"
        items={favorites}
        progressByMediaId={progressByMediaId}
        title="My List"
      />
    </DashboardLayout>
  );
}
