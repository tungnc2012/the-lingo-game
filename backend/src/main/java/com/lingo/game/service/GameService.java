package com.lingo.game.service;

import com.lingo.game.dto.ClientGameRoom;
import com.lingo.game.dto.GuessResult;
import com.lingo.game.model.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {
    private final ConcurrentHashMap<String, GameRoom> rooms = new ConcurrentHashMap<>();

    public GameRoom createRoom() {
        String roomId = UUID.randomUUID().toString().substring(0, 8);
        GameRoom room = new GameRoom(roomId);
        // Initialize 2 teams
        room.getTeams().add(new Team("team-1"));
        room.getTeams().add(new Team("team-2"));
        rooms.put(roomId, room);
        return room;
    }

    public GameRoom joinRoom(String roomId, String playerName, String sessionId) {
        GameRoom room = rooms.get(roomId);
        if (room == null) {
            room = new GameRoom(roomId);
            room.getTeams().add(new Team("team-1"));
            room.getTeams().add(new Team("team-2"));
            rooms.put(roomId, room);
        }

        Player newPlayer = new Player(UUID.randomUUID().toString(), sessionId, playerName);
        
        // Add player to a team with less than 2 players
        for (Team team : room.getTeams()) {
            if (team.getPlayers().size() < 2) {
                team.getPlayers().add(newPlayer);
                checkAndStartGame(room);
                return room;
            }
        }
        return room; // Room full
    }

    private void checkAndStartGame(GameRoom room) {
        int totalPlayers = room.getTeams().stream().mapToInt(t -> t.getPlayers().size()).sum();
        if (totalPlayers >= 1 && room.getState() == GameState.WAITING_FOR_PLAYERS) {
            room.setState(GameState.ROUND_1);
            startNewTurn(room, 5); // 5 letters
        }
    }

    private void startNewTurn(GameRoom room, int wordLength) {
        TurnContext context = new TurnContext();
        context.setMaxAttempts(5);
        context.setCurrentAttempt(1);
        context.setTurnStartTime(System.currentTimeMillis());
        // TODO: Randomly select a word from a dictionary
        context.setTargetWord("WORD"); 
        
        List<Character> revealed = new ArrayList<>();
        revealed.add(context.getTargetWord().charAt(0));
        context.setRevealedLetters(revealed);
        
        room.setTurnContext(context);
    }

    public GuessResult processGuess(String roomId, String guess) {
        GameRoom room = rooms.get(roomId);
        if (room == null || room.getTurnContext() == null) return null;
        
        TurnContext ctx = room.getTurnContext();
        String target = ctx.getTargetWord().toUpperCase();
        guess = guess.toUpperCase();
        
        List<LetterStatus> evaluation = new ArrayList<>();
        boolean isCorrect = guess.equals(target);
        
        char[] targetChars = target.toCharArray();
        
        // First pass: CORRECT
        for (int i = 0; i < guess.length(); i++) {
            if (i < target.length() && guess.charAt(i) == targetChars[i]) {
                evaluation.add(LetterStatus.CORRECT);
                targetChars[i] = '#';
            } else {
                evaluation.add(LetterStatus.EMPTY);
            }
        }
        
        // Second pass: PRESENT / ABSENT
        for (int i = 0; i < guess.length(); i++) {
            if (evaluation.get(i) != LetterStatus.CORRECT) {
                char c = guess.charAt(i);
                boolean found = false;
                for (int j = 0; j < targetChars.length; j++) {
                    if (targetChars[j] == c) {
                        evaluation.set(i, LetterStatus.PRESENT);
                        targetChars[j] = '#';
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    evaluation.set(i, LetterStatus.ABSENT);
                }
            }
        }
        
        ctx.setCurrentAttempt(ctx.getCurrentAttempt() + 1);
        
        return new GuessResult(guess, evaluation, isCorrect);
    }

    public ClientGameRoom mapToClientRoom(GameRoom room) {
        ClientGameRoom clientRoom = new ClientGameRoom();
        clientRoom.setRoomId(room.getRoomId());
        clientRoom.setState(room.getState());
        clientRoom.setTeams(room.getTeams());
        if (room.getTurnContext() != null) {
            clientRoom.setRevealedLetters(room.getTurnContext().getRevealedLetters());
            clientRoom.setCurrentAttempt(room.getTurnContext().getCurrentAttempt());
            clientRoom.setMaxAttempts(room.getTurnContext().getMaxAttempts());
            clientRoom.setWordLength(room.getTurnContext().getTargetWord().length());
            long elapsed = System.currentTimeMillis() - room.getTurnContext().getTurnStartTime();
            clientRoom.setTimeRemainingMs(Math.max(0, 10000 - elapsed));
        }
        return clientRoom;
    }

    public GameRoom getRoom(String roomId) {
        return rooms.get(roomId);
    }
}
