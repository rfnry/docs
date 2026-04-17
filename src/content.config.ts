import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const docs = defineCollection({
  loader: glob({
    pattern: "**/*.md",
    base: "./src/content/docs",
  }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    sidebar: z
      .object({
        order: z.number().default(100),
        label: z.string().optional(),
        hidden: z.boolean().default(false),
      })
      .default({}),
  }),
});

export const collections = { docs };
