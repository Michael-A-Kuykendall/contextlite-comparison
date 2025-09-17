
"""
One-shot loader to create SQLite schema and insert Stack Overflow sample data.
Uses the rich dataset from demo-site for realistic search comparison.
"""
import os, sqlite3, json

SQLITE_PATH = os.environ.get("SQLITE_PATH", "./data/so_demo.sqlite")
SAMPLE_DATA_PATH = "../demo-site/data/stackoverflow_sample.json"

def ensure_schema(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("""CREATE TABLE IF NOT EXISTS posts(
        id INTEGER PRIMARY KEY,
        title TEXT,
        body TEXT,
        tags TEXT,
        score INTEGER,
        view_count INTEGER,
        answer_count INTEGER,
        creation_date TEXT,
        accepted_answer_body TEXT
    );""")
    cur.execute("""CREATE VIRTUAL TABLE IF NOT EXISTS posts_fts USING fts5(
        title, body, tags, accepted_answer_body, content='posts', content_rowid='id'
    );""")
    conn.commit()

def insert_samples(conn):
    # Load rich sample data if available, fallback to basic samples
    try:
        if os.path.exists(SAMPLE_DATA_PATH):
            with open(SAMPLE_DATA_PATH, 'r') as f:
                data = json.load(f)
            
            cur = conn.cursor()
            for item in data:
                tags = ','.join(item.get('tags', []))
                accepted_answer_body = item.get('accepted_answer', {}).get('body', '')
                
                cur.execute("""INSERT OR REPLACE INTO posts 
                    (id, title, body, tags, score, view_count, answer_count, creation_date, accepted_answer_body)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""", (
                    int(item['id']), item['title'], item['body'], tags,
                    item.get('score', 0), item.get('view_count', 0), 
                    item.get('answer_count', 0), item.get('creation_date', ''),
                    accepted_answer_body
                ))
            print(f"Loaded {len(data)} Stack Overflow posts")
        else:
            # Fallback basic samples
            rows = [
                (1, "How to center a div in CSS?", "Use flexbox: justify-content and align-items.", "css,html", 45, 1200, 3, "2024-01-01", "Display: flex with justify-content: center"),
                (2, "What is a goroutine?", "Lightweight threads managed by the Go runtime.", "go,concurrency", 67, 890, 2, "2024-01-02", "Goroutines are functions that run concurrently"),
                (3, "How to borrow in Rust?", "Use references & lifetimes; the compiler enforces rules.", "rust,memory-management", 89, 1450, 4, "2024-01-03", "Use & for immutable references, &mut for mutable")
            ]
            cur = conn.cursor()
            for row in rows:
                cur.execute("""INSERT OR REPLACE INTO posts 
                    (id, title, body, tags, score, view_count, answer_count, creation_date, accepted_answer_body)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)""", row)
            print(f"Loaded {len(rows)} basic sample posts")
        
        cur.execute("INSERT INTO posts_fts(posts_fts) VALUES('rebuild');")
        conn.commit()
        
    except Exception as e:
        print(f"Error loading data: {e}")
        raise

def main():
    os.makedirs(os.path.dirname(SQLITE_PATH), exist_ok=True)
    conn = sqlite3.connect(SQLITE_PATH)
    ensure_schema(conn)
    insert_samples(conn)
    print(f"Inserted samples into {SQLITE_PATH}")
    conn.close()

if __name__ == "__main__":
    main()
