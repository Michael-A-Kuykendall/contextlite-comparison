#!/bin/bash
set -e

echo "🚀 Starting ContextLite vs Pinecone Demo..."

# Create data directory if it doesn't exist
mkdir -p /data

# Create database if it doesn't exist
if [ ! -f /data/so_demo.sqlite ]; then
    echo "📊 Creating sample database..."
    cd /app && python3 -c "
import sqlite3, os
conn = sqlite3.connect('/data/so_demo.sqlite')
cur = conn.cursor()
cur.execute('PRAGMA journal_mode=WAL;')
cur.execute('''CREATE TABLE IF NOT EXISTS posts(
    id INTEGER PRIMARY KEY,
    title TEXT,
    body TEXT,
    tags TEXT,
    score INTEGER,
    view_count INTEGER,
    answer_count INTEGER,
    creation_date TEXT,
    accepted_answer_body TEXT
);''')
cur.execute('''CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
    title, body, tags, accepted_answer_body, content='posts', content_rowid='id'
);''')
rows = [
    (1, 'How to center a div in CSS?', 'Use flexbox: justify-content and align-items.', 'css,html', 45, 1200, 3, '2024-01-01', 'Display: flex with justify-content: center'),
    (2, 'What is a goroutine?', 'Lightweight threads managed by the Go runtime.', 'go,concurrency', 67, 890, 2, '2024-01-02', 'Goroutines are functions that run concurrently'),
    (3, 'How to borrow in Rust?', 'Use references & lifetimes; the compiler enforces rules.', 'rust,memory-management', 89, 1450, 4, '2024-01-03', 'Use & for immutable references, &mut for mutable'),
    (4, 'JWT authentication in React', 'Implement secure token-based authentication for React apps', 'react,jwt,authentication', 156, 3200, 8, '2024-01-04', 'Store tokens in httpOnly cookies for security'),
    (5, 'Python machine learning optimization', 'Techniques for optimizing ML models in Python using scikit-learn', 'python,machine-learning', 234, 5600, 12, '2024-01-05', 'Use GridSearchCV for hyperparameter tuning')
]
for row in rows:
    cur.execute('''INSERT OR REPLACE INTO posts 
        (id, title, body, tags, score, view_count, answer_count, creation_date, accepted_answer_body)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)''', row)
cur.execute(\"INSERT INTO posts_fts(posts_fts) VALUES('rebuild');\")
conn.commit()
conn.close()
print('✅ Sample database created')
"
fi

# Create ContextLite config
echo "⚙️ Creating ContextLite config..."
cat > /tmp/contextlite-config.yaml << EOF
server:
  port: 8080
  host: "0.0.0.0"
  cors_enabled: true
  auth_token: ""
  rate_limiting:
    enabled: false
storage:
  database_path: "/data/so_demo.sqlite"
  cache_size_mb: 64
smt:
  solver_timeout_ms: 250
  max_opt_gap: 0.05
  max_candidates: 200
  max_pairs_per_doc: 5
  integer_scaling: 10000
  objective_style: "weighted-sum"
weights:
  relevance: 0.30
  recency: 0.20
  entanglement: 0.15
  prior: 0.15
  authority: 0.10
  specificity: 0.05
  uncertainty: 0.05
tokenizer:
  model_id: "gpt-4"
  max_tokens_default: 4000
EOF

# Start ContextLite in background
echo "🗄️ Starting ContextLite..."
/app/contextlite --config /tmp/contextlite-config.yaml &
CONTEXTLITE_PID=$!

# Wait for ContextLite to be ready
echo "⏳ Waiting for ContextLite..."
sleep 3

# Start API in background
echo "🔗 Starting API..."
cd /app/api && node server.js &
API_PID=$!

# Wait for API to be ready
echo "⏳ Waiting for API..."
sleep 2

# Start Caddy (foreground)
echo "🌐 Starting Caddy proxy..."
caddy run --config /app/Caddyfile

# Cleanup on exit
trap "kill $CONTEXTLITE_PID $API_PID" EXIT