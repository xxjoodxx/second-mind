/* Second Mind — مولّد أشكال المجلدات الإبداعية (كانفس، عالي الجودة، بدون صور خارجية) */
(function () {
  const F = {};

  function rnd(seed) {
    let a = seed >>> 0;
    return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }

  /* مسار ظرف المجلد (خلفية + لسان) بأسلوب أيقونة الملفات */
  function backPath(ctx, W, H) {
    const tabTop = H * 0.11, bodyTop = H * 0.22, tabW = W * 0.46, r = 20;
    ctx.beginPath();
    ctx.moveTo(r, tabTop);
    ctx.lineTo(tabW - 18, tabTop);
    ctx.quadraticCurveTo(tabW + 2, tabTop, tabW + 20, bodyTop);
    ctx.lineTo(W - r, bodyTop);
    ctx.arcTo(W, bodyTop, W, bodyTop + r, r);
    ctx.lineTo(W, H - r);
    ctx.arcTo(W, H, W - r, H, r);
    ctx.lineTo(r, H);
    ctx.arcTo(0, H, 0, H - r, r);
    ctx.lineTo(0, tabTop + r);
    ctx.arcTo(0, tabTop, r, tabTop, r);
    ctx.closePath();
  }
  function frontPath(ctx, W, H) {
    const top = H * 0.32, r = 20;
    ctx.beginPath();
    ctx.moveTo(r, top);
    ctx.lineTo(W - r, top);
    ctx.arcTo(W, top, W, top + r, r);
    ctx.lineTo(W, H - r);
    ctx.arcTo(W, H, W - r, H, r);
    ctx.lineTo(r, H);
    ctx.arcTo(0, H, 0, H - r, r);
    ctx.lineTo(0, top + r);
    ctx.arcTo(0, top, r, top, r);
    ctx.closePath();
  }

  /* ---------- نقوش (تملأ مستطيلًا داخل قصّ) ---------- */
  const TEX = {};

  TEX.spiky = function (ctx, W, H, seed) {
    const r = rnd(seed);
    ctx.fillStyle = '#141416'; ctx.fillRect(0, 0, W, H);
    const step = Math.max(9, W / 26);
    for (let y = -step; y < H + step; y += step * 0.86) {
      for (let x = -step; x < W + step; x += step) {
        const jx = x + (r() - 0.5) * step * 0.5 + (Math.floor(y / step) % 2 ? step / 2 : 0);
        const jy = y + (r() - 0.5) * step * 0.4;
        const rad = step * (0.42 + r() * 0.16);
        const g = ctx.createRadialGradient(jx - rad * 0.3, jy - rad * 0.4, rad * 0.1, jx, jy, rad);
        g.addColorStop(0, 'rgba(120,120,128,.95)');
        g.addColorStop(0.35, 'rgba(60,60,66,.8)');
        g.addColorStop(1, 'rgba(6,6,8,0)');
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(jx, jy, rad, 0, 7); ctx.fill();
      }
    }
  };

  TEX.watermelon = function (ctx, W, H, seed) {
    const r = rnd(seed);
    // قشرة خضراء بخطوط
    const base = ctx.createLinearGradient(0, 0, 0, H);
    base.addColorStop(0, '#4a8f2e'); base.addColorStop(1, '#2f6b1e');
    ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = W * 0.05;
    for (let i = -1; i < 14; i++) {
      ctx.strokeStyle = i % 2 ? 'rgba(20,60,16,.55)' : 'rgba(120,180,70,.35)';
      ctx.beginPath();
      const x = i * W / 12;
      ctx.moveTo(x, 0);
      ctx.bezierCurveTo(x + W * 0.03, H * 0.4, x - W * 0.03, H * 0.6, x + W * 0.02, H);
      ctx.stroke();
    }
    // لبّ أحمر في الأعلى مع بذور
    const flesh = ctx.createLinearGradient(0, 0, 0, H * 0.5);
    flesh.addColorStop(0, '#ff5b6e'); flesh.addColorStop(1, '#e8324b');
    ctx.fillStyle = flesh;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H * 0.34);
    ctx.quadraticCurveTo(W * 0.5, H * 0.46, 0, H * 0.34); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.globalAlpha = 0.5;
    ctx.fillRect(0, H * 0.30, W, H * 0.03); ctx.globalAlpha = 1; // حدّ فاتح بين اللب والقشرة
    ctx.fillStyle = '#2a1410';
    for (let i = 0; i < 16; i++) {
      const sx = r() * W, sy = r() * H * 0.28 + H * 0.02;
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(r() * 6);
      ctx.beginPath(); ctx.ellipse(0, 0, W * 0.012, W * 0.022, 0, 0, 7); ctx.fill(); ctx.restore();
    }
  };

  TEX.fur = function (ctx, W, H, seed) {
    const r = rnd(seed);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#8fd14a'); g.addColorStop(1, '#5fa32c');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.lineWidth = 1.4; ctx.lineCap = 'round';
    const n = Math.floor(W * H / 26);
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = r() * H, len = 5 + r() * 9, ang = -Math.PI / 2 + (r() - 0.5) * 1.1;
      const sh = 0.55 + r() * 0.7;
      ctx.strokeStyle = `rgba(${Math.round(120 * sh)},${Math.round(190 * sh)},${Math.round(70 * sh)},.7)`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke();
    }
  };

  TEX.cloud = function (ctx, W, H, seed) {
    const r = rnd(seed);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#eef3fb'); g.addColorStop(1, '#c9d4e6');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      const x = r() * W, y = r() * H, rad = W * (0.06 + r() * 0.12);
      const light = r() > 0.5;
      const rg = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.3, rad * 0.1, x, y, rad);
      rg.addColorStop(0, light ? 'rgba(255,255,255,.9)' : 'rgba(190,202,222,.5)');
      rg.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg;
      ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
    }
  };

  TEX.cork = function (ctx, W, H, seed) {
    const r = rnd(seed);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#d9a566'); g.addColorStop(1, '#b07d3f');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < W * H / 12; i++) {
      const x = r() * W, y = r() * H, s = 1 + r() * 2.4;
      const d = r();
      ctx.fillStyle = d > 0.5 ? `rgba(90,55,20,${0.15 + r() * 0.25})` : `rgba(240,210,160,${0.12 + r() * 0.22})`;
      ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
    }
  };

  TEX.solid = function (ctx, W, H, seed, color) {
    const [cr, cg, cb] = hexRgb(color || '#f4b23e');
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `rgb(${Math.min(255, cr + 30)},${Math.min(255, cg + 30)},${Math.min(255, cb + 30)})`);
    g.addColorStop(1, `rgb(${Math.round(cr * 0.7)},${Math.round(cg * 0.7)},${Math.round(cb * 0.7)})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  };

  function hexRgb(hex) {
    const h = String(hex).replace('#', '').padEnd(6, '0');
    return [parseInt(h.slice(0, 2), 16) || 0, parseInt(h.slice(2, 4), 16) || 0, parseInt(h.slice(4, 6), 16) || 0];
  }
  function seedOf(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h) % 99999 + 7; }

  /* يبني أيقونة مجلد بنقش معيّن — يُرجع كانفس */
  F.make = function (kind, opts = {}) {
    const scale = 2; // جودة عالية
    const W = 300, H = 240;
    const cv = document.createElement('canvas');
    cv.width = W * scale; cv.height = H * scale;
    cv.style.width = '100%'; cv.style.height = 'auto';
    const ctx = cv.getContext('2d');
    ctx.scale(scale, scale);
    const seed = seedOf(opts.seed || kind);
    const tex = TEX[kind] || TEX.solid;

    // ظل ناعم
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;

    // الخلفية (أغمق قليلًا)
    backPath(ctx, W, H); ctx.save(); ctx.clip();
    tex(ctx, W, H, seed + 3, opts.color);
    ctx.fillStyle = 'rgba(0,0,0,.28)'; ctx.fillRect(0, 0, W, H); // تعتيم الخلف
    ctx.restore();
    ctx.restore();

    // ورقة بيضاء تطلّ
    const pT = H * 0.20;
    ctx.fillStyle = '#f5f2ea';
    roundRect(ctx, W * 0.12, pT - 6, W * 0.52, H * 0.2, 8); ctx.fill();

    // الواجهة الأمامية بالنقش الكامل
    frontPath(ctx, W, H); ctx.save(); ctx.clip();
    tex(ctx, W, H, seed, opts.color);
    // إضاءة علوية
    const lg = ctx.createLinearGradient(0, H * 0.32, 0, H);
    lg.addColorStop(0, 'rgba(255,255,255,.18)'); lg.addColorStop(0.15, 'rgba(255,255,255,0)');
    ctx.fillStyle = lg; ctx.fillRect(0, H * 0.32, W, H);
    ctx.restore();

    // حدّ خفيف
    frontPath(ctx, W, H); ctx.strokeStyle = 'rgba(255,255,255,.18)'; ctx.lineWidth = 1.5; ctx.stroke();
    return cv;
  };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  SM.folders = F;
})();
