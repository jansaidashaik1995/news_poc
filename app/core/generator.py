import logging
import uuid
from typing import Dict, List

from app.models.article import GeneratedContent, ProcessedArticle
from app.services.openai_service import generate_article

logger = logging.getLogger(__name__)


async def generate_content_for_article(article: ProcessedArticle, language: str = "en") -> GeneratedContent:
    """Generate content for a single article in the specified language."""
    try:
        # Generate new content
        generated = await generate_article(article.content, language)
        
        # Create generated content object
        return GeneratedContent(
            article_id=article.id,
            title=generated["title"],
            summary=generated["summary"],
            content=generated["content"],
            language=language,
            sentiment=generated["sentiment"],
            sentiment_score=generated["sentiment_score"]
        )
    except Exception as e:
        logger.error(f"Error generating content for article {article.id}: {str(e)}")
        raise


async def generate_contents(articles: List[ProcessedArticle], languages: List[str] = ["en", "hi", "te"]) -> Dict[str, List[GeneratedContent]]:
    """Generate content for multiple articles in multiple languages."""
    results = {}
    
    for article in articles:
        article_results = []
        for language in languages:
            try:
                generated = await generate_content_for_article(article, language)
                article_results.append(generated)
            except Exception as e:
                logger.error(f"Error generating {language} content for article {article.id}: {str(e)}")
                continue
        
        if article_results:
            results[article.id] = article_results
    
    return results