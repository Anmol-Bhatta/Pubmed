from flask import Flask, jsonify, request, Response, stream_with_context
from flask_cors import CORS
from pubmed import fetch_articles, fetch_articles_async
from summarizer import summarize_abstract, summarize_batch
from cache_manager import get_cached_article, cache_article, init_db
import time
import json
import asyncio
import concurrent.futures
from typing import List, Dict, Any

app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

# Initialize the database
init_db()

# Maximum number of concurrent summarization tasks
MAX_SUMMARIZATION_WORKERS = 4

@app.route('/api/search', methods=['POST'])
def search_articles():
    data = request.get_json()
    topic = data.get('topic', 'machine learning')
    country = data.get('country', 'India')
    date_range = data.get('dateRange', {})
    max_results = data.get('maxResults', 10)
    
    # Convert date objects to PubMed format (YYYY/MM/DD)
    start_date = None
    end_date = None
    
    if date_range.get('start'):
        start = date_range['start']
        if isinstance(start, str):
            start_date = start
        else:
            start_date = start.strftime('%Y/%m/%d')
    
    if date_range.get('end'):
        end = date_range['end']
        if isinstance(end, str):
            end_date = end
        else:
            end_date = end.strftime('%Y/%m/%d')
    
    # Convert max_results to proper type
    max_results = int(max_results) if isinstance(max_results, str) else max_results
    
    # Limit max_results to a reasonable range (1-50)
    max_results = max(1, min(50, max_results))
    
    # Fetch articles
    articles = fetch_articles(
        topic=topic,
        country=country,
        start_date=start_date,
        end_date=end_date,
        max_results=max_results
    )
    
    # Process articles (caching and summarization)
    cached_articles = []
    uncached_articles = []
    
    for article in articles:
        pmid = article["pmid"]
        cached = get_cached_article(pmid)
        
        if cached:
            cached_articles.append(cached)
        else:
            uncached_articles.append(article)
    
    # Process uncached articles in parallel
    if uncached_articles:
        processed_articles = summarize_batch(uncached_articles, max_workers=MAX_SUMMARIZATION_WORKERS)
        
        # Cache the processed articles
        for article in processed_articles:
            cache_article(article)
        
        # Combine with cached articles
        results = cached_articles + processed_articles
    else:
        results = cached_articles
    
    return jsonify(results)

@app.route('/api/stream-search', methods=['POST'])
def stream_search_articles():
    data = request.get_json()
    topic = data.get('topic', 'machine learning')
    country = data.get('country', 'India')
    date_range = data.get('dateRange', {})
    max_results = data.get('maxResults', 10)
    
    # Debug log for date range
    print("Received date range:", date_range)
    
    # Convert date objects to PubMed format (YYYY/MM/DD)
    start_date = None
    end_date = None
    
    if date_range.get('start'):
        start = date_range['start']
        print(f"Start date before processing: {start}, type: {type(start)}")
        if isinstance(start, str):
            # If it's already in YYYY/MM/DD format, use it directly
            if '/' in start:
                start_date = start
            else:
                # Convert from YYYY-MM-DD to YYYY/MM/DD
                start_date = start.replace('-', '/')
        print(f"Start date after processing: {start_date}")
    
    if date_range.get('end'):
        end = date_range['end']
        print(f"End date before processing: {end}, type: {type(end)}")
        if isinstance(end, str):
            # If it's already in YYYY/MM/DD format, use it directly
            if '/' in end:
                end_date = end
            else:
                # Convert from YYYY-MM-DD to YYYY/MM/DD
                end_date = end.replace('-', '/')
        print(f"End date after processing: {end_date}")
    
    # Debug log for final dates
    print(f"Final dates - Start: {start_date}, End: {end_date}")
    
    # Convert max_results to proper type
    max_results = int(max_results) if isinstance(max_results, str) else max_results
    
    # Limit max_results to a reasonable range (1-50)
    max_results = max(1, min(50, max_results))
    
    def generate():
        # First yield an initial response to inform the client
        yield json.dumps({
            'status': 'fetching',
            'total': max_results,
            'completed': 0
        }) + '\n'
        
        # Create an event loop for async operations
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        try:
            # Fetch articles asynchronously
            articles = loop.run_until_complete(fetch_articles_async(
                topic=topic,
                country=country,
                start_date=start_date,
                end_date=end_date,
                max_results=max_results
            ))
            
            if not articles:
                yield json.dumps({
                    'status': 'completed',
                    'total': 0,
                    'completed': 0
                }) + '\n'
                return
            
            # Process articles in batches for better parallelism
            batch_size = max(1, min(5, len(articles)))  # Ensure batch_size is at least 1
            
            for batch_start in range(0, len(articles), batch_size):
                batch_end = min(batch_start + batch_size, len(articles))
                batch = articles[batch_start:batch_end]
                
                # Check cache first
                processed_batch = []
                for article in batch:
                    pmid = article["pmid"]
                    cached = get_cached_article(pmid)
                    
                    if cached:
                        processed_batch.append(cached)
                    else:
                        # Process and cache the article
                        article["summary"] = summarize_abstract(article["abstract"])
                        cache_article(article)
                        processed_batch.append(article)
                
                # Send each article in the batch
                for i, result in enumerate(processed_batch):
                    completed = batch_start + i + 1
                    yield json.dumps({
                        'status': 'processing',
                        'total': len(articles),
                        'completed': completed,
                        'article': result
                    }) + '\n'
                    
                    # Small delay to ensure client processes each article
                    time.sleep(0.05)
            
            # Final response to indicate completion
            yield json.dumps({
                'status': 'completed',
                'total': len(articles),
                'completed': len(articles)
            }) + '\n'
            
        finally:
            loop.close()
    
    return Response(stream_with_context(generate()), mimetype='application/x-ndjson')

if __name__ == '__main__':
    app.run(debug=True, port=5000)