import React from 'react';
import styles from './Header.module.css';

interface HeaderProps {
  round: string;
  team1Score: number;
  team2Score: number;
  timeLeft: number;
  maxTime?: number;
  activeTeam?: string; // 'team-1' | 'team-2' | undefined
  statusMessage?: string;
}

export const Header = ({ round, team1Score, team2Score, timeLeft, maxTime = 20, activeTeam, statusMessage }: HeaderProps) => {
  const timerPercent = Math.max(0, Math.min(100, (timeLeft / maxTime) * 100));
  const timerState = timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warning' : 'safe';

  return (
    <div className={styles.header}>
      <div className={styles.scoreboard}>
        <div className={`${styles.teamCard} ${styles.team1} ${activeTeam === 'team-1' ? styles.activeTeam : ''}`}>
          <span className={styles.teamLabel}>TEAM 1</span>
          <span className={styles.teamScore}>{team1Score}</span>
          <span className={styles.teamUnit}>pts</span>
        </div>

        <div className={styles.centerSection}>
          <div className={styles.roundBadge}>{round}</div>
          <div className={styles.timerDisplay}>
            <span className={`${styles.timerDigits} ${timerState === 'danger' ? styles.timerDanger : ''}`}>
              {timeLeft.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        <div className={`${styles.teamCard} ${styles.team2} ${activeTeam === 'team-2' ? styles.activeTeam : ''}`}>
          <span className={styles.teamLabel}>TEAM 2</span>
          <span className={styles.teamScore}>{team2Score}</span>
          <span className={styles.teamUnit}>pts</span>
        </div>
      </div>

      <div className={styles.timerBarContainer}>
        <div 
          className={`${styles.timerBar} ${styles[timerState]}`} 
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {statusMessage && (
        <div className={styles.statusMessage}>
          {statusMessage}
        </div>
      )}
    </div>
  );
};
