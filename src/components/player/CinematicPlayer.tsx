import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getAutoplayCountdownSeconds } from "@/services/player/autoplay";
import type { MediaItem } from "@/types/domain";
import { YouTubePlayerSurface, type YouTubePlayerSurfaceHandle } from "@/components/player/YouTubePlayerSurface";

function PhotoCollectionPlayback({
  media,
  playing,
}: {
  media: MediaItem;
  playing: boolean;
}) {
  const [frameIndex, setFrameIndex] = useState(0);
  const frames = media.frames ?? [];

  useEffect(() => {
    if (!playing || !frames.length) return;
    const current = frames[frameIndex];
    const timer = window.setTimeout(() => {
      setFrameIndex((prev) => (prev + 1) % frames.length);
    }, current.durationMs);
    return () => window.clearTimeout(timer);
  }, [frameIndex, frames, playing]);

  const frame = frames[frameIndex];
  if (!frame) return null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={frame.id}
        animate={{ opacity: 1, scale: 1 }}
        className="absolute inset-0"
        exit={{ opacity: 0, scale: 1.04 }}
        initial={{ opacity: 0, scale: frame.transition === "zoom" ? 1.08 : 1.02 }}
        transition={{ duration: 1.1, ease: "easeOut" }}
      >
        <img alt={frame.caption ?? media.title} className="h-full w-full object-cover" src={frame.imageUrl} />
        <div className="absolute inset-0 bg-black/35" />
        {frame.caption ? (
          <div className="absolute bottom-24 left-10 max-w-xl">
            <p className="font-display text-4xl text-white">{frame.caption}</p>
          </div>
        ) : null}
      </motion.div>
    </AnimatePresence>
  );
}

export function CinematicPlayer({
  media,
  nextMedia,
  resumeSeconds = 0,
  onProgressPersist,
}: {
  media: MediaItem;
  nextMedia?: MediaItem;
  resumeSeconds?: number;
  onProgressPersist?: (seconds: number, duration: number) => void;
}) {
  const { spaceSlug = "luna-house" } = useParams();
  const videoSurfaceRef = useRef<YouTubePlayerSurfaceHandle | null>(null);
  const [playing, setPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showIntroTransition, setShowIntroTransition] = useState(true);
  const [showDetails, setShowDetails] = useState(true);
  const detailsTimerRef = useRef<number | null>(null);
  const navigate = useNavigate();
  const duration = useMemo(() => media.durationSeconds, [media.durationSeconds]);

  function scheduleDetailsHide(delay = 2600) {
    if (detailsTimerRef.current) {
      window.clearTimeout(detailsTimerRef.current);
    }
    detailsTimerRef.current = window.setTimeout(() => {
      setShowDetails(false);
    }, delay);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setShowIntroTransition(false), 1200);
    return () => window.clearTimeout(timer);
  }, [media.id]);

  useEffect(() => {
    setProgress(0);
    setCountdown(null);
    setPlaying(true);
    setShowDetails(true);
    scheduleDetailsHide();
  }, [media.id]);

  useEffect(() => {
    return () => {
      if (detailsTimerRef.current) {
        window.clearTimeout(detailsTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (media.type !== "photo_collection" || !playing) return;
    const timer = window.setInterval(() => {
      setProgress((value) => {
        const nextValue = Math.min(value + 0.25, duration);
        if (nextValue >= duration) {
          window.clearInterval(timer);
          setCountdown(getAutoplayCountdownSeconds());
        }
        return nextValue;
      });
    }, 250);
    return () => window.clearInterval(timer);
  }, [duration, media.type, playing]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = window.setTimeout(() => setCountdown((value) => (value ?? 1) - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown === 0 && nextMedia) {
      navigate(`/${spaceSlug}/player/${nextMedia.id}`);
    }
  }, [countdown, nextMedia, navigate, spaceSlug]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) {
        return;
      }
      if (event.key === " ") {
        event.preventDefault();
        if (media.type === "video") {
          videoSurfaceRef.current?.togglePlayback();
        } else {
          setPlaying((value) => !value);
        }
      }
      if (event.key === "ArrowRight" && media.type === "video") {
        event.preventDefault();
        videoSurfaceRef.current?.seekBy(20);
      }
      if (event.key === "ArrowLeft" && media.type === "video") {
        event.preventDefault();
        videoSurfaceRef.current?.seekBy(-20);
      }
      if (event.key === "ArrowUp" && media.type === "video") {
        event.preventDefault();
        videoSurfaceRef.current?.adjustVolume(10);
      }
      if (event.key === "ArrowDown" && media.type === "video") {
        event.preventDefault();
        videoSurfaceRef.current?.adjustVolume(-10);
      }
      if (event.key.toLowerCase() === "f") {
        document.documentElement.requestFullscreen?.().catch(() => undefined);
      }
      if (event.key === "Escape") {
        document.exitFullscreen?.().catch(() => undefined);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [media.type]);

  return (
    <div
      className="relative h-screen overflow-hidden bg-black"
      onMouseMove={() => {
        setShowDetails(true);
        scheduleDetailsHide(2200);
      }}
    >
      {media.type === "video" && media.youtubeVideoId ? (
        <YouTubePlayerSurface
          description={media.description}
          onEnded={() => setCountdown(getAutoplayCountdownSeconds())}
          onProgress={(seconds, total) => {
            setProgress(seconds);
            onProgressPersist?.(seconds, total);
            if (total && total !== duration) {
              // Uses seeded duration for now; real app should persist YouTube duration after upload.
            }
          }}
          resumeSeconds={resumeSeconds}
          showDetails={showDetails}
          title={media.title}
          videoId={media.youtubeVideoId}
          ref={videoSurfaceRef}
        />
      ) : (
        <PhotoCollectionPlayback media={media} playing={playing} />
      )}

      <AnimatePresence>
        {showIntroTransition ? (
          <motion.div
            animate={{ opacity: 0 }}
            className="absolute inset-0 z-20 bg-black"
            exit={{ opacity: 0 }}
            initial={{ opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        ) : null}
      </AnimatePresence>

      <div
        className={`absolute left-0 right-0 top-0 z-30 flex items-start justify-between gap-3 p-3 transition-all duration-500 sm:items-center sm:p-6 ${
          showDetails ? "translate-y-0 opacity-100" : "pointer-events-none -translate-y-3 opacity-0"
        }`}
      >
        <Link to={`/${spaceSlug}/home`}>
          <Button className="h-10 px-3 text-sm sm:h-11 sm:px-4" variant="ghost">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </Link>
        <div className="max-w-[55vw] text-right sm:max-w-none">
          <p className="text-[10px] uppercase tracking-[0.28em] text-white/55 sm:text-xs sm:tracking-[0.34em]">
            Now Playing
          </p>
          <h1 className="line-clamp-2 font-display text-xl text-white sm:text-3xl">{media.title}</h1>
        </div>
      </div>

      {media.type === "photo_collection" ? (
        <div className="absolute inset-x-0 bottom-0 z-30 p-3 sm:p-6">
          <div className="glass-panel rounded-[1.2rem] p-3 sm:rounded-[1.6rem] sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
                className="h-10 w-10 sm:h-11 sm:w-11"
                size="icon"
                variant="secondary"
                onClick={() => setPlaying((value) => !value)}
              >
                {playing ? <span className="text-lg">II</span> : <span className="text-lg">▶</span>}
              </Button>
              <div className="flex-1">
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-ember"
                    style={{ width: `${Math.min((progress / duration) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {countdown !== null && nextMedia ? (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel absolute bottom-24 left-3 right-3 z-40 rounded-[1.2rem] p-4 sm:bottom-28 sm:left-auto sm:right-6 sm:max-w-sm sm:rounded-[1.6rem] sm:p-5"
            exit={{ opacity: 0, y: 12 }}
            initial={{ opacity: 0, y: 12 }}
          >
            <p className="text-xs uppercase tracking-[0.32em] text-gold/80">Up next</p>
            <h2 className="mt-2 font-display text-2xl text-white sm:text-3xl">{nextMedia.title}</h2>
            <p className="mt-2 text-sm text-white/65">
              Next in {countdown} second{countdown === 1 ? "" : "s"}...
            </p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
