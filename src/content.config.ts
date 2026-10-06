import {defineCollection} from 'astro:content';
import {z} from 'astro/zod';
import {glob} from 'astro/loaders';

const vault = defineCollection({
  loader:glob({pattern:'**/*.md', base:'./src/content/vault'}),
  schema:z.object({
    title:z.string(),
    slug:z.string(),
    section:z.string(),
    sectionLabel:z.string(),
    type:z.string(),
    summary:z.string(),
    sourcePath:z.string(),
    updatedAt:z.preprocess(value=>value instanceof Date ? value.toISOString() : value,z.string()),
    metadata:z.record(z.string(),z.any()),
  }),
});

export const collections = {vault};
