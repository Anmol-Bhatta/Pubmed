import requests
from bs4 import BeautifulSoup

def fetch_articles(topic: str, max_results: int = 10, country: str = "India", min_year: int = None, max_year: int = None):
    base_url = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/"
    
    # Build search query
    query_parts = [topic, f"{country}[Affiliation]"]
    if min_year and max_year:
        query_parts.append(f"{min_year}:{max_year}[DP]")  # DP = Publication Date
    
    search_query = "+AND+".join(query_parts)
    
    # Fetch PMIDs
    search_url = f"{base_url}esearch.fcgi?db=pubmed&term={search_query}&retmax={max_results}"
    response = requests.get(search_url)
    soup = BeautifulSoup(response.text, "xml")
    pmids = [pmid.text for pmid in soup.find_all("Id")]
    
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
            "title": title,
            "abstract": abstract,
            "year": year,
            "country": country
        })
    
    return articles