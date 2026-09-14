## Plan
1. **GameService.java**:
   - Remove dictionary validation logic entirely so any 5-letter guess is accepted (Fixes "dont let user feel free to guess a word").
   - Modify the "ATTEMPTS_EXHAUSTED" logic. Instead of triggering a Steal on the 5th failed attempt, simply return the `GuessResult` with `targetWord` set so the UI can display the 5th attempt's evaluation and end the game.
   - Adjust `MAX_GRID_ROWS` if necessary (but 5 is fine since Steal will only happen on timeouts now, which use the same row).
2. **GameScreen.tsx**:
   - Remove the `if (nextRow >= MAX_ATTEMPTS) { setGameState('LOST'); return; }` block. The frontend should just rely on the backend sending `targetWord` to transition to `LOST`.
   - Update Case 2 (turn over) to ensure it calls `setLetterStatuses` so the keyboard updates for the final guess.
