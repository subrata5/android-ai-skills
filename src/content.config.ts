import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const skills = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/skills' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.string(),
    phase: z.enum(['Define', 'Architecture', 'Build', 'Test', 'Review', 'Ship']),
    command: z.string(),
    trigger: z.string(),
    tags: z.array(z.string()),
    order: z.number(),
    related: z.array(z.string()).default([]),
  }),
});

export const collections = { skills };
