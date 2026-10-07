/** Copy only on an explicit click; a blocked clipboard is a recoverable UI state. */
export async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch { /* The caller displays a selectable URL if access is blocked. */ }
  return false;
}
