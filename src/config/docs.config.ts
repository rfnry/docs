// src/config/docs.config.ts

export type LocaleCode = string;

export interface LocaleEntry {
  code: LocaleCode;
  label: string;
}

export interface VersionEntry {
  id: string;
  label: string;
  current?: boolean;
}

export interface HeaderLink {
  label: string;
  href: string;
  external?: boolean;
}

export interface DocsConfig {
  site: {
    title: string;
    description: string;
    url: string;
    logo: { src: string; alt: string };
    github?: string;
  };
  i18n: {
    defaultLocale: LocaleCode;
    locales: LocaleEntry[];
  };
  versions: VersionEntry[];
  theme: { default: "dark" | "light" | "system" };
  headerLinks: HeaderLink[];
}

export const docsConfig = {
  site: {
    title: "Rfnry Docs",
    description: "Documentation for the Rfnry project.",
    url: "https://docs.rfnry.dev",
    logo: { src: "/logo.svg", alt: "Rfnry" },
    github: undefined,
  },
  i18n: {
    defaultLocale: "en",
    locales: [
      { code: "en", label: "English" },
      { code: "pt-br", label: "Português (Brasil)" },
    ],
  },
  versions: [
    { id: "v1", label: "v1.0", current: true },
  ],
  theme: { default: "system" },
  headerLinks: [],
} satisfies DocsConfig;

export function getCurrentVersion(): VersionEntry {
  const current = docsConfig.versions.find((v) => v.current);
  if (!current) throw new Error("docsConfig.versions must have exactly one { current: true }");
  return current;
}

export function getLocaleLabel(code: LocaleCode): string {
  const entry = docsConfig.i18n.locales.find((l) => l.code === code);
  return entry?.label ?? code;
}
