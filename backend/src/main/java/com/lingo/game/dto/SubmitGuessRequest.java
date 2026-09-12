package com.lingo.game.dto;

public class SubmitGuessRequest {
    private String roomId;
    private String guess;

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getGuess() { return guess; }
    public void setGuess(String guess) { this.guess = guess; }
}
