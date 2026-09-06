import { changeSession, loadSession } from './session';

// Used by manual planners and checklists. Saving is explicit; blanks stay unknown.
document
  .querySelectorAll<HTMLFormElement>('[data-notebook]')
  .forEach((form) => {
    const state = loadSession();
    const controls = [
      ...form.querySelectorAll<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >('[name]'),
    ];
    for (const control of controls) {
      if (control instanceof HTMLInputElement && control.type === 'checkbox')
        control.checked = state.checks[control.name] ?? false;
      else if (control instanceof HTMLInputElement && control.type === 'number')
        control.value =
          state.numbers[control.name] == null
            ? ''
            : String(state.numbers[control.name]);
      else if (state.notes[control.name] != null)
        control.value = state.notes[control.name];
    }
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const saved = changeSession((next) => {
        for (const control of controls) {
          if (
            control instanceof HTMLInputElement &&
            control.type === 'checkbox'
          )
            next.checks[control.name] = control.checked;
          else if (
            control instanceof HTMLInputElement &&
            control.type === 'number'
          ) {
            if (control.value === '') delete next.numbers[control.name];
            else next.numbers[control.name] = Number(control.value);
          } else next.notes[control.name] = control.value;
        }
      });
      const status = form.querySelector('[data-notebook-status]');
      if (status)
        status.textContent = saved
          ? 'Saved in this browser.'
          : 'Storage is unavailable. Keep this page open; changes will not persist.';
    });
  });
