// ═══════════════════════════════════════════════════════
// REAL MARITIME DATA — AISHub + MarineTraffic fallback
// https://www.aishub.net — free registration
// AIS = Automatic Identification System (required on all ships >300 GRT)
// Falls back to realistic simulation if no key configured
// ═══════════════════════════════════════════════════════
import * as cache from './cache.js';
import { CONFIG } from '../config.js';
import { getShips as getFallback, updateShips } from '../data/ships.js';

const CACHE_KEY = 'ships:live';

function formatAISHubVessel(v) {
  const mmsi = v.MMSI?.toString() || '';
  const name = v.NAME?.trim() || `VESSEL-${mmsi.slice(-4)}`;
  const lat  = parseFloat(v.LATITUDE  || 0);
  const lon  = parseFloat(v.LONGITUDE || 0);
  const sog  = parseFloat(v.SOG || 0); // speed over ground
  const cog  = parseFloat(v.COG || 0); // course over ground
  const type = parseInt(v.TYPE || 0);
  if (!lat || !lon || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  // AIS type codes: 70-79 = cargo, 80-89 = tanker, 60-69 = passenger
  const shipType = type >= 80 && type <= 89 ? 'tanker'
                 : type >= 70 && type <= 79 ? 'container'
                 : type >= 60 && type <= 69 ? 'passenger'
                 : type === 30 ? 'fishing'
                 : 'bulk';
  const shipColors = {tanker:0xff6600,container:0x2288ff,bulk:0x888888,passenger:0xffffff,fishing:0x00ccff};
  return {
    id: mmsi, mmsi, name,
    type: shipType, typeName: shipType.charAt(0).toUpperCase()+shipType.slice(1)+' Ship',
    color: shipColors[shipType] || 0x888888, sizeScale: 1.0,
    shippingLine: name.split(' ')[0] || 'UNKNOWN',
    flag: '🚢', route: 'LIVE',
    lat: parseFloat(lat.toFixed(4)), lon: parseFloat(lon.toFixed(4)),
    progress: 0.5,
    destLat: lat + Math.sin(cog * Math.PI/180) * 0.5,
    destLon: lon + Math.cos(cog * Math.PI/180) * 0.5,
    speedKnots: Math.round(sog),
    cargo: 'Live AIS Data',
    dwt: parseInt(v.DRAUGHT || 0) * 1000,
    eta: v.ETA || 'Unknown',
    status: sog > 0.5 ? 'UNDERWAY' : 'ANCHORED',
    heading: cog,
    aisClass: 'A',
    liveData: true,
  };
}

export async function fetchShips() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  if (!CONFIG.AISHUB_KEY) {
    // No key — use realistic simulation (still advances positions)
    const ships = updateShips();
    cache.set(CACHE_KEY, ships, CONFIG.CACHE.SHIPS);
    return ships;
  }

  try {
    // AISHub API — returns vessels in bounding boxes
    // We fetch 4 major ocean regions to get global coverage
    const regions = [
      [-90, -180, 90, 180] // full world (may be rate-limited, use regional if needed)
    ];
    const allVessels = [];
    for (const [minLat, minLon, maxLat, maxLon] of regions) {
      const url = `https://data.aishub.net/ws.php?username=${CONFIG.AISHUB_KEY}&format=1&output=json&compress=0&minlat=${minLat}&maxlat=${maxLat}&minlon=${minLon}&maxlon=${maxLon}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const data = await res.json();
      const vessels = Array.isArray(data) ? data[1] || [] : [];
      vessels.forEach(v => { const f = formatAISHubVessel(v); if(f) allVessels.push(f); });
    }
    if (allVessels.length > 10) {
      const ships = allVessels.slice(0, 300);
      cache.set(CACHE_KEY, ships, CONFIG.CACHE.SHIPS);
      console.log(`[Ships] ✅ AISHub: ${ships.length} vessels`);
      return ships;
    }
    throw new Error('Too few vessels');
  } catch(err) {
    console.warn(`[Ships] ⚠️  AISHub failed (${err.message}), using simulation`);
    const ships = updateShips();
    cache.set(CACHE_KEY, ships, 15);
    return ships;
  }
}

export function getCachedShips() {
  return cache.getStale(CACHE_KEY) || getFallback();
}
