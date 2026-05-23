// ═══════════════════════════════════════
// APP BOOT — load all data, init pages, connect WS
// ═══════════════════════════════════════
(async function boot() {
  await Promise.all([
    loadConflicts(), loadCountries(),  loadFlights(),
    loadNews(),      loadSources(),    loadMarkets(),
    loadSatellites(),loadShips(),      loadWildfires(),
    loadWeather(),
  ]);

  document.getElementById('sb-conflicts').textContent = APP.conflicts.length;
  document.getElementById('sb-flights').textContent   = APP.flights.length;
  document.getElementById('sb-articles').textContent  = APP.news.length;

  if (typeof initGlobe     === 'function') initGlobe();
  if (typeof initAtlas     === 'function') initAtlas();
  if (typeof initMilitary  === 'function') initMilitary();
  if (typeof initConflicts === 'function') initConflicts();
  if (typeof initNewswire  === 'function') initNewswire();
  if (typeof initMarkets   === 'function') initMarkets();

  setupWS();
  setTimeout(() => { if (!APP.isLive) startDemoMode?.(); }, 3000);
})();
