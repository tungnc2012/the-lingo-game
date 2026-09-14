# The Lingo Game - Knowledge Base & Development Log

This document serves as a centralized record of the development progress, architecture decisions, and bug fixes applied to The Lingo Game.

## 1. Environment & Architecture
- **Tech Stack**: Frontend (React + Vite + TypeScript), Backend (Spring Boot 4.1.1 + Java 21), Database (PostgreSQL 15).
- **Dockerization**: Established a robust multi-container setup using `docker-compose.yml`. 
- **Networking**: Configured the Vite development server to correctly proxy `/api` and `/ws` traffic to the backend container (`http://backend:8080`).

## 2. Frontend Infrastructure Fixes
- **WebSocket Race Conditions**: Fixed a critical bug where the frontend attempted to join a room before the STOMP WebSocket connection was fully established. Implemented a `pendingJoin` queue in `websocket.ts` to ensure requests are held and executed immediately upon connection.
- **State Persistence Crashes**: Resolved "purple screen of death" crashes triggered by page reloads. This occurred because the backend kept finished games in memory, and rejoining a finished room caused out-of-bounds array errors in the React grid. 
  - *Fix*: Implemented randomized `ROOM_ID` generation on component mount to guarantee a fresh room on reload/Play Again.
  - *Fix*: Added boundary safety checks (`<= MAX_ATTEMPTS`) to the grid rendering logic.
- **Strict TypeScript Requirements**: Updated Vite configurations to accommodate `verbatimModuleSyntax` constraints, ensuring types/interfaces use `import type` exclusively.

## 3. UI/UX & Layout Enhancements
- **Logo Overlap Bug**: The logo was getting trapped underneath the blurred glassmorphism scoreboard on wide screens due to absolute positioning constraints. 
  - *Fix*: Completely refactored the `topSection` in `GameScreen.module.css` to use a standard Flexbox column layout, ensuring the logo and scoreboard stack naturally and predictably without overlapping.
- **Row Numbers**: Added subtle numeric indicators (1-5) to the left side of the `LingoGrid` to help players easily track their current attempt.

## 4. Core Game Mechanics (Frontend Implementation)
- **Grid Sizing**: Adjusted the UI grid to render 4 columns to perfectly match the backend's temporary hardcoded target word `"WORD"`.
- **Lingo "Carry-Down" Rule**: Implemented the show's core mechanic where correctly guessed letters (GREEN) are permanently retained.
  - The game now scans all previous rows upon transition and copies any `CORRECT` letters down to the new row.
- **Intelligent Cursor & Typing Logic**: 
  - Replaced the rigid `currentCol` index tracking with a dynamic `findIndex` search. 
  - When the user types, the cursor now automatically skips over any pre-filled green letters and targets the first `EMPTY` cell.
  - **Backspace Reversion**: If a user backspaces over a cell that was originally pre-filled with a green letter, the cell intelligently reverts to the green letter instead of becoming blank.
- **Stale Closure Bug Fix**: Solved a critical React issue where the 2nd attempt would mistakenly overwrite the 1st row. 
  - *Cause*: The WebSocket `onGuessResult` callback was trapped in an initial stale closure where `currentRow` was always `0`.
  - *Fix*: Utilized a `useRef` hook (`handleGuessResultRef`) to always point to the freshest render cycle logic, guaranteeing that guess evaluations progress sequentially down the grid.

## 5. Major Refactor — Game Logic, UI Overhaul & Bug Fixes (2026-09-13)

### 5.1 Backend: Full game-logic.md Compliance
The `GameService` was largely a prototype. It has been fully refactored to comply with all rules in `game-logic.md`.

- **Dictionary Service** (`DictionaryService.java`): Created a new Spring `@Service` that loads **5,757 five-letter English words** from `words_5.txt` (bundled as a classpath resource) on startup. Exposes `isValidWord(word)` and `getRandomWord(length)`.
  - *Word source*: [sgb-words.txt](https://github.com/charlesreid1/five-letter-words) by Donald Knuth, uppercased.

- **Tile Evaluation** (§4): The duplicate-letter handling algorithm was already correct and was preserved.

- **Dictionary Validation** (§3, §6): `processGuess()` now rejects any guess not found in the dictionary → triggers a violation.

- **Timer Enforcement** (§2, §6): Backend validates that a guess arrives within the time limit (`turnStartTime + timeLimitMs`). A 2-second network grace period is applied to avoid false positives. Late guesses → violation.

- **Violation & Steal Mechanics** (§3): 
  - A violation occurs on: timeout, invalid word, or exhausted attempts.
  - On violation: one additional **random unrevealed letter** is revealed; control passes to the opposing team.
  - The stealing team gets **exactly 1 attempt** with a fresh **10-second timer** (`timeLimitMs = 10000`).
  - If the steal also fails: the word is revealed and no points are awarded.

- **Scoring System** (§5): `Team.addScore()` is called with the correct points on a successful guess:
  - Attempt 1 → **500 pts**, 2 → **400**, 3 → **300**, 4 → **200**, 5 → **100**
  - Successful steal → **100 pts**

- **Active Team Tracking** (§6): `GameRoom` now tracks `activeTeamId`. `getOpposingTeamId()` and `getTeamById()` helper methods added. `GameController.nextTurn()` alternates the active team between words.

- **New/Updated Models**:
  - `TurnContext` — added `stealAttempt`, `stealingTeamId`, `timeLimitMs`, `isTimedOut()`
  - `GameRoom` — added `activeTeamId`, `wordsPlayedInRound`, helper methods
  - `ClientGameRoom` DTO — added `isStealAttempt`, `violationReason`
  - `GuessResult` DTO — added `violationReason`

### 5.2 Frontend: UI/UX Overhaul

- **Header CSS Class Mismatch (Critical Fix)**: The previous `Header.tsx` referenced CSS classes (`.teamScore`, `.roundBadge`, etc.) that did not exist in `Header.module.css`, and the CSS defined classes (`.scores`, `.team`, `.round`) that were never used in JSX. The scoreboard was effectively **unstyled**. Both files were fully rewritten to align.

- **TV-Style Scoreboard**: Header redesigned with two team cards (pink for Team 1, blue for Team 2). The active team's card glows with a pulsing border animation.

- **Integrated Timer**: Removed the standalone floating `clockWidget`. Timer is now inside the Header as:
  - Large countdown digits (blue → red as time runs low, with a pulse animation at ≤5s)
  - A horizontal progress bar below the scoreboard that transitions blue → amber → red

- **Grid Flip Animation Fix**: The flip animation previously showed the letter on both front and back faces, making it anti-climactic. Fixed so the **front face is blank** (empty/typed only) and the **back face reveals the colour and letter** after the flip.

- **Row Shake**: Incorrect guesses now trigger a lateral shake animation on the row via a new `shakeRow` prop on `LingoGrid`.

- **Active Row Glow**: The active row cells pulse with a subtle blue glow to guide the player's eye.

- **Keyboard on Desktop**: Removed the `display: none` rule that hid the keyboard on screens ≥768px. Keyboard is now visible on all screen sizes. Added a 3D press effect using the `border-bottom` trick.

- **Landing Screen Animations**: Logo words slide in sequentially. Preview grid cells animate in with staggered `cellReveal` delays. Floating particle effects added to the background.

- **Status Message Area**: `GameScreen` now passes a `statusMessage` prop to `Header` for displaying game events ("⏰ Time's up!", etc.).

- **Design System (`index.css`)**: Added team accent colors, timer state colors, and 10 reusable keyframe animations (`glowPulse`, `shakeRow`, `slideInUp`, `popIn`, `timerPulse`, `cellReveal`, etc.).

### 5.3 Bug Fixes

| # | Bug | Fix Applied |
|---|---|---|
| 1 | **Timer auto-submits garbage on timeout** — partially filled rows like `"AP   "` were submitted | On timeout, checks if the row is fully complete. If not, sends empty string so backend handles it as a violation |
| 2 | **Keyboard colors not clearing on "Next Word"** — stale letter statuses persisted | `setLetterStatuses({})` called immediately in the `onClick` handler before sending `nextTurn` |
| 3 | **Backspace doesn't revert pre-filled green letters** — backspace skipped CORRECT cells | Backspace now scans previous rows for a CORRECT letter at the same column position and reverts to it |
| 4 | **Timer reset race between attempts** — client-side `setInterval` competed with `timeRemainingMs` from server | Introduced a `timerIntervalRef` that is explicitly cleared and restarted from the server-authoritative value on each state sync |
| 5 | **Shallow copy mutation in `handleGuessResult`** — `[...grid]` only shallow-copied outer array; inner rows were mutated in-place causing React to miss updates | Changed all grid updates to `grid.map(row => [...row])` for proper immutable deep copies |

## 6. Known Limitations & Future Work
- **Round Progression**: The game currently only runs a single round (5-letter words) in a loop. Round 1 (4-letter), Round 2, and Quickfire (6-letter) rounds per `game-logic.md §1` are not yet implemented.
- **Single Player AI**: The "Single Player" mode (room prefixed with `single-`) has no AI opponent. It functions as a solo practice mode — violations trigger with no steal opponent.
- **Timer Reset on State Sync**: The backend currently resets `turnStartTime` after each guess. Ideally, the server should push a `TURN_STARTED` event independently (not tied to guess responses) for cleaner timer synchronization.
- **JUnit Tests**: Unit tests for the refactored `GameService` (scoring, violations, steal mechanics, duplicate tile evaluation) should be added. Java is compiled via Docker in this project.
