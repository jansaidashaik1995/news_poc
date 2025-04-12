import logging
import uuid
from typing import List

from app.models.article import ProcessedArticle, RawArticle
from app.services.openai_service import analyze_sentiment

logger = logging.getLogger(__name__)


async def analyze_article(article: RawArticle) -> ProcessedArticle:
    """Analyze a single article for sentiment."""
    try:
        # Analyze sentiment
        sentiment, score = await analyze_sentiment(article.content)
        
        # Create processed article
        return ProcessedArticle(
            id=str(uuid.uuid4()),
            title=article.title,
            original_url=article.url,
            published_date=article.published_date,
            summary=article.summary,
            content=article.content,
            source=article.source,
            sentiment=sentiment,
            sentiment_score=score
        )
    except Exception as e:
        logger.error(f"Error analyzing article: {str(e)}")
        raise


async def analyze_articles(articles: List[RawArticle]) -> List[ProcessedArticle]:
    """Analyze multiple articles for sentiment."""
    processed_articles = []
    
    for article in articles:
        try:
            processed = await analyze_article(article)
            processed_articles.append(processed)
        except Exception as e:
            logger.error(f"Error processing article {article.title}: {str(e)}")
            continue
    
    return processed_articles