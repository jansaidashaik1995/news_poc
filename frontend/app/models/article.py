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
