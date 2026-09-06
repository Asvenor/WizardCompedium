import { loadSession, changeSession } from '@/features/my-wizard/session';
interface Card {
  id: string;
  deck: string;
  question: string;
  answer: string;
  href: string;
  level?: number;
  source?: string;
  categories?: string[];
}
const cards: Card[] = JSON.parse(
  document.querySelector('#practice-cards')?.textContent ?? '[]',
);
const root = document.querySelector<HTMLElement>('[data-practice]');
if (root) {
  const deck = root.querySelector<HTMLSelectElement>('[data-practice-deck]')!;
  const question = root.querySelector('[data-practice-question]')!;
  const answer = root.querySelector<HTMLElement>('[data-practice-answer]')!;
  const grades = [
    ...root.querySelectorAll<HTMLButtonElement>('[data-practice-grade]'),
  ];
  const status = root.querySelector('[data-practice-progress]')!;
  let queue: Card[] = [];
  let index = 0;
  let revealed = false;
  function chooseDeck() {
    const reviews = loadSession().reviews;
    queue = cards
      .filter(
        (c) =>
          !deck.value ||
          c.deck === deck.value ||
          (c.level != null && deck.value === 'level-' + c.level) ||
          (deck.value === 'core-spells' && c.source?.startsWith('Core')) ||
          (deck.value === 'dunamancy-spells' && c.source === 'Dunamancy') ||
          (deck.value === 'control-spells' &&
            c.categories?.includes('control')) ||
          (deck.value === 'defense-spells' &&
            c.categories?.includes('defense')),
      )
      .sort((a, b) => {
        const x = reviews[a.id],
          y = reviews[b.id];
        if (!x || !y) return Number(!!x) - Number(!!y);
        return (
          y.incorrect - y.correct - (x.incorrect - x.correct) || x.last - y.last
        );
      });
    index = 0;
    render();
  }
  function render() {
    const card = queue[index];
    revealed = false;
    answer.hidden = true;
    grades.forEach((b) => (b.disabled = true));
    root!
      .querySelectorAll<HTMLButtonElement>(
        '[data-practice-reveal],[data-practice-next]',
      )
      .forEach((b) => (b.disabled = !card));
    if (!card) {
      question.textContent = 'No cards in this deck.';
      return;
    }
    question.textContent = card.question;
    root!.querySelector('[data-practice-copy]')!.textContent = card.answer;
    (root!.querySelector('[data-practice-source]') as HTMLAnchorElement).href =
      card.href;
    status.textContent = `${card.deck} · ${index + 1} / ${queue.length}`;
    const review = loadSession().reviews[card.id];
    root!.querySelector('[data-practice-history]')!.textContent = review
      ? `Seen ${review.seen} · Got it ${review.correct} · Review again ${review.incorrect} · Last reviewed ${new Date(review.last).toLocaleDateString()}`
      : 'Not reviewed yet.';
  }
  root
    .querySelector('[data-practice-reveal]')
    ?.addEventListener('click', () => {
      const card = queue[index];
      if (!card) return;
      answer.hidden = false;
      grades.forEach((b) => (b.disabled = false));
      if (!revealed) {
        revealed = true;
        const ok = changeSession((s) => {
          const review = s.reviews[card.id] ?? {
            seen: 0,
            correct: 0,
            incorrect: 0,
            last: 0,
          };
          review.seen++;
          review.last = Date.now();
          s.reviews[card.id] = review;
        });
        if (!ok)
          status.textContent =
            'Storage unavailable; practice works but review history will not persist.';
      }
    });
  grades.forEach((button) =>
    button.addEventListener('click', () => {
      if (!revealed) return;
      const card = queue[index];
      const ok = changeSession((s) => {
        const review = s.reviews[card.id] ?? {
          seen: 1,
          correct: 0,
          incorrect: 0,
          last: Date.now(),
        };
        if (button.dataset.practiceGrade === 'correct') review.correct++;
        else review.incorrect++;
        s.reviews[card.id] = review;
      });
      index = (index + 1) % queue.length;
      render();
      if (!ok) status.textContent = 'Review could not be saved.';
    }),
  );
  root.querySelector('[data-practice-next]')?.addEventListener('click', () => {
    index = (index + 1) % queue.length;
    render();
  });
  deck.addEventListener('change', chooseDeck);
  chooseDeck();
}
