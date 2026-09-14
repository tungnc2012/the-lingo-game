import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'react-router-dom';
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
const DEFAULT_TIME = 20;

const VIOLATION_MESSAGES: Record<string, string> = {
  TIME_EXPIRED: '⏰ Time\'s up!',
  INVALID_WORD: '❌ Not a valid word!',
  INVALID_LENGTH: '❌ Wrong length!',
  ATTEMPTS_EXHAUSTED: '💔 Out of attempts!',
};

export const GameScreen = () => {
  const { roomId } = useParams<{ roomId: string }>();

  const [grid, setGrid] = useState<CellData[][]>(generateEmptyGrid(MAX_ATTEMPTS, WORD_LENGTH));
  const [currentRow, setCurrentRow] = useState(0);
  const [gameState, setGameState] = useState<'CONNECTING' | 'PLAYING' | 'WON' | 'LOST'>('CONNECTING');
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [letterStatuses, setLetterStatuses] = useState<{ [key: string]: LetterStatus }>({});
  const [roomData, setRoomData] = useState<ClientGameRoom | null>(null);
  const [targetWord, setTargetWord] = useState<string | null>(null);
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Refs that survive renders without causing re-renders
  const lastSubmittedRowRef = useRef<number>(-1);
  const handleGuessResultRef = useRef<typeof handleGuessResult | null>(null);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentRowRef = useRef<number>(0); // Mirror of currentRow for use inside closures

  // Keep the ref in sync with the state
  useEffect(() => {
    currentRowRef.current = currentRow;
  }, [currentRow]);

  const showStatus = useCallback((message: string, durationMs = 3000) => {
    setStatusMessage(message);
    setTimeout(() => setStatusMessage(''), durationMs);
  }, []);

  // Server-authoritative timer: clear existing interval, start fresh from given seconds
  const resetTimer = useCallback((seconds: number) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    setTimeLeft(seconds);
    if (seconds <= 0) return; // Don't start counting if already at 0

    timerIntervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  // Apply the backend's revealed letters array to a specific row in the grid.
  // revealedLetters is a fixed-size array: "" = unrevealed, "X" = revealed.
  const applyRevealedLetters = useCallback(
    (revealedLetters: string[], rowIdx: number) => {
      if (rowIdx < 0 || rowIdx >= MAX_ATTEMPTS) return;
      setGrid((prev) => {
        const newGrid = prev.map((r) => [...r]);
        revealedLetters.forEach((letter, i) => {
          // Only fill cells that are still empty; never overwrite evaluated/typed cells
          if (letter && letter !== '' && i < newGrid[rowIdx].length && newGrid[rowIdx][i].status === 'EMPTY') {
            newGrid[rowIdx][i] = { letter, status: 'TYPED' };
          }
        });
        return newGrid;
      });
    },
    []
  );

  useEffect(() => {
    if (!roomId) return;

    wsService.connect(
      // onStateUpdate: called every time the server broadcasts room state
      (state: ClientGameRoom) => {
        setRoomData(state);

        // Transition out of CONNECTING on first real game state
        setGameState((prev) => {
          if (prev === 'CONNECTING') return 'PLAYING';
          return prev;
        });

        // --- Grid reset guard ---
        // Only reset for a genuinely NEW turn (attempt 1 AND not a steal).
        // A steal also has currentAttempt > 1 now (fixed in backend), so this
        // condition should never fire mid-steal.
        if (state.currentAttempt === 1 && !state.stealAttempt) {
          setGrid(generateEmptyGrid(MAX_ATTEMPTS, WORD_LENGTH));
          setCurrentRow(0);
          currentRowRef.current = 0;
          setLetterStatuses({});
          setTargetWord(null);
          lastSubmittedRowRef.current = -1;
        }

        // Apply revealed letters to the correct row.
        // currentAttempt is 1-indexed, so rowIdx = currentAttempt - 1.
        if (state.revealedLetters && state.revealedLetters.length > 0 && state.currentAttempt) {
          const rowIdx = state.currentAttempt - 1;
          applyRevealedLetters(state.revealedLetters, rowIdx);
        }

        // Reset timer from server's authoritative value.
        // Use nullish coalescing (??) so timeRemainingMs = 0 is handled correctly.
        const serverTimeLeft = Math.ceil(
          (state.timeRemainingMs ?? DEFAULT_TIME * 1000) / 1000
        );
        resetTimer(serverTimeLeft);
      },

      // onGuessResult: called when the server evaluates a guess
      (result: GuessResult) => {
        if (handleGuessResultRef.current) {
          handleGuessResultRef.current(result);
        }
      }
    );

    wsService.joinRoom(roomId, PLAYER_NAME);

    return () => {
      wsService.disconnect();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [roomId, resetTimer, applyRevealedLetters]);

  const handleGuessResult = (result: GuessResult) => {
    const row = currentRowRef.current;

    // ── Case 0: Soft rejection (not in word list) ───────────────────────────
    // Attempt is NOT consumed. Just shake the row and let the player try again.
    if (result.rejected) {
      const msg = result.violationReason === 'INVALID_LENGTH'
        ? '⚠️ Word must be 5 letters'
        : '❌ Not in word list';
      showStatus(msg, 2000);
      setShakeRow(row);
      setTimeout(() => setShakeRow(null), 600);
      // Reset submission guard so the player can press Enter again
      lastSubmittedRowRef.current = -1;
      return;
    }

    // ── Case 1: Correct guess ───────────────────────────────────────────────
    if (result.correct) {
      // Write the evaluated tiles to the grid
      setGrid((prev) => {
        const newGrid = prev.map((r) => [...r]);
        for (let i = 0; i < result.evaluation.length; i++) {
          if (result.guess[i] !== undefined) {
            newGrid[row][i] = { letter: result.guess[i], status: result.evaluation[i] as LetterStatus };
          }
        }
        return newGrid;
      });
      setLetterStatuses((prev) => updateLetterStatuses(prev, result));
      if (result.targetWord) setTargetWord(result.targetWord);
      setGameState('WON');
      showStatus('🎉 Correct!');
      return;
    }

    // ── Case 2: Turn completely over (steal failed, word revealed) ──────────
    // Indicated by targetWord being sent without correct=true
    if (result.targetWord) {
      // Optionally show the steal team's wrong evaluation
      if (result.guess && result.guess.length > 0) {
        setGrid((prev) => {
          const newGrid = prev.map((r) => [...r]);
          for (let i = 0; i < result.evaluation.length; i++) {
            if (result.guess[i] !== undefined) {
              newGrid[row][i] = { letter: result.guess[i], status: result.evaluation[i] as LetterStatus };
            }
          }
          return newGrid;
        });
        setLetterStatuses((prev) => updateLetterStatuses(prev, result));
      }
      setTargetWord(result.targetWord);
      setGameState('LOST');
      return;
    }

    // ── Case 3: Violation (steal starting) ─────────────────────────────────
    // The backend has already incremented currentAttempt and set up the steal.
    // We just advance currentRow and show the message. The onStateUpdate will
    // apply revealed letters to the new row.
    if (result.violationReason) {
      const msg = VIOLATION_MESSAGES[result.violationReason] ?? '🚫 Violation!';
      showStatus(msg, 3000);
      // Shake the row to signal the error
      setShakeRow(row);
      setTimeout(() => setShakeRow(null), 600);
      // Advance to the steal team's row
      const nextRow = row + 1;
      if (nextRow < MAX_ATTEMPTS) {
        setCurrentRow(nextRow);
        currentRowRef.current = nextRow;
      }
      // Reset the submission guard for the new row
      lastSubmittedRowRef.current = -1;
      return;
    }

    // ── Case 4: Normal wrong guess ──────────────────────────────────────────
    setGrid((prev) => {
      const newGrid = prev.map((r) => [...r]);
      for (let i = 0; i < result.evaluation.length; i++) {
        if (result.guess[i] !== undefined) {
          newGrid[row][i] = { letter: result.guess[i], status: result.evaluation[i] as LetterStatus };
        }
      }
      return newGrid;
    });
    setLetterStatuses((prev) => updateLetterStatuses(prev, result));

    // Shake the row
    setShakeRow(row);
    setTimeout(() => setShakeRow(null), 600);

    const nextRow = row + 1;

    setCurrentRow(nextRow);
    currentRowRef.current = nextRow;
    lastSubmittedRowRef.current = -1;

    // Carry CORRECT letters down to the next row (Lingo rule)
    setTimeout(() => {
      setGrid((prev) => {
        const updated = prev.map((r) => [...r]);
        for (let i = 0; i < WORD_LENGTH; i++) {
          for (let r = 0; r <= row; r++) {
            if (updated[r][i].status === 'CORRECT') {
              if (updated[nextRow][i].status === 'EMPTY') {
                updated[nextRow][i] = { letter: updated[r][i].letter, status: 'CORRECT' };
              }
              break;
            }
          }
        }
        return updated;
      });
    }, 400);
  };

  // Helper: update the keyboard letter colors
  const updateLetterStatuses = (
    prev: Record<string, LetterStatus>,
    result: GuessResult
  ): Record<string, LetterStatus> => {
    const updated = { ...prev };
    for (let i = 0; i < result.evaluation.length; i++) {
      const letter = result.guess[i];
      if (!letter) continue;
      const current = updated[letter];
      const next = result.evaluation[i] as LetterStatus;
      // Don't downgrade a CORRECT to PRESENT/ABSENT
      if (current !== 'CORRECT') {
        updated[letter] = next;
      }
    }
    return updated;
  };

  // Always point the WebSocket callback at the latest closure
  handleGuessResultRef.current = handleGuessResult;

  // Auto-submit on timer reaching 0
  useEffect(() => {
    if (
      gameState === 'PLAYING' &&
      timeLeft === 0 &&
      roomId &&
      lastSubmittedRowRef.current !== currentRow
    ) {
      lastSubmittedRowRef.current = currentRow;

      // Optimistically pause/reset timer to prevent it triggering again on the next row
      // before the server's room state update arrives.
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
      setTimeLeft(DEFAULT_TIME);

      const rowCells = grid[currentRow];
      const isComplete = rowCells?.every((c) => c.letter !== '' && c.letter !== ' ');

      if (isComplete) {
        // Row is full — submit the guess normally
        const guess = rowCells.map((c) => c.letter).join('');
        wsService.submitGuess(roomId, guess);
      } else {
        // Partial/empty row — tell backend it's a timeout (empty string = timeout signal)
        wsService.submitGuess(roomId, '');
      }
    }
  }, [gameState, timeLeft, roomId, currentRow, grid]);

  const onKeyPress = useCallback(
    (key: string) => {
      if (gameState !== 'PLAYING') return;

      if (key === 'ENTER') {
        const rowCells = grid[currentRow];
        const isComplete = rowCells?.every((c) => c.letter !== '');
        if (!isComplete || !roomId) return;
        if (lastSubmittedRowRef.current === currentRow) return;

        lastSubmittedRowRef.current = currentRow;
        const guess = rowCells.map((c) => c.letter).join('');

        // Optimistically pause/reset timer
        if (timerIntervalRef.current) {
          clearInterval(timerIntervalRef.current);
          timerIntervalRef.current = null;
        }
        setTimeLeft(DEFAULT_TIME);

        wsService.submitGuess(roomId, guess);
      } else if (key === '⌫' || key === 'BACKSPACE') {
        setGrid((prev) => {
          const newGrid = prev.map((row) => [...row]);
          const rowCells = newGrid[currentRow];
          // Find the last TYPED cell (from right to left)
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
          const newGrid = prev.map((row) => [...row]);
          const rowCells = newGrid[currentRow];
          // Find the first EMPTY cell, skipping pre-filled CORRECT/TYPED cells
          const emptyIdx = rowCells.findIndex(
            (c) => c.status === 'EMPTY' && c.letter === ''
          );
          if (emptyIdx !== -1) {
            rowCells[emptyIdx] = { letter: key, status: 'TYPED' };
          }
          return newGrid;
        });
      }
    },
    [currentRow, gameState, grid, roomId]
  );

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

  const activeTeam = roomData?.activeTeamId ?? 'team-1';
  const roundLabel =
    roomData?.state === 'WAITING_FOR_PLAYERS'
      ? 'WAITING'
      : roomData?.state?.replace(/_/g, ' ') ?? 'ROUND 1';

  return (
    <div className={styles.gameScreen}>
      <div className={styles.topSection}>
        <div className={styles.logo}>The Lingo Game</div>
        <div className={styles.headerWrapper}>
          <Header
            round={roundLabel}
            team1Score={roomData?.teams?.[0]?.score ?? 0}
            team2Score={roomData?.teams?.[1]?.score ?? 0}
            timeLeft={timeLeft}
            maxTime={roomData?.stealAttempt ? 10 : DEFAULT_TIME}
            activeTeam={activeTeam}
            statusMessage={statusMessage}
          />
        </div>
      </div>

      <div className={styles.mainContent}>
        <LingoGrid grid={grid} currentRow={currentRow} shakeRow={shakeRow} />
      </div>

      <div className={styles.keyboardSection}>
        <Keyboard onKeyPress={onKeyPress} letterStatuses={letterStatuses} />
      </div>

      {gameState === 'CONNECTING' && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <div className={styles.spinner}></div>
            <h2>Connecting...</h2>
            <p className={styles.modalSub}>Setting up your game room</p>
          </div>
        </div>
      )}

      {(gameState === 'WON' || gameState === 'LOST') && (
        <div className={styles.bannerOverlay}>
          <div
            className={`${styles.banner} ${
              gameState === 'WON' ? styles.bannerWon : styles.bannerLost
            }`}
          >
            <div className={styles.bannerEmoji}>
              {gameState === 'WON' ? '🎉' : '😔'}
            </div>
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
                  setLetterStatuses({});
                  setTargetWord(null);
                  setGameState('CONNECTING');
                  wsService.nextTurn(roomId!);
                }}
              >
                Next Word →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
