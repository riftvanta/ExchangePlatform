FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Install dependencies first (for better caching)
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application code
COPY tsconfig.json jest.config.js jest.setup.js .prettierrc .eslintrc.cjs drizzle.config.ts ./
COPY shared/ ./shared/
COPY server/ ./server/
COPY types/ ./types/
COPY migrations/ ./migrations/

# Build TypeScript files for production
RUN npm run generate-types && \
    mkdir -p dist && \
    npx tsc -p tsconfig.json

# Development image
FROM node:18-alpine as dev

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Install development tools
RUN apk add --no-cache bash
RUN apk add --no-cache postgresql-client

# Expose the API port
EXPOSE 5000

# Add a healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Command to run the server in development mode
CMD ["npm", "run", "dev"]

# Production image
FROM node:18-alpine as prod

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy compiled code from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/migrations ./migrations

# Install necessary runtime tools
RUN apk add --no-cache bash postgresql-client

# Expose the API port
EXPOSE 5000

# Add a healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:5000/api/health || exit 1

# Start the server
CMD ["node", "./dist/server/index.js"]

# Final image selection based on build argument
FROM ${NODE_ENV:-dev} as final
ARG NODE_ENV=dev 