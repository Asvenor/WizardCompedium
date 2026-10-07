/** Pure calculator logic. Rules and component wording come from the imported vault. */
export type RollMode = 'normal' | 'advantage' | 'disadvantage';
export type Consumption = 'consumed' | 'reusable' | 'special' | 'unknown';
export type ComponentItem = {
  description: string;
  gpCost: number | null;
  consumption: Consumption;
  quantityKind: 'casts' | 'sets';
  perTarget?: boolean;
  caveat?: string;
};
export type ComponentRecord = {
  kind: 'none' | 'ordinary' | 'budget' | 'unknown';
  raw: string;
  items: ComponentItem[];
};

export function readNumber(value: string, min: number, max: number, integer = true): number | null {
  if (value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max && (!integer || Number.isInteger(number)) ? number : null;
}

/** Ordinary saves/checks: natural 1 and 20 do not override the total. */
export function saveProbability(dc: number, bonus: number, mode: RollMode = 'normal') {
  if (!Number.isInteger(dc) || !Number.isInteger(bonus)) throw new RangeError('DC and bonus must be integers.');
  const p = Math.min(1, Math.max(0, (21 - dc + bonus) / 20));
  if (mode === 'advantage') return 1 - (1 - p) ** 2;
  if (mode === 'disadvantage') return p ** 2;
  if (mode !== 'normal') throw new RangeError('Unknown roll mode.');
  return p;
}

/** 2024 damage check: floor half damage, minimum 10, maximum 30. */
export function concentrationDc(damage: number) {
  if (!Number.isInteger(damage) || damage < 0) throw new RangeError('Damage must be a non-negative integer.');
  return Math.min(30, Math.max(10, Math.floor(damage / 2)));
}

/** A weighted mean of final damage outcomes, not half of a rounded dice mean. */
export function expectedSaveDamage(failureChance: number, damageOnFailure: number, damageOnSuccess: number) {
  if (![failureChance, damageOnFailure, damageOnSuccess].every(Number.isFinite) || failureChance < 0 || failureChance > 1 || damageOnFailure < 0 || damageOnSuccess < 0) throw new RangeError('Enter valid damage and a probability from 0 to 1.');
  // Equivalent weighted mean with fewer operations/cancellation at decimal ties.
  return damageOnSuccess + failureChance * (damageOnFailure - damageOnSuccess);
}

function pricesIn(text: string) {
  return [...text.matchAll(/(\d[\d,]*(?:\.\d+)?)\s*\+?\s*(GP|CP|SP|Copper Pieces?|Silver Pieces?)\b/gi)].map(match => {
    const unit = match[2].toLowerCase();
    return Number(match[1].replaceAll(',', '')) * (unit === 'cp' || unit.startsWith('copper') ? .01 : unit === 'sp' || unit.startsWith('silver') ? .1 : 1);
  });
}

/**
 * Exact source text is always retained in `raw`. Unpriced ordinary materials are
 * not invented shopping costs. Mixed/special source entries have explicit gates;
 * an unfamiliar multi-price entry is left unresolved rather than silently summed.
 */
export function parseSpellComponents(name: string, raw: string | null | undefined): ComponentRecord {
  if (!raw?.trim()) return {kind: 'unknown', raw: raw ?? '', items: [{description: 'Component details not recorded.', gpCost: null, consumption: 'unknown', quantityKind: 'sets'}]};
  if (!/(?:^|[,\s])M(?:\s*\(|\s*$)/.test(raw)) return {kind: 'none', raw, items: []};
  const material = raw.replace(/^[^(]*\(/, '').replace(/\)\s*$/, '');
  const prices = pricesIn(material);
  const key = name.toLowerCase();
  if (key === 'clone' && prices.length === 2 && prices[0] === 1000 && prices[1] === 2000) return {kind: 'budget', raw, items: [
    {description: 'Diamond', gpCost: prices[0], consumption: 'consumed', quantityKind: 'casts'},
    {description: 'Sealable vessel large enough for the creature', gpCost: prices[1], consumption: 'reusable', quantityKind: 'sets', caveat: 'Count vessels you need to acquire; occupied vessels are not automatically available for another clone.'},
  ]};
  if (key === 'legend lore' && prices.length === 2 && prices[0] === 250 && prices[1] === 50 && /four ivory strips/i.test(material)) return {kind: 'budget', raw, items: [
    {description: 'Incense', gpCost: prices[0], consumption: 'consumed', quantityKind: 'casts'},
    {description: 'Set of four ivory strips', gpCost: prices[1] * 4, consumption: 'reusable', quantityKind: 'sets', caveat: 'Four strips at 50+ GP each = one 200+ GP set.'},
  ]};
  if (key === 'astral projection' && prices.length === 2 && prices[0] === 1000 && prices[1] === 100 && /per target/i.test(material) && /all consumed/i.test(material)) return {kind: 'budget', raw, items: [
    {description: 'One jacinth and one silver bar per target', gpCost: prices[0] + prices[1], consumption: 'consumed', quantityKind: 'casts', perTarget: true, caveat: '1,000+ GP jacinth + 100+ GP silver bar, multiplied by targets per casting: the caster and up to eight willing creatures.'},
  ]};
  if (key === 'magic jar' && prices.length === 1) return {kind: 'budget', raw, items: [
    {description: material, gpCost: prices[0], consumption: 'special', quantityKind: 'sets', caveat: 'Not consumed at the initial casting, but destroyed when the spell ends. Enter containers to acquire, including planned replacements; it is not an indefinitely reusable focus.'},
  ]};
  if (key === "drawmij's instant summons" && prices.length === 1 && /crushed/i.test(material)) return {kind: 'budget', raw, items: [
    {description: material, gpCost: prices[0], consumption: 'special', quantityKind: 'casts', caveat: 'Each casting needs a different sapphire. It is spent when crushed to activate, not at the initial casting; retrieval can still fail.'},
  ]};
  const consumed = /\bconsum(?:ed|es)\b/i.test(material) && !/\bnot consumed\b/i.test(material);
  if (!prices.length && !consumed) return {kind: 'ordinary', raw, items: []};
  if (prices.length > 1 || /\beach\b/i.test(material)) return {kind: 'unknown', raw, items: [
    {description: material, gpCost: null, consumption: 'unknown', quantityKind: 'sets', caveat: 'Multiple prices or quantities need manual confirmation. Enter the price for one complete set and its cost handling.'},
  ]};
  return {kind: 'budget', raw, items: [{description: material, gpCost: prices[0] ?? null, consumption: consumed ? 'consumed' : 'reusable', quantityKind: consumed ? 'casts' : 'sets', caveat: prices.length ? (consumed ? 'Listed materials are consumed per casting.' : 'Not listed as consumed in this component line; obtain the required set, not one set per casting. Check the full spell for restrictions.') : 'Consumed material has no recorded price. Enter a confirmed price; it is not counted as free.'}]};
}

export function componentTotals(items: Array<{gpCost: number | null; consumption: Consumption; quantity: number | null}>) {
  let consumed = 0, reusable = 0, special = 0, incomplete = 0;
  for (const item of items) {
    if (item.gpCost == null || !Number.isFinite(item.gpCost) || item.gpCost < 0 || item.quantity == null || !Number.isInteger(item.quantity) || item.quantity < 0 || item.consumption === 'unknown') { incomplete++; continue; }
    const total = item.gpCost * item.quantity;
    if (item.consumption === 'consumed') consumed += total;
    else if (item.consumption === 'reusable') reusable += total;
    else if (item.consumption === 'special') special += total;
    else incomplete++;
  }
  // GP has copper-piece precision; avoid presenting binary floating-point noise.
  const round = (value: number) => Math.round(value * 100) / 100;
  return {consumed: round(consumed), reusable: round(reusable), special: round(special), shopping: round(consumed + reusable + special), incomplete};
}
