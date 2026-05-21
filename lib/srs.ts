export interface CardState {
  id: string;
  box: number;
  due: number;
  seen: number;
  correct: number;
}

const INTERVALS_DAYS = [0, 1, 2, 4, 7, 14, 30];

export function initialCard(id: string): CardState {
  return { id, box: 0, due: 0, seen: 0, correct: 0 };
}

export function reviewCard(card: CardState, knew: boolean, now = Date.now()): CardState {
  const nextBox = knew ? Math.min(card.box + 1, INTERVALS_DAYS.length - 1) : 0;
  const days = INTERVALS_DAYS[nextBox];
  return {
    ...card,
    box: nextBox,
    due: now + days * 24 * 60 * 60 * 1000,
    seen: card.seen + 1,
    correct: card.correct + (knew ? 1 : 0),
  };
}

export function isMastered(card: CardState): boolean {
  return card.box >= 5;
}
