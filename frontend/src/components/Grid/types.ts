export type LetterStatus = 'CORRECT' | 'PRESENT' | 'ABSENT' | 'EMPTY' | 'TYPED';

export interface CellData {
  letter: string;
  status: LetterStatus;
}

export const generateEmptyGrid = (attempts: number, wordLength: number): CellData[][] => {
  return Array.from({ length: attempts }, () =>
    Array.from({ length: wordLength }, () => ({ letter: '', status: 'EMPTY' }))
  );
};
