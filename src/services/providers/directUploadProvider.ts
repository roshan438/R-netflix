import type {
  MediaProvider,
  UploadProgress,
  UploadResult,
} from "@/services/providers/mediaProvider";

async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not prepare local preview."));
    reader.readAsDataURL(file);
  });
}

function simulateUpload(
  file: File,
  onProgress?: (progress: UploadProgress) => void,
): Promise<UploadResult> {
  return new Promise((resolve) => {
    let loaded = 0;
    const total = Math.max(file.size, 1000000);
    const interval = window.setInterval(() => {
      loaded = Math.min(total, loaded + total / 6);
      onProgress?.({
        loaded,
        total,
        percent: Math.round((loaded / total) * 100),
      });
      if (loaded >= total) {
        window.clearInterval(interval);
        void fileToDataUrl(file).then((dataUrl) =>
          resolve({
            assetId: `asset_${crypto.randomUUID()}`,
            downloadUrl: dataUrl,
            playbackUrl: dataUrl,
          }),
        );
      }
    }, 220);
  });
}

export const directUploadProvider: MediaProvider = {
  uploadVideo: (file, _metadata, onProgress) => simulateUpload(file, onProgress),
  uploadImage: simulateUpload,
  async getPlaybackUrl(assetId) {
    return `https://example.com/media/${assetId}`;
  },
  async deleteAsset() {
    return Promise.resolve();
  },
};
