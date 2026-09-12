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

    public TurnContext() {
        this.revealedLetters = new ArrayList<>();
        this.currentAttempt = 1;
        this.maxAttempts = 5;
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
}
