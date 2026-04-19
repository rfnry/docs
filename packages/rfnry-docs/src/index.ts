/// <reference path="./virtual.d.ts" />
import type { AstroIntegration } from "astro";
import rehypeSlug from "rehype-slug";
import { virtualConfigPlugin } from "./integrations/virtual-config";
import rehypeSectionAnchors from "./lib/remark/section-anchors.mjs";
import { docsConfigSchema, type RfnryDocsUserConfig } from "./schema";

const ROUTES: ReadonlyArray<{ pattern: string; entrypoint: string }> = [
  { pattern: "/", entrypoint: "rfnry-docs/routes/index.astro" },
  { pattern: "/[locale]", entrypoint: "rfnry-docs/routes/locale-index.astro" },
  { pattern: "/[locale]/[version]/[...slug]", entrypoint: "rfnry-docs/routes/slug.astro" },
  { pattern: "/[locale]/[version]/[...slug].md", entrypoint: "rfnry-docs/routes/slug.md.ts" },
  { pattern: "/[locale]/[version]/llms.txt", entrypoint: "rfnry-docs/routes/llms.txt.ts" },
  { pattern: "/[locale]/[version]/llms-full.txt", entrypoint: "rfnry-docs/routes/llms-full.txt.ts" },
  { pattern: "/llms.txt", entrypoint: "rfnry-docs/routes/root-llms.txt.ts" },
  { pattern: "/404", entrypoint: "rfnry-docs/routes/404.astro" },
];

export default function rfnry(userConfig: RfnryDocsUserConfig): AstroIntegration {
  const config = docsConfigSchema.parse(userConfig);

  return {
    name: "rfnry-docs",
    hooks: {
      "astro:config:setup"({ updateConfig, injectRoute, config: astroConfig }) {
        const mergedConfig = {
          ...config,
          site: {
            ...config.site,
            url: config.site.url ?? astroConfig.site,
          },
        };
        updateConfig({
          i18n: {
            defaultLocale: config.i18n.defaultLocale,
            locales: config.i18n.locales.map((l) => l.code),
            routing: {
              prefixDefaultLocale: true,
              redirectToDefaultLocale: true,
              fallbackType: "redirect",
            },
          },
          trailingSlash: "always",
          build: { format: "directory" },
          markdown: {
            shikiConfig: {
              themes: { light: "github-light", dark: "github-dark" },
              wrap: true,
            },
            rehypePlugins: [rehypeSlug, rehypeSectionAnchors],
          },
          vite: { plugins: [virtualConfigPlugin(mergedConfig)] },
        });

        for (const r of ROUTES) injectRoute(r);
      },
    },
  };
}

export type { RfnryDocsConfig, RfnryDocsUserConfig } from "./schema";
