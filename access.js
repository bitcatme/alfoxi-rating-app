(function () {
  const GUEST_LIMIT = 1;
  const MEMBER_LIMIT = 5;
  const CHEESE = '<svg class="cheese-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M2 17 L22 9 V17 Z" fill="#f7c331" stroke="#a87a00" stroke-width="1"/><path d="M2 17 L22 9 L22 6 L2 13 Z" fill="#fbd95c" stroke="#a87a00" stroke-width="1"/><circle cx="9" cy="15" r="1.2" fill="#a87a00"/><circle cx="15" cy="13.5" r="1" fill="#a87a00"/><circle cx="18.5" cy="15.5" r="0.8" fill="#a87a00"/></svg>';
  const ICON = 'https://raw.githubusercontent.com/spothq/cryptocurrency-icons/master/128/color/';

  const CRYPTO_DATA = [
    { name: 'Bitcoin', symbol: 'BTC', score: 95, votes: 8450 },
    { name: 'Ethereum', symbol: 'ETH', score: 92, votes: 7230 },
    { name: 'Tether', symbol: 'USDT', score: 78, votes: 5120 },
    { name: 'BNB', symbol: 'BNB', score: 88, votes: 6890 },
    { name: 'XRP', symbol: 'XRP', score: 85, votes: 6120 },
    { name: 'USDC', symbol: 'USDC', score: 82, votes: 5780 },
    { name: 'Solana', symbol: 'SOL', score: 89, votes: 7100 },
    { name: 'TRON', symbol: 'TRX', score: 81, votes: 5450 },
    { name: 'Zcash', symbol: 'ZEC', score: 76, votes: 4890 },
    { name: 'Hyperliquid', symbol: 'HYPE', score: 84, votes: 5670 },
    { name: 'Dogecoin', symbol: 'DOGE', score: 80, votes: 5340 },
    { name: 'Monero', symbol: 'XMR', score: 79, votes: 5010 }
  ].map(function (c) { c.icon = ICON + c.symbol.toLowerCase() + '.png'; return c; });

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  }

  const getUser = () => { const u = read('crypratUser', null); return u && u.name ? u : null; };
  const getLimit = () => (getUser() ? MEMBER_LIMIT : GUEST_LIMIT);
  const getUsed = () => { const n = Number(read('crypratRatingsUsed', 0)); return Number.isFinite(n) && n > 0 ? n : 0; };
  const getRemaining = () => Math.max(0, getLimit() - getUsed());
  const getOverrides = () => read('crypratVotes', {});

  function cheeseHTML(total, remaining) {
    let html = '';
    for (let i = 0; i < total; i++) {
      html += '<span class="cheese' + (i < remaining ? '' : ' used') + '">' + CHEESE + '</span>';
    }
    return html;
  }

  function message(text) {
    const el = document.getElementById('voteMessage');
    if (el) el.textContent = text;
  }

  /* ---------- LIVE GRAPHS ---------- */
  const MAX_POINTS = 24;
  const liveCards = {};
  let mainTimer = null;

  function baseTrend(score) {
    const t = [];
    let v = Math.max(20, score - 40);
    for (let i = 0; i < 8; i++) {
      v += (score - v) * 0.25 + (Math.random() * 4 - 1.5);
      t.push(v);
    }
    return t;
  }

  function drawCard(state, color) {
    if (typeof drawMiniTrend === 'function') drawMiniTrend(state.svg, state.trend, color);
  }

  function startCardLive(name) {
    const state = liveCards[name];
    if (!state || state.timer) return;
    if (state.badge) state.badge.style.display = 'inline-block';
    state.timer = setInterval(function () {
      const last = state.trend[state.trend.length - 1];
      state.trend.push(last + 0.6 + Math.random() * 2.2 - 0.4);
      if (state.trend.length > MAX_POINTS) state.trend.shift();
      drawCard(state, '#1ea97b');
    }, 900);
  }

  function bumpMainChart() {
    if (typeof cryptoSeries === 'undefined' || typeof drawMixedCandleChart !== 'function') return;
    const svg = document.getElementById('cryptoChart');
    if (!svg) return;
    const tick = function () {
      const last = cryptoSeries[cryptoSeries.length - 1];
      cryptoSeries.push(last + 2 + Math.random() * 6 - 1);
      if (cryptoSeries.length > MAX_POINTS) cryptoSeries.shift();
      drawMixedCandleChart(svg, createCandlesFromSeries(cryptoSeries, 4), {
        lineColor: '#1ea97b', upColor: '#1ea97b', downColor: '#ff5c6a', gridColor: '#b0d4f1'
      });
      const first = cryptoSeries[0];
      const pct = ((cryptoSeries[cryptoSeries.length - 1] - first) / first) * 100;
      const pctEl = document.getElementById('cryptoPercent');
      if (pctEl) pctEl.textContent = '+' + pct.toFixed(1) + '%';
    };
    tick();
    if (!mainTimer) mainTimer = setInterval(tick, 1200);
  }

  function activateLive(name) {
    startCardLive(name);
    bumpMainChart();
    const top = document.getElementById('cryptoTop');
    if (top) top.textContent = name;
  }

  /* ---------- ACCESS / LIMITS ---------- */
  function updateButtonStates() {
    const remaining = getRemaining();
    document.querySelectorAll('.guest-vote.rating-text').forEach(function (btn) {
      const off = remaining <= 0;
      btn.disabled = off;
      btn.classList.toggle('disabled', off);
      btn.style.opacity = off ? '0.4' : '1';
      btn.style.cursor = off ? 'not-allowed' : 'pointer';
      btn.style.pointerEvents = off ? 'none' : 'auto';
    });
  }

  function updateUI() {
    const user = getUser();
    const remaining = getRemaining();
    const tracker = document.getElementById('cheeseTracker');
    if (tracker) tracker.innerHTML = cheeseHTML(getLimit(), remaining);
    const counter = document.getElementById('ratingsLeft');
    if (counter) counter.textContent = remaining + (remaining === 1 ? ' rating point left' : ' rating points left');
    const status = document.getElementById('registerStatus');
    if (status) status.textContent = user ? 'Registered member: ' + user.name : 'Guest (register to get 5 rating points)';
    const btn = document.getElementById('registerBtn');
    if (btn) btn.style.display = user ? 'none' : '';
    updateButtonStates();
  }

  function registerUser() {
    if (getUser()) return;
    const name = (window.prompt('Register to get 5 rating points.\nYour name:') || '').trim();
    if (!name) return;
    const email = (window.prompt('Your email (stored only in this browser):') || '').trim();
    if (!email || email.indexOf('@') === -1) {
      message('Please enter a valid email to register.');
      return;
    }
    write('crypratUser', { name: name, email: email });
    message('Welcome, ' + name + '! You now have 5 rating points in total.');
    updateUI();
  }

  function castVote(card) {
    if (getRemaining() <= 0) {
      message(getUser()
        ? 'You have used all 5 rating points. Thanks for rating with Cryp Rat!'
        : 'You used your 1 guest rating point. Register to get 5 rating points!');
      return;
    }
    const nameEl = card.querySelector('.asset-name');
    const countEl = card.querySelector('.vote-count');
    const name = nameEl ? nameEl.textContent : '';
    write('crypratRatingsUsed', getUsed() + 1);
    const overrides = getOverrides();
    overrides[name] = (overrides[name] || 0) + 1;
    write('crypratVotes', overrides);

    // keep a history so the profile page can analyse this member's ratings
    const asset = CRYPTO_DATA.find(function (c) { return c.name === name; });
    const history = read('crypratHistory', []);
    history.push({ name: name, symbol: asset ? asset.symbol : '', score: asset ? asset.score : 0, ts: Date.now() });
    write('crypratHistory', history);

    if (countEl) {
      const current = parseInt(countEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
      countEl.textContent = (current + 1).toLocaleString();
    }
    const left = getRemaining();
    message('Thanks for rating ' + name + '! ' + (left > 0 ? left + ' rating point(s) left.' : 'No more rating points left.'));
    activateLive(name);
    updateUI();
  }

  function renderAssets() {
    const grid = document.getElementById('assetGrid');
    const template = document.getElementById('assetCardTemplate');
    if (!grid || !template) return;
    grid.innerHTML = '';
    const overrides = getOverrides();

    CRYPTO_DATA.forEach(function (asset) {
      const clone = template.content.cloneNode(true);
      const card = clone.querySelector('.asset-card');
      clone.querySelector('.asset-type').textContent = 'Rating Points';
      clone.querySelector('.asset-name').textContent = asset.name;
      clone.querySelector('.asset-score').textContent = asset.score;
      clone.querySelector('.vote-count').textContent = (asset.votes + (overrides[asset.name] || 0)).toLocaleString();

      const iconEl = clone.querySelector('.asset-icon');
      iconEl.style.backgroundImage = 'url(' + asset.icon + ')';
      iconEl.style.backgroundSize = 'contain';
      iconEl.style.backgroundPosition = 'center';
      iconEl.style.backgroundRepeat = 'no-repeat';
      iconEl.style.backgroundColor = 'transparent';
      iconEl.style.boxShadow = 'none';

      const svg = clone.querySelector('.mini-chart');
      const badge = document.createElement('span');
      badge.textContent = '\u25CF LIVE';
      badge.style.cssText = 'display:none;margin-left:6px;font-size:9px;font-weight:800;color:#1ea97b;';
      clone.querySelector('.asset-type').appendChild(badge);

      const state = { svg: svg, trend: baseTrend(asset.score), timer: null, badge: badge };
      liveCards[asset.name] = state;
      drawCard(state, '#0066cc');

      const btn = clone.querySelector('.guest-vote');
      if (btn) btn.addEventListener('click', function () { castVote(card); });
      grid.appendChild(clone);
    });

    Object.keys(overrides).forEach(function (name) {
      if (liveCards[name]) activateLive(name);
    });
    updateButtonStates();
  }

  function addProfileLink() {
    const search = document.querySelector('.navbar-search');
    if (!search || document.getElementById('profileLink')) return;
    const a = document.createElement('a');
    a.id = 'profileLink';
    a.href = 'profile.html';
    a.className = 'nav-link';
    a.textContent = 'My Profile';
    search.parentNode.insertBefore(a, search);
  }

  function setup() {
    addProfileLink();
    renderAssets();
    const reg = document.getElementById('registerBtn');
    if (reg) reg.addEventListener('click', registerUser);
    const guestCheese = document.getElementById('guestCheese');
    if (guestCheese) guestCheese.innerHTML = cheeseHTML(GUEST_LIMIT, GUEST_LIMIT);
    const memberCheese = document.getElementById('memberCheese');
    if (memberCheese) memberCheese.innerHTML = cheeseHTML(MEMBER_LIMIT, MEMBER_LIMIT);
    updateUI();
  }

  window.addEventListener('DOMContentLoaded', setup);
})();
