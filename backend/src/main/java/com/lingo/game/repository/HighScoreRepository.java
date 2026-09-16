package com.lingo.game.repository;

import com.lingo.game.model.HighScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HighScoreRepository extends JpaRepository<HighScore, Long> {
    List<HighScore> findTop10ByOrderByScoreDesc();
}
