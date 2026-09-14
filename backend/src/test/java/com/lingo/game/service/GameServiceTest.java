package com.lingo.game.service;

import com.lingo.game.dto.GuessResult;
import com.lingo.game.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.*;

/**
 * Unit tests for GameService covering:
 * - Tile evaluation (including duplicate handling per §4)
 * - Scoring per attempt (§5)
 * - Violation handling: timeout, invalid word, exhausted attempts (§3)
 * - Steal setup and steal success/failure
 * - revealedLetters serialization (null-safety)
 */
@ExtendWith(MockitoExtension.class)
class GameServiceTest {

    @Mock
    private DictionaryService dictionaryService;

    private GameService gameService;
    private GameRoom room;

    @BeforeEach
    void setUp() {
        gameService = new GameService(dictionaryService);

        // Build a room manually (bypass joinRoom auto-start logic)
        room = new GameRoom("test-room");
        room.getTeams().add(new Team("team-1"));
        room.getTeams().add(new Team("team-2"));
        room.setState(GameState.ROUND_1);
        room.setActiveTeamId("team-1");
    }

    /** Set up a turn context with a fixed target word (no random needed). */
    private void setUpTurn(String targetWord) {
        TurnContext ctx = new TurnContext();
        ctx.setTargetWord(targetWord);
        ctx.setCurrentAttempt(1);
        ctx.setMaxAttempts(5);
        ctx.setTimeLimitMs(20_000);
        ctx.setTurnStartTime(System.currentTimeMillis());
        ctx.setStealAttempt(false);
        ctx.setActiveTeamId("team-1");
        ctx.getRevealedLetters().add(targetWord.charAt(0)); // reveal first letter
        room.setTurnContext(ctx);

        // Make the gameService aware of this room by injecting it
        // (we use the package-private field via a helper or test the service methods directly)
        injectRoom(room);

        when(dictionaryService.isValidWord(any())).thenReturn(true);
    }

    /** Inject a room directly into the service's rooms map via reflection. */
    private void injectRoom(GameRoom r) {
        try {
            var field = GameService.class.getDeclaredField("rooms");
            field.setAccessible(true);
            @SuppressWarnings("unchecked")
            var rooms = (java.util.concurrent.ConcurrentHashMap<String, GameRoom>) field.get(gameService);
            rooms.put(r.getRoomId(), r);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 4 — Tile Evaluation
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("All letters correct → all CORRECT")
    void correctGuess_allGreen() {
        setUpTurn("CRANE");
        GuessResult result = gameService.processGuess("test-room", "CRANE");

        assertThat(result.isCorrect()).isTrue();
        assertThat(result.getTargetWord()).isEqualTo("CRANE");
        assertThat(result.getEvaluation()).containsExactly(
            LetterStatus.CORRECT, LetterStatus.CORRECT, LetterStatus.CORRECT,
            LetterStatus.CORRECT, LetterStatus.CORRECT
        );
    }

    @Test
    @DisplayName("All letters wrong position → all PRESENT (anagram)")
    void presentGuess_allYellow() {
        setUpTurn("CRANE");
        // NACRE has the same letters in different positions
        GuessResult result = gameService.processGuess("test-room", "NACRE");

        assertThat(result.isCorrect()).isFalse();
        assertThat(result.getEvaluation()).containsExactly(
            LetterStatus.PRESENT, LetterStatus.PRESENT, LetterStatus.PRESENT,
            LetterStatus.PRESENT, LetterStatus.PRESENT
        );
    }

    @Test
    @DisplayName("All letters absent → all ABSENT")
    void absentGuess_allSlate() {
        setUpTurn("CRANE");
        // THUMP shares no letters with CRANE
        GuessResult result = gameService.processGuess("test-room", "THUMP");

        assertThat(result.isCorrect()).isFalse();
        assertThat(result.getEvaluation()).containsExactly(
            LetterStatus.ABSENT, LetterStatus.ABSENT, LetterStatus.ABSENT,
            LetterStatus.ABSENT, LetterStatus.ABSENT
        );
    }

    @Test
    @DisplayName("Duplicate letter: guess 'APPLE', target 'PEARL' — only first P is yellow, extra P is absent")
    void duplicateLetter_exampleFromSpec() {
        setUpTurn("PEARL");
        // A P P L E
        // P: target has 1 P. In APPLE: pos 1 is P (wrong pos → PRESENT), pos 2 is P (no P left → ABSENT)
        // A: target has A. pos 0 in APPLE = A, pos 0 in PEARL = P → A is present but wrong pos
        // L: target has L. pos 3 in APPLE = L, pos 3 in PEARL = R → L is present
        // E: target has E. pos 4 in APPLE = E, pos 4 in PEARL = L → E is present

        GuessResult result = gameService.processGuess("test-room", "APPLE");

        List<LetterStatus> eval = result.getEvaluation();
        assertThat(eval.get(0)).isEqualTo(LetterStatus.PRESENT);  // A is in PEARL
        assertThat(eval.get(1)).isEqualTo(LetterStatus.PRESENT);  // P (first) is in PEARL
        assertThat(eval.get(2)).isEqualTo(LetterStatus.ABSENT);   // P (extra) — PEARL has only 1 P
        assertThat(eval.get(3)).isEqualTo(LetterStatus.PRESENT);  // L is in PEARL
        assertThat(eval.get(4)).isEqualTo(LetterStatus.PRESENT);  // E is in PEARL
    }

    @Test
    @DisplayName("Green takes priority: if a letter is green, its duplicate elsewhere is still evaluated independently")
    void duplicateLetter_greenTakesPriority() {
        setUpTurn("ARRAY");
        // Guess RADAR: R-A-D-A-R
        // Target ARRAY: A-R-R-A-Y
        // Pos 0: R in RADAR vs A in ARRAY → PRESENT (R is in ARRAY)
        // Pos 1: A in RADAR vs R in ARRAY → PRESENT (A is in ARRAY)
        // Pos 2: D vs R → ABSENT
        // Pos 3: A in RADAR vs A in ARRAY → CORRECT
        // Pos 4: R in RADAR vs Y in ARRAY → one R left? ARRAY has R at pos1,2. After greens: pos3(A)=CORRECT.
        //   Pass1: only pos3 is green (A==A). targetChars = [A,R,R,#,Y] after marking.
        //   Pass2: pos0 R → scans ARRAY → finds R at pos1 → PRESENT, mark → [A,#,R,#,Y]
        //          pos1 A → scans → finds A at pos0 → PRESENT, mark → [#,#,R,#,Y]
        //          pos2 D → not found → ABSENT
        //          pos4 R → finds R at pos2 → PRESENT

        GuessResult result = gameService.processGuess("test-room", "RADAR");
        List<LetterStatus> eval = result.getEvaluation();
        assertThat(eval.get(2)).isEqualTo(LetterStatus.ABSENT);  // D not in ARRAY
        assertThat(eval.get(3)).isEqualTo(LetterStatus.CORRECT); // A matches at pos 3
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 5 — Scoring
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Correct on attempt 1 → 500 points")
    void scoring_attempt1_500pts() {
        setUpTurn("CRANE");
        gameService.processGuess("test-room", "CRANE");
        assertThat(room.getTeamById("team-1").getScore()).isEqualTo(500);
    }

    @Test
    @DisplayName("Correct on attempt 2 → 400 points")
    void scoring_attempt2_400pts() {
        setUpTurn("CRANE");
        gameService.processGuess("test-room", "THUMP"); // wrong guess, attempt 1
        gameService.processGuess("test-room", "CRANE"); // correct on attempt 2
        assertThat(room.getTeamById("team-1").getScore()).isEqualTo(400);
    }

    @Test
    @DisplayName("Correct on attempt 5 → 100 points")
    void scoring_attempt5_100pts() {
        setUpTurn("CRANE");
        for (int i = 0; i < 4; i++) {
            gameService.processGuess("test-room", "THUMP");
        }
        gameService.processGuess("test-room", "CRANE");
        assertThat(room.getTeamById("team-1").getScore()).isEqualTo(100);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // § 3 — Violations and Steals
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Invalid word → violation returned, steal set up")
    void violation_invalidWord_triggerSteal() {
        setUpTurn("CRANE");
        when(dictionaryService.isValidWord("ZZZZZ")).thenReturn(false);

        GuessResult result = gameService.processGuess("test-room", "ZZZZZ");

        assertThat(result.getViolationReason()).isEqualTo("INVALID_WORD");
        assertThat(result.isCorrect()).isFalse();
        assertThat(result.getTargetWord()).isNull(); // Not revealed yet, steal still in play

        TurnContext ctx = room.getTurnContext();
        assertThat(ctx.isStealAttempt()).isTrue();
        assertThat(ctx.getActiveTeamId()).isEqualTo("team-2");
        assertThat(ctx.getTimeLimitMs()).isEqualTo(10_000);
        // currentAttempt should be 2 (incremented before violation)
        assertThat(ctx.getCurrentAttempt()).isEqualTo(2);
    }

    @Test
    @DisplayName("Timeout (empty guess) → violation returned, steal set up")
    void violation_timeout_triggerSteal() {
        setUpTurn("CRANE");

        GuessResult result = gameService.processGuess("test-room", "");

        assertThat(result.getViolationReason()).isEqualTo("TIME_EXPIRED");
        assertThat(room.getTurnContext().isStealAttempt()).isTrue();
        assertThat(room.getTurnContext().getActiveTeamId()).isEqualTo("team-2");
    }

    @Test
    @DisplayName("After violation: an additional letter is revealed")
    void violation_revealAdditionalLetter() {
        setUpTurn("CRANE");
        // Initially only position 0 (C) is revealed
        assertThat(room.getTurnContext().getRevealedLetters()).hasSize(1);

        gameService.processGuess("test-room", ""); // timeout → violation

        // After violation, exactly one more letter should be revealed
        long nonNullRevealed = room.getTurnContext().getRevealedLetters().stream()
            .filter(c -> c != null)
            .count();
        assertThat(nonNullRevealed).isEqualTo(2);
    }

    @Test
    @DisplayName("Steal team guesses correctly → 100 points for steal team")
    void steal_success_100pts() {
        setUpTurn("CRANE");
        gameService.processGuess("test-room", ""); // timeout → steal for team-2

        // Now team-2 is the active steal team
        GuessResult stealResult = gameService.processGuess("test-room", "CRANE");

        assertThat(stealResult.isCorrect()).isTrue();
        assertThat(stealResult.getTargetWord()).isEqualTo("CRANE");
        assertThat(room.getTeamById("team-2").getScore()).isEqualTo(100);
        assertThat(room.getTeamById("team-1").getScore()).isEqualTo(0);
    }

    @Test
    @DisplayName("Steal team guesses wrong → turn over, word revealed")
    void steal_failure_wordRevealed() {
        setUpTurn("CRANE");
        gameService.processGuess("test-room", ""); // timeout → steal for team-2

        GuessResult stealResult = gameService.processGuess("test-room", "THUMP");

        assertThat(stealResult.isCorrect()).isFalse();
        assertThat(stealResult.getTargetWord()).isEqualTo("CRANE"); // word revealed
        assertThat(room.getTeamById("team-1").getScore()).isEqualTo(0);
        assertThat(room.getTeamById("team-2").getScore()).isEqualTo(0);
    }

    @Test
    @DisplayName("Steal team timeout → turn over, word revealed")
    void steal_timeout_wordRevealed() {
        setUpTurn("CRANE");
        gameService.processGuess("test-room", ""); // team-1 timeout → steal for team-2

        // team-2 also sends empty (timeout)
        GuessResult result = gameService.processGuess("test-room", "");

        assertThat(result.getTargetWord()).isEqualTo("CRANE");
        assertThat(result.isCorrect()).isFalse();
    }

    @Test
    @DisplayName("Attempts exhausted → violation triggers steal if grid rows remain")
    void attemptsExhausted_triggerSteal() {
        setUpTurn("CRANE");
        // Make 5 wrong guesses (uses all attempts)
        for (int i = 0; i < 5; i++) {
            GuessResult r = gameService.processGuess("test-room", "THUMP");
            if (r.getViolationReason() != null) break; // Steal triggered
        }

        assertThat(room.getTurnContext().isStealAttempt()).isTrue();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // revealedLetters serialization (null-safety)
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("mapToClientRoom: revealedLetters contains no null values (only '' or single-char strings)")
    void mapToClientRoom_noNullsInRevealedLetters() {
        setUpTurn("CRANE");
        gameService.processGuess("test-room", ""); // trigger violation → reveals extra letter

        var clientRoom = gameService.mapToClientRoom(room);
        assertThat(clientRoom.getRevealedLetters())
            .doesNotContainNull()
            .hasSize(5); // fixed-size array equal to word length
    }

    @Test
    @DisplayName("mapToClientRoom: initially only position 0 is revealed")
    void mapToClientRoom_initialReveal_firstLetterOnly() {
        setUpTurn("CRANE");
        var clientRoom = gameService.mapToClientRoom(room);

        List<String> revealed = clientRoom.getRevealedLetters();
        assertThat(revealed.get(0)).isEqualTo("C");
        assertThat(revealed.get(1)).isEqualTo("");
        assertThat(revealed.get(2)).isEqualTo("");
        assertThat(revealed.get(3)).isEqualTo("");
        assertThat(revealed.get(4)).isEqualTo("");
    }

    @Test
    @DisplayName("mapToClientRoom: after violation, 2 positions are revealed (non-empty strings)")
    void mapToClientRoom_afterViolation_twoRevealed() {
        setUpTurn("CRANE");
        gameService.processGuess("test-room", ""); // timeout → reveals 2nd letter

        var clientRoom = gameService.mapToClientRoom(room);
        long nonEmpty = clientRoom.getRevealedLetters().stream()
            .filter(s -> !s.isEmpty())
            .count();
        assertThat(nonEmpty).isEqualTo(2);
    }
}
