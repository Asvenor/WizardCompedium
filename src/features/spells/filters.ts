import { normalizeSearch } from '@/lib/spells';
import { loadWizardProfile } from '@/features/my-wizard/profile';
const toolbar = document.querySelector<HTMLElement>('[data-spell-toolbar]');
if (toolbar) {
  const cards = [
    ...document.querySelectorAll<HTMLElement>('[data-spell-card]'),
  ];
  const input = toolbar.querySelector<HTMLInputElement>('[data-spell-search]')!;
  const filters = [
    ...toolbar.querySelectorAll<HTMLSelectElement>('[data-filter]'),
  ];
  const readUrl = () => {
    const params = new URLSearchParams(location.search);
    input.value = params.get('q') ?? '';
    for (const select of filters)
      select.value = params.get(select.dataset.filter!) ?? '';
  };
  const update = () => {
    const profile = loadWizardProfile();
    let count = 0;
    const terms = normalizeSearch(input.value).split(' ').filter(Boolean);
    for (const card of cards) {
      const matches =
        terms.every((term) => card.dataset.search?.includes(term)) &&
        filters.every((select) => {
          if (!select.value) return true;
          const key = select.dataset.filter!;
          if (key === 'personal')
            return (
              (select.value === 'prepared'
                ? profile?.preparedSpells
                : profile?.ownedSpells
              )?.includes(card.dataset.id!) ?? false
            );
          const value =
            card.dataset[
              key.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())
            ] ?? '';
          return ['role-category', 'damage', 'build', 'action'].includes(key)
            ? value
                .toLowerCase()
                .split(' ')
                .includes(select.value.toLowerCase())
            : value.toLowerCase() === select.value.toLowerCase();
        });
      card.hidden = !matches;
      if (matches) count++;
    }
    document.querySelector('[data-spell-count]')!.textContent = String(count);
    document.querySelector<HTMLElement>('[data-spell-empty]')!.hidden =
      count !== 0;
    const url = new URL(location.href);
    url.search = '';
    if (input.value.trim()) url.searchParams.set('q', input.value.trim());
    for (const select of filters)
      if (select.value)
        url.searchParams.set(select.dataset.filter!, select.value);
    history.replaceState({}, '', url);
  };
  readUrl();
  if (filters.some((s) => s.value && s.closest('details')))
    toolbar.querySelector('details')?.setAttribute('open', '');
  input.addEventListener('input', update);
  filters.forEach((s) => s.addEventListener('change', update));
  toolbar
    .querySelector('[data-clear-filters]')
    ?.addEventListener('click', () => {
      input.value = '';
      filters.forEach((s) => (s.value = ''));
      update();
    });
  window.addEventListener('popstate', () => {
    readUrl();
    update();
  });
  update();
}
