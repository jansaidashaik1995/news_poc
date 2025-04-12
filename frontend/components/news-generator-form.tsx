"use client"

import type React from "react"

import { useState } from "react"
import { useNews } from "@/context/news-context"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

const LANGUAGE_OPTIONS = [
  { id: "en", label: "English" },
  { id: "hi", label: "Hindi" },
  { id: "te", label: "Telugu" },
]

export function NewsGeneratorForm() {
  const { setArticles, isLoading, setIsLoading, setError, clearArticles } = useNews()

  const [feedUrls, setFeedUrls] = useState("")
  const [limit, setLimit] = useState(5)
  const [selectedLanguages, setSelectedLanguages] = useState(["en"])

  const handleLanguageChange = (languageId: string, checked: boolean) => {
    setSelectedLanguages((prev) => (checked ? [...prev, languageId] : prev.filter((id) => id !== languageId)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!feedUrls.trim()) {
      toast({
        title: "Error",
        description: "Please enter at least one RSS feed URL",
        variant: "destructive",
      })
      return
    }

    if (selectedLanguages.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one language",
        variant: "destructive",
      })
      return
    }

    const urls = feedUrls.split("\n").filter((url) => url.trim())

    if (urls.length === 0) {
      toast({
        title: "Error",
        description: "Please enter valid RSS feed URLs",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    clearArticles()
    setError(null)

    try {
      const queryParams = new URLSearchParams()

      // Add each URL as a separate feed_urls parameter
      urls.forEach((url) => {
        queryParams.append("feed_urls", url.trim())
      })

      // Add other parameters
      queryParams.append("limit", limit.toString())
      selectedLanguages.forEach((lang) => {
        queryParams.append("languages", lang)
      })

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/articles/fetch?${queryParams.toString()}`,
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to fetch articles")
      }

      const data = await response.json()
      setArticles(data)

      toast({
        title: "Success",
        description: `Generated ${data.length} articles`,
      })
    } catch (error) {
      console.error("Error fetching articles:", error)
      setError(error instanceof Error ? error.message : "An unknown error occurred")

      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate articles",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <CardTitle>Generate News Articles</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="feedUrls">RSS Feed URLs (one per line)</Label>
            <textarea
              id="feedUrls"
              className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="https://feeds.bbci.co.uk/news/world/rss.xml"
              value={feedUrls}
              onChange={(e) => setFeedUrls(e.target.value)}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="limit">Number of Articles: {limit}</Label>
            <Slider
              id="limit"
              min={1}
              max={20}
              step={1}
              value={[limit]}
              onValueChange={(value) => setLimit(value[0])}
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label>Languages</Label>
            <div className="flex flex-wrap gap-4">
              {LANGUAGE_OPTIONS.map((language) => (
                <div key={language.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={`language-${language.id}`}
                    checked={selectedLanguages.includes(language.id)}
                    onCheckedChange={(checked) => handleLanguageChange(language.id, checked as boolean)}
                    disabled={isLoading}
                  />
                  <Label htmlFor={`language-${language.id}`}>{language.label}</Label>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating Articles...
              </>
            ) : (
              "Generate Articles"
            )}
          </Button>
        </form>
      </CardContent>
      <Toaster />
    </Card>
  )
}
