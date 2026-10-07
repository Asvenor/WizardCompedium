/** Source-backed planner. Markdown is supplied at build time; no vault writes. */
export const SUBCLASSES = ['Abjurer', 'Bladesinger', 'Chronurgy', 'Conjurer', 'Diviner', 'Illusionist', 'Necromancer'] as const;
export const ROUTES = [
  {id: 'pure', label: 'Pure Wizard', prefix: ''},
  {id: 'artificer-1', label: 'Revised Artificer 1', prefix: 'artificer-'},
  {id: 'cleric-1', label: 'Cleric 1', prefix: 'cleric-'},
  {id: 'fighter-1', label: 'Fighter 1', prefix: 'fighter-1-'},
  {id: 'fighter-2', label: 'Fighter 2', prefix: 'fighter-2-'},
] as const;
export type RouteId = typeof ROUTES[number]['id'];
export type PlannerState = {subclass: string; route: RouteId; basis: 'character' | 'wizard'; level: number};
export type SpellChoice = {name: string; href: string};
export type Choices = {raw: string; spells: SpellChoice[]; complete: boolean};
export type WizardRow = {level: number; proficiency: string; cantrips: number; prepared: number; highest: number; slots: number[]; book: number; milestone: string};
export type AcquisitionRow = {characterLevel: number; wizardLevel: number; advanced: string; normal: Choices; extra: Choices; features: string; featureSpells: SpellChoice[]; why: string; highest: number; highestSlot: number};
export type RoutePlan = {subclass: string; route: RouteId; href: string; heading: string; intro: string; cantrips: string; dip: string[]; rows: AcquisitionRow[]};
export type PlannerData = {wizard: WizardRow[]; decisions: Array<{levels: number[]; text: string}>; routes: RoutePlan[]};
type SourceTable = {heading: string; headers: string[]; rows: string[][]};
const body = (source: string) => source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
const plain = (text: string) => text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1').replace(/[*`]/g, '');
const slug = (text: string) => text.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-');

export function sourceTables(source: string): SourceTable[] {
  const tables: SourceTable[] = [];
  let heading = '';
  const lines = body(source).split(/\r?\n/);
  const cells = (line: string) => line.trim().slice(1, -1).split(/(?<!\\)\|/).map(s => s.trim().replace(/\\\|/g, '|'));
  for (let i = 0; i < lines.length; i++) {
    if (/^##? /.test(lines[i])) heading = lines[i].replace(/^#+ /, '');
    if (!/^\|.+\|\s*$/.test(lines[i]) || !/^\|[\s|:-]+\|\s*$/.test(lines[i + 1] ?? '')) continue;
    const headers = cells(lines[i]), rows: string[][] = [];
    i += 2;
    while (/^\|.+\|\s*$/.test(lines[i] ?? '')) {
      const row = cells(lines[i]);
      if (row.length !== headers.length) throw Error(`Malformed source table: ${heading}`);
      rows.push(row); i++;
    }
    i--;
    tables.push({heading, headers, rows});
  }
  return tables;
}

/** Count only completely understood cells. Unrecognized prose never becomes zero. */
export function parseChoices(raw: string): Choices {
  const spells: SpellChoice[] = [];
  const remainder = raw.replace(/\[([^\]]+)\]\((\/library\/spells\/spell-cards\/[a-z0-9-]+\/)\)/g, (_match, name, href) => {
    spells.push({name, href}); return '';
  });
  return {raw, spells, complete: /^[\s;,.—–*-]*$/.test(remainder)};
}

function sectionParagraphs(source: string, heading: RegExp): string[] {
  const lines = body(source).split(/\r?\n/), start = lines.findIndex(line => /^## /.test(line) && heading.test(line.slice(3)));
  if (start < 0) return [];
  let end = start + 1;
  while (end < lines.length && !/^## /.test(lines[end])) end++;
  return lines.slice(start + 1, end).join('\n').trim().split(/\n\s*\n/).filter(p => p && !/^[|#-]/.test(p));
}

function requiredNumber(value: string, context: string, zero = false): number {
  if (zero && /^(?:—|–|0)$/.test(value)) return 0;
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 60) throw Error(`Invalid source number (${context}): ${value}`);
  return Number(value);
}

export function compilePlanner(plannerSource: string, routeSources: Record<string, string>): PlannerData {
  const tables = sourceTables(plannerSource);
  const wizardTable = tables.find(t => t.headers.includes('Book minimum'));
  if (!wizardTable || wizardTable.rows.length !== 20) throw Error('Wizard source must contain its complete 1–20 table.');
  const wizard = wizardTable.rows.map((r, index): WizardRow => {
    const level = requiredNumber(r[0], 'Wizard level');
    if (level !== index + 1) throw Error('Wizard source levels must be sequential.');
    return {level, proficiency: r[1], cantrips: requiredNumber(r[2], 'Cantrips'), prepared: requiredNumber(r[3], 'Prepared'), highest: requiredNumber(r[4], 'Highest spell'), slots: r[5].split('/').map(v => requiredNumber(v.trim(), 'Slots')), book: requiredNumber(r[6], 'Book minimum'), milestone: r[7]};
  });
  const decisions = (tables.find(t => t.headers[0] === 'Milestone')?.rows ?? []).filter(r => /^\d/.test(r[0])).map(r => ({levels: r[0].split('/').map(v => requiredNumber(v.trim(), 'Milestone')), text: r[1]}));
  if (!decisions.length) throw Error('Missing source level-up decisions.');
  const routes: RoutePlan[] = [];
  for (const subclassName of SUBCLASSES) for (const structure of ROUTES) {
    const subclass = subclassName.toLowerCase(), filename = `${structure.prefix}${subclass}-spell-progression.md`;
    const source = routeSources[filename];
    if (!source) throw Error(`Missing route source: ${filename}`);
    const table = sourceTables(source).find(t => t.headers.includes('Learn normally') && t.headers.includes('Extra book spells'));
    if (!table || table.rows.length !== 20) throw Error(`Incomplete route table: ${filename}`);
    const pure = structure.id === 'pure', href = `/library/character/spell-progressions/${filename.slice(0, -3)}/`;
    const rows = table.rows.map((r, index): AcquisitionRow => {
      const characterLevel = requiredNumber(r[0], filename), wizardLevel = pure ? characterLevel : requiredNumber(r[2], filename, true);
      if (characterLevel !== index + 1 || wizardLevel > characterLevel) throw Error(`Invalid route calendar: ${filename}`);
      const normal = parseChoices(r[pure ? 1 : 3]), extra = parseChoices(r[pure ? 2 : 4]), features = r[pure ? 3 : 5];
      const highest = wizard[wizardLevel - 1]?.highest ?? 0;
      const printed = pure ? [highest, highest] : r[6].split('/').map(v => requiredNumber(v.trim(), filename, true));
      if (printed.length !== 2 || printed[0] !== highest) throw Error(`Wizard access conflicts with source table: ${filename}, ${characterLevel}`);
      return {characterLevel, wizardLevel, advanced: pure ? `Wizard ${wizardLevel}` : r[1], normal, extra, features, featureSpells: parseChoices(features).spells, why: pure ? r[4] : '', highest, highestSlot: printed[1]};
    });
    // Three pure guides place Mastery/Signature selections in a paragraph, not
    // their table. Resolve only that exact source form and already-owned names.
    const selections = source.match(/^\*\*Feature selections:\*\*.+$/m)?.[0] ?? '';
    const owned = rows.flatMap(row => [...row.normal.spells, ...row.extra.spells]);
    for (const match of selections.matchAll(/at Wizard (18|20) choose \*\*([^*]+)\*\* for (Spell Mastery|Signature Spells)/g)) {
      const row = rows.find(r => r.wizardLevel === Number(match[1]) && r.advanced.startsWith('Wizard'));
      if (!row || row.featureSpells.length) continue;
      const choices = match[2].split(' + ').map(n => owned.find(s => s.name === n.trim()));
      if (choices.length !== 2 || choices.some(c => !c)) throw Error(`Unresolved feature selection: ${filename}`);
      row.featureSpells = choices as SpellChoice[];
      row.features = `${row.featureSpells.map(s => `[${s.name}](${s.href})`).join('; ')} (${match[3]}; already in book)`;
    }
    const intro = body(source).trim().split(/\n\s*\n/).find(p => !/^\[/.test(p)) ?? '';
    routes.push({subclass, route: structure.id, href, heading: slug(table.heading), intro, cantrips: sectionParagraphs(source, /^(?:Wizard cantrips|Cantrips(?: and prepared examples)?)$/)[0] ?? '', dip: sectionParagraphs(source, /^Dip features and separate spells$/), rows});
  }
  return {wizard, decisions, routes};
}

export const routePlan = (data: PlannerData, state: Pick<PlannerState, 'subclass' | 'route'>) => data.routes.find(r => r.subclass === state.subclass && r.route === state.route);
export function levelBounds(data: PlannerData, state: Pick<PlannerState, 'subclass' | 'route' | 'basis'>) {
  if (state.basis === 'character') return {min: 1, max: 20};
  const plan = routePlan(data, state) ?? data.routes.find(r => r.route === state.route)!;
  return {min: plan.rows[0].wizardLevel, max: plan.rows[19].wizardLevel};
}

export function readPlannerState(params: URLSearchParams, data: PlannerData): {state: PlannerState; warnings: string[]} {
  const warnings: string[] = [];
  const read = (key: string, allowed: readonly string[], fallback: string) => {
    const values = params.getAll(key);
    if (!values.length) return fallback;
    if (values.length !== 1 || !allowed.includes(values[0])) { warnings.push(`Invalid ${key} was reset.`); return fallback; }
    return values[0];
  };
  const state: PlannerState = {
    subclass: read('subclass', ['', ...SUBCLASSES.map(s => s.toLowerCase())], ''),
    route: read('route', ROUTES.map(r => r.id), 'pure') as RouteId,
    basis: read('basis', ['character', 'wizard'], 'character') as PlannerState['basis'],
    level: 1,
  };
  const {min, max} = levelBounds(data, state), values = params.getAll('level');
  if (values.length) {
    if (values.length !== 1 || !/^(?:0|[1-9]\d?)$/.test(values[0]) || Number(values[0]) < min || Number(values[0]) > max) warnings.push(`Level must be ${min}–${max} for this calendar; reset to ${Math.max(min, 1)}.`);
    else state.level = Number(values[0]);
  }
  return {state, warnings};
}

export function plannerQuery(state: PlannerState) {
  return new URLSearchParams({subclass: state.subclass, route: state.route, basis: state.basis, level: String(state.level)}).toString();
}

export function selectLevel(data: PlannerData, state: PlannerState) {
  const plan = routePlan(data, state) ?? null;
  const calendar = plan ?? data.routes.find(r => r.route === state.route);
  if (!calendar) throw RangeError('Unknown route calendar.');
  const sourceRow = state.basis === 'character' ? calendar.rows.find(r => r.characterLevel === state.level) : calendar.rows.find(r => r.wizardLevel === state.level);
  if (!sourceRow) throw RangeError('This level is outside the printed route.');
  // Shared class timing is useful before subclass selection. Never leak the
  // fallback calendar's subclass choices or totals as a default recommendation.
  const noChoice: Choices = {raw: 'Choose a subclass for route choices.', spells: [], complete: false};
  const row = plan ? sourceRow : {...sourceRow, normal: noChoice, extra: noChoice, features: '', featureSpells: [], why: ''};
  const baseline = data.wizard[row.wizardLevel - 1] ?? null;
  const through = calendar.rows.slice(0, row.characterLevel);
  const classLevels: Record<string, number> = {};
  for (const r of through) { const [name, level] = r.advanced.split(' '); classLevels[name] = Number(level); }
  const casterLevel = (classLevels.Wizard ?? 0) + (classLevels.Cleric ?? 0) + Math.ceil((classLevels.Artificer ?? 0) / 2);
  const slots = data.wizard[casterLevel - 1]?.slots ?? [];
  if (slots.length !== row.highestSlot) throw Error('Shared slots conflict with the route source.');
  const normal = plan ? through.flatMap(r => r.normal.spells) : [], extras = plan ? through.flatMap(r => r.extra.spells) : [];
  const bookComplete = Boolean(plan) && through.every(r => r.normal.complete && r.extra.complete);
  const unique = (spells: SpellChoice[]) => [...new Map(spells.map(s => [s.href, s])).values()];
  const book = unique([...normal, ...extras]), always = plan ? unique(through.flatMap(r => r.featureSpells)) : [];
  const advancesWizard = row.advanced.startsWith('Wizard ');
  const checklist = advancesWizard ? data.decisions.filter(d => d.levels.includes(row.wizardLevel)).map(d => d.text) : [];
  return {plan, row, baseline, classLevels, casterLevel, slots, advancesWizard, book, bookComplete, normalCount: unique(normal).length, extraCount: unique(extras).length, always, checklist, proficiency: data.wizard[row.characterLevel - 1].proficiency};
}

/** Safe, deliberately small inline Markdown subset; never interpret source HTML. */
export function inlineParts(text: string): Array<{text: string; href?: string}> {
  const parts: Array<{text: string; href?: string}> = [];
  let end = 0;
  for (const match of text.matchAll(/\[([^\]]+)\]\((\/library\/[a-z0-9\/#-]+)\)/g)) {
    if (match.index! > end) parts.push({text: plain(text.slice(end, match.index))});
    parts.push({text: match[1], href: match[2]});
    end = match.index! + match[0].length;
  }
  if (end < text.length) parts.push({text: plain(text.slice(end))});
  return parts;
}
