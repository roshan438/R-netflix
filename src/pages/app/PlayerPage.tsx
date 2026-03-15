import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { CinematicPlayer } from "@/components/player/CinematicPlayer";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { mediaService } from "@/services/firebase/media";
import { watchHistoryService } from "@/services/firebase/watchHistory";
import type { MediaItem } from "@/types/domain";

export function PlayerPage() {
  const { mediaId = "" } = useParams();
  const { currentSpace } = useAuth();
  const { activeProfile } = useProfile();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [nextMedia, setNextMedia] = useState<MediaItem | undefined>(undefined);
  const [resumeSeconds, setResumeSeconds] = useState(0);
  const lastPersistedRef = useRef(0);

  useEffect(() => {
    mediaService.getMediaById(mediaId, currentSpace?.id).then((item) => {
      setMedia(item ?? null);
      if (item) {
        mediaService.getNextInCollection(item.id, currentSpace?.id).then(setNextMedia);
      }
    });
  }, [currentSpace?.id, mediaId]);

  useEffect(() => {
    if (!currentSpace || !activeProfile || !mediaId) return;
    watchHistoryService.getResumePoint(currentSpace.id, activeProfile.id, mediaId).then((seconds) => {
      setResumeSeconds(seconds);
      lastPersistedRef.current = seconds;
    });
  }, [activeProfile, currentSpace, mediaId]);

  if (!media) {
    return <div className="flex min-h-screen items-center justify-center bg-black text-white/70">Loading player...</div>;
  }

  return (
    <CinematicPlayer
      media={media}
      nextMedia={nextMedia}
      onProgressPersist={(seconds, duration) => {
        if (!currentSpace || !activeProfile) return;
        if (Math.abs(seconds - lastPersistedRef.current) < 5 && seconds < duration - 1) return;
        lastPersistedRef.current = seconds;
        void watchHistoryService.saveProgress({
          spaceId: currentSpace.id,
          profileId: activeProfile.id,
          mediaItemId: media.id,
          progressSeconds: seconds,
          durationSeconds: duration,
        });
      }}
      resumeSeconds={resumeSeconds}
    />
  );
}
