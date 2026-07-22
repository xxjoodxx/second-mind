/* Second Mind — الواجهة الرئيسية: المجموعة الشمسية */
(function () {
  const U = SM.U, el = SM.el, C = () => SM.C;

  const ORBIT_R = [30, 40, 46]; // نصف قطر المدارات كنسبة مئوية (الإهليلج يأتي من نسبة عرض/ارتفاع الحاوية)
  const CUSTOM_ANGLES = [16, 164, 100, 210, 330, 68, 292]; // توزيع الكواكب الجديدة حول المدار الخارجي

  function seedOf(id) {
    let h = 0;
    for (const ch of String(id)) h = (h * 31 + ch.charCodeAt(0)) | 0;
    return (Math.abs(h) % 100000) + 3;
  }

  /* ---------- لوحة الأهداف و XP ---------- */
  function goalsModal() {
    const Cc = SM.C, S = SM.store.state;
    const body = el('div', {});
    function paint() {
      body.innerHTML = '';
      const total = SM.calc.xpTotal();
      const rank = SM.calc.rank(total);
      body.append(el('div', { class: 'xp-hero' },
        el('div', { class: 'xp-hero__icon' }, rank.icon),
        el('div', {},
          el('div', { class: 'xp-hero__num' }, `${U.num(total)} XP`),
          el('div', { class: 'xp-hero__rank' }, `رتبتك: ${rank.name}`),
          rank.next ? el('div', { class: 'hint' }, `${rank.next.min - total} نقطة تفصلك عن «${rank.next.name}» ${rank.next.icon}`) : el('div', { class: 'hint' }, 'وصلت لقمة المجرة! 🏆'),
        ),
      ));

      body.append(Cc.quickForm([
        { k: 'title', label: 'هدف جديد', placeholder: 'مثال: إنهاء مشروع التخرج', grow: true },
        { k: 'difficulty', label: 'الصعوبة', type: 'select', options: [
          { v: 'easy', label: 'سهلة — 10 نقاط' },
          { v: 'medium', label: 'متوسطة — 30 نقطة' },
          { v: 'hard', label: 'صعبة — 50 نقطة' },
        ] },
      ], (v) => {
        S.goals.push({ id: U.uid(), title: v.title, difficulty: v.difficulty || 'easy', done: false, createdAt: U.todayKey() });
        SM.store.save(); paint(); SM.refresh();
      }, { label: '+ هدف' }));

      ['hard', 'medium', 'easy'].forEach(dif => {
        const conf = SM.DIFF[dif];
        const pending = S.goals.filter(g => !g.done && g.difficulty === dif);
        const grp = el('div', { class: 'goalgrp' },
          el('div', { class: 'goalgrp__head', style: `--gc:${conf.color}` },
            el('span', { class: 'dot', style: `background:${conf.color}` }),
            `الأهداف ال${conf.label}`, el('span', { class: 'goalgrp__pts' }, `+${conf.pts} XP`),
          ),
        );
        if (!pending.length) grp.append(el('div', { class: 'hint', style: 'padding:4px 26px' }, 'لا أهداف هنا'));
        pending.forEach(g => {
          grp.append(el('div', { class: 'goalrow' },
            el('button', {
              class: 'checkbtn', title: 'أنجزت!',
              on: {
                click: (e) => {
                  g.done = true; g.doneAt = U.todayKey();
                  SM.store.save();
                  Cc.xpFloat(`+${conf.pts} XP ✨`, e.clientX, e.clientY);
                  Cc.toast(`🎉 أحسنت! +${conf.pts} XP`);
                  paint(); SM.refresh();
                },
              },
            }),
            el('span', { class: 'goalrow__title' }, g.title),
            el('button', { class: 'iconbtn iconbtn--danger', on: { click: () => { S.goals.splice(S.goals.indexOf(g), 1); SM.store.save(); paint(); SM.refresh(); } } }, '✕'),
          ));
        });
        body.append(grp);
      });

      const done = S.goals.filter(g => g.done).sort((a, b) => (b.doneAt || '').localeCompare(a.doneAt || ''));
      if (done.length) {
        const grp = el('div', { class: 'goalgrp goalgrp--done' },
          el('div', { class: 'goalgrp__head' }, `✅ منجزة (${done.length})`));
        done.slice(0, 12).forEach(g => {
          const conf = SM.DIFF[g.difficulty];
          grp.append(el('div', { class: 'goalrow done' },
            el('span', { class: 'goalrow__title' }, g.title),
            el('span', { class: 'chip', style: `--cc:${conf.color}` }, `+${conf.pts}`),
            el('button', { class: 'iconbtn', title: 'تراجع', on: { click: () => { g.done = false; delete g.doneAt; SM.store.save(); paint(); SM.refresh(); } } }, '↺'),
          ));
        });
        body.append(grp);
      }
    }
    paint();
    SM.C.modal('🎯 لوحة الأهداف و XP', body, { wide: true });
  }

  /* ---------- الإعدادات ---------- */
  function settingsModal() {
    const Cc = SM.C, S = SM.store.state;
    const nameInp = el('input', { class: 'inp inp--short', value: S.profile.name, on: { change: (e) => { S.profile.name = e.target.value.trim() || 'Joud'; SM.store.save(); SM.refresh(); } } });

    const fontArSel = el('select', {
      class: 'inp', style: `font-family:'${S.settings.fontAr}',sans-serif`,
      on: { change: (e) => { S.settings.fontAr = e.target.value; SM.store.save(); SM.applyFonts(); fontArSel.style.fontFamily = `'${e.target.value}',sans-serif`; } },
    }, SM.FONTS.ar.map(f => el('option', { value: f, selected: S.settings.fontAr === f, style: `font-family:'${f}',sans-serif` }, f)));

    const fontEnSel = el('select', {
      class: 'inp', style: `font-family:'${S.settings.fontEn}',monospace`,
      on: { change: (e) => { S.settings.fontEn = e.target.value; SM.store.save(); SM.applyFonts(); fontEnSel.style.fontFamily = `'${e.target.value}',monospace`; } },
    }, SM.FONTS.en.map(f => el('option', { value: f, selected: S.settings.fontEn === f, style: `font-family:'${f}',monospace` }, f)));

    const importBtn = el('button', {
      class: 'btn',
      on: {
        click: () => {
          const inp = el('input', { type: 'file', accept: '.json,application/json', style: 'display:none' });
          document.body.append(inp);
          inp.addEventListener('change', () => {
            const f = inp.files && inp.files[0]; inp.remove();
            if (!f) return;
            const r = new FileReader();
            r.onload = () => {
              try { SM.store.import(r.result); Cc.toast('تم الاستيراد بنجاح ✅'); SM.refresh(); }
              catch (e) { Cc.toast('⚠️ ملف غير صالح'); }
            };
            r.readAsText(f);
          });
          inp.click();
        },
      },
    }, '📥 استيراد نسخة');

    Cc.modal('⚙️ الإعدادات', el('div', { class: 'settings' },
      el('label', { class: 'qform__field', style: 'max-width:260px' }, el('span', { class: 'qform__label' }, 'اسمك (يظهر في الترحيب)'), nameInp),
      el('div', { class: 'sep' }),
      el('div', { class: 'qform__label', style: 'margin-bottom:8px' }, '🔤 خطوط النصوص'),
      el('div', { class: 'row gap wrap' },
        el('label', { class: 'qform__field' }, el('span', { class: 'qform__label' }, 'الخط العربي'), fontArSel),
        el('label', { class: 'qform__field' }, el('span', { class: 'qform__label' }, 'الخط الإنجليزي والأرقام'), fontEnSel),
      ),
      el('div', { class: 'sep' }),
      el('div', { class: 'row gap wrap' },
        Cc.imageBtn('🧑‍🚀 تغيير الأفتار', (d) => { S.profile.avatar = d; }, { max: 300, quality: 0.85 }),
        S.profile.avatar ? el('button', { class: 'btn', on: { click: () => { S.profile.avatar = null; SM.store.save(); SM.refresh(); } } }, 'إزالة الأفتار') : null,
        el('button', {
          class: 'btn',
          on: {
            click: async () => {
              const d = await Cc.pickImage({ max: 1800 });
              if (!d) return;
              S.profile.homeHero = d; SM.store.save();
              bgDimChoiceModal();
            },
          },
        }, '🌌 خلفية الواجهة الرئيسية'),
        S.profile.homeHero ? el('button', { class: 'btn', on: { click: () => { S.profile.homeHero = null; SM.store.save(); SM.refresh(); } } }, 'إزالة الخلفية') : null,
      ),
      S.profile.homeHero ? el('label', { class: 'row gap-s center-v', style: 'margin-top:10px;cursor:pointer' },
        el('input', { type: 'checkbox', checked: S.profile.homeHeroDim, on: { change: (e) => { S.profile.homeHeroDim = e.target.checked; SM.store.save(); SM.refresh(); } } }),
        el('span', { class: 'hint' }, 'تعتيم الخلفية (أوضح للقراءة) — أزل العلامة لعرضها كما هي'),
      ) : null,
      el('div', { class: 'sep' }),
      el('div', { class: 'row gap wrap' },
        el('button', { class: 'btn', on: { click: () => SM.store.export() } }, '📤 تصدير نسخة احتياطية'),
        importBtn,
        el('button', { class: 'btn btn--danger', on: { click: () => Cc.confirm('سيتم مسح كل البيانات نهائيًا والبدء من جديد. متأكد؟', () => SM.store.reset()) } }, '🗑 تصفير كل شيء'),
      ),
      el('p', { class: 'hint' }, 'بياناتك كلها محفوظة محليًا على جهازك فقط — لا سيرفرات ولا حسابات.'),
    ));
  }

  /* ---------- إنشاء كوكب جديد ---------- */
  function newPlanetModal() {
    const Cc = SM.C, S = SM.store.state;
    let color = SM.PLANET_PALETTE[S.custom.length % SM.PLANET_PALETTE.length];
    const swatches = el('div', { class: 'swatches' });
    SM.PLANET_PALETTE.forEach(c => {
      const b = el('button', { class: 'swatch' + (c === color ? ' on' : ''), style: `background:${c}`, on: { click: () => { color = c; swatches.querySelectorAll('.swatch').forEach(x => x.classList.remove('on')); b.classList.add('on'); } } });
      swatches.append(b);
    });
    const m = Cc.modal('🪐 ولادة كوكب جديد', el('div', {},
      el('p', { class: 'muted', style: 'margin-bottom:12px' }, 'أنشئ كوكبًا لأي جانب جديد من حياتك — عدد الكواكب لا نهائي.'),
      Cc.quickForm([
        { k: 'name', label: 'اسم الكوكب', placeholder: 'مثال: السفر، العائلة، مشروعي...', grow: true },
      ], (v) => {
        const p = { id: 'c' + U.uid(), name: v.name, color, createdAt: U.todayKey(), todos: [], notes: [] };
        S.custom.push(p);
        SM.store.save();
        m.close();
        Cc.toast(`🌟 وُلد كوكب «${v.name}» في مجرتك!`);
        SM.go('#/p/' + p.id);
      }, { label: '✨ إنشاء الكوكب' }),
      el('div', { style: 'margin-top:10px' }, el('span', { class: 'qform__label' }, 'لون الكوكب'), swatches),
    ));
  }

  /* ---------- عناصر المشهد ---------- */
  function planetNode(p) {
    const weekly = SM.calc.planetWeekly(p.id);
    const r = ORBIT_R[p.orbit] || ORBIT_R[2];
    let angle = p.angle;
    if (p.custom) {
      const idx = SM.store.state.custom.findIndex(c => c.id === p.id);
      angle = CUSTOM_ANGLES[idx % CUSTOM_ANGLES.length] + Math.floor(idx / CUSTOM_ANGLES.length) * 24;
    }
    const rad = (angle * Math.PI) / 180;
    /* نفس النسبة للمحورين — الحاوية العريضة تحوّل المسار لإهليلج منظوري تلقائيًا */
    const x = 50 + r * Math.cos(rad);
    const y = 50 + r * Math.sin(rad);

    /* عمق المشهد: الكواكب الأمامية (أسفل) أكبر وأقرب، الخلفية أصغر وخلف الشمس */
    const depth = Math.sin(rad);
    const size = Math.round((p.size || 96) * (1 + 0.15 * depth));
    const z = depth >= 0 ? 8 : 3;

    const S = SM.store.state;
    const bodyColor = S.planetColors[p.id]; // لون جسم الكوكب المختار (إن وُجد)
    /* الكواكب الأساسية: نزيح درجة اللون؛ المخصصة: نمرر اللون مباشرة */
    let spriteOpts = { seed: seedOf(p.id), color: bodyColor || p.color };
    if (bodyColor && !p.custom) spriteOpts.hueShift = SM.pixel.hueOf(bodyColor) - SM.pixel.hueOf(p.color);
    const sprite = SM.pixel.planet(p.ptype || 'plain', spriteOpts);
    sprite.className = 'planet__px';

    const glowColor = bodyColor || p.color;
    const labelColor = S.labelColors[p.id];

    return el('button', {
      class: 'planet' + (p.custom ? ' planet--custom' : ' planet--' + p.id),
      style: `left:${x}%;top:${y}%;--psize:${size}px;--pc:${glowColor};z-index:${z};`,
      title: p.name,
      on: { click: () => SM.go('#/p/' + p.id) },
    },
      el('span', { class: 'planet__body' }, sprite),
      el('span', {
        class: 'planet__label', role: 'button', title: 'اضغط لتغيير الألوان',
        on: { click: (e) => { e.stopPropagation(); planetColorModal(p); } },
      },
        el('span', {
          class: 'planet__name' + (p.rainbow && !labelColor ? ' rainbow-text' : ''),
          style: labelColor ? `color:${labelColor}` : '',
        }, p.name),
        el('span', { class: 'planet__en' }, p.en || ''),
        weekly != null ? el('span', { class: 'planet__meter' }, el('i', { style: `width:${weekly}%;background:${glowColor}` })) : null,
      ),
    );
  }

  /* خيار تعتيم الخلفية عند إضافتها */
  function bgDimChoiceModal() {
    const Cc = SM.C, S = SM.store.state;
    const pick = (dim) => { S.profile.homeHeroDim = dim; SM.store.save(); Cc.toast('تم تحديث الخلفية 🌌'); SM.refresh(); m.close(); };
    const m = Cc.modal('🌌 شكل الخلفية', el('div', {},
      el('p', { class: 'muted', style: 'margin-bottom:14px' }, 'كيف تريد عرض صورة الخلفية؟'),
      el('div', { class: 'row gap wrap center' },
        el('button', { class: 'btn btn--acc', on: { click: () => pick(true) } }, '🌘 معتمة (أوضح للقراءة)'),
        el('button', { class: 'btn', on: { click: () => pick(false) } }, '☀️ زيّ ما هي'),
      ),
    ));
  }

  /* منتقي ألوان بعجلة لونية — للاسم أو لجسم الكوكب */
  function planetColorModal(p) {
    const Cc = SM.C, S = SM.store.state;
    let mode = 'body'; // body | label
    const body = el('div', {});
    const tabs = el('div', { class: 'tabs', style: 'margin-bottom:14px' });
    const preview = el('span', { class: 'cwheel-preview' });
    const label = el('span', { class: 'hint' });

    const curColor = () => mode === 'label' ? S.labelColors[p.id] : (p.custom ? (S.custom.find(c => c.id === p.id) || {}).color : S.planetColors[p.id]);
    function sync() { const c = curColor(); preview.style.background = c || '#334155'; label.textContent = c || 'اللون الافتراضي'; }

    function setColor(hex) { // تحديث حيّ بلا إعادة بناء العجلة
      if (mode === 'label') S.labelColors[p.id] = hex;
      else if (p.custom) { const cp = S.custom.find(c => c.id === p.id); if (cp) cp.color = hex; }
      else S.planetColors[p.id] = hex;
      SM.store.save(); SM.refresh(); sync();
    }
    function reset() {
      if (mode === 'label') delete S.labelColors[p.id];
      else if (!p.custom) delete S.planetColors[p.id];
      SM.store.save(); SM.refresh(); paint();
    }
    function paint() {
      tabs.innerHTML = '';
      [['body', '🪐 لون الكوكب'], ['label', '🔤 لون الاسم']].forEach(([id, lb]) => {
        tabs.append(el('button', { class: 'tab' + (mode === id ? ' on' : ''), on: { click: () => { mode = id; paint(); } } }, lb));
      });
      body.innerHTML = '';
      body.append(
        el('div', { class: 'cwheel-wrap' }, Cc.colorWheel(setColor, { size: 220, value: curColor() })),
        el('div', { class: 'row gap center-v center', style: 'margin-top:12px' }, preview, label,
          el('button', { class: 'btn btn--sm', on: { click: reset } }, '↺ افتراضي')),
        el('p', { class: 'hint center' }, 'اسحب الدائرة على العجلة لاختيار اللون'),
      );
      sync();
    }
    paint();
    Cc.modal(`🎨 ألوان «${p.name}»`, el('div', {}, tabs, body));
  }

  /* عجلة لون اسم «Joud» في الشريط العلوي */
  function nameColorModal() {
    const Cc = SM.C, S = SM.store.state;
    const preview = el('span', { class: 'cwheel-preview', style: `background:${S.profile.nameColor || '#67e8f9'}` });
    Cc.modal('🎨 لون الاسم', el('div', {},
      el('div', { class: 'cwheel-wrap' }, Cc.colorWheel((hex) => { S.profile.nameColor = hex; SM.store.save(); SM.refresh(); preview.style.background = hex; }, { size: 220, value: S.profile.nameColor })),
      el('div', { class: 'row gap center-v center', style: 'margin-top:12px' }, preview,
        el('button', { class: 'btn btn--sm', on: { click: () => { S.profile.nameColor = null; SM.store.save(); SM.refresh(); preview.style.background = '#67e8f9'; } } }, '↺ افتراضي'),
      ),
    ));
  }

  function sunNode() {
    const prod = SM.calc.productivity();
    const tier = prod.tier;
    const cls = tier ? 'sun--' + tier.id : 'sun--idle';
    const sprite = SM.pixel.sun(tier ? tier.id : 'idle');
    sprite.className = 'sun__px';
    return el('div', { class: 'sun-wrap' },
      el('button', {
        class: 'sun ' + cls,
        title: tier ? `ضوء الشمس — الإنتاجية: ${tier.label} ${prod.pct}%` : 'ضوء الشمس — مؤشر الإنتاجية',
        on: { click: sunModal },
      }, sprite),
    );
  }

  function sunModal() {
    const Cc = SM.C;
    const prod = SM.calc.productivity();
    const weekly = SM.calc.weeklyAreas();
    Cc.modal('☀️ ضوء الشمس — مؤشر الإنتاجية', el('div', {},
      el('p', { class: 'muted' }, 'الشمس مرتبطة بكل الكواكب: كل ✓ على متتبعات العادات خلال آخر ٧ أيام يرفع إنتاجيتك ويغيّر لون الضوء.'),
      el('div', { class: 'sunscale' },
        [['gold', 'عالية', '#ffd66b'], ['white', 'ممتازة', '#f8fafc'], ['green', 'جيدة', '#4ade80'], ['red', 'سيئة', '#f87171']].map(([id, lb, c]) =>
          el('div', { class: 'sunscale__item' + (prod.tier && prod.tier.id === id ? ' on' : '') },
            el('span', { class: 'dot', style: `background:${c}` }), lb)),
      ),
      el('div', { class: 'sep' }),
      weekly.map(({ area, pct }) => el('div', { class: 'prow' },
        el('span', { class: 'dot', style: `background:${area.color}` }),
        el('span', { class: 'prow__name' }, area.name),
        el('div', { class: 'prow__bar' }, Cc.bar(pct, area.color)),
        el('span', { class: 'prow__pct' }, pct == null ? '—' : pct + '%'),
      )),
    ));
  }

  /* ---------- مربع التقدّم ---------- */
  function progressCard() {
    const Cc = SM.C;
    let mode = 'week';
    const body = el('div', {});
    const tabs = el('div', { class: 'tabs' });
    function paint() {
      tabs.innerHTML = '';
      [['week', 'أسبوعي'], ['month', 'شهري']].forEach(([id, lb]) => {
        tabs.append(el('button', { class: 'tab' + (mode === id ? ' on' : ''), on: { click: () => { mode = id; paint(); } } }, lb));
      });
      body.innerHTML = '';
      const rows = mode === 'week' ? SM.calc.weeklyAreas() : SM.calc.monthlyAreas();
      rows.forEach(({ area, pct }) => {
        body.append(el('div', { class: 'prow' },
          el('span', { class: 'dot', style: `background:${area.color}` }),
          el('span', { class: 'prow__name' }, area.name),
          el('div', { class: 'prow__bar' }, Cc.bar(pct, area.color)),
          el('span', { class: 'prow__pct' }, pct == null ? '—' : pct + '%'),
        ));
      });
      body.append(el('p', { class: 'hint' }, 'يتغذّى من متتبعات العادات داخل الكواكب'));
    }
    paint();
    return el('section', { class: 'card glass glass--sheen side-card' },
      el('div', { class: 'card__head' },
        el('h3', { class: 'card__title' }, '📊 مربع التقدّم'), tabs),
      el('div', { class: 'card__body' }, body),
    );
  }

  function xpCard() {
    const Cc = SM.C, S = SM.store.state;
    const total = SM.calc.xpTotal();
    const rank = SM.calc.rank(total);
    const pending = S.goals.filter(g => !g.done);
    const nextPct = rank.next ? U.pct(total - rank.min, rank.next.min - rank.min) : 100;
    return el('section', { class: 'card glass glass--sheen side-card xp-card', on: { click: goalsModal }, role: 'button', tabindex: '0' },
      el('div', { class: 'card__head' },
        el('h3', { class: 'card__title' }, '⚡ مربع XP'),
        el('span', { class: 'chip', style: '--cc:#fbbf24' }, `${pending.length} هدف نشط`),
      ),
      el('div', { class: 'card__body' },
        el('div', { class: 'xp-row' },
          el('span', { class: 'xp-icon' }, rank.icon),
          el('div', { style: 'flex:1' },
            el('div', { class: 'xp-num' }, `${U.num(total)} XP`),
            el('div', { class: 'hint' }, rank.name),
          ),
        ),
        Cc.bar(nextPct, '#fbbf24', { title: rank.next ? `${nextPct}% نحو ${rank.next.name}` : 'القمة!' }),
        el('div', { class: 'xp-legend' },
          el('span', {}, el('i', { class: 'dot', style: 'background:#f87171' }), ' صعبة 50'),
          el('span', {}, el('i', { class: 'dot', style: 'background:#fb923c' }), ' متوسطة 30'),
          el('span', {}, el('i', { class: 'dot', style: 'background:#4ade80' }), ' سهلة 10'),
        ),
        el('div', { class: 'hint', style: 'margin-top:6px' }, 'اضغط لفتح لوحة الأهداف ←'),
      ),
    );
  }

  /* ---------- الواجهة ---------- */
  SM.renderHome = function (root) {
    const Cc = SM.C, S = SM.store.state;
    const hero = S.profile.homeHero;

    const home = el('div', { class: 'home' + (hero ? ' home--hero' : '') + (hero && S.profile.homeHeroDim ? ' home--hero-dim' : ''), style: hero ? `background-image:url(${hero})` : '' });

    /* الشريط العلوي */
    const avatar = el('button', { class: 'avatar', title: 'الإعدادات', on: { click: settingsModal } },
      S.profile.avatar ? el('img', { src: S.profile.avatar, alt: 'avatar' }) : el('span', { class: 'avatar__ph' }, '🧑‍🚀'));

    home.append(el('header', { class: 'topbar glass glass--sheen' },
      el('div', { class: 'topbar__id' },
        avatar,
        el('div', { class: 'greet' },
          el('button', {
            class: 'greet__hello', title: 'اضغط لتغيير لون الاسم',
            on: { click: nameColorModal },
          }, el('span', { dir: 'ltr', class: 'greet__en' + (S.profile.nameColor ? '' : ' greet__en--grad'), style: S.profile.nameColor ? `color:${S.profile.nameColor};-webkit-text-fill-color:${S.profile.nameColor}` : '' }, S.profile.name)),
          el('div', { class: 'greet__sub' }, U.fmtDateLong(U.todayKey())),
        ),
      ),
      el('div', { class: 'topbar__actions' },
        el('button', { class: 'xpchip glass-soft', title: 'لوحة الأهداف', on: { click: goalsModal } },
          el('span', {}, SM.calc.rank(SM.calc.xpTotal()).icon), ` ${U.num(SM.calc.xpTotal())} XP`),
        el('button', { class: 'iconbtn iconbtn--lg', title: 'الإعدادات', on: { click: settingsModal } }, '⚙️'),
      ),
    ));

    /* الشبكة: لوحات جانبية + المجموعة الشمسية */
    const solar = el('div', { class: 'solar' },
      el('i', { class: 'orbit orbit--1' }), el('i', { class: 'orbit orbit--2' }), el('i', { class: 'orbit orbit--3' }),
      sunNode(),
      SM.allPlanets().map(planetNode),
    );

    /* المشهد يمتد بعرض الصفحة، واللوحتان تطفوان على الجانب */
    home.append(el('div', { class: 'home-grid' },
      el('div', { class: 'solar-wrap' },
        el('button', { class: 'plusbtn', title: 'إنشاء كوكب جديد', on: { click: newPlanetModal } },
          el('span', { class: 'plusbtn__hint' }, 'كوكب جديد'),
          el('span', { class: 'plusbtn__plus' }, '+'),
        ),
        solar,
      ),
      el('aside', { class: 'home-side' }, progressCard(), xpCard()),
    ));

    /* شريط تنقل سفلي */
    home.append(el('nav', { class: 'dock glass glass--sheen' },
      SM.allPlanets().map(p => el('button', { class: 'dock__chip', on: { click: () => SM.go('#/p/' + p.id) } },
        el('span', { class: 'dot', style: `background:${p.color}` }), p.name)),
    ));

    root.append(home);
  };
})();
