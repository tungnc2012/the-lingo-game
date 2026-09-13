import React from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  round: string;
  team1Score: number;
  team2Score: number;
  timeLeft: number;
}

export const Header = ({ round, team1Score, team2Score, timeLeft }: HeaderProps) => {
  return (
    <div className={styles.header}>
      <div className={`${styles.teamScore} ${styles.team1}`}>
        <span className={styles.teamName}>TEAM 1</span>
        <span className={styles.score}>{team1Score} pts</span>
      </div>
      
      <div className={styles.roundInfo}>
        <div className={styles.roundBadge}>{round}</div>
      </div>

      <div className={`${styles.teamScore} ${styles.team2}`}>
        <span className={styles.teamName}>TEAM 2</span>
        <span className={styles.score}>{team2Score} pts</span>
      </div>
    </div>
  );
};
