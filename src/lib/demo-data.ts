import type {
  Category,
  Collection,
  ContinueWatchingRecord,
  FavoriteRecord,
  HomepageRow,
  MediaItem,
  Profile,
  Season,
  SpaceSummary,
  UserAccount,
} from "@/types/domain";

export const demoSpaces: SpaceSummary[] = [
  {
    id: "space_luna_house",
    slug: "luna-house",
    name: "Luna House",
    description: "A private streaming space for the Luna family.",
    featuredMediaId: "media_anniversary_film",
    branding: {
      logoWordmark: "Reverie / Luna House",
      accent: "#cfb07a",
      heroGradient:
        "linear-gradient(135deg, rgba(207,176,122,0.32), rgba(255,141,109,0.18) 40%, rgba(18,27,47,0.94) 100%)",
    },
  },
];

export const demoUser: UserAccount = {
  id: "user_1",
  email: "hello@lunahouse.app",
  displayName: "Avery Luna",
  platformRole: "none",
  memberships: [{ spaceId: "space_luna_house", role: "space_admin" }],
};

export const demoProfiles: Profile[] = [
  {
    id: "profile_avery",
    spaceId: "space_luna_house",
    name: "Avery",
    subtitle: "Keeps the edits and the chaos",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
    sortOrder: 1,
  },
  {
    id: "profile_jules",
    spaceId: "space_luna_house",
    name: "Jules",
    subtitle: "Always starts with the travel reels",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
    sortOrder: 2,
  },
  {
    id: "profile_milo",
    spaceId: "space_luna_house",
    name: "Milo",
    subtitle: "Replays the beach slideshow",
    avatarUrl:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=400&q=80",
    sortOrder: 3,
  },
];

export const demoCategories: Category[] = [
  {
    id: "cat_travel",
    spaceId: "space_luna_house",
    name: "Travel",
    description: "Trips, flights, roads, and ocean light.",
  },
  {
    id: "cat_celebration",
    spaceId: "space_luna_house",
    name: "Celebration",
    description: "Birthdays, anniversaries, and milestones.",
  },
  {
    id: "cat_daily_life",
    spaceId: "space_luna_house",
    name: "Daily Life",
    description: "Soft moments from ordinary days.",
  },
];

export const demoSeasons: Season[] = [
  {
    id: "season_dating_era",
    spaceId: "space_luna_house",
    title: "Dating Era",
    type: "custom",
  },
  {
    id: "season_marriage_era",
    spaceId: "space_luna_house",
    title: "Marriage Era",
    type: "custom",
  },
  {
    id: "year_2024",
    spaceId: "space_luna_house",
    title: "2024",
    type: "auto_year",
    year: 2024,
  },
];

export const demoCollections: Collection[] = [
  {
    id: "collection_bali_trip",
    spaceId: "space_luna_house",
    title: "Bali Trip 2024",
    description: "Rainy scooter rides, temple mornings, and golden water.",
    categoryId: "cat_travel",
    bannerUrl:
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=800&q=80",
    seasonId: "year_2024",
    featured: true,
  },
  {
    id: "collection_anniversary_week",
    spaceId: "space_luna_house",
    title: "Anniversary Week",
    description: "A week of dinners, candlelight, and quiet little vows.",
    categoryId: "cat_celebration",
    bannerUrl:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=800&q=80",
    seasonId: "season_marriage_era",
    featured: false,
  },
  {
    id: "collection_first_apartment",
    spaceId: "space_luna_house",
    title: "First Apartment",
    description: "Cardboard boxes, takeaway dinners, and our first couch.",
    categoryId: "cat_daily_life",
    bannerUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1400&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80",
    seasonId: "season_dating_era",
    featured: false,
  },
];

export const demoMediaItems: MediaItem[] = [
  {
    id: "media_anniversary_film",
    spaceId: "space_luna_house",
    type: "video",
    title: "Anniversary Film",
    description: "A softly cut short film from our anniversary dinner and beach sunrise.",
    categoryId: "cat_celebration",
    collectionId: "collection_anniversary_week",
    customSeasonId: "season_marriage_era",
    autoYearSeason: 2024,
    durationSeconds: 384,
    playbackOrder: 1,
    featured: true,
    dateOfMemory: "2024-08-17",
    bannerUrl:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80",
    backdropUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    tags: ["anniversary", "beach", "sunrise"],
    location: "Byron Bay",
    youtubeVideoId: "aqz-KE-bpKQ",
  },
  {
    id: "media_anniversary_slideshow",
    spaceId: "space_luna_house",
    type: "photo_collection",
    title: "Candlelight Dinner",
    description: "The stillness before dessert, stitched into a moving memory reel.",
    categoryId: "cat_celebration",
    collectionId: "collection_anniversary_week",
    customSeasonId: "season_marriage_era",
    autoYearSeason: 2024,
    durationSeconds: 42,
    playbackOrder: 2,
    featured: false,
    dateOfMemory: "2024-08-17",
    bannerUrl:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80",
    backdropUrl:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
    tags: ["dinner", "anniversary"],
    frames: [
      {
        id: "frame_1",
        imageUrl:
          "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=80",
        caption: "The table we kept lingering at.",
        durationMs: 5500,
        transition: "zoom",
      },
      {
        id: "frame_2",
        imageUrl:
          "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1600&q=80",
        caption: "Hands warm, city lights blurred behind us.",
        durationMs: 5500,
        transition: "pan",
      },
      {
        id: "frame_3",
        imageUrl:
          "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1600&q=80",
        caption: "One more toast before midnight.",
        durationMs: 5500,
        transition: "fade",
      },
    ],
  },
  {
    id: "media_bali_video",
    spaceId: "space_luna_house",
    type: "video",
    title: "Scooter Through Ubud",
    description: "The camera rolling while the road disappeared into rain and palms.",
    categoryId: "cat_travel",
    collectionId: "collection_bali_trip",
    autoYearSeason: 2024,
    durationSeconds: 468,
    playbackOrder: 1,
    featured: false,
    dateOfMemory: "2024-04-10",
    bannerUrl:
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=900&q=80",
    backdropUrl:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80",
    tags: ["travel", "ubud", "rain"],
    location: "Bali",
    youtubeVideoId: "M7lc1UVf-VE",
  },
  {
    id: "media_bali_slideshow",
    spaceId: "space_luna_house",
    type: "photo_collection",
    title: "Temple Morning",
    description: "Incense smoke, carved stone, and quiet sunlight over the water.",
    categoryId: "cat_travel",
    collectionId: "collection_bali_trip",
    autoYearSeason: 2024,
    durationSeconds: 36,
    playbackOrder: 2,
    featured: false,
    dateOfMemory: "2024-04-12",
    bannerUrl:
      "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=900&q=80",
    backdropUrl:
      "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1600&q=80",
    tags: ["temple", "travel"],
    frames: [
      {
        id: "frame_1",
        imageUrl:
          "https://images.unsplash.com/photo-1528127269322-539801943592?auto=format&fit=crop&w=1600&q=80",
        caption: "We arrived before the crowds.",
        durationMs: 6000,
        transition: "pan",
      },
      {
        id: "frame_2",
        imageUrl:
          "https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=1600&q=80",
        caption: "The ocean stayed silver all morning.",
        durationMs: 6000,
        transition: "zoom",
      },
    ],
  },
  {
    id: "media_apartment_video",
    spaceId: "space_luna_house",
    type: "video",
    title: "Moving Day",
    description: "Boxes, pizza, and a time-lapse of our first room coming together.",
    categoryId: "cat_daily_life",
    collectionId: "collection_first_apartment",
    customSeasonId: "season_dating_era",
    autoYearSeason: 2024,
    durationSeconds: 295,
    playbackOrder: 1,
    featured: false,
    dateOfMemory: "2024-01-14",
    bannerUrl:
      "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1600&q=80",
    thumbnailUrl:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=900&q=80",
    backdropUrl:
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1600&q=80",
    tags: ["home", "moving", "timelapse"],
    youtubeVideoId: "ScMzIvxBSi4",
  },
];

export const demoHomepageRows: HomepageRow[] = [
  { id: "row_recent", title: "Recently Added", type: "recently_added" },
  { id: "row_continue", title: "Continue Watching", type: "continue_watching" },
  { id: "row_seasons", title: "Seasons", type: "seasons" },
  { id: "row_collections", title: "Collections", type: "collections" },
  { id: "row_categories", title: "Categories", type: "categories" },
  { id: "row_favorites", title: "My List", type: "favorites" },
];

export const demoFavorites: FavoriteRecord[] = [
  {
    profileId: "profile_avery",
    mediaItemId: "media_anniversary_film",
    createdAt: "2026-03-15T20:00:00.000Z",
  },
  {
    profileId: "profile_avery",
    mediaItemId: "media_bali_slideshow",
    createdAt: "2026-03-16T20:00:00.000Z",
  },
];

export const demoContinueWatching: ContinueWatchingRecord[] = [
  {
    profileId: "profile_avery",
    mediaItemId: "media_bali_video",
    progressSeconds: 182,
    updatedAt: "2026-03-17T20:00:00.000Z",
    completed: false,
  },
  {
    profileId: "profile_avery",
    mediaItemId: "media_apartment_video",
    progressSeconds: 74,
    updatedAt: "2026-03-13T20:00:00.000Z",
    completed: false,
  },
];
