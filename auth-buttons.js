(function () {
  function read(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) { return fallback; }
  }

  function message(text) {
    var el = document.getElementById('voteMessage');
    if (el) el.textContent = text;
  }

  function goToAssets() {
    var grid = document.getElementById('assetGrid');
    if (grid) grid.scrollIntoView({ behavior: 'smooth' });
  }

  function setup() {
    var reg = document.getElementById('heroRegisterBtn');
    var guest = document.getElementById('heroGuestBtn');

    if (reg) {
      reg.addEventListener('click', function () {
        var user = read('crypratUser', null);
        if (user && user.name) {
          message('You are already registered as ' + user.name + '. You have 5 rating points in total.');
          goToAssets();
          return;
        }
        // opens the same registration form used by the Register button in Your Rating Points
        var existing = document.getElementById('registerBtn');
        if (existing) existing.click();
      });
    }

    if (guest) {
      guest.addEventListener('click', function () {
        var user = read('crypratUser', null);
        if (user && user.name) {
          message('You are registered as ' + user.name + ', so you keep your 5 rating points.');
        } else {
          message('Guest mode: you can give 1 rating point without registering.');
        }
        goToAssets();
      });
    }
  }

  window.addEventListener('DOMContentLoaded', setup);
})();
