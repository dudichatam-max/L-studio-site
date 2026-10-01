import { useEffect, useRef, useState, type CSSProperties, type Ref } from "react";
import { Link } from "wouter";
import type { UpdateItem, UpdatesCopy } from "@/lib/updatesCopy";

type UpdatesTickerProps = {
  copy: UpdatesCopy;
  isRtl: boolean;
};

const PIXELS_PER_SECOND = 72;

/** Copies needed so one measured shift still covers the viewport. */
export function tickerCopyCount(groupWidth: number, viewportWidth: number) {
  if (groupWidth <= 0) return 2;
  return Math.max(2, Math.ceil(viewportWidth / groupWidth) + 1);
}

function TickerGroup({
  items,
  copy,
  clone,
  groupRef,
}: {
  items: UpdateItem[];
  copy: UpdatesCopy;
  clone?: boolean;
  groupRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      className={`updates-ticker__group${clone ? " updates-ticker__group--clone" : ""}`}
      aria-hidden={clone ? true : undefined}
      ref={groupRef}
    >
      {items.map((item) => {
        const status = copy.statusLabels?.[item.status] ?? item.status;
        return (
          <span className="updates-ticker__slot" key={item.id}>
            <Link className="updates-ticker__item" href={`/updates#${item.id}`} tabIndex={clone ? -1 : undefined}>
              <span className="updates-ticker__status">{status}</span>
              <span>{item.title}</span>
            </Link>
            <span className="updates-ticker__sep" aria-hidden="true">
              ·
            </span>
          </span>
        );
      })}
    </div>
  );
}

export default function UpdatesTicker({ copy, isRtl }: UpdatesTickerProps) {
  const items = (copy.items ?? []).filter((item) => item.id && item.title);
  const viewportRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);
  const [loop, setLoop] = useState({ shift: 0, copies: 2, signature: "" });
  const signature = items.map((item) => `${item.id}:${item.title}`).join("|");

  useEffect(() => {
    const viewport = viewportRef.current;
    const group = groupRef.current;
    if (!viewport || !group) return;

    const measure = () => {
      const groupWidth = group.getBoundingClientRect().width;
      const viewportWidth = viewport.getBoundingClientRect().width;
      if (groupWidth <= 0) return;
      const shift = Math.round(groupWidth * 100) / 100;
      const copies = tickerCopyCount(shift, viewportWidth);
      setLoop((prev) => {
        if (prev.signature === signature && prev.copies === copies && Math.abs(prev.shift - shift) < 0.5) return prev;
        return { shift, copies, signature };
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(viewport);
    observer.observe(group);
    const fonts = document.fonts;
    fonts?.ready.then(measure).catch(() => {});
    return () => observer.disconnect();
  }, [signature, isRtl]);

  if (!items.length) return null;

  const ready = loop.shift > 0 && loop.signature === signature;
  const copies = ready ? loop.copies : 2;
  const duration = ready ? Math.max(16, loop.shift / PIXELS_PER_SECOND) : 20;
  const style = {
    "--updates-ticker-duration": `${duration.toFixed(2)}s`,
    "--updates-ticker-shift": `${ready ? loop.shift : 0}px`,
  } as CSSProperties;

  return (
    <div
      className={`updates-ticker${ready ? " updates-ticker--ready" : ""}`}
      dir={isRtl ? "rtl" : "ltr"}
      style={style}
      role="region"
      aria-label={copy.tickerLabel || copy.navLabel}
    >
      <span className="updates-ticker__label">{copy.tickerLabel || copy.navLabel}</span>
      <div className="updates-ticker__viewport" ref={viewportRef}>
        <div className="updates-ticker__track">
          {Array.from({ length: copies }, (_, index) => (
            <TickerGroup
              key={index}
              items={items}
              copy={copy}
              clone={index > 0}
              groupRef={index === 0 ? groupRef : undefined}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
