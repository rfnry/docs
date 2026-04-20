export interface ParsedEntryId {
  pkg: string;
  version: string;
  locale: string;
  slug: string;
}

export function parseEntryId(id: string): ParsedEntryId {
  const parts = id.split("/");
  if (parts.length < 3) {
    throw new Error(`Invalid entry id: "${id}" (expected at least package/version/locale)`);
  }
  const [pkg, version, locale, ...rest] = parts;
  let slug = rest.join("/");
  if (slug === "index") slug = "";
  return { pkg, version, locale, slug };
}

export function buildDocHref(parts: ParsedEntryId): string {
  const { pkg, version, locale, slug } = parts;
  const base = `/${locale}/${pkg}/${version}/`;
  if (!slug) return base;
  return `${base}${slug}/`;
}
