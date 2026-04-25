import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { formatDurationSeconds } from "@spinefit/shared";

const SPEEDS = [0.5, 1, 1.5, 2] as const;

type Props = {
  src: string;
  poster?: string;
  className?: string;
};

export function VideoPlayer({ src, poster, className = "" }: Props) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const hideTimerRef = useRef<number | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1); // 1x default
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [hasError, setHasError] = useState(false);
  const hasLoadedRef = useRef(false);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      void v.play();
    } else {
      v.pause();
    }
  }, []);

  const cycleSpeed = useCallback(() => {
    setSpeedIndex((i) => (i + 1) % SPEEDS.length);
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
    } else {
      void el.requestFullscreen?.();
    }
  }, []);

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current;
    if (!v) return;
    const t = Number(e.target.value);
    v.currentTime = t;
    setCurrentTime(t);
  }, []);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
    }
    hideTimerRef.current = window.setTimeout(() => {
      if (videoRef.current && !videoRef.current.paused) {
        setControlsVisible(false);
      }
    }, 2500);
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = SPEEDS[speedIndex];
  }, [speedIndex]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current !== null) {
        window.clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    setHasError(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    hasLoadedRef.current = false;
  }, [src]);

  if (hasError || !src) {
    return (
      <div
        className={`flex items-center justify-center bg-black text-slate-400 text-sm ${className}`}
      >
        {t("workoutPage.messages.videoUnavailable")}
      </div>
    );
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`group relative bg-black ${className}`}
      onMouseMove={showControls}
      onMouseLeave={() => {
        if (videoRef.current && !videoRef.current.paused) setControlsVisible(false);
      }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        className="h-full w-full object-cover"
        onClick={togglePlay}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onLoadedMetadata={(e) => {
          setDuration(e.currentTarget.duration || 0);
          hasLoadedRef.current = true;
        }}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onError={(e) => {
          if (hasLoadedRef.current) return;
          const err = e.currentTarget.error;
          if (
            err &&
            (err.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED ||
              err.code === MediaError.MEDIA_ERR_NETWORK ||
              err.code === MediaError.MEDIA_ERR_DECODE)
          ) {
            setHasError(true);
          }
        }}
      />

      {!isPlaying && (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="play"
          className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80"
        >
          <svg viewBox="0 0 24 24" className="h-7 w-7 translate-x-[2px]" fill="currentColor">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
      )}

      <div
        className={`pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-2 pt-6 transition-opacity ${
          controlsVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="pointer-events-auto flex flex-col gap-1">
          <div className="relative flex items-center">
            <div className="absolute left-0 right-0 h-1 rounded-full bg-white/25" />
            <div
              className="absolute left-0 h-1 rounded-full bg-main"
              style={{ width: `${progress}%` }}
            />
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.01}
              value={currentTime}
              onChange={handleSeek}
              aria-label="seek"
              className="relative z-10 w-full appearance-none bg-transparent h-3 cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none
                [&::-webkit-slider-thumb]:w-3
                [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:rounded-full
                [&::-webkit-slider-thumb]:bg-white
                [&::-webkit-slider-thumb]:opacity-0
                [&::-webkit-slider-thumb]:transition-opacity
                group-hover:[&::-webkit-slider-thumb]:opacity-100
                [&::-moz-range-thumb]:w-3
                [&::-moz-range-thumb]:h-3
                [&::-moz-range-thumb]:rounded-full
                [&::-moz-range-thumb]:bg-white
                [&::-moz-range-thumb]:border-0"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-white/90">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? "pause" : "play"}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/15"
            >
              {isPlaying ? (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <rect x="6" y="5" width="4" height="14" rx="1" />
                  <rect x="14" y="5" width="4" height="14" rx="1" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-4 w-4 translate-x-[1px]" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            <span className="tabular-nums text-[11px] text-white/80">
              {formatDurationSeconds(currentTime)} / {formatDurationSeconds(duration)}
            </span>

            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                onClick={cycleSpeed}
                aria-label="playback speed"
                className="flex h-8 min-w-[40px] items-center justify-center rounded-full px-2 text-[11px] font-semibold tabular-nums hover:bg-white/15"
              >
                {SPEEDS[speedIndex]}x
              </button>

              <button
                type="button"
                onClick={toggleMute}
                aria-label={isMuted ? "unmute" : "mute"}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/15"
              >
                {isMuted ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <line x1="22" y1="9" x2="16" y2="15" />
                    <line x1="16" y1="9" x2="22" y2="15" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 5L6 9H2v6h4l5 4V5z" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                )}
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "exit fullscreen" : "fullscreen"}
                className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-white/15"
              >
                {isFullscreen ? (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M8 3v3a2 2 0 0 1-2 2H3" />
                    <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
                    <path d="M3 16h3a2 2 0 0 1 2 2v3" />
                    <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 8V5a2 2 0 0 1 2-2h3" />
                    <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
                    <path d="M3 16v3a2 2 0 0 0 2 2h3" />
                    <path d="M21 16v3a2 2 0 0 1-2 2h-3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
