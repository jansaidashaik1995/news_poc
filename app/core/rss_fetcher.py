import asyncio
import logging
import uuid
from datetime import datetime
from typing import Dict, List, Optional
from urllib.parse import urlparse

import feedparser
import httpx
from bs4 import BeautifulSoup

from app.models.article import RawArticle

logger = logging.getLogger(__name__)


async def fetch_feed_by_url(url: str) -> List[Dict]:
    """Fetch and parse an RSS feed by URL."""
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            
        feed = feedparser.parse(response.text)
        
        if hasattr(feed, 'status') and feed.status != 200:
            logger.error(f"Error fetching feed {url}: HTTP status {feed.status}")
            return []
            
        if not hasattr(feed, 'entries') or not feed.entries:
            logger.warning(f"No entries found in feed {url}")
            return []
            
        return feed.entries
    except Exception as e:
        logger.error(f"Error fetching feed {url}: {str(e)}")
        return []


async def extract_full_content(url: str, summary: str) -> str:
    """
    Extract full article content from URL.
    Falls back to summary if extraction fails or if the site is known to block scraping.
    """
    # Check if the URL is from BBC, which blocks scraping
    domain = urlparse(url).netloc
    if "bbc.com" in domain or "bbc.co.uk" in domain:
        logger.info(f"BBC article detected, using summary instead of scraping: {url}")
        return summary
        
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            
        soup = BeautifulSoup(response.text, "html.parser")
        
        # Remove unwanted elements
        for element in soup.find_all(["script", "style", "nav", "footer", "header"]):
            element.decompose()
        
        # Find main content (this is site-specific and may need adjustment)
        main_content = soup.find("article") or soup.find(class_=["content", "post", "article"])
        
        if main_content:
            return main_content.get_text(strip=True)
        
        # Fallback to body content
        body = soup.find("body")
        if body:
            return body.get_text(strip=True)
            
        return summary
    except Exception as e:
        logger.info(f"Error extracting content from {url}, using summary instead: {str(e)}")
        return summary


async def process_feed_entry(entry: Dict) -> Optional[RawArticle]:
    """Process a single feed entry into a RawArticle."""
    try:
        # Extract basic info
        title = entry.get("title", "")
        link = entry.get("link", "")
        published = entry.get("published", "")
        summary = entry.get("summary", "")
        
        # Try to parse the date
        try:
            if published:
                published_date = datetime.strptime(published, "%a, %d %b %Y %H:%M:%S %z")
            else:
                published_date = datetime.now()
        except ValueError:
            # Try alternative date formats
            try:
                published_date = datetime.strptime(published, "%Y-%m-%dT%H:%M:%S%z")
            except ValueError:
                published_date = datetime.now()
        
        # Get full content if available
        content = ""
        if "content" in entry:
            content = entry.content[0].value
        else:
            # Try to fetch full content, passing the summary as fallback
            content = await extract_full_content(link, summary)
        
        # Get source from feed
        source = entry.get("author", "") or entry.get("source", {}).get("title", "Unknown")
        
        # For BBC feeds, extract source from the feed title if not available in the entry
        if not source or source == "Unknown":
            feed_title = entry.get("feed", {}).get("title", "")
            if "BBC" in feed_title:
                source = "BBC News"
        
        return RawArticle(
            title=title,
            url=link,
            published_date=published_date,
            summary=summary,
            content=content,
            source=source,
        )
    except Exception as e:
        logger.error(f"Error processing feed entry: {str(e)}")
        return None


async def process_feed_entries(feed_urls: List[str]) -> List[RawArticle]:
    """Process entries from multiple feed URLs."""
    all_entries = []
    
    # Fetch all feeds concurrently
    feed_tasks = [fetch_feed_by_url(url) for url in feed_urls]
    feed_results = await asyncio.gather(*feed_tasks)
    
    # Process all entries
    for entries in feed_results:
        entry_tasks = [process_feed_entry(entry) for entry in entries]
        processed_entries = await asyncio.gather(*entry_tasks)
        all_entries.extend([entry for entry in processed_entries if entry])
    
    # Sort by published date (newest first)
    all_entries.sort(key=lambda x: x.published_date, reverse=True)
    
    return all_entries