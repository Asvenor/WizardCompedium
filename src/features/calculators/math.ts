export function readNumber(value: string, min: number, max: number, integer = true): number | null {
  if (value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max && (!integer || Number.isInteger(number)) ? number : null;
}

export const probabilityToMeet = (dc: number, bonus: number) => Math.min(1, Math.max(0, (21 - dc + bonus) / 20));
export const concentrationDc = (damage: number) => Math.min(30, Math.max(10, Math.floor(damage / 2)));

export function componentTotals(items: Array<{ gpCost: number | null; consumed: boolean | null; quantity: number | null }>) {
  let consumed = 0;
  let required = 0;
  let incomplete = 0;
  for (const item of items) {
    if (item.gpCost == null || item.consumed == null || item.quantity == null) { incomplete++; continue; }
    if (item.consumed) consumed += item.gpCost * item.quantity;
    else required += item.gpCost * item.quantity;
  }
  return { consumed, required, incomplete };
}
