/* Second Mind — كوكب الصحة */
(function () {
  const U = SM.U, el = SM.el;

  const WORKOUT_TYPES = ['جري', 'حديد', 'HIIT', 'يوغا', 'مشي', 'سباحة', 'أخرى'];
  const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  function sportDaysThisWeek(S) {
    const days = new Set(S.health.workouts.map(w => w.date));
    return U.lastNDays(7).filter(d => days.has(d)).length;
  }

  function waterWidget(S, big) {
    const C = SM.C;
    const today = U.todayKey();
    const cups = S.health.water[today] || 0;
    const goal = S.settings.waterGoal;
    const set = (v) => { S.health.water[today] = U.clamp(v, 0, 30); SM.store.save(); SM.refresh(); };
    return el('div', { class: 'water' + (big ? ' water--big' : '') },
      el('div', { class: 'water__cups' },
        Array.from({ length: goal }, (_, i) => el('span', { class: 'water__cup' + (i < cups ? ' on' : '') }, '💧')),
      ),
      el('div', { class: 'row gap-s center' },
        el('button', { class: 'iconbtn', on: { click: () => set(cups - 1) } }, '−'),
        el('span', { class: 'water__count' }, `${cups} / ${goal} أكواب`),
        el('button', { class: 'iconbtn', on: { click: () => set(cups + 1) } }, '+'),
      ),
      cups >= goal ? el('div', { class: 'hint center', style: 'color:#38bdf8' }, 'اكتمل هدف اليوم! 🌊') : null,
    );
  }

  function dash(S) {
    const C = SM.C;
    const goal = S.settings.sportWeeklyGoal;
    const sportDays = sportDaysThisWeek(S);

    const moodVals = U.lastNDays(7).map(d => S.health.mood[d]).filter(Boolean);
    const moodAvg = moodVals.length ? Math.round(U.sum(moodVals) / moodVals.length) : null;

    const weekWater = U.sum(U.lastNDays(7).map(d => S.health.water[d] || 0));

    const planetHabits = S.habits.filter(h => h.planetId === 'health');
    const best = planetHabits.reduce((b, h) => {
      const s = SM.calc.streak(h);
      return s > (b ? b.s : -1) ? { h, s } : b;
    }, null);

    const wkHealth = SM.calc.areaProgress('health', U.lastNDays(7));
    const moHealth = SM.calc.areaProgress('health', U.lastNDays(30));
    const wkMental = SM.calc.areaProgress('mental', U.lastNDays(7));

    return el('div', {},
      el('div', { class: 'stats-grid' },
        C.stat('الالتزام بالرياضة', `${sportDays} / ${goal} أيام`, {
          icon: '🏃‍♀️', color: '#34d399', sub: 'هذا الأسبوع',
          extra: C.bar(U.pct(sportDays, goal), '#34d399', { slim: true }),
        }),
        C.stat('مزاج الأسبوع', moodAvg ? `${C.moodEmoji(moodAvg)} ${C.moodLabel(moodAvg)}` : '—', {
          icon: '🌤️', color: '#7dd3fc', sub: moodVals.length ? `${moodVals.length} أيام مسجلة` : 'سجّل مزاجك في قسم الصحة النفسية',
        }),
        C.stat('الماء', `${S.health.water[U.todayKey()] || 0} أكواب اليوم`, {
          icon: '💧', color: '#38bdf8', sub: `${weekWater} كوب هذا الأسبوع`,
        }),
        C.stat('أطول سلسلة نشطة', best && best.s > 0 ? `🔥 ${best.s} يوم` : '—', {
          icon: '⚡', color: '#fbbf24', sub: best && best.s > 0 ? best.h.name : 'ابدأ سلسلة اليوم!',
        }),
      ),
      C.card('تقدّم الصحة العام', el('div', {},
        el('div', { class: 'prow' }, el('span', { class: 'dot', style: 'background:#34d399' }), el('span', { class: 'prow__name' }, 'الصحة — أسبوعي'), el('div', { class: 'prow__bar' }, C.bar(wkHealth, '#34d399')), el('span', { class: 'prow__pct' }, wkHealth == null ? '—' : wkHealth + '%')),
        el('div', { class: 'prow' }, el('span', { class: 'dot', style: 'background:#34d399' }), el('span', { class: 'prow__name' }, 'الصحة — شهري'), el('div', { class: 'prow__bar' }, C.bar(moHealth, '#34d399')), el('span', { class: 'prow__pct' }, moHealth == null ? '—' : moHealth + '%')),
        el('div', { class: 'prow' }, el('span', { class: 'dot', style: 'background:#7dd3fc' }), el('span', { class: 'prow__name' }, 'الصحة النفسية — أسبوعي'), el('div', { class: 'prow__bar' }, C.bar(wkMental, '#7dd3fc')), el('span', { class: 'prow__pct' }, wkMental == null ? '—' : wkMental + '%')),
        el('p', { class: 'hint' }, 'هذه الأشرطة تغذّي مربع التقدم في الواجهة الرئيسية'),
      ), { icon: '📊' }),
      C.card('متتبع العادات', C.habitBoard('health'), { icon: '🔁', sub: 'عادات الصحة والصحة النفسية — تغذي ضوء الشمس' }),
    );
  }

  function sport(S) {
    const C = SM.C;
    const goal = S.settings.sportWeeklyGoal;
    const done = sportDaysThisWeek(S);

    const schedule = el('div', { class: 'wsched' },
      DAY_NAMES.map((n, i) => {
        const sel = el('select', { class: 'inp', on: { change: (e) => { S.health.weekSchedule[i] = e.target.value; SM.store.save(); } } },
          ['—', ...WORKOUT_TYPES, 'راحة'].map(t => el('option', { value: t, selected: (S.health.weekSchedule[i] || '—') === t }, t)));
        return el('div', { class: 'wsched__day' + (i === new Date().getDay() ? ' today' : '') },
          el('div', { class: 'wsched__name' }, n), sel);
      }),
    );

    return el('div', {},
      C.card('الهدف الأسبوعي', el('div', {},
        el('div', { class: 'row gap center-v' },
          el('span', { class: 'big-num', style: 'color:#34d399' }, `${done}/${goal}`),
          el('div', { style: 'flex:1' }, C.bar(U.pct(done, goal), '#34d399')),
        ),
        el('p', { class: 'hint' }, `هدفك ${goal} أيام تمرين بالأسبوع — عدّله من إعدادات الواجهة`),
      ), { icon: '🎯' }),
      C.card('الجدول الأسبوعي للتمارين', schedule, { icon: '🗓️', sub: 'أيام الجري / الحديد / الراحة' }),
      C.card('سجل التمارين (Workout log)', el('div', {},
        C.quickForm([
          { k: 'date', label: 'التاريخ', type: 'date', value: 'today' },
          { k: 'type', label: 'النوع', type: 'select', options: WORKOUT_TYPES },
          { k: 'duration', label: 'المدة (دقيقة)', type: 'number', min: 1, value: 30 },
          { k: 'detail', label: 'التكرارات/التفاصيل', required: false, placeholder: '3 جولات × 12', grow: true },
        ], (v) => {
          S.health.workouts.push({ id: U.uid(), date: v.date, type: v.type, duration: v.duration, detail: v.detail });
          SM.store.save(); C.toast('تمرين مسجّل 💪'); SM.refresh();
        }),
        C.table({
          rows: () => S.health.workouts.slice().sort((a, b) => b.date.localeCompare(a.date)),
          cols: [
            { label: 'التاريخ', render: r => U.fmtDate(r.date) },
            { label: 'النوع', render: r => C.chip(r.type, '#34d399') },
            { label: 'المدة', render: r => U.minutesFmt(r.duration) },
            { label: 'التفاصيل', render: r => r.detail || '—' },
          ],
          onDelete: (r) => S.health.workouts.splice(S.health.workouts.indexOf(r), 1),
          empty: 'لا تمارين مسجلة — أول تمرين هو الأصعب فقط 💪',
          emptyIcon: '🏋️‍♀️',
        }),
      ), { icon: '📒' }),
    );
  }

  function food(S) {
    const C = SM.C;
    const weekDays = U.lastNDays(7);
    return el('div', {},
      C.card('متتبع الماء (Water tracker)', el('div', {},
        waterWidget(S, true),
        el('div', { class: 'cchart', style: '--h:80px;margin-top:14px' },
          weekDays.map(d => el('div', { class: 'cchart__col' },
            el('div', { class: 'cchart__bars' },
              el('div', { class: 'cchart__bar', style: `height:${Math.min(100, ((S.health.water[d] || 0) / S.settings.waterGoal) * 100)}%;background:#38bdf8`, title: `${U.fmtDate(d)}: ${S.health.water[d] || 0}` })),
            el('div', { class: 'cchart__label' }, U.dayLetter(d)),
          )),
        ),
      ), { icon: '💧' }),
      C.card('سجل الوجبات (Meal log)', el('div', {},
        C.quickForm([
          { k: 'date', label: 'التاريخ', type: 'date', value: 'today' },
          { k: 'meal', label: 'الوجبة', type: 'select', options: ['فطور', 'غداء', 'عشاء', 'سناك'] },
          { k: 'desc', label: 'ماذا أكلت؟', placeholder: 'شوفان بالفواكه...', grow: true },
        ], (v) => {
          S.health.meals.push({ id: U.uid(), date: v.date, meal: v.meal, desc: v.desc });
          SM.store.save(); SM.refresh();
        }),
        C.table({
          rows: () => S.health.meals.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 40),
          cols: [
            { label: 'التاريخ', render: r => U.fmtDate(r.date) },
            { label: 'الوجبة', render: r => C.chip(r.meal, '#a3e635') },
            { label: 'الوصف', render: r => r.desc },
          ],
          onDelete: (r) => S.health.meals.splice(S.health.meals.indexOf(r), 1),
          empty: 'سجّل وجباتك لتلاحظ نمط أكلك',
          emptyIcon: '🍽️',
        }),
      ), { icon: '🥗' }),
      C.card('وصفات وملاحظات صحية', el('div', {},
        C.quickForm([
          { k: 'title', label: 'العنوان', placeholder: 'سموذي الطاقة', grow: true },
          { k: 'body', label: 'الوصفة/الملاحظة', type: 'textarea', required: false },
        ], (v) => { S.health.recipes.push({ id: U.uid(), title: v.title, body: v.body }); SM.store.save(); SM.refresh(); }),
        S.health.recipes.length ? S.health.recipes.slice().reverse().map(r =>
          el('details', { class: 'acc' },
            el('summary', {}, '🍯 ' + r.title,
              el('button', { class: 'iconbtn iconbtn--danger', on: { click: (e) => { e.preventDefault(); S.health.recipes.splice(S.health.recipes.indexOf(r), 1); SM.store.save(); SM.refresh(); } } }, '✕')),
            el('p', { class: 'acc__body' }, r.body || '—'),
          )) : C.empty('🍯', 'احفظ وصفاتك الصحية المفضلة هنا'),
      ), { icon: '📖' }),
    );
  }

  function care(S) {
    const C = SM.C;
    const routine = S.health.careRoutine;
    return el('div', {},
      C.card('روتين العناية (Routine checklist)', el('div', {},
        C.quickForm([
          { k: 'title', label: 'خطوة جديدة', placeholder: 'العناية بالبشرة مساءً', grow: true },
          { k: 'freq', label: 'التكرار', type: 'select', options: [{ v: 'daily', label: 'يومي' }, { v: 'weekly', label: 'أسبوعي' }] },
        ], (v) => { routine.push({ id: U.uid(), title: v.title, freq: v.freq || 'daily', checks: {} }); SM.store.save(); SM.refresh(); }),
        routine.length ? routine.map(r => {
          const key = r.freq === 'daily' ? U.todayKey() : U.weekKey();
          const on = !!r.checks[key];
          return el('div', { class: 'slist__item' + (on ? ' done' : '') },
            el('button', { class: 'checkbtn' + (on ? ' on' : ''), on: { click: () => { if (on) delete r.checks[key]; else r.checks[key] = true; SM.store.save(); SM.refresh(); } } }, on ? '✓' : ''),
            el('div', { class: 'slist__text' }, r.title),
            el('div', { class: 'slist__meta' }, C.chip(r.freq === 'daily' ? 'يومي' : 'أسبوعي', '#67e8f9')),
            el('button', { class: 'iconbtn iconbtn--danger', on: { click: () => { routine.splice(routine.indexOf(r), 1); SM.store.save(); SM.refresh(); } } }, '✕'),
          );
        }) : C.empty('🧴', 'أضف خطوات روتينك اليومي والأسبوعي'),
        el('p', { class: 'hint' }, 'اليومي يتصفّر كل يوم، والأسبوعي كل أسبوع — علّم عليها عند إتمامها'),
      ), { icon: '✅' }),
      C.card('تذكيرات دورية', el('div', {},
        C.quickForm([
          { k: 'title', label: 'الموعد', placeholder: 'حلاقة، طبيب أسنان...', grow: true },
          { k: 'everyDays', label: 'كل كم يوم؟', type: 'number', min: 1, value: 30 },
          { k: 'lastDone', label: 'آخر مرة', type: 'date', value: 'today' },
        ], (v) => { S.health.careReminders.push({ id: U.uid(), title: v.title, everyDays: v.everyDays || 30, lastDone: v.lastDone }); SM.store.save(); SM.refresh(); }),
        C.table({
          rows: () => S.health.careReminders,
          cols: [
            { label: 'الموعد', render: r => r.title },
            { label: 'التكرار', render: r => `كل ${r.everyDays} يوم` },
            {
              label: 'الحالة', render: (r) => {
                const next = U.todayKey(U.addDays(U.parseKey(r.lastDone), r.everyDays));
                const d = U.daysUntil(next);
                return d <= 0 ? C.chip('مستحق الآن 🔔', '#f87171') : C.chip(`بعد ${d} يوم`, d <= 3 ? '#fb923c' : '#4ade80');
              },
            },
            {
              label: '', render: (r) => el('button', {
                class: 'btn btn--sm', on: { click: () => { r.lastDone = U.todayKey(); SM.store.save(); SM.C.toast('تم التحديث ✨'); SM.refresh(); } },
              }, '✓ تم اليوم'),
            },
          ],
          onDelete: (r) => S.health.careReminders.splice(S.health.careReminders.indexOf(r), 1),
          empty: 'أضف مواعيدك المتكررة ولن تنساها مجددًا',
          emptyIcon: '⏰',
        }),
      ), { icon: '⏰' }),
    );
  }

  function mind(S) {
    const C = SM.C;
    const today = U.todayKey();
    const cur = S.health.mood[today];

    const picker = el('div', { class: 'moodpick' },
      [1, 2, 3, 4, 5].map(v => el('button', {
        class: 'moodpick__btn' + (cur === v ? ' on' : ''),
        title: C.moodLabel(v),
        on: { click: () => { S.health.mood[today] = v; SM.store.save(); C.toast('مزاج اليوم مسجّل 🌿'); SM.refresh(); } },
      }, C.moodEmoji(v))),
    );

    const days30 = U.lastNDays(30);
    const moodPoints = days30.filter(d => S.health.mood[d]).map(d => ({ label: U.fmtDate(d), value: S.health.mood[d] }));

    const sleep7 = S.health.sleep.filter(s => U.lastNDays(7).includes(s.date));
    const sleepAvg = sleep7.length ? (U.sum(sleep7, s => s.hours) / sleep7.length).toFixed(1) : null;

    return el('div', {},
      C.card('متتبع المزاج (Mood tracker)', el('div', {},
        el('div', { class: 'center muted', style: 'margin-bottom:8px' }, 'كيف تشعر اليوم؟'),
        picker,
        el('div', { class: 'sep' }),
        moodPoints.length >= 2
          ? C.lineChart({ points: moodPoints, min: 1, max: 5, color: '#7dd3fc', height: 150 })
          : el('p', { class: 'hint center' }, 'سجّل مزاجك يوميًا ليظهر نمطك عبر الوقت'),
      ), { icon: '🌤️' }),
      el('div', { class: 'grid-2' },
        C.card('اليوميات (Journal)', el('div', {},
          C.quickForm([
            { k: 'text', label: 'ماذا يدور في بالك؟', type: 'textarea', rows: 3, required: false, grow: true },
          ], (v) => { if (!v.text) return; S.health.journal.push({ id: U.uid(), date: today, text: v.text }); SM.store.save(); SM.refresh(); }, { label: '+ تدوينة' }),
          S.health.journal.slice().reverse().slice(0, 15).map(j => el('div', { class: 'jentry' },
            el('div', { class: 'jentry__date' }, U.fmtDateLong(j.date),
              el('button', { class: 'iconbtn iconbtn--danger', on: { click: () => { S.health.journal.splice(S.health.journal.indexOf(j), 1); SM.store.save(); SM.refresh(); } } }, '✕')),
            el('p', { class: 'jentry__text' }, j.text),
          )),
          !S.health.journal.length ? C.empty('📓', 'مساحتك الآمنة للفضفضة') : null,
        ), { icon: '📓' }),
        C.card('الامتنان (Gratitude)', el('div', {},
          C.list({
            get: () => S.health.gratitude.slice().reverse().slice(0, 20),
            render: (g) => '🌸 ' + g.text,
            meta: (g) => U.fmtDate(g.date),
            onDelete: (g) => S.health.gratitude.splice(S.health.gratitude.indexOf(g), 1),
            onAdd: (text) => S.health.gratitude.push({ id: U.uid(), date: today, text }),
            placeholder: 'اليوم أنا ممتن لـ...',
            empty: 'اكتب 3 أشياء تمتن لها كل يوم',
            emptyIcon: '🌸',
          }),
        ), { icon: '🌸' }),
      ),
      el('div', { class: 'grid-2' },
        C.card('تنفّس وتأمل', C.breath(), { icon: '🧘‍♀️' }),
        C.card('متتبع النوم (Sleep)', el('div', {},
          sleepAvg ? el('div', { class: 'center', style: 'margin-bottom:10px' },
            el('span', { class: 'big-num', style: 'color:#a78bfa' }, sleepAvg), el('span', { class: 'muted' }, ' ساعة/ليلة هذا الأسبوع')) : null,
          C.quickForm([
            { k: 'date', label: 'الليلة', type: 'date', value: 'today' },
            { k: 'hours', label: 'الساعات', type: 'number', min: 0, max: 16, step: 0.5, value: 8 },
            { k: 'quality', label: 'الجودة', type: 'select', options: ['ممتاز', 'جيد', 'متقطع', 'سيئ'] },
          ], (v) => { S.health.sleep.push({ id: U.uid(), date: v.date, hours: v.hours, quality: v.quality }); SM.store.save(); SM.refresh(); }),
          C.table({
            rows: () => S.health.sleep.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 14),
            cols: [
              { label: 'التاريخ', render: r => U.fmtDate(r.date) },
              { label: 'الساعات', render: r => r.hours + ' س' },
              { label: 'الجودة', render: r => C.chip(r.quality, { 'ممتاز': '#4ade80', 'جيد': '#a3e635', 'متقطع': '#fb923c', 'سيئ': '#f87171' }[r.quality]) },
            ],
            onDelete: (r) => S.health.sleep.splice(S.health.sleep.indexOf(r), 1),
            empty: 'تتبّع نومك — هو نصف طاقتك',
            emptyIcon: '😴',
          }),
        ), { icon: '😴' }),
      ),
    );
  }

  SM.views.health = function (planet, secId) {
    const S = SM.store.state;
    switch (secId) {
      case 'sport': return sport(S);
      case 'food': return food(S);
      case 'care': return care(S);
      case 'mind': return mind(S);
      default: return dash(S);
    }
  };
})();
