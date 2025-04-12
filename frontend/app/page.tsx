import { NewsGeneratorForm } from "@/components/news-generator-form"
import { ArticleList } from "@/components/article-list"
import { Toaster } from "@/components/ui/toaster"

export default function Home() {
  return (
    <div className="container mx-auto py-8 px-4">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-center mb-2">AI News Pipeline</h1>
        <p className="text-center text-muted-foreground">
          Generate AI-powered news articles from RSS feeds in multiple languages
        </p>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4">
          <NewsGeneratorForm />
        </div>
        <div className="md:col-span-8">
          <ArticleList />
        </div>
      </main>
      <Toaster />
    </div>
  )
}
