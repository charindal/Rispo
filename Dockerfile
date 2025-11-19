# =========================
# Stage 1: Build React App
# =========================
FROM node:18-alpine AS frontend-build
WORKDIR /frontend

# Copy package files
COPY rispo-app/package*.json ./

# Install dependencies
RUN npm install

# Copy React app source
COPY rispo-app/ ./

# Build React app for production
RUN npm run build

# =========================
# Stage 2: Build Spring Boot App
# =========================
FROM maven:3.9.6-eclipse-temurin-21 AS backend-build
WORKDIR /app

# Copy Maven project files
COPY pom.xml .
COPY src ./src

# Build the application JAR (skip tests for faster builds)
RUN mvn clean package -DskipTests

# =========================
# Stage 3: Runtime
# =========================
FROM eclipse-temurin:21-jdk-jammy
WORKDIR /app

# Copy the built JAR from the backend build stage
COPY --from=backend-build /app/target/rispo-0.0.1-SNAPSHOT.jar app.jar

# Copy the built React app from the frontend build stage
COPY --from=frontend-build /frontend/build /app/static

# Expose your app port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-jar", "app.jar"]
