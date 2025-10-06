# Use Node.js LTS (Debian-based for glibc + OpenSSL)
FROM node:20-bookworm-slim

# Create app directory
WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# System deps needed for Prisma engines (OpenSSL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies (include dev deps for build)
RUN npm ci || npm install --no-audit --no-fund

# Generate Prisma Client (first pass, based on prisma/)
RUN npx prisma generate

# Copy source code (may include updated prisma/schema.prisma)
COPY . .

# Regenerate Prisma Client after copying full source to ensure types are up-to-date
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Remove dev dependencies to slim the image
RUN npm prune --omit=dev

# Expose the port the app runs on
EXPOSE 3000

# Command to run the application
CMD ["npm", "start"]
