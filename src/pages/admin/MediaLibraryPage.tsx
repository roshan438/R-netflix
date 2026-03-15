import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Pencil, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { categoryService } from "@/services/firebase/categories";
import { collectionService } from "@/services/firebase/collections";
import { mediaService } from "@/services/firebase/media";
import { seasonService } from "@/services/firebase/seasons";
import type { Category, Collection, MediaItem, Season } from "@/types/domain";

type EditDraft = {
  title: string;
  description: string;
  collectionId: string;
  categoryId: string;
  customSeasonId?: string;
  location?: string;
  dateOfMemory: string;
  tags: string;
  thumbnailUrl: string;
  bannerUrl: string;
  featured: boolean;
};

export function MediaLibraryPage() {
  const { currentSpace } = useAuth();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<unknown>(null);
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  async function loadLibrary(mode: "reset" | "append" = "reset") {
    if (!currentSpace) return;
    try {
      if (mode === "reset") {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      const [mediaPage, nextCollections, nextCategories, nextSeasons] = await Promise.all([
        mediaService.listForAdmin(currentSpace.id, {
          pageSize: 10,
          cursor: mode === "append" ? nextCursor : null,
        }),
        mode === "reset" ? collectionService.list(currentSpace.id) : Promise.resolve(collections),
        mode === "reset" ? categoryService.list(currentSpace.id) : Promise.resolve(categories),
        mode === "reset" ? seasonService.list(currentSpace.id) : Promise.resolve(seasons),
      ]);
      setItems((current) => (mode === "append" ? [...current, ...mediaPage.items] : mediaPage.items));
      setCollections(nextCollections);
      setCategories(nextCategories);
      setSeasons(nextSeasons);
      setNextCursor(mediaPage.nextCursor);
      setHasMore(mediaPage.hasMore);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    void loadLibrary("reset");
  }, [currentSpace]);

  useEffect(() => {
    if (!hasMore || loading || loadingMore) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          void loadLibrary("append");
        }
      },
      { rootMargin: "320px 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, nextCursor]);

  const itemCountLabel = useMemo(
    () => `${items.length} ${items.length === 1 ? "memory" : "memories"}`,
    [items.length],
  );

  function beginEdit(item: MediaItem) {
    setEditingId(item.id);
    setDraft({
      title: item.title,
      description: item.description,
      collectionId: item.collectionId,
      categoryId: item.categoryId,
      customSeasonId: item.customSeasonId,
      location: item.location,
      dateOfMemory: item.dateOfMemory,
      tags: item.tags.join(", "),
      thumbnailUrl: item.thumbnailUrl,
      bannerUrl: item.bannerUrl,
      featured: item.featured,
    });
  }

  async function saveEdit(mediaId: string) {
    if (!currentSpace || !draft) return;
    try {
      setSaving(true);
      await mediaService.updateMediaDetails({
        spaceId: currentSpace.id,
        mediaId,
        ...draft,
        tags: draft.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
        thumbnailUrl: draft.thumbnailUrl,
        bannerUrl: draft.bannerUrl,
        featured: draft.featured,
      });
      toast.success("Media details updated.");
      setEditingId(null);
      setDraft(null);
      setExpandedCardId(null);
      await loadLibrary("reset");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save media changes.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(mediaId: string) {
    if (!currentSpace) return;
    try {
      setDeletingId(mediaId);
      await mediaService.deleteMediaItem(currentSpace.id, mediaId);
      toast.success("Memory deleted.");
      await loadLibrary("reset");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete media.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <DashboardLayout>
      <section className="glass-panel rounded-[2rem] p-8">
        <p className="text-xs uppercase tracking-[0.34em] text-gold/80">Library</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-6xl text-white">Media Library</h1>
            <p className="mt-3 text-sm leading-7 text-white/65">
              Edit titles, swap collection/category assignment, or remove uploads from your private streaming catalog.
            </p>
          </div>
          <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/60">
            {itemCountLabel}
          </div>
        </div>
      </section>

      <section className="mt-8 space-y-5">
        {loading ? (
          <div className="glass-panel rounded-[1.8rem] p-6 text-sm text-white/65">
            Loading your media library...
          </div>
        ) : null}
        {items.map((item) => {
          const isEditing = editingId === item.id && draft;
          const isExpanded = expandedCardId === item.id;
          return (
            <div
              key={item.id}
              className="glass-panel overflow-hidden rounded-[1.35rem] p-3 sm:p-4"
            >
              {isEditing ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      onChange={(event) =>
                        setDraft((current) => (current ? { ...current, title: event.target.value } : current))
                      }
                      value={draft.title}
                    />
                    <Input
                      onChange={(event) =>
                        setDraft((current) => (current ? { ...current, dateOfMemory: event.target.value } : current))
                      }
                      type="date"
                      value={draft.dateOfMemory}
                    />
                  </div>
                  <Textarea
                    onChange={(event) =>
                      setDraft((current) => (current ? { ...current, description: event.target.value } : current))
                    }
                    value={draft.description}
                  />
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      onChange={(event) =>
                        setDraft((current) => (current ? { ...current, tags: event.target.value } : current))
                      }
                      placeholder="travel, anniversary, mountain"
                      value={draft.tags}
                    />
                    <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white">
                      <input
                        checked={draft.featured}
                        onChange={(event) =>
                          setDraft((current) => (current ? { ...current, featured: event.target.checked } : current))
                        }
                        type="checkbox"
                      />
                      Featured on homepage
                    </label>
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      onChange={(event) =>
                        setDraft((current) => (current ? { ...current, thumbnailUrl: event.target.value } : current))
                      }
                      placeholder="Thumbnail URL"
                      value={draft.thumbnailUrl}
                    />
                    <Input
                      onChange={(event) =>
                        setDraft((current) => (current ? { ...current, bannerUrl: event.target.value } : current))
                      }
                      placeholder="Banner URL"
                      value={draft.bannerUrl}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-3">
                    <select
                      className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white"
                      onChange={(event) =>
                        setDraft((current) => (current ? { ...current, collectionId: event.target.value } : current))
                      }
                      value={draft.collectionId}
                    >
                      {collections.map((collection) => (
                        <option key={collection.id} className="bg-slate-900" value={collection.id}>
                          {collection.title}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white"
                      onChange={(event) =>
                        setDraft((current) => (current ? { ...current, categoryId: event.target.value } : current))
                      }
                      value={draft.categoryId}
                    >
                      {categories.map((category) => (
                        <option key={category.id} className="bg-slate-900" value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <select
                      className="h-12 rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white"
                      onChange={(event) =>
                        setDraft((current) =>
                          current ? { ...current, customSeasonId: event.target.value || undefined } : current,
                        )
                      }
                      value={draft.customSeasonId ?? ""}
                    >
                      <option className="bg-slate-900" value="">
                        None
                      </option>
                      {seasons.map((season) => (
                        <option key={season.id} className="bg-slate-900" value={season.id}>
                          {season.title}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button disabled={saving} onClick={() => void saveEdit(item.id)} type="button">
                      <Save className="h-4 w-4" />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button
                      onClick={() => {
                        setEditingId(null);
                        setDraft(null);
                      }}
                      type="button"
                      variant="secondary"
                    >
                      <X className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    className="flex w-full items-center gap-3 rounded-[1rem] text-left transition hover:bg-white/5"
                    onClick={() => setExpandedCardId((current) => (current === item.id ? null : item.id))}
                    type="button"
                  >
                    <img
                      alt={item.title}
                      className="h-[72px] w-[96px] shrink-0 rounded-[0.95rem] object-cover sm:h-20 sm:w-[112px]"
                      src={item.thumbnailUrl || item.bannerUrl}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-[10px] uppercase tracking-[0.28em] text-gold/80">
                          {item.type === "video" ? "Video" : "Photo Story"}
                        </p>
                        {item.featured ? (
                          <span className="rounded-full border border-gold/20 bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.22em] text-gold/80">
                            Featured
                          </span>
                        ) : null}
                      </div>
                      <h2 className="mt-1 line-clamp-2 font-display text-2xl text-white sm:text-[2rem]">
                        {item.title}
                      </h2>
                      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-white/45 sm:text-sm">
                        <span>{item.dateOfMemory}</span>
                        <span>{collections.find((entry) => entry.id === item.collectionId)?.title ?? "Unassigned"}</span>
                        <span>{categories.find((entry) => entry.id === item.categoryId)?.name ?? "Unassigned"}</span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        className="h-9 px-3 text-xs sm:h-10 sm:text-sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          beginEdit(item);
                        }}
                        type="button"
                        variant="secondary"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </Button>
                      <Button
                        className="h-9 px-3 text-xs sm:h-10 sm:text-sm"
                        disabled={deletingId === item.id}
                        onClick={(event) => {
                          event.stopPropagation();
                          void deleteItem(item.id);
                        }}
                        type="button"
                        variant="danger"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {deletingId === item.id ? "..." : "Delete"}
                      </Button>
                      <span
                        className={`rounded-full border border-white/10 p-2 text-white/60 transition ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      >
                        <ChevronDown className="h-4 w-4" />
                      </span>
                    </div>
                  </button>
                  {isExpanded ? (
                    <div className="rounded-[1rem] border border-white/10 bg-white/[0.03] p-4">
                      <p
                        className={`max-w-4xl text-sm leading-6 text-white/65 ${
                          expandedDescriptions[item.id] ? "" : "line-clamp-3"
                        }`}
                      >
                        {item.description}
                      </p>
                      {item.description.trim().length > 220 ? (
                        <button
                          className="mt-2 text-sm font-medium text-gold transition hover:text-gold/80"
                          onClick={() =>
                            setExpandedDescriptions((current) => ({
                              ...current,
                              [item.id]: !current[item.id],
                            }))
                          }
                          type="button"
                        >
                          {expandedDescriptions[item.id] ? "Show less" : "See more"}
                        </button>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-4 text-sm text-white/45">
                        <span>Tags: {item.tags.join(", ") || "None"}</span>
                        <span>Location: {item.location || "Not set"}</span>
                        <span>Season: {seasons.find((entry) => entry.id === item.customSeasonId)?.title ?? "None"}</span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
        {!loading && hasMore ? (
          <div ref={sentinelRef} className="flex justify-center pt-2">
            <div className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/55">
              {loadingMore ? "Loading more..." : "Scroll for more"}
            </div>
          </div>
        ) : null}
      </section>
    </DashboardLayout>
  );
}
