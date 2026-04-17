import type { DocsConfig } from "./lib/config";

export const docsConfig = {
  site: {
    title: "Docs",
    description: "Project documentation.",
    url: "https://example.com",
    logo: { enabled: false, src: "/logo.svg", alt: "Docs" },
    github: undefined,
  },
  i18n: {
    defaultLocale: "en",
    locales: [
      { code: "en", label: "English" },
      { code: "pt-br", label: "Português (Brasil)" },
    ],
  },
  versions: [{ id: "v1", label: "v1.0", current: true }],
  theme: { default: "system" },
  headerLinks: [] as DocsConfig["headerLinks"],
} satisfies DocsConfig;
