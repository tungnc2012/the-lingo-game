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

  // Preview grid data with staggered animations
  const previewRows = [
    { letters: ['S', 'O', 'U', 'N', 'D'], statuses: ['correct', 'present', 'present', 'typed', 'typed'] },
    { letters: ['C', 'O', 'L', 'O', 'R'], statuses: ['typed', 'typed', 'typed', 'typed', 'typed'] },
    { letters: ['P', 'L', 'A', 'Y', 'E'], statuses: ['typed', 'typed', 'typed', 'typed', 'typed'] },
    { letters: ['L', 'I', 'N', 'G', 'O'], statuses: ['correct', 'correct', 'correct', 'correct', 'correct'] },
    { letters: ['', '', '', '', ''], statuses: ['empty', 'empty', 'empty', 'empty', 'empty'] },
  ];

  return (
    <div className={styles.landingScreen}>
      {/* Floating background particles */}
      <div className={styles.particles}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className={styles.particle} style={{
            '--delay': `${i * 0.8}s`,
            '--x': `${15 + i * 14}%`,
            '--size': `${4 + (i % 3) * 3}px`,
          } as React.CSSProperties} />
        ))}
      </div>

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
                  <span className={styles.btnIcon}>🎮</span> Create Game
                </button>
                <button 
                  className={styles.btnAction} 
                  onClick={() => setIsJoining(true)}
                >
                  <span className={styles.btnIcon}>🔗</span> Join Game
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
                  ← Back
                </button>
              </form>
            )}
          </div>
        </div>
        
        <div className={styles.rightPanel}>
          <div className={styles.previewGrid}>
            {previewRows.map((row, rowIdx) => (
              <div key={rowIdx} className={styles.previewRow}>
                {row.letters.map((letter, colIdx) => (
                  <div 
                    key={colIdx} 
                    className={`${styles.previewCell} ${styles[row.statuses[colIdx]]}`}
                    style={{
                      animationDelay: `${(rowIdx * 5 + colIdx) * 80}ms`
                    }}
                  >
                    {letter}
                  </div>
                ))}
              </div>
            ))}
          </div>
          <p className={styles.tagline}>Guess the word. Beat the clock. Win the game.</p>
        </div>
      </div>
    </div>
  );
};
