/* Second Mind — كوكب الدراسة */
(function () {
  const U = SM.U, el = SM.el;
  const BROWN = '#c19a6b', AMBER = '#fbbf24';
  const DAY_NAMES = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const PRIORITIES = ['عالية', 'متوسطة', 'منخفضة'];
  const prColor = (p) => ({ 'عالية': '#f87171', 'متوسطة': '#fb923c', 'منخفضة': '#4ade80' }[p] || '#94a3b8');

  const subjName = (S, id) => (S.study.subjects.find(s => s.id === id) || {}).name || '—';
  const subjOptions = (S, withNone = true) => [
    ...(withNone ? [{ v: '', label: '—' }] : []),
    ...S.study.subjects.map(s => ({ v: s.id, label: s.name })),
  ];
  const weekMinutes = (S) => U.sum(S.study.sessions.filter(s => U.lastNDays(7).includes(s.date)), s => s.minutes);

  function pendingHomework(S) {
    return S.study.homework.filter(h => !h.done)
      .sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || PRIORITIES.indexOf(a.priority) - PRIORITIES.indexOf(b.priority));
  }
  function nextExam(S) {
    return S.study.exams.filter(e => U.daysUntil(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date))[0] || null;
  }

  function dash(S) {
    const C = SM.C;
    const pend = pendingHomework(S);
    const nextHw = pend[0];
    const exam = nextExam(S);
    const wkMin = weekMinutes(S);
    const highCount = pend.filter(h => h.priority === 'عالية').length;

    return el('div', {},
      el('div', { class: 'stats-grid' },
        C.stat('أقرب تسليم', nextHw ? nextHw.title : '—', {
          icon: '📤', color: BROWN,
          sub: nextHw ? `${subjName(S, nextHw.subjectId)} · ${U.fmtDate(nextHw.due)}` : 'لا تسليمات معلقة 🎉',
          extra: nextHw && nextHw.due ? C.countdownChip(nextHw.due) : null,
        }),
        C.stat('أقرب اختبار', exam ? exam.title : '—', {
          icon: '⏳', color: '#f87171',
          sub: exam ? subjName(S, exam.subjectId) : 'لا اختبارات قادمة',
          extra: exam ? el('div', { class: 'countdown' }, el('b', {}, String(U.daysUntil(exam.date))), ' يوم متبقي') : null,
        }),
        C.stat('واجبات معلقة', String(pend.length), {
          icon: '📝', color: AMBER, sub: highCount ? `منها ${highCount} بأولوية عالية 🔴` : 'مرتّبة حسب الأولوية',
        }),
        C.stat('ساعات المذاكرة', U.minutesFmt(wkMin), {
          icon: '⏱️', color: BROWN, sub: 'هذا الأسبوع — تغذي اللون البني',
        }),
      ),
      el('div', { class: 'grid-2' },
        C.card('الواجبات القادمة', pend.length ? pend.slice(0, 5).map(h => el('div', { class: 'slist__item' },
          el('span', { class: 'dot', style: `background:${prColor(h.priority)}` }),
          el('div', { class: 'slist__text' }, h.title, el('div', { class: 'hint' }, subjName(S, h.subjectId))),
          el('div', { class: 'slist__meta' }, h.due ? C.countdownChip(h.due) : null),
        )) : C.empty('🎉', 'كل واجباتك منجزة'), { icon: '📝' }),
        C.card('تسجيل مذاكرة سريع', el('div', {},
          C.quickForm([
            { k: 'minutes', label: 'دقائق المذاكرة', type: 'number', min: 5, value: 45 },
          ], (v) => {
            S.study.sessions.push({ id: U.uid(), date: U.todayKey(), minutes: v.minutes, source: 'manual' });
            SM.store.save(); C.toast('جلسة مذاكرة مسجلة 📚'); SM.refresh();
          }, { label: '+ سجّل' }),
          el('p', { class: 'hint' }, 'أو استخدم مؤقت بومودورو في قسم الملاحظات — يسجل تلقائيًا'),
        ), { icon: '⏱️' }),
      ),
      C.card('متتبع العادات الدراسية', C.habitBoard('study'), { icon: '🔁' }),
    );
  }

  function subjects(S) {
    const C = SM.C;
    return el('div', {},
      C.card('قائمة المواد', el('div', {},
        C.quickForm([
          { k: 'name', label: 'المادة', placeholder: 'رياضيات، فيزياء...', grow: true },
          { k: 'status', label: 'الحالة', type: 'select', options: ['جارية', 'منتهية'] },
          { k: 'grade', label: 'درجتك الحالية', required: false, placeholder: '95 أو A+' },
        ], (v) => {
          S.study.subjects.push({ id: U.uid(), name: v.name, status: v.status || 'جارية', grade: v.grade, summary: '' });
          SM.store.save(); SM.refresh();
        }),
        C.table({
          rows: () => S.study.subjects,
          cols: [
            { label: 'المادة', render: r => el('strong', {}, r.name) },
            { label: 'الحالة', render: r => C.chip(r.status, r.status === 'جارية' ? '#4ade80' : '#94a3b8') },
            {
              label: 'الدرجة', render: (r) => el('input', {
                class: 'inp inp--sm', value: r.grade || '', placeholder: '—', style: 'width:80px',
                on: { change: (e) => { r.grade = e.target.value.trim(); SM.store.save(); } },
              }),
            },
            {
              label: 'ملخص', render: (r) => el('button', {
                class: 'btn btn--sm', on: {
                  click: () => {
                    const ta = el('textarea', { class: 'inp', rows: 8 }, r.summary || '');
                    const m = C.modal(`ملخص ${r.name} 📘`, el('div', {}, ta,
                      el('button', { class: 'btn btn--acc', style: 'margin-top:10px', on: { click: () => { r.summary = ta.value; SM.store.save(); m.close(); C.toast('حُفظ الملخص ✓'); } } }, '✓ حفظ'),
                    ));
                  },
                },
              }, r.summary ? '📄 عرض/تعديل' : '+ إضافة'),
            },
          ],
          onDelete: (r) => S.study.subjects.splice(S.study.subjects.indexOf(r), 1),
          empty: 'أضف موادك الدراسية لهذا الفصل',
          emptyIcon: '📘',
        }),
      ), { icon: '📘' }),
      C.card('ملفات وروابط لكل مادة', el('div', {},
        C.quickForm([
          { k: 'subjectId', label: 'المادة', type: 'select', options: subjOptions(S) },
          { k: 'title', label: 'الاسم', grow: true },
          { k: 'url', label: 'الرابط', required: false, placeholder: 'https://...' },
        ], (v) => { S.study.files.push({ id: U.uid(), subjectId: v.subjectId, title: v.title, url: v.url }); SM.store.save(); SM.refresh(); }),
        C.table({
          rows: () => S.study.files,
          cols: [
            { label: 'المادة', render: r => C.chip(subjName(S, r.subjectId), BROWN) },
            { label: 'الاسم', render: r => r.title },
            { label: 'الرابط', render: r => r.url ? el('a', { href: r.url, target: '_blank', rel: 'noopener', class: 'link' }, 'فتح ↗') : '—' },
          ],
          onDelete: (r) => S.study.files.splice(S.study.files.indexOf(r), 1),
          empty: 'روابط الكتب والمراجع والملازم',
          emptyIcon: '🔗',
        }),
      ), { icon: '🔗' }),
    );
  }

  function homework(S) {
    const C = SM.C;
    return el('div', {},
      C.card('متتبع الواجبات', el('div', {},
        C.quickForm([
          { k: 'title', label: 'الواجب', grow: true },
          { k: 'subjectId', label: 'المادة', type: 'select', options: subjOptions(S) },
          { k: 'due', label: 'موعد التسليم', type: 'date' },
          { k: 'priority', label: 'الأولوية', type: 'select', options: PRIORITIES },
        ], (v) => {
          S.study.homework.push({ id: U.uid(), title: v.title, subjectId: v.subjectId, due: v.due, priority: v.priority || 'متوسطة', done: false });
          SM.store.save(); SM.refresh();
        }),
        C.table({
          rows: () => [...pendingHomework(S), ...S.study.homework.filter(h => h.done)],
          rowClass: (r) => r.done ? 'row-done' : (r.due && U.daysUntil(r.due) < 0 ? 'row-late' : ''),
          cols: [
            {
              label: '', render: (r) => el('button', {
                class: 'checkbtn' + (r.done ? ' on' : ''),
                on: { click: () => { r.done = !r.done; if (r.done) SM.C.toast('واجب منجز ✅'); SM.store.save(); SM.refresh(); } },
              }, r.done ? '✓' : ''),
            },
            { label: 'الواجب', render: r => r.title },
            { label: 'المادة', render: r => r.subjectId ? C.chip(subjName(S, r.subjectId), BROWN) : '—' },
            { label: 'التسليم', render: r => r.done ? U.fmtDate(r.due) : (r.due ? C.countdownChip(r.due) : '—') },
            { label: 'الأولوية', render: r => C.chip(r.priority, prColor(r.priority)) },
          ],
          onDelete: (r) => S.study.homework.splice(S.study.homework.indexOf(r), 1),
          empty: 'لا واجبات — استغل وقتك بمراجعة خفيفة ✨',
          emptyIcon: '📝',
        }),
        el('p', { class: 'hint' }, 'مرتّبة تلقائيًا: الأقرب تسليمًا ثم الأعلى أولوية · الصفوف الحمراء متأخرة'),
      ), { icon: '📝' }),
    );
  }

  function schedule(S) {
    const C = SM.C;
    const grid = el('div', { class: 'studygrid' },
      DAY_NAMES.map((name, i) => {
        const entries = S.study.schedule[i] || (S.study.schedule[i] = []);
        return el('div', { class: 'studygrid__day glass-soft' + (i === new Date().getDay() ? ' today' : '') },
          el('div', { class: 'studygrid__name' }, name),
          entries.sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(en => el('div', { class: 'studygrid__entry' },
            el('span', { class: 'studygrid__time' }, en.time || ''),
            el('span', {}, en.text),
            el('button', { class: 'iconbtn iconbtn--danger', on: { click: () => { entries.splice(entries.indexOf(en), 1); SM.store.save(); SM.refresh(); } } }, '✕'),
          )),
          el('button', {
            class: 'btn btn--sm', style: 'margin-top:6px', on: {
              click: () => {
                const timeInp = el('input', { class: 'inp', type: 'time', value: '16:00' });
                const textInp = el('input', { class: 'inp', placeholder: 'مذاكرة رياضيات...' });
                const m = C.modal(`إضافة لجدول ${name}`, el('div', {},
                  el('label', { class: 'qform__field' }, el('span', { class: 'qform__label' }, 'الوقت'), timeInp),
                  el('label', { class: 'qform__field' }, el('span', { class: 'qform__label' }, 'النشاط'), textInp),
                  el('button', {
                    class: 'btn btn--acc', style: 'margin-top:10px', on: {
                      click: () => {
                        if (!textInp.value.trim()) return;
                        entries.push({ id: U.uid(), time: timeInp.value, text: textInp.value.trim() });
                        SM.store.save(); m.close(); SM.refresh();
                      },
                    },
                  }, '+ إضافة'),
                ));
              },
            },
          }, '+ نشاط'),
        );
      }),
    );

    return el('div', {},
      C.card('الجدول الدراسي الأسبوعي', grid, { icon: '🗓️' }),
      C.card('الاختبارات (عد تنازلي)', el('div', {},
        C.quickForm([
          { k: 'title', label: 'الاختبار', placeholder: 'اختبار الفصل الأول', grow: true },
          { k: 'subjectId', label: 'المادة', type: 'select', options: subjOptions(S) },
          { k: 'date', label: 'التاريخ', type: 'date' },
        ], (v) => { S.study.exams.push({ id: U.uid(), title: v.title, subjectId: v.subjectId, date: v.date }); SM.store.save(); SM.refresh(); }),
        S.study.exams.length ? el('div', { class: 'stats-grid' },
          S.study.exams.slice().sort((a, b) => a.date.localeCompare(b.date)).map(e => {
            const d = U.daysUntil(e.date);
            return el('div', { class: 'stat glass', style: `--sc:${d != null && d <= 7 ? '#f87171' : BROWN}` },
              el('div', { class: 'stat__top' }, el('span', { class: 'stat__icon' }, '⏳'), el('span', { class: 'stat__label' }, e.title)),
              el('div', { class: 'stat__value' }, d == null ? '—' : d < 0 ? 'انتهى' : d === 0 ? 'اليوم!' : `${d} يوم`),
              el('div', { class: 'stat__sub' }, `${subjName(S, e.subjectId)} · ${U.fmtDate(e.date)}`,
                el('button', { class: 'iconbtn iconbtn--danger', style: 'margin-inline-start:8px', on: { click: () => { S.study.exams.splice(S.study.exams.indexOf(e), 1); SM.store.save(); SM.refresh(); } } }, '✕')),
            );
          })) : C.empty('⏳', 'أضف اختباراتك ليبدأ العد التنازلي'),
      ), { icon: '⏳' }),
      C.card('التقويم', C.calendar((dateKey) => {
        const evs = [];
        S.study.homework.forEach(h => { if (h.due === dateKey && !h.done) evs.push({ color: '#fbbf24', title: '📝 ' + h.title }); });
        S.study.exams.forEach(e => { if (e.date === dateKey) evs.push({ color: '#f87171', title: '⏳ ' + e.title }); });
        return evs;
      }), { icon: '📆', sub: '🟡 تسليمات · 🔴 اختبارات — مرّر فوق اليوم للتفاصيل' }),
    );
  }

  function notes(S) {
    const C = SM.C;
    return el('div', {},
      el('div', { class: 'grid-2' },
        C.card('مؤقت بومودورو', C.pomodoro(), { icon: '🍅', sub: 'كل جلسة تركيز تُسجّل تلقائيًا في ساعات المذاكرة' }),
        C.card('ساعات المذاكرة', el('div', {},
          el('div', { class: 'center', style: 'margin-bottom:10px' },
            el('span', { class: 'big-num', style: `color:${BROWN}` }, U.minutesFmt(weekMinutes(S))),
            el('div', { class: 'hint' }, 'هذا الأسبوع'),
          ),
          C.colChart(U.lastNDays(7).map(d => ({
            label: U.dayLetter(d),
            bars: [{ v: U.sum(S.study.sessions.filter(s => s.date === d), s => s.minutes), color: BROWN, title: U.fmtDate(d) }],
          })), { height: 100, fmt: U.minutesFmt }),
        ), { icon: '⏱️' }),
      ),
      C.card('ملاحظات ومراجعات لكل مادة', el('div', {},
        C.quickForm([
          { k: 'subjectId', label: 'المادة', type: 'select', options: subjOptions(S) },
          { k: 'title', label: 'العنوان', grow: true },
          { k: 'body', label: 'الملاحظة', type: 'textarea', rows: 3 },
        ], (v) => { S.study.notes.push({ id: U.uid(), subjectId: v.subjectId, title: v.title, body: v.body }); SM.store.save(); SM.refresh(); }),
        S.study.notes.length ? S.study.notes.slice().reverse().map(n => el('details', { class: 'acc' },
          el('summary', {}, '🗒️ ' + n.title, ' ', n.subjectId ? C.chip(subjName(S, n.subjectId), BROWN) : '',
            el('button', { class: 'iconbtn iconbtn--danger', on: { click: (e) => { e.preventDefault(); S.study.notes.splice(S.study.notes.indexOf(n), 1); SM.store.save(); SM.refresh(); } } }, '✕')),
          el('p', { class: 'acc__body' }, n.body || '—'),
        )) : C.empty('🗒️', 'ملاحظاتك ومراجعاتك لكل مادة'),
      ), { icon: '🗒️' }),
      C.card('بطاقات المراجعة (Flashcards)', C.flash(() => S.study.flashcards), { icon: '🎴' }),
    );
  }

  function grades(S) {
    const C = SM.C;
    const withPct = S.study.grades.filter(g => g.outOf > 0);
    const avg = withPct.length ? Math.round(U.sum(withPct, g => (g.score / g.outOf) * 100) / withPct.length) : null;
    return el('div', {},
      C.card('المعدل العام', el('div', { class: 'center' },
        el('span', { class: 'big-num', style: `color:${avg == null ? '#94a3b8' : avg >= 90 ? '#4ade80' : avg >= 75 ? AMBER : '#f87171'}` }, avg == null ? '—' : avg + '%'),
        el('p', { class: 'hint' }, withPct.length ? `محسوب من ${withPct.length} درجة مسجلة` : 'سجّل درجاتك ليُحسب معدلك'),
      ), { icon: '🎓' }),
      C.card('متتبع الدرجات', el('div', {},
        C.quickForm([
          { k: 'subjectId', label: 'المادة', type: 'select', options: subjOptions(S) },
          { k: 'title', label: 'الاختبار/الواجب', grow: true },
          { k: 'score', label: 'الدرجة', type: 'number', min: 0 },
          { k: 'outOf', label: 'من', type: 'number', min: 1, value: 100 },
        ], (v) => { S.study.grades.push({ id: U.uid(), subjectId: v.subjectId, title: v.title, score: v.score, outOf: v.outOf }); SM.store.save(); SM.refresh(); }),
        C.table({
          rows: () => S.study.grades.slice().reverse(),
          cols: [
            { label: 'المادة', render: r => r.subjectId ? C.chip(subjName(S, r.subjectId), BROWN) : '—' },
            { label: 'العنوان', render: r => r.title },
            {
              label: 'الدرجة', render: (r) => {
                const pct = r.outOf ? Math.round((r.score / r.outOf) * 100) : 0;
                return el('span', {}, el('b', { style: `color:${pct >= 90 ? '#4ade80' : pct >= 75 ? AMBER : '#f87171'}` }, `${r.score}/${r.outOf}`), el('span', { class: 'hint' }, ` (${pct}%)`));
              },
            },
          ],
          onDelete: (r) => S.study.grades.splice(S.study.grades.indexOf(r), 1),
          empty: 'سجّل درجات اختباراتك وواجباتك',
          emptyIcon: '💯',
        }),
      ), { icon: '💯' }),
      C.card('أهداف الدرجات', el('div', {},
        C.quickForm([
          { k: 'title', label: 'الهدف', placeholder: 'رفع معدل الفيزياء إلى 95', grow: true },
          { k: 'target', label: 'الهدف %', type: 'number', min: 1, max: 100, value: 95 },
          { k: 'current', label: 'الحالي %', type: 'number', min: 0, max: 100, value: 80 },
        ], (v) => { S.study.goals.push({ id: U.uid(), title: v.title, target: v.target, current: v.current }); SM.store.save(); SM.refresh(); }),
        S.study.goals.length ? S.study.goals.map(g => el('div', { class: 'goalcard glass-soft' },
          el('div', { class: 'row space' },
            el('strong', {}, g.title),
            el('div', { class: 'row gap-s center-v' },
              el('input', {
                class: 'inp inp--sm', type: 'number', min: 0, max: 100, value: g.current, style: 'width:70px', title: 'مستواك الحالي',
                on: { change: (e) => { g.current = U.clamp(Number(e.target.value) || 0, 0, 100); if (g.current >= g.target) SM.C.toast('وصلت لهدفك! 🎉'); SM.store.save(); SM.refresh(); } },
              }),
              el('span', { class: 'hint' }, `/ ${g.target}%`),
              el('button', { class: 'iconbtn iconbtn--danger', on: { click: () => { S.study.goals.splice(S.study.goals.indexOf(g), 1); SM.store.save(); SM.refresh(); } } }, '✕'),
            ),
          ),
          C.bar(U.pct(g.current, g.target), g.current >= g.target ? '#4ade80' : AMBER),
        )) : C.empty('🎯', 'حدد درجة مستهدفة وتابع اقترابك منها'),
      ), { icon: '🎯' }),
    );
  }

  function sat(S) {
    const C = SM.C;
    const sat = S.study.sat;
    const best = sat.tests.length ? Math.max(...sat.tests.map(t => t.score)) : null;
    const last = sat.tests[sat.tests.length - 1];
    const prog = best && sat.target ? U.pct(best, sat.target) : null;

    return el('div', {},
      el('div', { class: 'stats-grid' },
        C.stat('موعد الاختبار', sat.examDate ? `${Math.max(0, U.daysUntil(sat.examDate))} يوم` : '—', {
          icon: '⏳', color: '#f87171', sub: sat.examDate ? U.fmtDateLong(sat.examDate) : 'حدد الموعد بالأسفل',
        }),
        C.stat('أفضل درجة تجريبية', best ? String(best) : '—', {
          icon: '🏆', color: AMBER, sub: last ? `آخر اختبار: ${last.score}` : 'أضف نتائج اختباراتك التجريبية',
        }),
        C.stat('نسبة التقدم', prog == null ? '—' : prog + '%', {
          icon: '📈', color: '#4ade80', sub: `الهدف: ${sat.target || '—'}`,
          extra: prog != null ? C.bar(prog, '#4ade80', { slim: true }) : null,
        }),
      ),
      C.card('الإعدادات', el('div', { class: 'row gap wrap' },
        el('label', { class: 'qform__field' }, el('span', { class: 'qform__label' }, 'تاريخ الاختبار'),
          el('input', { class: 'inp', type: 'date', value: sat.examDate || '', on: { change: (e) => { sat.examDate = e.target.value; SM.store.save(); SM.refresh(); } } })),
        el('label', { class: 'qform__field' }, el('span', { class: 'qform__label' }, 'الدرجة المستهدفة'),
          el('input', { class: 'inp', type: 'number', min: 400, max: 1600, value: sat.target || 1600, on: { change: (e) => { sat.target = U.clamp(Number(e.target.value) || 1600, 400, 1600); SM.store.save(); SM.refresh(); } } })),
      ), { icon: '⚙️' }),
      C.card('الاختبارات التجريبية (Practice tests)', el('div', {},
        C.quickForm([
          { k: 'date', label: 'التاريخ', type: 'date', value: 'today' },
          { k: 'score', label: 'الدرجة', type: 'number', min: 400, max: 1600 },
        ], (v) => {
          if (!v.score) return;
          sat.tests.push({ id: U.uid(), date: v.date, score: v.score });
          sat.tests.sort((a, b) => a.date.localeCompare(b.date));
          SM.store.save(); SM.refresh();
        }),
        sat.tests.length >= 2 ? C.lineChart({
          points: sat.tests.map(t => ({ label: U.fmtDate(t.date), value: t.score })),
          min: 400, max: 1600, color: AMBER, height: 170,
        }) : null,
        C.table({
          rows: () => sat.tests.slice().reverse(),
          cols: [
            { label: 'التاريخ', render: r => U.fmtDate(r.date) },
            { label: 'الدرجة', render: r => el('b', { style: `color:${r.score === best ? '#4ade80' : '#e2e8f0'}` }, String(r.score), r.score === best ? ' 🏆' : '') },
          ],
          onDelete: (r) => sat.tests.splice(sat.tests.indexOf(r), 1),
          empty: 'سجّل درجات اختباراتك التجريبية لترى تطورك',
          emptyIcon: '🧪',
        }),
      ), { icon: '🧪' }),
      el('div', { class: 'grid-2' },
        C.card('نقاط ضعف للمراجعة', C.list({
          get: () => sat.weak,
          render: (i) => '🔻 ' + i.text,
          onAdd: (text) => sat.weak.push({ id: U.uid(), text }),
          onDelete: (i) => sat.weak.splice(sat.weak.indexOf(i), 1),
          placeholder: 'Geometry, Reading inference...',
          empty: 'ركّز مراجعتك على ما يحتاج تحسينًا',
          emptyIcon: '🔻',
        }), { icon: '🔻' }),
        C.card('نقاط قوة', C.list({
          get: () => sat.strong,
          render: (i) => '💪 ' + i.text,
          onAdd: (text) => sat.strong.push({ id: U.uid(), text }),
          onDelete: (i) => sat.strong.splice(sat.strong.indexOf(i), 1),
          placeholder: 'Algebra, Grammar...',
          empty: 'اعرف قوّتك وحافظ عليها',
          emptyIcon: '💪',
        }), { icon: '💪' }),
      ),
      C.card('مصادر التحضير', C.list({
        get: () => sat.resources,
        render: (i) => '📌 ' + i.text,
        onAdd: (text) => sat.resources.push({ id: U.uid(), text }),
        onDelete: (i) => sat.resources.splice(sat.resources.indexOf(i), 1),
        placeholder: 'Khan Academy, كتاب Barron’s...',
        empty: 'مواد ومصادر تحضيرك المحفوظة',
        emptyIcon: '📌',
      }), { icon: '📌' }),
    );
  }

  function unis(S) {
    const C = SM.C;
    const STAT = ['أفكّر فيها', 'سأقدّم', 'قدّمت', 'قُبلت', 'مرفوضة'];
    return C.card('جامعات أخرى', el('div', {},
      C.quickForm([
        { k: 'name', label: 'الجامعة', placeholder: 'اسم الجامعة أو البرنامج', grow: true },
        { k: 'deadline', label: 'موعد التقديم', type: 'date', required: false },
        { k: 'status', label: 'الحالة', type: 'select', options: STAT },
      ], (v) => { S.study.unis.push({ id: U.uid(), name: v.name, deadline: v.deadline, status: v.status || STAT[0], note: '' }); SM.store.save(); SM.refresh(); }),
      C.table({
        rows: () => S.study.unis,
        cols: [
          { label: 'الجامعة', render: r => el('strong', {}, r.name) },
          { label: 'الموعد', render: r => r.deadline ? C.countdownChip(r.deadline) : '—' },
          {
            label: 'الحالة', render: (r) => el('select', {
              class: 'inp inp--sm', on: { change: (e) => { r.status = e.target.value; SM.store.save(); SM.refresh(); } },
            }, STAT.map(s => el('option', { value: s, selected: r.status === s }, s))),
          },
        ],
        onDelete: (r) => S.study.unis.splice(S.study.unis.indexOf(r), 1),
        empty: 'أضف الجامعات والبرامج التي تفكّرين فيها',
        emptyIcon: '🎓',
      }),
    ), { icon: '🌊' });
  }

  function promotions(S) {
    const C = SM.C;
    return C.card('الترقيات', C.list({
      get: () => S.study.promotions,
      render: (i) => i.text, checked: (i) => i.done,
      onToggle: (i) => { i.done = !i.done; },
      onAdd: (text) => S.study.promotions.push({ id: U.uid(), text, done: false }),
      onDelete: (i) => S.study.promotions.splice(S.study.promotions.indexOf(i), 1),
      placeholder: 'هدف/ترقية جديدة...',
      empty: 'سجّل ترقياتك وأهدافك الكبيرة هنا',
      emptyIcon: '🏖️',
    }), { icon: '🏖️' });
  }

  /* ============ واجهة الملفات/المجلدات ============ */
  const FN = (S, key, def) => S.study.folderNames[key] || def;   // اسم المجلد (قابل للتعديل)
  const FC = (S, key) => S.study.folderColors[key];              // لون اسم المجلد

  function folderCard(S, cfg) {
    // صورة حقيقية للملف إن وُجدت، وإلا شكل مرسوم بالكانفس
    const icon = cfg.img
      ? el('img', { class: 'folder__img', src: cfg.img, alt: '', loading: 'lazy' })
      : (() => { const c = SM.folders.make(cfg.kind, { seed: cfg.seed || cfg.key, color: cfg.color }); c.className = 'folder__img'; return c; })();
    const name = FN(S, cfg.key, cfg.name);
    const col = FC(S, cfg.key);
    return el('button', { class: 'folder', on: { click: () => SM.go(cfg.hash) } },
      el('div', { class: 'folder__icon' }, icon),
      el('div', { class: 'folder__label' },
        el('span', { class: 'folder__name', style: col ? `color:${col}` : '' }, name),
        cfg.sub ? el('span', { class: 'folder__sub' }, cfg.sub) : null,
      ),
      el('button', {
        class: 'folder__edit iconbtn', title: 'تعديل الاسم واللون',
        on: { click: (e) => { e.stopPropagation(); folderEditModal(S, cfg); } },
      }, '✎'),
      cfg.onDelete ? el('button', { class: 'folder__del iconbtn iconbtn--danger', title: 'حذف', on: { click: (e) => { e.stopPropagation(); cfg.onDelete(); } } }, '🗑') : null,
    );
  }

  /* تعديل اسم المجلد ولونه — بنفس مربّع ألوان الكواكب */
  function folderEditModal(S, cfg) {
    const Cc = SM.C;
    const nameInp = el('input', { class: 'inp', value: FN(S, cfg.key, cfg.name) });
    const curCol = FC(S, cfg.key) || '#ffffff';
    const label = el('span', { class: 'hint' }, FC(S, cfg.key) || 'اللون الافتراضي');
    const applyName = () => {
      const v = nameInp.value.trim();
      if (cfg.custom) { cfg.custom.name = v || cfg.name; }
      if (v && v !== cfg.name) S.study.folderNames[cfg.key] = v; else delete S.study.folderNames[cfg.key];
      SM.store.save(); SM.refresh();
    };
    nameInp.addEventListener('change', applyName);
    Cc.modal('✎ ' + FN(S, cfg.key, cfg.name), el('div', { class: 'settings' },
      el('label', { class: 'qform__field', style: 'max-width:280px' }, el('span', { class: 'qform__label' }, 'اسم الملف'), nameInp),
      el('div', { class: 'sep' }),
      el('div', { class: 'qform__label', style: 'margin-bottom:8px' }, 'لون الاسم'),
      el('div', { class: 'colorpick' },
        Cc.colorSquare(curCol, (hex) => { S.study.folderColors[cfg.key] = hex; SM.store.save(); SM.refresh(); label.textContent = hex; }),
        el('div', { class: 'row gap center-v center', style: 'margin-top:12px' }, label,
          el('button', { class: 'btn btn--sm', on: { click: () => { delete S.study.folderColors[cfg.key]; SM.store.save(); SM.refresh(); label.textContent = 'اللون الافتراضي'; } } }, '↺ افتراضي')),
        el('p', { class: 'hint center' }, 'اضغط المربّع لاختيار اللون'),
      ),
    ));
  }

  function glassAddTile(label, onClick) {
    return el('button', { class: 'folder folder--add', on: { click: onClick } },
      el('div', { class: 'folder__icon' }, el('span', { class: 'folder__plus' }, '+')),
      el('div', { class: 'folder__label' }, el('span', { class: 'folder__name' }, label)),
    );
  }
  function backChip(hash, label) {
    return el('button', { class: 'btn btn--ghost backchip', on: { click: () => SM.go(hash) } }, '⟵ ', label);
  }
  function grid() { return el('div', { class: 'foldergrid' }); }

  /* الصفحة الأولى */
  function topGallery(S) {
    const Cc = SM.C;
    const g = grid();
    g.append(
      folderCard(S, { key: 'top:study', img: 'assets/folders/study.png', name: 'الدراسة', sub: 'الجداول والمواد والواجبات', hash: '#/p/study/study' }),
      folderCard(S, { key: 'top:plans', img: 'assets/folders/plans.png', name: 'خطط دراسية', sub: 'SAT وجامعات وترقيات', hash: '#/p/study/plans' }),
    );
    (S.study.folders || []).forEach(f => {
      g.append(folderCard(S, {
        key: 'cf:' + f.id, kind: 'solid', name: f.name, color: f.color, seed: f.id, custom: f,
        sub: `${(f.items || []).length} عنصر`, hash: '#/p/study/cf-' + f.id,
        onDelete: () => Cc.confirm(`حذف مجلد «${f.name}»؟`, () => { S.study.folders.splice(S.study.folders.indexOf(f), 1); SM.store.save(); SM.refresh(); }),
      }));
    });
    g.append(glassAddTile('مجلد جديد', () => newFolderModal(S)));
    return el('div', {}, g, el('p', { class: 'hint center', style: 'margin-top:14px' }, '📁 اضغط المجلد لفتحه · ✎ لتغيير الاسم واللون'));
  }

  function newFolderModal(S) {
    const Cc = SM.C;
    let color = '#f4b23e';
    const swatches = el('div', { class: 'swatches' });
    ['#f4b23e', '#f43f8e', '#22d3ee', '#a3e635', '#a78bfa', '#fb7185', '#34d399', '#60a5fa'].forEach(c => {
      const btn = el('button', { class: 'swatch' + (c === color ? ' on' : ''), style: `background:${c}`, on: { click: () => { color = c; swatches.querySelectorAll('.swatch').forEach(x => x.classList.remove('on')); btn.classList.add('on'); } } });
      swatches.append(btn);
    });
    const m = Cc.modal('📁 مجلد جديد', el('div', {},
      Cc.quickForm([{ k: 'name', label: 'اسم المجلد', placeholder: 'مثال: مشاريع، مراجعات...', grow: true }], (v) => {
        S.study.folders.push({ id: U.uid(), name: v.name, color, items: [], notes: [] });
        SM.store.save(); m.close(); Cc.toast('📁 مجلد جديد'); SM.refresh();
      }, { label: '✨ إنشاء' }),
      el('div', { style: 'margin-top:10px' }, el('span', { class: 'qform__label' }, 'لون الملف'), swatches),
    ));
  }

  /* داخل «الدراسة» */
  function studyGallery(S) {
    const g = grid();
    g.append(
      folderCard(S, { key: 'study:schedule', img: 'assets/folders/schedule.png', name: 'الجداول والاختبارات', sub: 'جدول + عدّ تنازلي', hash: '#/p/study/schedule' }),
      folderCard(S, { key: 'study:subjects', img: 'assets/folders/subjects.png', name: 'المواد', sub: `${S.study.subjects.length} مادة`, hash: '#/p/study/subjects' }),
      folderCard(S, { key: 'study:homework', kind: 'cork', name: 'الواجبات والمهام', sub: `${S.study.homework.filter(h => !h.done).length} معلّق`, hash: '#/p/study/homework' }),
      folderCard(S, { key: 'study:notes', kind: 'solid', color: '#60a5fa', name: 'ملاحظات ومراجعة', sub: 'بومودورو + Flashcards', hash: '#/p/study/notes' }),
      folderCard(S, { key: 'study:grades', kind: 'solid', color: '#34d399', name: 'الأهداف والدرجات', sub: 'معدلك وأهدافك', hash: '#/p/study/grades' }),
      folderCard(S, { key: 'study:dash', kind: 'solid', color: '#a78bfa', name: 'نظرة عامة', sub: 'لوحة الدراسة', hash: '#/p/study/dash' }),
    );
    return el('div', {},
      el('div', { class: 'row space center-v', style: 'margin-bottom:12px' }, backChip('#/p/study', 'الملفات الرئيسية'), el('h3', { class: 'card__title' }, '📂 الدراسة')),
      g);
  }

  /* داخل «خطط دراسية»: SAT (غزال) + جامعات أخرى (ماء) + الترقيات (رمل) */
  function plansGallery(S) {
    const g = grid();
    g.append(
      folderCard(S, { key: 'plans:sat', img: 'assets/folders/sat.png', name: 'SAT', sub: 'تحضير الاختبار', hash: '#/p/study/sat' }),
      folderCard(S, { key: 'plans:unis', img: 'assets/folders/unis.png', name: 'جامعات أخرى', sub: `${S.study.unis.length} جامعة`, hash: '#/p/study/unis' }),
      folderCard(S, { key: 'plans:promotions', img: 'assets/folders/promotions.png', name: 'الترقيات', sub: `${S.study.promotions.filter(p => !p.done).length} هدف`, hash: '#/p/study/promotions' }),
    );
    return el('div', {},
      el('div', { class: 'row space center-v', style: 'margin-bottom:12px' }, backChip('#/p/study', 'الملفات الرئيسية'), el('h3', { class: 'card__title' }, '☁️ خطط دراسية')),
      g);
  }

  function customFolderView(S, id) {
    const Cc = SM.C;
    const f = (S.study.folders || []).find(x => x.id === id);
    if (!f) return Cc.empty('🌫️', 'هذا المجلد لم يعد موجودًا');
    return el('div', {},
      el('div', { class: 'row space center-v', style: 'margin-bottom:12px' }, backChip('#/p/study', 'الملفات الرئيسية'), el('h3', { class: 'card__title' }, '📁 ' + f.name)),
      Cc.card('العناصر', Cc.list({
        get: () => f.items,
        render: (i) => i.text, checked: (i) => i.done,
        onToggle: (i) => { i.done = !i.done; },
        onAdd: (text) => f.items.push({ id: U.uid(), text, done: false }),
        onDelete: (i) => f.items.splice(f.items.indexOf(i), 1),
        placeholder: 'عنصر جديد...',
        empty: 'أضف عناصر هذا المجلد', emptyIcon: '✅',
      }), { icon: '✅' }),
      Cc.card('ملاحظات', el('div', {},
        Cc.quickForm([{ k: 'title', label: 'العنوان', grow: true }, { k: 'body', label: 'الملاحظة', type: 'textarea', rows: 2 }],
          (v) => { f.notes.push({ id: U.uid(), title: v.title, body: v.body }); SM.store.save(); SM.refresh(); }),
        (f.notes || []).slice().reverse().map(n => el('details', { class: 'acc' },
          el('summary', {}, '🗒️ ' + n.title, el('button', { class: 'iconbtn iconbtn--danger', on: { click: (e) => { e.preventDefault(); f.notes.splice(f.notes.indexOf(n), 1); SM.store.save(); SM.refresh(); } } }, '✕')),
          el('p', { class: 'acc__body' }, n.body || '—'))),
      ), { icon: '🗒️' }),
    );
  }

  /* غلاف أداة داخل مجلد، مع زر رجوع للمعرض الأب */
  function toolWrap(parentHash, parentLabel, view) {
    return el('div', {}, el('div', { style: 'margin-bottom:12px' }, backChip(parentHash, parentLabel), view));
  }

  SM.views.study = function (planet, secId) {
    const S = SM.store.state;
    switch (secId) {
      case 'study': return studyGallery(S);
      case 'plans': return plansGallery(S);
      case 'subjects': return toolWrap('#/p/study/study', 'مجلد الدراسة', subjects(S));
      case 'homework': return toolWrap('#/p/study/study', 'مجلد الدراسة', homework(S));
      case 'schedule': return toolWrap('#/p/study/study', 'مجلد الدراسة', schedule(S));
      case 'notes': return toolWrap('#/p/study/study', 'مجلد الدراسة', notes(S));
      case 'grades': return toolWrap('#/p/study/study', 'مجلد الدراسة', grades(S));
      case 'dash': return toolWrap('#/p/study/study', 'مجلد الدراسة', dash(S));
      case 'sat': return toolWrap('#/p/study/plans', 'خطط دراسية', sat(S));
      case 'unis': return toolWrap('#/p/study/plans', 'خطط دراسية', unis(S));
      case 'promotions': return toolWrap('#/p/study/plans', 'خطط دراسية', promotions(S));
      default:
        if (secId && secId.indexOf('cf-') === 0) return customFolderView(S, secId.slice(3));
        return topGallery(S);
    }
  };
})();
