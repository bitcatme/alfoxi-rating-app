const cryptoSeries = [112, 119, 116, 126, 121, 131, 139, 146, 154, 165, 178, 186, 193, 202, 214, 226];
const walletSeries = [88, 92, 91, 98, 104, 110, 118, 124, 120, 127, 134, 141, 138, 151, 160, 172];

function createCandlesFromSeries(values, offset = 0) {
  return values.map((value, index) => {
    const prev = values[index - 1] ?? value;
    const open = prev;
    const close = value;
    const high = Math.max(open, close) + (index % 3 === 0 ? 8 : 5) + offset;
    const low = Math.min(open, close) - (index % 2 === 0 ? 6 : 4) - offset;
    return { open, high, low, close, time: index + 1 };
  });
}

function drawMixedCandleChart(svg, values, options = {}) {
  const { upColor = '#1ea97b', downColor = '#ff5c6a', lineColor = '#0a5cff', gridColor = '#e8edf5' } = options;

  svg.innerHTML = '';
  const width = 600;
  const height = 200;
  const padding = { top: 20, right: 12, bottom: 26, left: 12 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;
  const min = Math.min(...values.map(v => v.low)) - 10;
  const max = Math.max(...values.map(v => v.high)) + 10;

  const minMaxRange = max - min || 1;

  const gridLines = Array.from({ length: 5 }, (_, i) => {
    const y = padding.top + (innerHeight / 4) * i;
    const value = max - ((max - min) / 4) * i;
    return { y, value };
  });

  gridLines.forEach(line => {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', width - 45);
    text.setAttribute('y', line.y + 4);
    text.setAttribute('fill', '#7b8ca0');
    text.setAttribute('font-size', '10');
    text.setAttribute('text-anchor', 'end');
    text.textContent = Math.round(line.value);
    svg.appendChild(text);

    const grid = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    grid.setAttribute('x1', padding.left);
    grid.setAttribute('x2', width - padding.right);
    grid.setAttribute('y1', line.y);
    grid.setAttribute('y2', line.y);
    grid.setAttribute('stroke', gridColor);
    grid.setAttribute('stroke-width', '1');
    svg.appendChild(grid);
  });

  values.forEach((candle, index) => {
    const x = padding.left + (index * innerWidth) / values.length + 10;
    const openY = padding.top + ((max - candle.open) / minMaxRange) * innerHeight;
    const closeY = padding.top + ((max - candle.close) / minMaxRange) * innerHeight;
    const highY = padding.top + ((max - candle.high) / minMaxRange) * innerHeight;
    const lowY = padding.top + ((max - candle.low) / minMaxRange) * innerHeight;
    const candleWidth = Math.max(5, (innerWidth / values.length) * 0.6);

    const wick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    wick.setAttribute('x1', x + candleWidth / 2);
    wick.setAttribute('x2', x + candleWidth / 2);
    wick.setAttribute('y1', highY);
    wick.setAttribute('y2', lowY);
    wick.setAttribute('stroke', candle.close >= candle.open ? upColor : downColor);
    wick.setAttribute('stroke-width', '2');
    svg.appendChild(wick);

    const body = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    const y = Math.min(openY, closeY);
    const bodyHeight = Math.max(Math.abs(closeY - openY), 4);
    body.setAttribute('x', x);
    body.setAttribute('y', y);
    body.setAttribute('width', candleWidth);
    body.setAttribute('height', bodyHeight);
    body.setAttribute('fill', candle.close >= candle.open ? upColor : downColor);
    body.setAttribute('rx', '3');
    svg.appendChild(body);
  });

  const linePoints = values.map((candle, index) => {
    const x = padding.left + (index * innerWidth) / (values.length - 1);
    const y = padding.top + ((max - candle.close) / minMaxRange) * innerHeight;
    return `${x},${y}`;
  }).join(' ');

  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('points', linePoints);
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', lineColor);
  polyline.setAttribute('stroke-width', '2.5');
  polyline.setAttribute('stroke-linecap', 'round');
  polyline.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(polyline);

  const axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  axis.setAttribute('x1', padding.left);
  axis.setAttribute('x2', width - padding.right);
  axis.setAttribute('y1', height - padding.bottom);
  axis.setAttribute('y2', height - padding.bottom);
  axis.setAttribute('stroke', '#ccd7e5');
  svg.appendChild(axis);
}

function drawMiniTrend(svg, values, color = '#0a5cff') {
  svg.innerHTML = '';
  const width = 160;
  const height = 48;
  const padding = 6;
  const min = Math.min(...values) - 2;
  const max = Math.max(...values) + 2;
  const range = max - min || 1;

  const points = values.map((val, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(values.length - 1, 1);
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  }).join(' ');

  const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
  polyline.setAttribute('points', points);
  polyline.setAttribute('fill', 'none');
  polyline.setAttribute('stroke', color);
  polyline.setAttribute('stroke-width', '2.2');
  polyline.setAttribute('stroke-linecap', 'round');
  polyline.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(polyline);
}

function getAssetCards() {
  return [
    { type: 'Token', name: 'Bitcoin', score: 95, votes: 2534, trend: [68, 71, 75, 72, 80, 83, 88, 95] },
    { type: 'Token', name: 'Ethereum', score: 92, votes: 2207, trend: [60, 63, 68, 70, 72, 77, 88, 92] },
    { type: 'Wallet', name: 'MetaMask', score: 90, votes: 1988, trend: [50, 55, 62, 66, 69, 73, 82, 90] },
    { type: 'Wallet', name: 'Trust Wallet', score: 88, votes: 1754, trend: [58, 61, 64, 68, 69, 72, 80, 88] },
    { type: 'Token', name: 'Solana', score: 86, votes: 1635, trend: [42, 48, 51, 59, 64, 68, 80, 86] },
    { type: 'Token', name: 'BNB', score: 84, votes: 1558, trend: [46, 52, 54, 57, 61, 68, 76, 84] },
    { type: 'Wallet', name: 'Ledger', score: 83, votes: 1429, trend: [49, 51, 57, 60, 62, 66, 74, 83] },
    { type: 'Token', name: 'Cardano', score: 81, votes: 1340, trend: [40, 46, 49, 52, 58, 64, 72, 81] }
  ];
}

function renderAssetGrid() {
  const grid = document.getElementById('assetGrid');
  const template = document.getElementById('assetCardTemplate');

  if (!grid || !template) return;

  const assets = getAssetCards();
  grid.innerHTML = '';

  assets.forEach(asset => {
    const card = template.content.firstElementChild.cloneNode(true);
    card.querySelector('.asset-type').textContent = asset.type;
    card.querySelector('.asset-name').textContent = asset.name;
    card.querySelector('.asset-score').textContent = asset.score;
    card.querySelector('.vote-count').textContent = asset.votes.toLocaleString();
    const svg = card.querySelector('.mini-chart');
    drawMiniTrend(svg, asset.trend);
    grid.appendChild(card);
  });
}

function renderTopCharts() {
  const cryptoCandles = createCandlesFromSeries(cryptoSeries, 4);
  const walletCandles = createCandlesFromSeries(walletSeries, 2);

  drawMixedCandleChart(document.getElementById('cryptoChart'), cryptoCandles, {
    lineColor: '#0a5cff',
    upColor: '#1ea97b',
    downColor: '#ff5c6a'
  });

  drawMixedCandleChart(document.getElementById('walletChart'), walletCandles, {
    lineColor: '#8a63ff',
    upColor: '#1ea97b',
    downColor: '#ff5c6a'
  });

  document.getElementById('cryptoVotes').textContent = '1,245';
  document.getElementById('cryptoTop').textContent = 'Bitcoin';
  document.getElementById('walletVotes').textContent = '892';
  document.getElementById('walletTop').textContent = 'MetaMask';

  const stockRows = [
    { rank: 1, name: 'Apple', type: 'Stock', votes: 12940, change: '+4.6%' },
    { rank: 2, name: 'Microsoft', type: 'Stock', votes: 12480, change: '+3.9%' },
    { rank: 3, name: 'NVIDIA', type: 'Stock', votes: 11920, change: '+5.1%' },
    { rank: 4, name: 'Tesla', type: 'Stock', votes: 11750, change: '+4.2%' },
    { rank: 5, name: 'Amazon', type: 'Stock', votes: 11380, change: '+3.4%' },
    { rank: 6, name: 'Alphabet', type: 'Stock', votes: 10960, change: '+2.8%' },
    { rank: 7, name: 'Meta', type: 'Stock', votes: 10820, change: '+4.8%' },
    { rank: 8, name: 'Netflix', type: 'Stock', votes: 10340, change: '+3.1%' },
    { rank: 9, name: 'Intel', type: 'Stock', votes: 9900, change: '+2.5%' },
    { rank: 10, name: 'AMD', type: 'Stock', votes: 9640, change: '+5.4%' },
    { rank: 11, name: 'Palantir', type: 'Stock', votes: 9520, change: '+6.3%' },
    { rank: 12, name: 'Coinbase', type: 'Stock', votes: 9370, change: '+3.7%' },
    { rank: 13, name: 'PayPal', type: 'Stock', votes: 9180, change: '+1.7%' },
    { rank: 14, name: 'Visa', type: 'Stock', votes: 9050, change: '+2.2%' },
    { rank: 15, name: 'Mastercard', type: 'Stock', votes: 8920, change: '+2.0%' },
    { rank: 16, name: 'Oracle', type: 'Stock', votes: 8800, change: '+1.9%' },
    { rank: 17, name: 'Salesforce', type: 'Stock', votes: 8680, change: '+1.5%' },
    { rank: 18, name: 'IBM', type: 'Stock', votes: 8520, change: '+0.9%' },
    { rank: 19, name: 'Cisco', type: 'Stock', votes: 8390, change: '+1.1%' },
    { rank: 20, name: 'SAP', type: 'Stock', votes: 8260, change: '+1.4%' },
    { rank: 21, name: 'Adobe', type: 'Stock', votes: 8110, change: '+2.7%' },
    { rank: 22, name: 'Shopify', type: 'Stock', votes: 7980, change: '+4.5%' },
    { rank: 23, name: 'Spotify', type: 'Stock', votes: 7810, change: '+3.0%' },
    { rank: 24, name: 'Uber', type: 'Stock', votes: 7730, change: '+2.4%' },
    { rank: 25, name: 'Airbnb', type: 'Stock', votes: 7640, change: '+2.1%' },
    { rank: 26, name: 'Snap', type: 'Stock', votes: 7580, change: '+1.2%' },
    { rank: 27, name: 'Pinterest', type: 'Stock', votes: 7420, change: '+2.9%' },
    { rank: 28, name: 'Discord', type: 'Stock', votes: 7380, change: '+3.3%' },
    { rank: 29, name: 'Robinhood', type: 'Stock', votes: 7240, change: '+2.8%' },
    { rank: 30, name: 'Block', type: 'Stock', votes: 7160, change: '+1.8%' },
    { rank: 31, name: 'Square', type: 'Stock', votes: 7010, change: '+2.3%' },
    { rank: 32, name: 'Goldman Sachs', type: 'Stock', votes: 6940, change: '+1.6%' },
    { rank: 33, name: 'JPMorgan', type: 'Stock', votes: 6815, change: '+1.4%' },
    { rank: 34, name: 'Morgan Stanley', type: 'Stock', votes: 6690, change: '+1.1%' },
    { rank: 35, name: 'Walmart', type: 'Stock', votes: 6520, change: '+0.9%' },
    { rank: 36, name: 'Costco', type: 'Stock', votes: 6460, change: '+1.7%' },
    { rank: 37, name: 'Target', type: 'Stock', votes: 6320, change: '+2.0%' },
    { rank: 38, name: 'Nike', type: 'Stock', votes: 6200, change: '+1.3%' },
    { rank: 39, name: 'Starbucks', type: 'Stock', votes: 6150, change: '+0.8%' },
    { rank: 40, name: 'McDonald\'s', type: 'Stock', votes: 6080, change: '+1.0%' },
    { rank: 41, name: 'Coca-Cola', type: 'Stock', votes: 5960, change: '+0.7%' },
    { rank: 42, name: 'PepsiCo', type: 'Stock', votes: 5890, change: '+1.2%' },
    { rank: 43, name: 'Tesla Energy', type: 'Stock', votes: 5730, change: '+3.8%' },
    { rank: 44, name: 'Lucid', type: 'Stock', votes: 5680, change: '+2.4%' },
    { rank: 45, name: 'Rivian', type: 'Stock', votes: 5510, change: '+2.1%' },
    { rank: 46, name: 'Nio', type: 'Stock', votes: 5390, change: '+1.9%' },
    { rank: 47, name: 'Li Auto', type: 'Stock', votes: 5240, change: '+1.6%' },
    { rank: 48, name: 'BYD', type: 'Stock', votes: 5120, change: '+4.1%' },
    { rank: 49, name: 'Alibaba', type: 'Stock', votes: 5010, change: '+2.7%' },
    { rank: 50, name: 'Tencent', type: 'Stock', votes: 4960, change: '+2.2%' }
  ];

  const list = document.getElementById('stocksList');
  if (list) {
    list.innerHTML = stockRows.map(row => `
      <div class="table-row">
        <div class="col-rank">${row.rank}</div>
        <div class="col-name">${row.name}</div>
        <div class="col-type">${row.type}</div>
        <div class="col-votes">${row.votes.toLocaleString()}</div>
        <div class="col-change ${row.change.startsWith('+') ? 'up' : 'down'}">${row.change}</div>
      </div>
    `).join('');
  }
}

function switchTab(tabName) {
  const tabs = document.querySelectorAll('.ranking-chart');
  const buttons = document.querySelectorAll('.tab-button');
  
  tabs.forEach(tab => tab.classList.remove('active'));
  buttons.forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(tabName).classList.add('active');
  event.target.classList.add('active');
}

function attachContactForm() {
  const form = document.getElementById('contactForm');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    const success = form.querySelector('.form-success');
    if (success) {
      success.textContent = 'Thanks! Your message was submitted.';
    }
    form.reset();
  });
}

function init() {
  renderAssetGrid();
  renderTopCharts();
  attachContactForm();
}

window.addEventListener('DOMContentLoaded', init);
window.switchTab = switchTab;