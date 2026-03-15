# Reverie

Reverie is a premium multi-tenant private-memory streaming platform inspired by Netflix and designed for couples and families. Each tenant gets a fully isolated private `space` with its own members, profiles, media catalog, collections, seasons, categories, watch state, homepage layout, and branding.

This repository contains a production-oriented React 18 + Vite + TypeScript frontend scaffold, plus Firebase/Firestore architecture files for the multi-tenant backend model.

## Product overview

Reverie is not a gallery or diary. It is a cinematic streaming experience for personal memories:

- a global animated `R` intro with sound support
- Netflix-style profile selection after login
- immersive homepage with featured hero and streaming rails
- full-screen playback for both videos and photo-collection slideshows
- profile-personalized continue watching and favorites
- tenant-isolated admin tools for uploads, metadata, profiles, invites, and homepage curation
- platform admin tools for managing all tenant spaces

## Stack

- React 18
- Vite
- TypeScript
- Tailwind CSS
- React Router
- React Hook Form + Zod
- Firebase Authentication
- Cloud Firestore
- Framer Motion
- lucide-react
- sonner
- dayjs

## Current repository contents

- app scaffold and route structure
- tenant-aware contexts and guards
- cinematic intro and profile selection flows
- immersive homepage, collection detail, search, favorites, continue watching, and player pages
- space admin dashboard and media upload studio
- platform admin dashboard scaffold
- Firebase schema types, rules, and index definitions
- pluggable media provider interface with YouTube-backed MVP implementation scaffolding
- seeded demo data fallback for local UI development

## Project structure

```text
src/
  app/
  components/
    admin/
    auth/
    common/
    home/
    intro/
    layout/
    player/
    profiles/
    ui/
  context/
  hooks/
  lib/
  pages/
    admin/
    app/
    auth/
    platform/
  routes/
  services/
    firebase/
    player/
    providers/
    utils/
  styles/
  tests/
  types/
firebase/
docs/
functions/
```

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment config:

```bash
cp .env.example .env.local
```

3. Fill in frontend-safe Firebase and media provider values.

4. Start the app:

```bash
npm run dev
```

5. Build for production:

```bash
npm run build
```

6. For YouTube-backed uploads, install Cloud Functions dependencies separately:

```bash
cd functions && npm install
```

7. Deploy the updated Functions before testing YouTube connect from localhost:

```bash
firebase deploy --only functions
```

## Environment variables

Firebase:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Media provider placeholders:

- `VITE_MEDIA_PROVIDER`
- `VITE_MEDIA_PUBLIC_KEY`
- `VITE_MEDIA_PRIVATE_KEY`
- `VITE_MEDIA_CLOUD_NAME`
- `VITE_MEDIA_BUCKET_NAME`

## Multi-tenant model

Each private tenant is stored under `spaces/{spaceId}`. Tenant-private application data lives in subcollections beneath the space root, including memberships, profiles, media items, collections, categories, seasons, invites, homepage rows, and activity logs.

Recommended Firestore architecture:

- top-level global collections for `users`, `spaces`, platform settings, and plan catalog
- nested `spaces/{spaceId}/...` collections for private tenant data
- profile-scoped subcollections for favorites, continue watching, and watch history

Details:

- Architecture guide: [docs/firestore-architecture.md](/Users/amritkhadka/R/docs/firestore-architecture.md)
- Security rules: [firebase/firestore.rules](/Users/amritkhadka/R/firebase/firestore.rules)
- Indexes: [firebase/firestore.indexes.json](/Users/amritkhadka/R/firebase/firestore.indexes.json)

## Role model

### Platform super admin

- creates and manages spaces
- suspends or deletes tenants
- reads all tenant data
- manages global settings and future billing controls

### Space admin

- uploads videos to a connected YouTube account and uploads photo collections for in-app slideshow playback
- manages metadata, categories, collections, seasons, profiles, invites, and homepage layout
- cannot access other spaces

### Member

- logs into an authorized space
- selects a profile
- browses and plays media
- manages favorites and continue watching
- cannot manage content or membership

## Authentication model

- Firebase Auth authenticates users at the account level
- login is space-aware in the app flow
- membership is validated against `spaces/{spaceId}/memberships/{uid}`
- profile selection happens after login
- profiles are not separate auth accounts

Custom claims recommendation:

- use custom claims for `platformRole=super_admin`
- store space-specific roles in Firestore membership docs

## Content model

Supported media types:

- `video`
- `photo_collection`

Photo collections are treated as playable cinematic slideshows rather than static galleries. Frames are stored under `mediaItems/{mediaItemId}/frames`, and playback uses the same full-screen player shell as video.

For the MVP, video media is hosted on YouTube:

- admin connects a YouTube account with OAuth 2.0
- Cloud Functions upload videos using YouTube Data API v3
- videos are uploaded as `PRIVATE`
- Firestore stores `youtubeVideoId`
- playback uses the YouTube Iframe Player API inside a custom fullscreen overlay
- custom app UI handles next-up countdown and collection autoplay logic

## Homepage behavior

Default homepage priority:

1. Recently Added
2. Featured memory/banner
3. Continue Watching
4. Seasons
5. Collections
6. Categories
7. Favorites / My List

Homepage rows are configurable per tenant through `homepageRows`.

## Media provider abstraction

The app includes a provider interface intended for future storage/provider swaps:

- `uploadVideo()`
- `uploadImage()`
- `getPlaybackUrl()`
- `deleteAsset()`

The current scaffold includes a YouTube provider for MVP wiring while keeping the abstraction layer intact for a later move to Mux or Cloudinary.

Cloud Functions required for the YouTube MVP:

- `connectYouTubeAccount`
- `handleYouTubeOAuthCallback`
- `uploadVideoToYouTube`
- `refreshYouTubeToken`
- `revokeYouTubeAccess`

For local-only YouTube OAuth testing without Blaze, use a Functions env file instead:

```bash
cp functions/.env.example functions/.env
```

Then fill in:

- `YOUTUBE_CLIENT_ID`
- `YOUTUBE_CLIENT_SECRET`
- `YOUTUBE_REDIRECT_URI`

Recommended local dev flow:

```bash
cd functions && npm install
firebase emulators:start
```

And in your root `.env.local`:

```bash
VITE_USE_FUNCTIONS_EMULATOR=true
```

This env-based setup is for local development only. For production, move back to Firebase Functions secrets.

## Firestore collections needed

Top-level:

- `users`
- `spaces`
- `platformSettings`
- `subscriptionPlans`

Per space:

- `memberships`
- `profiles`
- `categories`
- `collections`
- `seasons`
- `mediaItems`
- `mediaAssets`
- `invites`
- `homepageRows`
- `activityLogs`
- `subscriptions`
- `analyticsDaily`

Profile-scoped:

- `favorites`
- `continueWatching`
- `watchHistory`

## Security rule assumptions

- only authenticated users can access data
- only members of a space can read that space
- only space admins can manage profiles, content, invites, homepage rows, and settings
- profile-personalized writes validate `spaceId`, `profileId`, and `mediaItemId`
- platform super admins bypass space checks

More sensitive workflows should use Cloud Functions or trusted server routes:

- invite creation and acceptance
- space creation
- admin claim changes
- YouTube OAuth token storage and refresh
- YouTube upload orchestration
- billing webhooks
- immutable audit log enforcement

## Deploying to Vercel

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add the `VITE_...` environment variables.
4. Deploy Firestore rules and indexes with the Firebase CLI separately.

## Current limitations

- this scaffold uses seeded demo content for local UI rendering until Firebase services are connected
- YouTube upload flows are scaffolded but still expect real Cloud Functions and OAuth token persistence
- email delivery and invite acceptance should be finalized with Cloud Functions
- Stripe subscription flows are represented as future-ready placeholders
- real thumbnail/banner storage still needs a non-YouTube image provider or Firebase Storage

## Future enhancements

- Stripe billing and self-serve onboarding
- profile PIN locks and kids mode
- subtitles and captions
- watch parties
- YouTube-to-Mux or Cloudinary migration through the media provider abstraction
- richer analytics
- export/backup jobs
- background music for photo slideshows
- search indexing service
# R-netflix
