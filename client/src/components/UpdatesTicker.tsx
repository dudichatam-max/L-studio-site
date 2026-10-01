import { useEffect, useRef, useState, type CSSProperties, type Ref } from "react";
import { Link } from "wouter";
import type { UpdateItem, UpdatesCopy } from "@/lib/updatesCopy";

type UpdatesTickerProps = {
  copy: UpdatesCopy;
  isRtl: boolean;
};

const PIXELS_PER_SECOND = 72;

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
  const groupRef = useRef<HTMLDivElement>(null);
  const [distance, setDistance] = useState(0);
  const signature = items.map((item) => `${item.id}:${item.title}`).join("|");

  useEffect(() => {
    const node = groupRef.current;
    if (!node) return;
    const measure = () => {
      const width = Math.round(node.scrollWidth);
      setDistance(width > 0 ? width : 0);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [signature, isRtl]);

  if (!items.length) return null;

  const duration = distance > 0 ? Math.max(16, distance / PIXELS_PER_SECOND) : 20;
  const style = {
    "--updates-ticker-duration": `${duration.toFixed(2)}s`,
  } as CSSProperties;

  return (
    <div className="updates-ticker" dir={isRtl ? "rtl" : "ltr"} style={style} role="region" aria-label={copy.tickerLabel || copy.navLabel}>
      <span className="updates-ticker__label">{copy.tickerLabel || copy.navLabel}</span>
      <div className="updates-ticker__viewport">
        <div className="updates-ticker__track">
          <TickerGroup items={items} copy={copy} groupRef={groupRef} />
          <TickerGroup items={items} copy={copy} clone />
        </div>
      </div>
    </div>
  );
}
