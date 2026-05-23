// ═══════════════════════════════════════════════════════════════
// CORE — Global state, API, WebSocket, navigation, formatters
// ═══════════════════════════════════════════════════════════════

// Auto-detect protocol and host — works on localhost AND Render/HTTPS
const _proto   = location.protocol === 'https:' ? 'https' : 'http';
const _wsProto = location.protocol === 'https:' ? 'wss'   : 'ws';
// On Render: port is 443 (hidden), so use location.host (includes port if non-standard)
// On localhost: location.host = "localhost:4000"
const _host    = location.port && location.port !== '80' && location.port !== '443'
                   ? location.host          // localhost:4000
                   : location.hostname;     // myapp.onrender.com (no port)
const API_BASE = `${_proto}://${_host}/api`;
const WS_URL   = `${_wsProto}://${_host}/ws`;

// ── Global application state ───────────────────────────────────
window.APP = {
  flights:      [],
  conflicts:    [],
  news:         [],
  alerts:       [],
  countries:    [],
  sources:      [],
  markets:      { commodities:[], defenseStocks:[], currencies:[] },
  satellites:   [],
  ships:        [],
  cyberAttacks: [],
  wildfires:    [],
  weather:      [],      // live city weather
  disasters:    [],      // active global disasters
  currentPage:  'globe',
  isLive:       false,
  alertCount:   0,
};

// ── Clock (UTC) ────────────────────────────────────────────────
function updateClock() {
  const n = new Date();
  const p = x => String(x).padStart(2, '0');
  document.getElementById('clock').textContent =
    `UTC ${p(n.getUTCHours())}:${p(n.getUTCMinutes())}:${p(n.getUTCSeconds())}`;
}
setInterval(updateClock, 1000);
updateClock();

// ── Formatters ─────────────────────────────────────────────────
window.formatTime = iso => {
  const diff = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (diff < 1)    return 'NOW';
  if (diff < 60)   return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`;
  return new Date(iso).toLocaleDateString('en-US', { month:'short', day:'numeric' });
};

window.fmtGDP  = b => b >= 1000 ? `$${(b/1000).toFixed(2)}T` : `$${b.toFixed(1)}B`;
window.fmtPop  = m => m >= 1000 ? `${(m/1000).toFixed(2)}B`  : `${m.toFixed(1)}M`;
window.fmtEta  = m => !m || m <= 0 ? 'LANDING' : m < 60 ? `${m}m` : `${Math.floor(m/60)}h ${m%60}m`;

// ── Page navigation ────────────────────────────────────────────
window.switchPage = function(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.navtab').forEach(t => t.classList.remove('active'));
  document.getElementById(`page-${pageId}`)?.classList.add('active');
  document.querySelector(`.navtab[data-page="${pageId}"]`)?.classList.add('active');
  APP.currentPage = pageId;
  window.dispatchEvent(new CustomEvent('pageChange', { detail: { pageId } }));
};

document.querySelectorAll('.navtab').forEach(tab => {
  tab.addEventListener('click', () => switchPage(tab.dataset.page));
});

// ── Modal ──────────────────────────────────────────────────────
window.openModal = html => {
  document.getElementById('modal-body').innerHTML = html;
  document.getElementById('modal-overlay').classList.add('show');
};
window.closeModal = () => {
  document.getElementById('modal-overlay').classList.remove('show');
};
document.getElementById('modal-overlay')
  .addEventListener('click', e => { if (e.target.id === 'modal-overlay') closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ── API helper ─────────────────────────────────────────────────
async function apiGet(path) {
  try {
    const r = await fetch(`${API_BASE}${path}`);
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch { return null; }
}

// ── Data loaders (with embedded fallbacks) ─────────────────────
async function loadConflicts() {
  const r = await apiGet('/conflicts');
  APP.conflicts = r?.conflicts || EMBEDDED_CONFLICTS;
  document.getElementById('sb-conflicts').textContent = APP.conflicts.length;
}
async function loadCountries() {
  const r = await apiGet('/countries');
  APP.countries = r?.countries || EMBEDDED_COUNTRIES;
}
async function loadFlights() {
  const r = await apiGet('/flights');
  APP.flights = r?.flights || simFlights(180);
  document.getElementById('sb-flights').textContent = APP.flights.length;
}
async function loadNews() {
  const r = await apiGet('/news');
  APP.news = r?.articles || simNews(30);
  document.getElementById('sb-articles').textContent = APP.news.length;
}
async function loadSources() {
  const r = await apiGet('/news/sources');
  APP.sources = r?.sources || EMBEDDED_SOURCES;
}
async function loadMarkets() {
  const r = await apiGet('/markets');
  APP.markets = r?.markets || simMarkets();
}
async function loadSatellites() {
  const r = await apiGet('/satellites');
  if (r?.satellites) APP.satellites = r.satellites;
}
async function loadShips() {
  const r = await apiGet('/ships');
  if (r?.ships) APP.ships = r.ships;
}
async function loadWildfires() {
  const r = await apiGet('/wildfires');
  if (r?.fires) APP.wildfires = r.fires;
}
async function loadWeather() {
  const r = await apiGet('/weather');
  if (r?.weather)   APP.weather   = r.weather;
  if (r?.disasters) APP.disasters = r.disasters;
}

// ── WebSocket with auto-reconnect ─────────────────────────────
// Render free tier sleeps after 15 min — auto-reconnect handles wake-up
let _wsRetries = 0;
const _wsMaxRetries = 10;

function setupWS() {
  try {
    const ws = new WebSocket(WS_URL);
    let _pingInterval;

    ws.onopen = () => {
      APP.isLive = true;
      _wsRetries = 0;
      document.getElementById('conn-status').textContent = 'LIVE';
      document.getElementById('live-dot').style.background = 'var(--acc4)';
      document.getElementById('sb-conn').textContent = 'LIVE';
      document.getElementById('sb-conn').style.color = 'var(--acc4)';
      // Keepalive ping every 30s to prevent Render from closing idle WS
      _pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ type: 'PING' }));
      }, 30000);
    };

    ws.onmessage = e => {
      try { handleWSMessage(JSON.parse(e.data)); } catch {}
    };

    ws.onclose = () => {
      clearInterval(_pingInterval);
      APP.isLive = false;
      document.getElementById('conn-status').textContent = 'RECONNECTING';
      document.getElementById('live-dot').style.background = 'var(--med)';
      // Exponential backoff: 2s, 4s, 8s … max 30s
      if (_wsRetries < _wsMaxRetries) {
        const delay = Math.min(2000 * Math.pow(2, _wsRetries), 30000);
        _wsRetries++;
        setTimeout(setupWS, delay);
      } else {
        startDemoMode();
      }
    };

    ws.onerror = () => ws.close(); // triggers onclose → reconnect

  } catch {
    startDemoMode();
  }
}

function handleWSMessage(m) {
  switch (m.type) {
    case 'FLIGHT_UPDATE':
      APP.flights = m.flights;
      document.getElementById('sb-flights').textContent = APP.flights.length;
      window.dispatchEvent(new CustomEvent('flightsUpdate'));
      break;
    case 'NEWS_UPDATE':
    case 'NEWS_SNAPSHOT':
      if (m.articles) APP.news = m.articles;
      if (m.article)  APP.news.unshift(m.article);
      document.getElementById('sb-articles').textContent = APP.news.length;
      window.dispatchEvent(new CustomEvent('newsUpdate', { detail: m.article }));
      break;
    case 'CONFLICT_ALERT':
      APP.alerts.unshift(m.alert);
      APP.alertCount++;
      document.getElementById('sb-alerts').textContent = APP.alertCount;
      window.dispatchEvent(new CustomEvent('alertUpdate', { detail: m.alert }));
      break;
    case 'MARKET_UPDATE':
      APP.markets = m.markets;
      window.dispatchEvent(new CustomEvent('marketsUpdate'));
      break;
    case 'SHIP_UPDATE':
      APP.ships = m.ships;
      window.dispatchEvent(new CustomEvent('shipsUpdate'));
      break;
    case 'SAT_UPDATE':
      APP.satPositions = m.satellites;
      window.dispatchEvent(new CustomEvent('satsUpdate'));
      break;
    case 'CYBER_ATTACK':
      APP.cyberAttacks.unshift(m.attack);
      window.dispatchEvent(new CustomEvent('cyberUpdate', { detail: m.attack }));
      break;
    case 'FIRE_UPDATE':
      APP.wildfires = m.fires;
      window.dispatchEvent(new CustomEvent('firesUpdate'));
      break;
    case 'WEATHER_UPDATE':
      if (m.weather)   APP.weather   = m.weather;
      if (m.disasters) APP.disasters = m.disasters;
      window.dispatchEvent(new CustomEvent('weatherUpdate'));
      break;
  }
}

// ── Demo / offline mode ─────────────────────────────────────────
let _demoStarted = false;
function startDemoMode() {
  if (_demoStarted || APP.isLive) return;
  _demoStarted = true;
  document.getElementById('conn-status').textContent = 'DEMO';
  document.getElementById('live-dot').style.background = 'var(--med)';
  document.getElementById('sb-conn').textContent = 'DEMO';
  document.getElementById('sb-conn').style.color  = 'var(--med)';

  setInterval(() => {
    APP.flights = advanceSimFlights(APP.flights);
    document.getElementById('sb-flights').textContent = APP.flights.length;
    window.dispatchEvent(new CustomEvent('flightsUpdate'));
  }, 4000);

  setInterval(() => {
    const a = simNews(1)[0];
    APP.news.unshift(a);
    document.getElementById('sb-articles').textContent = APP.news.length;
    window.dispatchEvent(new CustomEvent('newsUpdate', { detail: a }));
  }, 12000);

  setInterval(() => {
    const alert = simAlert();
    APP.alerts.unshift(alert); APP.alertCount++;
    document.getElementById('sb-alerts').textContent = APP.alertCount;
    window.dispatchEvent(new CustomEvent('alertUpdate', { detail: alert }));
  }, 18000);

  setInterval(() => {
    APP.markets = advanceSimMarkets(APP.markets);
    window.dispatchEvent(new CustomEvent('marketsUpdate'));
  }, 5000);
}

// Keep switchToDemoMode as alias so app.js timeout call still works
window.switchToDemoMode = startDemoMode;

// ═══════════════════════════════════════════════════════════════
// EMBEDDED FALLBACK DATA — used when server is offline
// ═══════════════════════════════════════════════════════════════

const EMBEDDED_COUNTRIES = [
  {name:'United States',  flag:'🇺🇸',iso:'USA',capital:'Washington D.C.',area:9.83,region:'North America',gdp:27.36,gdpPerCap:81632,gdpGrowth:2.5,pop:335.9,popGrowth:0.4,milSpend:916,milRank:1,milPersonnel:1390,milReserve:800,milTanks:5500,milAircraft:13300,milShips:484,nukes:5244,nukesActive:1670,nukesReserve:1938,govType:'Federal Constitutional Republic',leader:'Joe Biden',leaderSince:'2021',allies:['NATO','Five Eyes','AUKUS','QUAD'],threats:['Russia','China','North Korea','Iran'],defenseShare:3.36,debtToGdp:122.3,gini:39.7,hdi:0.927,lifeExp:79.1,inflation:3.1,unemployment:3.7,fxReserves:243,exports:2080,imports:3380,oilProd:12.9,oilCons:19.0,intlPress:'Free'},
  {name:'United Kingdom', flag:'🇬🇧',iso:'GBR',capital:'London',area:0.244,region:'Europe',gdp:3.09,gdpPerCap:45720,gdpGrowth:0.3,pop:67.6,popGrowth:0.5,milSpend:75,milRank:6,milPersonnel:148,milReserve:32,milTanks:227,milAircraft:631,milShips:73,nukes:225,nukesActive:120,nukesReserve:105,govType:'Constitutional Monarchy',leader:'Keir Starmer',leaderSince:'2024',allies:['NATO','Five Eyes','AUKUS'],threats:['Russia','Cyber'],defenseShare:2.43,debtToGdp:101.0,gini:35.1,hdi:0.929,lifeExp:81.3,inflation:4.0,unemployment:4.3,fxReserves:163,exports:520,imports:680,oilProd:0.9,oilCons:1.4,intlPress:'Free'},
  {name:'Russia',         flag:'🇷🇺',iso:'RUS',capital:'Moscow',area:17.098,region:'Europe/Asia',gdp:1.86,gdpPerCap:12969,gdpGrowth:3.6,pop:143.4,popGrowth:-0.4,milSpend:109,milRank:2,milPersonnel:1320,milReserve:2000,milTanks:12420,milAircraft:4255,milShips:781,nukes:5580,nukesActive:1710,nukesReserve:2670,govType:'Federal Semi-Presidential Republic',leader:'Vladimir Putin',leaderSince:'2012',allies:['CSTO','Belarus','North Korea'],threats:['NATO','Ukraine war'],defenseShare:5.86,debtToGdp:21.2,gini:37.5,hdi:0.821,lifeExp:70.1,inflation:7.4,unemployment:3.0,fxReserves:597,exports:592,imports:380,oilProd:10.5,oilCons:3.7,intlPress:'Not Free'},
  {name:'China',          flag:'🇨🇳',iso:'CHN',capital:'Beijing',area:9.597,region:'East Asia',gdp:17.79,gdpPerCap:12598,gdpGrowth:5.2,pop:1412.0,popGrowth:-0.1,milSpend:296,milRank:3,milPersonnel:2035,milReserve:510,milTanks:5000,milAircraft:3304,milShips:730,nukes:500,nukesActive:410,nukesReserve:90,govType:'One-party Socialist Republic',leader:'Xi Jinping',leaderSince:'2013',allies:['Russia (de facto)','Pakistan'],threats:['US','Taiwan','India'],defenseShare:1.66,debtToGdp:83.4,gini:38.2,hdi:0.788,lifeExp:78.2,inflation:0.2,unemployment:5.2,fxReserves:3225,exports:3380,imports:2715,oilProd:4.1,oilCons:15.4,intlPress:'Not Free'},
  {name:'Germany',        flag:'🇩🇪',iso:'DEU',capital:'Berlin',area:0.357,region:'Europe',gdp:4.46,gdpPerCap:52663,gdpGrowth:-0.3,pop:84.7,popGrowth:0.7,milSpend:67,milRank:18,milPersonnel:181,milReserve:34,milTanks:296,milAircraft:617,milShips:80,nukes:0,nukesActive:0,nukesReserve:0,nukeNote:'NATO sharing',govType:'Federal Republic',leader:'Olaf Scholz',leaderSince:'2021',allies:['NATO','EU'],threats:['Russia','Cyber'],defenseShare:1.50,debtToGdp:66.5,gini:31.9,hdi:0.942,lifeExp:81.0,inflation:2.3,unemployment:5.7,fxReserves:295,exports:1670,imports:1490,oilProd:0.0,oilCons:2.4,intlPress:'Free'},
  {name:'France',         flag:'🇫🇷',iso:'FRA',capital:'Paris',area:0.551,region:'Europe',gdp:2.92,gdpPerCap:42692,gdpGrowth:0.9,pop:68.4,popGrowth:0.3,milSpend:61,milRank:7,milPersonnel:202,milReserve:35,milTanks:215,milAircraft:1057,milShips:129,nukes:290,nukesActive:280,nukesReserve:10,govType:'Semi-Presidential Republic',leader:'Emmanuel Macron',leaderSince:'2017',allies:['NATO','EU'],threats:['Russia','Sahel'],defenseShare:2.09,debtToGdp:111.6,gini:32.4,hdi:0.910,lifeExp:82.5,inflation:2.4,unemployment:7.5,fxReserves:221,exports:618,imports:752,oilProd:0.0,oilCons:1.6,intlPress:'Free'},
  {name:'Japan',          flag:'🇯🇵',iso:'JPN',capital:'Tokyo',area:0.378,region:'East Asia',gdp:4.21,gdpPerCap:33491,gdpGrowth:1.9,pop:125.7,popGrowth:-0.6,milSpend:50,milRank:5,milPersonnel:247,milReserve:56,milTanks:580,milAircraft:1443,milShips:155,nukes:0,nukesActive:0,nukesReserve:0,nukeNote:'US nuclear umbrella',govType:'Constitutional Monarchy',leader:'Shigeru Ishiba',leaderSince:'2024',allies:['US (Treaty)','QUAD'],threats:['China','North Korea'],defenseShare:1.19,debtToGdp:255.0,gini:32.9,hdi:0.920,lifeExp:84.6,inflation:3.3,unemployment:2.5,fxReserves:1230,exports:746,imports:898,oilProd:0.0,oilCons:3.3,intlPress:'Free'},
  {name:'India',          flag:'🇮🇳',iso:'IND',capital:'New Delhi',area:3.287,region:'South Asia',gdp:3.57,gdpPerCap:2500,gdpGrowth:7.6,pop:1428.0,popGrowth:0.7,milSpend:83.6,milRank:4,milPersonnel:1455,milReserve:1155,milTanks:4614,milAircraft:2296,milShips:294,nukes:172,nukesActive:160,nukesReserve:12,govType:'Federal Parliamentary Republic',leader:'Narendra Modi',leaderSince:'2014',allies:['QUAD','Russia (legacy)'],threats:['Pakistan','China'],defenseShare:2.34,debtToGdp:81.9,gini:35.7,hdi:0.644,lifeExp:67.7,inflation:5.4,unemployment:8.0,fxReserves:646,exports:776,imports:892,oilProd:0.7,oilCons:5.4,intlPress:'Partly Free'},
  {name:'Ukraine',        flag:'🇺🇦',iso:'UKR',capital:'Kyiv',area:0.604,region:'Eastern Europe',gdp:0.18,gdpPerCap:4862,gdpGrowth:5.3,pop:37.0,popGrowth:-7.5,milSpend:64.8,milRank:18,milPersonnel:900,milReserve:1200,milTanks:1100,milAircraft:312,milShips:38,nukes:0,nukesActive:0,nukesReserve:0,nukeNote:'Surrendered 1994',govType:'Semi-Presidential Republic',leader:'Volodymyr Zelensky',leaderSince:'2019',allies:['NATO partners','EU','US'],threats:['Russia (active war)'],defenseShare:36.0,debtToGdp:84.4,gini:25.6,hdi:0.773,lifeExp:71.2,inflation:5.1,unemployment:18.0,fxReserves:39,exports:36,imports:55,oilProd:0.03,oilCons:0.2,intlPress:'Partly Free'},
  {name:'Israel',         flag:'🇮🇱',iso:'ISR',capital:'Jerusalem',area:0.022,region:'Middle East',gdp:0.55,gdpPerCap:55534,gdpGrowth:2.0,pop:9.9,popGrowth:1.6,milSpend:27.5,milRank:17,milPersonnel:170,milReserve:465,milTanks:1370,milAircraft:597,milShips:67,nukes:90,nukesActive:90,nukesReserve:0,nukeNote:'Undeclared (estimated)',govType:'Parliamentary Republic',leader:'Benjamin Netanyahu',leaderSince:'2022',allies:['US Major Non-NATO Ally'],threats:['Iran','Hamas','Hezbollah'],defenseShare:5.00,debtToGdp:60.0,gini:38.6,hdi:0.915,lifeExp:83.0,inflation:4.0,unemployment:3.7,fxReserves:213,exports:140,imports:130,oilProd:0.0,oilCons:0.3,intlPress:'Partly Free'},
  {name:'Iran',           flag:'🇮🇷',iso:'IRN',capital:'Tehran',area:1.648,region:'Middle East',gdp:0.41,gdpPerCap:4671,gdpGrowth:3.5,pop:87.5,popGrowth:0.7,milSpend:10.3,milRank:14,milPersonnel:610,milReserve:350,milTanks:4071,milAircraft:551,milShips:101,nukes:0,nukesActive:0,nukesReserve:0,nukeNote:'Enrichment to 60%+',govType:'Theocratic Republic',leader:'Masoud Pezeshkian',leaderSince:'2024',allies:['Russia','China','Axis of Resistance'],threats:['US','Israel','Saudi Arabia'],defenseShare:2.51,debtToGdp:36.2,gini:40.9,hdi:0.774,lifeExp:77.3,inflation:40.7,unemployment:8.6,fxReserves:127,exports:73,imports:60,oilProd:3.2,oilCons:2.2,intlPress:'Not Free'},
  {name:'North Korea',    flag:'🇰🇵',iso:'PRK',capital:'Pyongyang',area:0.121,region:'East Asia',gdp:0.018,gdpPerCap:654,gdpGrowth:-1.1,pop:26.0,popGrowth:0.4,milSpend:11,milRank:36,milPersonnel:1280,milReserve:600,milTanks:4300,milAircraft:861,milShips:984,nukes:50,nukesActive:50,nukesReserve:0,nukeNote:'Estimated, growing',govType:'One-party Hereditary Dictatorship',leader:'Kim Jong Un',leaderSince:'2011',allies:['China','Russia (de facto)'],threats:['US','South Korea','Japan'],defenseShare:61.1,debtToGdp:0,gini:0,hdi:0,lifeExp:73.0,inflation:0,unemployment:0,fxReserves:0,exports:0.16,imports:0.78,oilProd:0.0,oilCons:0.03,intlPress:'Not Free'},
  {name:'Saudi Arabia',   flag:'🇸🇦',iso:'SAU',capital:'Riyadh',area:2.150,region:'Middle East',gdp:1.06,gdpPerCap:29115,gdpGrowth:0.8,pop:36.4,popGrowth:1.5,milSpend:75.8,milRank:24,milPersonnel:257,milReserve:0,milTanks:1062,milAircraft:879,milShips:75,nukes:0,nukesActive:0,nukesReserve:0,govType:'Absolute Monarchy',leader:'King Salman / MBS',leaderSince:'2015',allies:['US','GCC'],threats:['Iran','Houthis'],defenseShare:7.15,debtToGdp:23.7,gini:45.9,hdi:0.875,lifeExp:77.9,inflation:2.5,unemployment:4.8,fxReserves:421,exports:411,imports:189,oilProd:10.0,oilCons:3.7,intlPress:'Not Free'},
  {name:'Brazil',         flag:'🇧🇷',iso:'BRA',capital:'Brasília',area:8.516,region:'South America',gdp:2.08,gdpPerCap:9663,gdpGrowth:3.0,pop:215.3,popGrowth:0.5,milSpend:22.9,milRank:12,milPersonnel:360,milReserve:1340,milTanks:439,milAircraft:709,milShips:131,nukes:0,nukesActive:0,nukesReserve:0,govType:'Federal Presidential Republic',leader:'Lula da Silva',leaderSince:'2023',allies:['BRICS','Mercosur'],threats:['Amazon security'],defenseShare:1.10,debtToGdp:88.1,gini:53.4,hdi:0.754,lifeExp:75.6,inflation:4.6,unemployment:8.0,fxReserves:355,exports:339,imports:241,oilProd:3.4,oilCons:2.4,intlPress:'Partly Free'},
  {name:'Australia',      flag:'🇦🇺',iso:'AUS',capital:'Canberra',area:7.692,region:'Oceania',gdp:1.69,gdpPerCap:63774,gdpGrowth:1.5,pop:26.5,popGrowth:1.5,milSpend:32.3,milRank:16,milPersonnel:58,milReserve:32,milTanks:59,milAircraft:393,milShips:43,nukes:0,nukesActive:0,nukesReserve:0,nukeNote:'AUKUS nuclear submarines',govType:'Federal Parliamentary',leader:'Anthony Albanese',leaderSince:'2022',allies:['US','AUKUS','Five Eyes','QUAD'],threats:['China','Cyber'],defenseShare:1.91,debtToGdp:55.1,gini:34.3,hdi:0.951,lifeExp:84.0,inflation:5.4,unemployment:3.7,fxReserves:55,exports:413,imports:319,oilProd:0.3,oilCons:1.1,intlPress:'Free'},
];

const EMBEDDED_CONFLICTS = [
  {id:'ukr',name:'Ukraine–Russia War',region:'Eastern Europe',country:'Ukraine',lat:48.38,lon:31.17,severity:'critical',type:'interstate_war',startDate:'2022-02-24',status:'active',casualtiesTotal:'500,000+',casualtiesMil:'300,000+',casualtiesCiv:'40,000+',displaced:'8,200,000+',refugees:'6,500,000+',description:'Full-scale Russian invasion of Ukraine. Largest interstate war in Europe since WWII.',forces:[{side:'Ukraine',personnel:'900,000+',tanks:'1,100+',aircraft:'312',mainBackers:'US, NATO, EU'},{side:'Russia',personnel:'1,320,000',tanks:'12,420',aircraft:'4,255',mainBackers:'Belarus, NK, Iran'}],timeline:[{date:'2022-02-24',event:'Russia launches full-scale invasion'},{date:'2022-09',event:'Ukrainian Kharkiv counteroffensive'},{date:'2024-08',event:'Ukraine launches Kursk incursion'}],fronts:['Donbas','Kharkiv','Zaporizhzhia','Kherson','Kursk'],economicImpact:'Russia: $400B+ war cost. Ukraine: $750B reconstruction est.'},
  {id:'gz', name:'Gaza Conflict',region:'Middle East',country:'Palestine',lat:31.35,lon:34.31,severity:'critical',type:'asymmetric_warfare',startDate:'2023-10-07',status:'active',casualtiesTotal:'45,000+',casualtiesMil:'5,000+',casualtiesCiv:'40,000+',displaced:'1,900,000',refugees:'0 (siege)',description:'Israeli military operations in Gaza Strip following Hamas-led attacks on October 7.',forces:[{side:'Israel (IDF)',personnel:'170,000 + 465k res',tanks:'1,370',aircraft:'597',mainBackers:'US'},{side:'Hamas',personnel:'~30,000',tanks:'0',aircraft:'0',mainBackers:'Iran'}],timeline:[{date:'2023-10-07',event:'Hamas attack kills ~1,200'},{date:'2023-10-27',event:'IDF ground operation begins'},{date:'2024-05-06',event:'IDF enters Rafah'}],fronts:['Northern Gaza','Khan Younis','Rafah','Red Sea (Houthis)'],economicImpact:'Gaza: 90%+ infrastructure destroyed.'},
  {id:'sud',name:'Sudan Civil War',region:'Africa',country:'Sudan',lat:15.50,lon:32.56,severity:'high',type:'civil_war',startDate:'2023-04-15',status:'active',casualtiesTotal:'25,000+',casualtiesMil:'8,000+',casualtiesCiv:'17,000+',displaced:'10,700,000',refugees:'2,400,000',description:'Armed conflict between SAF and RSF. World\'s largest displacement crisis.',forces:[{side:'SAF (Burhan)',personnel:'~200,000',tanks:'170',aircraft:'~190',mainBackers:'Egypt, Iran'},{side:'RSF (Hemedti)',personnel:'~100,000',tanks:'~50',aircraft:'limited',mainBackers:'UAE (alleged)'}],timeline:[{date:'2023-04-15',event:'Fighting erupts in Khartoum'},{date:'2024-08',event:'Famine declared in El Fasher'}],fronts:['Khartoum','El Fasher','Darfur','Sennar'],economicImpact:'GDP collapsed >40%. Famine affecting 25M+.'},
  {id:'myn',name:'Myanmar Civil War',region:'SE Asia',country:'Myanmar',lat:19.76,lon:96.08,severity:'high',type:'civil_war',startDate:'2021-02-01',status:'active',casualtiesTotal:'60,000+',casualtiesMil:'30,000+',casualtiesCiv:'30,000+',displaced:'3,400,000',refugees:'1,300,000',description:'Armed resistance against military junta following February 2021 coup.',forces:[{side:'Junta (SAC)',personnel:'~150,000',tanks:'~600',aircraft:'~280',mainBackers:'China, Russia'},{side:'PDF + EAOs',personnel:'~100,000',tanks:'captured',aircraft:'drones',mainBackers:'NUG'}],timeline:[{date:'2021-02-01',event:'Military coup'},{date:'2023-10-27',event:'Operation 1027 launched'},{date:'2024-08',event:'Lashio falls to MNDAA'}],fronts:['Shan State','Rakhine','Sagaing','Chin State'],economicImpact:'GDP down 18% since coup.'},
  {id:'sah',name:'Sahel Insurgency',region:'Africa',country:'Mali/Niger/BF',lat:15.0,lon:-2.0,severity:'high',type:'insurgency',startDate:'2012-01-16',status:'active',casualtiesTotal:'40,000+',casualtiesMil:'~12,000',casualtiesCiv:'~28,000',displaced:'~4,000,000',refugees:'~1,000,000',description:'JNIM and ISGS insurgency. Russian Africa Corps replacing French Barkhane.',forces:[{side:'Juntas + Russia',personnel:'~80,000+Wagner',tanks:'limited',aircraft:'~50',mainBackers:'Russia'},{side:'JNIM/ISGS',personnel:'~5,000+',tanks:'0',aircraft:'0',mainBackers:'AQIM, IS'}],timeline:[{date:'2021',event:'Mali coup'},{date:'2023-07',event:'Niger coup'},{date:'2024-07',event:'AES withdraws from ECOWAS'}],fronts:['Tri-border','Northern Mali','Eastern BF'],economicImpact:'GDP growth halved.'},
];

const EMBEDDED_SOURCES = [
  {name:'Reuters',country:'UK',url:'https://reuters.com',credibility:5,bias:'center'},
  {name:'Associated Press',country:'US',url:'https://apnews.com',credibility:5,bias:'center'},
  {name:'BBC World',country:'UK',url:'https://bbc.com/news',credibility:5,bias:'center-left'},
  {name:'Al Jazeera',country:'Qatar',url:'https://aljazeera.com',credibility:4,bias:'left'},
  {name:'Defense News',country:'US',url:'https://defensenews.com',credibility:5,bias:'center'},
  {name:'ISW',country:'US',url:'https://understandingwar.org',credibility:5,bias:'center'},
  {name:'Foreign Policy',country:'US',url:'https://foreignpolicy.com',credibility:4,bias:'center'},
  {name:'Bloomberg',country:'US',url:'https://bloomberg.com',credibility:5,bias:'center'},
  {name:'Financial Times',country:'UK',url:'https://ft.com',credibility:5,bias:'center'},
  {name:'The Economist',country:'UK',url:'https://economist.com',credibility:5,bias:'center'},
];

// ── Simulation helpers (offline mode only) ─────────────────────
const SIM_AP = [
  {iata:'JFK',city:'New York',country:'United States',lat:40.64,lon:-73.78},
  {iata:'LHR',city:'London',country:'United Kingdom',lat:51.47,lon:-0.45},
  {iata:'FRA',city:'Frankfurt',country:'Germany',lat:50.04,lon:8.56},
  {iata:'DXB',city:'Dubai',country:'UAE',lat:25.25,lon:55.37},
  {iata:'SIN',city:'Singapore',country:'Singapore',lat:1.36,lon:103.99},
  {iata:'HND',city:'Tokyo',country:'Japan',lat:35.55,lon:139.78},
  {iata:'SYD',city:'Sydney',country:'Australia',lat:-33.95,lon:151.18},
  {iata:'PEK',city:'Beijing',country:'China',lat:40.08,lon:116.60},
  {iata:'CDG',city:'Paris',country:'France',lat:49.01,lon:2.55},
  {iata:'ICN',city:'Seoul',country:'South Korea',lat:37.46,lon:126.44},
  {iata:'GRU',city:'São Paulo',country:'Brazil',lat:-23.44,lon:-46.47},
  {iata:'JNB',city:'Johannesburg',country:'South Africa',lat:-26.14,lon:28.25},
  {iata:'DOH',city:'Doha',country:'Qatar',lat:25.26,lon:51.61},
  {iata:'IST',city:'Istanbul',country:'Turkey',lat:40.98,lon:28.81},
  {iata:'BOM',city:'Mumbai',country:'India',lat:19.09,lon:72.87},
  {iata:'LAX',city:'Los Angeles',country:'United States',lat:33.94,lon:-118.41},
  {iata:'ORD',city:'Chicago',country:'United States',lat:41.97,lon:-87.91},
  {iata:'CAI',city:'Cairo',country:'Egypt',lat:30.11,lon:31.41},
  {iata:'SVO',city:'Moscow',country:'Russia',lat:55.97,lon:37.41},
  {iata:'NRT',city:'Narita',country:'Japan',lat:35.76,lon:140.39},
];

let _sfid = 1000;
function _makeFlight() {
  const o = SIM_AP[Math.floor(Math.random()*SIM_AP.length)];
  let d; do { d = SIM_AP[Math.floor(Math.random()*SIM_AP.length)]; } while (d===o);
  const p = Math.random();
  const lat = o.lat + (d.lat-o.lat)*p, lon = o.lon + (d.lon-o.lon)*p;
  const dLon = (d.lon - lon) * Math.PI/180;
  const y = Math.sin(dLon)*Math.cos(d.lat*Math.PI/180);
  const x = Math.cos(lat*Math.PI/180)*Math.sin(d.lat*Math.PI/180) - Math.sin(lat*Math.PI/180)*Math.cos(d.lat*Math.PI/180)*Math.cos(dLon);
  const brg = (Math.atan2(y,x)*180/Math.PI+360)%360;
  const als = ['UA','DL','AA','BA','LH','AF','EK','SQ','QF','NH'];
  const al = als[Math.floor(Math.random()*als.length)];
  return {
    id:`FL${_sfid++}`,callsign:`${al}${1000+Math.floor(Math.random()*8999)}`,airline:al,aircraft:'B777',
    origin:o.iata,originCity:o.city,originCountry:o.country,
    destination:d.iata,destCity:d.city,destCountry:d.country,
    lat,lon,altitude:Math.round(35000+Math.random()*5000),speed:Math.round(480+Math.random()*100),
    bearing:Math.round(brg),progress:p,etaMins:Math.round(60+Math.random()*180),status:'cruise',
    originLat:o.lat,originLon:o.lon,destLat:d.lat,destLon:d.lon,
  };
}
function simFlights(n) { return Array.from({length:n}, _makeFlight); }
function advanceSimFlights(flights) {
  return flights.map(f => {
    const np = f.progress + 0.002 + Math.random()*0.0005;
    if (np >= 1) return _makeFlight();
    const lat = f.originLat + (f.destLat-f.originLat)*np;
    const lon = f.originLon + (f.destLon-f.originLon)*np;
    return {...f, lat, lon, progress:np};
  });
}

const SIM_ARTICLES = [
  {headline:'Russia launches mass drone attack on Ukrainian energy infrastructure',region:'Eastern Europe',category:'war',urgency:'high',body:'Russian forces launched one of the largest aerial assaults of the war overnight, targeting Ukraine\'s energy infrastructure with Shahed drones and cruise missiles.',tags:['Ukraine','Russia','Air War']},
  {headline:'PLA conducts large-scale exercises near Taiwan Strait',region:'Asia Pacific',category:'geopolitics',urgency:'medium',body:'China\'s People\'s Liberation Army launched its largest naval exercises around Taiwan, deploying approximately 90 vessels including the Shandong carrier strike group.',tags:['China','Taiwan','PLA']},
  {headline:'North Korea tests ICBM with claimed range to US mainland',region:'East Asia',category:'nuclear',urgency:'high',body:'North Korea conducted a test launch of what it claims is a new Hwasong-19 ICBM capable of reaching the entire continental United States.',tags:['North Korea','ICBM','Nuclear']},
  {headline:'Iran uranium enrichment reaches record 84% purity at Fordow',region:'Middle East',category:'nuclear',urgency:'critical',body:'IAEA inspectors detected uranium enriched to 83.7% purity at Iran\'s underground Fordow facility, the highest level ever recorded outside declared weapons programs.',tags:['Iran','Nuclear','IAEA']},
  {headline:'Houthi drone barrage targets Red Sea shipping corridor',region:'Middle East',category:'conflict',urgency:'high',body:'Yemen\'s Houthi rebels launched their largest combined operation against commercial shipping in the Red Sea, deploying drones, ballistic missiles, and an unmanned surface vessel.',tags:['Houthis','Red Sea','Shipping']},
];
let _anid = 9000;
function simNews(n) {
  return Array.from({length:n}, (_, i) => {
    const tpl = SIM_ARTICLES[Math.floor(Math.random()*SIM_ARTICLES.length)];
    const srcs = EMBEDDED_SOURCES;
    const src  = srcs[Math.floor(Math.random()*srcs.length)];
    return {
      id:`SN${_anid++}`, headline:tpl.headline, body:tpl.body,
      region:tpl.region, category:tpl.category, urgency:tpl.urgency,
      source:src.name, sourceCountry:src.country, sourceUrl:src.url,
      credibility:src.credibility, bias:src.bias,
      timestamp:new Date(Date.now() - i*8*60000).toISOString(),
      breaking:Math.random()>0.88, verified:Math.random()>0.3,
      readTime:2, tags:tpl.tags||[],
    };
  });
}

const _ALERT_DESC = [
  'Artillery exchange along front line — multiple positions targeted',
  'Drone swarm intercepted over civilian infrastructure',
  'Ceasefire violation reported by UN monitoring mission',
  'Ground advance — territorial gain confirmed',
  'Airstrike on urban area — casualties being assessed',
];
let _said = 1;
function simAlert() {
  const c = EMBEDDED_CONFLICTS[Math.floor(Math.random()*EMBEDDED_CONFLICTS.length)];
  return {
    id:`A${_said++}`, conflictId:c.id, conflictName:c.name,
    type:['airstrike','artillery','drone_attack','ground_advance'][Math.floor(Math.random()*4)],
    severity:['medium','high','critical'][Math.floor(Math.random()*3)],
    description:_ALERT_DESC[Math.floor(Math.random()*_ALERT_DESC.length)],
    location:(c.fronts||[c.country])[Math.floor(Math.random()*(c.fronts?.length||1))],
    source:['Reuters','AP','ISW','OSINT'][Math.floor(Math.random()*4)],
    timestamp:new Date().toISOString(), verified:Math.random()>0.3,
  };
}

function simMarkets() {
  const commodities = [
    {symbol:'BRENT',name:'Brent Crude Oil',unit:'USD/bbl',base:82.50,vol:0.025,trend:0.0001},
    {symbol:'WTI',  name:'WTI Crude Oil',  unit:'USD/bbl',base:78.20,vol:0.025,trend:0.0001},
    {symbol:'GOLD', name:'Gold',           unit:'USD/oz', base:2680,  vol:0.015,trend:0.0002},
    {symbol:'GAS',  name:'Natural Gas',    unit:'EUR/MWh',base:38.50, vol:0.04, trend:0},
    {symbol:'WHEAT',name:'Wheat',          unit:'USD/bu', base:570,   vol:0.02, trend:0},
    {symbol:'URAN', name:'Uranium',        unit:'USD/lb', base:81.50, vol:0.02, trend:0.0001},
  ];
  const defenseStocks = [
    {symbol:'LMT',name:'Lockheed Martin',country:'US',base:524.30,vol:0.014,trend:0.0001},
    {symbol:'RTX',name:'Raytheon',       country:'US',base:118.50,vol:0.015,trend:0.0001},
    {symbol:'NOC',name:'Northrop Grumman',country:'US',base:485.20,vol:0.013,trend:0.0001},
    {symbol:'GD', name:'General Dynamics',country:'US',base:289.00,vol:0.012,trend:0.0001},
    {symbol:'RHM',name:'Rheinmetall',   country:'Germany',base:592.00,vol:0.025,trend:0.0003},
    {symbol:'BAE',name:'BAE Systems',   country:'UK',    base:1420,  vol:0.014,trend:0.0002},
  ];
  const currencies = [
    {pair:'EUR/USD',base:1.0540,vol:0.004,trend:0},
    {pair:'USD/RUB',base:103.50,vol:0.020,trend:0.0002},
    {pair:'USD/TRY',base:34.85, vol:0.012,trend:0.0003},
    {pair:'USD/UAH',base:42.10, vol:0.010,trend:0.0001},
    {pair:'USD/JPY',base:154.30,vol:0.006,trend:0},
    {pair:'USD/CNY',base:7.244, vol:0.003,trend:0},
  ];
  const w = arr => arr.map(i => {
    const h = Array.from({length:30},(_,j)=>i.base*(0.99+Math.random()*0.02));
    const p = h[h.length-1];
    return {...i, price:p, rate:p, change:((p-i.base)/i.base)*100, history:h};
  });
  return { commodities:w(commodities), defenseStocks:w(defenseStocks), currencies:w(currencies) };
}

function advanceSimMarkets(m) {
  if (!m) return simMarkets();
  const walk = (price, vol, trend) => price * (1 + (Math.random()-0.5)*2*vol*0.1 + trend);
  const adv = arr => arr.map(i => {
    const key = i.price !== undefined ? 'price' : 'rate';
    const np = walk(i[key], i.vol, i.trend);
    return {...i, [key]:np, change:((np-i.base)/i.base)*100, history:[...i.history.slice(-29),np]};
  });
  return {
    commodities:  adv(m.commodities),
    defenseStocks:adv(m.defenseStocks),
    currencies:   adv(m.currencies),
  };
}
