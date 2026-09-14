package com.lingo.game.model;

import java.util.ArrayList;
import java.util.List;

public class TurnContext {
    private String activeTeamId;
    private String activePlayerId;
    private String targetWord;
    private List<Character> revealedLetters;
    private int currentAttempt;
    private int maxAttempts;
    private long turnStartTime;
    
    // Steal mechanics
    private boolean stealAttempt;
    private String stealingTeamId;
    private int timeLimitMs; // 20000 for normal, 10000 for steal

    public TurnContext() {
        this.revealedLetters = new ArrayList<>();
        this.currentAttempt = 1;
        this.maxAttempts = 5;
        this.stealAttempt = false;
        this.timeLimitMs = 20000;
    }

    public String getActiveTeamId() { return activeTeamId; }
    public void setActiveTeamId(String activeTeamId) { this.activeTeamId = activeTeamId; }

    public String getActivePlayerId() { return activePlayerId; }
    public void setActivePlayerId(String activePlayerId) { this.activePlayerId = activePlayerId; }

    public String getTargetWord() { return targetWord; }
    public void setTargetWord(String targetWord) { this.targetWord = targetWord; }

    public List<Character> getRevealedLetters() { return revealedLetters; }
    public void setRevealedLetters(List<Character> revealedLetters) { this.revealedLetters = revealedLetters; }

    public int getCurrentAttempt() { return currentAttempt; }
    public void setCurrentAttempt(int currentAttempt) { this.currentAttempt = currentAttempt; }

    public int getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }

    public long getTurnStartTime() { return turnStartTime; }
    public void setTurnStartTime(long turnStartTime) { this.turnStartTime = turnStartTime; }

    public boolean isStealAttempt() { return stealAttempt; }
    public void setStealAttempt(boolean stealAttempt) { this.stealAttempt = stealAttempt; }

    public String getStealingTeamId() { return stealingTeamId; }
    public void setStealingTeamId(String stealingTeamId) { this.stealingTeamId = stealingTeamId; }

    public int getTimeLimitMs() { return timeLimitMs; }
    public void setTimeLimitMs(int timeLimitMs) { this.timeLimitMs = timeLimitMs; }

    /**
     * Check if the current guess is being submitted past the time limit.
     */
    public boolean isTimedOut() {
        long elapsed = System.currentTimeMillis() - turnStartTime;
        return elapsed > timeLimitMs + 2000; // 2s grace period for network latency
    }
}
