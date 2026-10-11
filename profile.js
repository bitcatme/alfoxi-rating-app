(function () {
  const GUEST_LIMIT = 1;
  const MEMBER_LIMIT = 5;
  const CATEGORY = {
    Bitcoin: 'Major coins', Ethereum: 'Major coins', BNB: 'Major coins', XRP: 'Major coins', Solana: 'Major coins', TRON: 'Major coins',
    Tether: 'Stablecoins', USDC: 'Stablecoins',
    Dogecoin: 'Meme / high-risk', Hyperliquid: 'Meme / high-risk',
    Zcash: 'Privacy coins', Monero: 'Privacy coins'
  };

  function read(key, fallback) {
    try { const raw = localStorage.getItem(key); return raw === null ? fallback : JSON.parse(raw); }
    catch (e) { return fallback; }
  }
  function $(id) { return document.getElementById(id); }
  function pct(n, total) { return total ? Math.round((n / total) * 100) : 0; }

  function barRow(label, value, total) {
    const p = pct(value, total);
    const row = document.createElement('div');
    row.className = 'bar-row';
    const l = document.createElement('div'); l.textContent = label;
    const bar = document.createElement('div'); bar.className = 'bar';
    const fill = document.createElement('span'); fill.style.width = p + '%'; bar.appendChild(fill);
    const v = document.createElement('div'); v.className = 'pct'; v.textContent = p + '%';
    row.appendChild(l); row.appendChild(bar); row.appendChild(v);
    return row;
  }

  function countBy(items, keyFn) {
    const out = {};
    items.forEach(function (i) { const k = keyFn(i); out[k] = (out[k] || 0) + 1; });
    return out;
  }

  function render() {
    const user = read('crypratUser', null);
    const history = read('crypratHistory', []);
    const limit = user && user.name ? MEMBER_LIMIT : GUEST_LIMIT;
    const used = Math.min(Number(read('crypratRatingsUsed', 0)) || 0, limit);

    const name = user && user.name ? user.name : 'Guest';
    $('avatar').textContent = name.charAt(0).toUpperCase();
    $('pName').textContent = name;
    $('pType').textContent = user && user.name ? 'Registered member (5 rating points)' : 'Guest (1 rating point)';
    $('pEmail').textContent = user && user.email ? user.email : 'Not registered yet';

    $('usedLabel').textContent = used + ' of ' + limit;
    $('usedBar').style.width = pct(used, limit) + '%';
    $('usedPct').textContent = pct(used, limit) + '%';

    const coinBars = $('coinBars');
    const catBars = $('catBars');
    const insights = $('insights');
    const hist = $('history');

    if (!history.length) {
      const p = document.createElement('p');
      p.className = 'insight';
      p.textContent = 'No ratings yet. Go back and click Rating Now on a coin to build your profile.';
      coinBars.appendChild(p.cloneNode(true));
      catBars.appendChild(p.cloneNode(true));
      insights.appendChild(p);
      return;
    }

    const byCoin = countBy(history, function (h) { return h.name; });
    Object.keys(byCoin).sort(function (a, b) { return byCoin[b] - byCoin[a]; }).forEach(function (n) {
      coinBars.appendChild(barRow(n, byCoin[n], history.length));
    });

    const byCat = countBy(history, function (h) { return CATEGORY[h.name] || 'Other'; });
    Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; }).forEach(function (c) {
      catBars.appendChild(barRow(c, byCat[c], history.length));
    });

    // rule-based insights
    const lines = [];
    const topCoin = Object.keys(byCoin).sort(function (a, b) { return byCoin[b] - byCoin[a]; })[0];
    const topCat = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; })[0];
    const avg = history.reduce(function (s, h) { return s + (h.score || 0); }, 0) / history.length;

    lines.push('Your biggest share (' + pct(byCoin[topCoin], history.length) + '%) went to ' + topCoin + '.');
    lines.push('Your favourite category is ' + topCat + ' (' + pct(byCat[topCat], history.length) + '% of your rating points).');
    if (avg >= 88) lines.push('Style: Established-asset fan. You back coins that already have very high community scores (average ' + avg.toFixed(0) + ').');
    else if (avg >= 80) lines.push('Style: Balanced. You mix strong and mid-ranked coins (average score ' + avg.toFixed(0) + ').');
    else lines.push('Style: Contrarian. You lean toward lower-ranked coins (average score ' + avg.toFixed(0) + ').');
    if (Object.keys(byCoin).length === 1 && history.length > 1) lines.push('You put all your rating points on one coin, which shows strong conviction.');
    if (Object.keys(byCoin).length === history.length && history.length > 2) lines.push('You spread your rating points across different coins, so your picks are well diversified.');
    if (used >= limit) lines.push('You have used all of your rating points.' + (limit === GUEST_LIMIT ? ' Register to get 5 rating points.' : ''));

    lines.forEach(function (t) {
      const p = document.createElement('p'); p.className = 'insight'; p.textContent = '\u2022 ' + t; insights.appendChild(p);
    });

    history.slice().reverse().forEach(function (h) {
      const row = document.createElement('div'); row.className = 'history-row';
      const a = document.createElement('span'); a.textContent = h.name + (h.symbol ? ' (' + h.symbol + ')' : '');
      const b = document.createElement('span'); b.textContent = new Date(h.ts).toLocaleString();
      row.appendChild(a); row.appendChild(b); hist.appendChild(row);
    });
  }

  window.addEventListener('DOMContentLoaded', render);
})();
