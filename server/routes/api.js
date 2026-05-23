import { Router } from 'express';
import { COUNTRIES, COUNTRY_LIST, topByMetric, getCountry } from '../data/countries.js';
import { CONFLICTS, getConflictById, generateAlert } from '../data/conflicts.js';
import { getArticles, getArticleById, getSources } from '../data/news.js';
import { getFlights, getFlightById } from '../data/flights.js';
import { getMarkets } from '../data/markets.js';
import { SATELLITES } from '../data/satellites.js';
import { getShips } from '../data/ships.js';
import { getCyberAttacks, generateCyberAttack } from '../data/cyber.js';

const router = Router();

router.get('/health', (req, res) => res.json({ status:'operational', uptime:process.uptime(), timestamp:new Date().toISOString() }));

// Countries
router.get('/countries',           (req, res) => res.json({ success:true, countries:COUNTRY_LIST }));
router.get('/countries/top/:metric',(req, res) => res.json({ success:true, top:topByMetric(req.params.metric, parseInt(req.query.n)||15) }));
router.get('/countries/:name',     (req, res) => { const c=getCountry(decodeURIComponent(req.params.name)); if(!c) return res.status(404).json({error:'Not found'}); res.json({success:true,country:{name:decodeURIComponent(req.params.name),...c}}); });

// Conflicts
router.get('/conflicts',           (req, res) => res.json({ success:true, conflicts:CONFLICTS }));
router.get('/conflicts/:id',       (req, res) => { const c=getConflictById(req.params.id); if(!c) return res.status(404).json({error:'Not found'}); res.json({success:true,conflict:c}); });

// News
router.get('/news',                (req, res) => res.json({ success:true, articles:getArticles(parseInt(req.query.limit)||30, req.query.category||null, req.query.region||null) }));
router.get('/news/sources',        (req, res) => res.json({ success:true, sources:getSources() }));
router.get('/news/:id',            (req, res) => { const a=getArticleById(req.params.id); if(!a) return res.status(404).json({error:'Not found'}); res.json({success:true,article:a}); });

// Flights
router.get('/flights',             (req, res) => res.json({ success:true, flights:getFlights() }));
router.get('/flights/:id',         (req, res) => { const f=getFlightById(req.params.id); if(!f) return res.status(404).json({error:'Not found'}); res.json({success:true,flight:f}); });

// Markets
router.get('/markets',             (req, res) => res.json({ success:true, markets:getMarkets() }));

// NEW: Satellites
router.get('/satellites',          (req, res) => res.json({ success:true, satellites:SATELLITES, count:SATELLITES.length }));

// NEW: Ships
router.get('/ships',               (req, res) => res.json({ success:true, ships:getShips() }));

// NEW: Cyber
router.get('/cyber',               (req, res) => res.json({ success:true, attacks:getCyberAttacks() }));

export default router;
