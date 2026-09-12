import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Header } from '../components/Header/Header';
import { LingoGrid } from '../components/Grid/LingoGrid';
import { Keyboard } from '../components/Keyboard/Keyboard';
import { generateEmptyGrid } from '../components/Grid/types';
import type { CellData, LetterStatus } from '../components/Grid/types';
import { wsService } from '../services/websocket';
import type { ClientGameRoom, GuessResult } from '../services/websocket';
import styles from './GameScreen.module.css';

const ROOM_ID = "ROOM-" + Math.floor(Math.random() * 10000);
const PLAYER_NAME = "DevUser";
const MAX_ATTEMPTS = 5;
const WORD_LENGTH = 4; // Backend hardcodes "WORD" which is 4 letters

export const GameScreen = () => {
  const [grid, setGrid] = useState<CellData[][]>(generateEmptyGrid(MAX_ATTEMPTS, WORD_LENGTH));
  const [currentRow, setCurrentRow] = useState(0);
  const [gameState, setGameState] = useState<'CONNECTING' | 'PLAYING' | 'WON' | 'LOST'>('CONNECTING');
  const [timeLeft, setTimeLeft] = useState(10);
  const [letterStatuses, setLetterStatuses] = useState<{ [key: string]: LetterStatus }>({});
  const [roomData, setRoomData] = useState<ClientGameRoom | null>(null);
  const handleGuessResultRef = useRef<typeof handleGuessResult | null>(null);

  useEffect(() => {
    wsService.connect(
      (state) => {
        setRoomData(state);
        setGameState('PLAYING');
        setTimeLeft(Math.ceil((state.timeRemainingMs || 10000) / 1000));
        
        // Setup initial revealed letters
        if (state.revealedLetters && state.revealedLetters.length > 0 && state.currentAttempt && state.currentAttempt > 0 && state.currentAttempt <= MAX_ATTEMPTS) {
           setGrid((prev) => {
             const newGrid = [...prev];
             newGrid[state.currentAttempt - 1][0] = { letter: state.revealedLetters![0], status: 'TYPED' };
             return newGrid;
           });
        }
      },
      (result) => {
        if (handleGuessResultRef.current) {
          handleGuessResultRef.current(result);
        }
      }
    );

    wsService.joinRoom(ROOM_ID, PLAYER_NAME);

    return () => wsService.disconnect();
  }, []);

  const handleGuessResult = (result: GuessResult) => {
    const newGrid = [...grid];
    const newLetterStatuses = { ...letterStatuses };

    for (let i = 0; i < result.evaluation.length; i++) {
      newGrid[currentRow][i] = {
        letter: result.guess[i],
        status: result.evaluation[i] as LetterStatus,
      };
      
      const currentStatus = newLetterStatuses[result.guess[i]];
      if (currentStatus !== 'CORRECT') {
         newLetterStatuses[result.guess[i]] = result.evaluation[i] as LetterStatus;
      }
    }

    setGrid(newGrid);
    setLetterStatuses(newLetterStatuses);

    if (result.isCorrect) {
      setGameState('WON');
    } else if (currentRow + 1 >= MAX_ATTEMPTS) {
      setGameState('LOST');
    } else {
      setCurrentRow((prev) => prev + 1);
      
      // Auto-fill correct letters for next row
      setTimeout(() => {
        setGrid((prev) => {
          const updated = [...prev];
          const nextRow = currentRow + 1;
          
          // Find all permanently known letters by scanning all previous rows
          for (let i = 0; i < WORD_LENGTH; i++) {
            for (let r = 0; r <= currentRow; r++) {
               if (updated[r][i].status === 'CORRECT') {
                 updated[nextRow][i] = { letter: updated[r][i].letter, status: 'CORRECT' };
                 break;
               }
            }
          }
          
          // Also ensure the first letter is always filled if revealed
          if (roomData?.revealedLetters && roomData.revealedLetters.length > 0) {
             if (updated[nextRow][0].status === 'EMPTY') {
               updated[nextRow][0] = { letter: roomData.revealedLetters[0], status: 'TYPED' };
             }
          }
          
          return updated;
        });
      }, 500);
    }
  };

  handleGuessResultRef.current = handleGuessResult;

  useEffect(() => {
    if (gameState !== 'PLAYING') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState, currentRow]);

  const onKeyPress = useCallback((key: string) => {
    if (gameState !== 'PLAYING') return;

    if (key === 'ENTER') {
      const currentRowCells = grid[currentRow];
      const isComplete = currentRowCells && currentRowCells.every(c => c.letter !== '');
      if (!isComplete) return;

      const guess = currentRowCells.map(c => c.letter).join('');
      wsService.submitGuess(ROOM_ID, guess);
    } else if (key === '⌫' || key === 'BACKSPACE') {
      setGrid((prev) => {
        const newGrid = prev.map(row => [...row]);
        const rowCells = newGrid[currentRow];
        // Backspace removes the last user-typed letter ('TYPED'), preserving pre-filled 'CORRECT' letters
        for (let i = rowCells.length - 1; i >= 0; i--) {
          if (rowCells[i].status === 'TYPED') {
            rowCells[i] = { letter: '', status: 'EMPTY' };
            break;
          }
        }
        return newGrid;
      });
    } else if (key.match(/^[A-Z]$/)) {
      setGrid((prev) => {
        const newGrid = prev.map(row => [...row]);
        const rowCells = newGrid[currentRow];
        // Target the first empty cell in the current row
        const emptyIndex = rowCells.findIndex(c => c.letter === '' || c.status === 'EMPTY');
        if (emptyIndex !== -1) {
          rowCells[emptyIndex] = { letter: key, status: 'TYPED' };
        }
        return newGrid;
      });
    }
  }, [currentRow, gameState, grid]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') onKeyPress('ENTER');
      else if (e.key === 'Backspace') onKeyPress('⌫');
      else {
        const key = e.key.toUpperCase();
        if (key.match(/^[A-Z]$/)) onKeyPress(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onKeyPress]);

  return (
    <div className={styles.gameScreen}>
      <div className={styles.topSection}>
        <div className={styles.logo}>The Lingo Game</div>
        <div className={styles.headerWrapper}>
          <Header 
            round={roomData?.state === 'WAITING_FOR_PLAYERS' ? 'WAITING' : roomData?.state || 'ROUND 1'} 
            team1Score={roomData?.teams?.[0]?.score || 0} 
            team2Score={roomData?.teams?.[1]?.score || 0} 
            timeLeft={timeLeft} 
          />
        </div>
      </div>
      
      <div className={styles.mainContent}>
        <LingoGrid grid={grid} currentRow={currentRow} />
      </div>

      <div className={styles.keyboardSection}>
        <Keyboard onKeyPress={onKeyPress} letterStatuses={letterStatuses} />
      </div>

      {gameState === 'CONNECTING' && (
        <div className={styles.overlay}>
           <div className={styles.modal}>
             <h2>Connecting...</h2>
           </div>
        </div>
      )}

      {(gameState === 'WON' || gameState === 'LOST') && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h2>{gameState === 'WON' ? 'You Guessed It!' : 'Out of Attempts!'}</h2>
            <button className={styles.btnPrimary} onClick={() => window.location.reload()}>Play Again</button>
          </div>
        </div>
      )}
    </div>
  );
};
