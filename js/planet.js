/* Second Mind — إطار صفحة الكوكب */
(function () {
  const U = SM.U, el = SM.el;

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

    const pp = el('div', {
      class: 'pp' + (hero ? ' pp--img' : (p.custom ? ' pp--custom' : ' pp--' + p.id)),
      style: (hero ? `background-image:url(${hero});` : '') + `--pc:${p.color};`,
    });
    pp.append(el('i', { class: 'pp__overlay' }));

    /* الشريط العلوي */
    pp.append(el('header', { class: 'pp__top' },
      el('button', { class: 'btn btn--ghost', on: { click: () => SM.go('') } }, '🪐 العودة للمجرة'),
      el('div', { class: 'pp__title' },
        el('span', { class: 'pp__dot', style: `background:${p.color}` }),
        el('h1', { class: p.rainbow ? 'rainbow-text' : '' }, 'كوكب ', p.name),
      ),
      el('div', { class: 'row gap-s' },
        el('button', { class: 'btn btn--ghost', on: { click: () => heroModal(p) } }, '🖼️ الخلفية'),
      ),
    ));

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

    const viewFn = p.custom ? SM.views.custom : SM.views[p.id];
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
