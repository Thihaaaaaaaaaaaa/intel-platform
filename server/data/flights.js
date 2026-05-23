// Flight intelligence service
// Generates and tracks live flight positions across the globe

const AIRLINES = ['UA','DL','AA','BA','LH','AF','EK','SQ','QF','NH','CX','TK','QR','EY','CA','MH','KL','SV','MS','TG'];
const AIRCRAFT = ['B777','B787','A380','A350','A320','B737','B747','A330','B767','E190','A220','B757','A321'];

// Major airports — comprehensive global coverage
export const AIRPORTS = [
  {iata:'JFK', city:'New York',        country:'United States',  lat:40.64, lon:-73.78},
  {iata:'LAX', city:'Los Angeles',     country:'United States',  lat:33.94, lon:-118.41},
  {iata:'ORD', city:'Chicago',         country:'United States',  lat:41.97, lon:-87.91},
  {iata:'ATL', city:'Atlanta',         country:'United States',  lat:33.64, lon:-84.43},
  {iata:'DFW', city:'Dallas',          country:'United States',  lat:32.90, lon:-97.04},
  {iata:'SFO', city:'San Francisco',   country:'United States',  lat:37.62, lon:-122.38},
  {iata:'LHR', city:'London',          country:'United Kingdom', lat:51.47, lon:-0.45},
  {iata:'CDG', city:'Paris',           country:'France',         lat:49.01, lon:2.55},
  {iata:'FRA', city:'Frankfurt',       country:'Germany',        lat:50.04, lon:8.56},
  {iata:'MUC', city:'Munich',          country:'Germany',        lat:48.35, lon:11.79},
  {iata:'AMS', city:'Amsterdam',       country:'Netherlands',    lat:52.31, lon:4.76},
  {iata:'FCO', city:'Rome',            country:'Italy',          lat:41.80, lon:12.25},
  {iata:'MXP', city:'Milan',           country:'Italy',          lat:45.63, lon:8.72},
  {iata:'MAD', city:'Madrid',          country:'Spain',          lat:40.49, lon:-3.57},
  {iata:'BCN', city:'Barcelona',       country:'Spain',          lat:41.30, lon:2.08},
  {iata:'ZRH', city:'Zurich',          country:'Switzerland',    lat:47.46, lon:8.55},
  {iata:'VIE', city:'Vienna',          country:'Austria',        lat:48.11, lon:16.57},
  {iata:'ARN', city:'Stockholm',       country:'Sweden',         lat:59.65, lon:17.92},
  {iata:'OSL', city:'Oslo',            country:'Norway',         lat:60.20, lon:11.08},
  {iata:'CPH', city:'Copenhagen',      country:'Denmark',        lat:55.62, lon:12.66},
  {iata:'HEL', city:'Helsinki',        country:'Finland',        lat:60.32, lon:24.96},
  {iata:'WAW', city:'Warsaw',          country:'Poland',         lat:52.17, lon:20.97},
  {iata:'ATH', city:'Athens',          country:'Greece',         lat:37.94, lon:23.95},
  {iata:'IST', city:'Istanbul',        country:'Turkey',         lat:40.98, lon:28.81},
  {iata:'DXB', city:'Dubai',           country:'UAE',            lat:25.25, lon:55.37},
  {iata:'AUH', city:'Abu Dhabi',       country:'UAE',            lat:24.43, lon:54.65},
  {iata:'DOH', city:'Doha',            country:'Qatar',          lat:25.26, lon:51.61},
  {iata:'RUH', city:'Riyadh',          country:'Saudi Arabia',   lat:24.96, lon:46.70},
  {iata:'JED', city:'Jeddah',          country:'Saudi Arabia',   lat:21.68, lon:39.16},
  {iata:'KWI', city:'Kuwait City',     country:'Kuwait',         lat:29.23, lon:47.97},
  {iata:'CAI', city:'Cairo',           country:'Egypt',          lat:30.11, lon:31.41},
  {iata:'TLV', city:'Tel Aviv',        country:'Israel',         lat:32.01, lon:34.89},
  {iata:'SIN', city:'Singapore',       country:'Singapore',      lat:1.36,  lon:103.99},
  {iata:'HKG', city:'Hong Kong',       country:'China (HK)',     lat:22.31, lon:113.91},
  {iata:'PEK', city:'Beijing',         country:'China',          lat:40.08, lon:116.60},
  {iata:'PVG', city:'Shanghai',        country:'China',          lat:31.14, lon:121.80},
  {iata:'CAN', city:'Guangzhou',       country:'China',          lat:23.39, lon:113.30},
  {iata:'HND', city:'Tokyo',           country:'Japan',          lat:35.55, lon:139.78},
  {iata:'NRT', city:'Narita',          country:'Japan',          lat:35.76, lon:140.39},
  {iata:'KIX', city:'Osaka',           country:'Japan',          lat:34.43, lon:135.24},
  {iata:'ICN', city:'Seoul',           country:'South Korea',    lat:37.46, lon:126.44},
  {iata:'BOM', city:'Mumbai',          country:'India',          lat:19.09, lon:72.87},
  {iata:'DEL', city:'New Delhi',       country:'India',          lat:28.56, lon:77.10},
  {iata:'BLR', city:'Bangalore',       country:'India',          lat:13.20, lon:77.71},
  {iata:'BKK', city:'Bangkok',         country:'Thailand',       lat:13.69, lon:100.75},
  {iata:'KUL', city:'Kuala Lumpur',    country:'Malaysia',       lat:2.74,  lon:101.70},
  {iata:'CGK', city:'Jakarta',         country:'Indonesia',      lat:-6.13, lon:106.65},
  {iata:'MNL', city:'Manila',          country:'Philippines',    lat:14.51, lon:121.02},
  {iata:'SYD', city:'Sydney',          country:'Australia',      lat:-33.95,lon:151.18},
  {iata:'MEL', city:'Melbourne',       country:'Australia',      lat:-37.67,lon:144.84},
  {iata:'YYZ', city:'Toronto',         country:'Canada',         lat:43.68, lon:-79.63},
  {iata:'YVR', city:'Vancouver',       country:'Canada',         lat:49.19, lon:-123.18},
  {iata:'MEX', city:'Mexico City',     country:'Mexico',         lat:19.44, lon:-99.07},
  {iata:'GRU', city:'São Paulo',       country:'Brazil',         lat:-23.44,lon:-46.47},
  {iata:'GIG', city:'Rio de Janeiro',  country:'Brazil',         lat:-22.81,lon:-43.25},
  {iata:'EZE', city:'Buenos Aires',    country:'Argentina',      lat:-34.82,lon:-58.54},
  {iata:'BOG', city:'Bogotá',          country:'Colombia',       lat:4.70,  lon:-74.15},
  {iata:'SCL', city:'Santiago',        country:'Chile',          lat:-33.39,lon:-70.79},
  {iata:'LIM', city:'Lima',            country:'Peru',           lat:-12.02,lon:-77.11},
  {iata:'JNB', city:'Johannesburg',    country:'South Africa',   lat:-26.14,lon:28.25},
  {iata:'CPT', city:'Cape Town',       country:'South Africa',   lat:-33.96,lon:18.60},
  {iata:'NBO', city:'Nairobi',         country:'Kenya',          lat:-1.32, lon:36.93},
  {iata:'LOS', city:'Lagos',           country:'Nigeria',        lat:6.58,  lon:3.32},
  {iata:'ACC', city:'Accra',           country:'Ghana',          lat:5.61,  lon:-0.17},
  {iata:'CMN', city:'Casablanca',      country:'Morocco',        lat:33.37, lon:-7.59},
  {iata:'ADD', city:'Addis Ababa',     country:'Ethiopia',       lat:8.98,  lon:38.80},
  {iata:'SVO', city:'Moscow',          country:'Russia',         lat:55.97, lon:37.41},
];

let flights = [];
let idCounter = 1000;

function bearing(lat1, lon1, lat2, lon2) {
  const R = Math.PI/180;
  const y = Math.sin((lon2-lon1)*R)*Math.cos(lat2*R);
  const x = Math.cos(lat1*R)*Math.sin(lat2*R) - Math.sin(lat1*R)*Math.cos(lat2*R)*Math.cos((lon2-lon1)*R);
  return (Math.atan2(y,x)*180/Math.PI + 360) % 360;
}

function lerpPos(o, d, t) {
  return { lat: o.lat + (d.lat-o.lat)*t, lon: o.lon + (d.lon-o.lon)*t };
}

function makeFlight() {
  const o = AIRPORTS[Math.floor(Math.random()*AIRPORTS.length)];
  let d;
  do { d = AIRPORTS[Math.floor(Math.random()*AIRPORTS.length)]; } while (d === o);
  
  const progress = Math.random();
  const pos = lerpPos(o, d, progress);
  const posA = lerpPos(o, d, Math.max(0, progress - 0.015));
  const posB = lerpPos(o, d, Math.min(1, progress + 0.015));
  const brg = bearing(posA.lat, posA.lon, posB.lat, posB.lon);
  
  const alt = progress < 0.15 ? Math.round((progress/0.15) * 38000)
           : progress > 0.85 ? Math.round(((1-progress)/0.15) * 38000)
           : Math.round(35000 + Math.random() * 5000);
  
  const speed = Math.round(460 + Math.random() * 140);
  const al = AIRLINES[Math.floor(Math.random()*AIRLINES.length)];
  
  const distKm = Math.round(Math.sqrt((d.lat-o.lat)**2 + (d.lon-o.lon)**2) * 111);
  const etaMins = Math.round(distKm / speed * 60 * (1 - progress));
  
  return {
    id: `FL${idCounter++}`,
    callsign: `${al}${1000 + Math.floor(Math.random()*8999)}`,
    airline: al,
    aircraft: AIRCRAFT[Math.floor(Math.random()*AIRCRAFT.length)],
    origin: o.iata, originCity: o.city, originCountry: o.country,
    destination: d.iata, destCity: d.city, destCountry: d.country,
    lat: pos.lat, lon: pos.lon,
    altitude: alt, speed, bearing: Math.round(brg),
    progress, etaMins,
    status: progress < 0.1 ? 'climbing' : progress > 0.9 ? 'descending' : 'cruise',
    originLat: o.lat, originLon: o.lon, destLat: d.lat, destLon: d.lon,
    lastUpdate: Date.now(),
  };
}

export function initializeFlights(count = 200) {
  flights = Array.from({length: count}, makeFlight);
  return flights;
}

export function updateFlights() {
  flights = flights.map(f => {
    const np = Math.min(1, f.progress + 0.002 + Math.random()*0.0005);
    if (np >= 1) return makeFlight();
    
    const o = {lat: f.originLat, lon: f.originLon};
    const d = {lat: f.destLat, lon: f.destLon};
    const pos = lerpPos(o, d, np);
    const posA = lerpPos(o, d, Math.max(0, np - 0.015));
    const posB = lerpPos(o, d, Math.min(1, np + 0.015));
    const brg = bearing(posA.lat, posA.lon, posB.lat, posB.lon);
    
    const alt = np < 0.15 ? Math.round((np/0.15) * 38000)
             : np > 0.85 ? Math.round(((1-np)/0.15) * 38000)
             : f.altitude;
    
    const distKm = Math.round(Math.sqrt((f.destLat-f.originLat)**2 + (f.destLon-f.originLon)**2) * 111);
    const etaMins = Math.round(distKm / f.speed * 60 * (1 - np));
    
    return {
      ...f,
      lat: pos.lat, lon: pos.lon,
      altitude: alt, bearing: Math.round(brg),
      progress: np, etaMins,
      status: np < 0.1 ? 'climbing' : np > 0.9 ? 'descending' : 'cruise',
      lastUpdate: Date.now(),
    };
  });
  return flights;
}

export function getFlights() {
  if (flights.length === 0) initializeFlights();
  return flights;
}

export function getFlightById(id) {
  return flights.find(f => f.id === id);
}

initializeFlights(200);
