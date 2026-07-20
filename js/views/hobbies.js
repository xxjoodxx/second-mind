/* Second Mind — كوكب الهوايات */
(function () {
  const U = SM.U, el = SM.el;
  const PINK = '#e879f9', VIOLET = '#a78bfa';
  const STATUSES = ['نشطة', 'متوقفة', 'سأبدأها'];
  const stColor = (s) => ({ 'نشطة': '#4ade80', 'متوقفة': '#94a3b8', 'سأبدأها': '#38bdf8' }[s] || '#94a3b8');

  const hobbyName = (S, id) => (S.hobbies.list.find(h => h.id === id) || {}).name || '—';
  const hobbyMinutes = (S, id) => U.sum(S.hobbies.sessions.filter(s => s.hobbyId === id), s => s.minutes);

  function sessionForm(S) {
    const C = SM.C;
    if (!S.hobbies.list.length) return el('p', { class: 'hint' }, 'أضف هواية أولًا من قسم «هواياتي»');
    return C.quickForm([
      { k: 'hobbyId', label: 'الهواية', type: 'select', options: S.hobbies.list.map(h => ({ v: h.id, label: h.name })) },
      { k: 'minutes', label: 'الدقائق', type: 'number', min: 5, value: 30 },
    ], (v) => {
      S.hobbies.sessions.push({ id: U.uid(), date: U.todayKey(), hobbyId: v.hobbyId, minutes: v.minutes });
      SM.store.save(); C.toast('جلسة ممارسة مسجلة 🎨'); SM.refresh();
    }, { label: '+ سجّل ممارسة' });
  }

  function galleryGrid(S, limit) {
    const C = SM.C;
    const items = S.hobbies.gallery.slice().reverse();
    const shown = limit ? items.slice(0, limit) : items;
    if (!shown.length) return C.empty('🖼️', 'معرضك فارغ — أضف صور أعمالك المنجزة');
    return el('div', { class: 'gallery' }, shown.map(g =>
      el('figure', { class: 'gallery__item' },
        el('img', {
          src: g.image, alt: g.caption || '', loading: 'lazy',
          on: { click: () => SM.C.modal(g.caption || 'من أعمالي', el('img', { src: g.image, class: 'gallery__full' }), { wide: true }) },
        }),
        el('figcaption', {},
          el('span', {}, g.caption || ''),
          !limit ? el('button', { class: 'iconbtn iconbtn--danger', on: { click: () => { S.hobbies.gallery.splice(S.hobbies.gallery.indexOf(g), 1); SM.store.save(); SM.refresh(); } } }, '✕') : null,
        ),
      )));
  }

  function dash(S) {
    const C = SM.C;
    const active = S.hobbies.list.filter(h => h.status === 'نشطة');
    const lastProject = S.hobbies.projects[S.hobbies.projects.length - 1];
    const weekMin = U.sum(S.hobbies.sessions.filter(s => U.lastNDays(7).includes(s.date)), s => s.minutes);
    const habits = S.habits.filter(h => h.planetId === 'hobbies');
    const bestStreak = Math.max(0, ...habits.map(h => SM.calc.streak(h)));
    const lastAch = S.hobbies.achievements[S.hobbies.achievements.length - 1];

    return el('div', {},
      el('div', { class: 'stats-grid' },
        C.stat('هواياتي النشطة', String(active.length), {
          icon: '🎨', color: PINK, sub: active.length ? active.map(h => h.name).slice(0, 3).join('، ') : 'أضف هوايتك الأولى',
        }),
        C.stat('آخر مشروع', lastProject ? lastProject.title : '—', {
          icon: '🛠️', color: VIOLET, sub: lastProject ? lastProject.status : 'ابدأ مشروعًا صغيرًا',
        }),
        C.stat('ساعات الممارسة', U.minutesFmt(weekMin), { icon: '⏱️', color: PINK, sub: 'هذا الأسبوع' }),
        C.stat('سلسلة الممارسة', bestStreak ? `🔥 ${bestStreak} يوم` : '—', {
          icon: '⚡', color: VIOLET, sub: lastAch ? `آخر إنجاز: ${lastAch.text}` : 'استمر يومًا بعد يوم',
        }),
      ),
      el('div', { class: 'grid-2' },
        C.card('تسجيل سريع', sessionForm(S), { icon: '⏱️' }),
        C.card('معرض مصغّر', galleryGrid(S, 4), { icon: '🖼️', sub: 'آخر أعمالك المنجزة' }),
      ),
      C.card('متتبع العادات', C.habitBoard('hobbies'), { icon: '🔁', sub: 'ممارسة هواياتك تغذي مجال المهارات' }),
    );
  }

  function mylist(S) {
    const C = SM.C;
    return el('div', {},
      C.card('قائمة الهوايات', el('div', {},
        C.quickForm([
          { k: 'name', label: 'الهواية', placeholder: 'رسم، تصوير، طبخ...', grow: true },
          { k: 'status', label: 'الحالة', type: 'select', options: STATUSES },
          { k: 'time', label: 'وقت الممارسة', required: false, placeholder: 'مساء الخميس' },
        ], (v) => {
          const habit = { id: U.uid(), name: 'ممارسة ' + v.name, planetId: 'hobbies', area: 'skills', createdAt: U.todayKey(), log: {} };
          S.habits.push(habit);
          S.hobbies.list.push({ id: U.uid(), name: v.name, status: v.status || 'نشطة', time: v.time, level: 1, habitId: habit.id });
          SM.store.save(); C.toast('هواية جديدة + عادة مرتبطة بها 🎨'); SM.refresh();
        }),
        C.table({
          rows: () => S.hobbies.list,
          cols: [
            { label: 'الهواية', render: r => el('strong', {}, r.name) },
            {
              label: 'الحالة', render: (r) => el('select', {
                class: 'inp inp--sm', on: { change: (e) => { r.status = e.target.value; SM.store.save(); SM.refresh(); } },
              }, STATUSES.map(s => el('option', { value: s, selected: r.status === s }, s))),
            },
            { label: 'وقت الممارسة', render: r => r.time || '—' },
            {
              label: 'السلسلة', render: (r) => {
                const h = S.habits.find(x => x.id === r.habitId);
                const st = h ? SM.calc.streak(h) : 0;
                return st ? `🔥 ${st}` : '—';
              },
            },
          ],
          onDelete: (r) => {
            S.hobbies.list.splice(S.hobbies.list.indexOf(r), 1);
            const hIdx = S.habits.findIndex(x => x.id === r.habitId);
            if (hIdx > -1) S.habits.splice(hIdx, 1);
          },
          empty: 'ما هي الأشياء التي تنسيك الوقت؟ أضفها هنا',
          emptyIcon: '🎨',
        }),
        el('p', { class: 'hint' }, 'كل هواية جديدة تُنشئ عادة ممارسة مرتبطة بها تلقائيًا في متتبع العادات'),
      ), { icon: '🎨' }),
    );
  }

  function skill(S) {
    const C = SM.C;
    return el('div', {},
      C.card('مستواك في كل هواية', S.hobbies.list.length ? S.hobbies.list.map(h => el('div', { class: 'skillrow' },
        el('div', { class: 'skillrow__name' },
          el('strong', {}, h.name),
          el('div', { class: 'hint' }, U.minutesFmt(hobbyMinutes(S, h.id)) + ' ممارسة إجمالًا'),
        ),
        C.levelDots(h.level || 1, (lv) => { h.level = lv; }),
      )) : C.empty('🚀', 'أضف هواياتك أولًا من قسم «هواياتي»'), { icon: '🚀', sub: 'مبتدئ ← محترف' }),
      C.card('إنجازات وصلت لها', C.list({
        get: () => S.hobbies.achievements.slice().reverse(),
        render: (a) => '🏆 ' + a.text,
        meta: (a) => U.fmtDate(a.date),
        onAdd: (text) => S.hobbies.achievements.push({ id: U.uid(), text, date: U.todayKey() }),
        onDelete: (a) => S.hobbies.achievements.splice(S.hobbies.achievements.indexOf(a), 1),
        placeholder: 'أول لوحة كاملة، أول كيكة ناجحة...',
        empty: 'وثّق كل إنجاز مهما بدا صغيرًا',
        emptyIcon: '🏆',
      }), { icon: '🏆' }),
      C.card('عدّاد ساعات الممارسة', el('div', {},
        sessionForm(S),
        C.table({
          rows: () => S.hobbies.sessions.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 25),
          cols: [
            { label: 'التاريخ', render: r => U.fmtDate(r.date) },
            { label: 'الهواية', render: r => C.chip(hobbyName(S, r.hobbyId), PINK) },
            { label: 'المدة', render: r => U.minutesFmt(r.minutes) },
          ],
          onDelete: (r) => S.hobbies.sessions.splice(S.hobbies.sessions.indexOf(r), 1),
          empty: 'سجّل جلسات ممارستك لتتراكم ساعات خبرتك',
          emptyIcon: '⏱️',
        }),
      ), { icon: '⏱️' }),
    );
  }

  function projects(S) {
    const C = SM.C;
    const PSTAT = ['جارٍ', 'مؤجل', 'منجز'];
    return el('div', {},
      C.card('المشاريع الجارية', el('div', {},
        C.quickForm([
          { k: 'title', label: 'المشروع', placeholder: 'لوحة بورتريه، مقطع مونتاج...', grow: true },
          { k: 'hobbyId', label: 'الهواية', type: 'select', options: [{ v: '', label: '—' }, ...S.hobbies.list.map(h => ({ v: h.id, label: h.name }))] },
          { k: 'status', label: 'الحالة', type: 'select', options: PSTAT },
        ], (v) => {
          S.hobbies.projects.push({ id: U.uid(), title: v.title, hobbyId: v.hobbyId, status: v.status || 'جارٍ' });
          SM.store.save(); SM.refresh();
        }),
        C.table({
          rows: () => S.hobbies.projects,
          cols: [
            { label: 'المشروع', render: r => r.title },
            { label: 'الهواية', render: r => r.hobbyId ? C.chip(hobbyName(S, r.hobbyId), PINK) : '—' },
            {
              label: 'الحالة', render: (r) => el('select', {
                class: 'inp inp--sm', on: { change: (e) => { r.status = e.target.value; if (e.target.value === 'منجز') SM.C.toast('مشروع منجز! 🎉'); SM.store.save(); SM.refresh(); } },
              }, PSTAT.map(s => el('option', { value: s, selected: r.status === s }, s))),
            },
          ],
          onDelete: (r) => S.hobbies.projects.splice(S.hobbies.projects.indexOf(r), 1),
          empty: 'ما المشروع الذي تعمل عليه الآن؟',
          emptyIcon: '🛠️',
        }),
      ), { icon: '🛠️' }),
      C.card('أفكار مؤجلة', C.list({
        get: () => S.hobbies.ideas,
        render: (i) => '💭 ' + i.text,
        onAdd: (text) => S.hobbies.ideas.push({ id: U.uid(), text }),
        onDelete: (i) => S.hobbies.ideas.splice(S.hobbies.ideas.indexOf(i), 1),
        placeholder: 'فكرة تريد تنفيذها لاحقًا...',
        empty: 'خزّن أفكارك هنا قبل أن تهرب',
        emptyIcon: '💭',
      }), { icon: '💭' }),
      C.card('معرض الأعمال المنجزة', el('div', {},
        el('div', { class: 'row gap wrap', style: 'margin-bottom:12px' },
          el('button', {
            class: 'btn btn--acc',
            on: {
              click: async () => {
                const d = await C.pickImage({ max: 900 });
                if (!d) return;
                const m = C.modal('عمل جديد للمعرض 🖼️', el('div', {},
                  el('img', { src: d, class: 'gallery__full', style: 'margin-bottom:12px' }),
                  C.quickForm([
                    { k: 'caption', label: 'وصف العمل', required: false, placeholder: 'بورتريه بالفحم...', grow: true },
                  ], (v) => {
                    S.hobbies.gallery.push({ id: U.uid(), image: d, caption: v.caption, date: U.todayKey() });
                    SM.store.save(); m.close(); C.toast('أُضيف لمعرضك 🖼️'); SM.refresh();
                  }, { label: '✓ حفظ في المعرض' }),
                ));
              },
            },
          }, '📷 أضف عملًا للمعرض'),
        ),
        galleryGrid(S),
      ), { icon: '🖼️' }),
    );
  }

  function inspo(S) {
    const C = SM.C;
    const RTYPES = ['فيديو', 'حساب', 'موقع', 'درس'];
    return el('div', {},
      C.card('مراجع ودروس', el('div', {},
        C.quickForm([
          { k: 'title', label: 'الاسم', grow: true },
          { k: 'url', label: 'الرابط', required: false, placeholder: 'https://...' },
          { k: 'type', label: 'النوع', type: 'select', options: RTYPES },
        ], (v) => { S.hobbies.resources.push({ id: U.uid(), title: v.title, url: v.url, type: v.type }); SM.store.save(); SM.refresh(); }),
        C.table({
          rows: () => S.hobbies.resources,
          cols: [
            { label: 'الاسم', render: r => r.title },
            { label: 'النوع', render: r => C.chip(r.type, VIOLET) },
            { label: 'الرابط', render: r => r.url ? el('a', { href: r.url, target: '_blank', rel: 'noopener', class: 'link', dir: 'ltr' }, 'فتح ↗') : '—' },
          ],
          onDelete: (r) => S.hobbies.resources.splice(S.hobbies.resources.indexOf(r), 1),
          empty: 'فيديوهات وحسابات ومواقع تتعلم منها',
          emptyIcon: '🎬',
        }),
      ), { icon: '🎬' }),
      C.card('لوحة الإلهام', el('div', {},
        el('div', { class: 'row gap wrap', style: 'margin-bottom:12px' },
          el('button', {
            class: 'btn btn--acc',
            on: {
              click: async () => {
                const d = await C.pickImage({ max: 800 });
                if (d) { S.hobbies.inspiration.push({ id: U.uid(), image: d }); SM.store.save(); SM.refresh(); }
              },
            },
          }, '✨ أضف صورة ملهمة'),
        ),
        S.hobbies.inspiration.length ? el('div', { class: 'gallery gallery--inspo' },
          S.hobbies.inspiration.slice().reverse().map(i => el('figure', { class: 'gallery__item' },
            el('img', { src: i.image, loading: 'lazy', on: { click: () => SM.C.modal('إلهام ✨', el('img', { src: i.image, class: 'gallery__full' }), { wide: true }) } }),
            el('figcaption', {},
              el('span'),
              el('button', { class: 'iconbtn iconbtn--danger', on: { click: () => { S.hobbies.inspiration.splice(S.hobbies.inspiration.indexOf(i), 1); SM.store.save(); SM.refresh(); } } }, '✕')),
          ))) : C.empty('✨', 'صور وأشياء أعجبتك — مصدر طاقتك الإبداعية'),
      ), { icon: '✨' }),
      C.card('أدوات ومعدات', C.list({
        get: () => S.hobbies.tools,
        render: (t) => t.name,
        checked: (t) => t.owned,
        onToggle: (t) => { t.owned = !t.owned; },
        onAdd: (name) => S.hobbies.tools.push({ id: U.uid(), name, owned: false }),
        onDelete: (t) => S.hobbies.tools.splice(S.hobbies.tools.indexOf(t), 1),
        placeholder: 'أداة تحتاجها أو تريد شراءها...',
        empty: 'قائمة أدواتك — علّم على ما اشتريته',
        emptyIcon: '🧰',
      }), { icon: '🧰', sub: '✓ = امتلكتها' }),
    );
  }

  SM.views.hobbies = function (planet, secId) {
    const S = SM.store.state;
    switch (secId) {
      case 'mylist': return mylist(S);
      case 'skill': return skill(S);
      case 'projects': return projects(S);
      case 'inspo': return inspo(S);
      default: return dash(S);
    }
  };
})();
