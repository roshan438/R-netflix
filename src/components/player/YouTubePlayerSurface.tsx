import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Maximize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDuration } from "@/services/utils/dates";

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string,
        config: Record<string, unknown>,
      ) => YouTubePlayerInstance;
      PlayerState?: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
      };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayerInstance {
  playVideo(): void;
  pauseVideo(): void;
  mute(): void;
  unMute(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  getVolume(): number;
  setVolume(volume: number): void;
  destroy(): void;
}

export interface YouTubePlayerSurfaceHandle {
  togglePlayback(): void;
  seekBy(seconds: number): void;
  adjustVolume(delta: number): void;
}

function loadYouTubeApi() {
  return new Promise<void>((resolve) => {
    if (window.YT?.Player) {
      resolve();
      return;
    }
    const existing = document.querySelector('script[data-youtube-iframe="true"]');
    if (existing) {
      window.onYouTubeIframeAPIReady = () => resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.dataset.youtubeIframe = "true";
    window.onYouTubeIframeAPIReady = () => resolve();
    document.body.appendChild(script);
  });
}

export const YouTubePlayerSurface = forwardRef<YouTubePlayerSurfaceHandle, {
  videoId: string;
  title: string;
  description: string;
  showDetails: boolean;
  resumeSeconds?: number;
  onEnded: () => void;
  onProgress: (seconds: number, duration: number) => void;
}>(({
  videoId,
  title,
  description,
  showDetails,
  resumeSeconds = 0,
  onEnded,
  onProgress,
}, ref) => {
  const isTouchDevice =
    typeof window !== "undefined" &&
    (window.matchMedia?.("(pointer: coarse)").matches || "ontouchstart" in window);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const onEndedRef = useRef(onEnded);
  const onProgressRef = useRef(onProgress);
  const isSeekingRef = useRef(false);
  const autoplayGuardRef = useRef<number | null>(null);
  const containerId = useMemo(() => `youtube-player-${videoId}`, [videoId]);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(100);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [interactionPulse, setInteractionPulse] = useState<"play" | "pause" | null>(null);
  const [requiresTapToStart, setRequiresTapToStart] = useState(false);
  const pulseTimerRef = useRef<number | null>(null);

  const showPulse = (state: "play" | "pause") => {
    setInteractionPulse(state);
    if (pulseTimerRef.current) {
      window.clearTimeout(pulseTimerRef.current);
    }
    pulseTimerRef.current = window.setTimeout(() => {
      setInteractionPulse(null);
    }, 520);
  };

  const togglePlayback = () => {
    if (playing) {
      playerRef.current?.pauseVideo();
      setPlaying(false);
      showPulse("pause");
    } else {
      playerRef.current?.playVideo();
      setPlaying(true);
      showPulse("play");
    }
  };

  const beginPlaybackFromUserGesture = () => {
    if (muted) {
      playerRef.current?.unMute();
      setMuted(false);
    }
    playerRef.current?.playVideo();
    setPlaying(true);
    setRequiresTapToStart(false);
    showPulse("play");
  };

  const seekBy = (seconds: number) => {
    const current = playerRef.current?.getCurrentTime() ?? progress;
    const total = playerRef.current?.getDuration() ?? duration;
    const nextValue = Math.max(0, Math.min(current + seconds, total || current + seconds));
    playerRef.current?.seekTo(nextValue, true);
    setProgress(nextValue);
  };

  const adjustVolume = (delta: number) => {
    const nextVolume = Math.max(0, Math.min((playerRef.current?.getVolume() ?? volume) + delta, 100));
    playerRef.current?.setVolume(nextVolume);
    if (nextVolume === 0) {
      playerRef.current?.mute();
      setMuted(true);
    } else {
      playerRef.current?.unMute();
      setMuted(false);
    }
    setVolume(nextVolume);
  };

  useImperativeHandle(ref, () => ({
    togglePlayback,
    seekBy,
    adjustVolume,
  }));

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    let intervalId: number | undefined;

    loadYouTubeApi().then(() => {
      playerRef.current?.destroy();
      playerRef.current = new window.YT!.Player(containerId, {
        videoId,
        host: "https://www.youtube.com",
        playerVars: {
          autoplay: 1,
          controls: 0,
          enablejsapi: 1,
          modestbranding: 1,
          origin: window.location.origin,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: () => {
            if (resumeSeconds > 0) {
              playerRef.current?.seekTo(resumeSeconds, true);
              setProgress(resumeSeconds);
            }
            if (isTouchDevice) {
              playerRef.current?.mute();
              setMuted(true);
            }
            setVolume(playerRef.current?.getVolume() ?? 100);
            playerRef.current?.playVideo();
            autoplayGuardRef.current = window.setTimeout(() => {
              if (!playerRef.current) return;
              const current = playerRef.current.getCurrentTime() ?? 0;
              if (current < 0.5) {
                setPlaying(false);
                setRequiresTapToStart(true);
              }
            }, 1200);
          },
          onStateChange: (event: { data: number }) => {
            const states = window.YT?.PlayerState;
            if (event.data === states?.PLAYING) {
              if (autoplayGuardRef.current) {
                window.clearTimeout(autoplayGuardRef.current);
                autoplayGuardRef.current = null;
              }
              setPlaying(true);
              setRequiresTapToStart(false);
              if (intervalId) window.clearInterval(intervalId);
              intervalId = window.setInterval(() => {
                const current = playerRef.current?.getCurrentTime() ?? 0;
                const total = playerRef.current?.getDuration() ?? 0;
                const playerVolume = playerRef.current?.getVolume() ?? 100;
                if (!isSeekingRef.current) {
                  setProgress(current);
                }
                setDuration(total);
                setVolume(playerVolume);
                onProgressRef.current(current, total);
              }, 1000);
            }
            if (event.data === states?.PAUSED) {
              setPlaying(false);
              if (intervalId) window.clearInterval(intervalId);
            }
            if (event.data === states?.ENDED) {
              if (intervalId) window.clearInterval(intervalId);
              onEndedRef.current();
            }
          },
        },
      });
    });

    return () => {
      if (intervalId) window.clearInterval(intervalId);
      if (pulseTimerRef.current) window.clearTimeout(pulseTimerRef.current);
      if (autoplayGuardRef.current) window.clearTimeout(autoplayGuardRef.current);
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [containerId, isTouchDevice, resumeSeconds, videoId]);

  return (
    <>
      <div className="absolute inset-0">
        <div className="h-full w-full" id={containerId} />
      </div>
      {!isTouchDevice ? (
        <button
          aria-label={playing ? "Pause video" : "Play video"}
          className="absolute inset-0 z-10 cursor-default"
          onClick={togglePlayback}
          type="button"
        />
      ) : null}
      {isTouchDevice && requiresTapToStart ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
          <Button
            className="h-14 px-6 text-base shadow-[0_18px_55px_rgba(0,0,0,0.45)]"
            onClick={beginPlaybackFromUserGesture}
            size="lg"
            type="button"
          >
            <Play className="h-5 w-5 fill-current" />
            Tap to Start
          </Button>
        </div>
      ) : null}
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center">
        <div
          className={`flex h-20 w-20 items-center justify-center rounded-full border border-white/15 bg-black/45 text-white/95 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-300 sm:h-24 sm:w-24 ${
            interactionPulse ? "scale-100 opacity-100" : "scale-75 opacity-0"
          }`}
        >
          {interactionPulse === "pause" ? (
            <Pause className="h-8 w-8 sm:h-10 sm:w-10" />
          ) : (
            <Play className="ml-1 h-8 w-8 fill-current sm:h-10 sm:w-10" />
          )}
        </div>
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/82 via-transparent to-black/45" />
      <div className="absolute inset-x-0 bottom-0 z-30 p-3 sm:p-6">
        <div
          className={`mb-3 flex flex-col items-start gap-3 transition-all duration-500 sm:mb-5 sm:flex-row sm:items-end sm:justify-between sm:gap-4 ${
            showDetails ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
          }`}
        >
          <div className="max-w-full sm:max-w-2xl">
            <p className="font-display text-2xl text-white sm:text-4xl">{title}</p>
            <p className="mt-2 line-clamp-3 max-w-2xl text-xs text-white/65 sm:text-sm">{description}</p>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              className="h-10 w-10 sm:h-11 sm:w-11"
              size="icon"
              variant="ghost"
              onClick={() => {
                if (muted) {
                  playerRef.current?.unMute();
                  setVolume(playerRef.current?.getVolume() ?? volume ?? 100);
                } else {
                  playerRef.current?.mute();
                }
                setMuted((value) => !value);
              }}
            >
              {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </Button>
            <Button
              className="h-10 w-10 sm:h-11 sm:w-11"
              size="icon"
              variant="ghost"
              onClick={() => {
                if (document.fullscreenElement) {
                  document.exitFullscreen?.().catch(() => undefined);
                } else {
                  document.documentElement.requestFullscreen?.().catch(() => undefined);
                }
              }}
            >
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div
          className={`glass-panel rounded-[1.2rem] p-3 transition-all duration-500 sm:rounded-[1.6rem] sm:p-4 ${
            showDetails ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              className="h-10 w-10 shrink-0 sm:h-11 sm:w-11"
              size="icon"
              variant="secondary"
              onClick={togglePlayback}
            >
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-current" />}
            </Button>
            <div className="min-w-0 flex-1">
              <input
                className="youtube-range h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/10"
                max={duration || 0}
                min={0}
                onChange={(event) => setProgress(Number(event.target.value))}
                onMouseDown={() => {
                  isSeekingRef.current = true;
                }}
                onMouseUp={(event) => {
                  const nextValue = Number((event.target as HTMLInputElement).value);
                  playerRef.current?.seekTo(nextValue, true);
                  setProgress(nextValue);
                  isSeekingRef.current = false;
                }}
                onTouchStart={() => {
                  isSeekingRef.current = true;
                }}
                onTouchEnd={(event) => {
                  const nextValue = Number((event.target as HTMLInputElement).value);
                  playerRef.current?.seekTo(nextValue, true);
                  setProgress(nextValue);
                  isSeekingRef.current = false;
                }}
                step={1}
                type="range"
                value={Math.min(progress, duration || progress)}
              />
              <div className="mt-2 flex justify-between text-[11px] text-white/55 sm:text-xs">
                <span>{formatDuration(Math.floor(progress))}</span>
                <span className="flex items-center gap-3">
                  <span>{muted ? "Muted" : `Vol ${volume}%`}</span>
                  <span>{formatDuration(Math.floor(duration))}</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
});

YouTubePlayerSurface.displayName = "YouTubePlayerSurface";
