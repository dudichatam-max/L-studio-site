declare const __LSTUDIO_CONTENT_REV__: string | undefined;

export function fetchSiteContent(): Promise<Response> {
  const rev = typeof __LSTUDIO_CONTENT_REV__ === "string" ? __LSTUDIO_CONTENT_REV__ : "";
  const query = rev ? `?v=${encodeURIComponent(rev)}` : "";
  return fetch(`${import.meta.env.BASE_URL}content.json${query}`, { cache: "no-store" });
}
