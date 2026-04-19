import { buildDocHref, parseEntryId } from "./routing";

export interface SidebarEntry {
  id: string;
  title: string;
  order: number;
  hidden: boolean;
}

export interface GroupMeta {
  label: string;
  order: number;
  collapsed: boolean;
}

export interface SidebarNode {
  label: string;
  href?: string;
  order: number;
  collapsed?: boolean;
  children?: SidebarNode[];
}

interface BuildArgs {
  version: string;
  locale: string;
  entries: SidebarEntry[];
  groups: Map<string, GroupMeta>;
}

function humanize(folder: string): string {
  const last = folder.split("/").pop() ?? folder;
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
}

interface Bucket {
  kind: "folder";
  folderPath: string;
  children: Map<string, Bucket | Leaf>;
}
interface Leaf {
  kind: "leaf";
  entry: SidebarEntry;
  parsed: ReturnType<typeof parseEntryId>;
}

export function buildSidebarTree(args: BuildArgs): SidebarNode[] {
  const { version, locale, entries, groups } = args;

  const root: Bucket = { kind: "folder", folderPath: "", children: new Map() };

  for (const entry of entries) {
    if (entry.hidden) continue;
    const parsed = parseEntryId(entry.id);
    if (parsed.version !== version || parsed.locale !== locale) continue;

    const slugParts = parsed.slug ? parsed.slug.split("/") : [];
    let cursor = root;
    let folderPath = "";

    const leafKey = slugParts.length === 0 ? "__index__" : slugParts[slugParts.length - 1];
    const folderParts = slugParts.length === 0 ? [] : slugParts.slice(0, -1);

    for (const part of folderParts) {
      folderPath = folderPath ? `${folderPath}/${part}` : part;
      let next = cursor.children.get(part);
      if (!next || next.kind !== "folder") {
        next = { kind: "folder", folderPath, children: new Map() };
        cursor.children.set(part, next);
      }
      cursor = next;
    }

    cursor.children.set(leafKey, { kind: "leaf", entry, parsed });
  }

  const toNode = (bucket: Bucket | Leaf): SidebarNode => {
    if (bucket.kind === "leaf") {
      return {
        label: bucket.entry.title,
        href: buildDocHref(bucket.parsed),
        order: bucket.entry.order,
      };
    }
    const meta = groups.get(bucket.folderPath);
    const children = [...bucket.children.values()]
      .map((b) => toNode(b))
      .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
    return {
      label: meta?.label ?? humanize(bucket.folderPath),
      order: meta?.order ?? 100,
      collapsed: meta?.collapsed ?? false,
      children,
    };
  };

  return [...root.children.values()]
    .map((b) => toNode(b))
    .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}

export function flattenSidebarHrefs(tree: SidebarNode[]): string[] {
  const out: string[] = [];
  const walk = (nodes: SidebarNode[]) => {
    for (const n of nodes) {
      if (n.href) out.push(n.href);
      if (n.children) walk(n.children);
    }
  };
  walk(tree);
  return out;
}

export function containsHref(node: SidebarNode, href: string): boolean {
  if (node.href === href) return true;
  return node.children?.some((c) => containsHref(c, href)) ?? false;
}
