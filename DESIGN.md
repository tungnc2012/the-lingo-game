# The Lingo Game

A modern, container-native, cloud-ready multiplayer word game built with Spring Boot and React.

## 📋 Table of Contents

- [Overview](#-overview)
  - [Gameplay](#-gameplay)
  - [Game State Machine & Data Model](#-game-state-machine--data-model)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
  - [Prerequisites](#-prerequisites)
  - [Installation](#-installation)
  - [Running Locally](#-running-locally)
- [Deployment](#-deployment)
  - [Docker Compose](#-docker-compose)
- [Configuration](#-configuration)
- [Observability](#-observability)
  - [Metrics](#-metrics)
  - [Logging](#-logging)
  - [Tracing](#-tracing)
- [Testing](#-testing)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

## 📖 Overview

**The Lingo Game** is a British game show. The original iteration of the programme was made by Thames Television and Action Time for ITV and is based on the American version. The game in this repository is inspired by the British game show on ITV1.

## 🎮 Gameplay

Teams of two compete to solve mystery words. Given the first letter, they alternate turns and have 5 attempts (10 seconds per attempt). Feedback indicates correct letters and correct positions. Invalid/missed words pass control to the opposing team.

- **Round 1:** Teams solve four 4-letter words (£200 each), and a 9-letter Puzzleword (starts at £300, decreasing by £60 per revealed letter).
- **Round 2:** Teams solve three 5-letter words (£300 each), and a 10-letter Puzzleword (starts at £500, decreasing by £80 per revealed letter). Opponents can steal failed words. The lowest-scoring team is eliminated.
- **Round 3:** Remaining team members split duties between 4-letter and 5-letter words (up to £500 each, decreasing £50 per attempt). Followed by 11-letter and 12-letter Puzzlewords (up to £750, decreasing £130 per revealed letter). Failures can be stolen. The leading team advances to the Final.
- **Final:** The winning team has 90 seconds to solve up to three words. They must solve a 4-letter word for half their winnings, then a 5-letter word for full winnings, and finally a 6-letter word to double their winnings (or risk it all on a 7-letter word for a £15,000 jackpot).

## 🔄 Game State Machine & Data Model

### 1. Game States
The game progresses through these high-level states:
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

### 4. WebSocket Events
Communication will happen over WebSockets with JSON payloads.

**Client -> Server (Actions):**
- `JOIN_ROOM`: `{ roomId, playerName }`
- `SUBMIT_GUESS`: `{ guess: "APPLE" }`
- `PASS_WORD`: (Used only in the Final Round)

**Server -> Client (Broadcasts):**
- `GAME_STATE_SYNC`: Full snapshot of the game.
- `TURN_STARTED`: `{ activePlayerId, timeLimitSeconds: 10 }`
- `GUESS_RESULT`: `{ guess: "APPLE", evaluation: ["CORRECT", "PRESENT", "ABSENT", "ABSENT", "ABSENT"] }`
- `ERROR`: `{ message: "Invalid word" }`


## 🎯 Features

- **Multiplayer Gameplay**: Players can join game rooms and compete together
- **Player versus AI**: Player can play against AI in multiple level(easy, medium, hard)
- **Real-time Updates**: WebSocket for real-time game state synchronization
- **User Authentication**: Secure user registration and login
- **Game Features**:
  - Word guessing with hints
  - Leaderboards
  - Game rounds and scoring
- **Cloud-Native**: Designed for containerized environments
- **Observability**: Integrated metrics, logs, and traces
