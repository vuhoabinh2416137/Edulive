# ==============================================================================
# Multi-stage Dockerfile for EduLive Frontend (React 18 + Vite + TailwindCSS)
# ==============================================================================

# --- Stage 1: Build static assets ---
FROM node:20-alpine AS builder

WORKDIR /app

# Cache package dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# --- Stage 2: Lightweight Nginx Server ---
FROM nginx:1.25-alpine

LABEL maintainer="EduLive Team <support@edulive.vn>"
LABEL description="EduLive Online Learning Platform - React Frontend"

# Remove default nginx static assets
RUN rm -rf /usr/share/nginx/html/*

# Copy build artifacts from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx reverse-proxy configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
