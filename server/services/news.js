// ═══════════════════════════════════════════════════════
// REAL NEWS — NewsAPI + GDELT fallback
// NewsAPI: https://newsapi.org (free: 100 req/day)
// GDELT: https://gdeltproject.org (free, no key)
// ═══════════════════════════════════════════════════════
import * as cache from './cache.js';
import { CONFIG } from '../config.js';
import { getArticles as getFallback, initializeNews } from '../data/news.js';

const CACHE_KEY = 'news:live';
let articleIdCounter = 9000;

const GEO_KEYWORDS = [
  'war','military','conflict','sanctions','nuclear','troops','missile','attack',
  'Ukraine','Russia','Gaza','Hamas','Israel','China','Taiwan','Iran','NATO',
  'cyber attack','airstrike','drone','geopolitical','coup','ceasefire'
];

function formatNewsAPIArticle(a, sourceMap) {
  const src = sourceMap[a.source?.id] || { credibility:3, bias:'center', country:'Unknown' };
  return {
    id: `NA${articleIdCounter++}`,
    headline: a.title?.replace(/ - [^-]+$/, '') || 'No title',
    body: a.content?.replace(/\[\+\d+ chars\]/, '').trim() || a.description || 'Full content available at source.',
    region: guessRegion(a.title + ' ' + (a.description||'')),
    category: guessCategory(a.title + ' ' + (a.description||'')),
    urgency: guessUrgency(a.title),
    source: a.source?.name || 'Unknown',
    sourceCountry: src.country,
    sourceUrl: a.url || '',
    credibility: src.credibility,
    bias: src.bias,
    timestamp: a.publishedAt || new Date().toISOString(),
    breaking: /breaking|urgent|alert|just in/i.test(a.title),
    verified: true,
    readTime: Math.ceil((a.content||'').length / 1000) || 2,
    tags: extractTags(a.title + ' ' + (a.description||'')),
    liveData: true,
  };
}

function guessRegion(text) {
  const t = text.toLowerCase();
  if (/ukraine|russia|belarus|moldova|nato|poland|baltics/i.test(t)) return 'Eastern Europe';
  if (/gaza|israel|hamas|hezbollah|iran|iraq|syria|lebanon|yemen|houthi/i.test(t)) return 'Middle East';
  if (/china|taiwan|japan|korea|hong kong|pla/i.test(t)) return 'East Asia';
  if (/africa|sudan|congo|mali|sahel|ethiopia|nigeria/i.test(t)) return 'Africa';
  if (/india|pakistan|afghanistan|bangladesh/i.test(t)) return 'South Asia';
  if (/myanmar|thailand|vietnam|philippines|indonesia/i.test(t)) return 'SE Asia';
  if (/europe|eu |european union|nato|brussels/i.test(t)) return 'Europe';
  if (/america|united states|pentagon|washington/i.test(t)) return 'North America';
  return 'Global';
}

function guessCategory(text) {
  const t = text.toLowerCase();
  if (/nuclear|warhead|uranium|enrichment|icbm/i.test(t)) return 'nuclear';
  if (/cyber|hack|ransomware|malware|breach/i.test(t)) return 'cyber';
  if (/war|attack|airstrike|missile|troops|military op/i.test(t)) return 'war';
  if (/conflict|fighting|ceasefire|casualties/i.test(t)) return 'conflict';
  if (/sanction|trade|gdp|economy|oil price|inflation/i.test(t)) return 'economics';
  if (/diplomat|summit|treaty|talks|negotiations/i.test(t)) return 'diplomacy';
  return 'geopolitics';
}

function guessUrgency(text) {
  if (/breaking|urgent|alert|critical|emergency/i.test(text)) return 'critical';
  if (/attack|strike|launch|explosion|killed/i.test(text)) return 'high';
  if (/warns|threatens|condemns|protests/i.test(text)) return 'medium';
  return 'low';
}

function extractTags(text) {
  const tags = [];
  const checks = {
    Ukraine:/ukraine/i, Russia:/russia/i, China:/china/i, USA:/united states|pentagon|washington/i,
    Israel:/israel/i, Iran:/iran/i, Gaza:/gaza/i, Hamas:/hamas/i, NATO:/nato/i,
    Nuclear:/nuclear/i, Cyber:/cyber/i, Military:/military|troops|army/i,
    'North Korea':/north korea|dprk/i, Taiwan:/taiwan/i, Houthis:/houthi/i,
  };
  Object.entries(checks).forEach(([tag, re]) => { if (re.test(text)) tags.push(tag); });
  return tags.slice(0, 6);
}

const SOURCE_META = {
  'reuters':          { credibility:5, bias:'center',      country:'UK' },
  'associated-press': { credibility:5, bias:'center',      country:'US' },
  'bbc-news':         { credibility:5, bias:'center-left', country:'UK' },
  'al-jazeera-english':{ credibility:4,bias:'left',        country:'Qatar' },
  'the-guardian':     { credibility:4, bias:'left',        country:'UK' },
  'the-washington-post':{ credibility:4,bias:'left',       country:'US' },
  'the-new-york-times':{ credibility:4,bias:'left',        country:'US' },
  'bloomberg':        { credibility:5, bias:'center',      country:'US' },
  'financial-times':  { credibility:5, bias:'center',      country:'UK' },
  'politico':         { credibility:4, bias:'center-left', country:'US' },
  'defense-news':     { credibility:5, bias:'center',      country:'US' },
  'foreign-policy':   { credibility:4, bias:'center',      country:'US' },
  'the-economist':    { credibility:5, bias:'center',      country:'UK' },
};

export async function fetchNews() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  // Try NewsAPI first
  if (CONFIG.NEWS_API_KEY) {
    try {
      const query = 'war OR military OR conflict OR sanctions OR nuclear OR NATO OR Ukraine OR Gaza OR China OR Iran';
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=40&apiKey=${CONFIG.NEWS_API_KEY}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (res.ok) {
        const data = await res.json();
        if (data.articles?.length > 5) {
          const articles = data.articles
            .filter(a => a.title && !a.title.includes('[Removed]'))
            .map(a => formatNewsAPIArticle(a, SOURCE_META))
            .filter(Boolean);
          cache.set(CACHE_KEY, articles, CONFIG.CACHE.NEWS);
          console.log(`[News] ✅ NewsAPI: ${articles.length} articles`);
          return articles;
        }
      }
    } catch(e) {
      console.warn(`[News] ⚠️  NewsAPI failed: ${e.message}`);
    }
  }

  // Fallback: GDELT (no key, free)
  try {
    const query = GEO_KEYWORDS.slice(0,5).join(' OR ');
    const url = `https://api.gdeltproject.org/api/v2/doc/doc?query=${encodeURIComponent(query)}&mode=artlist&maxrecords=25&format=json&timespan=1d`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const data = await res.json();
      if (data.articles?.length > 3) {
        const articles = data.articles.map(a => ({
          id: `GD${articleIdCounter++}`,
          headline: a.title || 'No title',
          body: a.seendate ? `Published: ${a.seendate}. Full article at source.` : 'Full article at source.',
          region: guessRegion(a.title||''), category: guessCategory(a.title||''),
          urgency: guessUrgency(a.title||''), source: a.domain || 'GDELT',
          sourceCountry: 'Unknown', sourceUrl: a.url || '', credibility: 3, bias: 'center',
          timestamp: new Date().toISOString(), breaking: false, verified: false, readTime: 2,
          tags: extractTags(a.title||''), liveData: true,
        }));
        cache.set(CACHE_KEY, articles, CONFIG.CACHE.NEWS);
        console.log(`[News] ✅ GDELT: ${articles.length} articles`);
        return articles;
      }
    }
  } catch(e) {
    console.warn(`[News] ⚠️  GDELT failed: ${e.message}`);
  }

  // Final fallback
  console.warn('[News] ⚠️  Using simulated news');
  const fallback = getFallback(40);
  cache.set(CACHE_KEY, fallback, 60);
  return fallback;
}
