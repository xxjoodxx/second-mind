/* Second Mind — محرك الرسم البكسلي (Pixel Art) للكواكب والشمس */
(function () {
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hexRgb(hex) {
    const h = String(hex).replace('#', '');
    return [parseInt(h.slice(0, 2), 16) || 136, parseInt(h.slice(2, 4), 16) || 153, parseInt(h.slice(4, 6), 16) || 170];
  }
  /* f<1 تعتيم، f>1 تفتيح نحو الأبيض */
  function shade(hex, f) {
    const [r, g, b] = hexRgb(hex);
    const m = (v) => Math.max(0, Math.min(255, Math.round(f <= 1 ? v * f : v + (255 - v) * (f - 1))));
    return `rgb(${m(r)},${m(g)},${m(b)})`;
  }

  /* تحويلات HSL لإزاحة درجة اللون مع الحفاظ على النسيج */
  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let h = 0, s = 0; const l = (mx + mn) / 2;
    const d = mx - mn;
    if (d) {
      s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) h = (b - r) / d + 2;
      else h = (r - g) / d + 4;
      h *= 60;
    }
    return [h, s, l];
  }
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];
    return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
  }
  function hex2(n) { return n.toString(16).padStart(2, '0'); }
  function hueOf(hex) { const [r, g, b] = hexRgb(hex); return rgbToHsl(r, g, b)[0]; }
  function shiftHueHex(hex, delta) {
    if (!delta) return hex;
    const [r, g, b] = hexRgb(hex);
    const [h, s, l] = rgbToHsl(r, g, b);
    if (s < 0.06) return hex; // رمادي/أبيض لا يتأثر
    const [nr, ng, nb] = hslToRgb(h + delta, s, l);
    return '#' + hex2(nr) + hex2(ng) + hex2(nb);
  }

  const P = {};
  P.hueOf = hueOf;

  const SPECS = {
    earth:  { base: ['#2f7fd0', '#2568b4'], land: ['#3fae62', '#2c8a4c'] },
    swirl:  { base: ['#2f6fd8', '#2456b8'], streak: '#cfe4ff' },
    bands:  { bands: ['#f8e3a8', '#eab54e', '#c9853a', '#f3d287', '#d99b45', '#a96a2c', '#e8c06a'] },
    crater: { base: ['#c1552e', '#a84424'], dark: '#6e2a14', rim: '#e0855a' },
    ring:   { base: ['#c77df0', '#a855d8'], dark: '#8a3fc0', ring: ['#f87171', '#fbbf24', '#4ade80', '#38bdf8', '#a78bfa', '#f472b6'] },
  };

  /* يرسم كوكبًا بكسليًا على كانفس مربع صغير يُكبَّر بـ CSS */
  P.planet = function (type, opts = {}) {
    const N = opts.n || 26;
    const seed = opts.seed || 7;
    const rnd = mulberry32(seed * 7919 + 17);
    const cv = document.createElement('canvas');
    cv.width = N; cv.height = N;
    const ctx = cv.getContext('2d');
    const c = N / 2;
    const pr = type === 'ring' ? N * 0.30 : N * 0.47;
    /* إزاحة درجة اللون تلوّن الكوكب بالكامل مع الحفاظ على النسيج */
    const dh = opts.hueShift || 0;
    let spec = SPECS[type] || null;
    if (spec && dh) {
      spec = {};
      for (const k of Object.keys(SPECS[type])) {
        const v = SPECS[type][k];
        spec[k] = Array.isArray(v) ? v.map(c2 => shiftHueHex(c2, dh)) : shiftHueHex(v, dh);
      }
    }
    const baseColor = dh ? shiftHueHex(opts.color || '#8899aa', dh) : (opts.color || '#8899aa');

    /* بقع اليابسة / الفوهات */
    const blobs = [];
    if (type === 'earth' || type === 'crater' || type === 'plain') {
      const count = type === 'earth' ? 5 : 4;
      for (let i = 0; i < count; i++) {
        blobs.push({
          x: N * 0.2 + rnd() * N * 0.6,
          y: N * 0.2 + rnd() * N * 0.6,
          r: type === 'earth' ? 2.2 + rnd() * 3.2 : 1.2 + rnd() * 2.1,
        });
      }
    }

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const dx = (x - c + 0.5) / pr;
        const dy = (y - c + 0.5) / pr;
        const d2 = dx * dx + dy * dy;

        /* حلقة قوس قزح (تمر خلف الكوكب أعلاه وأمامه أسفله) */
        if (type === 'ring') {
          const rx = dx / 1.62, ry = dy / 0.44;
          const rd = rx * rx + ry * ry;
          if (rd > 0.8 && rd < 1.2 && (d2 > 1 || dy > 0.12)) {
            const colors = spec.ring;
            const xr = (rx + 1.62) / 3.24; /* موضع نسبي على امتداد الحلقة نفسها */
            const t = Math.min(colors.length - 1, Math.max(0, Math.floor(xr * colors.length)));
            ctx.fillStyle = shade(colors[t], dy > 0 ? 1.05 : 0.8);
            ctx.fillRect(x, y, 1, 1);
            continue;
          }
        }
        if (d2 > 1) continue;

        let col, mul = 1;
        if (type === 'bands') {
          const b = spec.bands;
          const wob = rnd() < 0.22 ? 1 : 0;
          col = b[Math.abs(Math.floor((y / N) * b.length + wob)) % b.length];
        } else if (type === 'earth') {
          /* بلا قطبين — أخضر وأزرق فقط حسب الطلب */
          col = spec.base[(x + y) % 2 === 0 ? 0 : 1];
          for (const bl of blobs) {
            const bdx = x - bl.x, bdy = y - bl.y;
            if (bdx * bdx + bdy * bdy < bl.r * bl.r) { col = spec.land[(x * 3 + y) % 2 === 0 ? 0 : 1]; break; }
          }
        } else if (type === 'swirl') {
          col = spec.base[y % 5 === 0 ? 1 : 0];
          const wave = Math.sin(y * 0.9 + seed) * 2.2;
          if ((x + Math.round(wave) + y) % 6 < 2) col = spec.streak;
        } else if (type === 'crater') {
          col = spec.base[(x + y * 2) % 3 === 0 ? 1 : 0];
          for (const bl of blobs) {
            const bdx = x - bl.x, bdy = y - bl.y;
            const dd = bdx * bdx + bdy * bdy;
            if (dd < bl.r * bl.r) col = spec.dark;
            else if (dd < (bl.r + 0.9) * (bl.r + 0.9) && bdy < 0) col = spec.rim;
          }
        } else if (type === 'ring') {
          col = (x + y) % 2 === 0 ? spec.base[0] : spec.base[1];
          if (rnd() < 0.08) col = spec.dark;
        } else { /* plain — كوكب مخصص بلونه */
          col = baseColor;
          for (const bl of blobs) {
            const bdx = x - bl.x, bdy = y - bl.y;
            if (bdx * bdx + bdy * bdy < bl.r * bl.r) { mul = 0.78; break; }
          }
        }

        /* إضاءة من أعلى-يسار مع دذرنق كلاسيكي */
        const lum = -(dx * 0.58 + dy * 0.58);
        const dith = ((x + y) % 2) * 0.06;
        let f = 1;
        if (lum > 0.5 - dith) f = 1.35;
        else if (lum > 0.18 - dith) f = 1.12;
        else if (lum < -0.48 + dith) f = 0.5;
        else if (lum < -0.2 + dith) f = 0.72;
        if (d2 > 0.82) f *= 0.82;
        ctx.fillStyle = shade(col, f * mul);
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return cv;
  };

  /* شمس بكسلية — لوحة ألوان حسب مستوى الإنتاجية */
  const SUN_PALETTES = {
    gold:  ['#fff8d0', '#ffe27a', '#ffb62e', '#ff8b1f', '#f26816'],
    idle:  ['#fff8d0', '#ffe27a', '#ffb62e', '#ff8b1f', '#f26816'],
    white: ['#ffffff', '#f2f6fb', '#dbe4ee', '#b9c6d6', '#94a7bc'],
    green: ['#effff5', '#9df5bd', '#4ade80', '#22b45f', '#0e8a48'],
    red:   ['#ffecec', '#ffb1b1', '#ff6666', '#e03131', '#a61e1e'],
  };
  P.sun = function (tier) {
    const pal = SUN_PALETTES[tier] || SUN_PALETTES.gold;
    const N = 34;
    const cv = document.createElement('canvas');
    cv.width = N; cv.height = N;
    const ctx = cv.getContext('2d');
    const c = N / 2, r = N * 0.355;
    const rnd = mulberry32(991);

    /* أشعة بكسلية حول القرص */
    const rays = 12;
    for (let i = 0; i < rays; i++) {
      const a = (i / rays) * Math.PI * 2 + 0.26;
      const len = r + (i % 2 === 0 ? 4.4 : 2.4);
      for (let s = r + 1.2; s <= len; s += 1) {
        const px = Math.round(c + Math.cos(a) * s - 0.5);
        const py = Math.round(c + Math.sin(a) * s - 0.5);
        ctx.fillStyle = pal[s > r + 2.5 ? 3 : 2];
        ctx.fillRect(px, py, 1, 1);
      }
    }

    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        const dx = (x - c + 0.5) / r, dy = (y - c + 0.5) / r;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > 1.08) continue;
        if (d > 1 && rnd() > 0.35) continue;
        let idx;
        if (d < 0.42) idx = 0;
        else if (d < 0.68) idx = 1;
        else if (d < 0.88) idx = 2;
        else idx = 3;
        if (rnd() < 0.25 && idx < 3) idx += 1; /* ضجيج لهب */
        ctx.fillStyle = pal[idx];
        ctx.fillRect(x, y, 1, 1);
      }
    }
    return cv;
  };

  SM.pixel = P;
})();
