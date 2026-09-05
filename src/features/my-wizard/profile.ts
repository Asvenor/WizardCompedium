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
    return { ...defaultWizardProfile(), ...JSON.parse(value) };
  } catch {
    return null;
  }
};

export const saveWizardProfile = (profile: WizardProfile) => {
  localStorage.setItem(WIZARD_PROFILE_KEY, JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent('wizard-profile-updated', { detail: profile }));
};

export const resetWizardProfile = () => {
  localStorage.removeItem(WIZARD_PROFILE_KEY);
  window.dispatchEvent(new CustomEvent('wizard-profile-updated', { detail: null }));
};
