import sqlite3
import json
from contextlib import closing

DB_NAME = "articles.db"

def init_db():
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

def get_cached_article(pmid: str):
    with closing(sqlite3.connect(DB_NAME)) as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM articles WHERE pmid=?", (pmid,))
        row = cursor.fetchone()
        if row:
            return {
                "pmid": row[0],
                "title": row[1],
                "abstract": row[2],
                "summary": row[3]
            }
        return None

def cache_article(article: dict):
    with closing(sqlite3.connect(DB_NAME)) as conn:
        conn.execute('''
            INSERT OR REPLACE INTO articles (pmid, title, abstract, summary)
            VALUES (?, ?, ?, ?)
        ''', (article["pmid"], article["title"], article["abstract"], article["summary"]))
        conn.commit()

# Initialize database on first run
init_db()