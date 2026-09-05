export const WIZARD_PROFILE_KEY = 'wizard-compendium-profile-v1';

export interface WizardProfile {
  name: string;
  build: 'CORE' | 'CHRON' | 'DIV' | 'ILL' | 'BLADE' | 'TANK' | 'FIGHTER';
  characterLevel: number;
  wizardLevel: number;
  intelligence: number | null;
  spellSaveDc: number | null;
  spellAttackBonus: number | null;
  ownedSpells: string[];
  preparedSpells: string[];
}

export const defaultWizardProfile = (): WizardProfile => ({
  name: '',
  build: 'CORE',
  characterLevel: 2,
  wizardLevel: 1,
  intelligence: null,
  spellSaveDc: null,
  spellAttackBonus: null,
  ownedSpells: [],
  preparedSpells: [],
});

export const loadWizardProfile = (): WizardProfile | null => {
  try {
    const value = localStorage.getItem(WIZARD_PROFILE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null;
    const defaults = defaultWizardProfile();
    const integer = (key: string, fallback: number | null, min: number, max: number) =>
      typeof parsed[key] === 'number' && Number.isInteger(parsed[key]) && parsed[key] >= min && parsed[key] <= max ? parsed[key] : fallback;
    const characterLevel = integer('characterLevel', defaults.characterLevel, 1, 20)!;
    const spells = (key: string) => Array.isArray(parsed[key]) ? [...new Set<string>(parsed[key].filter((id: unknown) => typeof id === 'string'))] : [];
    return {
      name: typeof parsed.name === 'string' ? parsed.name : '',
      build: ['CORE','CHRON','DIV','ILL','BLADE','TANK','FIGHTER'].includes(parsed.build) ? parsed.build : 'CORE',
      characterLevel,
      wizardLevel: Math.min(characterLevel, integer('wizardLevel', defaults.wizardLevel, 0, 20)!),
      intelligence: integer('intelligence', null, 1, 30), spellSaveDc: integer('spellSaveDc', null, 1, 40),
      spellAttackBonus: integer('spellAttackBonus', null, -5, 30), ownedSpells: spells('ownedSpells'), preparedSpells: spells('preparedSpells'),
    };
  } catch {
    return null;
  }
};

export const saveWizardProfile = (profile: WizardProfile) => {
  try {
    localStorage.setItem(WIZARD_PROFILE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('wizard-profile-updated', { detail: profile }));
    return true;
  } catch { return false; }
};

export const resetWizardProfile = () => {
  try {
    localStorage.removeItem(WIZARD_PROFILE_KEY);
    window.dispatchEvent(new CustomEvent('wizard-profile-updated', { detail: null }));
    return true;
  } catch { return false; }
};
