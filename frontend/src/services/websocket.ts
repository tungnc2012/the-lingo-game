import { Client } from '@stomp/stompjs';

export interface ClientGameRoom {
  roomId: string;
  state: string;
  teams: any[];
  activeTeamId?: string;
  activePlayerId?: string;
  revealedLetters?: string[];
  currentAttempt?: number;
  maxAttempts?: number;
  wordLength?: number;
  timeRemainingMs?: number;
}

export interface GuessResult {
  guess: string;
  evaluation: string[];
  isCorrect: boolean;
}

class WebSocketService {
  private client: Client;
  private currentRoomId: string | null = null;
  private onStateUpdateCb: ((state: ClientGameRoom) => void) | null = null;
  private onGuessResultCb: ((result: GuessResult) => void) | null = null;

  constructor() {
    this.client = new Client({
      brokerURL: `ws://${window.location.host}/ws`,
      reconnectDelay: 5000,
      onConnect: () => {
        console.log('Connected to WebSocket!');
        if (this.currentRoomId) {
          this.subscribeToRoom(this.currentRoomId);
        }
      },
    });
  }

  connect(onStateUpdate: (state: ClientGameRoom) => void, onGuessResult: (result: GuessResult) => void) {
    this.onStateUpdateCb = onStateUpdate;
    this.onGuessResultCb = onGuessResult;
    this.client.activate();
  }

  disconnect() {
    this.client.deactivate();
  }

  joinRoom(roomId: string, playerName: string) {
    this.currentRoomId = roomId;
    
    // Subscribe to room topics if already connected
    if (this.client.connected) {
      this.subscribeToRoom(roomId);
    } else {
      this.client.activate(); // will subscribe onConnect
    }

    // Wait a tick for connection to settle if needed, or just send immediately if connected
    if (this.client.connected) {
        this.client.publish({
            destination: '/app/room.join',
            body: JSON.stringify({ roomId, playerName }),
        });
    } else {
        // Simple retry for prototype
        setTimeout(() => {
            this.client.publish({
                destination: '/app/room.join',
                body: JSON.stringify({ roomId, playerName }),
            });
        }, 1000);
    }
  }

  private subscribeToRoom(roomId: string) {
    this.client.subscribe(`/topic/room/${roomId}`, (message) => {
      const state: ClientGameRoom = JSON.parse(message.body);
      if (this.onStateUpdateCb) {
        this.onStateUpdateCb(state);
      }
    });

    this.client.subscribe(`/topic/room/${roomId}/guess`, (message) => {
      const result: GuessResult = JSON.parse(message.body);
      if (this.onGuessResultCb) {
        this.onGuessResultCb(result);
      }
    });
  }

  submitGuess(roomId: string, guess: string) {
    if (this.client.connected) {
      this.client.publish({
        destination: '/app/room.guess',
        body: JSON.stringify({ roomId, guess }),
      });
    }
  }
}

export const wsService = new WebSocketService();
