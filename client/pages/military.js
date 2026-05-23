// ═══════════════════════════════════════
// MILITARY PAGE
// ═══════════════════════════════════════
(function() {
  function render() {
    if (!APP.countries.length) return;
    renderOverview();
    renderRankings();
    renderPersonnel();
    renderNuclear();
  }

  function renderOverview() {
    const el = document.getElementById('mil-summary');
    if (!el) return;
    const total = APP.countries.reduce((s,c) => s + (c.milSpend||0), 0);
    const totalPersonnel = APP.countries.reduce((s,c) => s + (c.milPersonnel||0), 0);
    const totalNukes = APP.countries.reduce((s,c) => s + (c.nukes||0), 0);
    const nuclearStates = APP.countries.filter(c => c.nukes > 0).length;
    const top = [...APP.countries].sort((a,b) => (b.milSpend||0) - (a.milSpend||0))[0];
    const maxSpend = top ? top.milSpend : 1;
    const us = APP.countries.find(c => c.name === 'United States');
    const usShare = us ? ((us.milSpend||0)/total*100).toFixed(1) : '0';

    el.innerHTML = `
      <div class="stat-card">
        <div class="v">$${(total/1000).toFixed(2)}T</div>
        <div class="l">Global Defense Spend</div>
      </div>
      <div class="stat-card">
        <div class="v">${(totalPersonnel/1000).toFixed(1)}M</div>
        <div class="l">Total Active Personnel</div>
      </div>
      <div class="stat-card crit">
        <div class="v">${totalNukes.toLocaleString()}</div>
        <div class="l">Nuclear Warheads</div>
      </div>
      <div class="stat-card">
        <div class="v">${nuclearStates}</div>
        <div class="l">Nuclear States</div>
      </div>
      <div class="stat-card">
        <div class="v">${usShare}%</div>
        <div class="l">US Share of Global</div>
      </div>
      <div class="stat-card">
        <div class="v">${APP.countries.length}</div>
        <div class="l">Nations Tracked</div>
      </div>
    `;
  }

  function renderRankings() {
    const el = document.getElementById('mil-rank-list');
    if (!el) return;
    const sorted = [...APP.countries].sort((a,b) => (b.milSpend||0) - (a.milSpend||0)).slice(0, 20);
    const max = sorted[0]?.milSpend || 1;
    el.innerHTML = sorted.map((c, i) => `
      <div class="mil-rank-row">
        <div class="mil-rank-num">${i+1}</div>
        <div class="mil-rank-flag">${c.flag||'🏳'}</div>
        <div class="mil-rank-name">${c.name}</div>
        <div class="mil-bar-wrap">
          <div class="mil-bar">
            <div class="mil-bar-fill" style="width:${Math.max(2,(c.milSpend||0)/max*100)}%"></div>
          </div>
        </div>
        <div class="mil-rank-val">$${c.milSpend||0}B</div>
      </div>
    `).join('');
  }

  function renderPersonnel() {
    const el = document.getElementById('mil-personnel-list');
    if (!el) return;
    const sorted = [...APP.countries].sort((a,b) => (b.milPersonnel||0) - (a.milPersonnel||0)).slice(0, 20);
    const max = sorted[0]?.milPersonnel || 1;
    el.innerHTML = sorted.map((c, i) => `
      <div class="mil-rank-row">
        <div class="mil-rank-num">${i+1}</div>
        <div class="mil-rank-flag">${c.flag||'🏳'}</div>
        <div class="mil-rank-name">${c.name}</div>
        <div class="mil-bar-wrap">
          <div class="mil-bar">
            <div class="mil-bar-fill" style="width:${Math.max(2,(c.milPersonnel||0)/max*100)}%;background:linear-gradient(90deg,var(--acc3),var(--acc))"></div>
          </div>
        </div>
        <div class="mil-rank-val">${(c.milPersonnel||0).toLocaleString()}K</div>
      </div>
    `).join('');
  }

  function renderNuclear() {
    const el = document.getElementById('mil-nuclear-list');
    if (!el) return;
    const nukes = [...APP.countries].filter(c => c.nukes > 0).sort((a,b) => (b.nukes||0) - (a.nukes||0));
    const max = nukes[0]?.nukes || 1;
    el.innerHTML = nukes.map((c, i) => `
      <div class="nuke-row">
        <div class="nuke-flag">${c.flag||'🏳'}</div>
        <div class="nuke-name">${c.name}</div>
        <div class="nuke-bar-wrap">
          <div class="nuke-bar">
            <div class="nuke-bar-fill" style="width:${Math.max(2,(c.nukes||0)/max*100)}%"></div>
          </div>
        </div>
        <div class="nuke-val">☢ ${c.nukes}</div>
      </div>
    `).join('');
  }

  window.initMilitary = function() { render(); };
  window.addEventListener('pageChange', e => { if (e.detail.pageId === 'military') render(); });
})();
