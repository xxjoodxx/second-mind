/* Second Mind — الراوتر والتشغيل */
(function () {
  const el = SM.el;
  SM._tickers = [];

  /* ---------- الخطوط القابلة للتغيير ---------- */
  SM.FONTS = {
    ar: ['Cairo', 'Tajawal', 'Almarai', 'Changa', 'Reem Kufi', 'IBM Plex Sans Arabic', 'Noto Kufi Arabic', 'Amiri'],
    en: ['Space Grotesk', 'Orbitron', 'Inter', 'Rubik', 'Exo 2', 'Roboto Mono', 'Press Start 2P'],
  };
  SM.applyFonts = function () {
    const S = SM.store.state;
    const ar = S.settings.fontAr || 'Cairo';
    const en = S.settings.fontEn || 'Space Grotesk';
    // حقن خطوط Google المطلوبة (مع بديل خطوط النظام عند عدم الاتصال)
    const fam = [ar, en].map(f => 'family=' + encodeURIComponent(f).replace(/%20/g, '+') + ':wght@400;500;700;900').join('&');
    let link = document.getElementById('dyn-fonts');
    if (!link) { link = el('link', { id: 'dyn-fonts', rel: 'stylesheet' }); document.head.append(link); }
    const href = `https://fonts.googleapis.com/css2?${fam}&display=swap`;
    if (link.getAttribute('href') !== href) link.setAttribute('href', href);
    const r = document.documentElement.style;
    r.setProperty('--font', `'${ar}', 'Segoe UI', Tahoma, system-ui, sans-serif`);
    r.setProperty('--font-en', `'${en}', 'Space Grotesk', 'Cairo', monospace`);
  };

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

  /* ---------- خلفية نجوم واقعية (بأسلوب صور ناسا/هابل) مرسومة بالكانفس ---------- */
  function rgba(hex, a) {
    const h = hex.replace('#', '');
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`;
  }

  /* الخلفية الأساسية: صورة سديم هابل الحقيقية (حسب الطلب — "بالضبط")
     وعند تعذّر تحميلها نرسم مشهدًا مولّدًا بالكانفس كخطة بديلة */
  function initGalaxyBg() {
    const old = document.getElementById('galaxy');
    if (old) old.remove();
    const img = el('img', { id: 'galaxy', src: 'assets/galaxy.jpg', alt: '', 'aria-hidden': 'true' });
    img.addEventListener('error', () => { img.remove(); paintGalaxy(); });
    document.body.prepend(img);
  }

  function paintGalaxy() {
    let cv = document.getElementById('galaxy');
    if (!cv || cv.tagName !== 'CANVAS') { cv = document.createElement('canvas'); cv.id = 'galaxy'; document.body.prepend(cv); }
    const w = cv.width = Math.max(window.innerWidth, 800);
    const h = cv.height = Math.max(window.innerHeight, 600);
    const ctx = cv.getContext('2d');
    const rnd = Math.random;

    ctx.fillStyle = '#04050c';
    ctx.fillRect(0, 0, w, h);

    /* سدم ملونة خافتة مثل صور هابل */
    ctx.globalCompositeOperation = 'lighter';
    const nebulae = [
      ['#3b5bd9', 0.10], ['#7048d9', 0.09], ['#2a7ab8', 0.07],
      ['#b8722a', 0.05], ['#6a35a8', 0.08], ['#2f8f8f', 0.05], ['#8a3a6b', 0.06],
    ];
    nebulae.forEach(([col, alpha]) => {
      const x = rnd() * w, y = rnd() * h, r = 170 + rnd() * 380;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, rgba(col, alpha));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });

    /* نجوم: أغلبها بيضاء-زرقاء وبعضها دافئة برتقالية كما في الصور الفلكية */
    const colors = ['#ffffff', '#dfe8ff', '#cdd9ff', '#ffd9a0', '#ffb46b', '#9ec1ff', '#fff2cc'];
    function star(x, y, boost) {
      const s = Math.pow(rnd(), 3) * 1.8 + 0.4 + (boost || 0);
      const c = colors[Math.floor(rnd() * colors.length)];
      ctx.globalAlpha = 0.35 + rnd() * 0.65;
      if (s > 1.4) { ctx.shadowBlur = 5; ctx.shadowColor = c; } else ctx.shadowBlur = 0;
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
    const total = Math.round((w * h) / 1300);
    for (let i = 0; i < total; i++) star(rnd() * w, rnd() * h, 0);

    /* عناقيد نجمية كثيفة */
    for (let k = 0; k < 5; k++) {
      const cx = rnd() * w, cy = rnd() * h, spread = 60 + rnd() * 120;
      for (let i = 0; i < 130; i++) {
        star(cx + (rnd() + rnd() + rnd() - 1.5) * spread, cy + (rnd() + rnd() + rnd() - 1.5) * spread, 0);
      }
    }

    /* نجوم ساطعة بأشعة انكسارية رباعية (مثل صور هابل) */
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    for (let k = 0; k < 7; k++) {
      const x = rnd() * w, y = rnd() * h;
      const len = 7 + rnd() * 14;
      const c = k % 3 === 0 ? '#ffd9a0' : '#eaf2ff';
      const g = ctx.createRadialGradient(x, y, 0, x, y, len * 0.7);
      g.addColorStop(0, rgba(c === '#ffd9a0' ? '#ffd9a0' : '#ffffff', 0.9));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(x, y, len * 0.7, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(c === '#ffd9a0' ? '#ffd9a0' : '#ffffff', 0.65);
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x - len, y); ctx.lineTo(x + len, y);
      ctx.moveTo(x, y - len); ctx.lineTo(x, y + len);
      ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
  }

  /* نجوم متلألئة + مذنبات فوق الخلفية الثابتة */
  function initStars() {
    const layer = document.getElementById('stars');
    layer.innerHTML = '';
    const n = Math.min(70, Math.floor(window.innerWidth / 18));
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

  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const g = document.getElementById('galaxy');
      if (g && g.tagName === 'CANVAS') paintGalaxy(); /* الصورة تتمدد وحدها */
    }, 350);
  });

  window.addEventListener('hashchange', SM.render);
  document.addEventListener('DOMContentLoaded', () => {
    SM.applyFonts();
    initGalaxyBg();
    initStars();
    SM.render();
  });
})();
