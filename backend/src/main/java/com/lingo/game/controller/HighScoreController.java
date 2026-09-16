package com.lingo.game.controller;

import com.lingo.game.model.HighScore;
import com.lingo.game.repository.HighScoreRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/highscores")
public class HighScoreController {

    private final HighScoreRepository highScoreRepository;

    public HighScoreController(HighScoreRepository highScoreRepository) {
        this.highScoreRepository = highScoreRepository;
    }

    @GetMapping
    public List<HighScore> getHighScores() {
        return highScoreRepository.findTop10ByOrderByScoreDesc();
    }

    @PostMapping
    public HighScore saveHighScore(@RequestBody HighScore highScore) {
        return highScoreRepository.save(highScore);
    }
}
