/* Second Mind — الواجهة الرئيسية: المجموعة الشمسية */
(function () {
  const U = SM.U, el = SM.el, C = () => SM.C;

  const ORBIT_R = [23.5, 35, 46.5]; // نصف قطر المدارات كنسبة من الحاوية

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
    const nameInp = el('input', { class: 'inp', value: S.profile.name, on: { change: (e) => { S.profile.name = e.target.value.trim() || 'Joud'; SM.store.save(); SM.refresh(); } } });
    const curInp = el('input', { class: 'inp', value: S.settings.currency, on: { change: (e) => { S.settings.currency = e.target.value.trim() || 'ر.س'; SM.store.save(); SM.refresh(); } } });
    const waterInp = el('input', { class: 'inp', type: 'number', min: 1, max: 20, value: S.settings.waterGoal, on: { change: (e) => { S.settings.waterGoal = U.clamp(Number(e.target.value) || 8, 1, 20); SM.store.save(); SM.refresh(); } } });
    const sportInp = el('input', { class: 'inp', type: 'number', min: 1, max: 7, value: S.settings.sportWeeklyGoal, on: { change: (e) => { S.settings.sportWeeklyGoal = U.clamp(Number(e.target.value) || 4, 1, 7); SM.store.save(); SM.refresh(); } } });

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
      el('label', { class: 'qform__field' }, el('span', { class: 'qform__label' }, 'اسمك (يظهر في الترحيب)'), nameInp),
      el('div', { class: 'row gap wrap' },
        el('label', { class: 'qform__field' }, el('span', { class: 'qform__label' }, 'العملة'), curInp),
        el('label', { class: 'qform__field' }, el('span', { class: 'qform__label' }, 'هدف الماء (أكواب/يوم)'), waterInp),
        el('label', { class: 'qform__field' }, el('span', { class: 'qform__label' }, 'هدف الرياضة (أيام/أسبوع)'), sportInp),
      ),
      el('div', { class: 'sep' }),
      el('div', { class: 'row gap wrap' },
        Cc.imageBtn('🧑‍🚀 تغيير الأفتار', (d) => { S.profile.avatar = d; }, { max: 300, quality: 0.85 }),
        S.profile.avatar ? el('button', { class: 'btn', on: { click: () => { S.profile.avatar = null; SM.store.save(); SM.refresh(); } } }, 'إزالة الأفتار') : null,
        Cc.imageBtn('🌌 خلفية الواجهة الرئيسية', (d) => { S.profile.homeHero = d; }, { max: 1800 }),
        S.profile.homeHero ? el('button', { class: 'btn', on: { click: () => { S.profile.homeHero = null; SM.store.save(); SM.refresh(); } } }, 'إزالة الخلفية') : null,
      ),
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
      angle = (78 + idx * 52) % 360;
    }
    const rad = (angle * Math.PI) / 180;
    const x = 50 + r * Math.cos(rad);
    const y = 50 + r * Math.sin(rad);
    const size = p.size || 62;

    return el('button', {
      class: 'planet' + (p.custom ? ' planet--custom' : ' planet--' + p.id),
      style: `left:${x}%;top:${y}%;--psize:${size}px;${p.custom ? `--pc:${p.color};` : ''}`,
      title: p.name,
      on: { click: () => SM.go('#/p/' + p.id) },
    },
      el('span', { class: 'planet__body' },
        p.ring ? el('i', { class: 'planet__ring' }) : null,
        el('i', { class: 'planet__texture' }),
        el('i', { class: 'planet__shine' }),
      ),
      el('span', { class: 'planet__label' },
        el('span', { class: 'planet__name' + (p.rainbow ? ' rainbow-text' : '') }, p.name),
        el('span', { class: 'planet__en' }, p.en || ''),
        weekly != null ? el('span', { class: 'planet__meter' }, el('i', { style: `width:${weekly}%;background:${p.color}` })) : null,
      ),
    );
  }

  function sunNode() {
    const prod = SM.calc.productivity();
    const tier = prod.tier;
    const cls = tier ? 'sun--' + tier.id : 'sun--idle';
    return el('div', { class: 'sun-wrap' },
      el('button', {
        class: 'sun ' + cls, title: 'ضوء الشمس — مؤشر الإنتاجية',
        on: { click: sunModal },
      },
        el('i', { class: 'sun__corona' }),
        el('i', { class: 'sun__core' }),
      ),
      el('div', { class: 'sun__label' },
        el('span', { class: 'sun__title' }, 'ضوء الشمس'),
        el('span', { class: 'sun__tier', style: tier ? `color:${tier.color}` : '' },
          tier ? `الإنتاجية: ${tier.label} · ${prod.pct}%` : 'تتبّع عاداتك لتضيء الشمس'),
      ),
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
    return el('section', { class: 'card glass side-card' },
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
    return el('section', { class: 'card glass side-card xp-card', on: { click: goalsModal }, role: 'button', tabindex: '0' },
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

    const home = el('div', { class: 'home' + (hero ? ' home--hero' : ''), style: hero ? `background-image:url(${hero})` : '' });

    /* الشريط العلوي */
    const avatar = el('button', { class: 'avatar', title: 'الإعدادات', on: { click: settingsModal } },
      S.profile.avatar ? el('img', { src: S.profile.avatar, alt: 'avatar' }) : el('span', { class: 'avatar__ph' }, '🧑‍🚀'));

    home.append(el('header', { class: 'topbar glass' },
      el('div', { class: 'topbar__id' },
        avatar,
        el('div', { class: 'greet' },
          el('div', { class: 'greet__hello' }, el('span', { dir: 'ltr', class: 'greet__en' }, `Hello ${S.profile.name}`), ' 👋'),
          el('div', { class: 'greet__sub' }, `${U.timeGreeting()} · ${U.fmtDateLong(U.todayKey())}`),
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

    home.append(el('div', { class: 'home-grid' },
      el('aside', { class: 'home-side' }, progressCard(), xpCard()),
      el('div', { class: 'solar-wrap' },
        el('button', { class: 'plusbtn', title: 'إنشاء كوكب جديد', on: { click: newPlanetModal } },
          el('span', { class: 'plusbtn__plus' }, '+'),
          el('span', { class: 'plusbtn__hint' }, 'كوكب جديد'),
        ),
        solar,
      ),
    ));

    /* شريط تنقل سفلي */
    home.append(el('nav', { class: 'dock glass' },
      SM.allPlanets().map(p => el('button', { class: 'dock__chip', on: { click: () => SM.go('#/p/' + p.id) } },
        el('span', { class: 'dot', style: `background:${p.color}` }), p.name)),
    ));

    home.append(el('footer', { class: 'home-quote' }, `« ${U.dailyQuote()} »`));

    root.append(home);
  };
})();
