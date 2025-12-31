import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const HISTORY_PATH = path.join(__dirname, 'data', 'history.json');
const CACHE_PATH = path.join(__dirname, 'data', 'cache.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
  console.log('Created data directory');
}

// In-memory cache for faster lookups
const responseCache = new Map();

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Request logging for production
if (NODE_ENV === 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// Load cache from disk
function loadCache() {
  try {
    if (fs.existsSync(CACHE_PATH)) {
      const data = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
      Object.entries(data).forEach(([key, value]) => responseCache.set(key, value));
      console.log(`Loaded ${responseCache.size} cached responses`);
    }
  } catch (e) {
    console.error('Failed to load cache', e);
  }
}

// Save cache to disk
function saveCache() {
  try {
    const cacheObj = Object.fromEntries(responseCache);
    fs.writeFileSync(CACHE_PATH, JSON.stringify(cacheObj, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save cache', e);
  }
}

// Generate cache key from content
function getCacheKey(content, type) {
  const normalized = content.toLowerCase().trim();
  return crypto.createHash('md5').update(`${type}:${normalized}`).digest('hex');
}

// Initialize cache on startup
loadCache();

function readHistory() {
  try {
    if (!fs.existsSync(HISTORY_PATH)) {
      fs.writeFileSync(HISTORY_PATH, '[]', 'utf8');
    }
    const raw = fs.readFileSync(HISTORY_PATH, 'utf8') || '[]';
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to read history', e);
    return [];
  }
}

function writeHistory(history) {
  fs.writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2), 'utf8');
}

async function callProvider({ type, content, url }) {
  // Check cache first - save API quota!
  const cacheKey = getCacheKey(content || url || '', type);
  if (responseCache.has(cacheKey)) {
    console.log('✓ Cache hit - no API call needed!');
    return { ...responseCache.get(cacheKey), cached: true };
  }

  const provider = (process.env.PROVIDER || (process.env.USE_MOCK === 'true' ? 'mock' : 'gemini')).toLowerCase();

  // Mock provider for free local testing
  if (provider === 'mock') {
    const lowered = (content || '').toLowerCase();
    let verdict = 'safe';
    let score = 90;
    let reason = 'Mocked response';
    let category = type;
    if (lowered.includes('prize') || lowered.includes('won') || lowered.includes('click') || lowered.includes('otp') || lowered.includes('bank') || lowered.includes('urgent')) {
      verdict = 'scam';
      score = 10;
      reason = 'Mocked: contains common scam keywords';
    } else if (lowered.startsWith('http') || lowered.includes('http')) {
      verdict = 'suspicious';
      score = 40;
      reason = 'Mocked: suspicious URL detected';
    }
    return { verdict, score, category, reason, suggestedSources: [] };
  }

  // Gemini provider
  if (provider === 'gemini') {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { verdict: 'error', score: 0, category: 'configuration', reason: 'GEMINI_API_KEY is not configured on the server.', suggestedSources: [] };
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';
    // MINIMAL prompt - only ~50 tokens to use 1 API token per search
    const contentPreview = content.length > 500 ? content.substring(0, 500) + '...' : content;
    const prompt = `Analyze this for scams/phishing/fake-news: "${contentPreview}". Respond JSON only: {verdict:"scam"|"safe"|"suspicious",score:0-100,reason:"brief explanation",category:"${type}"}`;
    const urlApi = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

    try {
      const resp = await fetch(`${urlApi}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        timeout: 30000 // 30 second timeout
      });
      const raw = await resp.text();
      
      if (NODE_ENV === 'development') {
        console.log('Provider=gemini status:', resp.status);
        console.log('Provider=gemini raw response:', raw.substring(0, 500));
      }
      
      if (!resp.ok) {
        console.error(`Gemini API error: ${resp.status} - ${raw.substring(0, 200)}`);
        return { verdict: 'error', score: 0, category: type, reason: `Gemini API request failed with status ${resp.status}`, suggestedSources: [] };
      }
      
      let data;
      try {
        data = JSON.parse(raw);
      } catch (parseErr) {
        console.error('Failed to parse API response:', parseErr);
        return { verdict: 'error', score: 0, category: type, reason: 'Invalid API response format', suggestedSources: [] };
      }
      
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      if (!text) {
        console.error('No text in API response:', JSON.stringify(data).substring(0, 200));
        return { verdict: 'error', score: 0, category: type, reason: 'Empty API response', suggestedSources: [] };
      }
      
      // Clean up markdown-wrapped JSON
      text = text.trim()
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      
      // Extract JSON from text if wrapped in other content
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('No JSON found in response:', text.substring(0, 200));
        return { verdict: 'error', score: 0, category: type, reason: 'No JSON in response', suggestedSources: [] };
      }
      
      text = jsonMatch[0];
      
      // Fix unquoted property names (Gemini sometimes returns invalid JSON like {verdict:"safe"})
      text = text.replace(/(\w+):/g, '"$1":');
      
      const result = JSON.parse(text);
      
      // Cache the result to save API calls
      responseCache.set(cacheKey, result);
      saveCache();
      console.log('✓ Response cached for future use');
      
      return result;
    } catch (e) {
      console.error('Gemini provider error', e.message);
      return { verdict: 'error', score: 0, category: type, reason: 'Gemini provider error: ' + e.message, suggestedSources: [] };
    }
  }

  // OpenAI provider (Chat Completions)
  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return { verdict: 'error', score: 0, category: 'configuration', reason: 'OPENAI_API_KEY is not configured on the server.', suggestedSources: [] };
    }
    const system = 'You are FraudShield AI, an expert in detecting scams, phishing, and fake news. Respond with a JSON object only.';
    const user = `Type: ${type}\nURL: ${url || 'N/A'}\nContent: ${content}`;
    try {
      const resp = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo', messages: [{ role: 'system', content: system }, { role: 'user', content: user }], max_tokens: 500 })
      });
      const raw = await resp.text();
      console.log('Provider=openai status:', resp.status);
      console.log('Provider=openai raw:', raw);
      if (!resp.ok) return { verdict: 'error', score: 0, category: type, reason: `OpenAI API request failed with status ${resp.status} - ${raw || 'no body'}`, suggestedSources: [] };
      const data = JSON.parse(raw || '{}');
      const text = data.choices?.[0]?.message?.content || '{}';
      const cleaned = text.trim().replace(/^```json/, '').replace(/```$/, '');
      const result = JSON.parse(cleaned);
      
      // Cache the result to save API calls
      responseCache.set(cacheKey, result);
      saveCache();
      console.log('✓ Response cached for future use');
      
      return result;
    } catch (e) {
      console.error('OpenAI provider error', e);
      return { verdict: 'error', score: 0, category: type, reason: 'OpenAI provider error: ' + e.message, suggestedSources: [] };
    }
  }

  return { verdict: 'error', score: 0, category: type, reason: `Unknown provider: ${provider}`, suggestedSources: [] };
}

async function handleScan(req, res, type) {
  const { text, url } = req.body;
  const content = text || url || '';
  if (!content) {
    return res.status(400).json({ error: 'Missing content to scan.' });
  }

  const aiResult = await callProvider({ type, content, url });

  const record = {
    id: uuidv4(),
    timestamp: new Date().toISOString(),
    userInput: content,
    type,
    score: aiResult.score ?? 0,
    verdict: aiResult.verdict || 'unknown',
    reason: aiResult.reason || 'No reason provided.',
    category: aiResult.category || type,
    suggestedSources: aiResult.suggestedSources || []
  };

  const history = readHistory();
  history.unshift(record);
  writeHistory(history);

  res.json(record);
}

app.post('/api/scan-text', async (req, res) => {
  await handleScan(req, res, 'scam');
});

app.post('/api/scan-url', async (req, res) => {
  await handleScan(req, res, 'url');
});

app.post('/api/scan-news', async (req, res) => {
  await handleScan(req, res, 'news');
});

app.get('/api/history', (req, res) => {
  const history = readHistory();
  res.json(history);
});

// Cache stats endpoint
app.get('/api/cache/stats', (req, res) => {
  res.json({
    cachedResponses: responseCache.size,
    message: 'Cached responses save API quota by returning instant results'
  });
});

// Clear cache endpoint
app.delete('/api/cache', (req, res) => {
  responseCache.clear();
  saveCache();
  res.json({ message: 'Cache cleared successfully' });
});

app.delete('/api/history/:id', (req, res) => {
  const id = req.params.id;
  const history = readHistory();
  const newHistory = history.filter(r => r.id !== id);
  writeHistory(newHistory);
  res.json({ success: true });
});

app.delete('/api/history', (req, res) => {
  writeHistory([]);
  res.json({ success: true });
});

app.get('/api/record/:id', (req, res) => {
  const id = req.params.id;
  const history = readHistory();
  const record = history.find(r => r.id === id);
  if (!record) {
    return res.status(404).json({ error: 'Record not found' });
  }
  res.json(record);
});

// Health check endpoint for Railway
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: NODE_ENV,
    cacheSize: responseCache.size
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler - must be last route
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`FraudShield AI server running on port ${PORT}`);
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Provider: ${process.env.PROVIDER || 'gemini'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing server gracefully...');
  saveCache();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, closing server gracefully...');
  saveCache();
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});