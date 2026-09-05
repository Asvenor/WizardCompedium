import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = true;

const cleanText = (value: string) => value
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<\/(?:p|div|td|th|tr|table|li|h[1-6])>/gi, ' ')
  .replace(/<[^>]+>/g, ' ')
  .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
  .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
  .replace(/^[#>*+-]+\s*/gm, '')
  .replace(/[`_*~|]/g, ' ')
  .replace(/&amp;/g, '&')
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

export const GET: APIRoute = async () => {
  const [chapters, spells] = await Promise.all([
    getCollection('chapters'),
    getCollection('spells'),
  ]);

  const documents = [
    ...chapters.map((entry) => ({
      title: entry.data.title,
      description: entry.data.description,
      content: cleanText(entry.body ?? ''),
      url: `/chapters/${entry.id}/`,
      kind: entry.data.chapter == null ? 'Reference' : 'Chapter',
      meta: entry.data.chapter == null ? entry.data.part : `Chapter ${entry.data.chapter} · ${entry.data.part}`,
    })),
    ...spells.map((entry) => {
      const spell = entry.data;
      const level = spell.level === 0 ? 'Cantrip' : `Level ${spell.level}`;
      const content = [
        spell.compendium.summary,
        ...spell.compendium.roles,
        ...spell.compendium.buildRelevance,
        ...spell.compendium.warnings,
        spell.school,
        spell.rules.castingTime,
        spell.rules.range,
        spell.rules.area,
        spell.rules.duration,
        spell.rules.components.description,
        ...spell.rules.damageTypes,
        spell.rules.save.ability,
        spell.source.book,
        spell.source.category,
        spell.compendium.tier,
        spell.compendium.acquisitionRole,
      ].filter(Boolean).join(' ');

      return {
        title: spell.name,
        description: spell.compendium.summary,
        content: cleanText(content),
        url: `/spells/${spell.id}/`,
        kind: 'Spell',
        meta: `${level} · ${spell.source.category}`,
      };
    }),
  ].sort((a, b) => a.title.localeCompare(b.title));

  return new Response(JSON.stringify(documents), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
};
