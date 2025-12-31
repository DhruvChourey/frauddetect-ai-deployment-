
# FraudShield AI – Real-Time Scam, Fake-News & Phishing Detection App

Production-ready Node.js + Express app with HTML/CSS/JS frontend using Gemini API for scam, fake-news, and phishing detection.

## Features
- Scan plain text, URLs, and news articles.
- Gemini-powered verdict with score, category, reason, and suggested truth sources.
- **Smart caching system** - Duplicate scans use cached results (no API calls!)
- **Optimized token usage** - Shortened prompts and content preview (max 500 chars)
- JSON file database at `data/history.json`.
- Cache storage at `data/cache.json` for instant repeated lookups.
- History UI with filters, search, delete, and clear-all.
- Optional Chrome extension for quick page scans.

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.sample` to `.env` and set the appropriate keys and provider.

   - **To run locally without real API keys (free)**: set `PROVIDER=mock` in `.env`.
   - **To use Google Gemini**: set `PROVIDER=gemini` and `GEMINI_API_KEY`.
   - **To use OpenAI**: set `PROVIDER=openai` and `OPENAI_API_KEY`.
3. Ensure `data/history.json` is writable (the app will create it if missing).

## Run
```bash
npm start
```

Backend runs on `http://localhost:3000` and serves frontend from `public/`.

## Notes about providers and quotas
- The `mock` provider is free and useful for local testing; it returns deterministic results.
- If you use `gemini` or `openai`, make sure your API keys have billing and sufficient quota to avoid 429 errors.
- **Smart Caching**: Identical scans are cached and return instantly without using API quota!
- **Token Optimization**: Content is limited to 500 characters to reduce API token usage
- Free tier Gemini allows 20 requests/day - caching helps you maximize this limit
- Check cache stats: `GET http://localhost:3000/api/cache/stats`
- You can change the provider via the `PROVIDER` env var without changing code.
