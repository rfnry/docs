export interface ParsedEntryId {
  version: string;
  locale: string;
  slug: string;
}

export function parseEntryId(id: string): ParsedEntryId {
  const parts = id.split("/");
  if (parts.length < 2) {
    throw new Error(`Invalid entry id: "${id}" (expected at least version/locale)`);
  }
  const [version, locale, ...rest] = parts;
  let slug = rest.join("/");
  if (slug === "index") slug = "";
  return { version, locale, slug };
}

export function buildDocHref(parts: ParsedEntryId): string {
  const { version, locale, slug } = parts;
  const base = `/${locale}/${version}/`;
  if (!slug) return base;
  return `${base}${slug}/`;
}
