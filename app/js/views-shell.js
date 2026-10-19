/* Screens outside a batch: welcome, Today, Batches, Games, Progress. */
(function (G) {
  'use strict';
  const t = (k, v) => G.t(k, v), esc = G.esc;

  G.page = (inner, hash) => ({ html: G.shell(inner, hash) });

  G.levelSeg = function () {
    const cur = G.level();
    return '<div class="seg levels glass" role="group" aria-label="' + esc(t('batch.level')) + '">' + G.LEVELS.map(l =>
      '<button data-act="setLevel" data-v="' + l + '" data-level="' + l + '" class="' + (cur === l ? 'on' : '') + '" aria-pressed="' + (cur === l) + '">' + esc(t('level.' + l)) + '</button>').join('') + '</div>';
  };
  G.starsHtml = function (batch) {
    return '<span class="stars" aria-label="stars">' + G.LEVELS.map(l => '<span class="' + (G.hasStar(batch, l) ? '' : 'off') + '">⭐</span>').join('') + '</span>';
  };
  /* the 12 tasks in one batch at one level: 4 meet sets, 6 use rounds, 2 story parts */
  G.taskCounts = function (batch, level) {
    const p = G.pg(batch, level);
    const done = p.meet.filter(Boolean).length + p.pick.filter(x => x !== null).length + p.maker.filter(x => x > 0).length + p.bee.filter(x => x !== null).length + p.story.filter(Boolean).length;
    return { done, total: 12 };
  };
  G.nextStep = function (batch, level) {
    const p = G.pg(batch, level), base = '#/batch/' + batch;
    const m = p.meet.findIndex(x => !x);
    if (m >= 0) return base + '/meet/' + (m + 1);
    for (const a of ['pick', 'maker', 'bee']) {
      const i = p[a].findIndex(x => a === 'maker' ? !x : x === null);
      if (i >= 0) return base + '/use/' + a + '/' + (i + 1);
    }
    const s = p.story.findIndex(x => !x);
    if (s >= 0) return base + '/story/' + (s + 1);
    return base;
  };

  /* ---------- welcome ---------- */
  G.route(/^#\/welcome$/, function () {
    const words = [['chair', 4, 18, 0], ['tea', 82, 12, 1.5], ['earth', 10, 70, 3], ['well', 86, 64, 2], ['hold', 22, 38, 4.5], ['mother', 70, 86, 1], ['online', 6, 88, 5], ['kid', 90, 36, 3.5], ['ability', 44, 6, 2.5], ['set', 58, 92, 6]];
    const fl = words.map(w => '<span style="left:' + w[1] + '%;top:' + w[2] + '%;animation-delay:-' + w[3] + 's">' + w[0] + '</span>').join('');
    const p = G.state.prefs;
    const seg = (act, opts, cur) => '<div class="seg glass" role="group">' + opts.map(([v, l]) => '<button class="' + (cur === v ? 'on' : '') + '" data-act="' + act + '" data-v="' + v + '">' + esc(l) + '</button>').join('') + '</div>';
    return {
      html: '<div class="welcome" data-level="beginner"><div class="floaters" aria-hidden="true">' + fl + '</div>' +
        '<section class="glass hero"><div class="by">' + esc(t('welcome.by')) + '</div><div class="big">6,000</div>' +
        '<h1>' + esc(t('welcome.title')) + '</h1><p class="sub">' + esc(t('welcome.sub')) + '</p>' +
        '<label class="sr" for="nm">' + esc(t('welcome.name')) + '</label>' +
        '<input id="nm" type="text" maxlength="24" autocomplete="given-name" placeholder="' + esc(t('welcome.namePh')) + '" value="' + esc(G.pendingName || '') + '">' +
        '<button class="btn primary" data-act="startApp" style="min-width:220px">' + esc(t('welcome.start')) + G.icon('arrow') + '</button>' +
        '<div class="row wrap" style="justify-content:center">' + seg('welcomeLang', [['en', 'English'], ['zh', '中文']], p.lang) + seg('welcomeTheme', [['auto', t('settings.auto')], ['light', t('settings.light')], ['dark', t('settings.dark')]], p.theme) + '</div>' +
        '<div class="hint-text">' + esc(t('welcome.saved')) + '</div></section></div>',
      mount: root => { const i = G.$('#nm', root); i.addEventListener('keydown', e => { if (e.key === 'Enter') G.acts.startApp(); }); }
    };
  });
  G.acts.startApp = function () {
    const v = ((G.$('#nm') || {}).value || '').trim();
    G.state.profile = { name: (v || (G.state.prefs.lang === 'zh' ? '同學' : 'Student')).slice(0, 24), created: G.today() };
    G.save(); location.hash = '#/today';
  };
  G.acts.welcomeLang = el => { G.pendingName = (G.$('#nm') || {}).value || ''; G.state.prefs.lang = el.getAttribute('data-v'); G.save(); G.applyTheme(); G.render(); };
  G.acts.welcomeTheme = el => { G.pendingName = (G.$('#nm') || {}).value || ''; G.state.prefs.theme = el.getAttribute('data-v'); G.save(); G.applyTheme(); G.render(); };

  /* ---------- today ---------- */
  G.route(/^#\/today$/, function () {
    const lv = G.level(), name = G.state.profile.name, b = 'b001';
    return G.loadBatch(b).then(() => {
      const c = G.taskCounts(b, lv), pct = Math.round(c.done / c.total * 100);
      const started = c.done > 0;
      const next = G.nextStep(b, lv);
      const inner =
        '<div class="hdr"><div><h1>' + esc(t('today.hello', { name })) + ' 👋</h1><p class="sub">' + esc(t('today.sub')) + '</p></div>' + G.levelSeg() + '</div>' +
        '<section class="glass card tint" style="display:flex;gap:22px;align-items:center;flex-wrap:wrap"><div class="ring" style="--p:' + pct + '"><b>' + pct + '%</b></div>' +
        '<div class="grow" style="min-width:220px"><h2>' + esc(t('level.' + lv)) + ' · ' + esc(t('level.' + lv + '.d')) + '</h2><h3 style="font-size:26px;margin:4px 0 8px">' + esc(t('batches.batch', { n: 1 })) + '</h3>' +
        '<div class="row wrap" style="gap:10px"><span class="pill">' + esc(t('station.meet')) + '</span><span class="pill">' + esc(t('station.use')) + '</span><span class="pill">' + esc(t('station.story')) + '</span>' + G.starsHtml(b) + '</div></div>' +
        '<button class="btn primary" data-act="go" data-go="' + next + '">' + esc(started ? t('today.continue', { n: 1 }) : t('today.new', { n: 1 })) + G.icon('arrow') + '</button></section>' +
        '<div class="grid g3"><div class="glass stat"><b>' + G.state.streak.count + '</b><span>' + esc(t('today.streak')) + '</span></div>' +
        '<div class="glass stat"><b>' + G.starCount() + '</b><span>' + esc(t('today.stars')) + '</span></div>' +
        '<div class="glass stat"><b>' + G.metCount() + '</b><span>' + esc(t('today.met')) + '</span></div></div>' +
        '<section class="glass card"><h2>' + esc(t('today.howTitle')) + '</h2><div class="grid g3" style="margin-top:14px">' +
        [1, 2, 3].map(n => '<div class="stack tight" data-level="' + lv + '"><div class="row"><div class="num" style="width:36px;height:36px">' + n + '</div><b>' + esc(t('station.' + ['meet', 'use', 'story'][n - 1])) + '</b></div><div class="sub">' + esc(t('today.how' + n)) + '</div></div>').join('') +
        '</div></section>';
      return G.page(inner, '#/today');
    });
  });

  /* ---------- batches ---------- */
  G.route(/^#\/batches$/, function () {
    const plan = G.data.plan, stage = G.state.prefs.stage || 1;
    const list = plan.batches.filter(b => b.stage === stage);
    const chips = [1, 2, 3, 4, 5, 6].map(n => '<button class="chipbtn ' + (n === stage ? 'on' : '') + '" data-act="setStage" data-v="' + n + '">' + esc(t('batches.stage', { n })) + '</button>').join('');
    const cards = list.map(b => {
      const open = G.isBuilt(b.id);
      return open
        ? '<a class="glass bcard open lift" href="#/batch/' + b.id + '" data-level="' + G.level() + '"><span class="badge">' + esc(t('common.free')) + '</span><b>' + b.n + '</b>' + G.starsHtml(b.id) + '</a>'
        : '<button class="glass bcard locked" data-act="soon"><span style="font-size:18px">' + G.icon('lock').replace('<svg', '<svg width="20" height="20" style="stroke:currentColor;fill:none;stroke-width:2"') + '</span><b>' + b.n + '</b><small>' + esc(t('common.soon')) + '</small></button>';
    }).join('');
    const little = plan.littleWords.reduce((n, b) => n + b.words.length, 0);
    const inner = '<div class="hdr"><div><h1>' + esc(t('batches.title')) + '</h1><p class="sub">' + esc(t('batches.sub')) + '</p></div></div>' +
      '<div class="chips">' + chips + '</div>' +
      '<div class="row"><span class="pill">' + esc(t('batches.count', { n: list.length })) + '</span><span class="pill">' + esc(t('batches.ready')) + ': ' + list.filter(b => G.isBuilt(b.id)).length + '</span></div>' +
      '<div class="bgrid" data-level="' + G.level() + '">' + cards + '</div>' +
      '<section class="glass card"><h3>' + esc(t('batches.littleTitle')) + ' · ' + little + ' ' + esc(t('common.words')) + '</h3><p class="sub" style="margin-top:6px">' + esc(t('batches.littleSub')) + '</p><span class="pill" style="margin-top:12px">' + esc(t('common.soon')) + '</span></section>';
    return G.page(inner, '#/batches');
  });
  G.acts.setStage = el => { G.state.prefs.stage = +el.getAttribute('data-v'); G.save(); G.render(); };
  G.acts.soon = () => G.toast(t('locked.text'));

  /* ---------- games hub ---------- */
  G.route(/^#\/games$/, function () {
    const lv = G.level(), b = 'b001';
    const spelling = [['build', '🔤', 'act.build'], ['missing', '🧩', 'act.missing'], ['bee', '🐝', 'act.bee']].map(([a, em, k]) =>
      '<div class="glass station" data-level="' + lv + '"><div class="row"><span style="font-size:34px">' + em + '</span><div><h3>' + esc(t(k)) + '</h3><div class="sub">' + esc(t(k + '.d')) + '</div></div></div>' +
      '<div class="row"><a class="btn sm primary grow" href="#/play/' + a + '/' + b + '/1">' + esc(t('common.part', { n: 1 })) + '</a><a class="btn sm ghost grow" href="#/play/' + a + '/' + b + '/2">' + esc(t('common.part', { n: 2 })) + '</a></div></div>').join('');
    const arcade = [['🌧️', 'games.wordRain'], ['🃏', 'games.memory'], ['⚡', 'games.speed']].map(([em, k]) =>
      '<div class="glass station" style="opacity:.62"><div class="row"><span style="font-size:34px">' + em + '</span><div><h3>' + esc(t(k)) + '</h3><div class="sub">' + esc(t(k + '.d')) + '</div></div></div><span class="pill" style="align-self:flex-start">' + esc(t('common.soon')) + '</span></div>').join('');
    const inner = '<div class="hdr"><div><h1>' + esc(t('games.title')) + '</h1><p class="sub">' + esc(t('games.sub')) + '</p></div>' + G.levelSeg() + '</div>' +
      '<div class="row"><span class="pill"><span class="dot"></span>' + esc(t('games.pickBatch', { n: 1, level: t('level.' + lv) })) + '</span></div>' +
      '<h2>' + esc(t('games.spelling')) + '</h2><div class="grid g3">' + spelling + '</div>' +
      '<h2>' + esc(t('games.arcade')) + '</h2><div class="grid g3">' + arcade + '</div>';
    return G.loadBatch(b).then(() => G.page(inner, '#/games'));
  });

  /* ---------- progress ---------- */
  G.route(/^#\/progress$/, function () {
    const b = 'b001';
    const rows = G.LEVELS.map(l => {
      const c = G.taskCounts(b, l), pct = Math.round(c.done / c.total * 100);
      return '<div class="glass card" data-level="' + l + '"><div class="row between"><h3>' + esc(t('level.' + l)) + '</h3><span class="stars"><span class="' + (G.hasStar(b, l) ? '' : 'off') + '">⭐</span></span></div><div class="meter" style="margin:12px 0 6px"><i style="width:' + pct + '%"></i></div><span class="sub">' + c.done + ' / ' + c.total + '</span></div>';
    }).join('');
    const ss = G.state.sentences.slice().reverse();
    const sentences = ss.length ? ss.map((s, i) => '<div class="saved"><span class="grow">' + esc(s.text) + '</span><button class="iconbtn" data-act="say" data-say="' + esc(s.text) + '" aria-label="' + esc(t('common.listen')) + '">' + G.icon('speaker') + '</button><button class="iconbtn" data-act="delSentence" data-i="' + (G.state.sentences.length - 1 - i) + '" aria-label="' + esc(t('progress.delete')) + '">' + G.icon('x') + '</button></div>').join('')
      : '<div class="empty">' + esc(t('progress.noSentences')) + '</div>';
    const inner = '<div class="hdr"><div><h1>' + esc(t('progress.title')) + '</h1><p class="sub">' + esc(t('progress.sub')) + '</p></div></div>' +
      '<div class="grid g3"><div class="glass stat"><b>' + G.starCount() + '</b><span>' + esc(t('progress.stars')) + '</span></div><div class="glass stat"><b>' + G.metCount() + '</b><span>' + esc(t('today.met')) + '</span></div><div class="glass stat"><b>' + G.state.streak.count + '</b><span>' + esc(t('today.streak')) + '</span></div></div>' +
      '<h2>' + esc(t('batches.batch', { n: 1 })) + '</h2><div class="grid g3">' + rows + '</div>' +
      '<h2>' + esc(t('progress.sentences')) + '</h2><div class="stack tight">' + sentences + '</div>' +
      '<section class="glass card"><h3>' + esc(t('progress.resetTitle')) + '</h3><p class="sub" style="margin:6px 0 14px">' + esc(t('progress.resetText')) + '</p><button class="btn ghost" data-act="resetProgress">' + esc(t('progress.resetDo')) + '</button></section>';
    return G.page(inner, '#/progress');
  });
  G.acts.delSentence = el => { G.state.sentences.splice(+el.getAttribute('data-i'), 1); G.save(); G.render(); };
  G.acts.resetProgress = () => { if (window.confirm(t('progress.resetText'))) { G.state.progress = {}; G.state.sentences = []; G.state.met = {}; G.state.streak = { last: null, count: 0 }; G.save(); G.render(); } };
})(window.G = window.G || {});
