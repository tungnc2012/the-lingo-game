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
  const isPreFilled = data.status === 'CORRECT' && isActive;

  return (
    <div className={`${styles.cellWrapper} ${isActive ? styles.activeRowCell : ''}`}>
      <div 
        className={`${styles.cell} ${getStatusClass()} ${isEvaluated && !isActive ? styles.flip : ''} ${isPreFilled ? styles.preFilled : ''}`}
        style={isEvaluated && !isActive ? { animationDelay: `${animationDelay}ms` } : undefined}
      >
        <div className={styles.cellInner}>
          <div className={styles.cellFront}>
            {/* Only show letter on front if it's being typed or pre-filled */}
            {(data.status === 'TYPED' || (data.status === 'CORRECT' && isActive)) ? data.letter : ''}
          </div>
          <div className={`${styles.cellBack} ${getStatusClass()}`}>
            {data.letter}
          </div>
        </div>
      </div>
    </div>
  );
};
