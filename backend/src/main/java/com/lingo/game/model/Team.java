package com.lingo.game.model;

import java.util.ArrayList;
import java.util.List;

public class Team {
    private String id;
    private List<Player> players;
    private int score;

    public Team() {
        this.players = new ArrayList<>();
        this.score = 0;
    }

    public Team(String id) {
        this();
        this.id = id;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public List<Player> getPlayers() { return players; }
    public void setPlayers(List<Player> players) { this.players = players; }

    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }

    public void addScore(int points) {
        this.score += points;
    }
}
