## Plan
Fix the frontend race condition that causes an instant timeout on the next row.
1. When the user manually submits a guess via `onKeyPress('ENTER')`, optimistically reset `timeLeft` to 20 (and clear the local interval) so it doesn't stay at 0.
2. When the auto-submit `useEffect` fires (because of a timeout), also reset `timeLeft` to 20 so that when the backend advances the row, the frontend doesn't immediately submit *another* timeout for the new row.

This race condition happens because `/topic/guess` and `/topic/room` arrive separately. The frontend processes the guess, advances to the next row, and if `timeLeft` is still 0 (because the room state update hasn't been processed yet), it instantly auto-submits an empty guess (timeout) for the new row. If this happens after the 4th attempt, the backend sees a timeout on the 5th attempt and ends the game prematurely.
