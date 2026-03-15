export type TimestampLike = string;

export type PlatformRole = "super_admin" | "none";
export type MembershipRole = "space_admin" | "member";
export type MembershipStatus = "pending" | "active" | "suspended" | "revoked";
export type SpaceStatus = "active" | "suspended" | "deleted" | "trialing";
export type MediaType = "video" | "photo_collection";
export type SeasonType = "auto_year" | "custom";
export type Visibility = "private";
export type InviteStatus = "pending" | "accepted" | "expired" | "revoked";
export type AssetType =
  | "video"
  | "image"
  | "photo_collection_bundle"
  | "thumbnail"
  | "banner"
  | "avatar";
export type HomepageRowSourceType =
  | "recently_added"
  | "featured"
  | "continue_watching"
  | "favorites"
  | "collection"
  | "category"
  | "season"
  | "custom_query";

export interface UserDoc {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  platformRole: PlatformRole;
  status: "active" | "disabled";
  defaultSpaceId?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  lastLoginAt?: TimestampLike;
}

export interface SpaceDoc {
  id: string;
  name: string;
  slug: string;
  ownerUserId: string;
  status: SpaceStatus;
  planId?: string;
  subscriptionId?: string;
  featuredMediaId?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  introSoundEnabled: boolean;
  autoplayNextEnabled: boolean;
  profileSelectionEnabled: boolean;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  suspendedAt?: TimestampLike;
}

export interface MembershipDoc {
  userId: string;
  spaceId: string;
  email: string;
  role: MembershipRole;
  status: MembershipStatus;
  invitedBy?: string;
  inviteId?: string;
  joinedAt?: TimestampLike;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface ProfileDoc {
  id: string;
  spaceId: string;
  name: string;
  avatarUrl: string;
  createdBy: string;
  sortOrder: number;
  isActive: boolean;
  isKids?: boolean;
  pinEnabled?: boolean;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface CategoryDoc {
  id: string;
  spaceId: string;
  name: string;
  slug: string;
  description?: string;
  railTitle?: string;
  sortOrder: number;
  createdBy: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface CollectionDoc {
  id: string;
  spaceId: string;
  title: string;
  slug: string;
  description: string;
  categoryId?: string;
  bannerImageUrl: string;
  thumbnailUrl: string;
  customSeasonId?: string;
  autoYearSeason?: number;
  featured: boolean;
  sortOrder: number;
  playAllEnabled: boolean;
  itemCount: number;
  createdBy: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface SeasonDoc {
  id: string;
  spaceId: string;
  type: SeasonType;
  title: string;
  slug: string;
  year?: number;
  description?: string;
  sortOrder: number;
  isSystemGenerated: boolean;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface MediaItemDoc {
  id: string;
  spaceId: string;
  type: MediaType;
  title: string;
  slug: string;
  description: string;
  collectionId?: string;
  categoryId?: string;
  customSeasonId?: string;
  autoYearSeason?: number;
  dateOfMemory: TimestampLike;
  thumbnailUrl: string;
  bannerImageUrl: string;
  mediaAssetId: string;
  durationSeconds: number;
  episodeNumber?: number;
  featured: boolean;
  tags: string[];
  location?: string;
  playbackOrder: number;
  transitionStyle?: string;
  slideshowDurationSeconds?: number;
  backgroundAudioAssetId?: string;
  createdBy: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
  published: boolean;
  publishedAt?: TimestampLike;
  visibility: Visibility;
}

export interface MediaAssetDoc {
  id: string;
  spaceId: string;
  assetType: AssetType;
  provider: string;
  providerAssetId: string;
  originalFilename: string;
  playbackUrl?: string;
  streamingUrl?: string;
  downloadUrl?: string;
  securePlaybackToken?: string;
  metadata: Record<string, unknown>;
  createdBy: string;
  createdAt: TimestampLike;
}

export interface PhotoCollectionFrameDoc {
  id: string;
  mediaItemId: string;
  spaceId: string;
  imageAssetId: string;
  imageUrl: string;
  sortOrder: number;
  caption?: string;
  transition?: string;
  durationMs?: number;
}

export interface FavoriteDoc {
  mediaItemId: string;
  profileId: string;
  spaceId: string;
  createdAt: TimestampLike;
}

export interface ContinueWatchingDoc {
  mediaItemId: string;
  profileId: string;
  spaceId: string;
  progressSeconds: number;
  durationSeconds: number;
  percentComplete: number;
  lastPositionUpdatedAt: TimestampLike;
  updatedAt: TimestampLike;
  completed: boolean;
}

export interface WatchHistoryDoc {
  id: string;
  mediaItemId: string;
  profileId: string;
  spaceId: string;
  watchedAt: TimestampLike;
  progressSeconds: number;
  durationSeconds: number;
  completed: boolean;
  sessionStartedAt?: TimestampLike;
}

export interface InviteDoc {
  id: string;
  spaceId: string;
  email: string;
  role: MembershipRole;
  tokenHash: string;
  status: InviteStatus;
  expiresAt: TimestampLike;
  acceptedAt?: TimestampLike;
  acceptedByUserId?: string;
  createdBy: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface HomepageRowDoc {
  id: string;
  spaceId: string;
  title: string;
  rowType: "hero" | "rail";
  sourceType: HomepageRowSourceType;
  sourceId?: string;
  enabled: boolean;
  order: number;
  limit?: number;
  presentation?: {
    cardStyle?: "poster" | "landscape" | "featured";
    emphasizeFirst?: boolean;
  };
  updatedAt: TimestampLike;
  updatedBy: string;
}

export interface ActivityLogDoc {
  id: string;
  spaceId: string;
  actorUserId: string;
  actorRole: PlatformRole | MembershipRole;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  createdAt: TimestampLike;
}

export interface SpaceSubscriptionDoc {
  id: string;
  spaceId: string;
  planId: string;
  status:
    | "trialing"
    | "active"
    | "past_due"
    | "paused"
    | "canceled"
    | "incomplete";
  trialEndsAt?: TimestampLike;
  currentPeriodStart?: TimestampLike;
  currentPeriodEnd?: TimestampLike;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface SubscriptionPlanDoc {
  id: string;
  code: string;
  name: string;
  status: "active" | "archived";
  billingInterval: "month" | "year";
  amountCents: number;
  currency: string;
  maxMembers?: number;
  maxProfiles?: number;
  maxStorageGb?: number;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface AnalyticsDailyDoc {
  dateKey: string;
  spaceId: string;
  totalViews: number;
  uniqueProfiles: number;
  minutesWatched: number;
  favoriteAdds: number;
  topMediaIds: string[];
  generatedAt: TimestampLike;
}

export const COLLECTION_PATHS = {
  users: "users",
  spaces: "spaces",
  platformSettings: "platformSettings",
  subscriptionPlans: "subscriptionPlans",
} as const;
