
FROM debian:stable-slim
WORKDIR /app
RUN apt-get update && apt-get install -y ca-certificates sqlite3 && rm -rf /var/lib/apt/lists/*
COPY contextlite /app/contextlite
RUN chmod +x /app/contextlite
EXPOSE 8080
CMD ["/app/contextlite", "--db", "/data/so_demo.sqlite", "--listen", "0.0.0.0:8080"]
