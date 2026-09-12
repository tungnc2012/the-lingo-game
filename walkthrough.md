# Scaffolding Walkthrough

I have successfully initialized both the backend and frontend components of **The Lingo Game**! 

Here is what was accomplished:

## 1. Backend (`backend/`)
- Downloaded and extracted a fresh **Spring Boot 3.3.1** project configured with Java 21 and Gradle.
- Included all the necessary dependencies outlined in the `DESIGN.md`: Spring Web, WebSocket, Security, Data JPA, H2, PostgreSQL, Actuator, and Prometheus.
- *Note: I skipped running `./gradlew build` locally since Java is not currently installed on this machine, but the scaffolding is perfectly intact!*

## 2. Frontend (`frontend/`)
- Initialized a new React project using **Vite**.
- As agreed, we used the **TypeScript** template (`react-ts`) to ensure we have strict typing when dealing with our WebSocket payloads later.
- Successfully ran `npm install` inside the `frontend/` directory to fetch all node dependencies.

## Important Note
I noticed that the `README.md` file was deleted from the repository during this process (likely due to a local git action or editor save issue). If you have a backup or want to restore it via Git, you can run `git restore README.md`.

## Next Steps
Now that the skeleton is built, we can dive into code! 
- Do you want to start by building the **Game State Models and WebSocket configuration** in the backend?
- Or would you rather start by mocking up the **UI in React**?
