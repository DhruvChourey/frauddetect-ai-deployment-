# 🔐 Railway Environment Variables - Quick Reference

## Copy and paste these into Railway's Variables tab:

### ✅ REQUIRED (Minimum to get started)

```
NODE_ENV=production
PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
```

### 🎯 RECOMMENDED (For better control)

```
NODE_ENV=production
PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash-exp
CORS_ORIGIN=*
```

### 🔧 OPTIONAL (Advanced Configuration)

```
# OpenAI Provider (if using OpenAI instead of Gemini)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# Gemma/Hugging Face Provider (if using Gemma)
GEMMA_API_KEY=your_huggingface_token_here
GEMMA_MODEL=google/gemma-3-2b
GEMMA_ENDPOINT=https://api-inference.huggingface.co/models/google/gemma-3-2b

# Security (replace * with your actual domain in production)
CORS_ORIGIN=https://yourdomain.com
```

---

## 📋 Environment Variables Explained

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | ✅ Yes | `development` | Set to `production` for Railway |
| `PORT` | Auto-set | `3000` | Railway sets this automatically |
| `PROVIDER` | ✅ Yes | `gemini` | AI provider: `gemini`, `openai`, `mock`, or `gemma` |
| `GEMINI_API_KEY` | ✅ Yes* | - | Get from https://aistudio.google.com/app/apikey |
| `GEMINI_MODEL` | No | `gemini-2.0-flash-exp` | Gemini model version |
| `CORS_ORIGIN` | No | `*` | Allowed origins for API requests |
| `OPENAI_API_KEY` | No* | - | Only if PROVIDER=openai |
| `OPENAI_MODEL` | No | `gpt-3.5-turbo` | OpenAI model to use |
| `GEMMA_API_KEY` | No* | - | Hugging Face token if PROVIDER=gemma |
| `GEMMA_MODEL` | No | `google/gemma-3-2b` | Gemma model name |
| `GEMMA_ENDPOINT` | No | HF endpoint | Gemma API endpoint URL |

*Required only if you're using that specific provider

---

## 🚀 Quick Setup Steps

1. **Go to Railway Dashboard** → Your Project → Variables tab
2. **Click "New Variable"**
3. **Add each variable** from the REQUIRED section above
4. **Get your Gemini API key**:
   - Visit: https://aistudio.google.com/app/apikey
   - Click "Create API Key"
   - Copy and paste into `GEMINI_API_KEY`
5. **Save and redeploy**

---

## ⚠️ Important Notes

- **Never commit API keys to Git** - Always use Railway Variables
- **PORT is auto-set** - Railway handles this, don't manually set it
- **Start with mock provider** - Use `PROVIDER=mock` for testing without API costs
- **CORS_ORIGIN** - Set to `*` initially, then restrict to your domain
- **Free tier limits** - Gemini free tier: 15 req/min, 1500 req/day
- **Caching saves API calls** - Duplicate requests use cache (no API cost)

---

## 🧪 Testing Setup

After setting variables, test:
1. Health check: `https://your-app.railway.app/health`
2. Should return: `{"status":"healthy","environment":"production"}`
3. Check logs for "FraudShield AI server running"

---

## 🆘 Troubleshooting

**Error: "GEMINI_API_KEY is not configured"**
→ Add `GEMINI_API_KEY` in Railway Variables

**Error: API rate limit exceeded**
→ App has caching enabled. Check `/api/cache/stats`

**App not starting**
→ Check Railway logs for detailed error messages

---

✅ **Ready to deploy!** Once these are set, Railway will automatically deploy your app.
