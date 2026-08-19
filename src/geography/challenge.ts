import { QUESTIONS, type Question } from './questions';

export interface PresentedQuestion extends Question {
  shuffled: string[];
}

function shuffle<T>(items: T[], random: () => number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export class QuestionDeck {
  private remaining: Question[] = [];

  constructor(
    private readonly bank: Question[] = QUESTIONS,
    private readonly random: () => number = Math.random,
  ) {
    this.reshuffle();
  }

  get remainingCount(): number {
    return this.remaining.length;
  }

  reshuffle(): void {
    this.remaining = shuffle(this.bank, this.random);
  }

  draw(): PresentedQuestion {
    if (this.remaining.length === 0) this.reshuffle();
    const question = this.remaining.pop()!;
    return {
      ...question,
      shuffled: shuffle([...question.choices], this.random),
    };
  }
}

export function isCorrect(question: Question, answer: string): boolean {
  return answer === question.correct;
}
