import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { parseEntryId, buildDocHref } from "../../../lib/routing";
import { stripFrontmatter, buildContextHeader } from "../../../lib/ai-content";
import { docsConfig } from "../../../docs.config";

export async function getStaticPaths() {
  const entries = await getCollection("docs");
  return entries.map((entry) => {
    const parsed = parseEntryId(entry.id);
    return {
      params: {
        locale: parsed.locale,
        version: parsed.version,
        slug: parsed.slug || undefined,
      },
      props: { entry, parsed },
    };
  });
}

export const GET: APIRoute = async ({ props }) => {
  const { entry, parsed } = props as any;
  const body = entry.body as string;
  const url = docsConfig.site.url + buildDocHref(parsed);
  const header = buildContextHeader({ url, version: parsed.version, locale: parsed.locale });
  const title = `# ${entry.data.title}\n\n`;
  const content = header + title + stripFrontmatter(body);
  return new Response(content, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
};
