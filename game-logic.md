# The Lingo Game Logic (ITV Gameshow Rules)

To perfectly replicate the real British "Lingo" TV show, we need to implement the following core mechanics in our backend game engine.

## Game Modes
The game can be played in two modes:
- **Single Player**: Play a single game of Lingo, trying to answer all the quizzes and beat the high score.
- **Multi Player**: Play multiple games of Lingo with real people, the winner is the one with the highest score.

## 1. Game Rounds
The game consists of multiple rounds that scale in difficulty:
- **Round 1**: 4-letter words. Each team has 5 words to guess, each word has 5 attempt. The score will be decent after each attempt.
- **Round 2**: 5-letter words. Each team has 5 words to guess, each word has 5 attempt. The score will be decent after each attempt.
- **Quickfire Round**: A buzzer-based round where both teams compete to guess the same word (often starting as a 6-letter word, with letters revealed one by one).

## 2. Turn Mechanics & Time Limit
- Each team has a maximum of **5 attempts** to guess the mystery word.
- The **first letter** is always revealed at the start of the turn.
- The team has exactly **25 seconds** to submit a guess for *each* attempt.
- If the 25-second timer expires before a valid word is submitted, the team loses that attempt and incurs a **Violation**.

## 3. Violations & Steals
A team's turn ends immediately, and control passes to the opponent (a "Steal") if:
1. They run out of time (25 seconds expire).
2. They submit a word that is not in the dictionary (invalid word).
3. They exhaust all 5 attempts without guessing the word.

**When a Steal occurs:**
- The opposing team gets control of the board.
- **One additional unrevealed letter** is automatically revealed as a bonus for the stealing team.
- The stealing team gets exactly **1 attempt** to guess the word based on the new information, with a fresh 10-second timer.

## 4. Tile Evaluation Algorithm
When a guess is submitted, letters are evaluated left-to-right against the target word:
- 🟩 **Correct (Green)**: The letter is in the word and in the exact correct position.
- 🟨 **Present (Yellow)**: The letter is in the word, but in the wrong position.
- ⬛ **Absent (Slate)**: The letter is not in the word.

**Handling Duplicates (Crucial Lingo Rule):**
If a guess contains duplicate letters (e.g., guessing "APPLE" when the target is "PEARL"):
- The engine must count how many times 'P' appears in the target word (once).
- It evaluates exact matches (Green) first.
- For remaining 'P's in the guess, they only get marked Yellow if there are unmatched 'P's remaining in the target word. Otherwise, the extra 'P's are marked Slate.

## 5. Scoring System
Points are awarded based on how quickly the team guesses the word:
- **Attempt 1**: 500 points
- **Attempt 2**: 400 points
- **Attempt 3**: 300 points
- **Attempt 4**: 200 points
- **Attempt 5**: 100 points
- **Steal (Opposing Team)**: 100 points if they successfully guess it after a violation/failure.

## 6. Required Backend Enhancements for Beta
To achieve this, our `GameService` needs the following updates:
1. **Dictionary Validation**: Integrate a dictionary list to reject invalid words (triggers a steal).
2. **Timer Enforcement**: The backend must track the 10-second timestamp and reject guesses submitted too late.
3. **Turn Passing Logic**: Implement the logic to hand control to `team-2` if `team-1` fails, and auto-reveal a random unrevealed letter.
4. **Scoring Logic**: Update `Team.java` scores based on the attempt number when `isCorrect == true`.
