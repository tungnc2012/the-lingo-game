import styles from './Keyboard.module.css';

interface KeyboardProps {
  onKeyPress: (key: string) => void;
  letterStatuses: { [key: string]: string };
}

const KEYS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']
];

export const Keyboard = ({ onKeyPress, letterStatuses }: KeyboardProps) => {
  const getStatusClass = (key: string) => {
    const status = letterStatuses[key];
    switch (status) {
      case 'CORRECT': return styles.correct;
      case 'PRESENT': return styles.present;
      case 'ABSENT': return styles.absent;
      default: return '';
    }
  };

  return (
    <div className={styles.keyboard}>
      {KEYS.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className={styles.row}>
          {row.map((key) => {
            const isSpecial = key === 'ENTER' || key === '⌫';
            return (
              <button
                key={key}
                onClick={() => onKeyPress(key)}
                className={`${styles.key} ${isSpecial ? styles.specialKey : ''} ${!isSpecial ? getStatusClass(key) : ''}`}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
};
