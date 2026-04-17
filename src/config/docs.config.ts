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
    logo: { enabled: boolean; src: string; alt: string };
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
    title: "Docs",
    description: "Project documentation.",
    // REQUIRED: change to your own domain before deploying.
    // Emitted verbatim into every .md endpoint, llms.txt, llms-full.txt, and canonical link.
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
  versions: [
    { id: "v1", label: "v1.0", current: true },
  ],
  theme: { default: "system" },
  headerLinks: [],
} satisfies DocsConfig;

if (docsConfig.versions.length === 0) {
  throw new Error("docsConfig.versions must contain at least one entry.");
}
if (docsConfig.i18n.locales.length === 0) {
  throw new Error("docsConfig.i18n.locales must contain at least one entry.");
}

export function getCurrentVersion(): VersionEntry {
  const currents = docsConfig.versions.filter((v) => v.current);
  if (currents.length !== 1) {
    throw new Error(
      `docsConfig.versions must have exactly one { current: true } (found ${currents.length})`,
    );
  }
  return currents[0];
}

export function getLocaleLabel(code: LocaleCode): string {
  const entry = docsConfig.i18n.locales.find((l) => l.code === code);
  return entry?.label ?? code;
}
