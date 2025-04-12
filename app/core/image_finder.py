import base64
import io
import logging
from typing import Dict, Optional, Tuple, List

from PIL import Image

from app.config import get_settings
from app.models.article import ArticleImage, ProcessedArticle
from app.services.openai_service import generate_image_prompt

logger = logging.getLogger(__name__)
settings = get_settings()


async def generate_ai_image(prompt: str) -> Optional[Tuple[bytes, str]]:
    """Generate an image using OpenAI DALL-E."""
    try:
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        
        response = await client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
            response_format="b64_json"
        )
        
        image_data = base64.b64decode(response.data[0].b64_json)
        return image_data, response.data[0].revised_prompt
    except Exception as e:
        logger.error(f"Error generating AI image: {str(e)}")
        return None


async def get_image_for_article(article: ProcessedArticle) -> Optional[ArticleImage]:
    """Get an AI-generated image for an article and store it as base64."""
    try:
        # Generate AI image prompt based on article content
        image_prompt = await generate_image_prompt(article.content, article.title)
        image_data = await generate_ai_image(image_prompt)
        
        if image_data:
            image_bytes, revised_prompt = image_data
            
            # Process the image data
            img = Image.open(io.BytesIO(image_bytes))
            width, height = img.size
            
            # Convert image to base64 for frontend display
            buffered = io.BytesIO()
            img.save(buffered, format="PNG")
            base64_image = base64.b64encode(buffered.getvalue()).decode("utf-8")
            
            return ArticleImage(
                article_id=article.id,
                base64_image=base64_image,
                alt_text=revised_prompt[:100],
                source="DALL-E",
                is_ai_generated=True,
                width=width,
                height=height
            )
            
        return None
    except Exception as e:
        logger.error(f"Error getting image for article: {str(e)}")
        return None


async def get_images_for_articles(articles: List[ProcessedArticle]) -> Dict[str, ArticleImage]:
    """Get AI-generated images for multiple articles."""
    results = {}
    
    for article in articles:
        try:
            image = await get_image_for_article(article)
            if image:
                results[article.id] = image
        except Exception as e:
            logger.error(f"Error getting image for article {article.id}: {str(e)}")
            continue
    
    return results