package com.lingo.game.dto;

import com.lingo.game.model.LetterStatus;
import java.util.List;

public class GuessResult {
    private String guess;
    private List<LetterStatus> evaluation;
    private boolean isCorrect;
    private String targetWord; // Null unless the turn has ended
    private String violationReason; // Null unless a violation occurred
    /** True when the word was rejected without consuming an attempt (e.g. not in dictionary). */
    private boolean rejected;

    public GuessResult() {}

    public GuessResult(String guess, List<LetterStatus> evaluation, boolean isCorrect) {
        this.guess = guess;
        this.evaluation = evaluation;
        this.isCorrect = isCorrect;
    }
    
    public GuessResult(String guess, List<LetterStatus> evaluation, boolean isCorrect, String targetWord) {
        this.guess = guess;
        this.evaluation = evaluation;
        this.isCorrect = isCorrect;
        this.targetWord = targetWord;
    }

    public String getGuess() { return guess; }
    public void setGuess(String guess) { this.guess = guess; }

    public List<LetterStatus> getEvaluation() { return evaluation; }
    public void setEvaluation(List<LetterStatus> evaluation) { this.evaluation = evaluation; }

    public boolean isCorrect() { return isCorrect; }
    public void setCorrect(boolean correct) { this.isCorrect = correct; }

    public String getTargetWord() { return targetWord; }
    public void setTargetWord(String targetWord) { this.targetWord = targetWord; }

    public String getViolationReason() { return violationReason; }
    public void setViolationReason(String violationReason) { this.violationReason = violationReason; }

    public boolean isRejected() { return rejected; }
    public void setRejected(boolean rejected) { this.rejected = rejected; }
}
