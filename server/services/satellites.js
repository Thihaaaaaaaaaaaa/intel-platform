// ═══════════════════════════════════════════════════════
// REAL SATELLITE DATA — CelesTrak TLE
// https://celestrak.org — no API key needed
// TLE = Two-Line Element sets — orbital mechanics data
// Updated multiple times per day by USSPACECOM
// ═══════════════════════════════════════════════════════
import * as cache from './cache.js';
import { CONFIG } from '../config.js';
import { SATELLITES as FALLBACK_SATS, getSatPosition as fallbackPos } from '../data/satellites.js';

const CACHE_KEY = 'sats:tle';
const TLE_SOURCES = [
  { name:'ISS',      url:'https://celestrak.org/SOCRATES/query.php', path:'https://celestrak.org/pub/TLE/stations.txt' },
  { name:'stations', url:'https://celestrak.org/pub/TLE/stations.txt' },
  { name:'starlink', url:'https://celestrak.org/pub/TLE/starlink.txt' },
  { name:'gps',      url:'https://celestrak.org/pub/TLE/gps-ops.txt' },
  { name:'military', url:'https://celestrak.org/pub/TLE/military.txt' },
  { name:'galileo',  url:'https://celestrak.org/pub/TLE/galileo.txt' },
  { name:'debris',   url:'https://celestrak.org/pub/TLE/1999-025.txt' },
];

// Parse TLE text into satellite objects
function parseTLEs(text, typeLabel) {
  const lines = text.trim().split('\n').map(l => l.trim()).filter(Boolean);
  const sats = [];
  for (let i = 0; i < lines.length - 2; i += 3) {
    const name = lines[i].replace(/^0 /, '').trim();
    const tle1 = lines[i+1];
    const tle2 = lines[i+2];
    if (!tle1?.startsWith('1 ') || !tle2?.startsWith('2 ')) continue;
    try {
      const inc    = parseFloat(tle2.slice(8, 16));
      const raan   = parseFloat(tle2.slice(17, 25));
      const meanMo = parseFloat(tle2.slice(52, 63)); // revs/day
      const period = 1440 / meanMo; // minutes per orbit
      sats.push({ id: tle1.slice(2, 7).trim(), name, type: typeLabel, inclination: inc, raan, period, tle1, tle2 });
    } catch(e) {}
  }
  return sats;
}

// Kepler propagator: given TLE parameters + time, return XYZ
// Uses mean motion from TLE line 2
function propagate(sat, t, R_GLOBE) {
  const RAD = Math.PI / 180;
  const n   = (2 * Math.PI * sat.meanMotion) / 86400; // rad/s
  const M   = (n * t + sat.m0) % (2 * Math.PI);
  const inc = sat.inclination * RAD;
  const W   = sat.argPerigee * RAD;
  const O   = sat.raan * RAD + 7.2921e-5 * t; // RAAN precession

  // Eccentric anomaly (Newton solve, e~0 for most sats)
  const e = sat.eccentricity || 0;
  let E = M;
  for (let i = 0; i < 5; i++) E = M + e * Math.sin(E);

  // True anomaly
  const nu = 2 * Math.atan2(Math.sqrt(1+e)*Math.sin(E/2), Math.sqrt(1-e)*Math.cos(E/2));
  const r  = sat.semiMajorAxis * (1 - e * Math.cos(E));

  // Perifocal → ECI
  const xp = r * Math.cos(nu), yp = r * Math.sin(nu);
  const cosO=Math.cos(O),sinO=Math.sin(O),cosI=Math.cos(inc),sinI=Math.sin(inc);
  const cosW=Math.cos(W),sinW=Math.sin(W);

  const x = (cosO*cosW - sinO*sinW*cosI)*xp + (-cosO*sinW - sinO*cosW*cosI)*yp;
  const y = (sinO*cosW + cosO*sinW*cosI)*xp + (-sinO*sinW + cosO*cosW*cosI)*yp;
  const z = (sinW*sinI)*xp + (cosW*sinI)*yp;

  // Scale to globe radius
  const scale = R_GLOBE / 6371; // 6371 km = Earth radius
  return { x: x*scale, y: y*scale, z: z*scale };
}

// Parse full TLE into orbital elements
function tleToElements(tle1, tle2) {
  const e      = parseInt(tle2.slice(26, 33)) * 1e-7;
  const inc    = parseFloat(tle2.slice(8, 16));
  const raan   = parseFloat(tle2.slice(17, 25));
  const argP   = parseFloat(tle2.slice(34, 42));
  const meanAn = parseFloat(tle2.slice(43, 51));
  const meanMo = parseFloat(tle2.slice(52, 63));
  const n      = meanMo * 2 * Math.PI / 86400;
  const a      = Math.pow(3.986e14 / (n * n), 1/3) / 1000; // km
  // Epoch
  const epochStr = tle1.slice(18, 32);
  const yr  = parseInt(epochStr.slice(0, 2));
  const day = parseFloat(epochStr.slice(2));
  const year = yr < 57 ? 2000 + yr : 1900 + yr;
  const epochMs = Date.UTC(year, 0, 1) + (day - 1) * 86400000;
  const t0 = epochMs / 1000;
  return { eccentricity: e, inclination: inc, raan, argPerigee: argP,
           m0: meanAn * Math.PI/180, meanMotion: meanMo, semiMajorAxis: a, t0 };
}

// Classify satellite type from name
function classifyType(name, sourceName) {
  const n = name.toUpperCase();
  if (n.includes('ISS') || n.includes('TIANGONG') || n.includes('CSS')) return 'ISS';
  if (n.includes('STARLINK')) return 'STAR';
  if (n.includes('GPS') || n.includes('NAVSTAR') || n.includes('GLONASS') ||
      n.includes('GALILEO') || n.includes('BEIDOU') || n.includes('NAVIC')) return 'MEO';
  if (sourceName === 'military' || n.includes('USA-') || n.includes('NROL') ||
      n.includes('KOSMOS') || n.includes('YAOGAN') || n.includes('OFEQ')) return 'SPY';
  if (n.includes('DEBRIS') || n.includes('R/B') || n.includes('DEB')) return 'DEBRIS';
  return 'LEO';
}

let parsedTLEs = null;

async function loadTLEs() {
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  console.log('[Sats] Fetching live TLE data from CelesTrak...');
  const allSats = [];

  for (const src of TLE_SOURCES) {
    try {
      const res = await fetch(src.path || src.url, {
        headers: { 'User-Agent': 'IntelPlatform/3.0' },
        signal: AbortSignal.timeout(6000)
      });
      if (!res.ok) continue;
      const text = await res.text();
      const parsed = parseTLEs(text, src.name);
      // Limit Starlink to 80 for performance
      const limit = src.name === 'starlink' ? 80 : src.name === 'debris' ? 30 : 999;
      parsed.slice(0, limit).forEach(s => {
        const els = tleToElements(s.tle1, s.tle2);
        allSats.push({ ...s, ...els, type: classifyType(s.name, src.name),
          color: {ISS:0xffffff,STAR:0x44ffaa,MEO:0x8888ff,SPY:0xff2244,DEBRIS:0x445566,LEO:0x00ccff}[classifyType(s.name,src.name)]||0x00ccff,
          size: src.name==='starlink' ? 0.8 : 1.2 });
      });
      console.log(`[Sats] ✅ ${src.name}: ${Math.min(parsed.length,999)} sats`);
    } catch(e) {
      console.warn(`[Sats] ⚠️  ${src.name} failed: ${e.message}`);
    }
  }

  if (allSats.length > 20) {
    cache.set(CACHE_KEY, allSats, CONFIG.CACHE.SATS);
    parsedTLEs = allSats;
    console.log(`[Sats] ✅ Total: ${allSats.length} satellites loaded`);
    return allSats;
  }
  console.warn('[Sats] ⚠️  Using fallback satellite data');
  return FALLBACK_SATS;
}

export async function getSatellites() {
  if (!parsedTLEs) parsedTLEs = await loadTLEs();
  return parsedTLEs || FALLBACK_SATS;
}

export function computePositions(sats, t, R_GLOBE) {
  return sats.map(s => {
    try {
      if (s.semiMajorAxis && s.t0 !== undefined) {
        const dt = t - s.t0;
        const pos = propagate(s, dt, R_GLOBE);
        return { id:s.id, name:s.name, type:s.type, color:s.color, size:s.size,
                 nation: s.nation||'Unknown', x:pos.x, y:pos.y, z:pos.z };
      }
      // Fallback simple propagation
      const pos = fallbackPos(s, t, R_GLOBE);
      return { id:s.id, name:s.name, type:s.type, color:s.color||0x00ccff,
               size:s.size||1, nation:s.nation||'Unknown', x:pos.x, y:pos.y, z:pos.z };
    } catch(e) {
      return null;
    }
  }).filter(Boolean);
}

// Preload on startup
loadTLEs().catch(() => {});
