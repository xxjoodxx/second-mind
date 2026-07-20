/* Second Mind — أدوات مساعدة عامة */
window.SM = window.SM || {};
(function () {
  const U = {};

  U.uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);

  U.todayKey = (d = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  U.addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };

  U.lastNDays = (n) => {
    const arr = []; const now = new Date();
    for (let i = n - 1; i >= 0; i--) arr.push(U.todayKey(U.addDays(now, -i)));
    return arr;
  };

  U.monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

  // مفتاح الأسبوع = تاريخ أحد ذلك الأسبوع
  U.weekKey = (d = new Date()) => {
    const x = new Date(d);
    x.setDate(x.getDate() - x.getDay());
    return U.todayKey(x);
  };

  U.parseKey = (key) => new Date(key + 'T00:00:00');

  U.fmtDate = (key) => {
    if (!key) return '—';
    try { return new Intl.DateTimeFormat('ar', { day: 'numeric', month: 'short' }).format(U.parseKey(key)); }
    catch (e) { return key; }
  };

  U.fmtDateLong = (key) => {
    if (!key) return '—';
    try { return new Intl.DateTimeFormat('ar', { weekday: 'long', day: 'numeric', month: 'long' }).format(U.parseKey(key)); }
    catch (e) { return key; }
  };

  U.dayLetter = (key) => {
    try { return new Intl.DateTimeFormat('ar', { weekday: 'narrow' }).format(U.parseKey(key)); }
    catch (e) { return '·'; }
  };

  U.daysUntil = (key) => {
    if (!key) return null;
    const t = U.parseKey(U.todayKey());
    return Math.round((U.parseKey(key) - t) / 86400000);
  };

  U.clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  U.sum = (arr, fn = (x) => x) => arr.reduce((s, x) => s + (Number(fn(x)) || 0), 0);
  U.pct = (v, total) => (total > 0 ? Math.round((v / total) * 100) : 0);

  U.num = (n) => new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(Number(n) || 0);

  U.money = (n) => {
    const cur = (SM.store && SM.store.state.settings.currency) || 'ر.س';
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(n) || 0)} ${cur}`;
  };

  U.minutesFmt = (min) => {
    min = Math.round(Number(min) || 0);
    if (min < 60) return `${min} د`;
    const h = Math.floor(min / 60), m = min % 60;
    return m ? `${h} س ${m} د` : `${h} س`;
  };

  U.esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  /* منشئ عناصر DOM */
  U.el = function (tag, attrs, ...kids) {
    const e = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === 'class') e.className = v;
      else if (k === 'text') e.textContent = v;
      else if (k === 'html') e.innerHTML = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
      else if (k === 'style') e.style.cssText = v;
      else if (k === 'on') { for (const [ev, fn] of Object.entries(v)) e.addEventListener(ev, fn); }
      else if (k === 'dataset') Object.assign(e.dataset, v);
      else e.setAttribute(k, v === true ? '' : v);
    }
    for (const kid of kids.flat(Infinity)) {
      if (kid == null || kid === false) continue;
      e.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
    }
    return e;
  };

  U.frag = (...kids) => {
    const f = document.createDocumentFragment();
    for (const k of kids.flat(Infinity)) if (k != null && k !== false) f.append(k.nodeType ? k : document.createTextNode(String(k)));
    return f;
  };

  /* تحية حسب الوقت */
  U.timeGreeting = () => {
    const h = new Date().getHours();
    if (h < 5) return 'سهرة موفقة يا نجم الليل 🌙';
    if (h < 12) return 'صباح النور والطاقة ☀️';
    if (h < 17) return 'نهارك مثمر بإذن الله 🌤️';
    if (h < 21) return 'مساء الإنجاز ✨';
    return 'ليلة هادئة ومنتجة 🌌';
  };

  const QUOTES = [
    'كل يوم صغير من الالتزام يبني مجرّة كاملة.',
    'أنت لا تحتاج حماسًا دائمًا، تحتاج نظامًا يذكّرك.',
    'الكوكب لا يُبنى في يوم، لكنه يدور كل يوم.',
    'خطوة اليوم الصغيرة هي مدار الغد الواسع.',
    'العادات هي الجاذبية التي تمسك حياتك في مدارها.',
    'ركّز على المدار، لا على السرعة.',
    'النجوم لا تتنافس، كل نجم يضيء في وقته.',
    'ما يُقاس يتحسّن، وما يُهمل يتلاشى.',
    'ابدأ صغيرًا، لكن ابدأ اليوم.',
    'عقلك الثاني يتذكّر، لتتفرغ أنت للإبداع.',
  ];
  U.dailyQuote = () => {
    const start = new Date(new Date().getFullYear(), 0, 0);
    const doy = Math.floor((new Date() - start) / 86400000);
    return QUOTES[doy % QUOTES.length];
  };

  SM.U = U;
  SM.el = U.el;
})();
