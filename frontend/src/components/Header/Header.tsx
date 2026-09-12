import styles from './Header.module.css';

interface HeaderProps {
  round: string;
  team1Score: number;
  team2Score: number;
  timeLeft: number;
}

export const Header = ({ round, team1Score, team2Score, timeLeft }: HeaderProps) => {
  return (
    <header className={styles.header}>
      <div className={styles.scores}>
        <div className={styles.team}>
          <span className={styles.teamName}>Team 1</span>
          <span className={styles.score}>{team1Score} pts</span>
        </div>
        <div className={styles.round}>{round}</div>
        <div className={styles.team}>
          <span className={styles.teamName}>Team 2</span>
          <span className={styles.score}>{team2Score} pts</span>
        </div>
      </div>
      
      <div className={styles.timerContainer}>
        <div 
          className={`${styles.timerBar} ${timeLeft <= 3 ? styles.timerWarning : ''}`}
          style={{ width: `${(timeLeft / 10) * 100}%` }}
        />
      </div>
    </header>
  );
};
