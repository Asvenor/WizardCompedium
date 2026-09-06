import { readNumber, probabilityToMeet } from './math';
import { loadWizardProfile } from '@/features/my-wizard/profile';
import { loadSession } from '@/features/my-wizard/session';
const dc = document.querySelector<HTMLInputElement>('[data-defense-dc]');
if (dc) {
  const profile = loadWizardProfile();
  if (profile?.spellSaveDc) dc.value = String(profile.spellSaveDc);
  const inputs = [
    ...document.querySelectorAll<HTMLInputElement>('[data-defense]'),
  ];
  const update = () => {
    const d = readNumber(dc.value, 1, 40);
    for (const input of inputs) {
      const bonus = readNumber(input.value, -10, 30);
      const output = document.querySelector(
        `[data-defense-result="${input.dataset.defense}"]`,
      )!;
      output.textContent =
        d == null
          ? 'Enter a valid DC'
          : bonus == null
            ? 'Unknown'
            : `Fail ${Math.round((1 - probabilityToMeet(d, bonus)) * 100)}% · Succeed ${Math.round(probabilityToMeet(d, bonus) * 100)}%`;
    }
  };
  [dc, ...inputs].forEach((i) => i.addEventListener('input', update));
  update();
}
const damage = document.querySelector('[data-expected-damage]');
if (damage) {
  const inputs = [...damage.querySelectorAll<HTMLInputElement>('input')];
  const update = () => {
    const values = inputs.map((i) => (i.value === '' ? NaN : Number(i.value)));
    const valid =
      values.every((n) => Number.isFinite(n) && n >= 0) && values[2] <= 100;
    damage.querySelector('[data-expected-result]')!.textContent = valid
      ? `Expected damage: ${((values[0] * values[2]) / 100 + values[1] * (1 - values[2] / 100)).toFixed(2)}`
      : 'Enter non-negative damage and a probability from 0 to 100%.';
  };
  inputs.forEach((i) => i.addEventListener('input', update));
  update();
}
const componentChecks = [
  ...document.querySelectorAll<HTMLInputElement>('[data-component-spell]'),
];
function importComponents(kind: string) {
  const profile = loadWizardProfile();
  const session = loadSession();
  const ids =
    kind === 'prepared'
      ? (profile?.preparedSpells ?? [])
      : kind === 'owned'
        ? (profile?.ownedSpells ?? [])
        : Object.entries(session.spellStatus)
            .filter(([, value]) => value === 'wanted' || value === 'copy')
            .map(([id]) => id);
  for (const check of componentChecks)
    check.checked = ids.includes(check.value);
  componentChecks[0]?.dispatchEvent(new Event('change', { bubbles: true }));
  const known = componentChecks.filter((c) => c.checked).length;
  const status = document.querySelector('[data-component-import-status]');
  if (status)
    status.textContent = `${known} spells with recorded component information selected from ${ids.length} ${kind} spells. ${ids.length - known} have no priced/described component record here; this is not proof that they require no components.`;
}
document
  .querySelectorAll<HTMLElement>('[data-component-import]')
  .forEach((button) =>
    button.addEventListener('click', () =>
      importComponents(button.dataset.componentImport!),
    ),
  );
const initial = new URLSearchParams(location.search).get('components');
if (initial && ['prepared', 'owned', 'planned'].includes(initial))
  importComponents(initial);
