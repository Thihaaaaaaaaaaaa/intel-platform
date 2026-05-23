// ═══════════════════════════════════════════════════════════════
// CONFIGURATION — reads from environment variables (Render/production)
// falling back to the values below for local development.
//
// On Render: set these in Dashboard → Environment → Add Environment Variable
// Locally:   create a .env file OR just edit the fallback values below
// ═══════════════════════════════════════════════════════════════

export const CONFIG = {

  // ── FLIGHTS: OpenSky Network (no key needed) ─────────────────
  OPENSKY_USER: process.env.OPENSKY_USER || '',
  OPENSKY_PASS: process.env.OPENSKY_PASS || '',

  // ── SHIPS: AISHub — free at https://aishub.net/register ──────
  AISHUB_KEY:   process.env.AISHUB_KEY   || '',

  // ── WILDFIRES: NASA FIRMS — free at https://firms.modaps.eosdis.nasa.gov/api/
  NASA_FIRMS_KEY: process.env.NASA_FIRMS_KEY || '',

  // ── NEWS: NewsAPI — free at https://newsapi.org/register ─────
  NEWS_API_KEY: process.env.NEWS_API_KEY || '',

  // ── STOCKS: Alpha Vantage — free at https://alphavantage.co ──
  ALPHA_VANTAGE_KEY: process.env.ALPHA_VANTAGE_KEY || '',

  // ── FX RATES: ExchangeRate-API — free at https://exchangerate-api.com
  EXCHANGE_RATE_KEY: process.env.EXCHANGE_RATE_KEY || '',

  // ── Cache TTLs (seconds) ──────────────────────────────────────
  CACHE: {
    FLIGHTS:   15,
    SATS:      3600,  // TLE valid for hours — refresh hourly
    SHIPS:     30,
    WILDFIRES: 600,
    NEWS:      300,
    MARKETS:   60,
    FX:        60,
    WEATHER:   600,
  },
};
