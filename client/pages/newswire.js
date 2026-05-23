// ═══════════════════════════════════════
// NEWSWIRE PAGE — News with Article Reader + Source Links
// ═══════════════════════════════════════
(function() {
  let activeCategory = 'all';
  let activeSource = null;
  let searchText = '';
  let selectedArticleId = null;

  function starsHtml(n) {
    return '★'.repeat(n) + '☆'.repeat(5-n);
  }

  function getFiltered() {
    let items = APP.news;
    if (activeCategory !== 'all') items = items.filter(a => a.category === activeCategory);
    if (activeSource) items = items.filter(a => a.source === activeSource);
    if (searchText) items = items.filter(a =>
      a.headline.toLowerCase().includes(searchText) ||
      (a.region||'').toLowerCase().includes(searchText) ||
      (a.tags||[]).some(t => t.toLowerCase().includes(searchText))
    );
    return items;
  }

  function renderFeed() {
    const el = document.getElementById('newswire-feed');
    if (!el) return;
    const items = getFiltered();
    document.getElementById('news-total').textContent = `${items.length}`;
    el.innerHTML = items.slice(0, 80).map(a => `
      <div class="nw-item${selectedArticleId === a.id ? ' selected' : ''}" onclick="selectArticle('${a.id}')">
        ${a.breaking ? '<div class="nw-breaking">● BREAKING</div>' : ''}
        <div class="nw-headline">${a.headline}</div>
        <div class="nw-meta">
          <span class="nw-source">${a.source}</span>
          <span class="nw-region">${a.region}</span>
          ${a.verified ? '<span class="nw-verified">✓</span>' : ''}
          <span class="nw-urgency ${a.urgency}">${(a.urgency||'').toUpperCase()}</span>
          <span class="nw-time">${formatTime(a.timestamp)}</span>
        </div>
      </div>
    `).join('');
  }

  function renderSourceList() {
    const el = document.getElementById('news-source-list');
    if (!el) return;
    el.innerHTML = APP.sources.map(s => `
      <div class="src-item${activeSource === s.name ? ' active' : ''}" onclick="filterBySource('${s.name.replace(/'/g,"\\'")}')">
        <span class="src-name">${s.name}</span>
        <span class="src-stars">${starsHtml(s.credibility)}</span>
        <span class="src-country">${s.country}</span>
      </div>
    `).join('');
  }

  window.filterBySource = function(name) {
    activeSource = (activeSource === name) ? null : name;
    renderSourceList();
    renderFeed();
  };

  window.selectArticle = function(id) {
    selectedArticleId = id;
    const a = APP.news.find(x => x.id === id);
    if (!a) return;
    // Update selection in feed
    document.querySelectorAll('.nw-item').forEach(el => {
      el.classList.toggle('selected', el.onclick?.toString().includes(id));
    });
    renderArticle(a);
    document.getElementById('article-reader-status').textContent = a.source.toUpperCase();
  };

  // Expose so globe page news can link to reader
  window.openArticleReader = function(id) {
    switchPage('newswire');
    setTimeout(() => selectArticle(id), 100);
  };

  function renderArticle(a) {
    const el = document.getElementById('article-reader');
    if (!el) return;

    const credStars = starsHtml(a.credibility || 0);
    const biasClass = (a.bias || 'center').replace(/\s/g, '-').toLowerCase();
    const bodyParas = (a.body || 'No content available.').split('\n\n').filter(Boolean);

    el.innerHTML = `
      <div class="ar-header fade-in">
        <div class="ar-headline">${a.headline}</div>

        <div class="ar-source-card">
          <div class="ar-source-name">${a.source}</div>
          <a class="ar-source-link" href="${a.sourceUrl}" target="_blank" rel="noopener noreferrer">
            ⬡ ${a.sourceUrl} ↗
          </a>
          <div class="ar-source-detail">
            <div class="piece">Country: <strong>${a.sourceCountry || 'N/A'}</strong></div>
            <div class="piece">Credibility: <strong style="color:var(--acc4)">${credStars}</strong></div>
            <div class="piece">Bias: <span class="bias-badge ${biasClass}">${a.bias || 'N/A'}</span></div>
          </div>
        </div>

        <div class="ar-meta-grid">
          <div class="ar-meta-box">
            <div class="label">Region</div>
            <div class="value">${a.region}</div>
          </div>
          <div class="ar-meta-box">
            <div class="label">Category</div>
            <div class="value">${a.category?.toUpperCase() || 'N/A'}</div>
          </div>
          <div class="ar-meta-box">
            <div class="label">Published</div>
            <div class="value" style="font-family:'Share Tech Mono',monospace;font-size:10px">${formatTime(a.timestamp)}</div>
          </div>
          <div class="ar-meta-box">
            <div class="label">Read Time</div>
            <div class="value">${a.readTime || 2} min</div>
          </div>
        </div>

        <div style="display:flex;gap:8px;align-items:center">
          ${a.breaking ? '<span class="nw-breaking" style="margin:0">● BREAKING</span>' : ''}
          <span class="nw-urgency ${a.urgency}">${(a.urgency||'').toUpperCase()}</span>
          ${a.verified ? '<span style="color:var(--green);font-size:10px;letter-spacing:1px">✓ VERIFIED</span>' : '<span style="color:var(--td);font-size:10px">UNVERIFIED</span>'}
        </div>
      </div>

      <div class="ar-body">
        ${bodyParas.map(p => `<p>${p}</p>`).join('')}
      </div>

      ${a.tags && a.tags.length ? `
        <div class="ar-tags">
          ${a.tags.map(t => `<span class="ar-tag">${t}</span>`).join('')}
        </div>` : ''}
    `;
  }

  window.initNewswire = function() {
    renderFeed();
    renderSourceList();

    // Search
    document.getElementById('news-search').addEventListener('input', e => {
      searchText = e.target.value.toLowerCase();
      renderFeed();
    });

    // Category buttons
    document.querySelectorAll('.nw-cat').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.nw-cat').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        activeCategory = btn.dataset.cat;
        renderFeed();
      });
    });
  };

  // Live feed update
  window.addEventListener('newsUpdate', e => {
    if (APP.currentPage === 'newswire') renderFeed();
  });
  window.addEventListener('pageChange', e => {
    if (e.detail.pageId === 'newswire') {
      renderFeed();
      renderSourceList();
    }
  });
})();
