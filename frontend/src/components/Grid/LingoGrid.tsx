import styles from './Grid.module.css';
import { LingoCell } from './LingoCell';
import type { CellData } from './types';

interface LingoGridProps {
  grid: CellData[][];
  currentRow: number;
  shakeRow?: number | null;
}

export const LingoGrid = ({ grid, currentRow, shakeRow }: LingoGridProps) => {
  return (
    <div className={styles.gridContainer}>
      {grid.map((row, rowIndex) => (
        <div 
          key={`row-${rowIndex}`} 
          className={`${styles.row} ${rowIndex === shakeRow ? styles.shake : ''}`}
        >
          <div className={styles.rowNumber}>{rowIndex + 1}</div>
          {row.map((cell, colIndex) => (
            <LingoCell 
              key={`cell-${rowIndex}-${colIndex}`} 
              data={cell} 
              isActive={rowIndex === currentRow}
              animationDelay={colIndex * 150}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
