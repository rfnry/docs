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

export function buildDocHref(parts: ParsedEntryId, base = "/"): string {
  const { pkg, version, locale, slug } = parts;
  const b = base.endsWith("/") ? base : `${base}/`;
  const tail = slug ? `${slug}/` : "";
  return `${b}${locale}/${pkg}/${version}/${tail}`;
}

export function withBase(base: string, path: string): string {
  const b = base.endsWith("/") ? base : `${base}/`;
  return path.startsWith("/") ? `${b}${path.slice(1)}` : `${b}${path}`;
}
