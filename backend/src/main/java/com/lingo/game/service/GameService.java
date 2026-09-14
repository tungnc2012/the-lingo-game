package com.lingo.game.service;

import com.lingo.game.dto.ClientGameRoom;
import com.lingo.game.dto.GuessResult;
import com.lingo.game.model.*;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GameService {
    private final ConcurrentHashMap<String, GameRoom> rooms = new ConcurrentHashMap<>();
    private final DictionaryService dictionaryService;

    // Scoring table: points by attempt number (1-indexed)
    private static final int[] SCORE_BY_ATTEMPT = {0, 500, 400, 300, 200, 100};
    private static final int STEAL_SCORE = 100;
    private static final int NORMAL_TIME_LIMIT_MS = 20000;
    private static final int STEAL_TIME_LIMIT_MS = 10000;
    // The grid only has MAX_GRID_ROWS rows; steal requires one free row
    private static final int MAX_GRID_ROWS = 5;

    public GameService(DictionaryService dictionaryService) {
        this.dictionaryService = dictionaryService;
    }

    public GameRoom createRoom() {
        String roomId = UUID.randomUUID().toString().substring(0, 8);
        GameRoom room = new GameRoom(roomId);
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
        for (Team team : room.getTeams()) {
            if (team.getPlayers().size() < 2) {
                team.getPlayers().add(newPlayer);
                checkAndStartGame(room);
                return room;
            }
        }
        return room;
    }

    private void checkAndStartGame(GameRoom room) {
        int totalPlayers = room.getTeams().stream().mapToInt(t -> t.getPlayers().size()).sum();
        if (totalPlayers >= 1 && room.getState() == GameState.WAITING_FOR_PLAYERS) {
            room.setState(GameState.ROUND_1);
            room.setActiveTeamId("team-1");
            startNewTurn(room, 5);
        }
    }

    public void startNewTurn(GameRoom room, int wordLength) {
        TurnContext context = new TurnContext();
        context.setMaxAttempts(MAX_GRID_ROWS);
        context.setCurrentAttempt(1);
        context.setTurnStartTime(System.currentTimeMillis());
        context.setTimeLimitMs(NORMAL_TIME_LIMIT_MS);
        context.setStealAttempt(false);
        context.setActiveTeamId(room.getActiveTeamId());

        String randomWord = dictionaryService.getRandomWord(wordLength);
        context.setTargetWord(randomWord);

        // Reveal the first letter (Lingo rule §2)
        List<Character> revealed = new ArrayList<>();
        revealed.add(context.getTargetWord().charAt(0));
        context.setRevealedLetters(revealed);

        room.setTurnContext(context);
        room.setWordsPlayedInRound(room.getWordsPlayedInRound() + 1);
    }

    /**
     * Process a guess submission.
     *
     * Key design: currentAttempt is ALWAYS incremented BEFORE calling handleViolation,
     * so the frontend can rely on it to determine which row the steal occupies.
     */
    public GuessResult processGuess(String roomId, String guess) {
        GameRoom room = rooms.get(roomId);
        if (room == null || room.getTurnContext() == null) return null;

        TurnContext ctx = room.getTurnContext();
        String target = ctx.getTargetWord().toUpperCase();

        // --- Timer enforcement ---
        if (ctx.isTimedOut()) {
            ctx.setCurrentAttempt(ctx.getCurrentAttempt() + 1);
            return handleViolation(room, "TIME_EXPIRED");
        }

        // --- Empty/null guess signals a client-side timeout ---
        if (guess == null || guess.isBlank()) {
            ctx.setCurrentAttempt(ctx.getCurrentAttempt() + 1);
            return handleViolation(room, "TIME_EXPIRED");
        }

        guess = guess.toUpperCase().trim();

        // --- Length validation (soft reject — don't consume attempt) ---
        if (guess.length() != target.length()) {
            GuessResult rejected = new GuessResult("", createAbsentEvaluation(target.length()), false, null);
            rejected.setRejected(true);
            rejected.setViolationReason("INVALID_LENGTH");
            return rejected;
        }

        // --- Dictionary validation removed per user request to allow any 5-letter guess ---

        // --- Tile evaluation (§4) ---
        List<LetterStatus> evaluation = evaluateTiles(guess, target);
        boolean isCorrect = guess.equals(target);

        if (isCorrect) {
            // --- Scoring (§5) ---
            if (ctx.isStealAttempt()) {
                Team stealingTeam = room.getTeamById(ctx.getStealingTeamId());
                if (stealingTeam != null) stealingTeam.addScore(STEAL_SCORE);
            } else {
                int attempt = ctx.getCurrentAttempt();
                int points = (attempt >= 1 && attempt <= 5) ? SCORE_BY_ATTEMPT[attempt] : 100;
                Team activeTeam = room.getTeamById(ctx.getActiveTeamId());
                if (activeTeam != null) activeTeam.addScore(points);
            }
            return new GuessResult(guess, evaluation, true, target);
        }

        // --- Wrong guess: advance attempt ---
        ctx.setCurrentAttempt(ctx.getCurrentAttempt() + 1);
        ctx.setTurnStartTime(System.currentTimeMillis());

        // Steal attempt failed → word is done
        if (ctx.isStealAttempt()) {
            return new GuessResult(guess, evaluation, false, target);
        }

        // All attempts exhausted → turn over (no steal, just reveal word)
        if (ctx.getCurrentAttempt() > ctx.getMaxAttempts()) {
            return new GuessResult(guess, evaluation, false, target);
        }

        return new GuessResult(guess, evaluation, false, null);
    }

    /**
     * Handle a violation. By the time this is called, currentAttempt has already
     * been incremented by processGuess to point at the NEXT (steal) row.
     */
    private GuessResult handleViolation(GameRoom room, String reason) {
        TurnContext ctx = room.getTurnContext();
        String target = ctx.getTargetWord().toUpperCase();

        // If this violation happened on the last attempt, end the game/reveal word
        if (ctx.getCurrentAttempt() > ctx.getMaxAttempts()) {
            return new GuessResult("", createAbsentEvaluation(target.length()), false, target);
        }

        // Do not trigger a steal. Just consume the attempt, reset the timer, and let the user continue on the next row.
        ctx.setTurnStartTime(System.currentTimeMillis());

        GuessResult result = new GuessResult("", createAbsentEvaluation(target.length()), false, null);
        result.setViolationReason(reason);
        return result;
    }

    /**
     * Reveal one random unrevealed position in the target word.
     * Uses a fixed-size array internally to avoid null-padding issues.
     */
    private void revealAdditionalLetter(TurnContext ctx, String target) {
        // Ensure the revealed list is exactly word-length, with null for unrevealed
        List<Character> revealed = ctx.getRevealedLetters();
        while (revealed.size() < target.length()) {
            revealed.add(null);
        }

        List<Integer> unrevealed = new ArrayList<>();
        for (int i = 0; i < target.length(); i++) {
            if (revealed.get(i) == null) {
                unrevealed.add(i);
            }
        }

        if (!unrevealed.isEmpty()) {
            // Skip position 0 — it's always the initial reveal; pick from the rest
            List<Integer> candidates = unrevealed.size() > 1
                ? unrevealed.subList(1, unrevealed.size())
                : unrevealed;
            int randomPos = candidates.get((int) (Math.random() * candidates.size()));
            revealed.set(randomPos, target.charAt(randomPos));
        }
    }

    /**
     * Tile evaluation (§4) with proper duplicate handling.
     */
    private List<LetterStatus> evaluateTiles(String guess, String target) {
        List<LetterStatus> evaluation = new ArrayList<>();
        char[] targetChars = target.toCharArray();

        // First pass: mark CORRECT
        for (int i = 0; i < target.length(); i++) {
            if (i < guess.length() && guess.charAt(i) == targetChars[i]) {
                evaluation.add(LetterStatus.CORRECT);
                targetChars[i] = '#';
            } else {
                evaluation.add(LetterStatus.EMPTY);
            }
        }

        // Second pass: mark PRESENT or ABSENT
        for (int i = 0; i < target.length(); i++) {
            if (evaluation.get(i) != LetterStatus.CORRECT) {
                char c = i < guess.length() ? guess.charAt(i) : ' ';
                boolean found = false;
                for (int j = 0; j < targetChars.length; j++) {
                    if (targetChars[j] == c && c != ' ') {
                        evaluation.set(i, LetterStatus.PRESENT);
                        targetChars[j] = '#';
                        found = true;
                        break;
                    }
                }
                if (!found) evaluation.set(i, LetterStatus.ABSENT);
            }
        }

        return evaluation;
    }

    private List<LetterStatus> createAbsentEvaluation(int length) {
        List<LetterStatus> eval = new ArrayList<>();
        for (int i = 0; i < length; i++) eval.add(LetterStatus.ABSENT);
        return eval;
    }

    public ClientGameRoom mapToClientRoom(GameRoom room) {
        return mapToClientRoom(room, null);
    }

    public ClientGameRoom mapToClientRoom(GameRoom room, String violationReason) {
        ClientGameRoom clientRoom = new ClientGameRoom();
        clientRoom.setRoomId(room.getRoomId());
        clientRoom.setState(room.getState());
        clientRoom.setTeams(room.getTeams());
        clientRoom.setActiveTeamId(room.getActiveTeamId());

        if (room.getTurnContext() != null) {
            TurnContext ctx = room.getTurnContext();
            clientRoom.setCurrentAttempt(ctx.getCurrentAttempt());
            clientRoom.setMaxAttempts(ctx.getMaxAttempts());
            clientRoom.setWordLength(ctx.getTargetWord().length());
            clientRoom.setStealAttempt(ctx.isStealAttempt());

            // Convert sparse List<Character> to a fixed-size List<String>.
            // "" represents an unrevealed position; a single letter represents revealed.
            // This avoids null values being serialized as JSON null and rendered as "null" in JS.
            int wordLen = ctx.getTargetWord().length();
            List<String> revealedArray = new ArrayList<>(Collections.nCopies(wordLen, ""));
            List<Character> revealed = ctx.getRevealedLetters();
            if (revealed != null) {
                for (int i = 0; i < Math.min(revealed.size(), wordLen); i++) {
                    if (revealed.get(i) != null) {
                        revealedArray.set(i, String.valueOf(revealed.get(i)));
                    }
                }
            }
            clientRoom.setRevealedLetters(revealedArray);

            long elapsed = System.currentTimeMillis() - ctx.getTurnStartTime();
            clientRoom.setTimeRemainingMs(Math.max(0, ctx.getTimeLimitMs() - elapsed));
        }

        if (violationReason != null) {
            clientRoom.setViolationReason(violationReason);
        }

        return clientRoom;
    }

    public GameRoom getRoom(String roomId) {
        return rooms.get(roomId);
    }
}
