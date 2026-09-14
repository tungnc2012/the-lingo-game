public class TestLogic {
    public static void main(String[] args) {
        int currentAttempt = 1;
        int maxAttempts = 5;
        
        for (int i = 1; i <= 5; i++) {
            currentAttempt++; // --- Wrong guess: advance attempt ---
            boolean isGameOver = currentAttempt > maxAttempts;
            System.out.println("Guess " + i + ": currentAttempt=" + currentAttempt + ", isGameOver=" + isGameOver);
        }
    }
}
