package com.lingo.game.dto;

import com.lingo.game.model.LetterStatus;
import java.util.List;

public class GuessResult {
    private String guess;
    private List<LetterStatus> evaluation;
    private boolean isCorrect;

    public GuessResult() {}

    public GuessResult(String guess, List<LetterStatus> evaluation, boolean isCorrect) {
        this.guess = guess;
        this.evaluation = evaluation;
        this.isCorrect = isCorrect;
    }

    public String getGuess() { return guess; }
    public void setGuess(String guess) { this.guess = guess; }

    public List<LetterStatus> getEvaluation() { return evaluation; }
    public void setEvaluation(List<LetterStatus> evaluation) { this.evaluation = evaluation; }

    public boolean isCorrect() { return isCorrect; }
    public void setCorrect(boolean correct) { isCorrect = correct; }
}
