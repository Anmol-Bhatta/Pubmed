import aiohttp
import asyncio
from bs4 import BeautifulSoup
from datetime import datetime
import urllib.parse  # Add this import

# Add month name to number mapping
MONTH_MAP = {
    'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
    'Jul': 7, 'Aug': 8, 'Sep': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
}

async def fetch_articles_async(topic: str, max_results: int = 10, country: str = "India", 
                             start_date: str = None, end_date: str = None):
    """Asynchronous version of fetch_articles using aiohttp for faster API requests"""
    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
    
    # Extract search year from start_date
    search_year = None
    if start_date:
        try:
            search_year = int(start_date.split('/')[0])
        except (ValueError, IndexError):
            pass
    
    # Build search query with date in PDAT field
    query_parts = [f'"{topic}"', f"{country}[Affiliation]"]
    if start_date and end_date:
        # Add date range using PDAT field
        query_parts.append(f"{start_date}:{end_date}[PDAT]")
    
    search_query = " AND ".join(query_parts)
    
    # URL encode the search query
    encoded_query = urllib.parse.quote(search_query)
    
    # Build the search URL
    search_url = f"{base_url}esearch.fcgi?db=pubmed&term={encoded_query}&retmax={max_results}"
    
    # Debug logging
    print(f"Original Query: {search_query}")
    print(f"Encoded Query: {encoded_query}")
    print(f"Search URL: {search_url}")
    print(f"Search Year: {search_year}")
    
    async with aiohttp.ClientSession() as session:
        # Fetch PMIDs
        async with session.get(search_url) as response:
            text = await response.text()
            print(f"PubMed Response: {text[:500]}...")  # Print first 500 chars of response
            soup = BeautifulSoup(text, "xml")
            
            # Add more detailed response logging
            count = soup.find("Count")
            if count:
                print(f"Total results found: {count.text}")
            
            pmids = [pmid.text for pmid in soup.find_all("Id")]
            print(f"Found PMIDs: {pmids}")
            
            # Log translation set if present
            translation_set = soup.find("TranslationSet")
            if translation_set:
                print("Query translations:")
                for translation in translation_set.find_all("Translation"):
                    from_term = translation.find("From")
                    to_term = translation.find("To")
                    if from_term and to_term:
                        print(f"  {from_term.text} -> {to_term.text}")
        
        if not pmids:
            print("No PMIDs found in the response")
            return []
        
        # Fetch details for PMIDs
        fetch_url = f"{base_url}efetch.fcgi?db=pubmed&id={','.join(pmids)}&retmode=xml"
        print(f"Fetching article details from: {fetch_url}")
        
        async with session.get(fetch_url) as response:
            text = await response.text()
            print(f"Article details response length: {len(text)}")
            print(f"First 500 chars of article details: {text[:500]}")
            soup = BeautifulSoup(text, "xml")
        
        articles = []
        for article in soup.find_all("PubmedArticle"):
            try:
                title = article.find("ArticleTitle").text
                abstract = article.find("AbstractText").text if article.find("AbstractText") else ""
                pmid = article.find("PMID").text
                pub_date = article.find("PubDate")
                
                print(f"Processing article {pmid}:")
                print(f"Title: {title[:100]}...")
                print(f"Abstract length: {len(abstract)}")
                
                # Extract full date if available
                year = int(pub_date.Year.text) if pub_date and pub_date.Year else None
                month = None
                if pub_date and pub_date.Month:
                    month_text = pub_date.Month.text
                    # Handle both numeric and text month formats
                    try:
                        month = int(month_text)
                    except ValueError:
                        month = MONTH_MAP.get(month_text[:3])  # Take first 3 chars for month name
                day = int(pub_date.Day.text) if pub_date and pub_date.Day else None
                
                print(f"Date components - Year: {year}, Month: {month}, Day: {day}")
                
                # Create a datetime object if we have all components
                publication_date = None
                if year and month and day:
                    try:
                        publication_date = datetime(year, month, day)
                    except ValueError:
                        print(f"Invalid date components: year={year}, month={month}, day={day}")
                
                articles.append({
                    "pmid": pmid,
                    "title": title,
                    "abstract": abstract,
                    "year": search_year,  # Use search year instead of publication year
                    "month": month,
                    "day": day,
                    "publication_date": publication_date.isoformat() if publication_date else None,
                    "country": country
                })
                print(f"Successfully processed article {pmid}")
            except Exception as e:
                print(f"Error processing article: {str(e)}")
                continue
        
        print(f"Total articles processed: {len(articles)}")
        return articles

# Keep the original function for backward compatibility
def fetch_articles(topic: str, max_results: int = 10, country: str = "India", 
                  start_date: str = None, end_date: str = None):
    """Synchronous version that uses the async function under the hood"""
    import requests  # Keep this import for backward compatibility
    
    # Run the async function in an event loop
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        return loop.run_until_complete(fetch_articles_async(topic, max_results, country, start_date, end_date))
    finally:
        loop.close()