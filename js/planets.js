/* Second Mind — تعريفات الكواكب والمجالات */
(function () {
  /* المجالات الست لمربع التقدّم (حسب المتطلبات) */
  SM.AREAS = [
    { id: 'health',   name: 'الصحة',          color: '#34d399' },
    { id: 'mental',   name: 'الصحة النفسية',  color: '#7dd3fc' },
    { id: 'learning', name: 'التعلم الذاتي',  color: '#3b82f6' },
    { id: 'study',    name: 'الدراسة',        color: '#b08968' },
    { id: 'money',    name: 'الادخار والمال', color: '#fb923c' },
    { id: 'skills',   name: 'المهارات',       color: '#a78bfa' },
  ];
  SM.areaById = (id) => SM.AREAS.find(a => a.id === id) || { id, name: id, color: '#94a3b8' };

  /* مستويات الأهداف و نقاط XP */
  SM.DIFF = {
    hard:   { id: 'hard',   label: 'صعبة',    pts: 50, color: '#f87171' },
    medium: { id: 'medium', label: 'متوسطة',  pts: 30, color: '#fb923c' },
    easy:   { id: 'easy',   label: 'سهلة',    pts: 10, color: '#4ade80' },
  };

  /* الكواكب الأساسية الخمسة */
  SM.PLANETS = [
    {
      id: 'health', name: 'الصحة', en: 'HEALTH', color: '#34d399',
      orbit: 0, angle: 118, size: 122, ptype: 'earth', defaultAreas: ['health', 'mental'],
      sections: [
        { id: 'dash',  name: 'اللوحة العامة',    icon: '🛰️' },
        { id: 'sport', name: 'الرياضة',          icon: '🏃‍♀️' },
        { id: 'food',  name: 'التغذية',          icon: '🥗' },
        { id: 'care',  name: 'العناية الشخصية',  icon: '🧴' },
        { id: 'mind',  name: 'الصحة النفسية',    icon: '🌿' },
      ],
    },
    {
      id: 'learning', name: 'التعلم الذاتي والمهارات', en: 'LEARNING & SKILLS', color: '#38bdf8',
      orbit: 1, angle: 250, size: 132, ptype: 'swirl', defaultAreas: ['learning', 'skills'],
      sections: [
        { id: 'dash',      name: 'اللوحة العامة',       icon: '🛰️' },
        { id: 'courses',   name: 'كورسات',              icon: '🎓' },
        { id: 'reading',   name: 'القراءة',             icon: '📚' },
        { id: 'knowledge', name: 'الملاحظات والمعرفة',  icon: '🧠' },
        { id: 'skills',    name: 'المهارات',            icon: '⚡' },
      ],
    },
    {
      id: 'finance', name: 'المالية', en: 'FINANCE', color: '#fbbf24',
      orbit: 2, angle: 210, size: 150, ptype: 'bands', defaultAreas: ['money'],
      sections: [
        { id: 'dash',     name: 'اللوحة العامة',  icon: '🛰️' },
        { id: 'income',   name: 'مصادر الدخل',    icon: '💰' },
        { id: 'expenses', name: 'المصاريف',       icon: '🧾' },
        { id: 'budget',   name: 'الميزانية',      icon: '⚖️' },
        { id: 'savings',  name: 'الادخار',        icon: '🏦' },
        { id: 'reports',  name: 'تقارير ورسوم',   icon: '📈' },
      ],
    },
    {
      id: 'hobbies', name: 'الهوايات', en: 'HOBBIES', color: '#e879f9', rainbow: true,
      orbit: 1, angle: 318, size: 150, ptype: 'ring', defaultAreas: ['skills'],
      sections: [
        { id: 'dash',     name: 'اللوحة العامة',    icon: '🛰️' },
        { id: 'mylist',   name: 'هواياتي',          icon: '🎨' },
        { id: 'skill',    name: 'التقدم والمهارة',  icon: '🚀' },
        { id: 'projects', name: 'مشاريعي',          icon: '🛠️' },
        { id: 'inspo',    name: 'مصادر وإلهام',     icon: '✨' },
      ],
    },
    {
      id: 'study', name: 'الدراسة', en: 'STUDY', color: '#c19a6b',
      orbit: 0, angle: 40, size: 108, ptype: 'crater', defaultAreas: ['study'],
      sections: [
        { id: 'dash',     name: 'اللوحة العامة',        icon: '🛰️' },
        { id: 'subjects', name: 'المواد',               icon: '📘' },
        { id: 'homework', name: 'الواجبات والمهام',     icon: '📝' },
        { id: 'schedule', name: 'الجدول والاختبارات',   icon: '🗓️' },
        { id: 'notes',    name: 'ملاحظات',              icon: '🗒️' },
        { id: 'grades',   name: 'الأهداف والدرجات',     icon: '🎯' },
        { id: 'sat',      name: 'SAT',                  icon: '🧪' },
        { id: 'unis',     name: 'جامعات أخرى',          icon: '🌌' },
      ],
    },
  ];

  /* أقسام الكواكب المخصصة (التي تُنشأ بزر +) */
  SM.CUSTOM_SECTIONS = [
    { id: 'dash',   name: 'اللوحة العامة', icon: '🛰️' },
    { id: 'tasks',  name: 'المهام',        icon: '✅' },
    { id: 'habits', name: 'العادات',       icon: '🔁' },
    { id: 'notes',  name: 'ملاحظات',       icon: '🗒️' },
  ];

  SM.PLANET_PALETTE = ['#f472b6', '#22d3ee', '#a3e635', '#f97316', '#a78bfa', '#f43f5e', '#2dd4bf', '#eab308'];

  /* إيجاد كوكب (أساسي أو مخصص) بشكل موحّد */
  SM.planetById = function (id) {
    const base = SM.PLANETS.find(p => p.id === id);
    if (base) return base;
    const S = SM.store && SM.store.state;
    const c = S && S.custom.find(p => p.id === id);
    if (!c) return null;
    return {
      id: c.id, name: c.name, en: 'NEW WORLD', color: c.color, custom: true,
      orbit: 2, size: 96, ptype: 'plain', sections: SM.CUSTOM_SECTIONS, defaultAreas: SM.AREAS.map(a => a.id),
    };
  };

  SM.allPlanets = function () {
    const S = SM.store.state;
    return [...SM.PLANETS, ...S.custom.map(c => SM.planetById(c.id))];
  };
})();
