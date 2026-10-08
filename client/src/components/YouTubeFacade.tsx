import { useState } from "react";
import "./YouTubeFacade.css";

type YouTubeFacadeProps = {
  videoId: string;
  title: string;
  poster: { webp: string; jpg: string };
};

/**
 * Shows a local poster with a play button and loads the YouTube player only
 * after a click. Saves about 1 MB of YouTube scripts on every page view.
 */
export default function YouTubeFacade({ videoId, title, poster }: YouTubeFacadeProps) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
      />
    );
  }

  return (
    <button type="button" className="yt-facade" onClick={() => setPlaying(true)} aria-label={title}>
      <picture>
        <source srcSet={poster.webp} type="image/webp" />
        <img src={poster.jpg} alt="" width={540} height={960} loading="lazy" decoding="async" />
      </picture>
      <span className="yt-facade__title" dir="auto">{title}</span>
      <span className="yt-facade__play" aria-hidden="true">
        <svg viewBox="0 0 68 68" width="68" height="68">
          <rect x="6" y="10" width="56" height="48" rx="16" fill="#ff0033" />
          <path d="M27 22.5v23l19-11.5z" fill="#fff" />
        </svg>
      </span>
    </button>
  );
}
