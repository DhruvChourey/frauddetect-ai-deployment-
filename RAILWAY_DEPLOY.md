# Railway Deployment Guide for FraudShield AI

## 🚀 Quick Deploy to Railway

### Step 1: Prepare Your Repository
1. Make sure all your code is committed to a Git repository (GitHub, GitLab, or Bitbucket)
2. Push your changes:
```bash
git add .
git commit -m "Prepare for Railway deployment"
git push origin main
```

### Step 2: Deploy to Railway

#### Option A: Deploy from GitHub (Recommended)
1. Go to [Railway](https://railway.app/)
2. Sign up or log in with your GitHub account
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Choose your `fraudshield-ai` repository
6. Railway will automatically detect your Node.js app

#### Option B: Deploy using Railway CLI
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### Step 3: Configure Environment Variables

In your Railway project dashboard, go to **Variables** tab and add these:

#### ⚙️ Required Variables

| Variable Name | Value | Description |
|--------------|-------|-------------|
| `NODE_ENV` | `production` | Sets environment to production |
| `PORT` | Auto-set by Railway | Railway automatically sets this |
| `PROVIDER` | `gemini` | AI provider (gemini, openai, mock, or gemma) |
| `GEMINI_API_KEY` | `your_api_key_here` | Your Gemini API key from Google AI Studio |

#### 🔧 Optional Variables

| Variable Name | Default Value | Description |
|--------------|---------------|-------------|
| `GEMINI_MODEL` | `gemini-2.0-flash-exp` | Gemini model to use |
| `CORS_ORIGIN` | `*` | Allowed origins for CORS (use your domain for security) |
| `OPENAI_API_KEY` | - | Only if using OpenAI provider |
| `OPENAI_MODEL` | `gpt-3.5-turbo` | OpenAI model to use |
| `GEMMA_API_KEY` | - | Only if using Gemma provider |
| `GEMMA_MODEL` | `google/gemma-3-2b` | Gemma model name |
| `GEMMA_ENDPOINT` | `https://api-inference.huggingface.co/models/google/gemma-3-2b` | Gemma API endpoint |

### Step 4: Get Your Gemini API Key

1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the API key
5. Add it to Railway as `GEMINI_API_KEY`

### Step 5: Deploy and Test

1. Railway will automatically build and deploy your app
2. Once deployed, Railway will provide a public URL (e.g., `https://fraudshield-ai-production.up.railway.app`)
3. Test the health check endpoint: `https://your-app.railway.app/health`
4. Visit your app: `https://your-app.railway.app`

## 📊 Monitoring Your App

### Health Check
Your app includes a health check endpoint at `/health` that returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-31T...",
  "environment": "production",
  "cacheSize": 42
}
```

### View Logs
In Railway dashboard:
1. Go to your project
2. Click on "Deployments"
3. Select your deployment
4. View real-time logs

### Common Issues

#### Issue: "GEMINI_API_KEY is not configured"
**Solution**: Make sure you've added `GEMINI_API_KEY` in Railway's Variables tab

#### Issue: API rate limits exceeded
**Solution**: 
- The app has built-in caching to reduce API calls
- Check cache stats: `GET /api/cache/stats`
- Consider upgrading your Gemini API quota

#### Issue: App crashes on startup
**Solution**: 
- Check Railway logs for errors
- Ensure all environment variables are set
- Verify your API keys are valid

## 💰 Estimated Costs

### Railway Pricing
- **Hobby Plan**: $5/month + usage
  - 500 hours execution time
  - $0.000231/GB-hour for memory
  
### API Costs
- **Gemini Free Tier**: 15 requests/minute, 1500 requests/day
- **Gemini Paid**: Pay per million tokens
- Smart caching in this app reduces API calls significantly!

## 🔒 Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use specific CORS_ORIGIN** in production instead of `*`
3. **Keep API keys secure** - Only store in Railway Variables
4. **Monitor API usage** - Check your Google Cloud Console regularly

## 🎯 Post-Deployment Checklist

- [ ] App is accessible via Railway URL
- [ ] Health check endpoint returns "healthy"
- [ ] Environment variables are configured
- [ ] Test scan functionality works
- [ ] Check logs for any errors
- [ ] Set up custom domain (optional)
- [ ] Configure CORS for your frontend domain
- [ ] Monitor API usage and costs

## 📝 Custom Domain (Optional)

1. In Railway project, go to "Settings"
2. Click "Generate Domain" or add your custom domain
3. Update your DNS records as instructed
4. Update `CORS_ORIGIN` to your domain

## 🔄 Continuous Deployment

Railway automatically redeploys when you push to your main branch:
```bash
git add .
git commit -m "Update feature"
git push origin main
# Railway will automatically deploy!
```

## Support

- Railway Documentation: https://docs.railway.app/
- Gemini API Docs: https://ai.google.dev/docs
- GitHub Issues: [Your Repository Issues]

---

**Deployed Successfully?** 🎉 Your FraudShield AI is now protecting users worldwide!
