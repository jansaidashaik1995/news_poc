export type SentimentType = "POSITIVE" | "NEGATIVE" | "NEUTRAL" | "positive" | "negative" | "neutral"

export interface GeneratedContent {
  article_id: string
  title: string
  summary: string
  content: string
  language: string
  sentiment: SentimentType
  sentiment_score: number
  generated_date: string
}

export interface Article {
  id: string
  title: string
  summary: string
  sentiment: SentimentType
  source: string
  published_date: string
  url?: string
  image_url?: string
  image_base64?: string
  generated_contents: GeneratedContent[]
}

export type ArticleResponse = Article
