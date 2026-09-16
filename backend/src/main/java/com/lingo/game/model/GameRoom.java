package com.lingo.game.model;

import java.util.ArrayList;
import java.util.List;

public class GameRoom {
    private String roomId;
    private GameState state;
    private List<Team> teams;
    private TurnContext turnContext;
    private String activeTeamId;
    private int wordsPlayedInRound;
    private boolean isSinglePlayer;

    public GameRoom() {
        this.teams = new ArrayList<>();
        this.state = GameState.WAITING_FOR_PLAYERS;
        this.activeTeamId = "team-1";
        this.wordsPlayedInRound = 0;
    }

    public GameRoom(String roomId) {
        this();
        this.roomId = roomId;
        this.isSinglePlayer = roomId != null && roomId.startsWith("single-");
    }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public GameState getState() { return state; }
    public void setState(GameState state) { this.state = state; }

    public List<Team> getTeams() { return teams; }
    public void setTeams(List<Team> teams) { this.teams = teams; }

    public TurnContext getTurnContext() { return turnContext; }
    public void setTurnContext(TurnContext turnContext) { this.turnContext = turnContext; }

    public String getActiveTeamId() { return activeTeamId; }
    public void setActiveTeamId(String activeTeamId) { this.activeTeamId = activeTeamId; }

    public int getWordsPlayedInRound() { return wordsPlayedInRound; }
    public void setWordsPlayedInRound(int wordsPlayedInRound) { this.wordsPlayedInRound = wordsPlayedInRound; }

    public boolean isSinglePlayer() { return isSinglePlayer; }
    public void setSinglePlayer(boolean isSinglePlayer) { this.isSinglePlayer = isSinglePlayer; }

    /**
     * Get the opposing team's ID.
     */
    public String getOpposingTeamId() {
        return "team-1".equals(activeTeamId) ? "team-2" : "team-1";
    }

    /**
     * Find a team by its ID.
     */
    public Team getTeamById(String teamId) {
        return teams.stream()
                .filter(t -> t.getId().equals(teamId))
                .findFirst()
                .orElse(null);
    }
}
