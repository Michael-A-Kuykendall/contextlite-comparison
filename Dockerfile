# Simple Node.js only - no Caddy complexity
FROM node:20-bullseye

WORKDIR /app

# Install deps first for layer caching
COPY package*.json ./
RUN npm install --omit=dev

# Copy app files
COPY comparison-demo.js test-simple.js ./

# Install dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends dumb-init \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
EXPOSE 3000

# Use dumb-init and run the real comparison demo
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "comparison-demo.js"]