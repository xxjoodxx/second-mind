/* Second Mind — الحالة والتخزين ومحرك الحسابات */
(function () {
  const KEY = 'second-mind-v1';
  const U = SM.U;

  const DEFAULTS = {
    version: 1,
    profile: { name: 'Joud', avatar: null, homeHero: null, nameColor: null },
    settings: { currency: 'ر.س', waterGoal: 8, sportWeeklyGoal: 4, fontAr: 'Cairo', fontEn: 'Space Grotesk' },
    goals: [],           // {id,title,difficulty,done,createdAt,doneAt}
    habits: [],          // {id,name,planetId,area,createdAt,log:{'YYYY-MM-DD':true}}
    heroes: {},          // planetId -> dataURL
    labelColors: {},     // planetId -> لون اسم الكوكب على الواجهة
    planetColors: {},    // planetId -> لون جسم الكوكب (إزاحة درجة اللون)
    custom: [],          // كواكب مخصصة {id,name,color,createdAt,todos:[],notes:[]}
    health: {
      workouts: [],      // {id,date,type,duration,detail,note}
      weekSchedule: {},  // dayIdx(0-6) -> نوع اليوم
      meals: [],         // {id,date,meal,desc}
      water: {},         // date -> cups
      recipes: [],       // {id,title,body}
      careRoutine: [],   // {id,title,freq:'daily'|'weekly',checks:{periodKey:true}}
      careReminders: [], // {id,title,everyDays,lastDone}
      mood: {},          // date -> 1..5
      journal: [],       // {id,date,text}
      gratitude: [],     // {id,date,text}
      sleep: [],         // {id,date,hours,quality}
    },
    learning: {
      courses: [],       // {id,title,source,progress,status}
      wishlist: [],      // {id,text}
      books: [],         // {id,title,author,status,pagesTotal,pagesRead}
      quotes: [],        // {id,bookId,text}
      knowledge: [],     // {id,title,body,tags,date}
      flashcards: [],    // {id,front,back,known}
      links: [],         // {id,title,url}
      skills: [],        // {id,name,level}
      goals: [],         // {id,title,deadline,steps:[{id,text,done}]}
      sessions: [],      // {id,date,minutes}
    },
    finance: {
      incomes: [],       // {id,name,amount,recurring,date}
      expenses: [],      // {id,amount,category,date,note}
      categories: ['أكل', 'مواصلات', 'اشتراكات', 'ترفيه', 'تسوق', 'صحة', 'أخرى'],
      budgets: {},       // category -> monthly limit
      savings: [],       // {id,name,target,deadline,deposits:[{id,date,amount}]}
      bills: [],         // {id,name,amount,dueDay}
    },
    hobbies: {
      list: [],          // {id,name,status,time,level,habitId}
      sessions: [],      // {id,date,hobbyId,minutes}
      achievements: [],  // {id,text,date}
      projects: [],      // {id,title,hobbyId,status}
      ideas: [],         // {id,text}
      gallery: [],       // {id,image,caption,date}
      resources: [],     // {id,title,url,type}
      inspiration: [],   // {id,image,note}
      tools: [],         // {id,name,owned}
    },
    study: {
      subjects: [],      // {id,name,status,grade,summary}
      files: [],         // {id,subjectId,title,url}
      homework: [],      // {id,title,subjectId,due,priority,done}
      schedule: {},      // dayIdx -> [{id,time,text}]
      exams: [],         // {id,title,subjectId,date}
      notes: [],         // {id,subjectId,title,body}
      flashcards: [],
      sessions: [],      // {id,date,minutes,source}
      grades: [],        // {id,subjectId,title,score,outOf}
      goals: [],         // {id,title,target,current}
      sat: { examDate: null, target: 1600, tests: [], weak: [], strong: [], resources: [] },
    },
  };

  function clone(o) {
    return typeof structuredClone === 'function' ? structuredClone(o) : JSON.parse(JSON.stringify(o));
  }

  /* دمج عميق: القيم المخزنة فوق الافتراضية حتى لا تنكسر البيانات مع التحديثات */
  function deepMerge(base, over) {
    if (Array.isArray(base)) return Array.isArray(over) ? over : base;
    if (base && typeof base === 'object') {
      const out = { ...base };
      if (over && typeof over === 'object') {
        for (const k of Object.keys(over)) {
          out[k] = (k in base) ? deepMerge(base[k], over[k]) : over[k];
        }
      }
      return out;
    }
    return over === undefined ? base : over;
  }

  function seed(s) {
    const mk = (name, planetId, area) => ({ id: U.uid(), name, planetId, area, createdAt: U.todayKey(), log: {} });
    s.habits = [
      mk('تمرين رياضي', 'health', 'health'),
      mk('شرب ماء كافي', 'health', 'health'),
      mk('روتين العناية', 'health', 'health'),
      mk('تأمل أو تنفّس', 'health', 'mental'),
      mk('كتابة يوميات', 'health', 'mental'),
      mk('تعلم ٣٠ دقيقة', 'learning', 'learning'),
      mk('قراءة ٢٠ صفحة', 'learning', 'learning'),
      mk('ممارسة مهارة', 'learning', 'skills'),
      mk('جلسة مذاكرة', 'study', 'study'),
      mk('تسجيل مصاريفي', 'finance', 'money'),
      mk('ممارسة هواية', 'hobbies', 'skills'),
    ];
  }

  let state;
  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) { const s = clone(DEFAULTS); seed(s); return s; }
      return deepMerge(clone(DEFAULTS), JSON.parse(raw));
    } catch (e) {
      console.warn('Second Mind: فشل تحميل البيانات', e);
      const s = clone(DEFAULTS); seed(s); return s;
    }
  }
  state = load();

  SM.store = {
    get state() { return state; },
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(state)); }
      catch (e) {
        console.warn(e);
        if (SM.C && SM.C.toast) SM.C.toast('⚠️ مساحة التخزين ممتلئة — جرّب حذف بعض الصور');
      }
    },
    export() {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `second-mind-backup-${U.todayKey()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 3000);
    },
    import(json) {
      const data = JSON.parse(json);
      if (!data || typeof data !== 'object' || !data.profile) throw new Error('ملف غير صالح');
      state = deepMerge(clone(DEFAULTS), data);
      SM.store.save();
    },
    reset() { localStorage.removeItem(KEY); location.reload(); },
  };

  /* ---------- محرك الحسابات ---------- */
  const calc = {};

  calc.goalPoints = (g) => (SM.DIFF[g.difficulty] || SM.DIFF.easy).pts;

  calc.xpTotal = () => U.sum(state.goals.filter(g => g.done), calc.goalPoints);

  const RANKS = [
    { min: 0,    name: 'غيمة نجمية',   icon: '☁️' },
    { min: 100,  name: 'قمر ناشئ',     icon: '🌙' },
    { min: 300,  name: 'كويكب نشيط',   icon: '☄️' },
    { min: 700,  name: 'كوكب واعد',    icon: '🪐' },
    { min: 1500, name: 'نجم ساطع',     icon: '⭐' },
    { min: 3000, name: 'مجرّة كاملة',  icon: '🌌' },
  ];
  calc.rank = (xp) => {
    let r = RANKS[0], next = null;
    for (let i = 0; i < RANKS.length; i++) {
      if (xp >= RANKS[i].min) { r = RANKS[i]; next = RANKS[i + 1] || null; }
    }
    return { ...r, next };
  };

  /* سلسلة العادة الحالية (تسمح بعدم احتساب اليوم إذا لم يُسجّل بعد) */
  calc.streak = (h) => {
    let d = new Date();
    if (!h.log[U.todayKey(d)]) d = U.addDays(d, -1);
    let s = 0;
    while (h.log[U.todayKey(d)]) { s++; d = U.addDays(d, -1); }
    return s;
  };

  calc.longestStreak = (h) => {
    const keys = Object.keys(h.log).filter(k => h.log[k]).sort();
    let best = 0, cur = 0, prev = null;
    for (const k of keys) {
      cur = (prev && (U.parseKey(k) - U.parseKey(prev) === 86400000)) ? cur + 1 : 1;
      best = Math.max(best, cur);
      prev = k;
    }
    return best;
  };

  /* نسبة إنجاز مجال خلال أيام معينة — null إذا لا عادات في المجال */
  calc.areaProgress = (areaId, days) => {
    const habits = state.habits.filter(h => h.area === areaId);
    if (!habits.length) return null;
    let done = 0;
    for (const h of habits) for (const d of days) if (h.log[d]) done++;
    return Math.round((done / (habits.length * days.length)) * 100);
  };

  calc.weeklyAreas = () => {
    const days = U.lastNDays(7);
    return SM.AREAS.map(a => ({ area: a, pct: calc.areaProgress(a.id, days) }));
  };
  calc.monthlyAreas = () => {
    const days = U.lastNDays(30);
    return SM.AREAS.map(a => ({ area: a, pct: calc.areaProgress(a.id, days) }));
  };

  /* نسبة كوكب أسبوعية (لعدّاد الكوكب الصغير على الواجهة) */
  calc.planetWeekly = (planetId) => {
    const days = U.lastNDays(7);
    const habits = state.habits.filter(h => h.planetId === planetId);
    if (!habits.length) return null;
    let done = 0;
    for (const h of habits) for (const d of days) if (h.log[d]) done++;
    return Math.round((done / (habits.length * days.length)) * 100);
  };

  /* ضوء الشمس: عالية→ذهبي، ممتازة→أبيض، جيدة→أخضر، سيئة→أحمر */
  const SUN_TIERS = [
    { min: 85, id: 'gold',  label: 'عالية',  color: '#ffd66b' },
    { min: 60, id: 'white', label: 'ممتازة', color: '#f8fafc' },
    { min: 35, id: 'green', label: 'جيدة',   color: '#4ade80' },
    { min: 0,  id: 'red',   label: 'سيئة',   color: '#f87171' },
  ];
  calc.productivity = () => {
    const vals = calc.weeklyAreas().map(x => x.pct).filter(p => p != null);
    if (!vals.length) return { pct: null, tier: null };
    // لا علامات إطلاقًا خلال آخر ٧ أيام → شمس محايدة تدعو للبدء بدل الأحمر القاسي
    const days = U.lastNDays(7);
    const anyCheck = state.habits.some(h => days.some(d => h.log[d]));
    if (!anyCheck) return { pct: null, tier: null };
    const avg = Math.round(U.sum(vals) / vals.length);
    const tier = SUN_TIERS.find(t => avg >= t.min) || SUN_TIERS[SUN_TIERS.length - 1];
    return { pct: avg, tier };
  };

  SM.calc = calc;
})();
