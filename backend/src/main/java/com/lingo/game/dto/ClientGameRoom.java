package com.lingo.game.dto;

import com.lingo.game.model.GameState;
import com.lingo.game.model.Team;
import java.util.List;

public class ClientGameRoom {
    private String roomId;
    private GameState state;
    private List<Team> teams;
    private String activeTeamId;
    private String activePlayerId;
    private List<Character> revealedLetters;
    private int currentAttempt;
    private int maxAttempts;
    private int wordLength;
    private long timeRemainingMs;

    // Getters and Setters
    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public GameState getState() { return state; }
    public void setState(GameState state) { this.state = state; }

    public List<Team> getTeams() { return teams; }
    public void setTeams(List<Team> teams) { this.teams = teams; }

    public String getActiveTeamId() { return activeTeamId; }
    public void setActiveTeamId(String activeTeamId) { this.activeTeamId = activeTeamId; }

    public String getActivePlayerId() { return activePlayerId; }
    public void setActivePlayerId(String activePlayerId) { this.activePlayerId = activePlayerId; }

    public List<Character> getRevealedLetters() { return revealedLetters; }
    public void setRevealedLetters(List<Character> revealedLetters) { this.revealedLetters = revealedLetters; }

    public int getCurrentAttempt() { return currentAttempt; }
    public void setCurrentAttempt(int currentAttempt) { this.currentAttempt = currentAttempt; }

    public int getMaxAttempts() { return maxAttempts; }
    public void setMaxAttempts(int maxAttempts) { this.maxAttempts = maxAttempts; }

    public int getWordLength() { return wordLength; }
    public void setWordLength(int wordLength) { this.wordLength = wordLength; }

    public long getTimeRemainingMs() { return timeRemainingMs; }
    public void setTimeRemainingMs(long timeRemainingMs) { this.timeRemainingMs = timeRemainingMs; }
}
