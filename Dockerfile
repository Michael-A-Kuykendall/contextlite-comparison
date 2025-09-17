# ContextLite vs Pinecone Demo
FROM debian:stable-slim
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    sqlite3 \
    curl \
    nodejs \
    npm \
    python3 \
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

# Install Caddy
RUN curl -fsSL https://getcaddy.com/go/install.sh | sh

# Copy startup script
COPY start.sh /app/start.sh
RUN chmod +x /app/start.sh

EXPOSE 80 8080 3000
CMD ["/app/start.sh"]