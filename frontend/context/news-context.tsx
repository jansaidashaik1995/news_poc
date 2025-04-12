"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { ArticleResponse } from "@/types/article"

interface NewsContextType {
  articles: ArticleResponse[]
  isLoading: boolean
  error: string | null
  setArticles: (articles: ArticleResponse[]) => void
  setIsLoading: (isLoading: boolean) => void
  setError: (error: string | null) => void
  clearArticles: () => void
}

const NewsContext = createContext<NewsContextType | undefined>(undefined)

export function NewsProvider({ children }: { children: ReactNode }) {
  const [articles, setArticles] = useState<ArticleResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearArticles = () => setArticles([])

  return (
    <NewsContext.Provider
      value={{
        articles,
        isLoading,
        error,
        setArticles,
        setIsLoading,
        setError,
        clearArticles,
      }}
    >
      {children}
    </NewsContext.Provider>
  )
}

export function useNews() {
  const context = useContext(NewsContext)
  if (context === undefined) {
    throw new Error("useNews must be used within a NewsProvider")
  }
  return context
}
