import type { CollectionEntry } from "astro:content";
import { getCollection } from "astro:content";
import { config as docsConfig } from "virtual:@rfnry/docs/config";
import type { APIRoute } from "astro";
import { loadGroups } from "../lib/groups";
import { buildDocHref, parseEntryId } from "../lib/routing";
import { buildSidebarTree, flattenSidebarHrefs } from "../lib/sidebar";
import { getCurrentVersion, getPackage } from "../schema";

type Scoped = { e: CollectionEntry<"docs">; p: ReturnType<typeof parseEntryId> };

export async function getStaticPaths() {
  return docsConfig.packages.flatMap((p) =>
    docsConfig.i18n.locales.map((l) => ({ params: { locale: l.code, pkg: p.id } })),
  );
}

export const GET: APIRoute = async ({ params }) => {
  const { locale, pkg } = params as { locale: string; pkg: string };
  const version = getCurrentVersion(getPackage(docsConfig, pkg)).id;
  const entries = await getCollection("docs");

  const simpleEntries = entries.map((e: CollectionEntry<"docs">) => ({
    id: e.id,
    title: e.data.sidebar.label ?? e.data.title,
    order: e.data.sidebar.order,
    hidden: e.data.sidebar.hidden,
  }));
  const tree = buildSidebarTree({
    pkg,
    version,
    locale,
    entries: simpleEntries,
    groups: loadGroups(pkg, version, locale),
  });
  const orderedHrefs = flattenSidebarHrefs(tree);
  const hrefIndex = new Map(orderedHrefs.map((h, i) => [h, i]));

  const scoped = entries
    .map((e: CollectionEntry<"docs">) => ({ e, p: parseEntryId(e.id) }))
    .filter(
      (x: Scoped) => x.p.pkg === pkg && x.p.version === version && x.p.locale === locale && !x.e.data.sidebar.hidden,
    )
    .sort((a: Scoped, b: Scoped) => {
      const ai = hrefIndex.get(buildDocHref(a.p)) ?? Number.MAX_SAFE_INTEGER;
      const bi = hrefIndex.get(buildDocHref(b.p)) ?? Number.MAX_SAFE_INTEGER;
      return ai - bi;
    });

  const site = docsConfig.site;
  const lines: string[] = [];
  lines.push(`# ${site.title}`);
  lines.push("");
  lines.push(`> ${site.description}`);
  lines.push("");
  lines.push(`Package: ${pkg}`);
  lines.push(`Version: ${version} (current)`);
  lines.push(`Locale: ${locale}`);
  lines.push("");
  lines.push("## Pages");
  lines.push("");
  for (const { e, p } of scoped) {
    const url = site.url + buildDocHref(p);
    lines.push(`- [${e.data.title}](${url}): ${e.data.description}`);
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
