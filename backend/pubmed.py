import requests
from bs4 import BeautifulSoup
from urllib.parse import quote

def fetch_articles(filters):
    validate_filters(filters)

    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
    
    # Build search query
    query_parts = [filters['topic']]
    if filters['country']:
        query_parts.append(f"({filters['country']}[Affiliation])")
    
    # Date range filter
    if filters['start_year'] and filters['end_year']:
        query_parts.append(f'("{filters["start_year"]}/01/01"[Date - Publication] : "{filters["end_year"]}/12/31"[Date - Publication])')
    elif filters['start_year']:
        query_parts.append(f'("{filters["start_year"]}/01/01"[Date - Publication] : "3000"[Date - Publication])')
    elif filters['end_year']:
        query_parts.append(f'("1900"[Date - Publication] : "{filters["end_year"]}/12/31"[Date - Publication])')
    
    search_query = '+AND+'.join(query_parts)
    encoded_query = quote(search_query)  # Fix spaces/special chars
    
    search_url = (
        f"{base_url}esearch.fcgi?db=pubmed"
        f"&term={encoded_query}"  # Use encoded query
        f"&retmax={filters['max_results']}"
    )
    
    response = requests.get(search_url)
    data = response.json()
    pmids = data['esearchresult']['idlist']    
    # Fetch details for PMIDs
    fetch_url = f"{base_url}efetch.fcgi?db=pubmed&id={','.join(pmids)}&retmode=xml"
    response = requests.get(fetch_url)
    soup = BeautifulSoup(response.text, "xml")
    
    articles = []
    for article in soup.find_all("PubmedArticle"):
        title = article.find("ArticleTitle").text
        abstract = article.find("AbstractText").text if article.find("AbstractText") else ""
        pmid = article.find("PMID").text
        pub_date = article.find("PubDate")
        year = int(pub_date.Year.text) if pub_date and pub_date.Year else None
        
        articles.append({
            "pmid": pmid,
            "country": country,
            "title": title,
            "abstract": abstract,
            "year": year,
        })
    
    return articles

def validate_filters(filters):
    if not 1 <= filters['max_results'] <= 100:
        raise ValueError("Max results must be between 1-100")
    
    if filters['start_year'] and filters['end_year']:
        if int(filters['start_year']) > int(filters['end_year']):
            raise ValueError("Start year cannot be after end year")
