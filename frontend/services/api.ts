import type { ArticleResponse } from "@/types/article"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export async function fetchArticles(
  feedUrls: string[],
  limit: number,
  languages: string[],
): Promise<ArticleResponse[]> {
  const queryParams = new URLSearchParams()

  // Add each URL as a separate feed_urls parameter
  feedUrls.forEach((url) => {
    queryParams.append("feed_urls", url)
  })

  // Add other parameters
  queryParams.append("limit", limit.toString())
  languages.forEach((lang) => {
    queryParams.append("languages", lang)
  })

  const response = await fetch(`${API_URL}/api/articles/fetch?${queryParams.toString()}`)

  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.detail || "Failed to fetch articles")
  }

  return response.json()
}
