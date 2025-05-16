from flask import Flask, jsonify, request
from flask_cors import CORS
from pubmed import fetch_articles
from summarizer import summarize_abstract
from cache_manager import get_cached_article, cache_article
import time

app = Flask(__name__)
CORS(app)  # Basic CORS for all routes

# Custom handler to add CORS headers to ALL responses
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = 'http://localhost:5173'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type'
    response.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS'
    return response

@app.route('/api/search', methods=['POST'])
def search_articles():
    if request.method == 'OPTIONS':
        return _build_cors_preflight_response()
    data = request.get_json()
    filters = {
            "topic": data.get('topic', 'machine learning'),
            "country": data.get('country', 'India'),
            "max_results": data.get('maxResults', 10),
            "start_year": data.get('startYear'),
            "end_year": data.get('endYear')
        }

    # topic = data.get('topic', 'machine learning')
    
    articles = fetch_articles(filters)
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

def _build_cors_preflight_response():
    response = jsonify({"message": "Preflight Accepted"})
    response.headers.add("Access-Control-Allow-Origin", "http://localhost:5173")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type")
    response.headers.add("Access-Control-Allow-Methods", "POST, OPTIONS")
    return response

if __name__ == '__main__':
    app.run(debug=True, port=5000)