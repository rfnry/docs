import rfnry from "@rfnry/docs";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://example.com",
  integrations: [
    rfnry({
      site: {
        title: "Full Example",
        description: "Two locales, nested groups, deep versioned content.",
        logo: { enabled: false, src: "/logo.svg", alt: "Full Example" },
        social: [
          { type: "github", href: "https://github.com/rfnry/docs" },
          { type: "website", href: "https://rfnry.dev" },
          { type: "discord", href: "https://discord.com" },
        ],
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
      headerLinks: [],
    }),
  ],
});
