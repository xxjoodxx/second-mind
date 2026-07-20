/* Second Mind — الكواكب المخصصة (زر +) */
(function () {
  const U = SM.U, el = SM.el;

  function getCP(planetId) {
    return SM.store.state.custom.find(c => c.id === planetId);
  }

  function dash(S, p, cp) {
    const C = SM.C;
    const todos = cp.todos || (cp.todos = []);
    const pend = todos.filter(t => !t.done);
    const habits = S.habits.filter(h => h.planetId === p.id);
    const bestStreak = Math.max(0, ...habits.map(h => SM.calc.streak(h)));

    return el('div', {},
      el('div', { class: 'stats-grid' },
        C.stat('مهام معلقة', String(pend.length), { icon: '✅', color: p.color, sub: `${todos.length - pend.length} منجزة` }),
        C.stat('العادات', String(habits.length), { icon: '🔁', color: p.color, sub: bestStreak ? `أطول سلسلة 🔥 ${bestStreak}` : 'أضف عادات لهذا الكوكب' }),
        C.stat('الملاحظات', String((cp.notes || []).length), { icon: '🗒️', color: p.color }),
      ),
      C.card('متتبع العادات', C.habitBoard(p.id), { icon: '🔁', sub: 'اختر المجال المناسب لتغذية مربع التقدم' }),
      C.card('إعدادات الكوكب', el('div', {},
        el('div', { class: 'row gap wrap center-v' },
          el('label', { class: 'qform__field' }, el('span', { class: 'qform__label' }, 'اسم الكوكب'),
            el('input', { class: 'inp', value: cp.name, on: { change: (e) => { cp.name = e.target.value.trim() || cp.name; SM.store.save(); SM.refresh(); } } })),
          el('label', { class: 'qform__field' }, el('span', { class: 'qform__label' }, 'اللون'),
            el('div', { class: 'swatches' }, SM.PLANET_PALETTE.map(c => el('button', {
              class: 'swatch' + (cp.color === c ? ' on' : ''), style: `background:${c}`,
              on: { click: () => { cp.color = c; SM.store.save(); SM.refresh(); } },
            })))),
        ),
        el('div', { class: 'sep' }),
        el('button', {
          class: 'btn btn--danger',
          on: {
            click: () => C.confirm(`تدمير كوكب «${cp.name}» نهائيًا مع كل عاداته وبياناته؟`, () => {
              const S2 = SM.store.state;
              S2.habits = S2.habits.filter(h => h.planetId !== p.id);
              delete S2.heroes[p.id];
              S2.custom.splice(S2.custom.indexOf(cp), 1);
              SM.store.save(); C.toast('🌠 تحوّل الكوكب إلى غبار نجمي'); SM.go('');
            }),
          },
        }, '💥 تدمير الكوكب'),
      ), { icon: '⚙️' }),
    );
  }

  function tasks(S, p, cp) {
    const C = SM.C;
    const todos = cp.todos || (cp.todos = []);
    return C.card('المهام', C.list({
      get: () => todos,
      render: (t) => t.text,
      checked: (t) => t.done,
      onToggle: (t) => { t.done = !t.done; },
      onAdd: (text) => todos.push({ id: U.uid(), text, done: false }),
      onDelete: (t) => todos.splice(todos.indexOf(t), 1),
      placeholder: 'مهمة جديدة...',
      empty: 'أضف مهام هذا الكوكب',
      emptyIcon: '✅',
    }), { icon: '✅' });
  }

  function notes(S, p, cp) {
    const C = SM.C;
    const list = cp.notes || (cp.notes = []);
    return C.card('ملاحظات', el('div', {},
      C.quickForm([
        { k: 'title', label: 'العنوان', grow: true },
        { k: 'body', label: 'الملاحظة', type: 'textarea', rows: 3 },
      ], (v) => { list.push({ id: U.uid(), title: v.title, body: v.body, date: U.todayKey() }); SM.store.save(); SM.refresh(); }),
      list.length ? list.slice().reverse().map(n => el('details', { class: 'acc' },
        el('summary', {}, '🗒️ ' + n.title,
          el('button', { class: 'iconbtn iconbtn--danger', on: { click: (e) => { e.preventDefault(); list.splice(list.indexOf(n), 1); SM.store.save(); SM.refresh(); } } }, '✕')),
        el('p', { class: 'acc__body' }, n.body || '—'),
      )) : C.empty('🗒️', 'دوّن أفكار هذا الكوكب'),
    ), { icon: '🗒️' });
  }

  SM.views.custom = function (planet, secId) {
    const S = SM.store.state;
    const cp = getCP(planet.id);
    if (!cp) return SM.C.empty('🌫️', 'هذا الكوكب لم يعد موجودًا');
    switch (secId) {
      case 'tasks': return tasks(S, planet, cp);
      case 'habits': return SM.C.card('متتبع العادات', SM.C.habitBoard(planet.id), { icon: '🔁' });
      case 'notes': return notes(S, planet, cp);
      default: return dash(S, planet, cp);
    }
  };
})();
