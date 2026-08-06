/* Second Mind — إطار صفحة الكوكب */
(function () {
  const U = SM.U, el = SM.el;

  /* اختيار الخطوط — خاص بهذا الكوكب فقط (منفصل عن الواجهة الرئيسية) */
  function fontsModal(p) {
    const Cc = SM.C, S = SM.store.state;
    S.settings.planetFonts = S.settings.planetFonts || {};
    const getPf = () => (S.settings.planetFonts[p.id] = S.settings.planetFonts[p.id] || {});
    const mk = (list, key, isEn) => {
      const cur = (S.settings.planetFonts[p.id] || {})[key] || (isEn ? S.settings.fontEn : S.settings.fontAr);
      const sel = el('select', {
        class: 'inp', style: `font-family:'${cur}',${isEn ? 'monospace' : 'sans-serif'}`,
        on: { change: (e) => { getPf()[key] = e.target.value; SM.store.save(); SM.applyFonts(); sel.style.fontFamily = `'${e.target.value}',${isEn ? 'monospace' : 'sans-serif'}`; SM.refresh(); } },
      }, list.map(f => el('option', { value: f, selected: cur === f, style: `font-family:'${f}',${isEn ? 'monospace' : 'sans-serif'}` }, f)));
      return sel;
    };
    Cc.modal('🔤 خطوط كوكب ' + p.name, el('div', { class: 'settings' },
      el('div', { class: 'row gap wrap' },
        el('label', { class: 'qform__field' }, el('span', { class: 'qform__label' }, 'الخط العربي'), mk(SM.FONTS.ar, 'ar', false)),
        el('label', { class: 'qform__field' }, el('span', { class: 'qform__label' }, 'الخط الإنجليزي والأرقام'), mk(SM.FONTS.en, 'en', true)),
      ),
      el('div', { class: 'row gap center-v', style: 'margin-top:6px' },
        el('button', { class: 'btn btn--sm', on: { click: () => { delete S.settings.planetFonts[p.id]; SM.store.save(); SM.applyFonts(); SM.refresh(); } } }, '↺ الخط الافتراضي'),
      ),
      el('p', { class: 'hint' }, 'يُطبَّق على هذا الكوكب فقط — لا يؤثّر على الواجهة الرئيسية'),
    ));
  }

  function heroModal(p) {
    const Cc = SM.C, S = SM.store.state;
    const m = Cc.modal('🖼️ خلفية الكوكب', el('div', {},
      el('p', { class: 'muted', style: 'margin-bottom:12px' }, 'اختر صورة من ملفاتك الخاصة لتكون خلفية كاملة لهذا الكوكب.'),
      el('div', { class: 'row gap wrap' },
        el('button', {
          class: 'btn btn--acc',
          on: {
            click: async () => {
              m.close();
              const d = await Cc.pickImage({ max: 1800 });
              if (d) { S.heroes[p.id] = d; SM.store.save(); Cc.toast('تم تحديث الخلفية ✨'); SM.refresh(); }
            },
          },
        }, '📷 اختيار صورة'),
        S.heroes[p.id] ? el('button', {
          class: 'btn',
          on: { click: () => { delete S.heroes[p.id]; SM.store.save(); m.close(); SM.refresh(); } },
        }, '↺ الرجوع للخلفية الأصلية') : null,
      ),
    ));
  }

  SM.renderPlanet = function (root, planetId, sectionId) {
    const p = SM.planetById(planetId);
    if (!p) { SM.go(''); return; }
    const S = SM.store.state;
    const sections = p.sections;
    const sec = sections.find(s => s.id === sectionId) || sections[0];
    const hero = S.heroes[p.id];
    // الخلفية تُعرض على طبقة #galaxy الثابتة (تغطي حتى عند السحب/الـoverscroll فلا تظهر خلفية الصفحة الأولى)
    if (SM.applyPlanetBg) SM.applyPlanetBg(hero || null);

    const pp = el('div', {
      class: 'pp' + (hero ? ' pp--img' : (p.custom ? ' pp--custom' : ' pp--' + p.id)),
      style: `--pc:${p.color};`,
    });
    // خط خاص بهذا الكوكب فقط (منفصل عن الواجهة الرئيسية)
    if (SM.applyFonts) SM.applyFonts();
    const pfont = (S.settings.planetFonts || {})[p.id];
    if (pfont && (pfont.ar || pfont.en) && SM.fontVars) {
      const v = SM.fontVars(pfont.ar || S.settings.fontAr, pfont.en || S.settings.fontEn);
      // نضبط المتغيّرين ونُعيد تقييم font-family على هذا الفرع فقط
      pp.style.setProperty('--font', v.ar);
      pp.style.setProperty('--font-en', v.en);
      pp.style.fontFamily = 'var(--font)';
    }
    pp.append(el('i', { class: 'pp__overlay' }));

    /* الشريط العلوي — أزرار زجاجية دائرية، بلا خط سفلي */
    pp.append(el('header', { class: 'pp__top' },
      el('button', { class: 'ppbtn glass--sheen', title: 'العودة للمجرة', on: { click: () => SM.go('') } }, '🪐 العودة للمجرة'),
      el('div', { class: 'pp__title' },
        el('span', { class: 'pp__dot', style: `background:${p.color}` }),
        el('h1', { class: p.rainbow ? 'rainbow-text' : '' }, 'كوكب ', p.name),
      ),
      el('div', { class: 'row gap-s' },
        el('button', { class: 'ppbtn glass--sheen', title: 'الخطوط', on: { click: () => fontsModal(p) } }, '🔤 الخطوط'),
        el('button', { class: 'ppbtn glass--sheen', title: 'الخلفية', on: { click: () => heroModal(p) } }, '🖼️ الخلفية'),
      ),
    ));

    const viewFn = p.custom ? SM.views.custom : SM.views[p.id];

    /* كواكب الملفات (الدراسة): بلا قائمة جانبية — واجهة مجلدات بعرض كامل */
    if (p.folders) {
      const content = el('main', { class: 'pp__content pp__content--wide' },
        viewFn ? viewFn(p, sectionId || 'root') : SM.C.empty('🚧', 'قيد البناء'),
      );
      pp.append(el('div', { class: 'pp__layout pp__layout--folders' }, content));
      root.append(pp);
      return;
    }

    /* التخطيط: قائمة جانبية + محتوى */
    const nav = el('aside', { class: 'pp__side' },
      el('nav', { class: 'pp__nav' },
        sections.map(s => el('button', {
          class: 'pp__navitem' + (s.id === sec.id ? ' on' : ''),
          on: { click: () => SM.go(`#/p/${p.id}/${s.id}`) },
        },
          el('span', { class: 'pp__navicon' }, s.icon),
          el('span', { class: 'pp__navname' + (p.rainbow ? ' rainbow-text' : '') }, s.name),
        )),
      ),
      el('div', { class: 'pp__sidefoot' },
        (() => {
          const w = SM.calc.planetWeekly(p.id);
          return el('div', { class: 'pp__weekly' },
            el('span', { class: 'hint' }, 'التزام الأسبوع'),
            SM.C.bar(w, p.color, { slim: true }),
            el('span', { class: 'hint' }, w == null ? 'لا عادات بعد' : w + '%'),
          );
        })(),
      ),
    );

    const content = el('main', { class: 'pp__content' },
      el('div', { class: 'pp__sechead' },
        el('h2', {}, sec.icon + ' ', sec.name),
      ),
      viewFn ? viewFn(p, sec.id) : SM.C.empty('🚧', 'قيد البناء'),
    );

    pp.append(el('div', { class: 'pp__layout' }, nav, content));
    root.append(pp);
  };

  SM.views = SM.views || {};
})();
