// ═══════════════════════════════════════
// CONFLICTS PAGE
// ═══════════════════════════════════════
(function() {
  function renderList() {
    const el = document.getElementById('conflicts-list');
    if (!el) return;
    document.getElementById('c-count').textContent = `${APP.conflicts.length} ZONES`;
    el.innerHTML = APP.conflicts.map(c => `
      <div class="conflict-entry" id="ce-${c.id}" onclick="selectConflict('${c.id}')">
        <div class="ce-name">
          <span class="pulse-dot ${c.severity === 'critical' ? 'crit' : 'high'}" style="margin-right:5px"></span>
          ${c.name}
        </div>
        <div class="ce-loc">${c.country} · ${c.region}</div>
        <div class="ce-row">
          <span class="sev-badge ${c.severity}">${c.severity.toUpperCase()}</span>
          <span class="ce-cas">${c.casualtiesTotal}</span>
        </div>
      </div>
    `).join('');
  }

  window.selectConflict = function(id) {
    document.querySelectorAll('.conflict-entry').forEach(e => e.classList.remove('selected'));
    const el = document.getElementById(`ce-${id}`);
    if (el) el.classList.add('selected');
    APP.selectedConflict = id;
    const c = APP.conflicts.find(x => x.id === id);
    if (!c) return;
    renderDetail(c);
  };

  function renderDetail(c) {
    const el = document.getElementById('conflict-detail-content');
    if (!el) return;

    const recentAlerts = APP.alerts.filter(a => a.conflictId === c.id).slice(0, 5);
    const alertHtml = recentAlerts.length ? `
      <div class="cd-section">
        <div class="cd-section-title">⬡ Recent Alerts</div>
        ${recentAlerts.map(a => `
          <div style="padding:8px 10px;border:1px solid var(--bdr);margin-bottom:6px;background:rgba(255,34,68,.03)">
            <div style="display:flex;justify-content:space-between;margin-bottom:4px">
              <span class="sev-badge ${a.severity}">${a.severity.toUpperCase()}</span>
              <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--td)">${formatTime(a.timestamp)}</span>
            </div>
            <div style="font-size:11px;color:var(--ts)">${a.description}</div>
            <div style="font-size:9px;color:var(--td);margin-top:3px">${a.location} · ${a.source} ${a.verified ? '✓' : ''}</div>
          </div>
        `).join('')}
      </div>` : '';

    el.innerHTML = `
      <div class="cd-header fade-in">
        <div class="cd-name">${c.name}</div>
        <div class="cd-badges">
          <span class="sev-badge ${c.severity}">${c.severity.toUpperCase()}</span>
          <span class="sev-badge low">${(c.type||'').replace(/_/g,' ').toUpperCase()}</span>
          <span class="sev-badge medium">${c.status.toUpperCase()}</span>
          <span style="font-family:'Share Tech Mono',monospace;font-size:9px;color:var(--td)">Since ${c.startDate || 'Unknown'}</span>
        </div>
        <div class="cd-desc">${c.description || ''}</div>
      </div>

      <div class="cd-section">
        <div class="cd-section-title">⬡ Casualties & Displacement</div>
        <div class="cd-stats">
          <div class="cd-stat"><div class="v">${c.casualtiesTotal}</div><div class="l">Total Casualties</div></div>
          <div class="cd-stat"><div class="v">${c.casualtiesMil}</div><div class="l">Military</div></div>
          <div class="cd-stat"><div class="v">${c.casualtiesCiv}</div><div class="l">Civilian</div></div>
          <div class="cd-stat"><div class="v">${c.displaced}</div><div class="l">Displaced</div></div>
        </div>
        <div class="cd-stats">
          <div class="cd-stat"><div class="v" style="color:var(--med)">${c.refugees}</div><div class="l">Refugees</div></div>
        </div>
      </div>

      <div class="cd-section">
        <div class="cd-section-title">⬡ Forces</div>
        <div class="force-grid">
          ${(c.forces||[]).map(f => `
            <div class="force-card">
              <div class="force-side">${f.side}</div>
              <div class="force-row">Personnel <span>${f.personnel}</span></div>
              <div class="force-row">Tanks <span>${f.tanks}</span></div>
              <div class="force-row">Aircraft <span>${f.aircraft}</span></div>
              <div class="force-backers">Backers: ${f.mainBackers}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="cd-section">
        <div class="cd-section-title">⬡ Timeline</div>
        <div class="timeline">
          ${(c.timeline||[]).slice().reverse().map(t => `
            <div class="tl-item">
              <div class="tl-date">${t.date}</div>
              <div class="tl-event">${t.event}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="cd-section">
        <div class="cd-section-title">⬡ Active Fronts</div>
        <div class="front-tags">
          ${(c.fronts||[]).map(f => `<span class="front-tag">⬡ ${f}</span>`).join('')}
        </div>
      </div>

      ${c.economicImpact ? `
      <div class="cd-section">
        <div class="cd-section-title">⬡ Economic Impact</div>
        <p style="font-size:12px;color:var(--ts);line-height:1.7">${c.economicImpact}</p>
      </div>` : ''}

      ${alertHtml}
    `;
  }

  window.initConflicts = function() {
    renderList();
    // Auto-select first
    if (APP.conflicts.length) selectConflict(APP.conflicts[0].id);
  };

  window.addEventListener('alertUpdate', e => {
    if (APP.currentPage === 'conflicts' && APP.selectedConflict) {
      selectConflict(APP.selectedConflict);
    }
  });
  window.addEventListener('pageChange', e => {
    if (e.detail.pageId === 'conflicts') {
      renderList();
      if (APP.selectedConflict) selectConflict(APP.selectedConflict);
      else if (APP.conflicts.length) selectConflict(APP.conflicts[0].id);
    }
  });
})();
