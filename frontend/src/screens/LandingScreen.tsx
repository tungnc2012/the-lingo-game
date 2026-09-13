import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingScreen.module.css';

export const LandingScreen = () => {
  const navigate = useNavigate();
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);

  const handleCreateGame = () => {
    const newRoomId = Math.floor(1000 + Math.random() * 9000).toString();
    navigate(`/game/${newRoomId}`);
  };

  const handleSinglePlayer = () => {
    // We prepend 'single-' to signal to the backend that this is a single player game against AI
    const newRoomId = 'single-' + Math.floor(1000 + Math.random() * 9000).toString();
    navigate(`/game/${newRoomId}`);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (joinCode.trim().length > 0) {
      navigate(`/game/${joinCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className={styles.landingScreen}>
      <div className={styles.container}>
        <div className={styles.leftPanel}>
          <div className={styles.logo}>
            <div className={styles.logoThe}>THE</div>
            <div className={styles.logoLingo}>LINGO</div>
            <div className={styles.logoGame}>GAME</div>
          </div>
          
          <div className={styles.actions}>
            {!isJoining ? (
              <>
                <button 
                  className={`${styles.btnAction} ${styles.primary}`} 
                  onClick={handleSinglePlayer}
                >
                  <span className={styles.btnIcon}>👤</span> Single Player
                </button>
                <div className={styles.divider}>
                  <span>OR MULTIPLAYER</span>
                </div>
                <button 
                  className={styles.btnAction} 
                  onClick={handleCreateGame}
                >
                  Create Game
                </button>
                <button 
                  className={styles.btnAction} 
                  onClick={() => setIsJoining(true)}
                >
                  Join Game
                </button>
              </>
            ) : (
              <form onSubmit={handleJoin} className={styles.inputGroup}>
                <input
                  type="text"
                  placeholder="ENTER ROOM CODE"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  maxLength={10}
                  autoFocus
                />
                <button 
                  type="submit"
                  className={`${styles.btnAction} ${styles.primary}`}
                  disabled={joinCode.trim().length === 0}
                >
                  Join Room
                </button>
                <button 
                  type="button"
                  className={styles.btnAction}
                  onClick={() => setIsJoining(false)}
                >
                  Back
                </button>
              </form>
            )}
          </div>
        </div>
        
        <div className={styles.rightPanel}>
          <div className={styles.previewGrid}>
            <div className={styles.previewRow}>
              <div className={`${styles.previewCell} ${styles.correct}`}>S</div>
              <div className={`${styles.previewCell} ${styles.present}`}>O</div>
              <div className={`${styles.previewCell} ${styles.present}`}>U</div>
              <div className={`${styles.previewCell} ${styles.typed}`}>N</div>
              <div className={`${styles.previewCell} ${styles.typed}`}>D</div>
            </div>
            <div className={styles.previewRow}>
              <div className={`${styles.previewCell} ${styles.typed}`}>C</div>
              <div className={`${styles.previewCell} ${styles.typed}`}>O</div>
              <div className={`${styles.previewCell} ${styles.typed}`}>L</div>
              <div className={`${styles.previewCell} ${styles.typed}`}>O</div>
              <div className={`${styles.previewCell} ${styles.typed}`}>R</div>
            </div>
            <div className={styles.previewRow}>
              <div className={`${styles.previewCell} ${styles.typed}`}>P</div>
              <div className={`${styles.previewCell} ${styles.typed}`}>L</div>
              <div className={`${styles.previewCell} ${styles.typed}`}>A</div>
              <div className={`${styles.previewCell} ${styles.typed}`}>Y</div>
              <div className={`${styles.previewCell} ${styles.typed}`}>E</div>
            </div>
            <div className={styles.previewRow}>
              <div className={`${styles.previewCell} ${styles.correct}`}>L</div>
              <div className={`${styles.previewCell} ${styles.correct}`}>I</div>
              <div className={`${styles.previewCell} ${styles.correct}`}>N</div>
              <div className={`${styles.previewCell} ${styles.correct}`}>G</div>
              <div className={`${styles.previewCell} ${styles.correct}`}>O</div>
            </div>
            <div className={styles.previewRow}>
              <div className={styles.previewCell}></div>
              <div className={styles.previewCell}></div>
              <div className={styles.previewCell}></div>
              <div className={styles.previewCell}></div>
              <div className={styles.previewCell}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
