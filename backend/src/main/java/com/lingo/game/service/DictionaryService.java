package com.lingo.game.service;

import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.*;

/**
 * Service responsible for dictionary validation and random word generation.
 * Loads word lists from classpath resources on startup.
 */
@Service
public class DictionaryService {

    private final Set<String> fiveLetterWords = new HashSet<>();
    private final List<String> fiveLetterWordList = new ArrayList<>();
    private final Random random = new Random();

    @PostConstruct
    public void init() {
        loadWordFile("words_5.txt", fiveLetterWords, fiveLetterWordList);
        System.out.println("Dictionary loaded: " + fiveLetterWordList.size() + " five-letter words");
    }

    private void loadWordFile(String filename, Set<String> wordSet, List<String> wordList) {
        try {
            ClassPathResource resource = new ClassPathResource(filename);
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream()))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    String word = line.trim().toUpperCase();
                    if (!word.isEmpty()) {
                        wordSet.add(word);
                        wordList.add(word);
                    }
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to load dictionary file: " + filename + " — " + e.getMessage());
            // Fallback: add a minimal set so the game doesn't break
            String[] fallback = {"APPLE", "BERRY", "GRAPE", "LEMON", "MELON", "PEACH", "PEARL",
                    "SOUND", "COLOR", "LIGHT", "WATER", "EARTH", "HEART", "SMILE", "TRAIN", "HOUSE"};
            for (String w : fallback) {
                wordSet.add(w);
                wordList.add(w);
            }
        }
    }

    /**
     * Check if a word is a valid English word in the dictionary.
     */
    public boolean isValidWord(String word) {
        if (word == null || word.isBlank()) return false;
        return fiveLetterWords.contains(word.toUpperCase().trim());
    }

    /**
     * Get a random word of the specified length.
     * Currently only supports 5-letter words.
     */
    public String getRandomWord(int length) {
        if (length == 5 && !fiveLetterWordList.isEmpty()) {
            return fiveLetterWordList.get(random.nextInt(fiveLetterWordList.size()));
        }
        // Fallback
        return "LINGO";
    }
}
