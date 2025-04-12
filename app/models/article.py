from datetime import datetime
from enum import Enum
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class SentimentType(str, Enum):
    """Sentiment analysis results."""
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"


class RawArticle(BaseModel):
    """Raw article data from RSS feed."""
    title: str
    url: str
    published_date: datetime
    summary: str
    content: str
    source: str


class ProcessedArticle(BaseModel):
    """Article after sentiment analysis and processing."""
    id: Optional[str] = None
    title: str
    original_url: str
    published_date: datetime
    summary: str
    content: str
    source: str
    sentiment: SentimentType
    sentiment_score: float = Field(ge=-1.0, le=1.0)
    processed_date: datetime = Field(default_factory=datetime.now)


class GeneratedContent(BaseModel):
    """Content generated from the original article."""
    article_id: str
    title: str
    summary: str
    content: str
    language: str = "en"
    sentiment: SentimentType = SentimentType.NEUTRAL
    sentiment_score: float = 0.0
    generated_date: datetime = Field(default_factory=datetime.now)


class ArticleImage(BaseModel):
    """Image associated with an article."""
    article_id: str
    url: Optional[HttpUrl] = None  # Make URL optional since we'll use base64
    base64_image: Optional[str] = None  # Add base64 image field
    alt_text: str
    source: str
    is_ai_generated: bool = False
    width: Optional[int] = None
    height: Optional[int] = None


class ArticleResponse(BaseModel):
    """API response model for articles."""
    id: str
    title: str
    summary: str
    sentiment: SentimentType
    source: str
    published_date: datetime
    image_url: Optional[HttpUrl] = None
    image_base64: Optional[str] = None  # Add base64 image field
    generated_contents: List[GeneratedContent] = []