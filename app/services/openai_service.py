import logging
from typing import Dict, List, Tuple

from openai import AsyncOpenAI

from app.config import get_settings
from app.models.article import SentimentType

logger = logging.getLogger(__name__)
settings = get_settings()

client = AsyncOpenAI(api_key=settings.openai_api_key)


async def analyze_sentiment(text: str) -> Tuple[SentimentType, float]:
    """
    Analyze the sentiment of a text using OpenAI.
    Returns sentiment type and score (-1.0 to 1.0).
    """
    try:
        prompt = f"""
        Analyze the sentiment of the following text. Classify it as POSITIVE, NEUTRAL, or NEGATIVE.
        Also provide a sentiment score from -1.0 (very negative) to 1.0 (very positive).
        
        Text: {text[:4000]}  # Limit text length
        
        Provide your response in JSON format with the following structure:
        {{
            "sentiment": "POSITIVE/NEUTRAL/NEGATIVE",
            "score": float between -1.0 and 1.0
        }}
        """
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": "You are a sentiment analysis expert. Respond only with the requested JSON format."},
                {"role": "user", "content": prompt}
            ]
        )
        
        result = response.choices[0].message.content
        import json
        parsed = json.loads(result)
        
        sentiment_str = parsed["sentiment"].upper()
        sentiment = SentimentType.POSITIVE
        if sentiment_str == "NEGATIVE":
            sentiment = SentimentType.NEGATIVE
        elif sentiment_str == "NEUTRAL":
            sentiment = SentimentType.NEUTRAL
            
        return sentiment, float(parsed["score"])
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {str(e)}")
        return SentimentType.NEUTRAL, 0.0


async def generate_summary(article_text: str, sentiment: SentimentType, word_count: int = 150) -> str:
    """Generate a summary of the article based on its sentiment."""
    try:
        tone_guidance = ""
        if sentiment == SentimentType.POSITIVE:
            tone_guidance = "Maintain an optimistic and upbeat tone."
        elif sentiment == SentimentType.NEGATIVE:
            tone_guidance = "Maintain a serious and factual tone."
        
        prompt = f"""
        Summarize the following article in approximately {word_count} words.
        {tone_guidance}
        Focus on the key facts and main points.
        
        Article: {article_text[:4000]}  # Limit text length
        """
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are a professional news editor. Create concise, accurate summaries."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error generating summary: {str(e)}")
        return ""


async def generate_article(original_text: str, language: str = "en") -> Dict[str, str]:
    """
    Generate a new article based on the original content.
    Analyzes sentiment of the generated content rather than using input sentiment.
    """
    try:
        language_name = {
            "en": "English",
            "es": "Spanish",
            "hi": "Hindi",
            "te": "Telugu"
        }.get(language, "English")
        
        prompt = f"""
        Rewrite the following article in {language_name}.
        Maintain journalistic integrity and factual accuracy.
        Create a new title that's engaging and accurate.
        
        Original article: {original_text[:4000]}
        
        Return your response as a JSON object with the following structure:
        {{
            "title": "New article title",
            "content": "Full article content"
        }}
        """
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": f"You are a professional journalist writing in {language_name}. Return your response as a JSON object."},
                {"role": "user", "content": prompt}
            ]
        )
        
        result = response.choices[0].message.content
        import json
        parsed = json.loads(result)
        
        # Analyze sentiment of the generated content
        content = parsed["content"]
        sentiment, score = await analyze_sentiment(content)
        
        # Generate summary based on the analyzed sentiment
        summary = await generate_summary(content, sentiment, 100)
        
        return {
            "title": parsed["title"],
            "content": content,
            "summary": summary,
            "sentiment": sentiment,
            "sentiment_score": score
        }
    except Exception as e:
        logger.error(f"Error generating article: {str(e)}")
        return {
            "title": "",
            "content": "",
            "summary": "",
            "sentiment": SentimentType.NEUTRAL,
            "sentiment_score": 0.0
        }


async def generate_image_prompt(article_text: str, title: str) -> str:
    """Generate a prompt for image creation based on article content."""
    try:
        prompt = f"""
        Create a detailed prompt for an AI image generator based on this news article.
        The prompt should describe a photorealistic image that represents the article's main topic.
        Avoid requesting text, specific people's faces, or copyrighted elements.
        
        Article title: {title}
        Article excerpt: {article_text[:2000]}
        
        Output only the image prompt, nothing else.
        """
        
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": "You are an expert at creating detailed image prompts for news articles."},
                {"role": "user", "content": prompt}
            ]
        )
        
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Error generating image prompt: {str(e)}")
        return f"News image about {title}"