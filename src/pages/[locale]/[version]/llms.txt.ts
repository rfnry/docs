import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { parseEntryId, buildDocHref } from "../../../lib/routing";
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
  const lines: string[] = [];
  lines.push(`# ${site.title}`);
  lines.push("");
  lines.push(`> ${site.description}`);
  lines.push("");
  lines.push(`Version: ${version} · Locale: ${locale}`);
  lines.push("");
  lines.push("## Pages");
  lines.push("");
  for (const { e, p } of scoped) {
    const url = site.url + buildDocHref(p);
    lines.push(`- [${e.data.title}](${url}): ${e.data.description}`);
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
