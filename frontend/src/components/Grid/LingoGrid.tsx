import styles from './Grid.module.css';
import { LingoCell } from './LingoCell';
import type { CellData } from './types';

interface LingoGridProps {
  grid: CellData[][];
  currentRow: number;
}

export const LingoGrid = ({ grid, currentRow }: LingoGridProps) => {
  return (
    <div className={styles.gridContainer}>
      {grid.map((row, rowIndex) => (
        <div key={`row-${rowIndex}`} className={styles.row}>
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
