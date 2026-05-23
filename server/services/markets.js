// ═══════════════════════════════════════════════════════
// REAL MARKET DATA — Alpha Vantage + ExchangeRate-API
// Alpha Vantage: https://alphavantage.co (free: 25 req/day)
// ExchangeRate-API: https://exchangerate-api.com (free: 1500/month)
// Falls back to realistic random-walk simulation
// ═══════════════════════════════════════════════════════
import * as cache from './cache.js';
import { CONFIG } from '../config.js';
import { getMarkets as getFallback, updateMarkets } from '../data/markets.js';

// ── Stock tickers to fetch ───────────────────────────────
const DEFENSE_TICKERS = [
  {symbol:'LMT',  name:'Lockheed Martin',  country:'US'},
  {symbol:'RTX',  name:'Raytheon',         country:'US'},
  {symbol:'NOC',  name:'Northrop Grumman', country:'US'},
  {symbol:'GD',   name:'General Dynamics', country:'US'},
  {symbol:'BA',   name:'Boeing',           country:'US'},
  {symbol:'HII',  name:'Huntington Ingalls',country:'US'},
  {symbol:'LHX',  name:'L3Harris',         country:'US'},
  {symbol:'LDOS', name:'Leidos Holdings',  country:'US'},
  {symbol:'BAESY',name:'BAE Systems',      country:'UK'},
  {symbol:'RHIM', name:'Rheinmetall',      country:'Germany'},
];

// Alpha Vantage global quote
async function fetchStockPrice(symbol) {
  if (!CONFIG.ALPHA_VANTAGE_KEY) return null;
  try {
    const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${CONFIG.ALPHA_VANTAGE_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    if (!res.ok) return null;
    const data = await res.json();
    const q = data['Global Quote'];
    if (!q || !q['05. price']) return null;
    return {
      price:  parseFloat(q['05. price']),
      change: parseFloat(q['09. change']),
      changePct: parseFloat(q['10. change percent']?.replace('%','')||0),
      volume: parseInt(q['06. volume']||0),
      prevClose: parseFloat(q['08. previous close']||0),
    };
  } catch(e) { return null; }
}

// Commodity prices via Alpha Vantage (BRENT, WTI, Natural Gas, etc.)
async function fetchCommodity(symbol) {
  if (!CONFIG.ALPHA_VANTAGE_KEY) return null;
  try {
    const url = `https://www.alphavantage.co/query?function=BRENT&interval=daily&apikey=${CONFIG.ALPHA_VANTAGE_KEY}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const data = await res.json();
    const vals = Object.values(data?.data || {});
    if (!vals.length) return null;
    const latest = vals[0];
    return { price: parseFloat(latest.value), unit: 'USD/bbl' };
  } catch(e) { return null; }
}

// Exchange rates
async function fetchFX() {
  if (!CONFIG.EXCHANGE_RATE_KEY) {
    // Try free API (no key)
    try {
      const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {signal:AbortSignal.timeout(5000)});
      if (res.ok) { const d = await res.json(); return d.rates; }
    } catch(e) {}
    return null;
  }
  try {
    const res = await fetch(`https://v6.exchangerate-api.com/v6/${CONFIG.EXCHANGE_RATE_KEY}/latest/USD`, {signal:AbortSignal.timeout(6000)});
    if (!res.ok) return null;
    const data = await res.json();
    return data.conversion_rates;
  } catch(e) { return null; }
}

export async function fetchMarkets() {
  const cached = cache.get('markets:live');
  if (cached) return cached;

  const fallback = getFallback();
  
  // Run all fetches in parallel
  const [fxRates, ...stockResults] = await Promise.allSettled([
    fetchFX(),
    ...DEFENSE_TICKERS.map(t => fetchStockPrice(t.symbol)),
  ]);

  let hasRealData = false;

  // Apply real FX rates
  const rates = fxRates.status === 'fulfilled' ? fxRates.value : null;
  if (rates) {
    hasRealData = true;
    const pairs = [
      {pair:'EUR/USD', base: rates.EUR ? 1/rates.EUR : 1.054},
      {pair:'GBP/USD', base: rates.GBP ? 1/rates.GBP : 1.262},
      {pair:'USD/JPY', base: rates.JPY || 154.3},
      {pair:'USD/CNY', base: rates.CNY || 7.244},
      {pair:'USD/RUB', base: rates.RUB || 90.0},
      {pair:'USD/TRY', base: rates.TRY || 32.0},
      {pair:'USD/ILS', base: rates.ILS || 3.65},
      {pair:'USD/UAH', base: rates.UAH || 39.5},
    ];
    fallback.currencies = pairs.map(p => ({
      ...p, rate: p.base, change: ((p.base - p.base * 0.998) / (p.base * 0.998)) * 100,
      history: Array.from({length:30}, (_,i) => p.base * (0.99 + Math.random()*0.02)),
      vol: 0.005, trend: 0, liveData: true,
    }));
    console.log('[Markets] ✅ Live FX rates loaded');
  }

  // Apply real stock prices
  DEFENSE_TICKERS.forEach((ticker, i) => {
    const result = stockResults[i];
    if (result?.status === 'fulfilled' && result.value) {
      const q = result.value;
      const existing = fallback.defenseStocks.find(s => s.symbol === ticker.symbol);
      if (existing) {
        existing.price  = q.price;
        existing.change = q.changePct;
        existing.history = [...existing.history.slice(-29), q.price];
        existing.liveData = true;
        hasRealData = true;
      }
    }
  });

  if (hasRealData) console.log('[Markets] ✅ Real market data applied');
  else { console.warn('[Markets] ⚠️  Using simulated markets (add API keys to config.js)'); }

  cache.set('markets:live', fallback, CONFIG.CACHE.MARKETS);
  return fallback;
}
