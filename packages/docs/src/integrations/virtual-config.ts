import type { Plugin } from "vite";
import type { ResolvedDocsConfig } from "../schema";

const VIRTUAL_ID = "virtual:@rfnry/docs/config";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;

export function virtualConfigPlugin(config: ResolvedDocsConfig): Plugin {
  return {
    name: "@rfnry/docs:virtual-config",
    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID;
      return null;
    },
    load(id) {
      if (id === RESOLVED_ID) {
        return `export const config = ${JSON.stringify(config)};`;
      }
      return null;
    },
  };
}
