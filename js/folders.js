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

  TEX.deer = function (ctx, W, H, seed) {
    const r = rnd(seed);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#c69256'); g.addColorStop(1, '#9c6a37');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // خط ظهر داكن في المنتصف (كالغزال)
    const dg = ctx.createLinearGradient(W * 0.38, 0, W * 0.62, 0);
    dg.addColorStop(0, 'rgba(90,55,26,0)'); dg.addColorStop(0.5, 'rgba(78,46,20,.5)'); dg.addColorStop(1, 'rgba(90,55,26,0)');
    ctx.fillStyle = dg; ctx.fillRect(W * 0.3, 0, W * 0.4, H);
    // شعر
    ctx.lineWidth = 1.3; ctx.lineCap = 'round';
    const n = Math.floor(W * H / 30);
    for (let i = 0; i < n; i++) {
      const x = r() * W, y = r() * H, len = 5 + r() * 8, ang = -Math.PI / 2 + (r() - 0.5) * 0.9, sh = 0.6 + r() * 0.6;
      ctx.strokeStyle = `rgba(${Math.round(190 * sh)},${Math.round(140 * sh)},${Math.round(80 * sh)},.6)`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len); ctx.stroke();
    }
    // بقع بيضاء بصفوف (كالغزال) مع حواف مشعّرة
    for (let row = 0; row < 7; row++) {
      for (let col = 0; col < 8; col++) {
        if (r() < 0.25) continue;
        const x = (col + (row % 2 ? 0.5 : 0)) * W / 7 + (r() - 0.5) * 14;
        const y = row * H / 6 + (r() - 0.5) * 12 + H * 0.05;
        const rad = 6 + r() * 5;
        const rg = ctx.createRadialGradient(x, y, 1, x, y, rad);
        rg.addColorStop(0, 'rgba(250,246,236,.95)'); rg.addColorStop(0.7, 'rgba(245,238,224,.7)'); rg.addColorStop(1, 'rgba(245,238,224,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
        // خصلات شعر فوق البقعة
        ctx.strokeStyle = 'rgba(255,252,244,.5)'; ctx.lineWidth = 1;
        for (let k = 0; k < 5; k++) { const a = r() * 7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); ctx.stroke(); }
      }
    }
  };

  TEX.water = function (ctx, W, H, seed) {
    const r = rnd(seed);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#3fb6c4'); g.addColorStop(0.5, '#2591a6'); g.addColorStop(1, '#177387');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // موجات
    for (let i = 0; i < 26; i++) {
      const y = r() * H, amp = 4 + r() * 10, light = r() > 0.5;
      ctx.strokeStyle = light ? 'rgba(180,235,240,.35)' : 'rgba(10,60,80,.3)';
      ctx.lineWidth = 2 + r() * 4;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 8) { const yy = y + Math.sin(x / (18 + r() * 14) + i) * amp; if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.stroke();
    }
    // رغوة بيضاء
    for (let i = 0; i < W * H / 22; i++) {
      const x = r() * W, y = r() * H, s = r() * 1.8 + 0.4;
      ctx.fillStyle = `rgba(255,255,255,${0.12 + r() * 0.45})`;
      ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.fill();
    }
    // خطوط رغوة متموّجة
    ctx.strokeStyle = 'rgba(255,255,255,.5)'; ctx.lineWidth = 1.4;
    for (let i = 0; i < 8; i++) {
      const y = r() * H; ctx.beginPath();
      for (let x = 0; x <= W; x += 10) { const yy = y + Math.sin(x / 22 + i * 2) * 6; if (x === 0) ctx.moveTo(x, yy); else ctx.lineTo(x, yy); }
      ctx.globalAlpha = 0.3 + r() * 0.3; ctx.stroke(); ctx.globalAlpha = 1;
    }
  };

  TEX.sand = function (ctx, W, H, seed) {
    const r = rnd(seed);
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#dccaa0'); g.addColorStop(1, '#bda676');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // كثبان ناعمة (إضاءة 3D)
    for (let i = 0; i < 7; i++) {
      const x = r() * W, y = r() * H, rad = W * (0.14 + r() * 0.2);
      const rg = ctx.createRadialGradient(x - rad * 0.3, y - rad * 0.3, rad * 0.1, x, y, rad);
      rg.addColorStop(0, 'rgba(248,238,210,.5)'); rg.addColorStop(1, 'rgba(248,238,210,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, rad, 0, 7); ctx.fill();
      const dx = r() * W, dy = r() * H, dr = W * (0.1 + r() * 0.16);
      const dgd = ctx.createRadialGradient(dx, dy, dr * 0.1, dx, dy, dr);
      dgd.addColorStop(0, 'rgba(120,95,55,.25)'); dgd.addColorStop(1, 'rgba(120,95,55,0)');
      ctx.fillStyle = dgd; ctx.beginPath(); ctx.arc(dx, dy, dr, 0, 7); ctx.fill();
    }
    // حبيبات
    for (let i = 0; i < W * H / 6; i++) {
      const x = r() * W, y = r() * H, s = 0.5 + r() * 1.3, d = r();
      ctx.fillStyle = d > 0.5 ? `rgba(110,88,50,${0.1 + r() * 0.22})` : `rgba(250,242,215,${0.1 + r() * 0.3})`;
      ctx.fillRect(x, y, s, s);
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

    // ظل خارجي عميق (إحساس 3D)
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,.5)'; ctx.shadowBlur = 22; ctx.shadowOffsetY = 12;

    // الخلفية (أغمق قليلًا)
    backPath(ctx, W, H); ctx.save(); ctx.clip();
    tex(ctx, W, H, seed + 3, opts.color);
    ctx.fillStyle = 'rgba(0,0,0,.34)'; ctx.fillRect(0, 0, W, H); // تعتيم الخلف
    // حافة اللسان العلوية (إضاءة)
    const tg = ctx.createLinearGradient(0, H * 0.11, 0, H * 0.24);
    tg.addColorStop(0, 'rgba(255,255,255,.22)'); tg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = tg; ctx.fillRect(0, H * 0.11, W, H * 0.14);
    ctx.restore();
    ctx.restore();

    // ورقة بيضاء تطلّ بظل خفيف
    const pT = H * 0.20;
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 3;
    ctx.fillStyle = '#f6f3ec';
    roundRect(ctx, W * 0.12, pT - 6, W * 0.52, H * 0.2, 8); ctx.fill();
    ctx.restore();

    // الواجهة الأمامية بالنقش الكامل
    frontPath(ctx, W, H); ctx.save(); ctx.clip();
    tex(ctx, W, H, seed, opts.color);
    // ظل داخلي أعلى الجيب (عمق ثلاثي الأبعاد)
    const innerTop = ctx.createLinearGradient(0, H * 0.32, 0, H * 0.44);
    innerTop.addColorStop(0, 'rgba(0,0,0,.34)'); innerTop.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = innerTop; ctx.fillRect(0, H * 0.32, W, H * 0.14);
    // لمعة الشفة العلوية للجيب
    const lip = ctx.createLinearGradient(0, H * 0.32, 0, H * 0.37);
    lip.addColorStop(0, 'rgba(255,255,255,.4)'); lip.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = lip; ctx.fillRect(0, H * 0.315, W, H * 0.05);
    // تعتيم القاع والحواف (حجم/عمق)
    const bot = ctx.createLinearGradient(0, H * 0.6, 0, H);
    bot.addColorStop(0, 'rgba(0,0,0,0)'); bot.addColorStop(1, 'rgba(0,0,0,.28)');
    ctx.fillStyle = bot; ctx.fillRect(0, H * 0.6, W, H * 0.4);
    const side = ctx.createLinearGradient(0, 0, W, 0);
    side.addColorStop(0, 'rgba(0,0,0,.18)'); side.addColorStop(0.15, 'rgba(0,0,0,0)');
    side.addColorStop(0.85, 'rgba(0,0,0,0)'); side.addColorStop(1, 'rgba(0,0,0,.2)');
    ctx.fillStyle = side; ctx.fillRect(0, H * 0.32, W, H);
    ctx.restore();

    // حدّ خفيف
    frontPath(ctx, W, H); ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 1.5; ctx.stroke();
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
