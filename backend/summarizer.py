from transformers import BartForConditionalGeneration, BartTokenizer
import concurrent.futures
from typing import List, Tuple, Dict, Any

# Pre-load model during startup
model = BartForConditionalGeneration.from_pretrained("facebook/bart-large-cnn")
tokenizer = BartTokenizer.from_pretrained("facebook/bart-large-cnn")

def summarize_abstract(abstract: str) -> str:
    """Summarize a single abstract"""
    inputs = tokenizer([abstract], max_length=1024, return_tensors="pt", truncation=True)
    summary_ids = model.generate(inputs["input_ids"], num_beams=4, max_length=100)
    return tokenizer.batch_decode(summary_ids, skip_special_tokens=True, clean_up_tokenization_spaces=False)[0]

def summarize_batch(articles: List[Dict[str, Any]], max_workers: int = 4) -> List[Dict[str, Any]]:
    """
    Summarize multiple articles in parallel using ThreadPoolExecutor
    
    Args:
        articles: List of article dictionaries with 'abstract' key
        max_workers: Maximum number of parallel workers
        
    Returns:
        List of article dictionaries with 'summary' key added
    """
    # Extract abstracts and track their positions
    abstracts = []
    for article in articles:
        abstracts.append(article["abstract"])
    
    # Define a function to summarize a single article
    def summarize_one(abstract_idx: int) -> Tuple[int, str]:
        abstract = abstracts[abstract_idx]
        summary = summarize_abstract(abstract)
        return abstract_idx, summary
    
    # Process abstracts in parallel
    result_articles = articles.copy()
    with concurrent.futures.ThreadPoolExecutor(max_workers=max_workers) as executor:
        # Submit all tasks
        future_to_idx = {executor.submit(summarize_one, i): i for i in range(len(abstracts))}
        
        # Process results as they complete
        for future in concurrent.futures.as_completed(future_to_idx):
            idx, summary = future.result()
            result_articles[idx]["summary"] = summary
    
    return result_articles