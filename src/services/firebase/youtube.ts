import { doc, getDoc } from "firebase/firestore";
import { firestoreDb, isFirebaseConfigured } from "@/services/firebase/config";

export interface ConnectedYouTubeAccount {
  connected: boolean;
  channelId?: string;
  channelTitle?: string;
  connectedAt?: string;
  connectedBy?: string;
  lastSyncedAt?: string;
}

export const youtubeService = {
  async getConnectionStatus(spaceId: string): Promise<ConnectedYouTubeAccount> {
    if (isFirebaseConfigured && firestoreDb) {
      const snapshot = await getDoc(doc(firestoreDb, `spaces/${spaceId}/spaceSettings/default`));
      const data = snapshot.data();
      return {
        connected: Boolean(data?.youtubeConnected),
        channelId: data?.youtubeChannelId,
        channelTitle: data?.youtubeChannelTitle,
        connectedAt: data?.youtubeConnectedAt?.toDate?.()?.toISOString?.() ?? undefined,
        connectedBy: data?.youtubeConnectedBy,
        lastSyncedAt: data?.youtubeLastSyncedAt?.toDate?.()?.toISOString?.() ?? undefined,
      };
    }
    return {
      connected: false,
    };
  },
};
