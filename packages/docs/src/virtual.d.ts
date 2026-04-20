/// <reference types="astro/client" />

declare module "virtual:@rfnry/docs/config" {
  import type { ResolvedDocsConfig } from "@rfnry/docs/schema";
  export const config: ResolvedDocsConfig;
}
