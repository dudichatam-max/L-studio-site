import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Language } from "@/contexts/LanguageContext";
import { carouselSlides, slideImage, type PlayId } from "@/lib/carousel";

export type CarouselSlideCopy = { title?: string; text?: string; alt?: string };
export type CarouselCopy = {
  region?: string;
  prev?: string;
  next?: string;
  slide?: string; // "Slide {n} of {total}"
  poster?: string; // alt prefix, e.g. "Poster"
  slides?: Record<string, CarouselSlideCopy>;
};

const chromeDefault: Record<Language, Required<Pick<CarouselCopy, "region" | "prev" | "next" | "slide" | "poster">>> = {
  he: { poster: "פוסטר", region: "קרוסלת מסכים", prev: "השקופית הקודמת", next: "השקופית הבאה", slide: "שקופית {n} מתוך {total}" },
  en: { poster: "Poster", region: "Screen carousel", prev: "Previous slide", next: "Next slide", slide: "Slide {n} of {total}" },
  ru: { poster: "Постер", region: "Карусель экранов", prev: "Предыдущий слайд", next: "Следующий слайд", slide: "Слайд {n} из {total}" },
  ar: { poster: "ملصق", region: "عرض الشاشات", prev: "الشريحة السابقة", next: "الشريحة التالية", slide: "الشريحة {n} من {total}" },
};

const fmt = (tpl: string, n: number, total: number) => tpl.replace("{n}", String(n)).replace("{total}", String(total));

/**
 * One tab of the home windows menu: N slides, swipe (native scroll-snap), arrows, dots, keyboard, RTL-correct.
 * Rendered as a pair: the slide track on one side and the caption of the current slide next to it (see children).
 */
export default function PlayCarousel({
  tab,
  language,
  isRtl,
  copy,
  children,
}: {
  tab: PlayId;
  language: Language;
  isRtl: boolean;
  copy?: CarouselCopy;
  children: (caption: CarouselSlideCopy | undefined) => React.ReactNode;
}) {
  const slides = carouselSlides[tab];
  const total = slides.length;
  const d = chromeDefault[language];
  const chrome = { region: copy?.region || d.region, prev: copy?.prev || d.prev, next: copy?.next || d.next, slide: copy?.slide || d.slide, poster: copy?.poster || d.poster };
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
  // Keep the current slide in view if the width or direction changes (rotate, resize, language switch).
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

  const dirAttr = isRtl ? "rtl" : "ltr";
  const slideCopy = copy?.slides ?? {};
  // Physical left arrow goes back in LTR and forward in RTL.
  const leftStep = -sign;
  const rightStep = sign;

  return (
    <>
      <div className="preview-image-wrap play-carousel" dir={dirAttr}>
        <div className="play-carousel__stage">
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
            {slides.map((slide, i) => {
              const img = slideImage(language, slide);
              const c = slideCopy[slide.id];
              const alt = c?.alt || (c?.title ? `${chrome.poster}: ${c.title}` : "");
              return (
                <figure
                  className="play-carousel__slide"
                  key={slide.id}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={fmt(chrome.slide, i + 1, total)}
                  aria-hidden={i === index ? undefined : true}
                >
                  <picture>
                    <source type="image/webp" srcSet={img.webpSet} sizes="(max-width: 720px) 78vw, 300px" />
                    <img
                      className="preview-media"
                      src={img.jpg}
                      srcSet={img.jpgSet}
                      sizes="(max-width: 720px) 78vw, 300px"
                      alt={alt}
                      width={img.width}
                      height={img.height}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                    />
                  </picture>
                </figure>
              );
            })}
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
          <div className="play-carousel__dots">
            {slides.map((slide, i) => (
              <button
                type="button"
                key={slide.id}
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
      </div>
      {children(slideCopy[slides[index].id])}
    </>
  );
}
