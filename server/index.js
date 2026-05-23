// ═══════════════════════════════════════════════════════════════
// GLOBAL INTELLIGENCE PLATFORM v4.0 — SERVER
// Real-time data from OpenSky, CelesTrak, Open-Meteo, GDACS, NewsAPI
// ═══════════════════════════════════════════════════════════════
import express           from 'express';
import { createServer }  from 'http';
import { WebSocketServer }from 'ws';
import cors              from 'cors';
import path              from 'path';
import { fileURLToPath } from 'url';

import { CONFIG }        from './config.js';
import * as Cache        from './services/cache.js';
import { fetchFlights }  from './services/flights.js';
import { getSatellites, computePositions } from './services/satellites.js';
import { fetchShips }    from './services/ships.js';
import { fetchNews }     from './services/news.js';
import { fetchMarkets }  from './services/markets.js';
import { fetchWildfires }from './services/wildfires.js';
import { fetchWeatherAndDisasters } from './services/weather.js';
import { CONFLICTS, generateAlert } from './data/conflicts.js';
import { generateCyberAttack }      from './data/cyber.js';
import { updateMarkets }            from './data/markets.js';
import { COUNTRY_LIST, topByMetric, getCountry } from './data/countries.js';
import { getSources }    from './data/news.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
// Resolve client path relative to this file (works whether run from root or server/)
// server/index.js → ../../client does NOT exist; ../client works from server/
// When run as "node server/index.js" from root: __dirname = <root>/server
// client is at <root>/client = path.join(__dirname, '..', 'client') ✓

const app    = express();
const server = createServer(app);
const wss    = new WebSocketServer({ server, path: '/ws' });

// Allow all origins — on Render the frontend and backend share the same domain,
// but allow cross-origin for local dev where client opens from file://
app.use(cors({
  origin: true,          // reflects request origin — works for same-domain Render deploys
  credentials: true,
}));
app.use(express.json());

// ── Static files ──────────────────────────────────────────────
const clientPath = path.join(__dirname, '..', 'client');
app.use(express.static(clientPath));
app.get('/', (req, res) => res.sendFile(path.join(clientPath, 'index.html')));

// ── State ─────────────────────────────────────────────────────
const state = {
  flights:    [],
  satellites: [],
  ships:      [],
  news:       [],
  markets:    null,
  wildfires:  [],
  weather:    { weather: [], disasters: [] },
  conflicts:  CONFLICTS,
};

// ── REST API ──────────────────────────────────────────────────
app.get('/api/health', (req, res) => res.json({
  status: 'operational', uptime: process.uptime(),
  counts: {
    flights: state.flights.length,
    satellites: state.satellites.length,
    ships: state.ships.length,
    news: state.news.length,
    weatherCities: state.weather.weather.length,
    disasters: state.weather.disasters.length,
  },
  cache: Cache.stats(),
}));

app.get('/api/countries',             (req, res) => res.json({ success:true, countries: COUNTRY_LIST }));
app.get('/api/countries/top/:metric', (req, res) => res.json({ success:true, top: topByMetric(req.params.metric, parseInt(req.query.n)||15) }));
app.get('/api/countries/:name',       (req, res) => {
  const c = getCountry(decodeURIComponent(req.params.name));
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json({ success:true, country: { name: decodeURIComponent(req.params.name), ...c } });
});

app.get('/api/conflicts',  (req, res) => res.json({ success:true, conflicts: CONFLICTS }));
app.get('/api/conflicts/:id', (req, res) => {
  const c = CONFLICTS.find(x => x.id === req.params.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json({ success:true, conflict: c });
});

app.get('/api/news',         (req, res) => res.json({ success:true, articles: state.news.slice(0, 60) }));
app.get('/api/news/sources', (req, res) => res.json({ success:true, sources: getSources() }));
app.get('/api/news/:id',     (req, res) => {
  const a = state.news.find(x => x.id === req.params.id);
  if (!a) return res.status(404).json({ error: 'Not found' });
  res.json({ success:true, article: a });
});

app.get('/api/flights',    (req, res) => res.json({ success:true, flights: state.flights }));
app.get('/api/satellites', (req, res) => res.json({ success:true, satellites: state.satellites }));
app.get('/api/ships',      (req, res) => res.json({ success:true, ships: state.ships }));
app.get('/api/markets',    (req, res) => res.json({ success:true, markets: state.markets }));
app.get('/api/wildfires',  (req, res) => res.json({ success:true, fires: state.wildfires }));
app.get('/api/weather',    (req, res) => res.json({ success:true, ...state.weather }));
app.get('/api/cyber',      (req, res) => res.json({ success:true, attack: generateCyberAttack() }));

// ── WebSocket ─────────────────────────────────────────────────
const clients = new Map();

wss.on('connection', ws => {
  const id = `c_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  clients.set(id, ws);

  // Send full current state on connect
  send(ws, 'flights',  { type:'FLIGHT_UPDATE',   flights:   state.flights.slice(0, 300) });
  send(ws, 'ships',    { type:'SHIP_UPDATE',      ships:     state.ships });
  send(ws, 'news',     { type:'NEWS_SNAPSHOT',    articles:  state.news.slice(0, 40) });
  send(ws, 'markets',  { type:'MARKET_UPDATE',    markets:   state.markets });
  send(ws, 'weather',  { type:'WEATHER_UPDATE',   ...state.weather });
  send(ws, 'wildfires',{ type:'FIRE_UPDATE',      fires:     state.wildfires });

  ws.on('message', raw => {
    try {
      const m = JSON.parse(raw.toString());
      if (m.type === 'PING') send(ws, 'pong', { type:'PONG', t: Date.now() });
    } catch {}
  });
  ws.on('close',  () => clients.delete(id));
  ws.on('error',  () => clients.delete(id));
});

function send(ws, channel, payload) {
  if (ws.readyState !== 1) return;
  try { ws.send(JSON.stringify({ channel, ...payload, t: Date.now() })); } catch {}
}

function broadcast(channel, payload) {
  const msg = JSON.stringify({ channel, ...payload, t: Date.now() });
  clients.forEach(ws => { if (ws.readyState === 1) try { ws.send(msg); } catch {} });
}

// ── Refresh loops ─────────────────────────────────────────────
async function refreshFlights() {
  try {
    state.flights = await fetchFlights();
    broadcast('flights', { type:'FLIGHT_UPDATE', flights: state.flights.slice(0, 300), count: state.flights.length });
  } catch {}
}

async function refreshSatPositions() {
  if (!state.satellites.length) state.satellites = await getSatellites();
  const positions = computePositions(state.satellites, Date.now()/1000, 100);
  broadcast('sats', { type:'SAT_UPDATE', satellites: positions });
}

async function refreshShips() {
  try {
    state.ships = await fetchShips();
    broadcast('ships', { type:'SHIP_UPDATE', ships: state.ships });
  } catch {}
}

async function refreshNews() {
  try {
    const fresh = await fetchNews();
    const hasNew = fresh[0]?.id !== state.news[0]?.id;
    state.news = fresh;
    if (hasNew && fresh.length) broadcast('news', { type:'NEWS_UPDATE', article: fresh[0] });
  } catch {}
}

async function refreshMarkets() {
  try {
    state.markets = await fetchMarkets();
  } catch {
    state.markets = updateMarkets();
  }
  broadcast('markets', { type:'MARKET_UPDATE', markets: state.markets });
}

async function refreshWildfires() {
  try { state.wildfires = await fetchWildfires(); } catch {}
}

async function refreshWeather() {
  try {
    state.weather = await fetchWeatherAndDisasters();
    broadcast('weather', { type:'WEATHER_UPDATE', ...state.weather });
  } catch {}
}

// ── Startup ───────────────────────────────────────────────────
async function startup() {
  console.log('[Boot] Loading all data sources...');
  const [flights, sats, ships, news, markets, fires, weather] = await Promise.allSettled([
    fetchFlights(), getSatellites(), fetchShips(), fetchNews(),
    fetchMarkets(), fetchWildfires(), fetchWeatherAndDisasters(),
  ]);

  state.flights    = flights.status  === 'fulfilled' ? flights.value    : [];
  state.satellites = sats.status     === 'fulfilled' ? sats.value       : [];
  state.ships      = ships.status    === 'fulfilled' ? ships.value      : [];
  state.news       = news.status     === 'fulfilled' ? news.value       : [];
  state.markets    = markets.status  === 'fulfilled' ? markets.value    : updateMarkets();
  state.wildfires  = fires.status    === 'fulfilled' ? fires.value      : [];
  state.weather    = weather.status  === 'fulfilled' ? weather.value    : { weather:[], disasters:[] };

  setInterval(refreshFlights,       12000);
  setInterval(refreshSatPositions,  3000);
  setInterval(refreshShips,         30000);
  setInterval(refreshNews,          300000);
  setInterval(refreshMarkets,       60000);
  setInterval(refreshWildfires,     600000);
  setInterval(refreshWeather,       600000);
  setInterval(() => broadcast('alerts', { type:'CONFLICT_ALERT', alert: generateAlert() }), 20000);
  setInterval(() => broadcast('cyber',  { type:'CYBER_ATTACK',   attack: generateCyberAttack() }), 15000);

  const PORT = process.env.PORT || 4000;
  server.listen(PORT, '0.0.0.0', () => {
    const k = x => x ? '✅' : '⚙️  (add key to config.js)';
    console.log(`
╔═══════════════════════════════════════════════════════════════╗
║  🌍  GLOBAL INTELLIGENCE PLATFORM v4.0                        ║
║  http://localhost:${PORT}                                       ║
╠═══════════════════════════════════════════════════════════════╣
║  ✈  Flights:    ${state.flights.length.toString().padEnd(4)} aircraft  (OpenSky — no key needed) ║
║  🛰  Satellites: ${state.satellites.length.toString().padEnd(4)} tracked   (CelesTrak — no key)  ║
║  🚢  Ships:      ${state.ships.length.toString().padEnd(4)} vessels   ${k(CONFIG.AISHUB_KEY)}     ║
║  📰  News:       ${state.news.length.toString().padEnd(4)} articles  ${k(CONFIG.NEWS_API_KEY)}    ║
║  🌦  Weather:    ${state.weather.weather.length.toString().padEnd(4)} cities    (Open-Meteo — no key)  ║
║  🚨  Disasters:  ${state.weather.disasters.length.toString().padEnd(4)} active    (GDACS — no key)     ║
║  🔥  Wildfires:  ${state.wildfires.length.toString().padEnd(4)} clusters  ${k(CONFIG.NASA_FIRMS_KEY)}  ║
╚═══════════════════════════════════════════════════════════════╝`);
  });
}

startup();
