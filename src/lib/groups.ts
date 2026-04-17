import { parse } from "yaml";
import type { GroupMeta } from "./sidebar";

const raw = import.meta.glob("/src/content/docs/**/_group.yaml", {
  query: "?raw",
  import: "default",
  eager: true,
}) as Record<string, string>;

/**
 * Returns a Map keyed by folder path relative to a given {version, locale} root.
 * Example: for path "/src/content/docs/v1/en/guides/_group.yaml" and args
 * {version:"v1", locale:"en"}, the key is "guides".
 */
export function loadGroups(version: string, locale: string): Map<string, GroupMeta> {
  const prefix = `/src/content/docs/${version}/${locale}/`;
  const map = new Map<string, GroupMeta>();
  for (const [path, body] of Object.entries(raw)) {
    if (!path.startsWith(prefix)) continue;
    const rel = path.slice(prefix.length);
    const folder = rel.replace(/\/_group\.yaml$/, "");
    if (!folder) continue;
    const data = parse(body) as Partial<GroupMeta>;
    map.set(folder, {
      label: data.label ?? folder,
      order: typeof data.order === "number" ? data.order : 100,
      collapsed: data.collapsed ?? false,
    });
  }
  return map;
}
