import type { SentimentType } from "@/types/article"

// Get API URL from localStorage or use default
const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const savedUrl = localStorage.getItem("apiUrl")
    // Make sure the URL doesn't end with a slash
    if (savedUrl) {
      return savedUrl.endsWith("/") ? savedUrl.slice(0, -1) : savedUrl
    }
    return "http://127.0.0.1:8000"
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000"
}

// Improved fetch with timeout that properly handles abort signals
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 10000) {
  // Create a new AbortController if one wasn't provided
  const controller = new AbortController()

  // Set up the timeout
  const timeoutId = setTimeout(() => {
    console.log(`⏱️ Request to ${url} timed out after ${timeoutMs}ms`)
    controller.abort(new Error(`Request timed out after ${timeoutMs}ms`))
  }, timeoutMs)

  try {
    // Create a new options object with our abort controller's signal
    const fetchOptions = {
      ...options,
      signal: controller.signal,
    }

    // Make the fetch request
    const response = await fetch(url, fetchOptions)
    return response
  } catch (error) {
    // Rethrow the error with a proper message
    if (error.name === "AbortError") {
      throw new Error(`Request timed out after ${timeoutMs}ms`)
    }
    throw error
  } finally {
    // Always clear the timeout to prevent memory leaks
    clearTimeout(timeoutId)
  }
}

// Retry function with exponential backoff
async function fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 1) {
  let retries = 0
  let lastError: Error

  while (retries <= maxRetries) {
    try {
      console.log(`🔄 Attempt ${retries + 1}/${maxRetries + 1} for ${url}`)

      // Use our improved fetchWithTimeout instead of raw fetch
      // Reduce timeout for retries to fail faster
      const timeoutMs = retries === 0 ? 10000 : 5000
      const response = await fetchWithTimeout(url, options, timeoutMs)
      return response
    } catch (error) {
      console.error(`❌ Attempt ${retries + 1} failed:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))

      // Don't retry if it was manually aborted (not a timeout)
      if (error.name === "AbortError" && !error.message.includes("timed out")) {
        console.log("Request was manually aborted, not retrying")
        throw lastError
      }

      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, retries), 5000)
      console.log(`⏱️ Retrying in ${delay}ms...`)
      await new Promise((resolve) => setTimeout(resolve, delay))
      retries++
    }
  }

  throw lastError
}

export async function fetchArticles(
  feedUrls: string[],
  languages: string[] = ["en", "hi", "te"],
  limit = 3,
  sentiment?: SentimentType,
) {
  console.log("🔍 fetchArticles function called with:", { feedUrls, languages, limit, sentiment })

  const API_BASE_URL = getApiBaseUrl()
  console.log("🔍 Using API base URL:", API_BASE_URL)

  // Build URL with proper query parameter format for FastAPI
  // FastAPI expects repeated query parameters for lists
  const url = new URL(`${API_BASE_URL}/api/articles/fetch`)

  // Add each feed URL as a separate feed_urls parameter
  feedUrls.forEach((feedUrl) => {
    url.searchParams.append("feed_urls", feedUrl)
  })

  // Add each language as a separate languages parameter
  languages.forEach((lang) => {
    url.searchParams.append("languages", lang)
  })

  // Add limit
  url.searchParams.append("limit", limit.toString())

  // Add sentiment if provided
  if (sentiment) {
    url.searchParams.append("sentiment", sentiment)
  }

  const apiUrl = url.toString()
  console.log("🔍 Constructed API URL:", apiUrl)

  try {
    // First, do a quick check to see if the API is reachable with a short timeout
    console.log("🔍 Checking if API is reachable...")
    try {
      // Use the health endpoint for the check
      const checkResponse = await fetchWithTimeout(`${API_BASE_URL}/health`, {}, 3000)
      console.log("✅ API is reachable, status:", checkResponse.status)

      // If the API returns a 404 or other error status, don't proceed
      if (!checkResponse.ok) {
        // If the health endpoint doesn't exist, try the root endpoint
        if (checkResponse.status === 404) {
          console.log("Health endpoint not found, trying root endpoint...")
          const altCheckResponse = await fetchWithTimeout(`${API_BASE_URL}/`, {}, 3000)
          if (!altCheckResponse.ok) {
            throw new Error(`API server returned status ${altCheckResponse.status}: ${altCheckResponse.statusText}`)
          }
        } else {
          let errorMessage = `API server returned status ${checkResponse.status}: ${checkResponse.statusText}`

          try {
            // Try to get more detailed error information
            const errorData = await checkResponse.json().catch(() => ({}))
            if (errorData && errorData.detail) {
              errorMessage = errorData.detail
            }
          } catch (e) {
            // If we can't parse the JSON, just use the status message
            console.error("Could not parse error response:", e)
          }

          throw new Error(errorMessage)
        }
      }
    } catch (error) {
      console.error("❌ API connection check failed:", error)

      // Create a more user-friendly error message
      let errorMessage =
        "Cannot connect to API server. Please check your API URL settings and ensure the server is running."

      if (error instanceof Error) {
        if (error.message.includes("timed out")) {
          errorMessage =
            "API server is not responding. The request timed out. Please check if the server is running and accessible."
        } else {
          errorMessage = error.message
        }
      }

      throw new Error(errorMessage)
    }

    // Now proceed with the actual request
    console.log("🔍 Proceeding with article fetch request")

    try {
      // Use fetchWithRetry for better reliability
      const response = await fetchWithRetry(
        apiUrl,
        {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
        },
        1, // 1 retry (2 attempts total)
      )

      console.log("🔍 Fetch response received:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
      })

      if (!response.ok) {
        console.error("❌ Response not OK")
        let errorMessage = `Failed to fetch articles: ${response.status}`

        try {
          const errorData = await response.json()
          console.error("❌ Error data from API:", errorData)
          errorMessage = errorData.detail || errorMessage
        } catch (e) {
          console.error("❌ Could not parse error response as JSON:", e)
          try {
            const textError = await response.text()
            console.error("❌ Error response as text:", textError)
          } catch (textError) {
            console.error("❌ Could not get error response as text either:", textError)
          }
        }

        throw new Error(errorMessage)
      }

      console.log("✅ Response OK, parsing JSON")
      const data = await response.json()
      console.log("✅ API response data:", data)
      return data
    } catch (error) {
      throw error
    }
  } catch (error) {
    console.error("❌ Fetch error in fetchArticles:", error)

    // Check if it's an abort error (timeout)
    if (error.name === "AbortError" || (error instanceof Error && error.message.includes("timed out"))) {
      throw new Error(
        "Request timed out. The API server might be unavailable or taking too long to respond. Please check your API settings.",
      )
    }

    // Check if it's a network error
    if (error.message === "Failed to fetch") {
      throw new Error(
        "Network error: Could not connect to the API server. Please check if the server is running and accessible.",
      )
    }

    // If it's already an Error object, just throw it
    if (error instanceof Error) {
      throw error
    }

    // Otherwise, wrap it in an Error
    throw new Error(String(error))
  }
}

export async function getArticleById(articleId: string) {
  const API_BASE_URL = getApiBaseUrl()

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/articles/${articleId}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))
      throw new Error(errorData.detail || "Failed to fetch article")
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching article:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(String(error))
  }
}

export async function getGeneratedContent(articleId: string, language = "en") {
  const API_BASE_URL = getApiBaseUrl()

  try {
    const response = await fetchWithTimeout(`${API_BASE_URL}/api/generated/${articleId}?language=${language}`)

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Unknown error" }))
      throw new Error(errorData.detail || "Failed to fetch generated content")
    }

    return response.json()
  } catch (error) {
    console.error("Error fetching generated content:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error(String(error))
  }
}
