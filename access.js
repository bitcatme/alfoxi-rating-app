(function () {
  const GUEST_LIMIT = 1;
  const MEMBER_LIMIT = 5;
  const CHEESE = '<svg class="cheese-icon" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M2 17 L22 9 V17 Z" fill="#f7c331" stroke="#a87a00" stroke-width="1"/><path d="M2 17 L22 9 L22 6 L2 13 Z" fill="#fbd95c" stroke="#a87a00" stroke-width="1"/><circle cx="9" cy="15" r="1.2" fill="#a87a00"/><circle cx="15" cy="13.5" r="1" fill="#a87a00"/><circle cx="18.5" cy="15.5" r="0.8" fill="#a87a00"/></svg>';

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

  function updateUI() {
    const user = getUser();
    const remaining = getRemaining();
    const tracker = document.getElementById('cheeseTracker');
    if (tracker) tracker.innerHTML = cheeseHTML(getLimit(), remaining);
    const counter = document.getElementById('ratingsLeft');
    if (counter) counter.textContent = remaining + (remaining === 1 ? ' free rating left' : ' free ratings left');
    const status = document.getElementById('registerStatus');
    if (status) status.textContent = user ? 'Registered member: ' + user.name : 'Guest (register to get 5 free ratings)';
    const btn = document.getElementById('registerBtn');
    if (btn) btn.style.display = user ? 'none' : '';
  }

  function registerUser() {
    if (getUser()) return;
    const name = (window.prompt('Register to get 5 free ratings.\nYour name:') || '').trim();
    if (!name) return;
    const email = (window.prompt('Your email (stored only in this browser):') || '').trim();
    if (!email || email.indexOf('@') === -1) {
      message('Please enter a valid email to register.');
      return;
    }
    write('crypratUser', { name: name, email: email });
    message('Welcome, ' + name + '! You now have 5 free ratings in total.');
    updateUI();
  }

  function castVote(card) {
    if (getRemaining() <= 0) {
      message(getUser()
        ? 'You have used all 5 free ratings. Thanks for rating with Cryp Rat!'
        : 'You used your 1 free guest rating. Register to get 5 free ratings!');
      return;
    }
    const nameEl = card.querySelector('.asset-name');
    const countEl = card.querySelector('.vote-count');
    const name = nameEl ? nameEl.textContent : '';
    write('crypratRatingsUsed', getUsed() + 1);
    const overrides = getOverrides();
    overrides[name] = (overrides[name] || 0) + 1;
    write('crypratVotes', overrides);
    if (countEl) {
      const current = parseInt(countEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
      countEl.textContent = (current + 1).toLocaleString();
    }
    message('Thanks for rating ' + name + '! ' + getRemaining() + ' free rating(s) left.');
    updateUI();
  }

  function setup() {
    document.querySelectorAll('.asset-card').forEach(function (card) {
      const nameEl = card.querySelector('.asset-name');
      const countEl = card.querySelector('.vote-count');
      const extra = nameEl ? getOverrides()[nameEl.textContent] : 0;
      if (extra && countEl) {
        const current = parseInt(countEl.textContent.replace(/[^0-9]/g, ''), 10) || 0;
        countEl.textContent = (current + extra).toLocaleString();
      }
      const btn = card.querySelector('.guest-vote');
      if (btn) btn.addEventListener('click', function () { castVote(card); });
    });

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
