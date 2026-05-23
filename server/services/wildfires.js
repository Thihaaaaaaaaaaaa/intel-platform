// ═══════════════════════════════════════════════════════
// REAL WILDFIRE DATA — NASA FIRMS
// https://firms.modaps.eosdis.nasa.gov
// Free API key: https://firms.modaps.eosdis.nasa.gov/api/
// Updates every 10 minutes. VIIRS SNPP — 375m resolution
// ═══════════════════════════════════════════════════════
import * as cache from './cache.js';
import { CONFIG } from '../config.js';

const CACHE_KEY = 'wildfires:live';

// Static fallback with known persistent fire zones
const FALLBACK_FIRES = [
  {lat:-5,  lon:-60,  name:'Amazon Basin',     intensity:0.9, brightness:380},
  {lat:62,  lon:120,  name:'Siberian Taiga',   intensity:0.7, brightness:360},
  {lat:58,  lon:-115, name:'Canadian Boreal',  intensity:0.8, brightness:370},
  {lat:-25, lon:135,  name:'Australian Outback',intensity:0.6,brightness:345},
  {lat:0,   lon:24,   name:'Congo Basin',       intensity:0.5, brightness:340},
  {lat:38,  lon:-120, name:'California',        intensity:0.7, brightness:355},
  {lat:5,   lon:110,  name:'SE Asia Peatlands', intensity:0.6, brightness:350},
  {lat:39,  lon:-5,   name:'Iberian Peninsula', intensity:0.5, brightness:338},
  {lat:10,  lon:5,    name:'West Africa',       intensity:0.7, brightness:360},
  {lat:-15, lon:-50,  name:'Brazilian Cerrado', intensity:0.8, brightness:372},
  {lat:55,  lon:90,   name:'Central Siberia',   intensity:0.6, brightness:348},
  {lat:-33, lon:150,  name:'Eastern Australia', intensity:0.5, brightness:342},
];

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g,''));
  return lines.slice(1).map(line => {
    const vals = line.split(',');
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i]?.replace(/"/g,'').trim(); });
    return obj;
  }).filter(r => r.latitude && r.longitude);
}

function clusterFires(points, radiusDeg = 3) {
  // Simple grid-based clustering to reduce 50k points to manageable set
  const grid = new Map();
  points.forEach(p => {
    const key = `${Math.round(parseFloat(p.latitude||p.lat)/radiusDeg)}_${Math.round(parseFloat(p.longitude||p.lon)/radiusDeg)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(p);
  });
  return [...grid.values()].map(cluster => {
    const lats = cluster.map(p => parseFloat(p.latitude||p.lat));
    const lons = cluster.map(p => parseFloat(p.longitude||p.lon));
    const brts = cluster.map(p => parseFloat(p.bright_ti4||p.brightness||350));
    const maxBrt = Math.max(...brts);
    return {
      lat: lats.reduce((a,b)=>a+b,0)/lats.length,
      lon: lons.reduce((a,b)=>a+b,0)/lons.length,
      brightness: maxBrt,
      count: cluster.length,
      intensity: Math.min(1.0, (maxBrt - 300) / 100),
      name: `Fire Zone (${cluster.length} hotspots)`,
      liveData: true,
    };
  }).filter(c => c.intensity > 0.1).sort((a,b) => b.intensity - a.intensity).slice(0, 60);
}

export async function fetchWildfires() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  if (!CONFIG.NASA_FIRMS_KEY) {
    console.warn('[Fires] ⚠️  No NASA FIRMS key — using static fire zones (add key to config.js)');
    return FALLBACK_FIRES;
  }

  try {
    // VIIRS SNPP NRT — near real-time, last 24 hours, global
    const url = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${CONFIG.NASA_FIRMS_KEY}/VIIRS_SNPP_NRT/-180,-90,180,90/1`;
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) }); // large file, longer timeout
    if (!res.ok) throw new Error(`FIRMS HTTP ${res.status}`);
    const text = await res.text();
    const points = parseCSV(text);
    if (points.length < 10) throw new Error('Too few fire points');
    const fires = clusterFires(points);
    cache.set(CACHE_KEY, fires, CONFIG.CACHE.WILDFIRES);
    console.log(`[Fires] ✅ NASA FIRMS: ${fires.length} fire clusters from ${points.length} hotspots`);
    return fires;
  } catch(e) {
    console.warn(`[Fires] ⚠️  NASA FIRMS failed (${e.message}), using static fallback`);
    cache.set(CACHE_KEY, FALLBACK_FIRES, 120);
    return FALLBACK_FIRES;
  }
}
