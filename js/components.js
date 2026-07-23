/* Second Mind — مكوّنات واجهة قابلة لإعادة الاستخدام */
(function () {
  const U = SM.U, el = SM.el;
  const C = {};

  /* ---------- مربع لون أصلي (يفتح منتقي ألوان النظام عند الضغط) ---------- */
  C.colorSquare = function (value, onPick) {
    const inp = el('input', { type: 'color', class: 'color-square', value: value || '#5f72f5' });
    inp.addEventListener('input', () => onPick(inp.value));
    inp.addEventListener('change', () => onPick(inp.value));
    return inp;
  };

  /* ---------- تنبيهات ---------- */
  C.toast = function (msg) {
    const root = document.getElementById('toasts');
    const t = el('div', { class: 'toast' }, msg);
    root.append(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 400); }, 2600);
  };

  C.beep = function () {
    try {
      const a = new (window.AudioContext || window.webkitAudioContext)();
      const o = a.createOscillator(), g = a.createGain();
      o.connect(g); g.connect(a.destination);
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.1, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + 0.7);
      o.start(); o.stop(a.currentTime + 0.75);
    } catch (e) { /* لا صوت */ }
  };

  /* +XP طائرة */
  C.xpFloat = function (text, x, y) {
    const f = el('div', { class: 'xp-float' }, text);
    f.style.left = (x || window.innerWidth / 2) + 'px';
    f.style.top = (y || 140) + 'px';
    document.body.append(f);
    setTimeout(() => f.remove(), 1400);
  };

  /* ---------- نوافذ ---------- */
  C.modal = function (title, body, opts = {}) {
    const root = document.getElementById('modals');
    const close = () => { wrap.classList.remove('open'); setTimeout(() => wrap.remove(), 220); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    const wrap = el('div', { class: 'modal-wrap', on: { click: (e) => { if (e.target === wrap) close(); } } },
      el('div', { class: 'modal glass glass--sheen' + (opts.wide ? ' modal--wide' : '') },
        el('div', { class: 'modal__head' },
          el('div', { class: 'modal__title' }, title),
          el('button', { class: 'iconbtn', title: 'إغلاق', on: { click: close } }, '✕'),
        ),
        el('div', { class: 'modal__body' }, body),
      ),
    );
    root.append(wrap);
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => wrap.classList.add('open'));
    return { close, root: wrap };
  };

  C.confirm = function (msg, onYes) {
    const m = C.modal('تأكيد', el('div', {},
      el('p', { class: 'muted', style: 'margin-bottom:16px' }, msg),
      el('div', { class: 'row gap' },
        el('button', { class: 'btn btn--danger', on: { click: () => { m.close(); onYes(); } } }, 'نعم، متأكد'),
        el('button', { class: 'btn', on: { click: () => m.close() } }, 'إلغاء'),
      ),
    ));
  };

  /* ---------- بطاقات ---------- */
  C.card = function (title, kids, opts = {}) {
    return el('section', { class: 'card glass' + (opts.cls ? ' ' + opts.cls : '') },
      title ? el('div', { class: 'card__head' },
        el('div', {},
          el('h3', { class: 'card__title' }, opts.icon ? opts.icon + ' ' : '', title),
          opts.sub ? el('div', { class: 'card__sub' }, opts.sub) : null,
        ),
        opts.actions || null,
      ) : null,
      el('div', { class: 'card__body' }, kids),
    );
  };

  C.stat = function (label, value, opts = {}) {
    return el('div', { class: 'stat glass', style: opts.color ? `--sc:${opts.color}` : '' },
      el('div', { class: 'stat__top' },
        opts.icon ? el('span', { class: 'stat__icon' }, opts.icon) : null,
        el('span', { class: 'stat__label' }, label),
      ),
      el('div', { class: 'stat__value' }, value),
      opts.sub ? el('div', { class: 'stat__sub' }, opts.sub) : null,
      opts.extra || null,
    );
  };

  C.bar = function (pct, color, opts = {}) {
    const p = pct == null ? 0 : U.clamp(pct, 0, 100);
    return el('div', { class: 'bar' + (opts.slim ? ' bar--slim' : ''), title: opts.title || (pct == null ? 'لا بيانات' : p + '%') },
      el('div', { class: 'bar__fill', style: `width:${p}%;background:${color}` }),
    );
  };

  C.empty = function (icon, text) {
    return el('div', { class: 'empty' },
      el('div', { class: 'empty__icon' }, icon || '🛰️'),
      el('div', { class: 'empty__text' }, text || 'لا شيء هنا بعد'),
    );
  };

  C.chip = (text, color) => el('span', { class: 'chip', style: color ? `--cc:${color}` : '' }, text);

  C.countdownChip = function (dateKey) {
    const d = U.daysUntil(dateKey);
    if (d == null) return C.chip('بدون موعد');
    if (d < 0) return C.chip(`فات بـ ${-d} يوم`, '#f87171');
    if (d === 0) return C.chip('اليوم! 🔔', '#fbbf24');
    if (d === 1) return C.chip('غدًا', '#fb923c');
    return C.chip(`بعد ${d} يوم`, d <= 7 ? '#fb923c' : '#4ade80');
  };

  /* ---------- نماذج ---------- */
  function fieldInput(fd) {
    const base = { class: 'inp', name: fd.k, placeholder: fd.placeholder || '' };
    if (fd.type === 'select') {
      const s = el('select', { class: 'inp', name: fd.k });
      (fd.options || []).forEach(o => {
        const opt = typeof o === 'object' ? o : { v: o, label: o };
        s.append(el('option', { value: opt.v }, opt.label));
      });
      if (fd.value != null) s.value = fd.value;
      return s;
    }
    if (fd.type === 'textarea') return el('textarea', { ...base, rows: fd.rows || 3 }, fd.value || '');
    const i = el('input', { ...base, type: fd.type || 'text' });
    if (fd.min != null) i.min = fd.min;
    if (fd.max != null) i.max = fd.max;
    if (fd.step != null) i.step = fd.step;
    if (fd.value != null) i.value = fd.value;
    if (fd.type === 'date' && fd.value === 'today') i.value = U.todayKey();
    return i;
  }

  C.quickForm = function (fields, onSubmit, opts = {}) {
    const f = el('form', { class: 'qform' + (opts.stack ? ' qform--stack' : '') });
    const inputs = {};
    fields.forEach((fd, i) => {
      const inp = fieldInput(fd);
      inputs[fd.k] = { inp, fd };
      f.append(el('label', { class: 'qform__field', style: fd.grow ? 'flex:2 1 160px' : '' },
        el('span', { class: 'qform__label' }, fd.label),
        inp,
      ));
    });
    f.append(el('button', { class: 'btn btn--acc', type: 'submit' }, opts.label || '+ إضافة'));
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const values = {};
      let ok = true;
      for (const [k, { inp, fd }] of Object.entries(inputs)) {
        let v = inp.value;
        if (typeof v === 'string') v = v.trim();
        const required = fd.required !== false && fd.type !== 'textarea' && fd.type !== 'select';
        if (required && v === '') { ok = false; inp.classList.add('inp--err'); setTimeout(() => inp.classList.remove('inp--err'), 900); }
        values[k] = (fd.type === 'number' || fd.type === 'range') ? (v === '' ? 0 : Number(v)) : v;
      }
      if (!ok) return;
      onSubmit(values);
      f.reset();
      fields.forEach(fd => { if (fd.type === 'date' && fd.value === 'today') inputs[fd.k].inp.value = U.todayKey(); });
    });
    // قيم افتراضية للتاريخ
    fields.forEach(fd => { if (fd.type === 'date' && fd.value === 'today') inputs[fd.k].inp.value = U.todayKey(); });
    return f;
  };

  /* ---------- جدول عام ---------- */
  C.table = function (cfg) {
    const rows = cfg.rows();
    if (!rows.length) return C.empty(cfg.emptyIcon, cfg.empty);
    const t = el('table', { class: 'tbl' },
      el('thead', {}, el('tr', {},
        cfg.cols.map(c => el('th', {}, c.label)),
        cfg.onDelete ? el('th', { style: 'width:36px' }, '') : null,
      )),
      el('tbody', {}, rows.map((r, i) => el('tr', { class: cfg.rowClass ? cfg.rowClass(r) : '' },
        cfg.cols.map(c => {
          const v = c.render ? c.render(r, i) : r[c.k];
          return el('td', {}, v == null ? '—' : v);
        }),
        cfg.onDelete ? el('td', {},
          el('button', { class: 'iconbtn iconbtn--danger', title: 'حذف', on: { click: () => C.confirm('حذف هذا السجل نهائيًا؟', () => { cfg.onDelete(r, i); SM.store.save(); SM.refresh(); }) } }, '🗑'),
        ) : null,
      ))),
    );
    return el('div', { class: 'scroll-x' }, t);
  };

  /* ---------- قائمة بسيطة ---------- */
  C.list = function (cfg) {
    const items = cfg.get();
    const wrap = el('div', { class: 'slist' });
    if (!items.length) wrap.append(C.empty(cfg.emptyIcon || '🌫️', cfg.empty || 'القائمة فارغة'));
    items.forEach((it, i) => {
      wrap.append(el('div', { class: 'slist__item' + (cfg.checked && cfg.checked(it) ? ' done' : '') },
        cfg.onToggle ? el('button', {
          class: 'checkbtn' + (cfg.checked(it) ? ' on' : ''),
          on: { click: () => { cfg.onToggle(it); SM.store.save(); SM.refresh(); } },
        }, cfg.checked(it) ? '✓' : '') : null,
        el('div', { class: 'slist__text' }, cfg.render ? cfg.render(it) : (it.text || String(it))),
        cfg.meta ? el('div', { class: 'slist__meta' }, cfg.meta(it)) : null,
        cfg.onDelete ? el('button', {
          class: 'iconbtn iconbtn--danger', title: 'حذف',
          on: { click: () => { cfg.onDelete(it, i); SM.store.save(); SM.refresh(); } },
        }, '✕') : null,
      ));
    });
    if (cfg.onAdd) {
      const form = el('form', { class: 'slist__add' },
        el('input', { class: 'inp', placeholder: cfg.placeholder || 'أضف عنصرًا...' }),
        el('button', { class: 'btn btn--acc', type: 'submit' }, cfg.addLabel || '+'),
      );
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const inp = form.querySelector('input');
        const v = inp.value.trim();
        if (!v) return;
        cfg.onAdd(v); SM.store.save(); SM.refresh();
      });
      wrap.append(form);
    }
    return wrap;
  };

  /* ---------- لوحة العادات (قلب النظام) ---------- */
  C.habitBoard = function (planetId, opts = {}) {
    const S = SM.store.state;
    const days = U.lastNDays(7);
    const habits = S.habits.filter(h => h.planetId === planetId);
    const planet = SM.planetById(planetId);
    const areaIds = opts.areas || (planet && planet.defaultAreas) || SM.AREAS.map(a => a.id);

    const grid = el('div', { class: 'hboard' });
    // صف العناوين
    grid.append(el('div', { class: 'hboard__row hboard__row--head' },
      el('div', { class: 'hboard__name' }, 'العادة'),
      days.map(d => el('div', { class: 'hboard__day' + (d === U.todayKey() ? ' today' : '') },
        el('span', { class: 'hboard__dl' }, U.dayLetter(d)),
        el('span', { class: 'hboard__dn' }, d.slice(8)),
      )),
      el('div', { class: 'hboard__streak' }, '🔥'),
      el('div', { style: 'width:28px' }),
    ));

    if (!habits.length) grid.append(C.empty('🌱', 'لا عادات بعد — أضف أول عادة لتغذية الشمس ومربع التقدم'));

    habits.forEach(h => {
      const area = SM.areaById(h.area);
      grid.append(el('div', { class: 'hboard__row' },
        el('div', { class: 'hboard__name' },
          el('span', { class: 'dot', style: `background:${area.color}`, title: area.name }),
          el('span', {}, h.name),
        ),
        days.map(d => el('button', {
          class: 'hcell' + (h.log[d] ? ' on' : '') + (d === U.todayKey() ? ' today' : ''),
          style: `--hc:${area.color}`,
          title: U.fmtDate(d),
          on: {
            click: () => {
              if (h.log[d]) delete h.log[d]; else h.log[d] = true;
              SM.store.save(); SM.refresh();
            },
          },
        }, h.log[d] ? '✓' : '')),
        el('div', { class: 'hboard__streak' }, String(SM.calc.streak(h))),
        el('button', {
          class: 'iconbtn iconbtn--danger', title: 'حذف العادة',
          on: { click: () => C.confirm(`حذف عادة «${h.name}» وسجلّها؟`, () => { S.habits.splice(S.habits.indexOf(h), 1); SM.store.save(); SM.refresh(); }) },
        }, '✕'),
      ));
    });

    const form = C.quickForm([
      { k: 'name', label: 'عادة جديدة', placeholder: 'مثال: نوم مبكر', grow: true },
      { k: 'area', label: 'المجال', type: 'select', options: areaIds.map(id => ({ v: id, label: SM.areaById(id).name })) },
    ], (v) => {
      S.habits.push({ id: U.uid(), name: v.name, planetId, area: v.area || areaIds[0], createdAt: U.todayKey(), log: {} });
      SM.store.save(); C.toast('عادة جديدة في المدار 🌱'); SM.refresh();
    }, { label: '+ عادة' });

    return el('div', {}, grid, form,
      el('p', { class: 'hint' }, '⚡ كل علامة ✓ هنا تغذّي مربع التقدم في الواجهة ولون ضوء الشمس'));
  };

  /* ---------- رسوم بيانية ---------- */
  const SVG_NS = 'http://www.w3.org/2000/svg';
  function svg(tag, attrs) {
    const e = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs || {})) e.setAttribute(k, v);
    return e;
  }

  C.donut = function (data, opts = {}) {
    const total = U.sum(data, d => d.value);
    if (!total) return C.empty('🍩', opts.empty || 'لا بيانات للرسم بعد');
    const size = opts.size || 190, th = opts.thickness || 26;
    const r = (size - th) / 2, c = size / 2, CIRC = 2 * Math.PI * r;
    const s = svg('svg', { viewBox: `0 0 ${size} ${size}`, class: 'donut' });
    let acc = 0;
    data.forEach(d => {
      if (!d.value) return;
      const len = (d.value / total) * CIRC;
      const seg = svg('circle', {
        cx: c, cy: c, r, fill: 'none', stroke: d.color, 'stroke-width': th,
        'stroke-dasharray': `${len} ${CIRC - len}`, 'stroke-dashoffset': String(-acc),
        transform: `rotate(-90 ${c} ${c})`, 'stroke-linecap': 'butt',
      });
      s.append(seg);
      acc += len;
    });
    const center = el('div', { class: 'donut__center' },
      el('div', { class: 'donut__val' }, opts.centerTitle || U.money(total)),
      el('div', { class: 'donut__sub' }, opts.centerSub || ''),
    );
    const legend = el('div', { class: 'legend' }, data.filter(d => d.value).map(d =>
      el('div', { class: 'legend__item' },
        el('span', { class: 'dot', style: `background:${d.color}` }),
        el('span', { class: 'legend__label' }, d.label),
        el('span', { class: 'legend__val' }, (opts.fmt || U.money)(d.value), ` · ${U.pct(d.value, total)}%`),
      )));
    return el('div', { class: 'donut-wrap' }, el('div', { class: 'donut-box' }, s, center), legend);
  };

  /* أعمدة (div-based) — groups: [{label, bars:[{v,color,title}]}] */
  C.colChart = function (groups, opts = {}) {
    const max = Math.max(1, ...groups.flatMap(g => g.bars.map(b => b.v)));
    return el('div', { class: 'cchart', style: `--h:${opts.height || 150}px` },
      groups.map(g => el('div', { class: 'cchart__col' },
        el('div', { class: 'cchart__bars' },
          g.bars.map(b => el('div', {
            class: 'cchart__bar',
            style: `height:${Math.max(3, (b.v / max) * 100)}%;background:${b.color}`,
            title: `${b.title || g.label}: ${(opts.fmt || U.num)(b.v)}`,
          })),
        ),
        el('div', { class: 'cchart__label' }, g.label),
      )),
    );
  };

  /* خط — {points:[{label,value}], min, max, color} */
  C.lineChart = function (cfg) {
    const pts = cfg.points || [];
    if (pts.length < 2) return C.empty('📈', cfg.empty || 'نحتاج نقطتين على الأقل لرسم الخط');
    const W = 640, H = cfg.height || 170, pad = 26;
    const vals = pts.map(p => p.value);
    const min = cfg.min != null ? cfg.min : Math.min(...vals);
    const max = cfg.max != null ? cfg.max : Math.max(...vals);
    const span = (max - min) || 1;
    const x = (i) => pad + (i / (pts.length - 1)) * (W - pad * 2);
    const y = (v) => H - pad - ((v - min) / span) * (H - pad * 2);
    const s = svg('svg', { viewBox: `0 0 ${W} ${H}`, class: 'lchart', preserveAspectRatio: 'none' });
    // شبكة خفيفة
    for (let i = 0; i <= 3; i++) {
      const gy = pad + (i / 3) * (H - pad * 2);
      s.append(svg('line', { x1: pad, x2: W - pad, y1: gy, y2: gy, stroke: 'rgba(255,255,255,.08)', 'stroke-width': 1 }));
    }
    const ptStr = pts.map((p, i) => `${x(i)},${y(p.value)}`).join(' ');
    const area = svg('polygon', {
      points: `${pad},${H - pad} ${ptStr} ${W - pad},${H - pad}`,
      fill: cfg.color, opacity: 0.12,
    });
    s.append(area);
    s.append(svg('polyline', { points: ptStr, fill: 'none', stroke: cfg.color, 'stroke-width': 3, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    pts.forEach((p, i) => {
      const dot = svg('circle', { cx: x(i), cy: y(p.value), r: 4.5, fill: cfg.color });
      dot.append(svg('title', {}));
      dot.querySelector('title').textContent = `${p.label}: ${p.value}`;
      s.append(dot);
    });
    const lbls = el('div', { class: 'lchart__labels' },
      el('span', {}, pts[0].label),
      pts.length > 2 ? el('span', {}, pts[Math.floor(pts.length / 2)].label) : null,
      el('span', {}, pts[pts.length - 1].label),
    );
    return el('div', {}, s, lbls);
  };

  /* ---------- تقويم شهري ---------- */
  C.calendar = function (getEvents) {
    let cur = new Date();
    const box = el('div', { class: 'cal glass-soft' });
    function paint() {
      box.innerHTML = '';
      const y = cur.getFullYear(), m = cur.getMonth();
      const title = new Intl.DateTimeFormat('ar', { month: 'long', year: 'numeric' }).format(cur);
      box.append(el('div', { class: 'cal__head' },
        el('button', { class: 'iconbtn', on: { click: () => { cur = new Date(y, m - 1, 1); paint(); } } }, '❮'),
        el('div', { class: 'cal__title' }, title),
        el('button', { class: 'iconbtn', on: { click: () => { cur = new Date(y, m + 1, 1); paint(); } } }, '❯'),
      ));
      const names = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
      const grid = el('div', { class: 'cal__grid' }, names.map(n => el('div', { class: 'cal__wd' }, n)));
      const first = new Date(y, m, 1);
      const startOffset = first.getDay();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      const today = U.todayKey();
      for (let i = 0; i < startOffset; i++) grid.append(el('div', { class: 'cal__cell cal__cell--pad' }));
      for (let d = 1; d <= daysInMonth; d++) {
        const key = U.todayKey(new Date(y, m, d));
        const evs = getEvents(key) || [];
        grid.append(el('div', {
          class: 'cal__cell' + (key === today ? ' today' : ''),
          title: evs.map(e => e.title).join('\n') || '',
        },
          el('span', { class: 'cal__num' }, String(d)),
          evs.length ? el('div', { class: 'cal__dots' }, evs.slice(0, 3).map(e => el('span', { class: 'dot', style: `background:${e.color}` }))) : null,
        ));
      }
      box.append(grid);
    }
    paint();
    return box;
  };

  /* ---------- الصور ---------- */
  C.pickImage = function (opts = {}) {
    return new Promise((resolve) => {
      const input = el('input', { type: 'file', accept: 'image/*', style: 'display:none' });
      document.body.append(input);
      input.addEventListener('change', () => {
        const file = input.files && input.files[0];
        input.remove();
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = () => {
          const img = new Image();
          img.onload = () => {
            const maxW = opts.max || 1600;
            const scale = Math.min(1, maxW / img.width);
            const cv = document.createElement('canvas');
            cv.width = Math.round(img.width * scale);
            cv.height = Math.round(img.height * scale);
            cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
            resolve(cv.toDataURL('image/jpeg', opts.quality || 0.82));
          };
          img.onerror = () => resolve(null);
          img.src = reader.result;
        };
        reader.readAsDataURL(file);
      });
      input.click();
    });
  };

  C.imageBtn = function (label, onData, opts = {}) {
    return el('button', {
      class: opts.cls || 'btn',
      on: {
        click: async () => {
          const data = await C.pickImage(opts);
          if (data) { onData(data); SM.store.save(); SM.refresh(); }
        },
      },
    }, label);
  };

  /* ---------- بطاقات مراجعة (Flashcards) ---------- */
  C.flash = function (getArr) {
    const arr = getArr();
    const known = arr.filter(f => f.known).length;

    function review() {
      if (!arr.length) return C.toast('أضف بطاقات أولًا');
      let order = arr.map((_, i) => i);
      let i = 0, flipped = false;
      const cardEl = el('div', { class: 'fcard', on: { click: () => { flipped = !flipped; paint(); } } });
      const counter = el('div', { class: 'muted center' });
      function paint() {
        const f = arr[order[i]];
        cardEl.className = 'fcard' + (flipped ? ' flipped' : '') + (f.known ? ' known' : '');
        cardEl.innerHTML = '';
        cardEl.append(
          el('div', { class: 'fcard__tag' }, flipped ? 'الإجابة' : 'السؤال'),
          el('div', { class: 'fcard__text' }, flipped ? f.back : f.front),
          el('div', { class: 'fcard__hint' }, 'اضغط للقلب'),
        );
        counter.textContent = `${i + 1} / ${order.length}` + (f.known ? ' · أتقنتها ✓' : '');
      }
      const nav = el('div', { class: 'row gap center wrap' },
        el('button', { class: 'btn', on: { click: () => { i = (i - 1 + order.length) % order.length; flipped = false; paint(); } } }, '⏭ السابق'),
        el('button', { class: 'btn btn--acc', on: { click: () => { i = (i + 1) % order.length; flipped = false; paint(); } } }, 'التالي ⏮'),
        el('button', { class: 'btn', on: { click: () => { order.sort(() => Math.random() - 0.5); i = 0; flipped = false; paint(); } } }, '🔀 خلط'),
        el('button', {
          class: 'btn', on: {
            click: () => { const f = arr[order[i]]; f.known = !f.known; SM.store.save(); paint(); },
          },
        }, '✓ أتقنتها'),
      );
      paint();
      C.modal('مراجعة البطاقات', el('div', {}, cardEl, counter, nav), { wide: true });
    }

    return el('div', {},
      el('div', { class: 'row gap wrap', style: 'margin-bottom:12px' },
        C.chip(`${arr.length} بطاقة`), C.chip(`${known} متقنة`, '#4ade80'),
        el('button', { class: 'btn btn--acc', on: { click: review } }, '🎴 ابدأ المراجعة'),
      ),
      C.quickForm([
        { k: 'front', label: 'الوجه (سؤال/مصطلح)', grow: true },
        { k: 'back', label: 'الظهر (الإجابة)', grow: true },
      ], (v) => { arr.push({ id: U.uid(), front: v.front, back: v.back, known: false }); SM.store.save(); SM.refresh(); }),
      C.table({
        rows: () => arr.slice().reverse(),
        cols: [
          { label: 'الوجه', render: r => r.front },
          { label: 'الظهر', render: r => r.back },
          { label: 'الحالة', render: r => r.known ? C.chip('متقنة', '#4ade80') : C.chip('قيد الحفظ', '#94a3b8') },
        ],
        onDelete: (r) => arr.splice(arr.indexOf(r), 1),
        empty: 'لا بطاقات بعد — أضف أول بطاقة مراجعة',
        emptyIcon: '🎴',
      }),
    );
  };

  /* ---------- بومودورو (محرك عام يبقى شغالًا أثناء التنقل) ---------- */
  SM.pomo = SM.pomo || {
    focusLen: 25 * 60, breakLen: 5 * 60,
    mode: 'focus', left: 25 * 60, running: false, doneToday: 0, _iv: null,
    setFocus(mins) { this.focusLen = mins * 60; if (this.mode === 'focus' && !this.running) { this.left = this.focusLen; } this.paint(); },
    start() {
      if (this.running) return;
      this.running = true;
      this._iv = setInterval(() => this.tick(), 1000);
      this.paint();
    },
    pause() { this.running = false; clearInterval(this._iv); this.paint(); },
    reset() { this.pause(); this.left = this.mode === 'focus' ? this.focusLen : this.breakLen; this.paint(); },
    tick() {
      this.left--;
      if (this.left <= 0) this.complete();
      this.paint();
    },
    complete() {
      C.beep();
      if (this.mode === 'focus') {
        const S = SM.store.state;
        S.study.sessions.push({ id: U.uid(), date: U.todayKey(), minutes: Math.round(this.focusLen / 60), source: 'pomodoro' });
        SM.store.save();
        this.doneToday++;
        C.toast('🍅 جلسة تركيز مكتملة! أُضيفت لساعات المذاكرة');
        this.mode = 'break'; this.left = this.breakLen;
      } else {
        C.toast('☕ انتهت الاستراحة — جولة جديدة؟');
        this.mode = 'focus'; this.left = this.focusLen;
      }
      this.pause();
    },
    paint() {
      const t = document.getElementById('pomo-time');
      if (!t) return;
      const mm = String(Math.floor(this.left / 60)).padStart(2, '0');
      const ss = String(this.left % 60).padStart(2, '0');
      t.textContent = `${mm}:${ss}`;
      const lbl = document.getElementById('pomo-mode');
      if (lbl) lbl.textContent = this.mode === 'focus' ? '🎯 وقت التركيز' : '☕ استراحة';
      const btn = document.getElementById('pomo-toggle');
      if (btn) btn.textContent = this.running ? '⏸ إيقاف مؤقت' : '▶ ابدأ';
      const ring = document.getElementById('pomo-ring');
      if (ring) {
        const total = this.mode === 'focus' ? this.focusLen : this.breakLen;
        const frac = 1 - this.left / total;
        const CIRC = 2 * Math.PI * 54;
        ring.setAttribute('stroke-dashoffset', String(CIRC * (1 - frac)));
      }
    },
  };

  C.pomodoro = function () {
    const CIRC = 2 * Math.PI * 54;
    const s = svg('svg', { viewBox: '0 0 120 120', class: 'pomo__svg' });
    s.append(svg('circle', { cx: 60, cy: 60, r: 54, fill: 'none', stroke: 'rgba(255,255,255,.1)', 'stroke-width': 8 }));
    const prog = svg('circle', {
      id: 'pomo-ring', cx: 60, cy: 60, r: 54, fill: 'none', stroke: '#fb7185', 'stroke-width': 8,
      'stroke-linecap': 'round', 'stroke-dasharray': String(CIRC), 'stroke-dashoffset': String(CIRC),
      transform: 'rotate(-90 60 60)',
    });
    s.append(prog);
    const box = el('div', { class: 'pomo' },
      el('div', { class: 'pomo__ringwrap' }, s,
        el('div', { class: 'pomo__center' },
          el('div', { id: 'pomo-time', class: 'pomo__time' }, '25:00'),
          el('div', { id: 'pomo-mode', class: 'pomo__mode' }, '🎯 وقت التركيز'),
        ),
      ),
      el('div', { class: 'row gap center wrap' },
        el('button', { id: 'pomo-toggle', class: 'btn btn--acc', on: { click: () => SM.pomo.running ? SM.pomo.pause() : SM.pomo.start() } }, '▶ ابدأ'),
        el('button', { class: 'btn', on: { click: () => SM.pomo.reset() } }, '↺ تصفير'),
        el('select', {
          class: 'inp', style: 'max-width:110px',
          on: { change: (e) => SM.pomo.setFocus(Number(e.target.value)) },
        },
          el('option', { value: 25, selected: SM.pomo.focusLen === 1500 }, '25 دقيقة'),
          el('option', { value: 50, selected: SM.pomo.focusLen === 3000 }, '50 دقيقة'),
        ),
      ),
    );
    setTimeout(() => SM.pomo.paint(), 0);
    return box;
  };

  /* ---------- تمرين تنفّس ---------- */
  C.breath = function () {
    const PHASES = [
      { label: 'شهيق من الأنف', sec: 4, cls: 'inhale' },
      { label: 'احبس النفس', sec: 4, cls: 'hold' },
      { label: 'زفير بطيء', sec: 6, cls: 'exhale' },
    ];
    let running = false, pi = 0, left = PHASES[0].sec, cycles = 0, iv = null;
    const circle = el('div', { class: 'breath__circle' }, el('span', { class: 'breath__count' }, '4'));
    const label = el('div', { class: 'breath__label' }, 'جاهز؟ خذ وضعية مريحة');
    const cyc = el('div', { class: 'muted center' }, 'الدورات: 0');
    const btn = el('button', { class: 'btn btn--acc', on: { click: toggle } }, '▶ ابدأ التمرين');

    function paint() {
      circle.className = 'breath__circle ' + (running ? PHASES[pi].cls : '');
      circle.querySelector('.breath__count').textContent = String(left);
      label.textContent = running ? PHASES[pi].label : 'جاهز؟ خذ وضعية مريحة';
      cyc.textContent = `الدورات المكتملة: ${cycles}`;
      btn.textContent = running ? '⏹ إيقاف' : '▶ ابدأ التمرين';
    }
    function toggle() {
      running = !running;
      if (running) {
        pi = 0; left = PHASES[0].sec;
        iv = setInterval(() => {
          left--;
          if (left <= 0) {
            pi = (pi + 1) % PHASES.length;
            if (pi === 0) cycles++;
            left = PHASES[pi].sec;
          }
          paint();
        }, 1000);
        SM._tickers.push(iv);
      } else clearInterval(iv);
      paint();
    }
    paint();
    return el('div', { class: 'breath' }, circle, label, cyc,
      el('div', { class: 'center', style: 'margin-top:10px' }, btn),
      el('p', { class: 'hint center' }, 'نمط 4-4-6: يهدّئ الجهاز العصبي خلال دقيقتين'));
  };

  /* ---------- نقاط المستوى ---------- */
  C.levelDots = function (level, onChange, max = 5) {
    const wrap = el('div', { class: 'lvl' });
    for (let i = 1; i <= max; i++) {
      wrap.append(el('button', {
        class: 'lvl__dot' + (i <= level ? ' on' : ''),
        title: `مستوى ${i}`,
        on: { click: () => { onChange(i); SM.store.save(); SM.refresh(); } },
      }));
    }
    return el('div', { class: 'row gap-s center-v' },
      el('span', { class: 'hint' }, 'مبتدئ'), wrap, el('span', { class: 'hint' }, 'محترف'));
  };

  C.moodEmoji = (v) => ['', '😞', '😕', '😐', '🙂', '😄'][v] || '·';
  C.moodLabel = (v) => ['', 'صعب', 'متعب', 'عادي', 'جيد', 'رائع'][v] || '';

  C.search = function (placeholder, onInput) {
    return el('input', { class: 'inp inp--search', placeholder: placeholder || '🔍 بحث...', on: { input: (e) => onInput(e.target.value.trim()) } });
  };

  SM.C = C;
})();
