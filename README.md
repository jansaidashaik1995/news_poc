# AI News Pipeline

An AI-powered news generation system that fetches articles from RSS feeds, analyzes sentiment, and generates new content in multiple languages using OpenAI.

## Features

- Fetch news articles from multiple RSS feeds
- Generate AI-powered articles in multiple languages (English, Hindi, Telugu)
- Sentiment analysis of content
- Image generation for articles
- Clean, responsive UI built with Next.js and shadcn/ui

## Project Structure

The project consists of two main components:

### Backend (FastAPI)

- Python-based API for fetching and processing news articles
- Integrates with OpenAI for content generation
- Handles RSS feed parsing, content extraction, and image generation

### Frontend (Next.js)

- Modern UI built with Next.js and shadcn/ui
- Form for submitting RSS feeds and selecting languages
- Display of generated articles with language switching

## Prerequisites

- Python 3.9+ (for backend)
- Node.js 18+ (for frontend)
- OpenAI API key
- Poetry (for Python dependency management)
- npm or yarn (for Node.js dependency management)

## Setup Instructions

### Backend Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/jansaidashaik1995/news_poc.git
   cd news_poc


2. Create a venv and install poetry
    ```bash
    poetry install


3. Create a .env file in the backend directory with the following variables:
    ```bash
    # API Settings
    API_HOST=0.0.0.0
    API_PORT=8000
    DEBUG=True

    # OpenAI
    OPENAI_API_KEY=


    # Image Generation
    USE_AI_IMAGES=True


4. Start the FastAPI server:
    ```bash
    poetry run uvicorn app.main:app --reload


### Frontend Setup

1. Navigate to the frontend directory:
    ```bash
    cd frontend

2. Install dependencies:
    ```bash
    npm install
    # or
    yarn install

3. Create a .env.local file with the backend API URL:
    ```bash
    NEXT_PUBLIC_API_URL=http://localhost:8000

4. Start the development server:
    ```bash
    npm run dev
    # or
    yarn dev