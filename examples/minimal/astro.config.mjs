import { defineConfig } from "astro/config";
import rfnry from "rfnry-docs";

export default defineConfig({
  site: "https://example.com",
  integrations: [
    rfnry({
      site: {
        title: "Minimal Example",
        description: "Smallest viable rfnry-docs consumer.",
      },
      i18n: {
        defaultLocale: "en",
        locales: [{ code: "en", label: "English" }],
      },
      versions: [{ id: "v1", label: "v1.0", current: true }],
    }),
  ],
});
