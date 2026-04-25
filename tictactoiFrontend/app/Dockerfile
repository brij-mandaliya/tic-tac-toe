# Use official Node image
FROM node:18-alpine

# Accept a MODE argument (dev or prod)
ARG MODE
ENV MODE=$MODE

# Set working directory
WORKDIR /usr/src/app

# Copy package files first to leverage Docker caching
COPY package*.json ./

# Install dependencies
RUN npm install

# Install optional packages if needed
RUN apk add --no-cache icu-libs nginx supervisor wget curl

# Copy app source code
COPY . .

# Ensure ICU support
ENV NODE_ICU_DATA=/usr/lib/node_modules/full-icu

# Conditionally rename env file
RUN mv .env.${MODE} .env || true

# Expose Nuxt port
EXPOSE 3000

# Production build and start
RUN if [ "$MODE" = "prod" ]; then npm run build; fi

# Run based on mode
CMD if [ "$MODE" = "prod" ]; then /usr/bin/supervisord -c ./docker/supervisiord.conf; else npm run dev; fi
