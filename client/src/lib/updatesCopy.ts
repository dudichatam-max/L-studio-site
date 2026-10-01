import type { Language } from "@/contexts/LanguageContext";
import fallbackJson from "./updatesFallback.json";

export type UpdateStatus = "in_progress" | "upcoming" | "shipped";

export type UpdateItem = {
  id: string;
  status: UpdateStatus;
  title: string;
  summary: string;
  ticker?: string;
  detail?: string;
  dateLabel?: string;
};

export type UpdatesCopy = {
  navLabel: string;
  pageTitle: string;
  pageKicker: string;
  pageIntro: string;
  tickerLabel: string;
  statusLabels: Record<UpdateStatus, string>;
  sections: Record<UpdateStatus, string>;
  items: UpdateItem[];
};

export const UPDATE_STATUSES: UpdateStatus[] = ["in_progress", "upcoming", "shipped"];

const fallback = fallbackJson as Record<Language, UpdatesCopy>;

/** Fallback nav labels. Editable copy lives in content.json under nav.updates. */
export const updatesNavLabel: Record<Language, string> = {
  he: fallback.he.navLabel,
  en: fallback.en.navLabel,
  ru: fallback.ru.navLabel,
  ar: fallback.ar.navLabel,
};

export function updatesFallback(language: Language): UpdatesCopy {
  return fallback[language] ?? fallback.en;
}

type UpdatesContentSlice = {
  nav?: { updates?: string };
  updates?: Partial<UpdatesCopy> | null;
};

export function updatesNavLabelFrom(language: Language, content?: UpdatesContentSlice | null): string {
  const fromNav = content?.nav?.updates;
  const fromBlock = content?.updates?.navLabel;
  if (typeof fromNav === "string" && fromNav) return fromNav;
  if (typeof fromBlock === "string" && fromBlock) return fromBlock;
  return updatesNavLabel[language];
}

export function mergeUpdates(language: Language, content?: Partial<UpdatesCopy> | null): UpdatesCopy {
  const base = updatesFallback(language);
  if (!content) return base;
  return {
    ...base,
    ...content,
    navLabel: content.navLabel || base.navLabel,
    statusLabels: { ...base.statusLabels, ...(content.statusLabels ?? {}) },
    sections: { ...base.sections, ...(content.sections ?? {}) },
    items: content.items?.length ? content.items : base.items,
  };
}

export function groupUpdates(copy: UpdatesCopy) {
  return UPDATE_STATUSES.map((status) => ({
    status,
    title: copy.sections?.[status] || copy.statusLabels?.[status] || status,
    items: (copy.items ?? []).filter((item) => item.status === status),
  })).filter((group) => group.items.length > 0);
}
