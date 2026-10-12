# ==============================================================================
# Multi-stage Dockerfile for EduLive Backend (Spring Boot 3 + Java 21)
# ==============================================================================

# --- Stage 1: Build JAR package ---
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Cache maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and package application
COPY src ./src
RUN mvn clean package -DskipTests -B

# --- Stage 2: Minimal Production Runtime ---
FROM eclipse-temurin:21-jre-alpine

LABEL maintainer="EduLive Team <support@edulive.vn>"
LABEL description="EduLive Online Learning Platform - Spring Boot 3 Backend"

# Create non-root system group and user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy executable jar from build stage
COPY --from=builder /build/target/*.jar app.jar

# Create directory for file uploads if needed
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app

USER appuser

EXPOSE 8088

# JVM Memory optimization for container environments
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0 -Dfile.encoding=UTF-8"

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
