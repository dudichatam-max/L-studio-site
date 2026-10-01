import { Link } from "wouter";
import type { UpdateItem, UpdatesCopy } from "@/lib/updatesCopy";

type UpdatesTickerProps = {
  copy: UpdatesCopy;
  isRtl: boolean;
};

function TickerGroup({ items, copy, clone }: { items: UpdateItem[]; copy: UpdatesCopy; clone?: boolean }) {
  return (
    <div className={`updates-ticker__group${clone ? " updates-ticker__group--clone" : ""}`} aria-hidden={clone ? true : undefined}>
      {items.map((item) => {
        const status = copy.statusLabels?.[item.status] ?? item.status;
        return (
          <span className="updates-ticker__slot" key={item.id}>
            <Link className="updates-ticker__item" href={`/updates#${item.id}`} tabIndex={clone ? -1 : undefined}>
              <span className="updates-ticker__status">{status}</span>
              <span>{item.ticker || item.title}</span>
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
  const items = (copy.items ?? []).filter((item) => item.id && (item.ticker || item.title));
  if (!items.length) return null;

  return (
    <div className="updates-ticker" dir={isRtl ? "rtl" : "ltr"} role="region" aria-label={copy.tickerLabel || copy.navLabel}>
      <span className="updates-ticker__label">{copy.tickerLabel || copy.navLabel}</span>
      <div className="updates-ticker__viewport">
        <div className="updates-ticker__track">
          <TickerGroup items={items} copy={copy} />
          <TickerGroup items={items} copy={copy} clone />
        </div>
      </div>
    </div>
  );
}
