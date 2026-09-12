# Stage 1: Build the application using Gradle
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /app
# Copy gradle wrapper and source code
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
COPY src src

# Make gradle wrapper executable and build the jar
RUN chmod +x ./gradlew
RUN ./gradlew build -x test

# Stage 2: Run the application
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app
# Copy the built jar from the builder stage
COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
