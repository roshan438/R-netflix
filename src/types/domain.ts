export type Role = "super_admin" | "space_admin" | "member";
export type ProfileRole = "viewer";
export type MediaKind = "video" | "photo_collection";
export type HomepageRowType =
  | "recently_added"
  | "continue_watching"
  | "collections"
  | "categories"
  | "seasons"
  | "favorites";

export interface TenantBranding {
  logoWordmark: string;
  accent: string;
  heroGradient: string;
}

export interface SpaceSummary {
  id: string;
  slug: string;
  name: string;
  description: string;
  branding: TenantBranding;
  featuredMediaId: string;
}

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  platformRole: Exclude<Role, "space_admin" | "member"> | "none";
  defaultSpaceId?: string;
  pendingApproval?: {
    requestId: string;
    status: "pending" | "approved" | "rejected";
    requestedSpaceName: string;
    requestedSpaceSlug: string;
    assignedSpaceId?: string;
  };
  memberships: Array<{
    spaceId: string;
    role: Exclude<Role, "super_admin">;
  }>;
}

export interface SpaceAccessRequest {
  id: string;
  userId: string;
  email: string;
  displayName: string;
  requestedSpaceName: string;
  requestedSpaceSlug: string;
  status: "pending" | "approved" | "rejected";
  authProvider: "google" | "password";
  assignedSpaceId?: string;
}

export interface Profile {
  id: string;
  spaceId: string;
  name: string;
  avatarUrl: string;
  subtitle: string;
  sortOrder: number;
}

export interface Category {
  id: string;
  spaceId: string;
  name: string;
  description: string;
}

export interface Season {
  id: string;
  spaceId: string;
  title: string;
  type: "auto_year" | "custom";
  year?: number;
}

export interface Collection {
  id: string;
  spaceId: string;
  title: string;
  description: string;
  categoryId: string;
  bannerUrl: string;
  thumbnailUrl: string;
  seasonId?: string;
  featured: boolean;
}

export interface MediaFrame {
  id: string;
  imageUrl: string;
  caption?: string;
  durationMs: number;
  transition: "fade" | "pan" | "zoom";
}

export interface MediaItem {
  id: string;
  spaceId: string;
  type: MediaKind;
  title: string;
  description: string;
  categoryId: string;
  collectionId: string;
  customSeasonId?: string;
  autoYearSeason: number;
  durationSeconds: number;
  playbackOrder: number;
  featured: boolean;
  dateOfMemory: string;
  bannerUrl: string;
  thumbnailUrl: string;
  backdropUrl: string;
  tags: string[];
  location?: string;
  youtubeVideoId?: string;
  frames?: MediaFrame[];
}

export interface FavoriteRecord {
  profileId: string;
  mediaItemId: string;
  createdAt: string;
}

export interface ContinueWatchingRecord {
  profileId: string;
  mediaItemId: string;
  progressSeconds: number;
  updatedAt: string;
  completed: boolean;
}

export interface HomepageRow {
  id: string;
  title: string;
  type: HomepageRowType;
  sourceId?: string;
}

export interface SearchFilters {
  query: string;
  type?: MediaKind | "all";
  categoryId?: string;
  seasonId?: string;
}
