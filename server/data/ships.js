// ═══════════════════════════════════════════════
// MARITIME INTELLIGENCE — Cargo ships, tankers,
// naval vessels on global trade routes
// ═══════════════════════════════════════════════

// Major trade route waypoints [lat, lon]
const ROUTES = {
  TRANSPACIFIC_N: [ [34, 136], [38, 155], [40, 175], [38, -170], [34, -150], [30, -130], [37, -122] ],
  TRANSPACIFIC_S: [ [-33, 151], [-25, 165], [-20, 175], [-18, -170], [-15, -145], [-5, -100], [9, -80] ],
  TRANSATLANTIC_N: [ [51, 0], [50, -10], [46, -25], [42, -40], [40, -60], [40, -73] ],
  TRANSATLANTIC_S: [ [-23, -43], [-20, -30], [-10, -15], [6, -3], [15, -17], [38, -9] ],
  SUEZ_ROUTE: [ [51, 1], [45, 10], [37, 15], [32, 28], [29, 32], [25, 36], [15, 42], [12, 45], [8, 50], [4, 51], [1, 52] ],
  CAPE_ROUTE:  [ [51, 1], [40, -5], [20, -15], [0, -10], [-20, 14], [-34, 18], [-34, 28], [-20, 40], [0, 50], [10, 55] ],
  MALACCA:     [ [1, 104], [3, 100], [6, 98], [9, 92], [12, 85], [15, 75], [20, 65], [24, 58] ],
  PACIFIC_RIM: [ [37, 122], [32, 120], [22, 113], [15, 108], [1, 104], [-6, 107], [-8, 115], [-8, 125] ],
  ARCTIC:      [ [70, 60], [72, 80], [75, 100], [74, 130], [70, 155], [65, 170] ],
  GULF_MEXICO: [ [29, -89], [25, -88], [22, -84], [20, -77], [18, -72], [15, -62] ],
};

const SHIP_TYPES = [
  { type:'container', name:'Container Ship',   symbol:'⬡', color:0x2288ff, sizeScale:1.3 },
  { type:'tanker',    name:'Oil Tanker',        symbol:'◆', color:0xff6600, sizeScale:1.5 },
  { type:'bulk',      name:'Bulk Carrier',      symbol:'◈', color:0x888888, sizeScale:1.2 },
  { type:'lng',       name:'LNG Carrier',       symbol:'◇', color:0x00ffcc, sizeScale:1.4 },
  { type:'naval',     name:'Naval Vessel',      symbol:'▲', color:0xff2244, sizeScale:1.1 },
  { type:'reefer',    name:'Reefer Ship',       symbol:'◉', color:0xffffff, sizeScale:1.0 },
];

const SHIPPING_LINES = [
  'MAERSK','MSC','COSCO','CMA-CGM','EVERGREEN','HAPAG-LLOYD',
  'ONE','YANG MING','HYUNDAI MM','PIL','ZIM','SEALAND',
  'CHINA SHIPPING','OOCL','K-LINE','MOL','NYK','STOLT',
  'EURONAV','NORDIC','FRONTLINE','TSAKOS','BP SHIPPING',
];

const FLAGS = ['🇵🇦','🇱🇷','🇲🇭','🇸🇬','🇨🇳','🇬🇷','🇧🇭','🇧🇸','🇨🇾','🇲🇹'];

let shipIdCounter = 5000;

function lerp3(pts, t) {
  const total = pts.length - 1;
  const seg = t * total;
  const i = Math.min(Math.floor(seg), total - 1);
  const f = seg - i;
  const a = pts[i], b = pts[i + 1] || pts[i];
  return { lat: a[0] + (b[0] - a[0]) * f, lon: a[1] + (b[1] - a[1]) * f };
}

function routeKeys() { return Object.keys(ROUTES); }

function makeShip(routeKey, offset) {
  const typeInfo = SHIP_TYPES[Math.floor(Math.random() * SHIP_TYPES.length)];
  const line = SHIPPING_LINES[Math.floor(Math.random() * SHIPPING_LINES.length)];
  const flag = FLAGS[Math.floor(Math.random() * FLAGS.length)];
  const progress = (offset || Math.random());
  const route = ROUTES[routeKey];
  const pos = lerp3(route, progress);
  const direction = progress < 0.98 ? lerp3(route, Math.min(1, progress + 0.02)) : lerp3(route, 0);

  const speedKnots = typeInfo.type === 'naval' ? 25 + Math.random() * 15 : 12 + Math.random() * 8;
  const cargoTypes = {
    container: ['Electronics','Textiles','Auto Parts','Machinery','Consumer Goods'],
    tanker:    ['Crude Oil','Fuel Oil','Diesel','Jet Fuel','Chemical'],
    bulk:      ['Iron Ore','Coal','Grain','Bauxite','Phosphate'],
    lng:       ['Liquefied Natural Gas','LPG','Ammonia'],
    naval:     ['Military Equipment','Personnel','Ammunition'],
    reefer:    ['Frozen Food','Pharmaceuticals','Fresh Produce'],
  };
  const cargo = (cargoTypes[typeInfo.type] || ['General Cargo'])[Math.floor(Math.random() * 5)];
  const dwt = typeInfo.type === 'tanker' ? Math.round(100000 + Math.random() * 250000)
            : typeInfo.type === 'bulk'   ? Math.round(50000 + Math.random() * 180000)
            : typeInfo.type === 'lng'    ? Math.round(70000 + Math.random() * 100000)
            :                              Math.round(5000  + Math.random() * 20000);

  return {
    id: `SHP${shipIdCounter++}`,
    mmsi: `${Math.floor(100000000 + Math.random() * 899999999)}`,
    name: `${line} ${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${String.fromCharCode(65 + Math.floor(Math.random() * 26))} ${Math.floor(100 + Math.random() * 900)}`,
    type: typeInfo.type,
    typeName: typeInfo.name,
    color: typeInfo.color,
    sizeScale: typeInfo.sizeScale,
    shippingLine: line,
    flag,
    route: routeKey,
    progress,
    lat: pos.lat, lon: pos.lon,
    destLat: direction.lat, destLon: direction.lon,
    speedKnots: Math.round(speedKnots),
    cargo,
    dwt,
    eta: `${Math.floor(2 + Math.random() * 18)} days`,
    status: Math.random() > 0.05 ? 'UNDERWAY' : 'ANCHORED',
    heading: Math.random() < 0.5 ? 'EASTBOUND' : 'WESTBOUND',
    aisClass: 'A',
  };
}

let ships = [];

export function initializeShips(count = 180) {
  ships = [];
  const rks = routeKeys();
  const perRoute = Math.ceil(count / rks.length);
  rks.forEach(rk => {
    for (let i = 0; i < perRoute; i++) {
      ships.push(makeShip(rk, i / perRoute));
    }
  });
  ships = ships.slice(0, count);
  return ships;
}

export function updateShips() {
  ships = ships.map(s => {
    const np = s.progress + 0.0003 + Math.random() * 0.0001;
    if (np >= 1) return makeShip(s.route, 0);
    const route = ROUTES[s.route];
    const pos = lerp3(route, np);
    const dir = lerp3(route, Math.min(1, np + 0.02));
    return { ...s, progress: np, lat: pos.lat, lon: pos.lon, destLat: dir.lat, destLon: dir.lon };
  });
  return ships;
}

export function getShips() {
  if (!ships.length) initializeShips();
  return ships;
}

initializeShips(180);
