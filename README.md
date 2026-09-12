# The Lingo Game

A real-time multiplayer word-guessing game inspired by the British ITV game show "Lingo". Two teams compete to solve mystery words by guessing letters in the correct positions before the 10-second timer runs out.

## 🏗 Architecture Overview

The application is built using a modern decoupled architecture:

### Frontend (Client)
- **Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Vanilla CSS Modules (Glassmorphism & Game-show aesthetic)
- **Networking**: STOMP over WebSockets (`@stomp/stompjs`)
- **Location**: `/frontend`

### Backend (Server)
- **Framework**: Spring Boot 3.3.1
- **Language**: Java 21
- **Real-Time Engine**: Spring WebSocket & STOMP Message Broker
- **State Management**: In-Memory `ConcurrentHashMap` for active game rooms
- **Location**: `/backend`

---

## 🛠 Prerequisites

To run this application locally without Docker, you will need the following installed on your machine:
1. **Node.js** (v18 or higher) and `npm`
2. **Java Development Kit (JDK) 21**
3. **Gradle** (optional, as the backend includes a Gradle wrapper `gradlew`)

---

## 🚀 Local Development Guide

### 1. Starting the Spring Boot Backend

The backend acts as the central game server and WebSocket broker. It runs on port `8080`.

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Run the application using the Gradle wrapper:
   ```bash
   # On macOS / Linux
   ./gradlew bootRun

   # On Windows
   gradlew.bat bootRun
   ```
3. The server will start, and the WebSocket endpoint will become available at `ws://localhost:8080/ws`.

### 2. Starting the React Frontend

The frontend is served by Vite on port `5173`. It is configured to automatically proxy API and WebSocket requests (`/api` and `/ws`) to the backend running on port `8080` to avoid CORS issues.

1. Open a *new* terminal window and navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the necessary Node packages (first-time setup):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your web browser and navigate to `http://localhost:5173`.

---

## 🎮 How to Play (Testing Locally)

Because the system is configured to jump straight into testing:
1. When you open the frontend, it will automatically connect to the backend and join a default room named `TEST-ROOM`.
2. The game will automatically transition to `ROUND 1` and provide you with a 5-letter target word (e.g., `WORD` internally).
3. The first letter will be revealed. 
4. Type your guesses using either your physical keyboard or the on-screen virtual keyboard.
5. Press **ENTER** to submit.
6. The backend will evaluate your guess in real-time and flip the tiles:
   - 🟩 **Green**: Correct letter, correct position.
   - 🟨 **Amber**: Correct letter, wrong position.
   - ⬛ **Slate**: Letter not in the word.

*Note: The frontend development server supports Hot Module Replacement (HMR), so any changes you make to the React components will instantly reflect in the browser without losing your WebSocket connection state!*
