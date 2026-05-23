// ═══════════════════════════════════════
// ATLAS PAGE — Country Intelligence Profiles
// ═══════════════════════════════════════
(function() {
  let filterRegion = 'all';
  let filterText = '';

  function pressClass(p) {
    if (!p) return '';
    if (p === 'Free') return 'free';
    if (p === 'Partly Free') return 'partly';
    return 'not';
  }

  function renderList() {
    const el = document.getElementById('atlas-list');
    if (!el) return;
    let items = APP.countries;
    if (filterRegion !== 'all') items = items.filter(c => c.region && c.region.includes(filterRegion));
    if (filterText) items = items.filter(c => c.name.toLowerCase().includes(filterText));
    document.getElementById('atlas-count').textContent = `${items.length} ENTRIES`;
    el.innerHTML = items.map(c => `
      <div class="atlas-entry" data-name="${c.name}" onclick="selectCountry('${c.name}')">
        <div class="flag-big">${c.flag || '🏳'}</div>
        <div class="info">
          <div class="name">${c.name}</div>
          <div class="sub">${c.capital || ''} · ${c.region || ''} · Pop: ${fmtPop(c.pop || 0)}</div>
          <div class="mil">GDP: ${fmtGDP(c.gdp || 0)} · Mil: $${c.milSpend || 0}B</div>
        </div>
        ${c.nukes > 0 ? '<span style="color:var(--crit);font-size:14px" title="Nuclear State">☢</span>' : ''}
      </div>
    `).join('');
  }

  window.selectCountry = function(name) {
    document.querySelectorAll('.atlas-entry').forEach(e => e.classList.toggle('selected', e.dataset.name === name));
    APP.selectedCountry = name;
    const c = APP.countries.find(x => x.name === name);
    if (!c) return;
    renderDetail(c);
  };

  function renderDetail(c) {
    const el = document.getElementById('atlas-detail-content');
    if (!el) return;

    const nukeRow = c.nukes > 0 ? `
      <div class="ad-section">
        <div class="ad-section-title">☢ Nuclear Status</div>
        <div class="ad-grid">
          <div class="ad-stat red"><div class="v">${c.nukes || 0}</div><div class="l">Total Warheads</div></div>
          <div class="ad-stat red"><div class="v">${c.nukesActive || 0}</div><div class="l">Deployed</div></div>
          <div class="ad-stat"><div class="v">${c.nukesReserve || 0}</div><div class="l">Reserve</div></div>
        </div>
        ${c.nukeNote ? `<div style="margin-top:8px;font-size:10px;color:var(--td)">${c.nukeNote}</div>` : ''}
      </div>` : (c.nukeNote ? `
      <div class="ad-section">
        <div class="ad-section-title">☢ Nuclear Status</div>
        <div style="font-size:10px;color:var(--td);padding:4px 0">${c.nukeNote}</div>
      </div>` : '');

    el.innerHTML = `
      <div class="ad-header fade-in">
        <div class="ad-flag">${c.flag || '🏳'}</div>
        <div class="ad-name">${c.name}</div>
        <div class="ad-sub">${c.capital || ''} · ${c.govType || ''}</div>
        <div style="margin-top:10px;font-size:12px;color:var(--ts)">
          Leader: <strong style="color:var(--tp)">${c.leader || 'N/A'}</strong> (since ${c.leaderSince || 'N/A'}) ·
          Press: <span class="press-badge ${pressClass(c.intlPress)}">${c.intlPress || 'N/A'}</span>
        </div>
      </div>

      <div class="ad-section">
        <div class="ad-section-title">⬡ Economy</div>
        <div class="ad-grid">
          <div class="ad-stat"><div class="v">${fmtGDP(c.gdp || 0)}</div><div class="l">GDP Total</div></div>
          <div class="ad-stat"><div class="v">$${(c.gdpPerCap || 0).toLocaleString()}</div><div class="l">GDP per Capita</div></div>
          <div class="ad-stat ${c.gdpGrowth >= 0 ? 'green' : 'red'}"><div class="v">${c.gdpGrowth >= 0 ? '+' : ''}${c.gdpGrowth || 0}%</div><div class="l">GDP Growth</div></div>
          <div class="ad-stat ${c.inflation > 10 ? 'red' : c.inflation > 5 ? 'orange' : ''}"><div class="v">${c.inflation || 0}%</div><div class="l">Inflation</div></div>
          <div class="ad-stat ${c.unemployment > 10 ? 'red' : ''}"><div class="v">${c.unemployment || 0}%</div><div class="l">Unemployment</div></div>
          <div class="ad-stat ${c.debtToGdp > 100 ? 'red' : c.debtToGdp > 60 ? 'orange' : ''}"><div class="v">${c.debtToGdp || 0}%</div><div class="l">Debt/GDP</div></div>
        </div>
        <div class="ad-grid2" style="margin-top:10px">
          <div class="ad-stat"><div class="v">$${(c.exports || 0)}B</div><div class="l">Exports</div></div>
          <div class="ad-stat"><div class="v">$${(c.imports || 0)}B</div><div class="l">Imports</div></div>
          <div class="ad-stat"><div class="v">$${(c.fxReserves || 0)}B</div><div class="l">FX Reserves</div></div>
          <div class="ad-stat"><div class="v">${c.gini || 'N/A'}</div><div class="l">Gini Index</div></div>
        </div>
      </div>

      <div class="ad-section">
        <div class="ad-section-title">⬡ Population & Society</div>
        <div class="ad-grid">
          <div class="ad-stat"><div class="v">${fmtPop(c.pop || 0)}</div><div class="l">Population</div></div>
          <div class="ad-stat ${c.popGrowth < 0 ? 'red' : 'green'}"><div class="v">${c.popGrowth >= 0 ? '+' : ''}${c.popGrowth || 0}%</div><div class="l">Pop Growth</div></div>
          <div class="ad-stat"><div class="v">${c.lifeExp || 'N/A'}</div><div class="l">Life Expectancy</div></div>
          <div class="ad-stat"><div class="v">${c.hdi || 'N/A'}</div><div class="l">HDI Score</div></div>
          <div class="ad-stat"><div class="v">${(c.area || 0).toLocaleString()}M km²</div><div class="l">Area</div></div>
          <div class="ad-stat"><div class="v">${c.govType ? c.govType.split(' ')[0] : 'N/A'}</div><div class="l">Gov Type</div></div>
        </div>
      </div>

      <div class="ad-section">
        <div class="ad-section-title">⬡ Military</div>
        <div class="ad-grid">
          <div class="ad-stat"><div class="v">$${c.milSpend || 0}B</div><div class="l">Defense Budget</div></div>
          <div class="ad-stat"><div class="v">#${c.milRank || 'N/A'}</div><div class="l">Global Rank</div></div>
          <div class="ad-stat"><div class="v">${c.defenseShare || 0}%</div><div class="l">% of GDP</div></div>
          <div class="ad-stat"><div class="v">${(c.milPersonnel || 0).toLocaleString()}K</div><div class="l">Active Personnel</div></div>
          <div class="ad-stat"><div class="v">${(c.milReserve || 0).toLocaleString()}K</div><div class="l">Reserve</div></div>
          <div class="ad-stat"><div class="v">${(c.milTanks || 0).toLocaleString()}</div><div class="l">Main Battle Tanks</div></div>
          <div class="ad-stat"><div class="v">${(c.milAircraft || 0).toLocaleString()}</div><div class="l">Aircraft</div></div>
          <div class="ad-stat"><div class="v">${(c.milShips || 0).toLocaleString()}</div><div class="l">Naval Vessels</div></div>
          <div class="ad-stat ${c.oilProd > 0 ? 'green' : ''}"><div class="v">${c.oilProd || 0}M bpd</div><div class="l">Oil Production</div></div>
        </div>
      </div>

      ${nukeRow}

      <div class="ad-section">
        <div class="ad-section-title">⬡ Alliances & Threats</div>
        <div style="margin-bottom:10px">
          <div style="font-size:9px;letter-spacing:1.5px;color:var(--td);text-transform:uppercase;margin-bottom:6px">ALLIES / PARTNERSHIPS</div>
          <div class="ad-pills">${(c.allies || []).map(a => `<span class="ad-pill ally">${a}</span>`).join('')}</div>
        </div>
        <div>
          <div style="font-size:9px;letter-spacing:1.5px;color:var(--td);text-transform:uppercase;margin-bottom:6px">THREAT PERCEPTIONS</div>
          <div class="ad-pills">${(c.threats || []).map(t => `<span class="ad-pill threat">${t}</span>`).join('')}</div>
        </div>
      </div>
    `;
  }

  window.initAtlas = function() {
    renderList();
    document.getElementById('atlas-search').addEventListener('input', e => {
      filterText = e.target.value.toLowerCase();
      renderList();
    });
    document.querySelectorAll('.atlas-filter').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.atlas-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterRegion = btn.dataset.region;
        renderList();
      });
    });
  };

  window.addEventListener('pageChange', e => {
    if (e.detail.pageId === 'atlas') renderList();
  });
})();
