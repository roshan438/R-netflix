# Firestore Architecture Details

## Final recommendation

Use a hybrid Firestore design:

- top-level global collections for user identity and platform control
- tenant-private subcollections under `spaces/{spaceId}`
- profile-personalized state nested under profiles

This gives the best balance of tenant isolation, query clarity, and security rule maintainability.

## Final collection breakdown

### Top-level collections

#### `users/{userId}`

Global auth identity document.

Recommended document ID:

- Firebase Auth `uid`

Key fields:

- `email`
- `displayName`
- `photoURL`
- `platformRole`
- `status`
- `defaultSpaceId`
- `createdAt`
- `updatedAt`

Example:

```json
{
  "email": "alex@example.com",
  "displayName": "Alex Rivera",
  "photoURL": "https://cdn.example.com/avatars/alex.jpg",
  "platformRole": "none",
  "status": "active",
  "defaultSpaceId": "space_rivera_home",
  "createdAt": "2026-03-15T08:00:00.000Z",
  "updatedAt": "2026-03-15T08:00:00.000Z"
}
```

#### `spaces/{spaceId}`

Tenant root and space-level settings anchor.

Recommended document ID:

- generated stable ID such as `space_rivera_home`

Key fields:

- `name`
- `slug`
- `ownerUserId`
- `status`
- `planId`
- `subscriptionId`
- `featuredMediaId`
- `logoUrl`
- `primaryColor`
- `secondaryColor`
- `introSoundEnabled`
- `autoplayNextEnabled`
- `profileSelectionEnabled`
- `createdAt`
- `updatedAt`

Example:

```json
{
  "name": "Rivera Home",
  "slug": "rivera-home",
  "ownerUserId": "uid_space_admin_1",
  "status": "active",
  "planId": "family_studio",
  "subscriptionId": "sub_rivera_home",
  "featuredMediaId": "media_wedding_film",
  "logoUrl": "https://cdn.example.com/space/logo.png",
  "primaryColor": "#C7A16B",
  "secondaryColor": "#5F4650",
  "introSoundEnabled": true,
  "autoplayNextEnabled": true,
  "profileSelectionEnabled": true,
  "createdAt": "2026-03-15T08:00:00.000Z",
  "updatedAt": "2026-03-15T08:00:00.000Z"
}
```

#### `platformSettings/{docId}`

Global platform settings. Keep this limited.

Suggested docs:

- `global`
- `moderation`
- `featureFlags`

#### `subscriptionPlans/{planId}`

Future billing catalog for self-serve expansion.

## Tenant-scoped collections

### `spaces/{spaceId}/memberships/{userId}`

Use the user UID as the membership document ID. This makes membership lookups constant-time and simplifies rules.

Why membership should not be embedded in `users`:

- easier tenant-scoped access control
- better for future multi-space membership
- simpler to query within a space
- avoids wide user documents

Fields:

- `userId`
- `spaceId`
- `email`
- `role`
- `status`
- `invitedBy`
- `inviteId`
- `joinedAt`
- `createdAt`
- `updatedAt`

Example:

```json
{
  "userId": "uid_member_1",
  "spaceId": "space_rivera_home",
  "email": "jamie@example.com",
  "role": "member",
  "status": "active",
  "invitedBy": "uid_space_admin_1",
  "inviteId": "invite_x7df3",
  "joinedAt": "2026-03-15T08:30:00.000Z",
  "createdAt": "2026-03-15T08:10:00.000Z",
  "updatedAt": "2026-03-15T08:30:00.000Z"
}
```

### `spaces/{spaceId}/profiles/{profileId}`

Profiles are browse personas, not auth accounts.

Recommended ID:

- generated ID such as `profile_alex`

Fields:

- `spaceId`
- `name`
- `avatarUrl`
- `createdBy`
- `sortOrder`
- `isActive`
- `isKids`
- `pinEnabled`
- `createdAt`
- `updatedAt`

### `spaces/{spaceId}/categories/{categoryId}`

Broad content taxonomy, such as Travel or Celebration.

### `spaces/{spaceId}/collections/{collectionId}`

Series-like content grouping, such as `bali-trip-2024`.

Use denormalized media counts and banner URLs for fast collection detail page rendering.

### `spaces/{spaceId}/seasons/{seasonId}`

Store both custom and auto-year seasons in one collection.

Recommended IDs:

- custom: `season_dating_era`
- auto year: `year_2024`

Example:

```json
{
  "type": "auto_year",
  "title": "2024",
  "slug": "2024",
  "year": 2024,
  "description": "Memories captured in 2024",
  "sortOrder": 2024,
  "isSystemGenerated": true,
  "createdAt": "2026-03-15T08:00:00.000Z",
  "updatedAt": "2026-03-15T08:00:00.000Z"
}
```

### `spaces/{spaceId}/mediaAssets/{assetId}`

Asset registry for provider-specific media objects.

Keep these separate from `mediaItems` because one media item may reference multiple assets:

- primary playback asset or YouTube upload record
- thumbnail
- banner
- slideshow frame assets
- future audio asset

### `spaces/{spaceId}/mediaItems/{mediaItemId}`

Playable items.

Recommended IDs:

- `media_wedding_film`
- `media_bali_slideshow`

Key denormalized fields:

- `spaceId`
- `collectionId`
- `categoryId`
- `customSeasonId`
- `autoYearSeason`
- `thumbnailUrl`
- `bannerImageUrl`
- `durationSeconds`
- `playbackOrder`
- `published`
- `publishedAt`
- `featured`

This denormalization avoids extra joins for most app rails.

Example:

```json
{
  "spaceId": "space_rivera_home",
  "type": "video",
  "title": "Wedding Film",
  "slug": "wedding-film",
  "description": "Highlights from our wedding day.",
  "collectionId": "collection_wedding_week",
  "categoryId": "category_celebration",
  "customSeasonId": "season_marriage_era",
  "autoYearSeason": 2024,
  "dateOfMemory": "2024-06-12T00:00:00.000Z",
  "thumbnailUrl": "https://cdn.example.com/thumb.jpg",
  "bannerImageUrl": "https://cdn.example.com/banner.jpg",
  "mediaAssetId": "asset_video_1",
  "youtubeVideoId": "aqz-KE-bpKQ",
  "durationSeconds": 482,
  "episodeNumber": 1,
  "featured": true,
  "tags": ["wedding", "family"],
  "location": "Sydney",
  "playbackOrder": 1,
  "createdBy": "uid_space_admin_1",
  "createdAt": "2026-03-15T08:00:00.000Z",
  "updatedAt": "2026-03-15T08:00:00.000Z",
  "published": true,
  "publishedAt": "2026-03-15T08:00:00.000Z",
  "visibility": "private"
}
```

### YouTube MVP note

For the MVP, `mediaItems.type == "video"` should store:

- `youtubeVideoId`
- `mediaAssetId` pointing to the provider record

And `mediaAssets` should store YouTube-specific metadata such as:

- `provider: "youtube"`
- `providerAssetId: youtubeVideoId`
- token owner account reference
- upload status
- privacy status

Private-video access is not enforced by the app alone. Viewers must also be signed into a Gmail account that the space admin has authorized in YouTube Studio.

### `spaces/{spaceId}/mediaItems/{mediaItemId}/frames/{frameId}`

Use this only for `photo_collection` media items.

Why nest under `mediaItems`:

- frames are only meaningful inside one playable slideshow
- ordering and editing stay tightly scoped
- keeps collection group noise down

Fields:

- `spaceId`
- `mediaItemId`
- `imageAssetId`
- `imageUrl`
- `sortOrder`
- `caption`
- `transition`
- `durationMs`

### `spaces/{spaceId}/invites/{inviteId}`

Recommended fields:

- `spaceId`
- `email`
- `role`
- `tokenHash`
- `status`
- `expiresAt`
- `acceptedAt`
- `acceptedByUserId`
- `createdBy`
- `createdAt`
- `updatedAt`

Use a random invite ID and a long random token. Persist only a hash of the token in Firestore.

### `spaces/{spaceId}/homepageRows/{rowId}`

This is the homepage layout configuration.

Example:

```json
{
  "spaceId": "space_rivera_home",
  "title": "Recently Added",
  "rowType": "rail",
  "sourceType": "recently_added",
  "enabled": true,
  "order": 10,
  "limit": 18,
  "presentation": {
    "cardStyle": "landscape",
    "emphasizeFirst": true
  },
  "updatedAt": "2026-03-15T08:00:00.000Z",
  "updatedBy": "uid_space_admin_1"
}
```

Recommended default order:

1. recently added
2. featured hero
3. continue watching
4. seasons
5. collections
6. categories
7. favorites

### `spaces/{spaceId}/activityLogs/{logId}`

Append-only operational audit log.

Fields:

- `spaceId`
- `actorUserId`
- `actorRole`
- `action`
- `targetType`
- `targetId`
- `metadata`
- `createdAt`

Recommended actions:

- `space.created`
- `member.invited`
- `invite.accepted`
- `profile.created`
- `media.created`
- `media.updated`
- `media.deleted`
- `collection.created`
- `category.created`
- `season.created`
- `homepage.featured_changed`
- `settings.updated`

### `spaces/{spaceId}/subscriptions/{subscriptionId}`

Future billing status per tenant.

### `spaces/{spaceId}/analyticsDaily/{yyyymmdd}`

Optional daily rollup documents for admin dashboards and billing analytics.

## Profile-scoped collections

### `spaces/{spaceId}/profiles/{profileId}/favorites/{mediaItemId}`

Recommendation:

- use `mediaItemId` as document ID

Why:

- prevents duplicates naturally
- easy direct toggling
- ideal for `My List`

Example:

```json
{
  "spaceId": "space_rivera_home",
  "profileId": "profile_alex",
  "mediaItemId": "media_wedding_film",
  "createdAt": "2026-03-15T09:00:00.000Z"
}
```

### `spaces/{spaceId}/profiles/{profileId}/continueWatching/{mediaItemId}`

Recommendation:

- use `mediaItemId` as document ID

Why not compute from watch history every time:

- faster homepage loads
- easier resume behavior
- cleaner “continue watching” rail

Use watch history as audit/session data and `continueWatching` as the current resume snapshot.

### `spaces/{spaceId}/profiles/{profileId}/watchHistory/{historyId}`

Append-only event/session history.

Recommendation:

- generated IDs
- optionally one record per playback session

This supports:

- recently watched
- analytics
- debugging resume issues

## Relationship strategy

Use reference-by-ID with selective denormalization.

### Normalized references

- `mediaItems.collectionId`
- `mediaItems.categoryId`
- `mediaItems.customSeasonId`
- `mediaItems.mediaAssetId`
- `collections.categoryId`

### Denormalized convenience fields

- `spaceId` on every tenant document
- media `thumbnailUrl` and `bannerImageUrl`
- `autoYearSeason` on media items
- collection banner/thumb URLs and item count
- favorite and continue docs storing `spaceId`, `profileId`, `mediaItemId`

Why:

- Firestore is optimized for read-driven denormalization
- homepage and rails should avoid N+1 lookups

## Auth and claims strategy

### Recommended model

Custom claims:

- `platformRole=super_admin` only

Firestore documents:

- all space roles in `spaces/{spaceId}/memberships/{uid}`

### Tradeoffs

Use custom claims for platform admin because:

- platform-wide authorization is rare
- claim reads are cheap in rules
- it avoids duplicating privileged checks everywhere

Do not put space memberships into claims by default because:

- future multi-space support becomes awkward
- claims size is limited
- membership changes require token refresh
- invite acceptance and role changes become more fragile

### Future multi-space support

This architecture already supports it. A user can have multiple membership docs under different spaces while keeping a single auth account.

## Invite token model

Recommended invite flow:

1. Space admin requests invite creation
2. Cloud Function creates a random token and stores only `tokenHash`
3. Email link includes raw token plus `spaceId`
4. Invite acceptance screen authenticates the user
5. Cloud Function verifies token hash, email, status, expiration
6. Function writes membership doc, marks invite accepted, logs activity

Recommended expiration:

- 7 days for standard invites
- 24 to 48 hours for higher-security environments

Do not rely on client-only invite acceptance for production.

## YouTube OAuth and upload recommendations

Use Cloud Functions or a trusted backend for all YouTube API work:

1. `connectYouTubeAccount`
2. `uploadVideoToYouTube`
3. `refreshYouTubeToken`
4. `revokeYouTubeAccess`

Recommended token storage:

- encrypted at rest
- scoped to the space admin connection
- never exposed to the frontend

Recommended extra fields for the connected YouTube integration:

- `spaces/{spaceId}/spaceSettings/default.youtubeConnected`
- `spaces/{spaceId}/spaceSettings/default.youtubeChannelTitle`
- `spaces/{spaceId}/mediaAssets/{assetId}.provider = "youtube"`
- `spaces/{spaceId}/mediaAssets/{assetId}.providerAssetId = youtubeVideoId`

Recommended upload flow:

1. frontend selects file
2. frontend sends metadata + file to a secure backend function
3. function refreshes token if needed
4. function uploads to YouTube Data API v3 as `PRIVATE`
5. function returns `videoId`
6. frontend stores Firestore media metadata with `youtubeVideoId`

## Featured banner storage

Store current featured content at the space root or in a settings doc:

- `spaces/{spaceId}.featuredMediaId`

Why:

- fast homepage load
- simple admin update flow

Optional future enhancement:

- support scheduled featured rotation in `homepageRows`

## Collection ordering

Use two fields:

- collection-level `sortOrder`
- media-level `playbackOrder`

Recommended behavior:

- `playbackOrder` controls autoplay sequence inside a collection
- `episodeNumber` is optional presentation metadata
- admin UI should allow drag-and-drop reorder and then persist sequential integers

## Security assumptions

The provided rules are practical, but these operations are safer through Cloud Functions:

- setting platform admin claims
- invite issuance and acceptance
- guaranteed immutable audit logging
- cascading media cleanup
- billing status synchronization

## Frontend access notes

Typical app loading flow:

1. resolve space by slug
2. authenticate user
3. read membership at `spaces/{spaceId}/memberships/{uid}`
4. if active, load profiles
5. store selected `profileId` in session
6. query homepage rows and media rails inside that same space

Recommended query style:

- always query through the current `spaceId`
- avoid collection group queries in normal tenant UX
- reserve collection group queries for platform/admin analytics and tooling

## Final tradeoff summary

This architecture intentionally prefers:

- tenant isolation over extreme flatness
- queryable denormalization over strict normalization
- Firestore memberships over tenant role claims
- profile-scoped subcollections for personalized state
- Cloud Functions for invite and audit-critical operations

That makes it a strong fit for a React + Vite frontend, Firebase Auth, Firestore, and Vercel-hosted SaaS without pretending the frontend alone should own every security-sensitive workflow.
