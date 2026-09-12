# The Lingo Game - Knowledge Base & Development Log

This document serves as a centralized record of the development progress, architecture decisions, and bug fixes applied to The Lingo Game.

## 1. Environment & Architecture
- **Tech Stack**: Frontend (React + Vite + TypeScript), Backend (Spring Boot 3.3.1 + Java 21), Database (PostgreSQL 15).
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

## 5. Upcoming Backend Work (Planned)
We have drafted the full ruleset in `game-logic.md`. The next major phase involves refactoring the Spring Boot backend to implement:
- **Dictionary Validation**: Verifying that guesses are real words.
- **Strict Timers**: Enforcing the 10-second rule per guess.
- **Violations & Stealing**: Handing turn transitions when time expires or invalid words are submitted.
- **Word Generation**: Loading real 5-letter target words instead of the hardcoded `"WORD"`.
