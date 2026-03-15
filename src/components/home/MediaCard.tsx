import { Play, Sparkles } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { MediaItem } from "@/types/domain";

export function MediaCard({
  media,
  aspect = "landscape",
}: {
  media: MediaItem;
  aspect?: "landscape" | "poster";
}) {
  const { spaceSlug = "luna-house" } = useParams();

  return (
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
        <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/45 px-3 py-1 text-xs uppercase tracking-[0.25em] text-white/75 backdrop-blur">
          {media.type === "video" ? (
            <Play className="h-3.5 w-3.5 fill-current" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {media.type === "video" ? "Film" : "Photo Story"}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display text-2xl text-white">{media.title}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-white/65">{media.description}</p>
        </div>
      </div>
    </Link>
  );
}
