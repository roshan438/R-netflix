import { Play, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { favoritesService } from "@/services/firebase/favorites";
import { formatMemoryDate } from "@/services/utils/dates";
import type { MediaItem } from "@/types/domain";

export function HeroBanner({ media }: { media: MediaItem }) {
  const { spaceSlug = "luna-house" } = useParams();
  const { currentSpace } = useAuth();
  const { activeProfile } = useProfile();
  const [favorite, setFavorite] = useState(false);
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const hasLongDescription = media.description.trim().length > 220;

  useEffect(() => {
    if (!currentSpace || !activeProfile) return;
    favoritesService.isFavorite(currentSpace.id, activeProfile.id, media.id).then(setFavorite);
  }, [activeProfile, currentSpace, media.id]);

  useEffect(() => {
    setDescriptionExpanded(false);
  }, [media.id]);

  return (
    <section className="relative overflow-hidden rounded-[2.25rem] border border-white/10">
      <img
        alt={media.title}
        className="cinematic-mask h-[68vh] min-h-[540px] w-full object-cover scale-[1.02]"
        src={media.backdropUrl}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#02040acc] via-[#02040aad] to-[#02040a33]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(214,177,108,0.22),transparent_32%),radial-gradient(circle_at_80%_10%,rgba(255,132,92,0.15),transparent_28%)]" />
      <div className="absolute inset-x-0 bottom-0 p-8 sm:p-10 lg:max-w-3xl lg:p-14">
        <div className="mb-5 flex flex-wrap items-center gap-3">
          <Badge className="shadow-halo">Featured Memory</Badge>
          <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] uppercase tracking-[0.32em] text-white/60">
            Streaming now
          </span>
        </div>
        <h1 className="font-display text-5xl leading-none text-white sm:text-6xl lg:text-7xl">
          {media.title}
        </h1>
        <p
          className={`mt-5 max-w-2xl text-base leading-7 text-white/75 sm:text-lg ${
            descriptionExpanded ? "" : "line-clamp-2 sm:line-clamp-3"
          }`}
        >
          {media.description}
        </p>
        {hasLongDescription ? (
          <button
            className="mt-2 text-sm font-medium text-gold transition hover:text-gold/80"
            onClick={() => setDescriptionExpanded((value) => !value)}
            type="button"
          >
            {descriptionExpanded ? "Show less" : "See more"}
          </button>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-white/60">
          <span>{formatMemoryDate(media.dateOfMemory)}</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>{media.type === "video" ? "Film" : "Photo Story"}</span>
          <span className="h-1 w-1 rounded-full bg-white/30" />
          <span>{media.location ?? "Private archive"}</span>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link to={`/${spaceSlug}/player/${media.id}`}>
            <Button size="lg">
              <Play className="h-4 w-4 fill-current" />
              Play
            </Button>
          </Link>
          <Button
            onClick={async () => {
              if (!currentSpace || !activeProfile) return;
              const result = await favoritesService.toggleFavorite(currentSpace.id, activeProfile.id, media.id);
              setFavorite(result.favorite);
            }}
            size="lg"
            variant="secondary"
          >
            <Plus className="h-4 w-4" />
            {favorite ? "In My List" : "Add to My List"}
          </Button>
        </div>
      </div>
    </section>
  );
}
