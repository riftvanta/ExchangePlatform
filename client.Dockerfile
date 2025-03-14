FROM node:18-alpine as build

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy client package files and install dependencies
COPY client/package.json client/package-lock.json ./client/
WORKDIR /app/client
RUN npm ci

# Copy the rest of the application code
WORKDIR /app
COPY shared/ ./shared/
COPY types/ ./types/
COPY client/ ./client/

# Build the client application
WORKDIR /app/client
RUN npm run build

# Production image
FROM node:18-alpine

# Install Nginx
RUN apk add --no-cache nginx

# Set working directory
WORKDIR /app

# Copy Vite build from the previous stage
COPY --from=build /app/client/dist /usr/share/nginx/html

# Copy Nginx configuration
COPY --from=build /app/client/nginx.conf /etc/nginx/conf.d/default.conf

# Expose the frontend port
EXPOSE 3000

# Create a simple Nginx configuration to serve the Vite app
RUN echo 'server { \
    listen 3000; \
    root /usr/share/nginx/html; \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://server:5000; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
    } \
}' > /etc/nginx/conf.d/default.conf

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"] 