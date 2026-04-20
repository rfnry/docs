import { z } from "astro/zod";

export const docsConfigSchema = z.object({
  site: z.object({
    title: z.string(),
    description: z.string(),
    url: z.string().url().optional(),
    logo: z
      .object({
        enabled: z.boolean().default(false),
        src: z.string().default("/logo.svg"),
        alt: z.string().default(""),
      })
      .default({ enabled: false, src: "/logo.svg", alt: "" }),
    favicon: z.string().optional(),
    social: z
      .array(
        z.object({
          type: z.enum(["github", "website", "discord"]),
          href: z.string().url(),
        }),
      )
      .default([]),
  }),
  i18n: z.object({
    defaultLocale: z.string(),
    locales: z.array(z.object({ code: z.string(), label: z.string() })).nonempty(),
  }),
  packages: z
    .array(
      z.object({
        id: z.string(),
        label: z.string(),
        versions: z
          .array(
            z.object({
              id: z.string(),
              label: z.string(),
              current: z.boolean().optional(),
            }),
          )
          .nonempty()
          .refine((vs) => vs.filter((v) => v.current).length === 1, {
            message: "Each package must have exactly one version with { current: true }.",
          }),
      }),
    )
    .nonempty(),
  theme: z.object({ default: z.enum(["dark", "light", "system"]).default("system") }).default({ default: "system" }),
  headerLinks: z
    .array(
      z.object({
        label: z.string(),
        href: z.string().refine((v) => /^(https?:\/\/|\/)/.test(v), {
          message: "href must start with http://, https://, or /",
        }),
        external: z.boolean().optional(),
      }),
    )
    .default([]),
});

export type RfnryDocsConfig = z.infer<typeof docsConfigSchema>;
export type RfnryDocsUserConfig = z.input<typeof docsConfigSchema>;

/**
 * User config merged with runtime-resolved fields from Astro — the shape
 * exposed to templates via `virtual:@rfnry/docs/config`.
 */
export type ResolvedDocsConfig = RfnryDocsConfig & {
  /** Astro `base` normalized with leading + trailing slash (e.g. `/` or `/rfnry/`). */
  base: string;
};

export type DocsPackage = RfnryDocsConfig["packages"][number];
export type DocsVersion = DocsPackage["versions"][number];

export function getPackage(config: RfnryDocsConfig, pkgId: string): DocsPackage {
  const p = config.packages.find((x) => x.id === pkgId);
  if (!p) throw new Error(`Unknown package: ${pkgId}`);
  return p;
}

export function getCurrentVersion(pkg: DocsPackage): DocsVersion {
  const c = pkg.versions.filter((v) => v.current)[0];
  if (!c) throw new Error(`Package "${pkg.id}" must have exactly one { current: true } version`);
  return c;
}

export function getFirstPackage(config: RfnryDocsConfig): DocsPackage {
  return config.packages[0];
}
