import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header/Header';
import { LingoGrid } from '../components/Grid/LingoGrid';
import { Keyboard } from '../components/Keyboard/Keyboard';
import { generateEmptyGrid } from '../components/Grid/types';
import type { CellData, LetterStatus } from '../components/Grid/types';
import { wsService } from '../services/websocket';
import type { ClientGameRoom, GuessResult } from '../services/websocket';
import styles from './GameScreen.module.css';

const PLAYER_NAME = "DevUser";
const MAX_ATTEMPTS = 5;
const WORD_LENGTH = 5;

export const GameScreen = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [grid, setGrid] = useState<CellData[][]>(generateEmptyGrid(MAX_ATTEMPTS, WORD_LENGTH));
  const [currentRow, setCurrentRow] = useState(0);
  const [gameState, setGameState] = useState<'CONNECTING' | 'PLAYING' | 'WON' | 'LOST'>('CONNECTING');
  const [timeLeft, setTimeLeft] = useState(20);
  const [letterStatuses, setLetterStatuses] = useState<{ [key: string]: LetterStatus }>({});
  const [roomData, setRoomData] = useState<ClientGameRoom | null>(null);
  const [targetWord, setTargetWord] = useState<string | null>(null);
  const lastSubmittedRowRef = useRef<number>(-1);
  const handleGuessResultRef = useRef<typeof handleGuessResult | null>(null);

  useEffect(() => {
    if (!roomId) return;

    wsService.connect(
      (state) => {
        setRoomData(state);
        setGameState((prev) => {
          if (state.currentAttempt === 1) return 'PLAYING';
          if (prev === 'CONNECTING') return 'PLAYING';
          return prev;
        });
        setTimeLeft(Math.ceil((state.timeRemainingMs || 20000) / 1000));
        
        if (state.currentAttempt === 1) {
           setGrid(generateEmptyGrid(MAX_ATTEMPTS, WORD_LENGTH));
           setCurrentRow(0);
           setLetterStatuses({});
           setTargetWord(null);
           lastSubmittedRowRef.current = -1;
        }

        // Setup initial revealed letters
        if (state.revealedLetters && state.revealedLetters.length > 0 && state.currentAttempt && state.currentAttempt > 0 && state.currentAttempt <= MAX_ATTEMPTS) {
           setGrid((prev) => {
             const newGrid = prev.map(r => [...r]);
             if (newGrid[state.currentAttempt! - 1][0].status === 'EMPTY') {
                 newGrid[state.currentAttempt! - 1][0] = { letter: state.revealedLetters![0], status: 'TYPED' };
             }
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

    wsService.joinRoom(roomId, PLAYER_NAME);

    return () => wsService.disconnect();
  }, [roomId]);

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

    if (result.correct) {
      setGameState('WON');
      if (result.targetWord) setTargetWord(result.targetWord);
    } else if (currentRow + 1 >= MAX_ATTEMPTS) {
      setGameState('LOST');
      if (result.targetWord) setTargetWord(result.targetWord);
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

  useEffect(() => {
    if (gameState === 'PLAYING' && timeLeft === 0 && roomId && lastSubmittedRowRef.current !== currentRow) {
      lastSubmittedRowRef.current = currentRow;
      const guess = grid[currentRow].map(c => c.letter).join('');
      wsService.submitGuess(roomId, guess);
    }
  }, [gameState, timeLeft, roomId, currentRow, grid]);

  const onKeyPress = useCallback((key: string) => {
    if (gameState !== 'PLAYING') return;

    if (key === 'ENTER') {
      const currentRowCells = grid[currentRow];
      const isComplete = currentRowCells && currentRowCells.every(c => c.letter !== '');
      if (!isComplete) return;
      if (!roomId) return;
      if (lastSubmittedRowRef.current === currentRow) return;

      lastSubmittedRowRef.current = currentRow;
      const guess = currentRowCells.map(c => c.letter).join('');
      wsService.submitGuess(roomId, guess);
    } else if (key === '⌫' || key === 'BACKSPACE') {
      setGrid((prev) => {
        const newGrid = prev.map(row => [...row]);
        const rowCells = newGrid[currentRow];
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
        const emptyIndex = rowCells.findIndex(c => c.letter === '' || c.status === 'EMPTY');
        if (emptyIndex !== -1) {
          rowCells[emptyIndex] = { letter: key, status: 'TYPED' };
        }
        return newGrid;
      });
    }
  }, [currentRow, gameState, grid, roomId]);

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
      <div className={styles.clockWidget}>
        00:{timeLeft.toString().padStart(2, '0')}
      </div>
      
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
        <div className={styles.bannerOverlay}>
          <div className={`${styles.banner} ${gameState === 'WON' ? styles.bannerWon : styles.bannerLost}`}>
            <h2>{gameState === 'WON' ? 'You Guessed It!' : 'Out of Attempts!'}</h2>
            {targetWord && (
              <div className={styles.targetWordReveal}>
                The word was: <strong>{targetWord}</strong>
              </div>
            )}
            <div className={styles.bannerActions}>
              <button 
                className={styles.btnPrimary} 
                onClick={() => {
                  setGameState('CONNECTING');
                  wsService.nextTurn(roomId!);
                }}
              >
                Next Word
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
