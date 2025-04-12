import logging
from typing import Dict, List, Optional

from fastapi import APIRouter, HTTPException, Query

from app.core.rss_fetcher import fetch_feed_by_url, process_feed_entries
from app.core.analyzer import analyze_articles
from app.core.generator import generate_contents
from app.core.image_finder import get_images_for_articles
from app.models.article import ArticleResponse, ProcessedArticle, SentimentType

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/fetch", response_model=List[ArticleResponse])
async def fetch_and_process_articles(
    feed_urls: List[str] = Query(..., description="List of RSS feed URLs to fetch"),
    limit: int = Query(5, ge=1, le=50),
    sentiment: SentimentType = None,
    languages: List[str] = Query(["en", "hi", "te"], max_length=5)
):
    """
    Fetch articles from specified RSS feeds, analyze sentiment, generate content, and find images.
    
    - **feed_urls**: List of RSS feed URLs to fetch
    - **limit**: Maximum number of articles to return
    - **sentiment**: Filter by sentiment (positive, neutral, negative)
    - **languages**: Languages to generate content for
    """
    try:
        if not feed_urls:
            raise HTTPException(status_code=400, detail="At least one feed URL is required")
            
        # 1. Fetch articles from the provided URLs
        raw_articles = await process_feed_entries(feed_urls)
        if not raw_articles:
            raise HTTPException(status_code=404, detail="No articles found from the provided feeds")
            
        # 2. Analyze sentiment
        processed_articles = await analyze_articles(raw_articles)
        
        # Filter by sentiment if specified
        if sentiment:
            processed_articles = [a for a in processed_articles if a.sentiment == sentiment]
            
        # Limit the number of articles
        processed_articles = processed_articles[:limit]
        
        # 3. Generate content in different languages
        generated_contents = await generate_contents(processed_articles, languages)
        
        # 4. Get images
        article_images = await get_images_for_articles(processed_articles)
        
        # 5. Prepare response
        response = []
        for article in processed_articles:
            article_image = article_images.get(article.id)
            article_response = ArticleResponse(
                id=article.id,
                title=article.title,
                summary=article.summary,
                sentiment=article.sentiment,
                source=article.source,
                published_date=article.published_date,
                image_url=None,
                image_base64=article_image.base64_image if article_image and hasattr(article_image, 'base64_image') else None,
                generated_contents=generated_contents.get(article.id, [])
            )
            response.append(article_response)
        
        return response
    except Exception as e:
        logger.error(f"Error processing articles: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))




