import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { MediaCard } from "@/components/home/MediaCard";
import { Button } from "@/components/ui/button";
import type { MediaItem } from "@/types/domain";

export function MediaRail({
  title,
  items,
  eyebrow,
  progressByMediaId,
}: {
  title: string;
  items: MediaItem[];
  eyebrow?: string;
  progressByMediaId?: Record<string, number>;
}) {
  const railRef = useRef<HTMLDivElement | null>(null);
  const BATCH_SIZE = 5;
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const visibleItems = useMemo(() => items.slice(0, visibleCount), [items, visibleCount]);

  useEffect(() => {
    setVisibleCount(BATCH_SIZE);
  }, [items]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const updateScrollState = () => {
      const maxScrollLeft = rail.scrollWidth - rail.clientWidth;
      const nearEnd = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 40;
      const hasMoreHiddenItems = visibleCount < items.length;

      setCanScrollLeft(rail.scrollLeft > 8);
      setCanScrollRight(hasMoreHiddenItems || maxScrollLeft - rail.scrollLeft > 8);

      if (nearEnd && hasMoreHiddenItems) {
        setVisibleCount((current) => Math.min(current + BATCH_SIZE, items.length));
      }
    };

    updateScrollState();
    rail.addEventListener("scroll", updateScrollState, { passive: true });
    window.addEventListener("resize", updateScrollState);

    return () => {
      rail.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [items.length, visibleCount]);

  const scrollRail = (direction: "left" | "right") => {
    const rail = railRef.current;
    if (!rail) return;

    if (direction === "right" && visibleCount < items.length) {
      setVisibleCount((current) => Math.min(current + BATCH_SIZE, items.length));
    }

    const amount = Math.max(rail.clientWidth * 0.82, 280);
    rail.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  if (!items.length) return null;

  return (
    <section className="mt-12">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="mb-2 text-xs uppercase tracking-[0.3em] text-gold/80">{eyebrow}</p>
          ) : null}
          <h2 className="font-display text-3xl font-semibold tracking-[0.02em] text-white">
            {title}
          </h2>
          <p className="mt-1 text-sm text-white/38">
            Curated for this private space.
          </p>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button
            aria-hidden={!canScrollLeft}
            className="h-11 w-11"
            disabled={!canScrollLeft}
            size="icon"
            type="button"
            variant="ghost"
            onClick={() => scrollRail("left")}
            style={{ visibility: canScrollLeft ? "visible" : "hidden" }}
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            aria-hidden={!canScrollRight}
            className="h-11 w-11"
            disabled={!canScrollRight}
            size="icon"
            type="button"
            variant="ghost"
            onClick={() => scrollRail("right")}
            style={{ visibility: canScrollRight ? "visible" : "hidden" }}
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
      <div
        ref={railRef}
        className="flex gap-4 overflow-x-auto pb-4 scroll-smooth snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {visibleItems.map((item) => (
          <div key={item.id} className="snap-start">
            <MediaCard media={item} progressPercent={progressByMediaId?.[item.id]} />
          </div>
        ))}
      </div>
    </section>
  );
}
