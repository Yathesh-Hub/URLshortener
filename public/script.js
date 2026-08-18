document.addEventListener('DOMContentLoaded', () => {
  // DOM refs
  const shortenForm    = document.getElementById('shortenForm');
  const longUrlInput   = document.getElementById('longUrlInput');
  const submitBtn      = document.getElementById('submitBtn');
  const btnText        = document.getElementById('btnText');
  const btnSpinner     = document.getElementById('btnSpinner');
  const btnIcon        = document.getElementById('btnIcon');

  const resultCard     = document.getElementById('resultCard');
  const existingBadge  = document.getElementById('existingBadge');
  const newBadge       = document.getElementById('newBadge');
  const clicksDisplay  = document.getElementById('clicksDisplay');
  const longUrlDisplay = document.getElementById('longUrlDisplay');
  const shortUrlAnchor = document.getElementById('shortUrlAnchor');

  const copyBtn        = document.getElementById('copyBtn');
  const copyBtnText    = document.getElementById('copyBtnText');
  const copyIcon       = document.getElementById('copyIcon');
  const qrBtn          = document.getElementById('qrBtn');
  const qrContainer    = document.getElementById('qrContainer');
  const qrImage        = document.getElementById('qrImage');

  const historyEmpty   = document.getElementById('historyEmpty');
  const historyList    = document.getElementById('historyList');
  const clearHistoryBtn= document.getElementById('clearHistoryBtn');
  const toastContainer = document.getElementById('toastContainer');

  const statsBar       = document.getElementById('statsBar');
  const statTotal      = document.getElementById('statTotal');
  const statClicks     = document.getElementById('statClicks');
  const statLatest     = document.getElementById('statLatest');

  let currentShortUrl = '';

  loadHistory();

  // ── Form submit ──
  shortenForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const rawUrl = longUrlInput.value.trim();
    if (!rawUrl) { showToast('Please enter a URL', 'error'); return; }

    setLoading(true);
    try {
      const res  = await fetch('/shorten', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ longUrl: rawUrl })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to shorten URL');

      displayResult(data);
      saveToHistory(data);
      showToast(data.isExisting ? 'Found existing short link!' : 'Short link created!', 'success');
    } catch (err) {
      showToast(err.message || 'Unexpected error', 'error');
    } finally {
      setLoading(false);
    }
  });

  // ── Display result ──
  function displayResult(data) {
    currentShortUrl = data.shortUrl;
    longUrlDisplay.textContent  = data.longUrl;
    shortUrlAnchor.href         = data.shortUrl;
    shortUrlAnchor.textContent  = data.shortUrl;
    clicksDisplay.textContent   = `${data.clicks || 0} Clicks`;

    existingBadge.classList.toggle('hidden', !data.isExisting);
    newBadge.classList.toggle('hidden', !!data.isExisting);

    // Generate QR code using QRServer API
    // This is a free public API that generates QR codes on-demand
    qrImage.src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data.shortUrl)}&format=png&margin=10&color=000000&bgcolor=ffffff`;
    qrContainer.classList.add('hidden');
    resetCopyBtn();
    resultCard.classList.remove('hidden');
    resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  // ── Copy ──
  copyBtn.addEventListener('click', () => { if (currentShortUrl) copyToClipboard(currentShortUrl); });

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
      copyBtn.classList.add('copied');
      copyBtnText.textContent = 'Copied!';
      copyIcon.innerHTML = '<polyline points="20 6 9 17 4 12"></polyline>';
      showToast('Copied to clipboard!', 'success');
      setTimeout(resetCopyBtn, 2500);
    }).catch(() => showToast('Could not copy automatically', 'error'));
  }

  function resetCopyBtn() {
    copyBtn.classList.remove('copied');
    copyBtnText.textContent = 'Copy';
    copyIcon.innerHTML = `
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>`;
  }

  // ── QR toggle ──
  qrBtn.addEventListener('click', () => qrContainer.classList.toggle('hidden'));

  // ── Loading state ──
  function setLoading(on) {
    submitBtn.disabled = on;
    btnText.textContent = on ? 'Shortening…' : 'Shorten';
    btnSpinner.classList.toggle('hidden', !on);
    btnIcon.classList.toggle('hidden', on);
  }

  // ── Toast ──
  function showToast(message, type = 'info') {
    const icons = { success: '✓', error: '✕', info: 'i' };
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `<span class="toast-icon">${icons[type] || 'i'}</span><span>${message}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(12px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }

  // ── History helpers ──
  function getHistory() {
    try { return JSON.parse(localStorage.getItem('snaplink_history') || '[]'); }
    catch { return []; }
  }

  function saveToHistory(item) {
    let h = getHistory().filter(x => x.shortCode !== item.shortCode);
    h.unshift({ shortCode: item.shortCode, shortUrl: item.shortUrl, longUrl: item.longUrl, createdAt: item.createdAt || new Date().toISOString() });
    localStorage.setItem('snaplink_history', JSON.stringify(h.slice(0, 15)));
    renderHistory();
  }

  function loadHistory() { renderHistory(); }

  function renderHistory() {
    const history = getHistory();
    historyList.innerHTML = '';

    if (history.length === 0) {
      historyEmpty.classList.remove('hidden');
      clearHistoryBtn.classList.add('hidden');
      statsBar.style.display = 'none';
      return;
    }

    historyEmpty.classList.add('hidden');
    clearHistoryBtn.classList.remove('hidden');
    updateStats(history);

    history.forEach((item, index) => {
      const date = new Date(item.createdAt);
      const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
      const el = document.createElement('div');
      el.className = 'history-item flex-between';
      el.innerHTML = `
        <div class="history-urls">
          <a href="${item.shortUrl}" target="_blank" class="history-short">${item.shortUrl}</a>
          <div class="history-long">${item.longUrl}</div>
          <div class="history-meta">${dateStr}</div>
        </div>
        <div class="history-actions flex-center">
          <button class="secondary-btn icon-only copy-hist-btn" data-url="${item.shortUrl}" title="Copy">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
          </button>
          <button class="text-btn delete-hist-btn" data-index="${index}" title="Remove">✕</button>
        </div>`;
      historyList.appendChild(el);
    });

    document.querySelectorAll('.copy-hist-btn').forEach(btn =>
      btn.addEventListener('click', e => copyToClipboard(e.currentTarget.dataset.url))
    );
    document.querySelectorAll('.delete-hist-btn').forEach(btn =>
      btn.addEventListener('click', e => deleteHistoryItem(parseInt(e.currentTarget.dataset.index, 10)))
    );
  }

  function updateStats(history) {
    statsBar.style.display = 'flex';
    statTotal.textContent  = history.length;
    // clicks count not stored locally — show dashes unless available
    statClicks.textContent = '—';
    const latest = history[0]?.createdAt
      ? new Date(history[0].createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      : '—';
    statLatest.textContent = latest;
  }

  function deleteHistoryItem(index) {
    const h = getHistory();
    h.splice(index, 1);
    localStorage.setItem('snaplink_history', JSON.stringify(h));
    renderHistory();
    showToast('Removed from history', 'info');
  }

  clearHistoryBtn.addEventListener('click', () => {
    localStorage.removeItem('snaplink_history');
    renderHistory();
    showToast('History cleared', 'info');
  });
});
