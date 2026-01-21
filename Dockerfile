# =========================
# Stage 1: Build React Frontend
# =========================
FROM node:18-alpine AS frontend-build
WORKDIR /app/frontend

# Copy package files
COPY rispo-app/package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY rispo-app/ ./

# Set environment for local container deployment
ENV REACT_APP_API_URL=http://localhost:8080/api

# Build the React app
RUN npm run build

# =========================
# Stage 2: Build Spring Boot App
# =========================
FROM maven:3.9.6-eclipse-temurin-21 AS backend-build
WORKDIR /app

# Copy Maven wrapper and pom.xml first for better layer caching
COPY pom.xml .
COPY mvnw .
COPY mvnw.cmd .
COPY .mvn .mvn
COPY src ./src

# Copy the React build output to Spring Boot's static resources
COPY --from=frontend-build /app/frontend/build ./src/main/resources/static

# Build the application JAR (skip tests for faster builds)
RUN mvn clean package -DskipTests -B

# =========================
# Stage 2: Runtime
# =========================
FROM eclipse-temurin:21-jdk-jammy
WORKDIR /app

# Copy the built JAR from the backend build stage
COPY --from=backend-build /app/target/rispo-0.0.1-SNAPSHOT.jar app.jar

# Expose your app port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
