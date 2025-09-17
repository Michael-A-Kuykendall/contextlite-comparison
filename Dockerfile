# ContextLite vs Pinecone Demo
FROM debian:stable-slim
WORKDIR /app

# Install runtime dependencies and Caddy
RUN apt-get update && apt-get install -y \
    ca-certificates \
    sqlite3 \
    curl \
    nodejs \
    npm \
    python3 \
    gpg \
    && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg \
    && curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list \
    && apt-get update && apt-get install -y caddy \
    && rm -rf /var/lib/apt/lists/*

# Copy ContextLite binary
COPY contextlite/contextlite /app/contextlite
RUN chmod +x /app/contextlite

# Copy API code and install dependencies
COPY api/ /app/api/
WORKDIR /app/api
RUN npm install

# Copy Caddy config
WORKDIR /app
COPY Caddyfile /app/Caddyfile

# Caddy already installed above

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 80 8080 3000
CMD ["/app/start.sh"]