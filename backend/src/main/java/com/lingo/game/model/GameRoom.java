package com.lingo.game.model;

import java.util.ArrayList;
import java.util.List;

public class GameRoom {
    private String roomId;
    private GameState state;
    private List<Team> teams;
    private TurnContext turnContext;

    public GameRoom() {
        this.teams = new ArrayList<>();
        this.state = GameState.WAITING_FOR_PLAYERS;
    }

    public GameRoom(String roomId) {
        this();
        this.roomId = roomId;
    }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public GameState getState() { return state; }
    public void setState(GameState state) { this.state = state; }

    public List<Team> getTeams() { return teams; }
    public void setTeams(List<Team> teams) { this.teams = teams; }

    public TurnContext getTurnContext() { return turnContext; }
    public void setTurnContext(TurnContext turnContext) { this.turnContext = turnContext; }
}
