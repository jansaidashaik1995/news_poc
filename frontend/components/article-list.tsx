"use client"

import { useState, useEffect } from "react"
import { useNews } from "@/context/news-context"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Twitter, Linkedin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import type { Article } from "@/types/article"

function getSentimentColor(sentiment: string) {
  const normalizedSentiment = sentiment.toUpperCase()
  switch (normalizedSentiment) {
    case "POSITIVE":
      return "bg-green-100 text-green-800 hover:bg-green-100"
    case "NEGATIVE":
      return "bg-red-100 text-red-800 hover:bg-red-100"
    case "NEUTRAL":
    default:
      return "bg-blue-100 text-blue-800 hover:bg-blue-100"
  }
}

function getLanguageName(code: string) {
  switch (code) {
    case "en":
      return "English"
    case "hi":
      return "Hindi"
    case "te":
      return "Telugu"
    default:
      return code.toUpperCase()
  }
}

function ArticleCard({ article }: { article: Article }) {
  const [activeLanguage, setActiveLanguage] = useState<string>("en")

  useEffect(() => {
    if (article && article.generated_contents && article.generated_contents.length > 0) {
      setActiveLanguage(article.generated_contents[0]?.language || "en")
    }
  }, [article])

  const handleRefine = () => {
    toast({
      title: "Refine Article",
      description: `Refining article "${article.title}" in ${getLanguageName(activeLanguage)}...`,
    })
  }

  const handleTwitterPublish = () => {
    toast({
      title: "Publish to Twitter",
      description: `Publishing article "${article.title}" to Twitter in ${getLanguageName(activeLanguage)}...`,
    })
  }

  const handleLinkedInPublish = () => {
    toast({
      title: "Publish to LinkedIn",
      description: `Publishing article "${article.title}" to LinkedIn in ${getLanguageName(activeLanguage)}...`,
    })
  }

  if (!article || !article.generated_contents || article.generated_contents.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{article.title}</CardTitle>
              <CardDescription className="mt-2">
                Source: {article.source}
                <span className="mx-2">•</span>
                Published: {new Date(article.published_date).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge className={getSentimentColor(article.sentiment)}>{article.sentiment}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Summary</h3>
              <p className="text-muted-foreground">{article.summary}</p>
            </div>
            <div className="text-center py-4 text-muted-foreground">
              <p>No generated content available for this article yet.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const activeArticle = article.generated_contents.find((gen) => gen.language === activeLanguage)

  // If no content is available for the selected language, show a message
  if (!activeArticle) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">{article.title}</CardTitle>
              <CardDescription className="mt-2">
                Source: {article.source}
                <span className="mx-2">•</span>
                Published: {new Date(article.published_date).toLocaleDateString()}
              </CardDescription>
            </div>
            <Badge className={getSentimentColor(article.sentiment)}>{article.sentiment}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="flex gap-2">
              {article.generated_contents.map((gen) => (
                <Button
                  key={gen.language}
                  variant={gen.language === activeLanguage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveLanguage(gen.language)}
                >
                  {getLanguageName(gen.language)}
                </Button>
              ))}
            </div>
          </div>
          <div className="text-center py-4 text-muted-foreground">
            <p>No content available for {getLanguageName(activeLanguage)}.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl">{activeArticle.title || article.title}</CardTitle>
            <CardDescription className="mt-2">
              Source: {article.source}
              <span className="mx-2">•</span>
              Published: {new Date(article.published_date).toLocaleDateString()}
            </CardDescription>
          </div>
          <Badge className={getSentimentColor(activeArticle.sentiment || article.sentiment)}>
            {activeArticle.sentiment || article.sentiment}
            {activeArticle.sentiment_score ? ` (${activeArticle.sentiment_score.toFixed(2)})` : ""}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {article.image_base64 && (
          <div className="mb-4">
            <img
              src={`data:image/jpeg;base64,${article.image_base64}`}
              alt={article.title}
              className="w-full h-auto rounded-md object-cover max-h-64"
            />
          </div>
        )}

        <div className="mb-6">
          <div className="flex items-center mb-4">
            <div className="mr-2 font-medium">Language:</div>
            <div className="flex gap-2">
              {article.generated_contents.map((gen) => (
                <Button
                  key={gen.language}
                  variant={gen.language === activeLanguage ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveLanguage(gen.language)}
                >
                  {getLanguageName(gen.language)}
                </Button>
              ))}
            </div>
          </div>

          {/* Content for the active language - displayed by default */}
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <div className="bg-muted/50 p-4 rounded-md">
                <p>{activeArticle.summary}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Full Article</h3>
              <div className="prose max-w-none dark:prose-invert">
                {activeArticle.content.split("\n\n").map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 justify-between items-center border-t pt-4">
        <div className="text-sm text-muted-foreground">
          Generated on {new Date(activeArticle.generated_date).toLocaleString()}
        </div>
        <div className="flex gap-2 mt-2 sm:mt-0">
          <Button size="sm" variant="outline" onClick={handleRefine}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refine
          </Button>
          <Button size="sm" variant="outline" onClick={handleTwitterPublish}>
            <Twitter className="h-4 w-4 mr-2" />
            Twitter
          </Button>
          <Button size="sm" variant="outline" onClick={handleLinkedInPublish}>
            <Linkedin className="h-4 w-4 mr-2" />
            LinkedIn
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export function ArticleList() {
  const { articles, isLoading, error } = useNews()

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} className="mb-6">
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!articles || articles.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>No articles generated yet. Enter RSS feed URLs and click Generate.</p>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Generated Articles</h2>
      {articles.map((article) => (
        <ArticleCard key={article.id || `article-${Math.random()}`} article={article} />
      ))}
    </div>
  )
}
