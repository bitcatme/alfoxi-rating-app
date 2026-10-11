(function () {
  var RANGES = [
    { label: 'Live', points: 0, start: 1 },
    { label: '1Day', points: 24, start: 0.97 },
    { label: '7Day', points: 28, start: 0.92 },
    { label: '30Day', points: 30, start: 0.85 },
    { label: '1Year', points: 24, start: 0.65 },
    { label: 'All', points: 36, start: 0.45 }
  ];
  var SVGNS = 'http://www.w3.org/2000/svg';

  function injectStyles() {
    var css = '' +
      '.tf-bar{display:flex;flex-wrap:wrap;gap:0;margin:0 0 6px;border:1px solid var(--line);border-radius:8px;overflow:hidden;width:max-content;max-width:100%;background:#f0f8ff}' +
      '.tf-btn{border:0;border-right:1px solid var(--line);background:transparent;color:#000;font-size:10px;font-weight:700;padding:3px 9px;cursor:pointer;font-family:inherit}' +
      '.tf-btn:last-child{border-right:0}' +
      '.tf-btn:hover{background:#cce5ff}' +
      '.tf-btn.active{background:#0066cc;color:#fff}' +
      '.asset-card .tf-bar{margin-bottom:5px}' +
      '.asset-card .tf-btn{font-size:8.5px;padding:2px 5px}';
    var el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  }

  function hash(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // Illustrative history: a stable (seeded) curve that ends at the current level.
  function series(key, range, base) {
    var r = rng(hash(key + '|' + range.label));
    var n = range.points, out = [];
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1);
      var v = base * (range.start + (1 - range.start) * t);
      v += base * 0.03 * (r() * 2 - 1);
      out.push(v);
    }
    out[n - 1] = base;
    return out;
  }

  function buildBar(onSelect) {
    var bar = document.createElement('div');
    bar.className = 'tf-bar';
    RANGES.forEach(function (range, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tf-btn' + (i === 0 ? ' active' : '');
      b.textContent = range.label;
      b.addEventListener('click', function () {
        bar.querySelectorAll('.tf-btn').forEach(function (x) { x.classList.remove('active'); });
        b.classList.add('active');
        onSelect(range);
      });
      bar.appendChild(b);
    });
    return bar;
  }

  function attach(container, liveSvg, key, getBase, draw) {
    if (!container || !liveSvg || container.dataset.tfReady) return;
    container.dataset.tfReady = '1';

    var overlay = document.createElementNS(SVGNS, 'svg');
    overlay.setAttribute('class', liveSvg.getAttribute('class') || '');
    overlay.setAttribute('viewBox', liveSvg.getAttribute('viewBox') || '0 0 600 200');
    overlay.style.display = 'none';
    liveSvg.parentNode.appendChild(overlay);

    var bar = buildBar(function (range) {
      if (range.label === 'Live') {
        overlay.style.display = 'none';
        liveSvg.style.display = '';
        return;
      }
      liveSvg.style.display = 'none';
      overlay.style.display = '';
      draw(overlay, series(key, range, getBase()));
    });
    container.parentNode.insertBefore(bar, container);
  }

  function setupMain(id, key, seriesName) {
    var svg = document.getElementById(id);
    if (!svg) return;
    attach(svg.closest('.chart-container-live'), svg, key, function () {
      var arr = (seriesName === 'crypto' && typeof cryptoSeries !== 'undefined') ? cryptoSeries
              : (seriesName === 'wallet' && typeof walletSeries !== 'undefined') ? walletSeries : [200];
      return arr[arr.length - 1];
    }, function (target, values) {
      if (typeof drawMixedCandleChart !== 'function' || typeof createCandlesFromSeries !== 'function') return;
      drawMixedCandleChart(target, createCandlesFromSeries(values, 3), {
        lineColor: '#0066cc', upColor: '#1ea97b', downColor: '#ff5c6a', gridColor: '#b0d4f1'
      });
    });
  }

  function setupCards() {
    document.querySelectorAll('#assetGrid .asset-card').forEach(function (card) {
      var svg = card.querySelector('.mini-chart');
      var nameEl = card.querySelector('.asset-name');
      var scoreEl = card.querySelector('.asset-score');
      if (!svg || !nameEl) return;
      attach(card.querySelector('.chart-container'), svg, nameEl.textContent, function () {
        return parseInt(scoreEl ? scoreEl.textContent : '80', 10) || 80;
      }, function (target, values) {
        if (typeof drawMiniTrend === 'function') drawMiniTrend(target, values, '#0066cc');
      });
    });
  }

  function init() {
    injectStyles();
    setupMain('cryptoChart', 'Crypto Rating', 'crypto');
    setupMain('walletChart', 'Wallet Rating', 'wallet');
    setupCards();
  }

  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', init);
  else init();
})();
