import { Check, Info, Play, Plus, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { favoritesService } from "@/services/firebase/favorites";
import { cn } from "@/lib/utils";
import { formatMemoryDate } from "@/services/utils/dates";
import type { MediaItem } from "@/types/domain";

export function MediaCard({
  media,
  aspect = "landscape",
  progressPercent,
}: {
  media: MediaItem;
  aspect?: "landscape" | "poster";
  progressPercent?: number;
}) {
  const navigate = useNavigate();
  const { spaceSlug = "luna-house" } = useParams();
  const { currentSpace } = useAuth();
  const { activeProfile } = useProfile();
  const [favorite, setFavorite] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  useEffect(() => {
    if (!currentSpace || !activeProfile) return;
    favoritesService.isFavorite(currentSpace.id, activeProfile.id, media.id).then(setFavorite);
  }, [activeProfile, currentSpace, media.id]);

  useEffect(() => {
    if (!showMoreInfo) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setShowMoreInfo(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [showMoreInfo]);

  return (
    <>
      <Link
        className="group block min-w-[250px] max-w-[250px] transition focus:outline-none focus:ring-2 focus:ring-gold md:min-w-[280px] md:max-w-[280px]"
        to={`/${spaceSlug}/player/${media.id}`}
      >
        <div
          className={cn(
            "relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-card shadow-[0_18px_60px_rgba(0,0,0,0.35)] transition duration-500 group-hover:-translate-y-2 group-hover:scale-[1.02] group-hover:border-gold/50",
            aspect === "poster" ? "aspect-[3/4]" : "aspect-video",
          )}
        >
          <img
            alt={media.title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-110"
            src={aspect === "poster" ? media.thumbnailUrl : media.bannerUrl}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
          <div className="absolute inset-0 hidden bg-gradient-to-t from-black/95 via-black/50 to-black/10 opacity-0 transition duration-300 group-hover:opacity-100 lg:block" />
          {typeof progressPercent === "number" && progressPercent > 0 ? (
            <div className="absolute inset-x-0 bottom-0 z-10 px-4 pb-3">
              <div className="h-1.5 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full rounded-full bg-rose-500 transition-[width] duration-500"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                />
              </div>
            </div>
          ) : null}
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/75 backdrop-blur">
            {media.type === "video" ? (
              <Play className="h-3.5 w-3.5 fill-current" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {media.type === "video" ? "Film" : "Photo Story"}
          </div>
          <div className="absolute inset-x-0 top-14 z-20 hidden px-4 opacity-0 transition duration-300 group-hover:top-16 group-hover:opacity-100 lg:block">
            <div className="flex items-center gap-2">
              <Button
                className="h-10 w-10"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  navigate(`/${spaceSlug}/player/${media.id}`);
                }}
                size="icon"
                type="button"
              >
                <Play className="h-4 w-4 fill-current" />
              </Button>
              <Button
                className="h-10 w-10"
                onClick={async (event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  if (!currentSpace || !activeProfile) return;
                  const result = await favoritesService.toggleFavorite(currentSpace.id, activeProfile.id, media.id);
                  setFavorite(result.favorite);
                }}
                size="icon"
                type="button"
                variant="secondary"
              >
                {favorite ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              </Button>
              <Button
                className="h-10 w-10"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setShowMoreInfo(true);
                }}
                size="icon"
                type="button"
                variant="ghost"
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-4 line-clamp-3 max-w-[88%] text-sm leading-6 text-white/72">
              {media.description}
            </p>
          </div>
          <div className="absolute inset-x-0 bottom-0 p-4">
            <h3 className="font-display text-2xl text-white">{media.title}</h3>
            <p className="mt-1 line-clamp-2 text-sm text-white/65">{media.description}</p>
            {typeof progressPercent === "number" && progressPercent > 0 ? (
              <p className="mt-2 text-[11px] uppercase tracking-[0.28em] text-white/55">
                Resume from {Math.min(progressPercent, 100)}%
              </p>
            ) : null}
          </div>
        </div>
      </Link>
      {showMoreInfo ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8">
          <button
            aria-label="Close details"
            className="absolute inset-0 bg-black/75 backdrop-blur-md"
            onClick={() => setShowMoreInfo(false)}
            type="button"
          />
          <div className="relative z-10 max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#090c14] shadow-[0_30px_120px_rgba(0,0,0,0.65)]">
            <div className="relative h-[280px] overflow-hidden sm:h-[360px]">
              <img
                alt={media.title}
                className="h-full w-full object-cover"
                src={media.backdropUrl || media.bannerUrl}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090c14] via-[#090c1490] to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
                <p className="text-xs uppercase tracking-[0.34em] text-gold/80">More Info</p>
                <h3 className="mt-3 max-w-2xl font-display text-4xl text-white sm:text-6xl">
                  {media.title}
                </h3>
              </div>
            </div>
            <div className="max-h-[calc(90vh-280px)] overflow-y-auto p-6 sm:max-h-[calc(90vh-360px)] sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <Link to={`/${spaceSlug}/player/${media.id}`} onClick={() => setShowMoreInfo(false)}>
                  <Button size="lg" type="button">
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
                  type="button"
                  variant="secondary"
                >
                  {favorite ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {favorite ? "In My List" : "Add to My List"}
                </Button>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.28em] text-white/55">
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  {formatMemoryDate(media.dateOfMemory)}
                </span>
                <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                  {media.type === "video" ? "Film" : "Photo Story"}
                </span>
                {media.location ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                    {media.location}
                  </span>
                ) : null}
                {typeof progressPercent === "number" && progressPercent > 0 ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5">
                    Resume from {Math.min(progressPercent, 100)}%
                  </span>
                ) : null}
              </div>
              <div className="mt-6 grid gap-6 sm:grid-cols-[1.6fr_0.9fr]">
                <div>
                  <p className="text-base leading-8 text-white/78">{media.description}</p>
                </div>
                <div className="space-y-4">
                  {media.tags.length ? (
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-gold/70">Tags</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {media.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm text-white/70"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-gold/70">Memory Details</p>
                    <div className="mt-3 space-y-2 text-sm text-white/68">
                      <p>Date: {formatMemoryDate(media.dateOfMemory)}</p>
                      <p>Length: {Math.max(1, Math.round(media.durationSeconds / 60))} min</p>
                      <p>Type: {media.type === "video" ? "Video memory" : "Photo story"}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
