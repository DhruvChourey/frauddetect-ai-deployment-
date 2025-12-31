# Gemma 3 2B Setup Guide for FraudShield AI

This guide explains how to use the open-source Gemma 3 2B model with FraudShield AI.

## What is Gemma?

Gemma is Google's family of open-source AI models. Unlike Gemini (Google's proprietary API), Gemma models can be run locally or through third-party inference providers like Hugging Face.

## Option 1: Using Hugging Face Inference API (Easiest)

### Step 1: Get a Hugging Face API Token
1. Go to https://huggingface.co/settings/tokens
2. Create a new token (read access is sufficient)
3. Copy the token (starts with `hf_...`)

### Step 2: Update your `.env` file
```env
PROVIDER=gemma
GEMMA_API_KEY=hf_your_token_here
GEMMA_MODEL=google/gemma-3-2b
GEMMA_ENDPOINT=https://api-inference.huggingface.co/models/google/gemma-3-2b
```

### Step 3: Start the server
```bash
npm start
```

### Notes:
- Hugging Face free tier has rate limits
- First request may be slow as the model loads
- Consider upgrading to Hugging Face Pro for better performance

## Option 2: Running Gemma Locally with Ollama

### Step 1: Install Ollama
- Download from https://ollama.ai
- Install and start Ollama

### Step 2: Pull Gemma model
```bash
ollama pull gemma3:2b
```

### Step 3: Update server.js
Modify the Gemma provider section to use Ollama's API endpoint:
```javascript
const endpoint = 'http://localhost:11434/api/generate';
```

### Step 4: Update `.env`
```env
PROVIDER=gemma
GEMMA_ENDPOINT=http://localhost:11434/api/generate
GEMMA_MODEL=gemma3:2b
```

## Option 3: Other Providers

### Google AI Studio / Vertex AI
Gemma is also available through Google Cloud's Vertex AI platform.

### Together.ai
Commercial inference API with Gemma support.

## Comparing Options

| Option | Cost | Speed | Setup Difficulty |
|--------|------|-------|-----------------|
| Hugging Face Free | Free (limited) | Slow (cold starts) | Easy |
| Hugging Face Pro | ~$9/month | Fast | Easy |
| Ollama Local | Free (uses your GPU/CPU) | Depends on hardware | Medium |
| Google Vertex AI | Pay per use | Fast | Hard |

## Troubleshooting

### "Model is loading" error
- Hugging Face models need time to load on first request
- Wait 30-60 seconds and try again

### Rate limit errors
- Upgrade to Hugging Face Pro
- Use Ollama locally instead

### Slow responses
- Consider using a smaller model
- Check your internet connection for cloud APIs
- For local: ensure adequate GPU/RAM

## Model Variants

You can try other Gemma variants by changing `GEMMA_MODEL`:
- `google/gemma-3-2b` - 3 billion parameters (fastest, least capable)
- `google/gemma-3-9b` - 9 billion parameters (balanced)
- `google/gemma-3-27b` - 27 billion parameters (slowest, most capable)

Or with Ollama:
- `gemma3:2b` - Gemma 3 2B
- `gemma3:9b` - Gemma 3 9B
- `gemma3:27b` - Gemma 3 27B

## Need Help?

- Hugging Face docs: https://huggingface.co/docs/api-inference/index
- Ollama docs: https://ollama.ai/docs
- Gemma model card: https://huggingface.co/google/gemma-2-2b
