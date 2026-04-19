import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import type { CollectionEntry } from "astro:content";
import { config as docsConfig } from "virtual:rfnry-docs/config";
import { stripFrontmatter } from "../lib/ai-content";
import { loadGroups } from "../lib/groups";
import { buildDocHref, parseEntryId } from "../lib/routing";
import { buildSidebarTree, flattenSidebarHrefs } from "../lib/sidebar";

type Scoped = { e: CollectionEntry<"docs">; p: ReturnType<typeof parseEntryId> };

export async function getStaticPaths() {
  return docsConfig.versions.flatMap((v) =>
    docsConfig.i18n.locales.map((l) => ({
      params: { locale: l.code, version: v.id },
    })),
  );
}

export const GET: APIRoute = async ({ params }) => {
  const { locale, version } = params as { locale: string; version: string };
  const entries = await getCollection("docs");

  const simpleEntries = entries.map((e: CollectionEntry<"docs">) => ({
    id: e.id,
    title: e.data.sidebar.label ?? e.data.title,
    order: e.data.sidebar.order,
    hidden: e.data.sidebar.hidden,
  }));
  const tree = buildSidebarTree({
    version,
    locale,
    entries: simpleEntries,
    groups: loadGroups(version, locale),
  });
  const orderedHrefs = flattenSidebarHrefs(tree);
  const hrefIndex = new Map(orderedHrefs.map((h, i) => [h, i]));

  const scoped = entries
    .map((e: CollectionEntry<"docs">) => ({ e, p: parseEntryId(e.id) }))
    .filter((x: Scoped) => x.p.version === version && x.p.locale === locale && !x.e.data.sidebar.hidden)
    .sort((a: Scoped, b: Scoped) => {
      const ai = hrefIndex.get(buildDocHref(a.p)) ?? Number.MAX_SAFE_INTEGER;
      const bi = hrefIndex.get(buildDocHref(b.p)) ?? Number.MAX_SAFE_INTEGER;
      return ai - bi;
    });

  const site = docsConfig.site;
  const chunks: string[] = [];
  chunks.push(`# ${site.title} — ${version} (${locale})\n\n${site.description}\n`);
  for (const { e, p } of scoped) {
    const url = site.url + buildDocHref(p);
    chunks.push(`\n\n---\n\n`);
    chunks.push(`# ${e.data.title}\n\n`);
    chunks.push(`Source: ${url}\n\n`);
    chunks.push(stripFrontmatter(e.body as string));
  }

  return new Response(chunks.join(""), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
