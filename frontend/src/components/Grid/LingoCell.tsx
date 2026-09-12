import styles from './Grid.module.css';
import type { CellData } from './types';

interface LingoCellProps {
  data: CellData;
  isActive: boolean;
  animationDelay: number;
}

export const LingoCell = ({ data, isActive, animationDelay }: LingoCellProps) => {
  const getStatusClass = () => {
    switch (data.status) {
      case 'CORRECT': return styles.correct;
      case 'PRESENT': return styles.present;
      case 'ABSENT': return styles.absent;
      case 'TYPED': return styles.typed;
      default: return '';
    }
  };

  const isEvaluated = data.status === 'CORRECT' || data.status === 'PRESENT' || data.status === 'ABSENT';

  return (
    <div className={`${styles.cellWrapper} ${isActive ? styles.activeRowCell : ''}`}>
      <div 
        className={`${styles.cell} ${getStatusClass()} ${isEvaluated ? styles.flip : ''}`}
        style={{ animationDelay: `${animationDelay}ms` }}
      >
        <div className={styles.cellInner}>
          <div className={styles.cellFront}>
            {data.letter}
          </div>
          <div className={styles.cellBack}>
            {data.letter}
          </div>
        </div>
      </div>
    </div>
  );
};
