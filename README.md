# 🌍 Global Intelligence Platform v4.0

A real-time geopolitical intelligence dashboard built on a photo-realistic 3D Earth globe. Monitor live flights, satellites, cargo ships, active conflicts, weather events, natural disasters, cyber attacks, and global markets — all in one platform.

---

## Pages

### ⬢ Globe
The central 3D Earth rendered with NASA satellite imagery. All live data layers are plotted directly on the globe surface. Drag to rotate, scroll to zoom, click any object for full details.

### ⬣ Atlas
Country intelligence profiles for 30+ nations. Every profile includes full economic data, military capability breakdown, nuclear status, government type, current leadership, press freedom rating, alliances and perceived threat actors.

### ⌬ Military
Comparative rankings across all tracked nations — defense budgets, active military personnel, reserve forces, tanks, aircraft, naval vessels and nuclear warhead stockpiles. All rendered as live bar charts.

### ⚠ Conflicts
Deep-dive briefings on 11 active conflict zones worldwide. Each includes a full timeline, breakdown of forces by side, casualty tracking, displacement figures, active front lines, economic impact assessment and live incoming alerts.

### ⟁ News Wire
Live geopolitical news feed with a full article reader. Each article shows the publishing source, source country, direct URL link, credibility rating (1–5 stars), editorial bias classification, category, region and read time.

### ⌗ Markets
Live pricing for commodities, defense sector stocks and geopolitical currency pairs — all with 30-point sparkline history charts. Includes a geopolitical impact analysis panel correlating market movements to active conflict events.

---

## Globe Layers

All layers are independently toggleable from the control bar at the bottom of the globe.

| Layer | Description |
|-------|-------------|
| ✈ Flights | Live commercial aircraft positions worldwide. Colour coded — blue = cruise, green = climbing, orange = descending. Nose points toward destination. Hover for callsign, route, altitude, speed and ETA. Click to pin. |
| 🛰 Satellites | 40+ tracked satellites in real orbital positions computed from Two-Line Element (TLE) data. Includes ISS, Starlink constellation, GPS/GLONASS/BeiDou/Galileo navigation systems, US/Russian/Chinese/Israeli reconnaissance satellites, and tracked space debris. Hover for full intelligence profile — orbit type, altitude, owner, classification, threat assessment and capabilities. Click for full modal. |
| 🚢 Ships | 180 maritime vessels on 11 global trade routes — container ships, oil tankers, LNG carriers, bulk carriers, naval vessels and reefers. Colour coded by ship type. Hover for vessel name, shipping line, cargo type, DWT tonnage, speed and ETA. Click to pin. |
| ⚠ Conflicts | Pulsing markers on all 11 active conflict zones. Ring size and colour indicate severity — red = critical, orange = high, amber = medium. Click for full conflict briefing. |
| ⚡ Cyber | Animated bezier arcs showing active cyber attack flows from known threat actor origin cities to target cities. Colour coded by nation — Russian APTs in red, Chinese in orange, North Korean in amber, Iranian in dark orange. |
| 🌐 Cables | 13 major submarine internet cable routes plotted on the ocean floor. FLAG, SEA-ME-WE 3, TAT-14, UNITY, FASTER, MAREA, JUPITER and more. |
| 🌊 Currents | 6 animated ocean current particle streams — Gulf Stream, Kuroshio, Antarctic Circumpolar, North Equatorial, Agulhas and Labrador currents. |
| ☁ Clouds | Real cloud cover layer from satellite imagery, slowly counter-rotating to simulate atmospheric drift. |
| 🔥 Fires | Active wildfire hotspot clusters. Each cluster represents multiple VIIRS satellite detection points aggregated by proximity. Flicker animation indicates active burn. |
| 🌡 Heatmap | Concentric radiating rings around critical and high-severity conflict zones indicating the zone of influence and instability. |
| 🌦 Weather | Live weather conditions for 20 major cities worldwide. Colour coded by temperature and storm severity. Hover for full conditions — temperature, wind speed, gusts, humidity, precipitation and pressure. |
| 🚨 Disasters | Active natural disasters from global monitoring systems — earthquakes, tropical cyclones, floods, volcanic eruptions, tsunamis and droughts. Pulsing rings indicate severity. Hover for event title, affected country, description and source. |

---

## Data Sources

### No API Key Required

| Source | Data | Update Rate |
|--------|------|-------------|
| **OpenSky Network** | Live ADS-B flight positions for all commercial aircraft worldwide | Every 12 seconds |
| **CelesTrak** | Satellite Two-Line Element (TLE) orbital data — ISS, Starlink, GPS, military, debris | TLE refreshed hourly, positions computed every 3 seconds |
| **Open-Meteo** | Live weather conditions for 20 monitored cities | Every 10 minutes |
| **GDACS** | Global Disaster Alert and Coordination System — active earthquakes, cyclones, floods, volcanoes | Every 10 minutes |

### Free API Key Required

| Source | Data | Key |
|--------|------|-----|
| **NewsAPI** | Live geopolitical headlines from Reuters, AP, BBC, Al Jazeera, NYT, Guardian, Bloomberg and more | `NEWS_API_KEY` |
| **NASA FIRMS** | Real wildfire hotspots from VIIRS satellite at 375m resolution | `NASA_FIRMS_KEY` |
| **AISHub** | Live AIS vessel tracking — real ship positions, speed, heading, cargo | `AISHUB_KEY` |
| **Alpha Vantage** | Live defense stock prices — LMT, RTX, NOC, GD, Boeing, BAE Systems, Rheinmetall | `ALPHA_VANTAGE_KEY` |
| **ExchangeRate-API** | Live foreign exchange rates — EUR/USD, USD/RUB, USD/UAH, USD/TRY and more | `EXCHANGE_RATE_KEY` |

All API keys are optional. Every data source falls back to a realistic simulation if no key is provided or if the external API is unavailable.

---

## Satellite Intelligence Database

Each satellite in the platform carries a full intelligence profile:

- **Name and short identifier**
- **Owning nation and flag**
- **Orbit type** — LEO, MEO, GEO, SSO, HEO, retrograde
- **Altitude, inclination and orbital period**
- **Operating organisation** — e.g. NRO, US Space Force, PLA Strategic Support Force, ESA
- **Launch date and operational status**
- **Classification level** — TOP SECRET, SECRET, MILITARY, DUAL USE, CIVILIAN
- **Threat assessment** — STRATEGIC, HIGH, MEDIUM, COLLISION RISK, NONE
- **Known capabilities** — optical imaging, SAR, SIGINT, navigation, communications relay, ASAT
- **Intelligence description** — what the satellite actually does and why it matters strategically

Satellites covered include the ISS, KH-13 Keyhole, Kosmos-2558, MENTOR-5, SBIRS GEO, WGS-10, Yaogan-35, Tianlian-2, BeiDou-3, GPS III, GLONASS-K2, Galileo FOC, Sentinel-1A, Ofeq-16, and a full Starlink constellation sample.

---

## News Sources

The platform tracks and rates 18 intelligence-relevant news sources:

| Source | Country | Credibility | Bias |
|--------|---------|-------------|------|
| Reuters | UK | ★★★★★ | Centre |
| Associated Press | US | ★★★★★ | Centre |
| BBC World | UK | ★★★★★ | Centre-Left |
| Bloomberg | US | ★★★★★ | Centre |
| Financial Times | UK | ★★★★★ | Centre |
| The Economist | UK | ★★★★★ | Centre |
| Defense News | US | ★★★★★ | Centre |
| ISW (Institute for the Study of War) | US | ★★★★★ | Centre |
| ACLED | US | ★★★★★ | Centre |
| Al Jazeera | Qatar | ★★★★ | Left |
| The New York Times | US | ★★★★ | Left |
| The Guardian | UK | ★★★★ | Left |
| Politico | US | ★★★★ | Centre-Left |
| Foreign Policy | US | ★★★★ | Centre |
| Le Monde | France | ★★★★★ | Centre-Left |
| Der Spiegel | Germany | ★★★★★ | Centre-Left |
| Kyiv Independent | Ukraine | ★★★★ | Pro-Ukraine |
| Times of Israel | Israel | ★★★★ | Pro-Israel |

---

## Globe Textures

The 3D globe renders with five stacked texture layers applied to the original 3ds Max OBJ model geometry:

| File | Purpose |
|------|---------|
| `earth_albedo.jpg` | Full colour satellite photograph of Earth's surface — land, ocean, ice and vegetation |
| `earth_bump.jpg` | Elevation bump map — mountains and terrain catch directional sunlight |
| `earth_land_ocean_mask.png` | Specular mask — ocean surface reflects light like water, land stays matte |
| `earth_night_lights_modified.png` | City lights on the dark hemisphere — additive blend visible only in shadow |
| `clouds_earth.png` | Cloud layer alpha map on a slightly larger sphere — slowly drifts eastward |

---

## Country Intelligence Profiles

The Atlas page covers 30 nations with the following data points per country:

**Economic** — GDP total, GDP per capita, GDP growth rate, inflation, unemployment, debt-to-GDP ratio, Gini inequality index, HDI score, foreign exchange reserves, total exports, total imports, oil production, oil consumption

**Military** — annual defence spending (USD), global military rank, active personnel, reserve forces, main battle tanks, total aircraft, naval vessels, nuclear warheads (total, deployed, reserve)

**Society** — population, population growth rate, life expectancy, area, government type, current leader, leader since, press freedom classification

**Geopolitical** — formal alliances and partnerships, perceived threat actors, defence spending as percentage of GDP

---

## Active Conflicts Covered

| Conflict | Region | Status |
|----------|--------|--------|
| Ukraine–Russia War | Eastern Europe | Active |
| Gaza Conflict | Middle East | Active |
| Sudan Civil War | Africa | Active |
| Myanmar Civil War | SE Asia | Active |
| DRC Eastern Conflict | Africa | Active |
| Haiti Gang Crisis | Caribbean | Active |
| Ethiopia Conflicts | Africa | Simmering |
| Sahel Insurgency | West Africa | Active |
| Yemen Conflict | Middle East | Low Intensity |
| Syria Instability | Middle East | Transitional |
| Lebanon–Israel | Middle East | Ceasefire |

---

## Market Coverage

**Commodities** — Brent Crude, WTI Crude, Natural Gas (TTF), Gold, Silver, Wheat, Copper, Uranium

**Defense Stocks** — Lockheed Martin (LMT), Raytheon (RTX), Northrop Grumman (NOC), General Dynamics (GD), Boeing (BA), BAE Systems, Thales, Airbus, Rheinmetall, Leonardo, Kongsberg, Huntington Ingalls

**Geopolitical Currency Pairs** — EUR/USD, GBP/USD, USD/JPY, USD/CNY, USD/RUB, USD/TRY, USD/ILS, USD/UAH — each tagged with geopolitical context explaining the currency's relationship to regional conflicts and sanctions

---

## Technology Stack

**Backend** — Node.js, Express, ws (WebSocket), ES Modules

**Frontend** — Vanilla JavaScript (ES6+), Three.js r128 (3D globe), CSS Grid, Glassmorphic UI

**3D Rendering** — Three.js with OBJLoader, MeshPhongMaterial with multi-texture pipeline, ACES Filmic tone mapping, procedural starfield, atmospheric glow layers

**Real-time** — WebSocket server broadcasting on 9 channels with server-side TTL cache preventing API rate limit abuse. All data refreshes happen server-side and are pushed to all connected clients simultaneously.

**Offline resilience** — Every external data source has a complete embedded fallback dataset. The platform is fully functional with zero API keys and zero network access to external services.
