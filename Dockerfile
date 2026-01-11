# =========================
# Stage 1: Build React App
# =========================
FROM node:18-alpine AS frontend-build
WORKDIR /frontend

# Copy package files first for better layer caching
COPY rispo-app/package.json rispo-app/package-lock.json ./

# Install ALL dependencies (including devDependencies needed for build)
# Using npm ci for reproducible builds from package-lock.json
# Using cache mount to persist npm cache across builds
RUN --mount=type=cache,target=/root/.npm npm ci

# Copy React app source (excluding node_modules via .dockerignore)
COPY rispo-app/ ./

# Build React app for production
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

# Download dependencies (this layer will be cached if pom.xml doesn't change)
# Using cache mount to persist Maven dependencies across builds
RUN --mount=type=cache,target=/root/.m2 mvn dependency:go-offline -B

# Copy application source
COPY src ./src

# Build the application JAR (skip tests for faster builds)
# Using cache mount to reuse downloaded dependencies
RUN --mount=type=cache,target=/root/.m2 mvn clean package -DskipTests -B

# =========================
# Stage 3: Runtime
# =========================
FROM eclipse-temurin:21-jdk-jammy
WORKDIR /app

# Copy the built JAR from the backend build stage
COPY --from=backend-build /app/target/rispo-0.0.1-SNAPSHOT.jar app.jar

# Create directory for static resources
RUN mkdir -p /app/static

# Copy the built React app from the frontend build stage
COPY --from=frontend-build /frontend/build /app/static

# Expose your app port
EXPOSE 8080

# Run the application with static resource location
ENTRYPOINT ["java", "-Dspring.web.resources.static-locations=file:/app/static/", "-jar", "app.jar"]
