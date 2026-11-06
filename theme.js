(function () {
  var k = 'caldaia_theme', t = 'light';
  try { t = localStorage.getItem(k) || 'light'; } catch (e) {}
  document.documentElement.dataset.theme = t;
  document.addEventListener('DOMContentLoaded', function () {
    var h = document.querySelector('header.top'); if (!h) return;
    var b = document.createElement('button'); b.className = 'theme-btn'; b.title = 'Tema chiaro / scuro'; b.setAttribute('aria-label', 'Cambia tema');
    function lab() { b.textContent = document.documentElement.dataset.theme === 'dark' ? '☀' : '☾'; }
    lab();
    b.onclick = function () {
      var n = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = n; try { localStorage.setItem(k, n); } catch (e) {} lab();
    };
    h.appendChild(b);
  });
})();
