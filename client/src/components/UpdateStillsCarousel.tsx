import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Language } from "@/contexts/LanguageContext";

export type StillSlide = {
  src: string;
  alt: string;
  width: number;
  height: number;
};

type Chrome = { region: string; prev: string; next: string; slide: string };

const chromeDefault: Record<Language, Chrome> = {
  he: { region: "קרוסלת מסכים", prev: "השקופית הקודמת", next: "השקופית הבאה", slide: "שקופית {n} מתוך {total}" },
  en: { region: "Screen carousel", prev: "Previous slide", next: "Next slide", slide: "Slide {n} of {total}" },
  ru: { region: "Карусель экранов", prev: "Предыдущий слайд", next: "Следующий слайд", slide: "Слайд {n} из {total}" },
  ar: { region: "عرض الشاشات", prev: "الشريحة السابقة", next: "الشريحة التالية", slide: "الشريحة {n} من {total}" },
};

const fmt = (tpl: string, n: number, total: number) => tpl.replace("{n}", String(n)).replace("{total}", String(total));

function assetUrl(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, "")}`;
}

function webpUrl(path: string) {
  return assetUrl(path.replace(/\.jpe?g$/i, ".webp"));
}

/**
 * Same play-carousel chrome as the homepage (swipe, arrows, dots, keyboard, RTL),
 * fed by update stills instead of the designed poster packs.
 */
export default function UpdateStillsCarousel({
  slides,
  language,
  isRtl,
  label,
}: {
  slides: StillSlide[];
  language: Language;
  isRtl: boolean;
  label?: string;
}) {
  const total = slides.length;
  const chrome = { ...chromeDefault[language], region: label || chromeDefault[language].region };
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const raf = useRef(0);
  const sign = isRtl ? -1 : 1;

  const goTo = useCallback(
    (next: number) => {
      const el = trackRef.current;
      if (!el) return;
      const i = Math.max(0, Math.min(total - 1, next));
      const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      el.scrollTo({ left: sign * i * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
      setIndex(i);
    },
    [sign, total],
  );

  const onScroll = useCallback(() => {
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => {
      const el = trackRef.current;
      if (!el || !el.clientWidth) return;
      const i = Math.max(0, Math.min(total - 1, Math.round(Math.abs(el.scrollLeft) / el.clientWidth)));
      setIndex((current) => (current === i ? current : i));
    });
  }, [total]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const indexRef = useRef(0);
  indexRef.current = index;
  useEffect(() => {
    const el = trackRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      el.scrollTo({ left: sign * indexRef.current * el.clientWidth, behavior: "auto" });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [sign]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    const visual = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!visual) return;
    event.preventDefault();
    goTo(index + visual * sign);
  };

  if (total === 0) return null;

  const dirAttr = isRtl ? "rtl" : "ltr";
  const leftStep = -sign;
  const rightStep = sign;
  const ratios = slides.map((slide) => slide.width / Math.max(1, slide.height));
  const mixed = Math.max(...ratios) - Math.min(...ratios) > 0.15;
  const tallestRatio = Math.min(...ratios);
  const wrapClass = `preview-image-wrap play-carousel updates-carousel__inner updates-stills-carousel${mixed ? " updates-stills-carousel--mixed" : ""}`;
  return (
    <div className={wrapClass} dir={dirAttr}>
      <div className="play-carousel__stage" style={mixed ? { aspectRatio: `${tallestRatio}` } : undefined}>
        <div
          className="play-carousel__track"
          ref={trackRef}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="group"
          aria-roledescription="carousel"
          aria-label={chrome.region}
        >
          {slides.map((slide, i) => (
            <figure
              className="play-carousel__slide"
              key={slide.src}
              role="group"
              aria-roledescription="slide"
              aria-label={fmt(chrome.slide, i + 1, total)}
              aria-hidden={i === index ? undefined : true}
            >
              <picture>
                {/\.jpe?g$/i.test(slide.src) ? <source srcSet={webpUrl(slide.src)} type="image/webp" /> : null}
                <img
                  className="preview-media"
                  src={assetUrl(slide.src)}
                  alt={slide.alt}
                  width={slide.width}
                  height={slide.height}
                  loading={i === 0 ? "eager" : "lazy"}
                  decoding="async"
                  draggable={false}
                />
              </picture>
            </figure>
          ))}
        </div>
        {total > 1 && (
          <>
            <button
              type="button"
              className="play-carousel__arrow play-carousel__arrow--left"
              aria-label={leftStep < 0 ? chrome.prev : chrome.next}
              disabled={index + leftStep < 0 || index + leftStep > total - 1}
              onClick={() => goTo(index + leftStep)}
            >
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="play-carousel__arrow play-carousel__arrow--right"
              aria-label={rightStep < 0 ? chrome.prev : chrome.next}
              disabled={index + rightStep < 0 || index + rightStep > total - 1}
              onClick={() => goTo(index + rightStep)}
            >
              <ChevronRight size={20} aria-hidden="true" />
            </button>
          </>
        )}
      </div>
      {total > 1 && (
        <div className="play-carousel__dots updates-stills-carousel__dots" role="tablist" aria-label={chrome.region}>
          {slides.map((slide, i) => (
            <button
              type="button"
              key={slide.src}
              className={i === index ? "is-active" : ""}
              aria-label={fmt(chrome.slide, i + 1, total)}
              aria-current={i === index ? "true" : undefined}
              onClick={() => goTo(i)}
            >
              <span />
            </button>
          ))}
        </div>
      )}
      {slides[index]?.alt ? <p className="updates-stills-carousel__caption">{slides[index].alt}</p> : null}
    </div>
  );
}
