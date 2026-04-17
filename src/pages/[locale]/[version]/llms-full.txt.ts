import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { parseEntryId, buildDocHref } from "../../../lib/routing";
import { stripFrontmatter } from "../../../lib/ai-content";
import { docsConfig } from "../../../config/docs.config";

export async function getStaticPaths() {
  return docsConfig.versions.flatMap((v) =>
    docsConfig.i18n.locales.map((l) => ({
      params: { locale: l.code, version: v.id },
    }))
  );
}

export const GET: APIRoute = async ({ params }) => {
  const { locale, version } = params as { locale: string; version: string };
  const entries = await getCollection("docs");
  const scoped = entries
    .map((e) => ({ e, p: parseEntryId(e.id) }))
    .filter((x) => x.p.version === version && x.p.locale === locale && !x.e.data.sidebar.hidden)
    .sort((a, b) => a.e.data.sidebar.order - b.e.data.sidebar.order);

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
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
