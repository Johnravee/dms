# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy app files
COPY . .

# Build (if needed)
RUN npm run build 2>/dev/null || true

# Runtime stage
FROM node:20-alpine

WORKDIR /app

# Copy from builder
COPY --from=builder /app .

# Expose ports
# 8081 - Expo development server
EXPOSE 8081 

# Start Expo using local CLI via npm script (no tunnel prompts)
CMD ["npm", "start"]
