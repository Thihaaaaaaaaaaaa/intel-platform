# 🌍 Global Intelligence Platform v4.0

Real-time geopolitical intelligence dashboard — live flights, satellites, ships, weather, disasters, conflicts and markets on a photo-realistic 3D globe.

---

## Deploy to Render (free)

### Step 1 — Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/intel-platform.git
git push -u origin main
```

### Step 2 — Create Render Web Service
1. Go to [render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub repo
3. Render auto-detects the settings from `render.yaml`:
   - **Build command:** `npm install`
   - **Start command:** `npm start`
4. Click **Create Web Service**

Your app will be live at `https://intel-platform.onrender.com` (or similar) in ~2 minutes.

### Step 3 — Add API keys (optional, all free)
In Render Dashboard → **Environment** → Add these for real data:

| Variable | Where to get it | What it enables |
|----------|----------------|-----------------|
| `NEWS_API_KEY` | [newsapi.org/register](https://newsapi.org/register) | Real geopolitical headlines |
| `NASA_FIRMS_KEY` | [firms.modaps.eosdis.nasa.gov/api](https://firms.modaps.eosdis.nasa.gov/api/) | Real wildfire hotspots |
| `AISHUB_KEY` | [aishub.net/register](https://aishub.net/register) | Real AIS ship positions |
| `ALPHA_VANTAGE_KEY` | [alphavantage.co/support](https://www.alphavantage.co/support/#api-key) | Live defense stock prices |
| `EXCHANGE_RATE_KEY` | [exchangerate-api.com](https://www.exchangerate-api.com) | Live FX rates |
| `OPENSKY_USER` + `OPENSKY_PASS` | [opensky-network.org](https://opensky-network.org) | Faster flight refresh (optional) |

Everything works without keys — falls back to simulation data.

---

## Run locally
```bash
npm install
npm start
# Open http://localhost:4000
```

---

## Globe layers
| Layer | Data source | Update rate |
|-------|------------|-------------|
| ✈️ Flights | OpenSky Network (live) | 12s |
| 🛰️ Satellites | CelesTrak TLE (live) | 3s |
| 🚢 Ships | AISHub / simulation | 30s |
| 🌦️ Weather | Open-Meteo (live, no key) | 10 min |
| 🚨 Disasters | GDACS (live, no key) | 10 min |
| 🔥 Wildfires | NASA FIRMS / static | 10 min |
| ⚡ Cyber | Threat intel simulation | 15s |
| ⚠️ Conflicts | Curated dataset | Live alerts |
| 📰 News | NewsAPI / GDELT | 5 min |
| 📈 Markets | Alpha Vantage / simulation | 60s |

## Textures
All textures in `client/assets/`:
- `earth_albedo.jpg` — NASA Blue Marble colour map
- `earth_bump.jpg` — elevation bump map
- `earth_land_ocean_mask.png` — ocean specular mask
- `earth_night_lights_modified.png` — city lights (dark side)
- `clouds_earth.png` — cloud layer alpha map

## Controls
- **Globe:** Drag to rotate · Scroll to zoom · Click any object
- **Satellites:** Hover → intel card · Click → full profile
- **Flights/Ships:** Hover → info · Click → pin card
- **Layer toggles:** Bottom of globe
