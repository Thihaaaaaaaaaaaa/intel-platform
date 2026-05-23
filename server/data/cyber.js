// ═══════════════════════════════════════════════
// CYBER ATTACK INTELLIGENCE FEED
// Real-time threat actor simulation
// ═══════════════════════════════════════════════

const THREAT_ACTORS = [
  { id:'APT28',   name:'APT-28 / Fancy Bear',    nation:'Russia',  color:0xff2244, tactics:['SPEAR_PHISHING','LATERAL_MOVEMENT','DATA_EXFIL'] },
  { id:'APT29',   name:'APT-29 / Cozy Bear',     nation:'Russia',  color:0xff4422, tactics:['SUPPLY_CHAIN','WATERING_HOLE','C2'] },
  { id:'APT40',   name:'APT-40',                 nation:'China',   color:0xff4400, tactics:['EXPLOITATION','SPEAR_PHISHING','PERSISTENCE'] },
  { id:'APT41',   name:'APT-41 / BARIUM',        nation:'China',   color:0xff6600, tactics:['RANSOMWARE','ESPIONAGE','SUPPLY_CHAIN'] },
  { id:'LAZARUS', name:'Lazarus Group',           nation:'N.Korea', color:0xffaa00, tactics:['FINANCIAL_THEFT','RANSOMWARE','SABOTAGE'] },
  { id:'TA453',   name:'TA-453 / Charming Kitten',nation:'Iran',   color:0xff8800, tactics:['CREDENTIAL_THEFT','SPEAR_PHISHING','DISINFOR'] },
  { id:'SANDWORM',name:'Sandworm',               nation:'Russia',  color:0xff0000, tactics:['DESTRUCTIVE','ICS_ATTACK','WIPER'] },
  { id:'UNC3886', name:'UNC-3886',               nation:'China',   color:0xee4400, tactics:['FIREWALL_EXPLOIT','ZERO_DAY','ESPIONAGE'] },
  { id:'VOLT',    name:'Volt Typhoon',            nation:'China',   color:0xdd5500, tactics:['PRE_POSITION','CRITICAL_INFRA','LIVING_OFF_LAND'] },
];

const ATTACK_ORIGINS = [
  { city:'Moscow',      lat:55.75, lon:37.62, actors:['APT28','APT29','SANDWORM'] },
  { city:'Beijing',     lat:39.91, lon:116.39,actors:['APT40','APT41','UNC3886','VOLT'] },
  { city:'Pyongyang',   lat:39.02, lon:125.75,actors:['LAZARUS'] },
  { city:'Tehran',      lat:35.69, lon:51.39, actors:['TA453'] },
  { city:'Shanghai',    lat:31.23, lon:121.47,actors:['APT40','APT41'] },
  { city:'St. Petersburg',lat:59.94,lon:30.31,actors:['APT28','SANDWORM'] },
];

const ATTACK_TARGETS = [
  { city:'Washington D.C.', lat:38.90, lon:-77.04, sector:'Government' },
  { city:'New York',         lat:40.71, lon:-74.01, sector:'Finance' },
  { city:'London',           lat:51.51, lon:-0.13,  sector:'Finance/Gov' },
  { city:'Berlin',           lat:52.52, lon:13.40,  sector:'Government' },
  { city:'Paris',            lat:48.86, lon:2.35,   sector:'Government' },
  { city:'Kyiv',             lat:50.45, lon:30.52,  sector:'Military/Infra' },
  { city:'Tel Aviv',         lat:32.08, lon:34.78,  sector:'Defense' },
  { city:'Tokyo',            lat:35.68, lon:139.69, sector:'Technology' },
  { city:'Seoul',            lat:37.57, lon:126.98, sector:'Military/Tech' },
  { city:'Warsaw',           lat:52.23, lon:21.01,  sector:'Military/Gov' },
  { city:'Brussels',         lat:50.85, lon:4.35,   sector:'NATO/EU' },
  { city:'Ottawa',           lat:45.42, lon:-75.69, sector:'Government' },
  { city:'Riyadh',           lat:24.69, lon:46.72,  sector:'Energy' },
  { city:'Singapore',        lat:1.35,  lon:103.82, sector:'Finance/Port' },
  { city:'Frankfurt',        lat:50.11, lon:8.68,   sector:'Finance/Cloud' },
];

const ATTACK_TYPES = [
  'Zero-Day Exploitation','Ransomware Deployment','DDoS Amplification',
  'Supply Chain Compromise','Credential Harvesting','Critical Infrastructure Probe',
  'Data Exfiltration','Command & Control','Watering Hole Attack',
  'Spear Phishing Campaign','ICS/SCADA Attack','Financial System Intrusion',
];

let attackIdCounter = 1;

export function generateCyberAttack() {
  const origin = ATTACK_ORIGINS[Math.floor(Math.random() * ATTACK_ORIGINS.length)];
  const target = ATTACK_TARGETS[Math.floor(Math.random() * ATTACK_TARGETS.length)];
  const actorId = origin.actors[Math.floor(Math.random() * origin.actors.length)];
  const actor = THREAT_ACTORS.find(a => a.id === actorId);
  const attackType = ATTACK_TYPES[Math.floor(Math.random() * ATTACK_TYPES.length)];
  const severity = ['LOW','MEDIUM','HIGH','CRITICAL'][Math.floor(Math.random() * 4)];

  return {
    id: `CYB${attackIdCounter++}`,
    actor: actor?.name || actorId,
    actorNation: actor?.nation || 'Unknown',
    actorColor: actor?.color || 0xff0000,
    tactic: actor?.tactics[Math.floor(Math.random() * (actor?.tactics.length||1))] || 'UNKNOWN',
    attackType,
    origin: { city: origin.city, lat: origin.lat, lon: origin.lon },
    target: { city: target.city, lat: target.lat, lon: target.lon, sector: target.sector },
    severity,
    timestamp: new Date().toISOString(),
    volumeMbps: severity === 'CRITICAL' ? Math.round(50 + Math.random() * 950)
              : severity === 'HIGH'     ? Math.round(10 + Math.random() * 200)
              : Math.round(1 + Math.random() * 50),
    status: Math.random() > 0.3 ? 'ACTIVE' : 'MITIGATED',
    attribution: Math.random() > 0.4 ? 'CONFIRMED' : 'SUSPECTED',
  };
}

// Seed initial pool
const initialPool = [];
for (let i = 0; i < 12; i++) initialPool.push(generateCyberAttack());

export function getCyberAttacks() { return initialPool.slice(-20); }
export { THREAT_ACTORS, ATTACK_ORIGINS, ATTACK_TARGETS };
