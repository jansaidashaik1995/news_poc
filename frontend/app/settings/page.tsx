import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DefaultRssFeeds } from "@/components/default-rss-feeds"
import { ApiSettings } from "@/components/api-settings"

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>API Settings</CardTitle>
            <CardDescription>Configure the API connection settings</CardDescription>
          </CardHeader>
          <CardContent>
            <ApiSettings />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Default RSS Feeds</CardTitle>
            <CardDescription>Manage your default RSS feed sources</CardDescription>
          </CardHeader>
          <CardContent>
            <DefaultRssFeeds />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
