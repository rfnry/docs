import rfnry from "@rfnry/docs";
import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://example.com",
  integrations: [
    rfnry({
      site: {
        title: "Minimal Example",
        description: "Smallest viable @rfnry/docs consumer.",
      },
      i18n: {
        defaultLocale: "en",
        locales: [{ code: "en", label: "English" }],
      },
      packages: [
        {
          id: "core",
          label: "Core",
          versions: [{ id: "v1", label: "v1.0", current: true }],
        },
      ],
    }),
  ],
});
