// ═══════════════════════════════════════════════
// SATELLITE DATABASE — Rich intelligence profiles
// ═══════════════════════════════════════════════

export const SATELLITE_CLASSES = {
  LEO:    { altMin: 120, altMax: 130, color: 0x00ccff,  size: 1.2 },
  MEO:    { altMin: 155, altMax: 165, color: 0x8888ff,  size: 1.2 },
  GEO:    { altMin: 200, altMax: 210, color: 0xffaa00,  size: 1.6 },
  SPY:    { altMin: 115, altMax: 125, color: 0xff2244,  size: 1.3 },
  STAR:   { altMin: 108, altMax: 114, color: 0x44ffaa,  size: 0.9 },
  DEBRIS: { altMin: 110, altMax: 145, color: 0x445566,  size: 0.7 },
};

export const SATELLITES = [
  // ISS
  { id:'ISS', name:'International Space Station', shortName:'ISS', nation:'International', flag:'🌍',
    type:'LEO', orbitType:'Low Earth Orbit', altKm:408, inclination:51.6, period:92, raan:0, size:2.2, color:0xffffff,
    purpose:'Crewed Research Station', status:'OPERATIONAL', launched:'1998-11-20',
    owner:'NASA / Roscosmos / ESA / JAXA / CSA',
    description:'Largest human-made structure in orbit. International collaboration between 15 nations. Continuous human presence since 2000. Conducts microgravity research in biology, physics, astronomy.',
    capabilities:['Microgravity research','Earth observation','Astronomy','Technology testing'],
    classification:'CIVILIAN', threat:'NONE' },

  // US Military / Reconnaissance
  { id:'KH-13', name:'KH-13 Keyhole', shortName:'KH-13', nation:'United States', flag:'🇺🇸',
    type:'SPY', orbitType:'Low Earth Orbit (SSO)', altKm:300, inclination:97.9, period:96, raan:45, size:1.4, color:0xff2244,
    purpose:'Optical Reconnaissance', status:'CLASSIFIED', launched:'2023 (est.)',
    owner:'National Reconnaissance Office (NRO)',
    description:'Advanced electro-optical reconnaissance satellite operated by the NRO. Provides near-real-time imagery with sub-10cm ground resolution for strategic and tactical intelligence.',
    capabilities:['High-res optical imaging','Real-time downlink','Signals intercept (est.)'],
    classification:'TOP SECRET', threat:'STRATEGIC' },

  { id:'USA-326', name:'USA-326 (NROL-68)', shortName:'USA-326', nation:'United States', flag:'🇺🇸',
    type:'SPY', orbitType:'Highly Elliptical Orbit', altKm:350, inclination:63.4, period:98, raan:90, size:1.3, color:0xff2244,
    purpose:'SIGINT / MASINT', status:'CLASSIFIED', launched:'2022-07-01',
    owner:'National Reconnaissance Office (NRO)',
    description:'Signals intelligence satellite providing persistent coverage of denied areas. Believed to intercept communications, radar emissions, and electronic signals from adversary military systems.',
    capabilities:['Signals intelligence','Electronic intercept','Radar mapping'],
    classification:'TOP SECRET', threat:'STRATEGIC' },

  { id:'SBIRS-1', name:'SBIRS GEO-1', shortName:'SBIRS GEO-1', nation:'United States', flag:'🇺🇸',
    type:'GEO', orbitType:'Geostationary', altKm:35786, inclination:3.0, period:1436, raan:100, size:1.6, color:0xff8800,
    purpose:'Missile Early Warning', status:'OPERATIONAL', launched:'2011-05-07',
    owner:'US Space Force / Lockheed Martin',
    description:'Space-Based Infrared System. Provides immediate warning of ballistic missile launches worldwide. Detects the infrared signature of rocket plumes within seconds of launch. Critical nuclear deterrence asset.',
    capabilities:['ICBM launch detection','SLBM detection','Technical intelligence','Battle space awareness'],
    classification:'SECRET', threat:'DEFENSIVE' },

  { id:'WGS-10', name:'WGS-10', shortName:'WGS-10', nation:'United States', flag:'🇺🇸',
    type:'GEO', orbitType:'Geostationary', altKm:35786, inclination:2.0, period:1436, raan:200, size:1.7, color:0xff8800,
    purpose:'Military Communications', status:'OPERATIONAL', launched:'2019-03-18',
    owner:'US Space Force / Boeing',
    description:'Wideband Global SATCOM satellite. Provides high-capacity broadband communications for US and allied military operations globally. Supports drone operations, special forces, carrier battle groups.',
    capabilities:['High-bandwidth comms','Drone datalinks','JTAC support','Coalition networking'],
    classification:'SECRET', threat:'NONE' },

  { id:'GPS-III', name:'GPS III SV-01', shortName:'GPS III', nation:'United States', flag:'🇺🇸',
    type:'MEO', orbitType:'Medium Earth Orbit', altKm:20200, inclination:55.0, period:720, raan:60, size:1.4, color:0x8888ff,
    purpose:'Navigation / Positioning', status:'OPERATIONAL', launched:'2018-12-23',
    owner:'US Space Force / Lockheed Martin',
    description:'Third-generation GPS satellite with 3x better accuracy and 8x anti-jamming capability. Provides civilian and military positioning. L1C signal compatible with international navigation systems.',
    capabilities:['Military GPS (M-code)','Civilian navigation','Anti-jam capability','Nuclear detonation detection'],
    classification:'DUAL USE', threat:'NONE' },

  { id:'MENTOR-5', name:'MENTOR-5 (Advanced Orion)', shortName:'MENTOR-5', nation:'United States', flag:'🇺🇸',
    type:'GEO', orbitType:'Geostationary', altKm:35786, inclination:4.5, period:1436, raan:280, size:1.5, color:0xff2244,
    purpose:'SIGINT / Comms Intercept', status:'CLASSIFIED', launched:'2012 (est.)',
    owner:'National Security Agency / NRO',
    description:'Massive SIGINT satellite with enormous deployable antenna estimated at 100m diameter. Intercepts foreign military and government communications. One of the most capable intelligence-gathering systems ever built.',
    capabilities:['Communications intercept','Telemetry collection','Foreign military SIGINT','Diplomatic intelligence'],
    classification:'TOP SECRET/SCI', threat:'STRATEGIC' },

  // Russian Military
  { id:'KOS-2558', name:'Kosmos-2558', shortName:'KOS-2558', nation:'Russia', flag:'🇷🇺',
    type:'SPY', orbitType:'Low Earth Orbit', altKm:550, inclination:97.6, period:97, raan:75, size:1.3, color:0xff3300,
    purpose:'Inspector / ASAT', status:'ACTIVE', launched:'2022-08-01',
    owner:'Russian Space Forces / Ministry of Defence',
    description:'Suspected inspector satellite that tracked US spy satellite USA-326. Russia describes it as a "space apparatus inspector" but Western analysts assess it has close-approach and potential ASAT capabilities.',
    capabilities:['Satellite inspection','Proximity operations','Potential ASAT','Signals intercept'],
    classification:'MILITARY', threat:'HIGH' },

  { id:'MERIDIAN-9', name:'Meridian-9', shortName:'MRD-9', nation:'Russia', flag:'🇷🇺',
    type:'GEO', orbitType:'Molniya Orbit', altKm:39000, inclination:63.8, period:718, raan:310, size:1.4, color:0xff3300,
    purpose:'Military Communications', status:'OPERATIONAL', launched:'2019-06-20',
    owner:'Russian Space Forces',
    description:'Military communications satellite in highly elliptical Molniya orbit, providing coverage over Russia\'s northern regions. Supports strategic nuclear forces, naval operations, and Arctic military activities.',
    capabilities:['Strategic nuclear comms','Arctic coverage','Naval communications','Air defence coordination'],
    classification:'MILITARY', threat:'LOW' },

  { id:'GLONASS-K', name:'GLONASS-K2', shortName:'GLONASS', nation:'Russia', flag:'🇷🇺',
    type:'MEO', orbitType:'Medium Earth Orbit', altKm:19100, inclination:64.8, period:676, raan:80, size:1.3, color:0xee4400,
    purpose:'Navigation / Positioning', status:'OPERATIONAL', launched:'2023-08-07',
    owner:'Russian Space Forces / Roscosmos',
    description:'Latest generation Russian GLONASS navigation satellite. Provides independent navigation capability for Russian military forces. L3OC signal competes with GPS globally. Essential for precision-guided munitions.',
    capabilities:['Military navigation','Precision munitions guidance','Civilian navigation','Anti-jamming'],
    classification:'DUAL USE', threat:'NONE' },

  { id:'LUCH-5A', name:'Luch-5A', shortName:'LUCH-5A', nation:'Russia', flag:'🇷🇺',
    type:'GEO', orbitType:'Geostationary', altKm:35786, inclination:1.0, period:1436, raan:165, size:1.5, color:0xff3300,
    purpose:'Data Relay / SIGINT (suspected)', status:'ACTIVE', launched:'2011-12-11',
    owner:'Roscosmos (officially)',
    description:'Officially a data relay satellite, Luch-5A has been observed maneuvering close to western commercial and military satellites. NATO intelligence services suspect it carries SIGINT payloads and may be an orbital intelligence gatherer.',
    capabilities:['Data relay','Suspected SIGINT','Proximity operations history','Communications intercept'],
    classification:'DUAL USE (SUSPECTED SPY)', threat:'MEDIUM' },

  // Chinese Military
  { id:'YAOGAN-35', name:'Yaogan-35C', shortName:'YG-35C', nation:'China', flag:'🇨🇳',
    type:'LEO', orbitType:'Low Earth Orbit', altKm:500, inclination:35.0, period:90, raan:20, size:1.3, color:0xff4400,
    purpose:'Optical/Radar Reconnaissance', status:'OPERATIONAL', launched:'2022-11-27',
    owner:'People\'s Liberation Army Strategic Support Force',
    description:'Part of China\'s Yaogan constellation of reconnaissance satellites. Believed to carry synthetic aperture radar (SAR) and high-resolution optical sensors for monitoring US carrier groups and military facilities in the Indo-Pacific.',
    capabilities:['SAR imaging','Optical reconnaissance','Maritime surveillance','Anti-carrier targeting'],
    classification:'MILITARY', threat:'HIGH' },

  { id:'SHIJIAN-20', name:'Shijian-20', shortName:'SJ-20', nation:'China', flag:'🇨🇳',
    type:'GEO', orbitType:'Geostationary', altKm:35786, inclination:2.5, period:1436, raan:115, size:1.7, color:0xee4400,
    purpose:'Communications / Technology Test', status:'OPERATIONAL', launched:'2019-12-27',
    owner:'China Aerospace Science and Technology Corporation',
    description:'China\'s largest and most advanced geostationary satellite. Uses electric propulsion and advanced communications payloads. Also suspected to carry technology demonstration payloads including rendezvous and proximity capabilities.',
    capabilities:['High-throughput comms','Electric propulsion demo','Technology testing','Military datalinks'],
    classification:'DUAL USE', threat:'LOW' },

  { id:'TIANLIAN-2', name:'Tianlian-2-01', shortName:'TL2-01', nation:'China', flag:'🇨🇳',
    type:'GEO', orbitType:'Geostationary', altKm:35786, inclination:3.0, period:1436, raan:75, size:1.6, color:0xee4400,
    purpose:'Space Data Relay', status:'OPERATIONAL', launched:'2019-03-31',
    owner:'China Satcom / PLA',
    description:'Second-generation Tianlian data relay satellite. Supports China\'s manned space program, Tiangong space station, lunar missions, and military reconnaissance satellites. Provides continuous downlink from low-orbit assets.',
    capabilities:['Crewed spacecraft relay','Military satellite relay','Tiangong station comms','Real-time reconnaisance relay'],
    classification:'DUAL USE', threat:'LOW' },

  { id:'BDS-3G', name:'BeiDou-3 GEO-1', shortName:'BDS-G1', nation:'China', flag:'🇨🇳',
    type:'GEO', orbitType:'Geostationary', altKm:35786, inclination:2.0, period:1436, raan:140, size:1.5, color:0xee4400,
    purpose:'Navigation / Positioning', status:'OPERATIONAL', launched:'2018-11-01',
    owner:'China Satellite Navigation Office',
    description:'BeiDou-3 Navigation Satellite System geostationary component. Provides global positioning services with sub-meter military accuracy. Reduces China\'s dependence on US GPS. Integrated into precision-guided weapons and military C4ISR systems.',
    capabilities:['Military navigation','Precision guidance','Short-message service','Search and rescue'],
    classification:'DUAL USE', threat:'NONE' },

  // European/Other
  { id:'GALILEO-5', name:'Galileo FOC-5', shortName:'GALILEO', nation:'European Union', flag:'🇪🇺',
    type:'MEO', orbitType:'Medium Earth Orbit', altKm:23222, inclination:56.0, period:844, raan:55, size:1.3, color:0x4488ff,
    purpose:'Navigation / Positioning', status:'OPERATIONAL', launched:'2016-05-24',
    owner:'European Space Agency / EU Agency for the Space Programme',
    description:'European Union\'s independent navigation satellite system. Provides civilian and public regulated service (PRS) for government security services. Reduces European dependence on US GPS. Integrates with NATO positioning standards.',
    capabilities:['High-accuracy navigation','Public Regulated Service (encrypted)','Search and rescue','Authentication service'],
    classification:'DUAL USE', threat:'NONE' },

  { id:'SENTINEL-1A', name:'Sentinel-1A', shortName:'S1-A', nation:'European Union', flag:'🇪🇺',
    type:'LEO', orbitType:'Sun-Synchronous Orbit', altKm:693, inclination:98.2, period:99, raan:260, size:1.2, color:0x4488ff,
    purpose:'SAR Earth Observation', status:'OPERATIONAL', launched:'2014-04-03',
    owner:'European Space Agency / Copernicus Programme',
    description:'Synthetic Aperture Radar (SAR) Earth observation satellite. Provides all-weather, day/night monitoring. Used for monitoring troop movements, tracking shipping, damage assessment in conflict zones, and detecting underground facilities.',
    capabilities:['All-weather SAR imaging','Ship tracking (AIS)','Displacement mapping','Flood and disaster response'],
    classification:'CIVILIAN (dual use)', threat:'NONE' },

  { id:'OFEQ-16', name:'Ofeq-16', shortName:'OFEQ-16', nation:'Israel', flag:'🇮🇱',
    type:'SPY', orbitType:'Low Earth Orbit (retrograde)', altKm:600, inclination:142.9, period:95, raan:50, size:1.2, color:0xffcc00,
    purpose:'Optical/Electro-optical Reconnaissance', status:'OPERATIONAL', launched:'2020-07-06',
    owner:'Israeli Ministry of Defence / Israel Aerospace Industries',
    description:'Israel\'s most advanced reconnaissance satellite. Orbits in retrograde to avoid overflying hostile nations. Provides high-resolution imagery of Iran, Syria, and the broader Middle East. Resolution believed to be sub-50cm.',
    capabilities:['High-res optical imaging','IR sensors','Wide-area search','Near-real-time downlink'],
    classification:'SECRET', threat:'STRATEGIC' },

  // Starlink constellation samples
  ...[0,30,60,90,120,150,180,210,240,270,300,330].map((raan, i) => ({
    id:`SL-${i}`, name:`Starlink-${2000+i*47}`, shortName:`SL-${2000+i*47}`, nation:'United States', flag:'🇺🇸',
    type:'STAR', orbitType:'Low Earth Orbit', altKm:550, inclination:53.0 + (i%3)*10, period:95, raan,
    size:0.9, color:0x44ffaa,
    purpose:'Broadband Internet / Military Comms', status:'OPERATIONAL', launched:'2023',
    owner:'SpaceX (with DoD contracts)',
    description:'Part of SpaceX Starlink mega-constellation. Provides global broadband internet. Starlink has been used extensively in Ukraine for military communications, drone operations, and battlefield coordination. DoD has contracted Starlink for military use.',
    capabilities:['Global broadband','Military tactical comms','Drone datalinks','Jamming resistant'],
    classification:'COMMERCIAL (military use)', threat:'NONE' })),

  // Debris
  ...[12,35,67,90,102,134,156,178,199,213].map((raan,i)=>({
    id:`DEB-${i}`, name:`Debris Object ${7000+i}`, shortName:`DEB-${7000+i}`, nation:'Unknown', flag:'❓',
    type:'DEBRIS', orbitType:'Various', altKm:400+i*15, inclination:30+i*8, period:90+i*4, raan,
    size:0.7, color:0x445566,
    purpose:'None (Space Debris)', status:'UNCONTROLLED', launched:'Various',
    owner:'Unknown / Legacy fragments',
    description:'Tracked space debris object. Fragments from old rocket bodies, defunct satellites, or collision events. Poses collision risk to operational spacecraft. Tracked by US Space Surveillance Network.',
    capabilities:['None — collision hazard'],
    classification:'NONE', threat:'COLLISION RISK' })),
];

export function getSatPosition(sat, t, R_GLOBE) {
  const period = sat.period * 60;
  const n = (2 * Math.PI) / period;
  const M = (n * t) % (2 * Math.PI);
  const inc = sat.inclination * Math.PI / 180;
  const raan = (sat.raan * Math.PI / 180) + (t * 7.2921e-5);
  const cls = { LEO:122, MEO:160, GEO:205, SPY:120, STAR:110, DEBRIS:128 };
  const orbitR = R_GLOBE + (cls[sat.type] || 120);
  const xOrb = orbitR * Math.cos(M), yOrb = orbitR * Math.sin(M);
  const x = xOrb * Math.cos(raan) - yOrb * Math.cos(inc) * Math.sin(raan);
  const y = yOrb * Math.sin(inc);
  const z = xOrb * Math.sin(raan) + yOrb * Math.cos(inc) * Math.cos(raan);
  return { x, y, z };
}
