/// <reference path="./virtual.d.ts" />
import { fileURLToPath } from "node:url";
import type { AstroIntegration } from "astro";
import { createIndex } from "pagefind";
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
  let isStatic = true;

  return {
    name: "rfnry-docs",
    hooks: {
      "astro:config:setup"({ updateConfig, injectRoute, config: astroConfig }) {
        isStatic = astroConfig.output === "static";
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
              redirectToDefaultLocale: false,
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
      async "astro:build:done"({ dir, logger }) {
        if (!isStatic) {
          logger.warn("search index skipped: requires output: 'static' (pagefind indexes static HTML)");
          return;
        }
        const outDir = fileURLToPath(dir);
        const { index, errors: createErrors } = await createIndex({});
        if (!index) {
          logger.warn(`pagefind: failed to create index — ${createErrors.join(", ")}`);
          return;
        }
        const { errors: addErrors } = await index.addDirectory({ path: outDir });
        if (addErrors.length > 0) {
          logger.warn(`pagefind: errors while indexing — ${addErrors.join(", ")}`);
        }
        await index.writeFiles({ outputPath: `${outDir}/pagefind` });
      },
    },
  };
}

export type { RfnryDocsConfig, RfnryDocsUserConfig } from "./schema";
