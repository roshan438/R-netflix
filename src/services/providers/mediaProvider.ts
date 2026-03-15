export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
}

export interface UploadResult {
  assetId: string;
  playbackUrl?: string;
  downloadUrl?: string;
  providerAssetId?: string;
  youtubeVideoId?: string;
}

export interface MediaProvider {
  uploadVideo(
    file: File,
    metadata?: Record<string, unknown>,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadResult>;
  uploadImage(
    file: File,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadResult>;
  getPlaybackUrl(assetId: string): Promise<string>;
  deleteAsset(assetId: string): Promise<void>;
  connectAccount?(options?: {
    spaceId: string;
  }): Promise<{ connected: boolean; channelTitle?: string }>;
  revokeAccess?(options?: { spaceId: string }): Promise<void>;
}
