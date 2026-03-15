import type {
  MediaProvider,
  UploadProgress,
  UploadResult,
} from "@/services/providers/mediaProvider";
import { callFunction } from "@/services/firebase/callables";
import { isFirebaseConfigured } from "@/services/firebase/config";

interface UploadVideoPayload {
  spaceId: string;
  title: string;
  description: string;
  mimeType: string;
  base64File: string;
  collectionId?: string;
  categoryId?: string;
  customSeasonId?: string;
  dateOfMemory?: string;
  thumbnailUrl?: string;
  bannerImageUrl?: string;
  tags?: string[];
  location?: string;
  featured?: boolean;
  playbackOrder?: number;
}

interface UploadVideoResponse {
  videoId: string;
  privacyStatus: "private";
  mediaAssetId: string;
  mediaItemId: string;
  channelTitle?: string;
}

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read file preview."));
    reader.readAsDataURL(file);
  });
}

async function mockFunctionCall<T>(value: T, delay = 700): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(value), delay);
  });
}

function simulateProgress(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
) {
  return new Promise<void>((resolve) => {
    let loaded = 0;
    const total = Math.max(file.size, 1500000);
    const timer = window.setInterval(() => {
      loaded = Math.min(total, loaded + total / 8);
      onProgress?.({
        loaded,
        total,
        percent: Math.round((loaded / total) * 100),
      });
      if (loaded >= total) {
        window.clearInterval(timer);
        resolve();
      }
    }, 260);
  });
}

export const youtubeProvider: MediaProvider = {
  async connectAccount(options) {
    if (isFirebaseConfigured) {
      const result = await callFunction<{ spaceId: string }, { url: string }>("connectYouTubeAccount", {
        spaceId: options?.spaceId ?? "space_luna_house",
      });
      return new Promise<{ connected: boolean; channelTitle?: string }>((resolve, reject) => {
        const popup = window.open(
          result.url,
          "youtube-oauth",
          "width=540,height=720,noopener,noreferrer",
        );

        if (!popup) {
          reject(new Error("Unable to open YouTube authorization window."));
          return;
        }

        const timer = window.setInterval(() => {
          if (popup.closed) {
            window.clearInterval(timer);
            reject(new Error("YouTube authorization window was closed."));
          }
        }, 500);

        const handleMessage = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return;
          if (event.data?.type !== "youtube-oauth-success") return;
          window.clearInterval(timer);
          window.removeEventListener("message", handleMessage);
          popup.close();
          resolve({
            connected: true,
            channelTitle: event.data.channelTitle,
          });
        };

        window.addEventListener("message", handleMessage);
      }).catch((error) => {
        throw new Error(
          error instanceof Error
            ? error.message
            : "Unable to start the YouTube connection flow.",
        );
      });
    }
    return mockFunctionCall({
      connected: true,
      channelTitle: "Connected Family Archive Channel",
    });
  },
  async uploadVideo(file, metadata, onProgress) {
    await simulateProgress(file, onProgress);
    if (isFirebaseConfigured) {
      const payload: UploadVideoPayload = {
        spaceId: String(metadata?.spaceId ?? "space_luna_house"),
        title: String(metadata?.title ?? file.name),
        description: String(metadata?.description ?? ""),
        mimeType: file.type || "video/mp4",
        base64File: await fileToBase64(file),
        collectionId: typeof metadata?.collectionId === "string" ? metadata.collectionId : undefined,
        categoryId: typeof metadata?.categoryId === "string" ? metadata.categoryId : undefined,
        customSeasonId:
          typeof metadata?.customSeasonId === "string" && metadata.customSeasonId.length
            ? metadata.customSeasonId
            : undefined,
        dateOfMemory: typeof metadata?.dateOfMemory === "string" ? metadata.dateOfMemory : undefined,
        thumbnailUrl: typeof metadata?.thumbnailUrl === "string" ? metadata.thumbnailUrl : undefined,
        bannerImageUrl:
          typeof metadata?.bannerImageUrl === "string" ? metadata.bannerImageUrl : undefined,
        tags: Array.isArray(metadata?.tags) ? (metadata.tags as string[]) : undefined,
        location: typeof metadata?.location === "string" ? metadata.location : undefined,
        featured: Boolean(metadata?.featured),
        playbackOrder:
          typeof metadata?.playbackOrder === "number" ? metadata.playbackOrder : undefined,
      };
      const result = await callFunction<UploadVideoPayload, UploadVideoResponse>(
        "uploadVideoToYouTube",
        payload,
      );
      return {
        assetId: result.mediaAssetId,
        providerAssetId: result.videoId,
        youtubeVideoId: result.videoId,
        playbackUrl: `https://www.youtube.com/watch?v=${result.videoId}`,
        downloadUrl: `https://www.youtube.com/watch?v=${result.videoId}`,
      } satisfies UploadResult;
    }
    const slug = String(metadata?.title ?? "video")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");
    const fakeId = slug === "anniversary-film" ? "aqz-KE-bpKQ" : `yt_${crypto.randomUUID()}`;
    return mockFunctionCall<UploadResult>({
      assetId: `youtube_asset_${crypto.randomUUID()}`,
      providerAssetId: fakeId,
      youtubeVideoId: fakeId,
      playbackUrl: `https://www.youtube.com/watch?v=${fakeId}`,
      downloadUrl: `https://www.youtube.com/watch?v=${fakeId}`,
    });
  },
  async uploadImage(file, onProgress) {
    await simulateProgress(file, onProgress);
    const dataUrl = await fileToDataUrl(file);
    return mockFunctionCall({
      assetId: `image_asset_${crypto.randomUUID()}`,
      downloadUrl: dataUrl,
    });
  },
  async getPlaybackUrl(assetId) {
    return `https://www.youtube.com/watch?v=${assetId}`;
  },
  async deleteAsset() {
    return Promise.resolve();
  },
  async revokeAccess(options) {
    if (isFirebaseConfigured) {
      await callFunction<{ spaceId: string }, { revoked: boolean }>("revokeYouTubeAccess", {
        spaceId: options?.spaceId ?? "space_luna_house",
      });
      return;
    }
    return Promise.resolve();
  },
};
