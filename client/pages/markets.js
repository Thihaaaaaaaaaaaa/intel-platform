// ═══════════════════════════════════════
// MARKETS PAGE — Commodities, Stocks, FX
// ═══════════════════════════════════════
(function() {
  function sparklineSvg(history, up) {
    if (!history || history.length < 2) return '<svg width="60" height="22"></svg>';
    const min = Math.min(...history), max = Math.max(...history);
    const range = max - min || 1;
    const pts = history.map((v, i) => {
      const x = (i / (history.length - 1)) * 58 + 1;
      const y = 21 - ((v - min) / range) * 19;
      return `${x},${y}`;
    }).join(' ');
    const col = up ? '#00ff88' : '#ff4466';
    return `<svg width="60" height="22" viewBox="0 0 60 22" style="overflow:visible">
      <polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.5" opacity="0.8"/>
      <circle cx="${pts.split(' ').pop().split(',')[0]}" cy="${pts.split(' ').pop().split(',')[1]}" r="2" fill="${col}"/>
    </svg>`;
  }

  function changeClass(v) { return v > 0.01 ? 'up' : v < -0.01 ? 'down' : 'flat'; }
  function sign(v) { return v >= 0 ? '+' : ''; }

  function renderCommodities() {
    const el = document.getElementById('mk-commodities-list');
    if (!el || !APP.markets.commodities) return;
    el.innerHTML = APP.markets.commodities.map(c => `
      <div class="mk-row">
        <div class="mk-symbol">${c.symbol}</div>
        <div class="mk-name">${c.name}</div>
        <div class="mk-sparkline">${sparklineSvg(c.history, c.change >= 0)}</div>
        <div class="mk-price">${c.price >= 100 ? c.price.toFixed(2) : c.price.toFixed(3)} <span style="font-size:8px;color:var(--td)">${c.unit}</span></div>
        <div class="mk-change ${changeClass(c.change)}">${sign(c.change)}${c.change.toFixed(2)}%</div>
      </div>
    `).join('');
  }

  function renderDefenseStocks() {
    const el = document.getElementById('mk-defense-list');
    if (!el || !APP.markets.defenseStocks) return;
    const countryFlags = {US:'🇺🇸', UK:'🇬🇧', France:'🇫🇷', EU:'🇪🇺', Germany:'🇩🇪', Italy:'🇮🇹', Norway:'🇳🇴'};
    el.innerHTML = APP.markets.defenseStocks.map(s => `
      <div class="mk-row">
        <div class="mk-symbol">${s.symbol}</div>
        <div class="mk-flag">${countryFlags[s.country] || '🏳'}</div>
        <div class="mk-name">${s.name}</div>
        <div class="mk-sparkline">${sparklineSvg(s.history, s.change >= 0)}</div>
        <div class="mk-price">${s.price >= 100 ? s.price.toFixed(2) : s.price.toFixed(2)}</div>
        <div class="mk-change ${changeClass(s.change)}">${sign(s.change)}${s.change.toFixed(2)}%</div>
      </div>
    `).join('');
  }

  function renderCurrencies() {
    const el = document.getElementById('mk-currencies-list');
    if (!el || !APP.markets.currencies) return;
    const contexts = {
      'USD/RUB': 'Sanctions pressure — elevated volatility',
      'USD/TRY': 'Hyperinflation driven — structural weakness',
      'USD/UAH': 'War economy — IMF supported',
      'USD/ILS': 'Conflict premium — defensive demand',
      'EUR/USD': 'NATO spending — euro divergence',
      'GBP/USD': 'Post-Brexit — UK defense',
      'USD/JPY': 'Yen weakness — defense import cost',
      'USD/CNY': 'Trade tensions — capital controls',
    };
    el.innerHTML = APP.markets.currencies.map(c => `
      <div class="mk-row" style="flex-direction:column;align-items:flex-start;gap:4px">
        <div style="display:flex;align-items:center;gap:10px;width:100%">
          <div class="mk-pair">${c.pair}</div>
          <div class="mk-sparkline">${sparklineSvg(c.history, c.change >= 0)}</div>
          <div class="mk-rate">${c.rate.toFixed(4)}</div>
          <div class="mk-change ${changeClass(c.change)}">${sign(c.change)}${c.change.toFixed(2)}%</div>
        </div>
        <div style="font-size:9px;color:var(--td);padding-left:4px">${contexts[c.pair] || ''}</div>
      </div>
    `).join('');
  }

  function renderImpact() {
    const el = document.getElementById('mk-impact-content');
    if (!el) return;

    // Calculate metrics from markets data
    const brent = APP.markets.commodities?.find(c => c.symbol === 'BRENT');
    const gold = APP.markets.commodities?.find(c => c.symbol === 'GOLD');
    const rhm = APP.markets.defenseStocks?.find(s => s.symbol === 'RHM');
    const rub = APP.markets.currencies?.find(c => c.pair === 'USD/RUB');

    el.innerHTML = `
      <div class="impact-section">
        <div class="impact-title">⬡ War Premium Analysis</div>
        <div class="impact-text">
          Current geopolitical risk is reflected across multiple asset classes.
          Defense sector outperforms broad market by 18–35% YTD driven by record NATO
          spending pledges. Energy prices remain elevated on Middle East risk premium
          and ongoing Red Sea shipping disruption.
        </div>
        <div class="impact-corr" style="margin-top:12px">
          <div class="label">War risk premium</div>
          <div class="bar"><div class="fill" style="width:72%;background:var(--crit)"></div></div>
          <div class="val">HIGH</div>
        </div>
        <div class="impact-corr">
          <div class="label">Defense demand surge</div>
          <div class="bar"><div class="fill" style="width:88%;background:var(--acc4)"></div></div>
          <div class="val">+88%</div>
        </div>
        <div class="impact-corr">
          <div class="label">Shipping disruption</div>
          <div class="bar"><div class="fill" style="width:60%;background:var(--med)"></div></div>
          <div class="val">+60%</div>
        </div>
      </div>

      <div class="impact-section">
        <div class="impact-title">⬡ Key Drivers</div>
        ${brent ? `<div class="impact-text" style="margin-bottom:6px">
          <strong style="color:var(--acc)">Brent Crude ${brent.price.toFixed(2)}</strong> — Houthi Red Sea attacks forcing
          30% of Asia-Europe trade to reroute, adding 12-14 days transit. OPEC+ maintaining production cuts.
        </div>` : ''}
        ${gold ? `<div class="impact-text" style="margin-bottom:6px">
          <strong style="color:var(--acc)">Gold $${gold.price.toFixed(0)}</strong> — Safe-haven demand elevated. Central banks
          (China, Russia, India, Turkey) continue record gold purchases as dollar hedge.
        </div>` : ''}
        ${rhm ? `<div class="impact-text" style="margin-bottom:6px">
          <strong style="color:var(--acc)">Rheinmetall €${rhm.price.toFixed(0)}</strong> — German defense giant benefits
          most from European rearmament. 3-year order backlog. Revenues up 36% YOY.
        </div>` : ''}
        ${rub ? `<div class="impact-text">
          <strong style="color:var(--acc)">USD/RUB ${rub.rate.toFixed(1)}</strong> — Ruble under sustained pressure from
          Western sanctions, frozen reserves, and oil payment restrictions.
        </div>` : ''}
      </div>

      <div class="impact-section">
        <div class="impact-title">⬡ Risk Scenarios</div>
        <div class="impact-text">
          <span style="color:var(--crit)">BEAR:</span> Iran nuclear escalation → Oil $120+ / Gold $3,000 / Defense +40%<br>
          <span style="color:var(--med)">BASE:</span> Prolonged Ukraine war → Oil $85 / Defense +20% / Euro weak<br>
          <span style="color:var(--green)">BULL:</span> Ceasefire / diplomacy → Oil -15% / Risk assets rally / USD softens
        </div>
      </div>
    `;
  }

  function renderAll() {
    renderCommodities();
    renderDefenseStocks();
    renderCurrencies();
    renderImpact();
  }

  window.initMarkets = function() { renderAll(); };
  window.addEventListener('marketsUpdate', () => {
    if (APP.currentPage === 'markets') renderAll();
  });
  window.addEventListener('pageChange', e => {
    if (e.detail.pageId === 'markets') renderAll();
  });
})();
