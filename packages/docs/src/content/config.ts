import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

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
      .default({ order: 100, hidden: false }),
  }),
});

export const collections = { docs };
