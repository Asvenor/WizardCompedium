import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';

const chapters = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/chapters' }),
  schema: z.object({
    title: z.string(),
    chapter: z.number().nullable(),
    order: z.number(),
    part: z.string(),
    partTitle: z.string(),
    hub: z.enum(['fundamentals', 'builds', 'spells', 'combat', 'gear', 'reference']),
    sourceLocator: z.string(),
    description: z.string(),
  }),
});

const spells = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/spells' }),
  schema: z.object({
    id: z.string(),
    name: z.string(),
    level: z.number(),
    school: z.string().nullable(),
    rules: z.object({
      castingTime: z.string().nullable(),
      range: z.string().nullable(),
      area: z.string().nullable(),
      duration: z.string().nullable(),
      concentration: z.boolean(),
      ritual: z.boolean(),
      components: z.object({
        verbal: z.boolean().nullable(),
        somatic: z.boolean().nullable(),
        material: z.boolean().nullable(),
        description: z.string().nullable(),
        gpCost: z.number().nullable(),
        consumed: z.boolean().nullable(),
      }),
      damageTypes: z.array(z.string()),
      save: z.object({ ability: z.string().nullable(), type: z.string().nullable() }),
      attackRoll: z.boolean(),
    }),
    source: z.object({
      book: z.string().nullable(),
      rulesVersion: z.string(),
      category: z.string(),
      sourceSensitive: z.boolean(),
    }),
    compendium: z.object({
      tier: z.string().nullable(),
      acquisitionRole: z.enum(['mandatory', 'optional', 'sleeper', 'unclassified']),
      preparedBaseline: z.boolean(),
      roles: z.array(z.string()),
      summary: z.string(),
      buildRelevance: z.array(z.string()),
      warnings: z.array(z.string()),
      relatedChapters: z.array(z.number()),
    }),
    sourceLocator: z.string(),
  }),
});

export const collections = { chapters, spells };
