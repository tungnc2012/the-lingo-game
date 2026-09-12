package com.lingo.game.model;

public class Player {
    private String id;
    private String sessionId;
    private String name;

    public Player() {}

    public Player(String id, String sessionId, String name) {
        this.id = id;
        this.sessionId = sessionId;
        this.name = name;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getSessionId() { return sessionId; }
    public void setSessionId(String sessionId) { this.sessionId = sessionId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
}
