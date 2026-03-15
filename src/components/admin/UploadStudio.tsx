import { useEffect, useState } from "react";
import { ImagePlus, Link2, LoaderCircle, Play, Plus, UploadCloud } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { mediaService } from "@/services/firebase/media";
import { collectionService } from "@/services/firebase/collections";
import { categoryService } from "@/services/firebase/categories";
import { seasonService } from "@/services/firebase/seasons";
import { youtubeProvider } from "@/services/providers/youtubeProvider";
import type { Category, Collection, MediaItem, Season } from "@/types/domain";
import type { UploadProgress } from "@/services/providers/mediaProvider";

const uploadSchema = z.object({
  type: z.enum(["video", "photo_collection"]),
  title: z.string().min(2),
  description: z.string().min(8),
  collectionId: z.string().min(1),
  categoryId: z.string().min(1),
  dateOfMemory: z.string().min(1),
  customSeasonId: z.string().optional(),
  tags: z.string().optional(),
  location: z.string().optional(),
  youtubeUrl: z.string().optional(),
});

type UploadValues = z.infer<typeof uploadSchema>;

export function UploadStudio() {
  const { currentSpace } = useAuth();
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<Record<string, number>>({});
  const [lastVideoId, setLastVideoId] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [newCollectionTitle, setNewCollectionTitle] = useState("");
  const [newCategoryTitle, setNewCategoryTitle] = useState("");
  const [newSeasonTitle, setNewSeasonTitle] = useState("");
  const [showCollectionCreate, setShowCollectionCreate] = useState(false);
  const [showCategoryCreate, setShowCategoryCreate] = useState(false);
  const [showSeasonCreate, setShowSeasonCreate] = useState(false);
  const [submitIntent, setSubmitIntent] = useState<"draft" | "publish">("draft");
  const [publishState, setPublishState] = useState<"idle" | "publishing">("idle");
  const [publishedPreview, setPublishedPreview] = useState<MediaItem | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<UploadValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      type: "video",
      title: "",
      description: "",
      collectionId: "",
      categoryId: "",
      dateOfMemory: "",
    },
  });

  const type = watch("type");

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setThumbnailPreview(String(reader.result ?? ""));
    reader.readAsDataURL(thumbnailFile);
  }, [thumbnailFile]);

  useEffect(() => {
    if (!bannerFile) {
      setBannerPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBannerPreview(String(reader.result ?? ""));
    reader.readAsDataURL(bannerFile);
  }, [bannerFile]);

  useEffect(() => {
    if (!currentSpace) return;
    collectionService.list(currentSpace.id).then((items) => {
      setCollections(items);
      if (items[0]) {
        // default values are only used on first render; this keeps dropdowns populated.
      }
    });
    categoryService.list(currentSpace.id).then(setCategories);
    seasonService.list(currentSpace.id).then(setSeasons);
  }, [currentSpace]);

  async function createCollectionInline() {
    if (!currentSpace || !newCollectionTitle.trim()) return;
    try {
      const created = await collectionService.create({
        spaceId: currentSpace.id,
        title: newCollectionTitle,
      });
      setCollections((current) => [...current, created]);
      setValue("collectionId", created.id, { shouldValidate: true });
      setNewCollectionTitle("");
      setShowCollectionCreate(false);
      toast.success("Collection created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create collection.");
    }
  }

  async function createCategoryInline() {
    if (!currentSpace || !newCategoryTitle.trim()) return;
    try {
      const created = await categoryService.create({
        spaceId: currentSpace.id,
        name: newCategoryTitle,
      });
      setCategories((current) => [...current, created]);
      setValue("categoryId", created.id, { shouldValidate: true });
      setNewCategoryTitle("");
      setShowCategoryCreate(false);
      toast.success("Category created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create category.");
    }
  }

  async function createSeasonInline() {
    if (!currentSpace || !newSeasonTitle.trim()) return;
    try {
      const created = await seasonService.create({
        spaceId: currentSpace.id,
        title: newSeasonTitle,
      });
      setSeasons((current) => [...current, created]);
      setValue("customSeasonId", created.id, { shouldValidate: true });
      setNewSeasonTitle("");
      setShowSeasonCreate(false);
      toast.success("Season created.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create season.");
    }
  }

  async function onSubmit(values: UploadValues) {
    try {
      const isPublishIntent = submitIntent === "publish";
      if (isPublishIntent) {
        setPublishState("publishing");
        setPublishedPreview(null);
      }

      let thumbnailUrl: string | undefined;
      let bannerImageUrl: string | undefined;

      if (type !== "video" && thumbnailFile) {
        const imageResult = await youtubeProvider.uploadImage(thumbnailFile, (state: UploadProgress) =>
          setProgress((current) => ({ ...current, thumbnail: state.percent })),
        );
        thumbnailUrl = imageResult.downloadUrl;
      }
      if (type !== "video" && bannerFile) {
        const imageResult = await youtubeProvider.uploadImage(bannerFile, (state: UploadProgress) =>
          setProgress((current) => ({ ...current, banner: state.percent })),
        );
        bannerImageUrl = imageResult.downloadUrl;
      }

      if (type === "video") {
        const result = await mediaService.createVideoFromYouTubeLink({
          spaceId: currentSpace?.id ?? "space_luna_house",
          title: values.title,
          description: values.description,
          youtubeUrl: values.youtubeUrl ?? "",
          collectionId: values.collectionId,
          categoryId: values.categoryId,
          dateOfMemory: values.dateOfMemory,
          customSeasonId: values.customSeasonId,
          tags: values.tags?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? [],
          location: values.location,
          thumbnailUrl,
          bannerImageUrl,
        });
        setLastVideoId(result.youtubeVideoId ?? null);
        if (isPublishIntent) {
          await new Promise((resolve) => window.setTimeout(resolve, 1200));
          const preview =
            (await mediaService.getMediaById(result.mediaItemId, currentSpace?.id)) ??
            ({
              id: result.mediaItemId,
              spaceId: currentSpace?.id ?? "space_luna_house",
              type: "video",
              title: values.title,
              description: values.description,
              categoryId: values.categoryId,
              collectionId: values.collectionId,
              customSeasonId: values.customSeasonId,
              autoYearSeason: Number(values.dateOfMemory.slice(0, 4)),
              durationSeconds: 0,
              playbackOrder: 1,
              featured: false,
              dateOfMemory: values.dateOfMemory,
              bannerUrl:
                bannerImageUrl ?? `https://img.youtube.com/vi/${result.youtubeVideoId}/maxresdefault.jpg`,
              thumbnailUrl:
                thumbnailUrl ?? `https://img.youtube.com/vi/${result.youtubeVideoId}/hqdefault.jpg`,
              backdropUrl:
                bannerImageUrl ?? `https://img.youtube.com/vi/${result.youtubeVideoId}/maxresdefault.jpg`,
              tags: values.tags?.split(",").map((tag) => tag.trim()).filter(Boolean) ?? [],
              location: values.location,
              youtubeVideoId: result.youtubeVideoId,
            } satisfies MediaItem);
          setPublishedPreview(preview);
        }
      }
      for (const [index, file] of imageFiles.entries()) {
        await youtubeProvider.uploadImage(file, (state: UploadProgress) =>
          setProgress((current) => ({
            ...current,
            [`frame-${index}`]: state.percent,
          })),
        );
      }
      toast.success(isPublishIntent ? "Memory published to your private rails." : "Memory upload saved.");
      console.info("Submitted draft upload", values);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed.");
    } finally {
      setPublishState("idle");
    }
  }

  return (
    <div className="relative grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
      {publishState === "publishing" ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#02050bdd]/95 backdrop-blur-md">
          <div className="relative overflow-hidden rounded-[2rem] border border-gold/20 bg-card/90 px-10 py-12 text-center shadow-[0_30px_120px_rgba(0,0,0,0.6)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(207,176,122,0.18),transparent_55%)]" />
            <LoaderCircle className="mx-auto h-12 w-12 animate-spin text-gold" />
            <p className="mt-6 text-xs uppercase tracking-[0.36em] text-gold/80">Publishing</p>
            <h3 className="mt-3 font-display text-4xl text-white">Preparing your new premiere</h3>
            <p className="mt-3 max-w-md text-sm leading-7 text-white/65">
              We&apos;re stitching this memory into the streaming rails and preparing a cinematic player preview.
            </p>
          </div>
        </div>
      ) : null}
      <div className="glass-panel rounded-[2rem] p-6">
        <p className="mb-2 text-xs uppercase tracking-[0.36em] text-gold/80">Upload Studio</p>
        <h2 className="font-display text-4xl text-white">Create a new memory release</h2>
        <div className="mt-5 rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4">
          <p className="text-sm font-medium text-white">YouTube link workflow</p>
          <p className="mt-1 text-sm text-white/55">
            Paste a YouTube video link and save its metadata. The app stores the `youtubeVideoId` and shows it in the streaming rails with a Netflix-like presentation.
          </p>
        </div>
        <form className="mt-6 space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm text-white/65">Media Type</span>
              <select
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white"
                {...register("type")}
              >
                <option className="bg-slate-900" value="video">
                  Video
                </option>
                <option className="bg-slate-900" value="photo_collection">
                  Photo Collection
                </option>
              </select>
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/65">Date of Memory</span>
              <Input type="date" {...register("dateOfMemory")} />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm text-white/65">Title</span>
            <Input placeholder="Wedding Film" {...register("title")} />
          </label>
          <label className="space-y-2">
            <span className="text-sm text-white/65">Description</span>
            <Textarea
              placeholder="A richly cut memory film with soft transitions..."
              {...register("description")}
            />
          </label>

          {type === "video" ? (
            <label className="space-y-2">
              <span className="text-sm text-white/65">YouTube Link</span>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                <Input
                  className="pl-11"
                  placeholder="https://www.youtube.com/watch?v=..."
                  {...register("youtubeUrl")}
                />
              </div>
            </label>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="flex items-center justify-between gap-3 text-sm text-white/65">
                <span>Collection</span>
                <button
                  className="text-xs uppercase tracking-[0.2em] text-gold transition hover:text-gold-light"
                  onClick={() => setShowCollectionCreate((current) => !current)}
                  type="button"
                >
                  {showCollectionCreate || !collections.length ? "Hide" : "Add new"}
                </button>
              </span>
              <select
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white"
                {...register("collectionId")}
              >
                <option className="bg-slate-900" value="">
                  Select collection
                </option>
                {collections.map((collection) => (
                  <option key={collection.id} className="bg-slate-900" value={collection.id}>
                    {collection.title}
                  </option>
                ))}
              </select>
              {showCollectionCreate || !collections.length ? (
                <div className="mt-3 flex gap-2">
                  <Input
                    onChange={(event) => setNewCollectionTitle(event.target.value)}
                    placeholder="Create collection"
                    value={newCollectionTitle}
                  />
                  <Button onClick={createCollectionInline} type="button" variant="secondary">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              ) : null}
            </label>
            <label className="space-y-2">
              <span className="flex items-center justify-between gap-3 text-sm text-white/65">
                <span>Category</span>
                <button
                  className="text-xs uppercase tracking-[0.2em] text-gold transition hover:text-gold-light"
                  onClick={() => setShowCategoryCreate((current) => !current)}
                  type="button"
                >
                  {showCategoryCreate || !categories.length ? "Hide" : "Add new"}
                </button>
              </span>
              <select
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white"
                {...register("categoryId")}
              >
                <option className="bg-slate-900" value="">
                  Select category
                </option>
                {categories.map((category) => (
                  <option key={category.id} className="bg-slate-900" value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {showCategoryCreate || !categories.length ? (
                <div className="mt-3 flex gap-2">
                  <Input
                    onChange={(event) => setNewCategoryTitle(event.target.value)}
                    placeholder="Create category"
                    value={newCategoryTitle}
                  />
                  <Button onClick={createCategoryInline} type="button" variant="secondary">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              ) : null}
            </label>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2">
              <span className="flex items-center justify-between gap-3 text-sm text-white/65">
                <span>Season</span>
                <button
                  className="text-xs uppercase tracking-[0.2em] text-gold transition hover:text-gold-light"
                  onClick={() => setShowSeasonCreate((current) => !current)}
                  type="button"
                >
                  {showSeasonCreate || !seasons.length ? "Hide" : "Add new"}
                </button>
              </span>
              <select
                className="h-12 w-full rounded-2xl border border-white/10 bg-white/5 px-4 text-sm text-white"
                {...register("customSeasonId")}
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
              {showSeasonCreate || !seasons.length ? (
                <div className="mt-3 flex gap-2">
                  <Input
                    onChange={(event) => setNewSeasonTitle(event.target.value)}
                    placeholder="Create season"
                    value={newSeasonTitle}
                  />
                  <Button onClick={createSeasonInline} type="button" variant="secondary">
                    <Plus className="h-4 w-4" />
                    Add
                  </Button>
                </div>
              ) : null}
            </label>
            <label className="space-y-2">
              <span className="text-sm text-white/65">Location</span>
              <Input placeholder="Sydney" {...register("location")} />
            </label>
          </div>

          <label className="space-y-2">
            <span className="text-sm text-white/65">Tags</span>
            <Input placeholder="travel, anniversary, beach" {...register("tags")} />
          </label>

          {type === "video" ? (
            <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.03] p-5">
              <p className="text-sm font-medium text-white">Auto artwork from YouTube</p>
              <p className="mt-2 text-sm leading-7 text-white/60">
                Thumbnail and banner images are pulled automatically from the YouTube link. You only need the video URL and metadata.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 xl:grid-cols-2">
              <label className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/[0.03] p-5">
                <div className="flex items-center gap-3">
                  <ImagePlus className="h-5 w-5 text-gold" />
                  <span className="font-medium text-white">Upload photo frames</span>
                </div>
                <input
                  className="mt-4 block w-full text-sm text-white/70"
                  multiple
                  onChange={(event) => {
                    const files = Array.from(event.target.files ?? []);
                    setImageFiles(files);
                  }}
                  type="file"
                />
                <p className="mt-3 text-xs text-white/45">
                  Photo stories can still use custom poster and banner artwork.
                </p>
              </label>
              <div className="grid gap-4">
                <label className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/[0.03] p-5">
                  <span className="font-medium text-white">Thumbnail</span>
                  <input
                    className="mt-4 block w-full text-sm text-white/70"
                    onChange={(event) => setThumbnailFile(event.target.files?.[0] ?? null)}
                    type="file"
                  />
                </label>
                <label className="rounded-[1.6rem] border border-dashed border-white/15 bg-white/[0.03] p-5">
                  <span className="font-medium text-white">Banner</span>
                  <input
                    className="mt-4 block w-full text-sm text-white/70"
                    onChange={(event) => setBannerFile(event.target.files?.[0] ?? null)}
                    type="file"
                  />
                </label>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => setSubmitIntent("draft")} size="lg" type="submit">
              <UploadCloud className="h-4 w-4" />
              {isSubmitting ? "Uploading..." : "Save Draft"}
            </Button>
            <Button onClick={() => setSubmitIntent("publish")} size="lg" type="submit" variant="secondary">
              Publish
            </Button>
          </div>
        </form>
      </div>

      <aside className="space-y-6">
        <div className="glass-panel rounded-[2rem] p-6">
          <h3 className="font-display text-3xl text-white">Asset previews</h3>
          <div className="mt-5 space-y-5">
            {type === "video" ? (
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-white/60">
                Video artwork preview comes from the pasted YouTube link after publish.
              </div>
            ) : (
              <>
                <div>
                  <p className="mb-2 text-sm text-white/60">Thumbnail</p>
                  {thumbnailPreview ? (
                    <img alt="Thumbnail preview" className="h-40 w-full rounded-[1.4rem] object-cover" src={thumbnailPreview} />
                  ) : (
                    <div className="flex h-40 items-center justify-center rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.03] text-sm text-white/40">
                      Thumbnail preview
                    </div>
                  )}
                </div>
                <div>
                  <p className="mb-2 text-sm text-white/60">Banner</p>
                  {bannerPreview ? (
                    <img alt="Banner preview" className="h-48 w-full rounded-[1.4rem] object-cover" src={bannerPreview} />
                  ) : (
                    <div className="flex h-48 items-center justify-center rounded-[1.4rem] border border-dashed border-white/10 bg-white/[0.03] text-sm text-white/40">
                      Banner preview
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <div className="glass-panel rounded-[2rem] p-6">
          <h3 className="font-display text-3xl text-white">Upload status</h3>
          <div className="mt-5 space-y-4">
            {publishedPreview && currentSpace ? (
              <div className="overflow-hidden rounded-[1.6rem] border border-gold/20 bg-white/[0.03]">
                <img
                  alt={publishedPreview.title}
                  className="h-44 w-full object-cover"
                  src={publishedPreview.bannerUrl || publishedPreview.thumbnailUrl}
                />
                <div className="p-4">
                  <p className="text-xs uppercase tracking-[0.28em] text-gold/80">Published Preview</p>
                  <h4 className="mt-2 font-display text-3xl text-white">{publishedPreview.title}</h4>
                  <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/65">
                    {publishedPreview.description}
                  </p>
                  <Link className="mt-4 inline-flex" to={`/${currentSpace.slug}/player/${publishedPreview.id}`}>
                    <Button size="lg">
                      <Play className="h-4 w-4 fill-current" />
                      Open Player
                    </Button>
                  </Link>
                </div>
              </div>
            ) : null}
            {lastVideoId ? (
              <div className="rounded-[1.2rem] border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm text-emerald-100">
                Uploaded to YouTube with videoId: <span className="font-semibold">{lastVideoId}</span>
              </div>
            ) : null}
            {Object.entries(progress).length ? (
              Object.entries(progress).map(([key, value]) => (
                <div key={key}>
                  <div className="mb-1 flex justify-between text-xs uppercase tracking-[0.24em] text-white/55">
                    <span>{key}</span>
                    <span>{value}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-gold to-ember" style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-white/55">No uploads started yet.</p>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
