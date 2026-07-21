/* Second Mind — الراوتر والتشغيل */
(function () {
  const el = SM.el;
  SM._tickers = [];

  SM.go = function (hash) {
    if (location.hash === hash) { SM.render(); return; }
    location.hash = hash;
  };

  SM.render = function () {
    // نظف مؤقتات الواجهة (بومودورو العام يبقى)
    SM._tickers.forEach(t => clearInterval(t));
    SM._tickers = [];

    const root = document.getElementById('app');
    root.innerHTML = '';

    const hash = location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/').filter(Boolean);

    if (parts[0] === 'p' && parts[1]) {
      SM.renderPlanet(root, parts[1], parts[2] || 'dash');
    } else {
      SM.renderHome(root);
    }
    window.scrollTo(0, 0);
  };

  SM.refresh = function () {
    const sc = document.scrollingElement ? document.scrollingElement.scrollTop : 0;
    const root = document.getElementById('app');
    SM._tickers.forEach(t => clearInterval(t));
    SM._tickers = [];
    root.innerHTML = '';
    const hash = location.hash.replace(/^#\/?/, '');
    const parts = hash.split('/').filter(Boolean);
    if (parts[0] === 'p' && parts[1]) SM.renderPlanet(root, parts[1], parts[2] || 'dash');
    else SM.renderHome(root);
    if (document.scrollingElement) document.scrollingElement.scrollTop = sc;
  };

  /* النجوم والمذنبات */
  function initStars() {
    const layer = document.getElementById('stars');
    const n = Math.min(150, Math.floor(window.innerWidth / 9));
    for (let i = 0; i < n; i++) {
      const size = Math.random() < 0.85 ? 2 : 3;
      layer.append(el('i', {
        class: 'star',
        style: `left:${Math.random() * 100}%;top:${Math.random() * 100}%;width:${size}px;height:${size}px;` +
          `animation-delay:${(Math.random() * 6).toFixed(2)}s;animation-duration:${(2.5 + Math.random() * 4).toFixed(2)}s;opacity:${0.3 + Math.random() * 0.7}`,
      }));
    }
    for (let i = 0; i < 3; i++) {
      layer.append(el('i', {
        class: 'comet',
        style: `top:${5 + Math.random() * 40}%;animation-delay:${(i * 9 + Math.random() * 5).toFixed(1)}s`,
      }));
    }
  }

  window.addEventListener('hashchange', SM.render);
  document.addEventListener('DOMContentLoaded', () => {
    initStars();
    SM.render();
  });
})();
