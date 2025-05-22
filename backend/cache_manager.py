import sqlite3
import json
from contextlib import closing

DB_NAME = "articles.db"

def init_db():
    print("Initializing database...")
    with closing(sqlite3.connect(DB_NAME)) as conn:
        conn.execute('''
            CREATE TABLE IF NOT EXISTS articles (
                pmid TEXT PRIMARY KEY,
                title TEXT,
                abstract TEXT,
                summary TEXT
            )
        ''')
        conn.commit()
    print("Database initialized successfully")

def get_cached_article(pmid: str):
    print(f"Checking cache for PMID: {pmid}")
    with closing(sqlite3.connect(DB_NAME)) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM articles WHERE pmid=?", (pmid,))
        row = cursor.fetchone()
        if row:
            print(f"Cache hit for PMID: {pmid}")
            return {
                "pmid": row[0],
                "title": row[1],
                "abstract": row[2],
                "summary": row[3]
            }
        print(f"Cache miss for PMID: {pmid}")
        return None

def cache_article(article: dict):
    print(f"Caching article with PMID: {article['pmid']}")
    with closing(sqlite3.connect(DB_NAME)) as conn:
        conn.execute('''
            INSERT OR REPLACE INTO articles (pmid, title, abstract, summary)
            VALUES (?, ?, ?, ?)
        ''', (article["pmid"], article["title"], article["abstract"], article["summary"]))
        conn.commit()
    print(f"Successfully cached article with PMID: {article['pmid']}")

# Initialize database on first run
init_db()