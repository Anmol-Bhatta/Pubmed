from flask import Flask, jsonify, request
from flask_cors import CORS
from pubmed import fetch_articles
from summarizer import summarize_abstract
from cache_manager import get_cached_article, cache_article
import time

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

@app.route('/api/search', methods=['POST'])
def search_articles():
    data = request.get_json()
    topic = data.get('topic', 'machine learning')
    
    articles = fetch_articles(topic)
    results = []
    
    for article in articles:
        pmid = article["pmid"]
        cached = get_cached_article(pmid)
        
        if cached:
            results.append(cached)
        else:
            summary = summarize_abstract(article["abstract"])
            article["summary"] = summary
            cache_article(article)
            results.append(article)
    
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True, port=5000)