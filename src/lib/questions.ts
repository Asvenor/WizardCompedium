import {normalizeSearch, searchTerms} from './search.ts';

export interface QuestionAnswer {
  id: string;
  title: string;
  questions: string[];
  answer: string;
  section: string;
  url: string;
  links?: {label: string; url: string}[];
}

// Hand-curated summaries of existing vault sections, not generated rules or a
// live rules service. The linked references retain their edition and caveats.
// Source destinations and anchors are checked by test-question-search.mjs.
export const questionAnswers: QuestionAnswer[] = [
  {
    id: 'spell-counts', title: 'Spell counts at each Wizard level', section: 'character',
    questions: ['How many spells I should have at each level', 'How many spells should I have at each level?', 'How many spells per level?', 'Spells per level', 'How many spells at level 5?', 'Number of spells by level', 'Wizard spells per level', 'Spellbook totals', 'Spellbook spells per level', 'How many prepared spells?', 'How many prepared spells at each level?', 'How many spells do I prepare?', 'How many spells can I prepare at level 5?', 'Prepared spells by level', 'Wizard spell slots', 'How many spell slots do I have?', 'Wizard cantrips by level', 'How many cantrips per level?', 'How many cantrips do I know?', 'Spells known by level'],
    answer: 'For the 2024 Wizard, keep spellbook entries, prepared spells, cantrips and spell slots separate. The Wizard level table lists all four for levels 1–20. For example, Wizard 5 has a 14-spell ordinary book minimum, 9 ordinary preparations, 4 cantrips and 4 first-level, 3 second-level and 2 third-level slots. Copies, subclass additions, always-prepared grants and other-class spells require separate accounting; use Wizard class level, not automatically total character level.',
    url: '/library/character/level-progression-planner/#wizard-level-table',
    links: [{label: 'Level-up guide', url: '/level-up/'}, {label: 'Subclass additions and preparations', url: '/library/character/spell-progression-hub/#how-to-read-a-level'}, {label: 'Multiclass differences', url: '/library/character/level-progression-planner/#multiclass-distinction'}],
  },
  {
    id: 'level-up-spells', title: 'Which spells should I take when I level up?', section: 'character',
    questions: ['I levelled up which spells should I take?', 'I leveled up what spells do I learn?', 'What spells should I choose at my next level?', 'Level up spell choices', 'Wizard spell progression', 'Which spells to learn next', 'Exact spell picks for my build'],
    answer: 'The Spell Progression Hub provides self-contained no-copy acquisition routes for the seven supported subclasses and their pure, Artificer, Cleric and Fighter plans. Choose your route, then read its next acquisition row. Normal book choices, extra book spells and always-prepared grants are separate columns; do not combine multiple acquisition presets.',
    url: '/library/character/spell-progression-hub/#pick-your-route',
    links: [{label: 'Level-up guide', url: '/level-up/'}, {label: 'How to read the columns', url: '/library/character/spell-progression-hub/#how-to-read-a-level'}, {label: 'Dip calendars', url: '/library/character/multiclass-spell-timing/#exact-calendars'}],
  },
  {
    id: 'subclass-extra-spells', title: 'Do subclass spells count against my normal picks?', section: 'character',
    questions: ['Do Savant spells replace my two level up spells?', 'Do subclass spells count against normal picks?', 'How many bonus spells does my subclass add?', 'Extra book spells versus always prepared spells', 'Savant spell additions', 'Are always prepared spells extra spellbook picks?'],
    answer: 'The progression tables separate Learn normally, Extra book spells and Always prepared gained. Specified subclass book additions do not replace the normal two choices. Always-prepared grants are separate feature benefits, not unrestricted extra book picks. The exact grant and its timing depend on the chosen route and source; Mastery and Signature selections reuse spells already acquired.',
    url: '/library/character/spell-progression-hub/#how-to-read-a-level',
    links: [{label: 'All supported routes', url: '/library/character/spell-progression-hub/#pick-your-route'}, {label: 'Adept timing', url: '/library/character/multiclass-spell-timing/#adept-feats-need-their-own-timing'}],
  },
  {
    id: 'multiclass-spells', title: 'Do higher multiclass slots unlock higher Wizard spells?', section: 'character',
    questions: ['Do higher multiclass slots unlock higher Wizard spells?', 'Can I learn Fireball with Artificer 1 Wizard 4?', 'Multiclass slots versus spells prepared', 'Wizard level versus character level', 'Do class dips change spell counts?', 'Artificer Cleric Fighter spell timing'],
    answer: 'Keep character level, Wizard level, combined spellcaster level and highest preparable Wizard spell level separate. Higher shared slots do not unlock higher-level Wizard preparations or copying early. The printed character-level calendars show which Wizard row applies; each class prepares its own spells separately.',
    url: '/library/character/level-progression-planner/#multiclass-distinction',
    links: [{label: 'Exact calendars', url: '/library/character/multiclass-spell-timing/#exact-calendars'}, {label: 'Separate dip spells and slot contribution', url: '/library/character/multiclass-spell-timing/#what-remains-separate'}],
  },
  {
    id: 'book-versus-prepared', title: 'Can I prepare every spell in my spellbook?', section: 'advanced',
    questions: ['Can I prepare every spell in my spellbook?', 'Are all known spells prepared?', 'Spellbook versus prepared spells', 'Do rituals need to be prepared?', 'Do I need to prepare every spell I know?'],
    answer: 'Owning a spell in the book is different from preparing it for today. The prepared list answers today’s needs; the book preserves wider options. Count ordinary preparations against the Wizard level table. Ritual Adept can make qualifying book rituals available without ordinary preparation, but ritual time, reading the book and components still matter.',
    url: '/library/advanced/spellbook-redundancy-acquisition/#core-principle',
    links: [{label: 'Preparation limit', url: '/library/character/level-progression-planner/#wizard-level-table'}, {label: 'Ritual Adept and the book', url: '/library/advanced/spellbook-stuff/#spellbook-basics'}],
  },
  {
    id: 'copy-spells', title: 'How much does copying a spell cost?', section: 'advanced',
    questions: ['How much does copying a spell cost?', 'How long does copying spells take?', 'How do I copy spells into my spellbook?', 'Copy spell gold cost', 'Can I copy any spell into my spellbook?', 'Learning spells from another spellbook', 'Spell transcription cost'],
    answer: 'The compendium’s 2024 baseline lists 2 hours and 50 GP per spell level for normal copying. The spell must be a Wizard spell of a level you can prepare. Copying your own recorded spells uses a different backup cost; copying from a scroll also has its own check and destruction rule.',
    url: '/library/advanced/spellbook-stuff/#copying-spells-into-the-spellbook',
    links: [{label: 'Copying cost table', url: '/library/advanced/spellbook-stuff/#copying-cost'}, {label: 'Your own spells', url: '/library/advanced/spellbook-stuff/#copying-your-own-spell'}, {label: 'Scroll copying', url: '/library/advanced/spellbook-stuff/#copying-from-a-spell-scroll'}],
  },
  {
    id: 'copy-scroll', title: 'Can I copy a scroll and then cast it?', section: 'advanced',
    questions: ['Can I copy a scroll and then cast it?', 'Is a scroll destroyed when copying fails?', 'Spell scroll copying check', 'Spell scroll copying cost', 'Copying a spell scroll into my spellbook', 'Arcana DC for copying scrolls'],
    answer: 'Copying a Wizard spell from a scroll uses the normal 2 hours and 50 GP per spell level, plus an Intelligence (Arcana) check with DC 10 + spell level. The scroll is destroyed after the attempt whether it succeeds or fails, so that same scroll cannot then be cast. Copying another spellbook does not have this scroll-specific destruction rule.',
    url: '/library/advanced/spellbook-stuff/#copying-from-a-spell-scroll',
    links: [{label: 'Scroll copy DC table', url: '/library/advanced/spellbook-stuff/#scroll-copy-dc'}, {label: 'Copying time and cost', url: '/library/advanced/spellbook-stuff/#copying-cost'}],
  },
  {
    id: 'lost-spellbook', title: 'What happens if I lose my spellbook?', section: 'advanced',
    questions: ['What happens if I lose my spellbook?', 'Can I cast without my spellbook?', 'My spellbook was stolen', 'Recover a destroyed spellbook', 'Lost spellbook prepared spells'],
    answer: 'Losing the book does not erase the prepared list: those spells can still be cast if their other requirements are met. The missing formulas cannot freely replace preparations, and Ritual Adept needs a readable book. The compendium explains reproducing currently prepared spells in a new book and the cheaper own-spell backup costs.',
    url: '/library/advanced/spellbook-stuff/#replacing-a-spellbook',
    links: [{label: 'Recovery plan', url: '/library/advanced/spellbook-redundancy-acquisition/#recovery-after-loss'}, {label: 'Backup cost', url: '/library/advanced/spellbook-stuff/#copying-your-own-spell'}],
  },
  {
    id: 'ritual-casting', title: 'Can I cast book rituals without preparing them?', section: 'advanced',
    questions: ['Can I cast book rituals without preparing them?', 'Can I cast rituals without preparing them?', 'How does Ritual Adept work?', 'Ritual casting without preparation', 'Do rituals consume daily preparation?', 'Do rituals need my spellbook?'],
    answer: 'Ritual Adept permits qualifying Ritual spells in your spellbook without preparation, but you must read from the book. Ritual casting does not remove time or material requirements. A casting time of 1 minute or longer requires Concentration during the casting even when the finished spell does not.',
    url: '/library/advanced/spellbook-stuff/#spellbook-basics',
    links: [{label: 'Long casting times', url: '/library/reference/spellcasting-rules/#longer-casting-times'}],
  },
  {
    id: 'concentration-one', title: 'Can I concentrate on two spells at once?', section: 'reference',
    questions: ['Can I concentrate on two spells at once?', 'Can I cast two concentration spells?', 'How many concentration spells can I maintain?', 'Does casting another concentration spell end the first?', 'Two concentration effects', 'Concentration'],
    answer: 'A creature normally concentrates on only one spell or effect. Starting another Concentration spell or effect ends the old Concentration immediately, not when the new casting finishes. The linked reference lists other ways Concentration ends and specific feature exceptions; damage protection is not permission for two simultaneous effects.',
    url: '/library/reference/concentration/#concentration-ends-when',
    links: [{label: 'Specific feature exceptions', url: '/library/reference/concentration/#specific-feature-exceptions'}],
  },
  {
    id: 'concentration-damage', title: 'What is the Concentration save DC after damage?', section: 'reference',
    questions: ['What is the concentration save DC after damage?', 'How do concentration checks work?', 'Concentration saving throw', 'Damage concentration DC', 'Do separate damage sources cause separate saves?'],
    answer: 'The baseline in the compendium is a Constitution saving throw: DC 10 or half the damage taken, rounded down, whichever is higher, capped at DC 30. Separate damage sources can cause separate checks. Explicit feature protections may change whether damage breaks Concentration, so check those exceptions rather than applying this baseline universally.',
    url: '/library/reference/concentration/#damage-check',
    links: [{label: 'Feature exceptions', url: '/library/reference/concentration/#specific-feature-exceptions'}],
  },
  {
    id: 'concentration-protection', title: 'How can I protect Concentration?', section: 'reference',
    questions: ['How can I protect concentration?', 'How do I protect concentration?', 'How do I stop losing concentration?', 'Keep concentration while taking damage', 'Concentration protection War Caster', 'Focused Conjuration Iron Mind exceptions'],
    answer: 'The reference lists Constitution save proficiency, War Caster, Bladesong, Constitution, cover, range, defensive spells and avoiding damage as protection options. It separately explains the narrower protections from Focused Conjuration and Boon of the Iron Mind. Use their actual scope; they do not make every Concentration spell unbreakable.',
    url: '/library/reference/concentration/#common-concentration-protection',
    links: [{label: 'Exact feature exceptions', url: '/library/reference/concentration/#specific-feature-exceptions'}],
  },
  {
    id: 'counterspell', title: 'How does 2024 Counterspell work?', section: 'spells',
    questions: ['How does 2024 Counterspell work?', 'Counterspell', 'Does Counterspell automatically stop low level spells?', 'What save does Counterspell use?', 'Can I Counterspell without seeing the caster?', 'Does Counterspell waste the enemy spell slot?'],
    answer: 'The 2024 card requires your Reaction to visible casting within 60 feet with a Verbal, Somatic or Material component. The caster makes a Constitution save; failure wastes the casting action but not an expended spell slot. It is not an automatic interruption of low-level spells. Confirm the trigger, range, sight and available Reaction.',
    url: '/library/spells/spell-cards/counterspell-spell/#rules-that-decide-the-play',
    links: [{label: 'Countering spellcasters', url: '/library/tactics/countering-spellcasters/#3-counterspell'}],
  },
  {
    id: 'one-slot-turn', title: 'Can I cast two slotted spells on the same turn?', section: 'reference',
    questions: ['Can I cast two spells on one turn?', 'Can I cast Misty Step and Fireball on the same turn?', 'Bonus action spell and action spell', 'One spell slot per turn', 'Can I cast Shield on another creature’s turn?'],
    answer: 'The compendium’s 2024 rule is one spell slot expended to cast a spell per turn, not one spell per turn or one slot per round. Slotted Misty Step can pair with an Action cantrip, but not a slotted Fireball that turn. Slotless casting still needs its action and other requirements; a later creature’s turn can have a separate slotted Reaction if it remains available.',
    url: '/library/reference/spellcasting-rules/#one-spell-slot-per-turn',
    links: [{label: 'Action and Reaction timing', url: '/library/reference/action-economy/#timing-reminders'}],
  },
  {
    id: 'ready-spell', title: 'What does readying a spell cost?', section: 'reference',
    questions: ['What does readying a spell cost?', 'Does a readied spell require concentration?', 'Can I ready Fireball while concentrating on Web?', 'Ready a spell then release it later', 'Readied spell reaction'],
    answer: 'A readied spell normally needs an Action casting time. You cast and spend its resources when you Ready it, hold it with Concentration and use a Reaction to release it. Under normal Concentration rules, holding it ends an existing Concentration effect. Losing Concentration or not releasing it in time wastes the resources.',
    url: '/library/reference/action-economy/#ready',
    links: [{label: 'Concentration baseline and exceptions', url: '/library/reference/concentration/#concentration-ends-when'}],
  },
  {
    id: 'grappled-restrained', title: 'Is Grappled the same as Restrained?', section: 'reference',
    questions: ['Is Grappled the same as Restrained?', 'Grappled versus Restrained', 'Does grapple give advantage on attacks?', 'Do conditions affect saving throws?', 'Prone melee ranged attack advantage'],
    answer: 'Grappled is not Restrained: it does not itself grant incoming attack Advantage or penalize Dexterity saves. The condition quick reference separates each condition’s effects. Prone’s attack modifiers and Paralyzed/Unconscious critical hits depend on the stated 5-foot distance, not simply a melee/ranged label. Check the originating effect for additional restrictions and removal.',
    url: '/library/reference/condition-quick-reference/#common-tactical-mistakes',
  },
  {
    id: 'incapacitated-concentration', title: 'Does Incapacitated end Concentration?', section: 'reference',
    questions: ['Does Incapacitated end concentration?', 'Does being stunned break concentration?', 'Does paralyzed break concentration?', 'Does sleep end concentration?'],
    answer: 'The baseline ends Concentration when you become Incapacitated; normal Unconscious includes that condition. Explicit feature exceptions can protect particular causes, so use the linked exception text. Preserving Concentration does not restore actions, speech or other abilities removed by the condition.',
    url: '/library/reference/concentration/#specific-feature-exceptions',
    links: [{label: 'Condition consequences', url: '/library/reference/condition-quick-reference/#common-tactical-mistakes'}],
  },
  {
    id: 'focus-components', title: 'Does a focus replace every component?', section: 'reference',
    questions: ['Does a focus replace every component?', 'Can I cast with a shield and wand?', 'Somatic components with no free hand', 'Do I still need expensive material components?', 'Spell focus versus costly components'],
    answer: 'A valid focus or component pouch replaces many ordinary Material components, not listed-cost or consumed components. With both Somatic and Material components, the material hand can normally gesture. For a Somatic spell without Material components, simply holding a focus does not supply a free gesturing hand; class-specific focus validity and explicit features still matter.',
    url: '/library/reference/spellcasting-rules/#somatic--material',
    links: [{label: 'Costly components', url: '/library/reference/spellcasting-rules/#costly-components'}],
  },
  {
    id: 'legendary-resistance', title: 'How do I deal with Legendary Resistance?', section: 'reference',
    questions: ['How do I deal with Legendary Resistance?', 'How do I beat a boss with Legendary Resistance?', 'Should I burn Legendary Resistance?', 'Boss saving throw resistance', 'Legendary Resistance strategy'],
    answer: 'The source offers three plans: bypass the key save, coordinate meaningful saves to burn resistance intentionally, or handle the supporting enemies first. A trivial failed save does not force the boss to spend resistance, and the stat block determines its actual uses. Check immunity, targeting restrictions and whether your party can carry out the plan before spending a premium slot.',
    url: '/library/reference/legendary-resistance-bosses/#boss-checklist',
    links: [{label: 'Bypass strategy', url: '/library/reference/legendary-resistance-bosses/#strategy-1--bypass-it'}, {label: 'Coordinated burn strategy', url: '/library/reference/legendary-resistance-bosses/#strategy-2--burn-it-intentionally'}],
  },
  {
    id: 'form-candidates', title: 'Which creatures can I use for Polymorph or Shapechange?', section: 'creatures',
    questions: ['Which creatures can I use for Polymorph?', 'What can I turn into with Shapechange?', 'Find Polymorph and Shapechange candidates', 'Legal transformation forms', 'Which creature forms are eligible?'],
    answer: 'Choose the spell and mode before the creature. The Form Legality Guide distinguishes their type, CR, seen-form and practical restrictions. Form Finder’s candidate-route filters show checked flags only; gallery placement and transcribed stats do not grant eligibility. Check the exact edition, full stat block and remaining spell requirements before relying on a candidate.',
    url: '/library/creatures/form-legality-guide/#rules-version-matters',
    links: [{label: 'Polymorph candidate filter', url: '/forms/?route=polymorph'}, {label: 'Shapechange candidate filter', url: '/forms/?route=shapechange'}, {label: 'Catalogue checks', url: '/library/creatures/form-legality-guide/#using-the-catalogue'}],
  },
  {
    id: 'no-concentration-spells', title: 'Find spells that do not require Concentration', section: 'tactics',
    questions: ['Spells that do not require concentration', 'Spells without concentration', 'Spells that don’t require concentration', 'No concentration spells', 'Non-concentration spells', 'What can I cast while concentrating on another spell?', 'Follow up spells after control lands'],
    answer: 'Use the explicit No concentration filter in Spell Finder, not full-text mentions of Concentration. The source recommends non-Concentration follow-ups, cantrips, Dodge, positioning and protecting allies after control lands. The filter describes the recorded base casting; individual upcasting exceptions, actions and other requirements still need the spell card.',
    url: '/library/tactics/concentration-strategy/#after-control-lands',
    links: [{label: 'Open No concentration filter', url: '/spells/?focus=no-concentration'}, {label: 'Concentration replacement rules', url: '/library/reference/concentration/#concentration-ends-when'}],
  },
  {
    id: 'spellbook-backup', title: 'How do I protect my spellbook with backups?', section: 'advanced',
    questions: ['How do I protect my spellbook?', 'How much does a backup spellbook cost?', 'Copy my own spells into a backup', 'Spellbook backup protection', 'Protect against losing my spellbook'],
    answer: 'The source distinguishes copying your own recorded spell from normal copying: 1 hour and 10 GP per spell level. This makes backup spellbooks possible. A backup and a recovery plan protect acquired formulas; losing the primary book does not itself erase currently prepared spells, but it limits replacement and book-based ritual access.',
    url: '/library/advanced/spellbook-stuff/#copying-your-own-spell',
    links: [{label: 'Backup cost table', url: '/library/advanced/spellbook-stuff/#backup-spellbook-cost'}, {label: 'Recovery after loss', url: '/library/advanced/spellbook-stuff/#replacing-a-spellbook'}],
  },
  {
    id: 'component-budget', title: 'How do I budget costly spell components?', section: 'advanced',
    questions: ['How do I budget costly spell components?', 'What material components should I buy?', 'Component shopping list', 'Calculate component cost for spells', 'Consumed versus reusable components'],
    answer: 'Separate consumed materials from reusable sets and special replacement or activation costs. The source prioritizes components for spells you expect to cast, then reusable value and mission needs. Wizard Tools builds a shopping list from recorded spell cards; it does not grant access, supply shop stock or make distinct same-price components interchangeable. Verify the active spell entry before spending.',
    url: '/library/advanced/expensive-components/#buying-priority',
    links: [{label: 'Component shopping calculator', url: '/tools/#component-cost'}, {label: 'Recorded component table', url: '/library/advanced/expensive-components/#important-wizard-components'}],
  },
];

const indexed = questionAnswers.map(answer => ({answer, phrases: answer.questions.map(normalizeSearch),
  terms: answer.questions.map(question => new Set(searchTerms(question))),
  allTerms: new Set(answer.questions.flatMap(searchTerms))}));
const wizardSpecific = new Set(['spell-counts','level-up-spells','subclass-extra-spells','book-versus-prepared','copy-spells','copy-scroll','lost-spellbook','ritual-casting']);
const otherClass = /\b(?:artificer|cleric|fighter|sorcerer|bard|druid|warlock|paladin|ranger)s?\b/;
const negations = new Set(['not','no','without','cannot','cant','dont','doesnt']);

export function findQuestionAnswers(query: string, section = ''): QuestionAnswer[] {
  const phrase = normalizeSearch(query);
  const terms = searchTerms(query).filter(term => !/^\d+$/.test(term));
  // These curated rules summaries use the current 2024 references. Legacy
  // questions retain ordinary source search, rather than receiving a 2024 answer.
  if (!phrase || !terms.length || /\b2014\b/.test(phrase)) return [];
  const negativeConcentration = terms.some(term => negations.has(term) || term === 'non');
  const followUpConcentration = /\bwhile\b.*\b(?:concentrating|concentration)\b/.test(phrase) || /\b(?:follow up|control lands)\b/.test(phrase);
  const candidates = indexed.filter(row => (!section || row.answer.section === section) &&
    !(wizardSpecific.has(row.answer.id)&&otherClass.test(phrase)) &&
    (row.answer.id !== 'no-concentration-spells' || negativeConcentration || followUpConcentration) &&
    (row.answer.id !== 'ready-spell' || /\b(?:ready|readied|readying)\b/.test(phrase))).map(row => {
    const exact = row.phrases.includes(phrase);
    const scores = row.terms.map(variant => {
      if(terms.some(term=>negations.has(term)&&!variant.has(term)))return 0;
      const hits = terms.filter(term => variant.has(term)).length;
      const coverage = hits / terms.length;
      if (coverage < .8 || hits < 2 || hits / variant.size < .6) return 0;
      return coverage * 100 + hits * 8 - Math.max(0, variant.size - hits) * 3;
    });
    const unionHits=terms.filter(term=>row.allTerms.has(term)).length;
    // Do not combine positive and negative variants into one invented intent.
    const unionScore=terms.length>=3&&!terms.some(term=>negations.has(term))&&unionHits===terms.length?70+unionHits*5:0;
    return {answer: row.answer, score: exact ? 1000 : terms.length < 2 ? 0 : Math.max(unionScore, ...scores)};
  }).filter(row => row.score > 0).sort((a, b) => b.score - a.score);
  const seen = new Set<string>();
  return candidates.filter(row => {
    if (seen.has(row.answer.url)) return false;
    seen.add(row.answer.url); return true;
  }).slice(0, 3).map(row => row.answer);
}
