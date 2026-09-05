import { componentTotals, readNumber } from './math';

interface ComponentItem { description: string | null; gpCost: number | null; consumed: boolean | null; }
interface ComponentSpell extends ComponentItem { id: string; name: string; note?: string; items?: ComponentItem[]; }
interface Entry { cost: string; consumption: string; quantity: string; }

const root = document.querySelector<HTMLElement>('[data-component-calculator]');
const data = document.querySelector<HTMLScriptElement>('#component-spells-data');
if (root && data) {
  const spells: ComponentSpell[] = JSON.parse(data.textContent ?? '[]');
  const checks = [...root.querySelectorAll<HTMLInputElement>('[data-component-spell]')];
  const output = root.querySelector<HTMLElement>('[data-component-output]')!;
  const note = root.querySelector<HTMLElement>('[data-component-note]')!;
  const state = new Map<string, Entry>();
  const format = (value: number) => `${value.toLocaleString(undefined, { maximumFractionDigits: 2 })} gp`;
  const selectedItems = () => spells.filter(spell => checks.some(check => check.checked && check.value === spell.id))
    .flatMap(spell => (spell.items ?? [spell]).map((item, index) => ({ ...item, spell, key: `${spell.id}-${index}` })));
  const entryFor = (key: string, item: ComponentItem) => {
    if (!state.has(key)) state.set(key, { cost: item.gpCost == null ? '' : String(item.gpCost), consumption: item.consumed == null ? '' : String(item.consumed), quantity: '1' });
    return state.get(key)!;
  };
  const calculate = () => {
    const items = selectedItems();
    const totals = componentTotals(items.map(item => {
      const entry = entryFor(item.key, item);
      return { gpCost: readNumber(entry.cost, 0, 1e9, false), consumed: entry.consumption === '' ? null : entry.consumption === 'true', quantity: readNumber(entry.quantity, 1, 999) };
    }));
    root.querySelector<HTMLElement>('[data-consumed-total]')!.textContent = format(totals.consumed);
    root.querySelector<HTMLElement>('[data-required-total]')!.textContent = format(totals.required);
    note.textContent = !items.length ? 'Choose a spell to see its components.' : totals.incomplete
      ? `Partial totals: ${totals.incomplete} component row${totals.incomplete === 1 ? ' needs' : 's need'} a valid price, consumption choice, or quantity. Fill in the highlighted fields to include them.`
      : 'Totals include every selected component. Reusable quantities count sets to obtain, not number of casts.';
    note.classList.toggle('planner-warning', totals.incomplete > 0);
  };
  const render = () => {
    const items = selectedItems();
    output.replaceChildren();
    output.hidden = items.length === 0;
    root.querySelector<HTMLButtonElement>('[data-clear-components]')!.disabled = items.length === 0;
    if (!items.length) { calculate(); return; }
    const table = document.createElement('table');
    const caption = table.createCaption(); caption.className = 'sr-only'; caption.textContent = 'Selected spell components and quantities';
    const head = table.createTHead().insertRow();
    for (const title of ['Spell / component', 'Price per set (gp)', 'Consumed?', 'Sets needed']) {
      const cell = document.createElement('th'); cell.scope = 'col'; cell.textContent = title; head.append(cell);
    }
    const body = table.createTBody();
    for (const item of items) {
      const entry = entryFor(item.key, item);
      const row = body.insertRow();
      const label = `${item.spell.name}${item.spell.items ? ` — ${item.description}` : ''}`;
      const name = document.createElement('th'); name.scope = 'row';
      const link = document.createElement('a'); link.href = `/spells/${item.spell.id}/`; link.textContent = item.spell.name; name.append(link);
      const description = document.createElement('p'); description.textContent = item.description ?? 'Component details not recorded.'; name.append(description);
      if (item.spell.note || item.spell.items) { const help = document.createElement('small'); help.textContent = item.spell.note ?? item.spell.description; name.append(help); }
      row.append(name);
      const costCell = row.insertCell();
      if (item.gpCost != null) costCell.textContent = format(item.gpCost);
      else {
        const cost = document.createElement('input'); cost.className = 'quantity-field component-price'; cost.type = 'number'; cost.min = '0'; cost.max = '1000000000'; cost.step = '0.01'; cost.placeholder = 'Enter price'; cost.value = entry.cost; cost.required = true; cost.setAttribute('aria-label', `${label} price in gp`);
        cost.addEventListener('input', () => { entry.cost = cost.value; cost.setAttribute('aria-invalid', String(readNumber(cost.value, 0, 1e9, false) == null)); calculate(); });
        costCell.append(cost); const help = document.createElement('small'); help.textContent = 'Use your active spell entry.'; costCell.append(help);
      }
      const consumptionCell = row.insertCell();
      if (item.consumed != null) consumptionCell.textContent = item.consumed ? 'Yes' : 'No';
      else {
        const select = document.createElement('select'); select.className = 'field'; select.required = true; select.setAttribute('aria-label', `${label} consumed`);
        for (const [value, text] of [['', 'Choose…'], ['true', 'Yes'], ['false', 'No']]) select.add(new Option(text, value));
        select.value = entry.consumption; select.addEventListener('change', () => { entry.consumption = select.value; calculate(); }); consumptionCell.append(select);
      }
      const quantityCell = row.insertCell();
      const quantity = document.createElement('input'); quantity.className = 'quantity-field'; quantity.type = 'number'; quantity.min = '1'; quantity.max = '999'; quantity.step = '1'; quantity.required = true; quantity.value = entry.quantity; quantity.setAttribute('aria-label', `${label} sets needed`);
      quantity.addEventListener('input', () => { entry.quantity = quantity.value; quantity.setAttribute('aria-invalid', String(readNumber(quantity.value, 1, 999) == null)); calculate(); }); quantityCell.append(quantity);
    }
    output.append(table); calculate();
  };
  checks.forEach(check => check.addEventListener('change', render));
  root.querySelector('[data-clear-components]')?.addEventListener('click', () => { checks.forEach(check => { check.checked = false; }); state.clear(); render(); });
  render();
}
