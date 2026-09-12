# Game Logic and State Machine Design

This plan outlines the architecture for the Game State Machine and WebSocket payloads. Once approved, this will be added to the `DESIGN.md` file as an overview.

## Proposed Changes

We will add a new section **Game State Machine & Data Model** to `DESIGN.md`.

### 1. Game States
The game will transition through these high-level states:
- `WAITING_FOR_PLAYERS`: Room created, waiting for teams of two to join.
- `ROUND_1`: 4-letter words and 9-letter Puzzleword.
- `ROUND_2`: 5-letter words and 10-letter Puzzleword. Lowest score eliminated.
- `ROUND_3`: Split duties, mixed words and Puzzlewords. Leading team advances.
- `FINAL_ROUND`: 90-second rapid fire for the winning team.
- `GAME_OVER`: Final scores and jackpot status displayed.

### 2. Turn Sub-States (The Guessing Loop)
Within each round, the word guessing follows a tight loop:
- `WORD_REVEALED`: The first letter is given.
- `AWAITING_GUESS`: 10-second timer starts for the active player.
- `EVALUATING_GUESS`: Backend validates the word against the dictionary.
- `TURN_PASSED`: If time expires or the word is invalid, control passes to the opposing team (Round 2/3).
- `WORD_SOLVED`: Points are awarded.
- `WORD_FAILED`: No attempts remaining, word is revealed.

### 3. Core Entities
- **Room**: Manages the game lifecycle, holds Teams, and broadcasts events.
- **Team**: Holds 2 Players, tracks the team's score.
- **Player**: Holds session ID, name, and connection status.
- **Turn Context**: Tracks the current word, attempts left, current active player, and revealed letters.

### 4. WebSocket Events Overview
Communication will happen over WebSockets with JSON payloads.

**Client -> Server (Actions):**
- `JOIN_ROOM`: `{ roomId, playerName }`
- `SUBMIT_GUESS`: `{ guess: "APPLE" }`
- `PASS_WORD`: Used only in the Final Round to skip a word.

**Server -> Client (Broadcasts):**
- `GAME_STATE_SYNC`: Full snapshot of the game (scores, current round, connected players).
- `TURN_STARTED`: `{ activePlayerId, timeLimitSeconds: 10 }`
- `GUESS_RESULT`: `{ guess: "APPLE", evaluation: ["CORRECT", "PRESENT", "ABSENT", "ABSENT", "ABSENT"] }`
- `ERROR`: `{ message: "Invalid word" }`

## Open Questions

> [!IMPORTANT]
> 1. **Time Coordination:** Should the 10-second turn timer be fully enforced on the backend (Server sends a `TURN_EXPIRED` event), or should the frontend track the time and send a timeout event? (Backend enforcement is recommended to prevent cheating).
> 2. **Dictionary:** Do you want to start with a simple hardcoded dictionary of words for testing, or should we plan to integrate an external dictionary API immediately?

## Verification Plan

Once approved, I will update `DESIGN.md` with these details formatted clearly using Mermaid diagrams where appropriate for the state machine.
