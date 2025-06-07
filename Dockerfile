# Stage 1: build
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom + source
COPY pom.xml .
COPY src ./src

# Build the jar
RUN mvn clean package -DskipTests

# Stage 2: runtime
FROM eclipse-temurin:21-jdk-jammy
WORKDIR /app

# Copy the fat jar from builder
COPY --from=build /app/target/rispo-0.0.1-SNAPSHOT.jar app.jar

# Expose port and entrypoint
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
