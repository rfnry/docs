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
      message: "Exactly one version must be { current: true }.",
    }),
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

export function getCurrentVersion(config: RfnryDocsConfig) {
  const c = config.versions.filter((v) => v.current)[0];
  if (!c) throw new Error("docsConfig.versions must have exactly one { current: true }");
  return c;
}
