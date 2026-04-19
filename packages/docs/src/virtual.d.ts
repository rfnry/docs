/// <reference types="astro/client" />

declare module "virtual:@rfnry/docs/config" {
  import type { RfnryDocsConfig } from "@rfnry/docs/schema";
  export const config: RfnryDocsConfig;
}
