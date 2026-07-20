/* Second Mind — كوكب المالية */
(function () {
  const U = SM.U, el = SM.el;
  const GOLD = '#fbbf24', ORANGE = '#fb923c';
  const CAT_COLORS = ['#fbbf24', '#fb923c', '#f87171', '#a78bfa', '#38bdf8', '#4ade80', '#f472b6', '#94a3b8', '#2dd4bf', '#eab308'];

  const catColor = (S, cat) => CAT_COLORS[Math.max(0, S.finance.categories.indexOf(cat)) % CAT_COLORS.length];

  const monthExpenses = (S, ym) => S.finance.expenses.filter(e => (e.date || '').startsWith(ym));
  const monthIncome = (S, ym) => {
    const rec = U.sum(S.finance.incomes.filter(i => i.recurring), i => i.amount);
    const once = U.sum(S.finance.incomes.filter(i => !i.recurring && (i.date || '').startsWith(ym)), i => i.amount);
    return rec + once;
  };

  const savedOf = (g) => U.sum(g.deposits || [], d => d.amount);

  function spentByCat(S, ym) {
    const map = {};
    monthExpenses(S, ym).forEach(e => { map[e.category] = (map[e.category] || 0) + Number(e.amount || 0); });
    return map;
  }

  function upcomingBills(S, within = 7) {
    const today = new Date();
    return S.finance.bills.map(b => {
      let due = new Date(today.getFullYear(), today.getMonth(), Math.min(b.dueDay, 28));
      if (due < new Date(today.getFullYear(), today.getMonth(), today.getDate())) due = new Date(today.getFullYear(), today.getMonth() + 1, Math.min(b.dueDay, 28));
      const days = Math.round((due - new Date(today.getFullYear(), today.getMonth(), today.getDate())) / 86400000);
      return { ...b, days };
    }).filter(b => b.days <= within).sort((a, b) => a.days - b.days);
  }

  function dash(S) {
    const C = SM.C;
    const ym = U.monthKey();
    const income = monthIncome(S, ym);
    const spent = U.sum(monthExpenses(S, ym), e => e.amount);
    const net = income - spent;

    const budgets = Object.entries(S.finance.budgets).filter(([, v]) => v > 0);
    const totalBudget = U.sum(budgets, ([, v]) => v);
    const byCat = spentByCat(S, ym);
    const budgetSpent = U.sum(budgets, ([c]) => byCat[c] || 0);
    const commitment = totalBudget ? Math.round((budgetSpent / totalBudget) * 100) : null;

    const totalSavTarget = U.sum(S.finance.savings, g => g.target);
    const totalSaved = U.sum(S.finance.savings, savedOf);
    const savPct = totalSavTarget ? U.pct(totalSaved, totalSavTarget) : null;

    const bills = upcomingBills(S);
    const overCats = budgets.filter(([c, v]) => (byCat[c] || 0) / v >= 0.8);

    return el('div', {},
      el('div', { class: 'stats-grid' },
        C.stat('الدخل مقابل المصاريف', el('span', {}, el('b', { style: 'color:#4ade80' }, U.money(income)), ' / ', el('b', { style: 'color:#f87171' }, U.money(spent))), {
          icon: '⚖️', color: GOLD, sub: 'هذا الشهر',
        }),
        C.stat('الرصيد المتبقي', U.money(net), {
          icon: '💵', color: net >= 0 ? '#4ade80' : '#f87171', sub: net >= 0 ? 'وضعك ممتاز 👌' : 'انتبه — مصاريفك أعلى من دخلك',
        }),
        C.stat('الالتزام بالميزانية', commitment == null ? '—' : commitment + '%', {
          icon: '🎯', color: commitment != null && commitment > 100 ? '#f87171' : GOLD,
          sub: commitment == null ? 'حدد ميزانيات من قسم الميزانية' : `${U.money(budgetSpent)} من ${U.money(totalBudget)}`,
          extra: commitment != null ? C.bar(Math.min(commitment, 100), commitment > 100 ? '#f87171' : GOLD, { slim: true }) : null,
        }),
        C.stat('تقدّم الادخار', savPct == null ? '—' : savPct + '%', {
          icon: '🏦', color: ORANGE, sub: savPct == null ? 'أنشئ هدف ادخار' : `${U.money(totalSaved)} من ${U.money(totalSavTarget)}`,
          extra: savPct != null ? C.bar(savPct, ORANGE, { slim: true }) : null,
        }),
      ),
      (bills.length || overCats.length) ? C.card('تنبيهات 🔔', el('div', {},
        bills.map(b => el('div', { class: 'alertrow' }, '📅 ', el('strong', {}, b.name), ` — ${U.money(b.amount)} `, C.chip(b.days === 0 ? 'اليوم!' : `بعد ${b.days} يوم`, b.days <= 2 ? '#f87171' : '#fb923c'))),
        overCats.map(([c, v]) => el('div', { class: 'alertrow' }, '⚠️ ', el('strong', {}, c), ` وصل ${Math.round(((byCat[c] || 0) / v) * 100)}% من الميزانية`)),
      ), { icon: '🔔' }) : null,
      C.card('أين تذهب أموالك هذا الشهر؟', C.donut(
        Object.entries(byCat).map(([c, v]) => ({ label: c, value: v, color: catColor(S, c) })),
        { centerSub: 'مصاريف ' + new Intl.DateTimeFormat('ar', { month: 'long' }).format(new Date()), empty: 'لا مصاريف مسجلة هذا الشهر بعد' },
      ), { icon: '🍩' }),
      C.card('متتبع العادات المالية', C.habitBoard('finance'), { icon: '🔁', sub: 'مثل: تسجيل المصاريف يوميًا — يغذي اللون البرتقالي' }),
    );
  }

  function income(S) {
    const C = SM.C;
    const ym = U.monthKey();
    return el('div', {},
      C.card('إجمالي الدخل الشهري', el('div', { class: 'center' },
        el('span', { class: 'big-num', style: `color:${GOLD}` }, U.money(monthIncome(S, ym))),
        el('p', { class: 'hint' }, 'المتكرر + دفعات هذا الشهر — يُحسب تلقائيًا'),
      ), { icon: '💰' }),
      C.card('مصادر الدخل', el('div', {},
        C.quickForm([
          { k: 'name', label: 'المصدر', placeholder: 'راتب، مصروف، عمل حر...', grow: true },
          { k: 'amount', label: 'المبلغ', type: 'number', min: 0 },
          { k: 'recurring', label: 'النوع', type: 'select', options: [{ v: '1', label: 'شهري متكرر' }, { v: '', label: 'مرة واحدة' }] },
          { k: 'date', label: 'التاريخ', type: 'date', value: 'today' },
        ], (v) => {
          S.finance.incomes.push({ id: U.uid(), name: v.name, amount: v.amount, recurring: !!v.recurring, date: v.date });
          SM.store.save(); SM.refresh();
        }),
        C.table({
          rows: () => S.finance.incomes,
          cols: [
            { label: 'المصدر', render: r => r.name },
            { label: 'المبلغ', render: r => el('b', { style: 'color:#4ade80' }, U.money(r.amount)) },
            { label: 'النوع', render: r => r.recurring ? C.chip('شهري متكرر', GOLD) : C.chip('مرة واحدة', '#94a3b8') },
            { label: 'التاريخ', render: r => U.fmtDate(r.date) },
          ],
          onDelete: (r) => S.finance.incomes.splice(S.finance.incomes.indexOf(r), 1),
          empty: 'سجّل مصادر دخلك — راتب، مصروف، أو أي دخل آخر',
          emptyIcon: '💰',
        }),
      ), { icon: '📒' }),
    );
  }

  function expenses(S) {
    const C = SM.C;
    const ym = U.monthKey();
    const byCat = spentByCat(S, ym);
    const max = Math.max(1, ...Object.values(byCat));
    return el('div', {},
      C.card('مصاريف هذا الشهر حسب التصنيف', Object.keys(byCat).length ? Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) =>
        el('div', { class: 'prow' },
          el('span', { class: 'dot', style: `background:${catColor(S, c)}` }),
          el('span', { class: 'prow__name' }, c),
          el('div', { class: 'prow__bar' }, C.bar((v / max) * 100, catColor(S, c))),
          el('span', { class: 'prow__pct' }, U.money(v)),
        )) : C.empty('🧾', 'لا مصاريف هذا الشهر بعد'), { icon: '📊' }),
      C.card('متتبع المصاريف', el('div', {},
        C.quickForm([
          { k: 'amount', label: 'المبلغ', type: 'number', min: 0 },
          { k: 'category', label: 'التصنيف', type: 'select', options: S.finance.categories },
          { k: 'date', label: 'التاريخ', type: 'date', value: 'today' },
          { k: 'note', label: 'ملاحظة', required: false, grow: true },
        ], (v) => {
          if (!v.amount) return;
          S.finance.expenses.push({ id: U.uid(), amount: v.amount, category: v.category, date: v.date, note: v.note });
          SM.store.save(); SM.refresh();
        }),
        C.table({
          rows: () => S.finance.expenses.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 60),
          cols: [
            { label: 'المبلغ', render: r => el('b', { style: 'color:#f87171' }, U.money(r.amount)) },
            { label: 'التصنيف', render: r => C.chip(r.category, catColor(S, r.category)) },
            { label: 'التاريخ', render: r => U.fmtDate(r.date) },
            { label: 'ملاحظة', render: r => r.note || '—' },
          ],
          onDelete: (r) => S.finance.expenses.splice(S.finance.expenses.indexOf(r), 1),
          empty: 'سجّل كل مصروف مهما كان صغيرًا — الوعي أول خطوة',
          emptyIcon: '🧾',
        }),
      ), { icon: '🧾' }),
      C.card('التصنيفات', C.list({
        get: () => S.finance.categories.map(c => ({ text: c })),
        render: (i) => el('span', {}, el('i', { class: 'dot', style: `background:${catColor(S, i.text)};margin-inline-end:6px` }), i.text),
        onAdd: (text) => { if (!S.finance.categories.includes(text)) S.finance.categories.push(text); },
        onDelete: (i) => { const idx = S.finance.categories.indexOf(i.text); if (idx > -1) S.finance.categories.splice(idx, 1); },
        placeholder: 'تصنيف جديد...',
      }), { icon: '🏷️' }),
    );
  }

  function budget(S) {
    const C = SM.C;
    const ym = U.monthKey();
    const byCat = spentByCat(S, ym);
    const totalBudget = U.sum(Object.values(S.finance.budgets));
    const totalSpent = U.sum(Object.entries(S.finance.budgets).filter(([, v]) => v > 0), ([c]) => byCat[c] || 0);

    return el('div', {},
      C.card('المخطط مقابل الفعلي', el('div', { class: 'row gap wrap center' },
        el('div', { class: 'center' }, el('div', { class: 'hint' }, 'المخطط'), el('span', { class: 'big-num', style: `color:${GOLD}` }, U.money(totalBudget))),
        el('div', { class: 'center' }, el('div', { class: 'hint' }, 'الفعلي'), el('span', { class: 'big-num', style: `color:${totalSpent > totalBudget ? '#f87171' : '#4ade80'}` }, U.money(totalSpent))),
      ), { icon: '⚖️' }),
      C.card('ميزانية كل تصنيف (شهريًا)', el('div', {},
        S.finance.categories.map(c => {
          const limit = S.finance.budgets[c] || 0;
          const spent = byCat[c] || 0;
          const pct = limit ? Math.round((spent / limit) * 100) : 0;
          return el('div', { class: 'budgetrow' },
            el('span', { class: 'dot', style: `background:${catColor(S, c)}` }),
            el('span', { class: 'budgetrow__name' }, c),
            el('input', {
              class: 'inp inp--sm', type: 'number', min: 0, value: limit || '', placeholder: 'الحد', style: 'width:100px',
              on: { change: (e) => { S.finance.budgets[c] = Number(e.target.value) || 0; SM.store.save(); SM.refresh(); } },
            }),
            el('div', { class: 'budgetrow__bar' },
              limit ? C.bar(Math.min(pct, 100), pct >= 100 ? '#f87171' : pct >= 80 ? '#fb923c' : '#4ade80', { slim: true }) : el('span', { class: 'hint' }, 'بدون حد')),
            limit ? el('span', { class: 'budgetrow__pct' + (pct >= 80 ? ' warn' : '') }, `${U.money(spent)} · ${pct}%`, pct >= 100 ? ' 🚨' : pct >= 80 ? ' ⚠️' : '') : el('span'),
          );
        }),
        el('p', { class: 'hint' }, '⚠️ يظهر تنبيه عند وصول 80% من الحد، و🚨 عند تجاوزه'),
      ), { icon: '🎯' }),
      C.card('الفواتير والاشتراكات', el('div', {},
        C.quickForm([
          { k: 'name', label: 'الاسم', placeholder: 'نتفلكس، جوال...', grow: true },
          { k: 'amount', label: 'المبلغ', type: 'number', min: 0 },
          { k: 'dueDay', label: 'يوم الاستحقاق بالشهر', type: 'number', min: 1, max: 28, value: 1 },
        ], (v) => { S.finance.bills.push({ id: U.uid(), name: v.name, amount: v.amount, dueDay: U.clamp(v.dueDay, 1, 28) }); SM.store.save(); SM.refresh(); }),
        C.table({
          rows: () => S.finance.bills,
          cols: [
            { label: 'الاسم', render: r => r.name },
            { label: 'المبلغ', render: r => U.money(r.amount) },
            { label: 'الاستحقاق', render: r => `يوم ${r.dueDay} من كل شهر` },
          ],
          onDelete: (r) => S.finance.bills.splice(S.finance.bills.indexOf(r), 1),
          empty: 'أضف اشتراكاتك ليصلك تنبيه قبل موعدها في اللوحة العامة',
          emptyIcon: '📅',
        }),
      ), { icon: '📅', sub: 'تنبيه تلقائي قبل الموعد بأسبوع في اللوحة العامة' }),
    );
  }

  function savings(S) {
    const C = SM.C;
    return el('div', {},
      C.quickForm([
        { k: 'name', label: 'هدف ادخار جديد', placeholder: 'لابتوب جديد، سفر...', grow: true },
        { k: 'target', label: 'المبلغ المستهدف', type: 'number', min: 1 },
        { k: 'deadline', label: 'الموعد', type: 'date', required: false },
      ], (v) => {
        if (!v.target) return;
        S.finance.savings.push({ id: U.uid(), name: v.name, target: v.target, deadline: v.deadline, deposits: [] });
        SM.store.save(); SM.refresh();
      }, { label: '+ هدف ادخار' }),
      S.finance.savings.length ? S.finance.savings.map(g => {
        const saved = savedOf(g);
        const pct = U.pct(saved, g.target);
        return C.card(g.name, el('div', {},
          el('div', { class: 'row space center-v' },
            el('span', { class: 'big-num', style: `color:${ORANGE}` }, `${pct}%`),
            el('div', {}, el('b', {}, U.money(saved)), el('span', { class: 'muted' }, ` من ${U.money(g.target)}`)),
            g.deadline ? C.countdownChip(g.deadline) : null,
          ),
          C.bar(pct, pct >= 100 ? '#4ade80' : ORANGE),
          pct >= 100 ? el('p', { class: 'center', style: 'color:#4ade80;font-weight:700' }, '🎉 وصلت للهدف! فخورين فيك') : null,
          el('div', { class: 'sep' }),
          C.quickForm([
            { k: 'amount', label: 'إيداع جديد', type: 'number', min: 1 },
            { k: 'date', label: 'التاريخ', type: 'date', value: 'today' },
          ], (v) => {
            if (!v.amount) return;
            g.deposits.push({ id: U.uid(), amount: v.amount, date: v.date });
            SM.store.save(); SM.C.toast('إيداع مسجّل 🏦'); SM.refresh();
          }, { label: '+ إيداع' }),
          g.deposits.length ? C.table({
            rows: () => g.deposits.slice().sort((a, b) => b.date.localeCompare(a.date)),
            cols: [
              { label: 'التاريخ', render: r => U.fmtDate(r.date) },
              { label: 'المبلغ', render: r => el('b', { style: 'color:#4ade80' }, U.money(r.amount)) },
            ],
            onDelete: (r) => g.deposits.splice(g.deposits.indexOf(r), 1),
          }) : null,
        ), {
          icon: '🏦',
          actions: el('button', { class: 'iconbtn iconbtn--danger', on: { click: () => C.confirm(`حذف هدف «${g.name}» وسجل إيداعاته؟`, () => { S.finance.savings.splice(S.finance.savings.indexOf(g), 1); SM.store.save(); SM.refresh(); }) } }, '🗑'),
        });
      }) : C.empty('🏦', 'حدد هدفًا (مبلغ + مدة) وتابع وصولك إليه إيداعًا بإيداع'),
    );
  }

  function reports(S) {
    const C = SM.C;
    const now = new Date();
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({ ym: U.monthKey(d), label: new Intl.DateTimeFormat('ar', { month: 'short' }).format(d) });
    }
    const groups = months.map(m => ({
      label: m.label,
      bars: [
        { v: monthIncome(S, m.ym), color: '#4ade80', title: 'الدخل' },
        { v: U.sum(monthExpenses(S, m.ym), e => e.amount), color: '#f87171', title: 'المصاريف' },
      ],
    }));

    const ym = U.monthKey();
    const byCat = spentByCat(S, ym);
    const yearYm = String(now.getFullYear());
    const yearSpent = U.sum(S.finance.expenses.filter(e => (e.date || '').startsWith(yearYm)), e => e.amount);
    const topCat = Object.entries(byCat).sort((a, b) => b[1] - a[1])[0];

    return el('div', {},
      C.card('أين تذهب الأموال؟', C.donut(
        Object.entries(byCat).map(([c, v]) => ({ label: c, value: v, color: catColor(S, c) })),
        { centerSub: 'هذا الشهر', empty: 'لا مصاريف هذا الشهر' },
      ), { icon: '🍩' }),
      C.card('مقارنة الشهور (آخر ٦ أشهر)', el('div', {},
        C.colChart(groups, { height: 170, fmt: U.money }),
        el('div', { class: 'row gap center', style: 'margin-top:8px' },
          el('span', { class: 'hint' }, el('i', { class: 'dot', style: 'background:#4ade80' }), ' الدخل'),
          el('span', { class: 'hint' }, el('i', { class: 'dot', style: 'background:#f87171' }), ' المصاريف'),
        ),
      ), { icon: '📊' }),
      C.card('الملخص', el('div', { class: 'stats-grid' },
        C.stat('مصاريف هذا الشهر', U.money(U.sum(Object.values(byCat))), { icon: '🧾', color: '#f87171' }),
        C.stat('أعلى تصنيف صرف', topCat ? topCat[0] : '—', { icon: '🏷️', color: GOLD, sub: topCat ? U.money(topCat[1]) : '' }),
        C.stat('مصاريف السنة', U.money(yearSpent), { icon: '📆', color: ORANGE, sub: yearYm }),
        C.stat('إجمالي المدخرات', U.money(U.sum(S.finance.savings, savedOf)), { icon: '🏦', color: '#4ade80' }),
      ), { icon: '📋', sub: 'ملخص شهري وسنوي' }),
    );
  }

  SM.views.finance = function (planet, secId) {
    const S = SM.store.state;
    switch (secId) {
      case 'income': return income(S);
      case 'expenses': return expenses(S);
      case 'budget': return budget(S);
      case 'savings': return savings(S);
      case 'reports': return reports(S);
      default: return dash(S);
    }
  };
})();
