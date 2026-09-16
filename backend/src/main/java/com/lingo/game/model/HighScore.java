package com.lingo.game.model;

import jakarta.persistence.*;

@Entity
@Table(name = "high_scores")
public class HighScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String username;

    @Column(nullable = false)
    private int score;

    public HighScore() {}

    public HighScore(String username, int score) {
        this.username = username;
        this.score = score;
    }

    public Long getId() { return id; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
}
