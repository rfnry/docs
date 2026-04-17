// astro.config.mjs
// @ts-check
import { defineConfig } from "astro/config";
import rehypeSlug from "rehype-slug";
import rehypeSectionAnchors from "./src/lib/remark/section-anchors.mjs";
import { docsConfig } from "./src/config/docs.config.ts";

export default defineConfig({
  site: docsConfig.site.url,
  trailingSlash: "always",
  build: { format: "directory" },
  i18n: {
    defaultLocale: docsConfig.i18n.defaultLocale,
    locales: docsConfig.i18n.locales.map((l) => l.code),
    routing: { prefixDefaultLocale: true },
  },
  markdown: {
    shikiConfig: {
      themes: { light: "github-light", dark: "github-dark" },
      wrap: true,
    },
    rehypePlugins: [rehypeSlug, rehypeSectionAnchors],
  },
});
