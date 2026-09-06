// Small, optional session notebook. Rules and recommendations never live here.
export const SESSION_KEY = 'wizard-compendium-session-v1';
export type SpellStatus = 'wanted' | 'copy' | 'skip';
export interface SessionState {
  concentration: string;
  spellStatus: Record<string, SpellStatus>;
  pins: { title: string; url: string }[];
  checks: Record<string, boolean>;
  notes: Record<string, string>;
  numbers: Record<string, number>;
  reviews: Record<
    string,
    { seen: number; correct: number; incorrect: number; last: number }
  >;
}
export const emptySession = (): SessionState => ({
  concentration: '',
  spellStatus: {},
  pins: [],
  checks: {},
  notes: {},
  numbers: {},
  reviews: {},
});
const record = (value: unknown): value is Record<string, unknown> =>
  !!value && typeof value === 'object' && !Array.isArray(value);
export function parseSession(raw: string | null): SessionState {
  const state = emptySession();
  try {
    const value = JSON.parse(raw ?? '{}');
    if (!record(value)) return state;
    if (typeof value.concentration === 'string')
      state.concentration = value.concentration;
    for (const key of ['spellStatus', 'checks', 'notes', 'numbers'] as const) {
      if (!record(value[key])) continue;
      for (const [id, item] of Object.entries(value[key])) {
        if (['__proto__', 'constructor', 'prototype'].includes(id)) continue;
        if (
          key === 'spellStatus' &&
          ['wanted', 'copy', 'skip'].includes(String(item))
        )
          state.spellStatus[id] = item as SpellStatus;
        if (key === 'checks' && typeof item === 'boolean')
          state.checks[id] = item;
        if (key === 'notes' && typeof item === 'string')
          state.notes[id] = item.slice(0, 4000);
        if (
          key === 'numbers' &&
          typeof item === 'number' &&
          Number.isFinite(item) &&
          item >= 0
        )
          state.numbers[id] = item;
      }
    }
    if (Array.isArray(value.pins))
      state.pins = value.pins
        .filter(
          (p) =>
            record(p) &&
            typeof p.title === 'string' &&
            typeof p.url === 'string' &&
            /^\/(?!\/)[a-z0-9/#?=&%+._-]*$/i.test(p.url),
        )
        .slice(0, 100) as SessionState['pins'];
    if (record(value.reviews))
      for (const [id, review] of Object.entries(value.reviews)) {
        if (
          !record(review) ||
          ['__proto__', 'constructor', 'prototype'].includes(id)
        )
          continue;
        if (
          ['seen', 'correct', 'incorrect', 'last'].every(
            (k) =>
              typeof review[k] === 'number' &&
              Number.isFinite(review[k]) &&
              (review[k] as number) >= 0,
          )
        )
          state.reviews[id] = review as SessionState['reviews'][string];
      }
  } catch {
    /* Malformed or unavailable storage must never break the reference. */
  }
  return state;
}
export function loadSession() {
  try {
    return parseSession(localStorage.getItem(SESSION_KEY));
  } catch {
    return emptySession();
  }
}
export function saveSession(state: SessionState) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('wizard-session-updated'));
    return true;
  } catch {
    return false;
  }
}
export function changeSession(change: (state: SessionState) => void) {
  const state = loadSession();
  change(state);
  return saveSession(state);
}
export function resetSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
    window.dispatchEvent(new CustomEvent('wizard-session-updated'));
    return true;
  } catch {
    return false;
  }
}
