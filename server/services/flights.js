// ═══════════════════════════════════════════════════════
// REAL FLIGHT DATA — OpenSky Network
// https://opensky-network.org/api
// No API key needed. Rate limit: every 10s anonymous, 5s authenticated
// Returns: all live aircraft states worldwide
// ═══════════════════════════════════════════════════════
import * as cache from './cache.js';
import { CONFIG } from '../config.js';
import { getFlights as getFallback } from '../data/flights.js';

const OPENSKY_BASE = 'https://opensky-network.org/api';
const CACHE_KEY = 'flights:live';

// Airport lookup for city/country names (major hubs)
const AIRPORT_LOOKUP = {
  KJFK:{city:'New York',country:'United States'}, KLAX:{city:'Los Angeles',country:'United States'},
  KORD:{city:'Chicago',country:'United States'}, KATL:{city:'Atlanta',country:'United States'},
  KDFW:{city:'Dallas',country:'United States'}, KSFO:{city:'San Francisco',country:'United States'},
  EGLL:{city:'London',country:'United Kingdom'}, LFPG:{city:'Paris',country:'France'},
  EDDF:{city:'Frankfurt',country:'Germany'}, EHAM:{city:'Amsterdam',country:'Netherlands'},
  OMDB:{city:'Dubai',country:'UAE'}, WSSS:{city:'Singapore',country:'Singapore'},
  VHHH:{city:'Hong Kong',country:'China'}, ZBAA:{city:'Beijing',country:'China'},
  RJTT:{city:'Tokyo',country:'Japan'}, RKSI:{city:'Seoul',country:'South Korea'},
  YSSY:{city:'Sydney',country:'Australia'}, CYYZ:{city:'Toronto',country:'Canada'},
  SBGR:{city:'São Paulo',country:'Brazil'}, FAOR:{city:'Johannesburg',country:'South Africa'},
  OIIE:{city:'Tehran',country:'Iran'}, LLBG:{city:'Tel Aviv',country:'Israel'},
  UUEE:{city:'Moscow',country:'Russia'}, ZSPD:{city:'Shanghai',country:'China'},
};

function formatFlight(s) {
  // OpenSky state vector: [icao24,callsign,origin_country,time_position,last_contact,
  //  longitude,latitude,baro_altitude,on_ground,velocity,true_track,vertical_rate,sensors,
  //  geo_altitude,squawk,spi,position_source]
  if (!s || !s[5] || !s[6] || s[8]) return null; // skip if no position or on ground
  const [icao24,callsign,country,,, lon, lat, baroAlt,,speed, track, vRate] = s;
  if (!lat || !lon) return null;
  const alt = baroAlt ? Math.round(baroAlt * 3.28084) : 35000; // meters to feet
  const spd = speed ? Math.round(speed * 1.944) : 480; // m/s to knots
  const cs  = (callsign || icao24 || 'UNKN').trim();
  const status = vRate > 1 ? 'climbing' : vRate < -1 ? 'descending' : 'cruise';
  return {
    id: icao24,
    callsign: cs,
    airline: cs.slice(0, 3),
    aircraft: 'LIVE',
    origin: '???', originCity: country || 'Unknown', originCountry: country || 'Unknown',
    destination: '???', destCity: 'En Route', destCountry: '',
    lat: parseFloat(lat.toFixed(4)),
    lon: parseFloat(lon.toFixed(4)),
    altitude: Math.max(0, alt),
    speed: Math.max(0, spd),
    bearing: track ? Math.round(track) : 0,
    progress: 0.5,
    etaMins: 60,
    status,
    // For placeOnSphere — use bearing as heading, no origin/dest known from OpenSky
    originLat: lat - Math.sin(track * Math.PI/180) * 5,
    originLon: lon - Math.cos(track * Math.PI/180) * 5,
    destLat:   lat + Math.sin(track * Math.PI/180) * 5,
    destLon:   lon + Math.cos(track * Math.PI/180) * 5,
    liveData: true,
  };
}

let fetchInProgress = false;

export async function fetchFlights() {
  // Return cache if fresh
  const cached = cache.get(CACHE_KEY);
  if (cached) return cached;

  // Prevent parallel fetches
  if (fetchInProgress) return cache.getStale(CACHE_KEY) || getFallback();
  fetchInProgress = true;

  try {
    // Build auth header if credentials provided
    const headers = { 'User-Agent': 'IntelPlatform/3.0' };
    let url = `${OPENSKY_BASE}/states/all`;
    if (CONFIG.OPENSKY_USER && CONFIG.OPENSKY_PASS) {
      const b64 = Buffer.from(`${CONFIG.OPENSKY_USER}:${CONFIG.OPENSKY_PASS}`).toString('base64');
      headers['Authorization'] = `Basic ${b64}`;
    }

    const res  = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`OpenSky HTTP ${res.status}`);
    const json = await res.json();

    const flights = (json.states || [])
      .map(formatFlight)
      .filter(Boolean)
      .slice(0, 500); // cap at 500 for performance

    if (flights.length > 10) {
      cache.set(CACHE_KEY, flights, CONFIG.CACHE.FLIGHTS);
      console.log(`[Flights] ✅ OpenSky: ${flights.length} live aircraft`);
      return flights;
    }
    throw new Error('Too few results');
  } catch (err) {
    console.warn(`[Flights] ⚠️  OpenSky failed (${err.message}), using simulation`);
    const fallback = getFallback();
    cache.set(CACHE_KEY, fallback, 10); // short cache on fallback
    return fallback;
  } finally {
    fetchInProgress = false;
  }
}

export function getCachedFlights() {
  return cache.getStale(CACHE_KEY) || getFallback();
}
