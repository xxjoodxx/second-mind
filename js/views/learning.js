/* Second Mind — كوكب التعلم الذاتي */
(function () {
  const U = SM.U, el = SM.el;
  const SKY = '#38bdf8', BLUE = '#3b82f6';

  const bookPct = (b) => b.pagesTotal > 0 ? U.pct(b.pagesRead || 0, b.pagesTotal) : 0;

  function goalPct(g) {
    if (!g.steps || !g.steps.length) return 0;
    return U.pct(g.steps.filter(s => s.done).length, g.steps.length);
  }

  function nearestGoal(S) {
    return S.learning.goals
      .filter(g => goalPct(g) < 100)
      .sort((a, b) => (a.deadline || '9999').localeCompare(b.deadline || '9999'))[0] || null;
  }

  function logSessionForm(S, label) {
    const C = SM.C;
    return C.quickForm([
      { k: 'minutes', label: label || 'دقائق التعلم', type: 'number', min: 5, value: 30 },
    ], (v) => {
      S.learning.sessions.push({ id: U.uid(), date: U.todayKey(), minutes: v.minutes });
      SM.store.save(); C.toast('جلسة تعلم مسجلة 🧠'); SM.refresh();
    }, { label: '+ سجّل جلسة' });
  }

  function dash(S) {
    const C = SM.C;
    const active = S.learning.courses.filter(c => c.status === 'نشط');
    const reading = S.learning.books.find(b => b.status === 'أقرؤه الآن');
    const weekMin = U.sum(S.learning.sessions.filter(s => U.lastNDays(7).includes(s.date)), s => s.minutes);
    const habits = S.habits.filter(h => h.planetId === 'learning');
    const bestStreak = Math.max(0, ...habits.map(h => SM.calc.streak(h)));
    const goal = nearestGoal(S);

    return el('div', {},
      el('div', { class: 'stats-grid' },
        C.stat('كورسات نشطة', String(active.length), {
          icon: '🎓', color: SKY,
          sub: active.length ? `متوسط الإنجاز ${Math.round(U.sum(active, c => c.progress) / active.length)}%` : 'أضف كورسك الأول',
        }),
        C.stat('القراءة الحالية', reading ? reading.title : '—', {
          icon: '📖', color: BLUE, sub: reading ? `${bookPct(reading)}% من الكتاب` : 'اختر كتابًا تقرؤه الآن',
          extra: reading ? C.bar(bookPct(reading), BLUE, { slim: true }) : null,
        }),
        C.stat('ساعات التعلم', U.minutesFmt(weekMin), { icon: '⏱️', color: SKY, sub: 'هذا الأسبوع' }),
        C.stat('سلسلة التعلم', bestStreak ? `🔥 ${bestStreak} يوم` : '—', {
          icon: '⚡', color: BLUE, sub: 'يغذّي مربع التقدم واللون الأزرق',
        }),
      ),
      el('div', { class: 'grid-2' },
        C.card('أقرب هدف تعلّم', goal ? el('div', {},
          el('div', { class: 'row space' },
            el('strong', {}, goal.title),
            goal.deadline ? C.countdownChip(goal.deadline) : null),
          C.bar(goalPct(goal), SKY),
          el('p', { class: 'hint' }, `${goal.steps.filter(s => s.done).length} من ${goal.steps.length} خطوات — فصّل خطواتك في قسم المهارات`),
        ) : C.empty('🎯', 'أضف هدف تعلم من قسم المهارات'), { icon: '🎯' }),
        C.card('تسجيل سريع', logSessionForm(S), { icon: '⏱️', sub: 'كل دقيقة تعلم تُحسب' }),
      ),
      C.card('الكورسات النشطة', active.length ? active.map(c => el('div', { class: 'prow' },
        el('span', { class: 'dot', style: `background:${SKY}` }),
        el('span', { class: 'prow__name' }, c.title),
        el('div', { class: 'prow__bar' }, C.bar(c.progress, SKY)),
        el('span', { class: 'prow__pct' }, c.progress + '%'),
      )) : C.empty('🎓', 'لا كورسات نشطة حاليًا'), { icon: '🎓' }),
      C.card('متتبع العادات', C.habitBoard('learning'), { icon: '🔁', sub: 'عادات التعلم والمهارات' }),
    );
  }

  function courses(S) {
    const C = SM.C;
    const STATUSES = ['نشط', 'مكتمل', 'متوقف'];
    return el('div', {},
      C.card('متتبع الكورسات', el('div', {},
        C.quickForm([
          { k: 'title', label: 'العنوان', placeholder: 'كورس UI/UX', grow: true },
          { k: 'source', label: 'المصدر', required: false, placeholder: 'يوتيوب، Coursera...' },
          { k: 'progress', label: 'الإنجاز %', type: 'number', min: 0, max: 100, value: 0 },
          { k: 'status', label: 'الحالة', type: 'select', options: STATUSES },
        ], (v) => {
          S.learning.courses.push({ id: U.uid(), title: v.title, source: v.source, progress: U.clamp(v.progress, 0, 100), status: v.status || 'نشط' });
          SM.store.save(); SM.refresh();
        }),
        C.table({
          rows: () => S.learning.courses,
          cols: [
            { label: 'الكورس', render: r => r.title },
            { label: 'المصدر', render: r => r.source || '—' },
            {
              label: 'الإنجاز', render: (r) => el('div', { class: 'row gap-s center-v', style: 'min-width:150px' },
                el('button', { class: 'iconbtn', on: { click: () => { r.progress = U.clamp(r.progress - 5, 0, 100); if (r.progress >= 100) r.status = 'مكتمل'; SM.store.save(); SM.refresh(); } } }, '−'),
                el('div', { style: 'flex:1' }, C.bar(r.progress, SKY, { slim: true })),
                el('button', { class: 'iconbtn', on: { click: () => { r.progress = U.clamp(r.progress + 5, 0, 100); if (r.progress >= 100) { r.status = 'مكتمل'; SM.C.toast('كورس مكتمل! 🎉'); } SM.store.save(); SM.refresh(); } } }, '+'),
                el('span', { class: 'hint' }, r.progress + '%'),
              ),
            },
            {
              label: 'الحالة', render: (r) => el('select', {
                class: 'inp inp--sm', on: { change: (e) => { r.status = e.target.value; SM.store.save(); SM.refresh(); } },
              }, STATUSES.map(s => el('option', { value: s, selected: r.status === s }, s))),
            },
          ],
          onDelete: (r) => S.learning.courses.splice(S.learning.courses.indexOf(r), 1),
          empty: 'أضف كورساتك وتابع إنجازك فيها',
          emptyIcon: '🎓',
        }),
      ), { icon: '🎓' }),
      C.card('أريد أن أتعلّمه', C.list({
        get: () => S.learning.wishlist,
        render: (i) => '💡 ' + i.text,
        onAdd: (text) => S.learning.wishlist.push({ id: U.uid(), text }),
        onDelete: (i) => S.learning.wishlist.splice(S.learning.wishlist.indexOf(i), 1),
        placeholder: 'مهارة أو موضوع مؤجل...',
        empty: 'قائمة أحلامك التعليمية — أضف ما تريد تعلمه لاحقًا',
        emptyIcon: '💡',
      }), { icon: '💡', sub: 'مهارات ومواضيع مؤجلة' }),
    );
  }

  function reading(S) {
    const C = SM.C;
    const STATUSES = ['أقرؤه الآن', 'سأقرؤه', 'خلّصته'];
    return el('div', {},
      C.card('متتبع الكتب', el('div', {},
        C.quickForm([
          { k: 'title', label: 'الكتاب', grow: true },
          { k: 'author', label: 'المؤلف', required: false },
          { k: 'pagesTotal', label: 'عدد الصفحات', type: 'number', min: 1, value: 200 },
          { k: 'status', label: 'الحالة', type: 'select', options: STATUSES },
        ], (v) => {
          S.learning.books.push({ id: U.uid(), title: v.title, author: v.author, pagesTotal: v.pagesTotal, pagesRead: 0, status: v.status || 'أقرؤه الآن' });
          SM.store.save(); SM.refresh();
        }),
        C.table({
          rows: () => S.learning.books,
          cols: [
            { label: 'الكتاب', render: r => el('div', {}, el('strong', {}, r.title), r.author ? el('div', { class: 'hint' }, r.author) : null) },
            {
              label: 'التقدم', render: (r) => el('div', { class: 'row gap-s center-v', style: 'min-width:170px' },
                el('input', {
                  class: 'inp inp--sm', type: 'number', min: 0, max: r.pagesTotal, value: r.pagesRead || 0, style: 'width:70px',
                  on: { change: (e) => { r.pagesRead = U.clamp(Number(e.target.value) || 0, 0, r.pagesTotal); if (r.pagesRead >= r.pagesTotal) { r.status = 'خلّصته'; SM.C.toast('كتاب مكتمل! 📚✨'); } SM.store.save(); SM.refresh(); } },
                }),
                el('span', { class: 'hint' }, `/ ${r.pagesTotal} ص`),
                el('div', { style: 'flex:1' }, C.bar(bookPct(r), BLUE, { slim: true })),
                el('span', { class: 'hint' }, bookPct(r) + '%'),
              ),
            },
            {
              label: 'الحالة', render: (r) => el('select', {
                class: 'inp inp--sm', on: { change: (e) => { r.status = e.target.value; SM.store.save(); SM.refresh(); } },
              }, STATUSES.map(s => el('option', { value: s, selected: r.status === s }, s))),
            },
          ],
          onDelete: (r) => S.learning.books.splice(S.learning.books.indexOf(r), 1),
          empty: 'رفّك الرقمي فارغ — أضف أول كتاب 📚',
          emptyIcon: '📚',
        }),
      ), { icon: '📚' }),
      C.card('اقتباسات وملاحظات من الكتب', el('div', {},
        C.quickForm([
          { k: 'text', label: 'الاقتباس', type: 'textarea', rows: 2, required: false, grow: true },
          { k: 'bookId', label: 'الكتاب', type: 'select', options: [{ v: '', label: '—' }, ...S.learning.books.map(b => ({ v: b.id, label: b.title }))] },
        ], (v) => {
          if (!v.text) return;
          S.learning.quotes.push({ id: U.uid(), text: v.text, bookId: v.bookId });
          SM.store.save(); SM.refresh();
        }, { label: '+ اقتباس' }),
        S.learning.quotes.length ? S.learning.quotes.slice().reverse().map(q => {
          const b = S.learning.books.find(x => x.id === q.bookId);
          return el('div', { class: 'quote' },
            el('p', {}, '“' + q.text + '”'),
            el('div', { class: 'row space' },
              el('span', { class: 'hint' }, b ? '— ' + b.title : ''),
              el('button', { class: 'iconbtn iconbtn--danger', on: { click: () => { S.learning.quotes.splice(S.learning.quotes.indexOf(q), 1); SM.store.save(); SM.refresh(); } } }, '✕')),
          );
        }) : C.empty('✒️', 'احفظ أجمل ما قرأت'),
      ), { icon: '✒️' }),
    );
  }

  function knowledge(S) {
    const C = SM.C;
    let query = '';
    const listBox = el('div', {});
    function paintList() {
      listBox.innerHTML = '';
      const items = S.learning.knowledge.filter(n =>
        !query || (n.title + ' ' + n.body + ' ' + (n.tags || '')).includes(query));
      if (!items.length) { listBox.append(C.empty('🧠', query ? 'لا نتائج' : 'بنك معرفتك — لخّص ما تتعلمه بكلماتك')); return; }
      items.slice().reverse().forEach(n => {
        listBox.append(el('details', { class: 'acc' },
          el('summary', {}, '🧠 ' + n.title,
            el('span', { class: 'hint', style: 'margin-inline-start:8px' }, n.tags || ''),
            el('button', { class: 'iconbtn iconbtn--danger', on: { click: (e) => { e.preventDefault(); S.learning.knowledge.splice(S.learning.knowledge.indexOf(n), 1); SM.store.save(); SM.refresh(); } } }, '✕')),
          el('p', { class: 'acc__body' }, n.body || '—'),
        ));
      });
    }
    paintList();

    return el('div', {},
      C.card('بنك المعرفة (Knowledge base)', el('div', {},
        C.search('🔍 ابحث في معرفتك...', (q) => { query = q; paintList(); }),
        C.quickForm([
          { k: 'title', label: 'العنوان', grow: true },
          { k: 'tags', label: 'وسوم', required: false, placeholder: 'برمجة، تصميم...' },
          { k: 'body', label: 'ماذا تعلمت؟ (بكلماتك)', type: 'textarea', rows: 3 },
        ], (v) => {
          S.learning.knowledge.push({ id: U.uid(), title: v.title, body: v.body, tags: v.tags, date: U.todayKey() });
          SM.store.save(); SM.refresh();
        }),
        listBox,
      ), { icon: '🧠' }),
      C.card('بطاقات المراجعة (Flashcards)', C.flash(() => S.learning.flashcards), { icon: '🎴' }),
      C.card('روابط ومصادر محفوظة', el('div', {},
        C.quickForm([
          { k: 'title', label: 'الاسم', grow: true },
          { k: 'url', label: 'الرابط', placeholder: 'https://...' },
        ], (v) => { S.learning.links.push({ id: U.uid(), title: v.title, url: v.url }); SM.store.save(); SM.refresh(); }),
        C.table({
          rows: () => S.learning.links,
          cols: [
            { label: 'الاسم', render: r => r.title },
            { label: 'الرابط', render: r => el('a', { href: r.url, target: '_blank', rel: 'noopener', class: 'link', dir: 'ltr' }, r.url.length > 42 ? r.url.slice(0, 42) + '…' : r.url) },
          ],
          onDelete: (r) => S.learning.links.splice(S.learning.links.indexOf(r), 1),
          empty: 'احفظ المصادر المهمة للرجوع إليها',
          emptyIcon: '🔗',
        }),
      ), { icon: '🔗' }),
    );
  }

  function skills(S) {
    const C = SM.C;
    return el('div', {},
      C.card('متتبع المهارات', el('div', {},
        C.quickForm([
          { k: 'name', label: 'المهارة', placeholder: 'التصميم، البرمجة، الخطابة...', grow: true },
        ], (v) => { S.learning.skills.push({ id: U.uid(), name: v.name, level: 1 }); SM.store.save(); SM.refresh(); }),
        S.learning.skills.length ? S.learning.skills.map(sk => el('div', { class: 'skillrow' },
          el('strong', { class: 'skillrow__name' }, sk.name),
          C.levelDots(sk.level, (lv) => { sk.level = lv; }),
          el('button', { class: 'iconbtn iconbtn--danger', on: { click: () => { S.learning.skills.splice(S.learning.skills.indexOf(sk), 1); SM.store.save(); SM.refresh(); } } }, '✕'),
        )) : C.empty('⚡', 'أضف مهاراتك وتابع مستواك من مبتدئ إلى محترف'),
      ), { icon: '⚡', sub: 'مبتدئ ← متقدم' }),
      C.card('أهداف التعلم', el('div', {},
        C.quickForm([
          { k: 'title', label: 'الهدف', placeholder: 'إتقان أساسيات JavaScript', grow: true },
          { k: 'deadline', label: 'الموعد', type: 'date', required: false },
        ], (v) => { S.learning.goals.push({ id: U.uid(), title: v.title, deadline: v.deadline, steps: [] }); SM.store.save(); SM.refresh(); }),
        S.learning.goals.length ? S.learning.goals.map(g => el('div', { class: 'goalcard glass-soft' },
          el('div', { class: 'row space' },
            el('strong', {}, g.title),
            el('div', { class: 'row gap-s' },
              g.deadline ? C.countdownChip(g.deadline) : null,
              el('button', { class: 'iconbtn iconbtn--danger', on: { click: () => { S.learning.goals.splice(S.learning.goals.indexOf(g), 1); SM.store.save(); SM.refresh(); } } }, '✕'),
            ),
          ),
          C.bar(goalPct(g), SKY),
          C.list({
            get: () => g.steps,
            render: (s) => s.text,
            checked: (s) => s.done,
            onToggle: (s) => { s.done = !s.done; if (g.steps.every(x => x.done) && g.steps.length) SM.C.toast('هدف مكتمل! 🎉'); },
            onAdd: (text) => g.steps.push({ id: U.uid(), text, done: false }),
            onDelete: (s) => g.steps.splice(g.steps.indexOf(s), 1),
            placeholder: 'قسّم الهدف لخطوة صغيرة...',
            empty: 'قسّم هدفك إلى خطوات صغيرة قابلة للإنجاز',
            emptyIcon: '🪜',
          }),
        )) : C.empty('🎯', 'حدد هدف تعلم بمدة زمنية وقسّمه لخطوات'),
      ), { icon: '🎯', sub: 'أهداف بمدة زمنية مقسمة لخطوات صغيرة' }),
    );
  }

  SM.views.learning = function (planet, secId) {
    const S = SM.store.state;
    switch (secId) {
      case 'courses': return courses(S);
      case 'reading': return reading(S);
      case 'knowledge': return knowledge(S);
      case 'skills': return skills(S);
      default: return dash(S);
    }
  };
})();
