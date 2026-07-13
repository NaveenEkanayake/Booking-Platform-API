# Base image
FROM node:20-alpine AS build

# Create app directory
WORKDIR /usr/src/app

# Copy package configuration
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy sources
COPY . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Production image
FROM node:20-alpine

WORKDIR /usr/src/app

COPY --from=build /usr/src/app/package*.json ./
COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist ./dist

# Create database folder
RUN mkdir -p /usr/src/app/data

EXPOSE 3001

CMD ["node", "dist/main"]
