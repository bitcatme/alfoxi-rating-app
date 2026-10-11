(function () {
  var DAY = 86400000;
  var RANGES = [
    { label: 'Live', points: 0, start: 0.985, step: 1000 },
    { label: '1Day', points: 24, start: 0.96, step: 3600000 },
    { label: '7Day', points: 28, start: 0.92, step: 6 * 3600000 },
    { label: '30Day', points: 30, start: 0.85, step: DAY },
    { label: '1Year', points: 24, start: 0.65, step: 15 * DAY },
    { label: 'All', points: 36, start: 0.45, step: 30 * DAY }
  ];
  var SVGNS = 'http://www.w3.org/2000/svg';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  function injectStyles() {
    var css = '' +
      '.tf-bar{display:flex;flex-wrap:wrap;gap:0;margin:0 0 6px;border:1px solid var(--line,#9cc7ea);border-radius:8px;overflow:hidden;width:max-content;max-width:100%;background:#f0f8ff}' +
      '.tf-btn{border:0;border-right:1px solid var(--line,#9cc7ea);background:transparent;color:#000;font-size:10px;font-weight:700;padding:3px 9px;cursor:pointer;font-family:inherit}' +
      '.tf-btn:last-child{border-right:0}' +
      '.tf-btn:hover{background:#cce5ff}' +
      '.tf-btn.active{background:#0066cc;color:#fff}' +
      '.asset-card .tf-bar{margin-bottom:5px}' +
      '.asset-card .tf-btn{font-size:8.5px;padding:2px 5px}' +
      '.chart-container,.chart-container-live{cursor:zoom-in}' +
      '.cv-back{position:fixed;inset:0;background:rgba(0,40,80,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:14px}' +
      '.cv-box{background:#fff;border:1px solid #9cc7ea;border-radius:14px;width:min(820px,100%);max-height:96vh;overflow:auto;padding:14px 16px;color:#000;font-family:Inter,Arial,sans-serif}' +
      '.cv-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}' +
      '.cv-head h3{margin:0;font-size:16px}' +
      '.cv-close{border:0;background:#cce5ff;border-radius:8px;font-size:18px;line-height:1;padding:4px 10px;cursor:pointer}' +
      '.cv-stats{display:flex;flex-wrap:wrap;gap:14px;margin:8px 0;font-size:12px}' +
      '.cv-stats b{font-size:14px}' +
      '.cv-up{color:#1ea97b}.cv-down{color:#e5484d}' +
      '.cv-wrap{position:relative}' +
      '.cv-wrap svg{width:100%;height:auto;display:block;background:#f7fbff;border:1px solid #d4e8f7;border-radius:10px}' +
      '.cv-tip{position:absolute;pointer-events:none;background:#000;color:#fff;font-size:11px;line-height:1.45;padding:5px 8px;border-radius:6px;white-space:nowrap;display:none;transform:translate(-50%,-110%)}' +
      '.cv-note{font-size:10.5px;color:#333;margin:8px 0 0}';
    var el = document.createElement('style');
    el.textContent = css;
    document.head.appendChild(el);
  }

  /* ---------- helpers ---------- */
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
  function p2(n) { return (n < 10 ? '0' : '') + n; }
  function hhmm(d) { return p2(d.getHours()) + ':' + p2(d.getMinutes()); }
  function hhmmss(d) { return hhmm(d) + ':' + p2(d.getSeconds()); }
  function dmy(d) { return p2(d.getDate()) + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }

  // Illustrative history: a stable (seeded) curve that moves up and down and ends at the current level.
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

  function timedSeries(key, range, base, now) {
    var n = range.points || 60;
    var r = rng(hash(key + '|view|' + range.label));
    var out = [];
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1);
      var v = base * (range.start + (1 - range.start) * t);
      v += base * 0.025 * Math.sin(t * Math.PI * 5 + r() * 2);
      v += base * 0.012 * (r() * 2 - 1);
      out.push({ t: now - (n - 1 - i) * range.step, v: v });
    }
    out[n - 1].v = base;
    return out;
  }

  /* ---------- inline range bar (Live / 1Day / ... / All) ---------- */
  function buildBar(onSelect) {
    var bar = document.createElement('div');
    bar.className = 'tf-bar';
    RANGES.forEach(function (range, i) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'tf-btn' + (i === 0 ? ' active' : '');
      b.textContent = range.label;
      b.addEventListener('click', function (e) {
        e.stopPropagation();
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
    container.title = 'Click to open the full graph';
  }

  function mainBase(name) {
    var arr = (name === 'crypto' && typeof cryptoSeries !== 'undefined') ? cryptoSeries
            : (name === 'wallet' && typeof walletSeries !== 'undefined') ? walletSeries : [200];
    return arr[arr.length - 1];
  }

  function setupMain(id, key, name) {
    var svg = document.getElementById(id);
    if (!svg) return;
    attach(svg.closest('.chart-container-live'), svg, key, function () { return mainBase(name); }, function (target, values) {
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

  /* ---------- full graph viewer (click a graph) ---------- */
  var viewer = null;

  function closeViewer() {
    if (!viewer) return;
    if (viewer.timer) clearInterval(viewer.timer);
    if (viewer.back && viewer.back.parentNode) viewer.back.parentNode.removeChild(viewer.back);
    viewer = null;
  }

  function labelFor(range, ts) {
    var d = new Date(ts);
    if (range.label === 'Live') return [hhmmss(d), dmy(d)];
    if (range.label === '1Day') return [hhmm(d), p2(d.getDate()) + ' ' + MONTHS[d.getMonth()]];
    if (range.label === '7Day') return [DAYS[d.getDay()] + ' ' + hhmm(d), p2(d.getDate()) + ' ' + MONTHS[d.getMonth()]];
    if (range.label === '30Day') return [p2(d.getDate()) + ' ' + MONTHS[d.getMonth()], String(d.getFullYear())];
    return [MONTHS[d.getMonth()], String(d.getFullYear())];
  }

  function el(tag, attrs, text) {
    var e = document.createElementNS(SVGNS, tag);
    Object.keys(attrs || {}).forEach(function (k) { e.setAttribute(k, attrs[k]); });
    if (text !== undefined) e.textContent = text;
    return e;
  }

  function renderViewer() {
    var v = viewer, data = v.data, range = v.range;
    var svg = v.svg;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    var W = 760, H = 340, pl = 50, pr = 16, pt = 14, pb = 52;
    var iw = W - pl - pr, ih = H - pt - pb;
    var vals = data.map(function (d) { return d.v; });
    var lo = Math.min.apply(null, vals), hi = Math.max.apply(null, vals);
    var padv = (hi - lo) * 0.12 || 1;
    lo -= padv; hi += padv;
    var X = function (i) { return pl + (i * iw) / (data.length - 1); };
    var Y = function (val) { return pt + ((hi - val) / (hi - lo)) * ih; };
    v.X = X; v.Y = Y; v.W = W; v.H = H;

    // y-axis scale points + horizontal grid
    for (var g = 0; g <= 4; g++) {
      var val = hi - ((hi - lo) / 4) * g;
      var y = pt + (ih / 4) * g;
      svg.appendChild(el('line', { x1: pl, x2: W - pr, y1: y, y2: y, stroke: '#d4e8f7', 'stroke-width': 1 }));
      svg.appendChild(el('text', { x: pl - 6, y: y + 4, 'text-anchor': 'end', 'font-size': 10, fill: '#333' }, (hi - lo) < 8 ? val.toFixed(1) : String(Math.round(val))));
    }

    // x-axis time + date labels (two lines) with vertical grid
    var ticks = 6;
    for (var k = 0; k < ticks; k++) {
      var idx = Math.round((k * (data.length - 1)) / (ticks - 1));
      var x = X(idx);
      var lb = labelFor(range, data[idx].t);
      svg.appendChild(el('line', { x1: x, x2: x, y1: pt, y2: pt + ih, stroke: '#e6f1fa', 'stroke-width': 1 }));
      var anchor = k === 0 ? 'start' : (k === ticks - 1 ? 'end' : 'middle');
      svg.appendChild(el('text', { x: x, y: pt + ih + 16, 'text-anchor': anchor, 'font-size': 10, 'font-weight': 700, fill: '#000' }, lb[0]));
      svg.appendChild(el('text', { x: x, y: pt + ih + 30, 'text-anchor': anchor, 'font-size': 9, fill: '#555' }, lb[1]));
    }
    svg.appendChild(el('line', { x1: pl, x2: W - pr, y1: pt + ih, y2: pt + ih, stroke: '#7fb8e6', 'stroke-width': 1.5 }));

    // area + line
    var color = range.label === 'Live' ? '#1ea97b' : '#0066cc';
    var pts = data.map(function (d, i) { return X(i) + ',' + Y(d.v); }).join(' ');
    svg.appendChild(el('polygon', { points: X(0) + ',' + (pt + ih) + ' ' + pts + ' ' + X(data.length - 1) + ',' + (pt + ih), fill: color, 'fill-opacity': 0.12 }));
    svg.appendChild(el('polyline', { points: pts, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    var last = data[data.length - 1];
    svg.appendChild(el('circle', { cx: X(data.length - 1), cy: Y(last.v), r: 4.5, fill: color, stroke: '#fff', 'stroke-width': 2 }));

    // hover crosshair
    v.cross = el('line', { x1: 0, x2: 0, y1: pt, y2: pt + ih, stroke: '#000', 'stroke-width': 1, 'stroke-dasharray': '3 3', visibility: 'hidden' });
    v.dot = el('circle', { cx: 0, cy: 0, r: 5, fill: '#fff', stroke: color, 'stroke-width': 2.5, visibility: 'hidden' });
    svg.appendChild(v.cross); svg.appendChild(v.dot);

    // stats
    var first = data[0].v;
    var chg = ((last.v - first) / first) * 100;
    v.stats.innerHTML =
      '<span>Rating points now <b>' + last.v.toFixed(1) + '</b></span>' +
      '<span>High <b>' + Math.max.apply(null, vals).toFixed(1) + '</b></span>' +
      '<span>Low <b>' + Math.min.apply(null, vals).toFixed(1) + '</b></span>' +
      '<span>Change <b class="' + (chg >= 0 ? 'cv-up' : 'cv-down') + '">' + (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%</b></span>';
  }

  function setRange(range) {
    var v = viewer;
    v.range = range;
    if (v.timer) { clearInterval(v.timer); v.timer = null; }
    v.bar.querySelectorAll('.tf-btn').forEach(function (b) { b.classList.toggle('active', b.textContent === range.label); });
    v.data = timedSeries(v.key, range, v.base, Date.now());
    renderViewer();
    if (range.label === 'Live') {
      var vol = v.base * 0.012;
      v.timer = setInterval(function () {
        var d = v.data, lastV = d[d.length - 1].v;
        var next = lastV + (Math.random() * 2 - 1) * vol;      // moves up and down
        next = Math.max(v.base * 0.9, Math.min(v.base * 1.1, next));
        d.push({ t: Date.now(), v: next });
        if (d.length > 60) d.shift();
        renderViewer();
      }, 1000);
    }
  }

  function openViewer(title, key, base) {
    closeViewer();
    var back = document.createElement('div');
    back.className = 'cv-back';
    var box = document.createElement('div');
    box.className = 'cv-box';
    box.innerHTML = '<div class="cv-head"><h3></h3><button type="button" class="cv-close" aria-label="Close">&times;</button></div>';
    box.querySelector('h3').textContent = title + ' - rating points';
    var bar = buildBar(function (range) { setRange(range); });
    var stats = document.createElement('div'); stats.className = 'cv-stats';
    var wrap = document.createElement('div'); wrap.className = 'cv-wrap';
    var svg = document.createElementNS(SVGNS, 'svg');
    svg.setAttribute('viewBox', '0 0 760 340');
    var tip = document.createElement('div'); tip.className = 'cv-tip';
    wrap.appendChild(svg); wrap.appendChild(tip);
    var note = document.createElement('p'); note.className = 'cv-note';
    note.textContent = 'Hover or touch the graph to see the exact time, date and rating points. Live moves every second. History curves are illustrative demo data for now, not real market records.';
    box.appendChild(bar); box.appendChild(stats); box.appendChild(wrap); box.appendChild(note);
    back.appendChild(box);
    document.body.appendChild(back);

    viewer = { back: back, svg: svg, bar: bar, stats: stats, tip: tip, key: key, base: base, timer: null, data: [], range: RANGES[0] };

    function onMove(clientX) {
      var v = viewer; if (!v || !v.data.length) return;
      var rect = svg.getBoundingClientRect();
      var sx = ((clientX - rect.left) / rect.width) * v.W;
      var n = v.data.length, best = 0, bd = 1e9;
      for (var i = 0; i < n; i++) { var dd = Math.abs(v.X(i) - sx); if (dd < bd) { bd = dd; best = i; } }
      var p = v.data[best], d = new Date(p.t);
      v.cross.setAttribute('x1', v.X(best)); v.cross.setAttribute('x2', v.X(best)); v.cross.setAttribute('visibility', 'visible');
      v.dot.setAttribute('cx', v.X(best)); v.dot.setAttribute('cy', v.Y(p.v)); v.dot.setAttribute('visibility', 'visible');
      v.tip.innerHTML = '<b>' + p.v.toFixed(1) + ' rating points</b><br>' + hhmmss(d) + '<br>' + DAYS[d.getDay()] + ' ' + dmy(d);
      v.tip.style.left = ((v.X(best) / v.W) * rect.width) + 'px';
      v.tip.style.top = ((v.Y(p.v) / v.H) * rect.height) + 'px';
      v.tip.style.display = 'block';
    }
    svg.addEventListener('mousemove', function (e) { onMove(e.clientX); });
    svg.addEventListener('touchmove', function (e) { if (e.touches[0]) onMove(e.touches[0].clientX); }, { passive: true });
    svg.addEventListener('mouseleave', function () {
      if (!viewer) return;
      tip.style.display = 'none';
      if (viewer.cross) viewer.cross.setAttribute('visibility', 'hidden');
      if (viewer.dot) viewer.dot.setAttribute('visibility', 'hidden');
    });

    box.querySelector('.cv-close').addEventListener('click', closeViewer);
    back.addEventListener('click', function (e) { if (e.target === back) closeViewer(); });
    setRange(RANGES[0]);
  }

  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeViewer(); });

  document.addEventListener('click', function (e) {
    if (viewer) return;
    var c = e.target.closest ? e.target.closest('.chart-container, .chart-container-live') : null;
    if (!c) return;
    var card = c.closest('.asset-card');
    if (card) {
      var name = card.querySelector('.asset-name').textContent;
      var base = parseInt(card.querySelector('.asset-score').textContent, 10) || 80;
      openViewer(name, name, base);
      return;
    }
    if (c.querySelector('#cryptoChart')) openViewer('Crypto Rating Ranking', 'Crypto Rating', mainBase('crypto'));
    else if (c.querySelector('#walletChart')) openViewer('Digital Wallet Rating Ranking', 'Wallet Rating', mainBase('wallet'));
  });

  function init() {
    injectStyles();
    setupMain('cryptoChart', 'Crypto Rating', 'crypto');
    setupMain('walletChart', 'Wallet Rating', 'wallet');
    setupCards();
  }

  if (document.readyState === 'loading') window.addEventListener('DOMContentLoaded', init);
  else init();
})();
