"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A muted, looping cover video. It plays only while in view and only when the
 * viewer has not asked for reduced motion or reduced data; otherwise the poster
 * stands until the viewer presses Play. The Play / Pause control is always
 * present (WCAG 2.2.2: anything that moves for more than five seconds can be
 * stopped). Sound is never on.
 */
export function AmbientVideo({
  src,
  poster,
  label,
  playLabel,
  pauseLabel,
  className = "",
}: {
  src: string;
  poster: string | null;
  label: string;
  playLabel: string;
  pauseLabel: string;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const saveData = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;
    // Reduced motion or reduced data: the poster stands until the viewer presses Play.
    if (reduce || saveData) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !video.dataset.paused) {
          video.play().catch(() => undefined);
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  const toggle = () => {
    const video = ref.current;
    if (!video) return;
    if (video.paused) {
      delete video.dataset.paused;
      setPaused(false);
      video.play().catch(() => undefined);
    } else {
      video.dataset.paused = "1";
      setPaused(true);
      video.pause();
    }
  };

  return (
    <>
      <video
        ref={ref}
        className={className}
        src={src}
        poster={poster ?? undefined}
        preload="none"
        muted
        loop
        playsInline
        aria-label={label}
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <button type="button" className="scene-toggle" onClick={toggle} aria-pressed={paused}>
        {playing ? pauseLabel : playLabel}
      </button>
    </>
  );
}
