/* A lesson (20 words): hub, the three stations (Meet, Use, Article) and the spelling games. Every activity covers all 20 words. */
(function (G) {
  'use strict';
  const t = (k, v) => G.t(k, v), esc = G.esc;

  const byHead = (b, h) => b.words.find(w => w.headword === h);
  const zhSwitch = () => G.sw('toggleZh', G.zhOn(), t('batch.zh'), ' data-zhsw="1"');

  /* ---------- shared frame for every activity ---------- */
  function playerPage(crumb, back, navHash) {
    const lv = G.level();
    return {
      html: G.shell('<div class="player" data-level="' + lv + '">' +
        '<div class="pbar"><a class="iconbtn" href="' + back + '" aria-label="' + esc(t('common.back')) + '">' + G.icon('back') + '</a>' +
        '<div class="crumbs">' + crumb + '</div><span class="pill"><span class="dot"></span>' + esc(t('level.' + lv)) + '</span>' +
        '<div class="prog" id="prog"></div>' + zhSwitch() + '</div>' +
        '<section class="glass stage tint" id="stage" aria-live="polite"></section></div>', navHash)
    };
  }
  function setProg(i, n) {
    const el = G.$('#prog'); if (!el) return;
    el.innerHTML = Array.from({ length: n }, (_, k) => '<i class="' + (k < i ? 'on' : k === i ? 'now' : '') + '"></i>').join('');
  }
  /* The five activities of a lesson in the order a student does them. */
  const SEQ = [
    { key: 'meet', path: '/meet', name: () => t('step.meet'), what: () => t('station.meet.d'), done: p => p.meet[0] > 0 },
    { key: 'pick', path: '/use/pick', name: () => t('act.pick'), what: () => t('act.pick.d'), done: p => p.pick[0] !== null },
    { key: 'maker', path: '/use/maker', name: () => t('act.maker'), what: () => t('act.maker.d'), done: p => p.maker[0] > 0 },
    { key: 'bee', path: '/use/bee', name: () => t('act.bee'), what: () => t('act.bee.d'), done: p => p.bee[0] !== null },
    { key: 'story', path: '/story', name: () => t('station.story'), what: () => t('station.story.d'), done: p => p.story[0] > 0 }
  ];
  /* The strip shows the lesson as the three stations on the hub; the Use station counts its three activities. */
  const GROUPS = [{ name: 'station.meet', keys: ['meet'] }, { name: 'station.use', keys: ['pick', 'maker', 'bee'] }, { name: 'station.story', keys: ['story'] }];
  /* What the student sees when an activity ends: the five steps, one big button that names the next activity,
     and two smaller buttons that each say where they go. Progress for `key` is saved before this is called. */
  function lessonEnd(b, key) {
    const lv = G.level(), p = G.pg(b.id, lv), n = G.batchNo(b.id), base = '#/batch/' + b.id;
    const state = SEQ.map(s => s.done(p)), at = SEQ.findIndex(s => s.key === key), count = state.filter(Boolean).length;
    let nx = -1;
    for (let k = 1; k < SEQ.length && nx < 0; k++) { const j = (at + k) % SEQ.length; if (!state[j]) nx = j; }
    const strip = '<ol class="steps" aria-label="' + esc(t('finish.steps')) + '">' + GROUPS.map((g, j) => {
      const idx = g.keys.map(k => SEQ.findIndex(s => s.key === k)), got = idx.filter(i => state[i]).length;
      const all = got === idx.length, isNext = idx.indexOf(nx) >= 0, name = t(g.name), sub = idx.length > 1 ? got + ' / ' + idx.length : '';
      const label = (all ? t('finish.stepDone', { name }) : isNext ? t('finish.stepNext', { name }) : name) + (sub ? ' ' + sub : '');
      return '<li class="step ' + (all ? 'done' : isNext ? 'next' : '') + '" aria-label="' + esc(label) + '"><i aria-hidden="true">' + (all ? '✓' : j + 1) + '</i><span aria-hidden="true">' + esc(name) + (sub ? '<small>' + sub + '</small>' : '') + '</span></li>';
    }).join('') + '</ol>';
    const out = { strip, count: t('finish.count', { n: count, level: t('level.' + lv) }), alts: [{ label: t('finish.again'), act: 'replay' }, { label: t('finish.menu'), href: base }] };
    if (nx >= 0) { out.primary = { label: t('finish.next', { name: SEQ[nx].name() }), href: base + SEQ[nx].path }; out.what = SEQ[nx].what(); }
    else {
      out.complete = t('finish.complete', { n, level: t('level.' + lv) });
      const up = G.LEVELS[G.LEVELS.indexOf(lv) + 1];
      if (up) { out.primary = { label: t('finish.levelUp', { n, level: t('level.' + up) }), act: 'levelUp', v: up, go: base + '/meet' }; out.what = t('finish.levelWhat'); }
      else { out.primary = { label: t('finish.today'), href: '#/today' }; out.what = t('finish.todayWhat'); }
    }
    return out;
  }
  G.acts.levelUp = el => {
    G.state.prefs.level = el.getAttribute('data-v'); G.save();
    const h = el.getAttribute('data-go');
    if (location.hash === h) G.render(); else location.hash = h;
  };
  G.acts.replay = () => G.render();
  const endBtn = (a, cls) => a.href
    ? '<a class="btn ' + cls + '" href="' + a.href + '">' + esc(a.label) + '</a>'
    : '<button class="btn ' + cls + '" data-act="' + a.act + '"' + (a.v ? ' data-v="' + a.v + '"' : '') + (a.go ? ' data-go="' + a.go + '"' : '') + '>' + esc(a.label) + '</button>';
  function finishHtml(o) {
    return '<div class="finish">' + (o.strip || '') + endBtn(o.primary, 'primary lg') + (o.what ? '<div class="sub what">' + esc(o.what) + '</div>' : '') +
      '<div class="alt">' + o.alts.map(a => endBtn(a, 'ghost')).join('') + '</div></div>';
  }
  function finishCard(stage, o) {
    stage.innerHTML = '<div class="banner glass"><span class="big">' + (o.emoji || '🎉') + '</span><div><b>' + esc(o.title) + '</b>' + (o.text ? '<div class="sub">' + esc(o.text) + '</div>' : '') + '</div></div>' + finishHtml(o);
    G.confetti(); G.touchStreak();
  }
  /* The end screen for one of the five lesson activities. `result` is the line about how it went. */
  function endLesson(stage, b, key, result, emoji) {
    const e = lessonEnd(b, key);
    finishCard(stage, Object.assign(e, { emoji: e.complete ? '🏆' : emoji, title: e.complete || result, text: e.complete ? result : e.count }));
  }
  const levelSupport = () => ({ beginner: 0, intermediate: 2, advanced: 3 }[G.level()]);

  /* ---------- lesson hub ---------- */
  G.acts.mediaSoon = () => G.toast(t('media.soonMsg'));
  /* Play the video or conversation inside the lesson page. Where the page is not allowed to show another site's player
     (some preview windows), the panel says so and offers the link in a new tab. */
  let mediaGuard = null;
  function stopMedia() {
    if (mediaGuard) { document.removeEventListener('securitypolicyviolation', mediaGuard); mediaGuard = null; }
    const box = G.$('#mplay'); if (box) box.innerHTML = '';
    G.$$('.mtile').forEach(x => { x.classList.remove('on'); if (x.hasAttribute('aria-expanded')) x.setAttribute('aria-expanded', 'false'); });
  }
  G.acts.mediaClose = stopMedia;
  G.acts.mediaPlay = el => {
    const kind = el.getAttribute('data-kind'), url = G.mediaLink(el.getAttribute('data-b'), G.level(), kind), em = url && G.mediaEmbed(url), box = G.$('#mplay');
    if (!em || !box) return;
    stopMedia();
    const title = t('media.' + kind), src = esc(em.src);
    const player = em.kind === 'frame' ? '<iframe src="' + src + '" title="' + esc(title) + '" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>'
      : em.kind === 'video' ? '<video src="' + src + '" controls playsinline preload="metadata"></video>'
      : '<audio src="' + src + '" controls preload="metadata"></audio>';
    box.innerHTML = '<div class="mplayer"><div class="top"><b>' + esc(title) + '</b><button class="iconbtn" data-act="mediaClose" aria-label="' + esc(t('common.close')) + '">' + G.icon('x') + '</button></div>' +
      '<div class="mframe' + (em.kind === 'audio' ? ' audio' : '') + '">' + player + '</div>' +
      '<a class="sub" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(t('media.open')) + '</a></div>';
    G.$$('.mtile').forEach(x => { const on = x === el; x.classList.toggle('on', on); if (x.hasAttribute('aria-expanded')) x.setAttribute('aria-expanded', on ? 'true' : 'false'); });
    const blocked = () => {
      const f = G.$('#mplay .mframe'); if (!f) return;
      const dup = G.$('#mplay .mplayer > .sub'); if (dup) dup.remove();
      f.className = 'mframe blocked'; f.innerHTML = '<p>' + esc(t('media.blocked')) + '</p><a class="btn primary" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer">' + esc(t('media.open')) + '</a>';
    };
    mediaGuard = e => { if (/^(frame|child|media|default)-src/.test(e.violatedDirective)) blocked(); };
    document.addEventListener('securitypolicyviolation', mediaGuard);
    const m = G.$('#mplay video, #mplay audio');
    if (m) { m.addEventListener('error', blocked); const p = m.play(); if (p && p.catch) p.catch(() => {}); }
    try { box.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (err) { /* older browsers */ }
  };
  G.route(/^#\/batch\/(b\d+)$/, function (id) {
    if (!G.isBuilt(id)) { location.hash = '#/batches'; return new Promise(() => {}); }
    return G.loadBatch(id).then(b => {
      const lv = G.level(), p = G.pg(id, lv), n = +id.slice(1);
      const tick = ok => ok ? '<span class="ok">✓</span>' : '<span class="go">' + G.icon('arrow').replace('<svg', '<svg width="18" height="18" style="stroke:currentColor;fill:none;stroke-width:2"') + '</span>';
      const meet = '<a class="act" href="#/batch/' + id + '/meet"><span class="em">🌱</span><span class="grow">' + esc(t('meet.cards.title')) + '</span><span class="pill">' + b.words.length + ' ' + esc(t('common.words')) + '</span>' + tick(p.meet[0] > 0) + '</a>';
      const use = [['pick', '🎯', p.pick[0] !== null], ['maker', '🧱', p.maker[0] > 0], ['bee', '🐝', p.bee[0] !== null]].map(([a, em, ok]) =>
        '<a class="act" href="#/batch/' + id + '/use/' + a + '"><span class="em">' + em + '</span><span class="grow">' + esc(t('act.' + a)) + '</span>' + tick(ok) + '</a>').join('');
      const article = '<a class="act" href="#/batch/' + id + '/story"><span class="em">📖</span><span class="grow">' + esc(b.stories[lv].parts[0].title) + '</span>' + tick(p.story[0] > 0) + '</a>';
      const mediaTile = (kind, icon) => {
        const url = G.mediaLink(id, lv, kind), ttl = t('media.' + kind), sub = t('media.' + kind + 'Sub');
        const body = '<span class="ic">' + G.icon(icon) + '</span><span class="grow"><b>' + esc(ttl) + '</b><small>' + esc(sub) + '</small></span>' + (url ? '<span class="go">' + G.icon('arrow') + '</span>' : '<span class="pill">' + esc(t('media.soon')) + '</span>');
        if (!url) return '<button class="mtile off" data-kind="' + kind + '" data-act="mediaSoon" aria-disabled="true">' + body + '</button>';
        return G.mediaEmbed(url)
          ? '<button class="mtile" data-kind="' + kind + '" data-b="' + id + '" data-act="mediaPlay" aria-expanded="false" aria-controls="mplay">' + body + '</button>'
          : '<a class="mtile" data-kind="' + kind + '" href="' + esc(url) + '" target="_blank" rel="noopener noreferrer" aria-label="' + esc(ttl + '. ' + sub + '. ' + t('media.newTab')) + '">' + body + '</a>';
      };
      const media = '<section class="glass card" data-level="' + lv + '"><h2>' + esc(t('media.title')) + '</h2><div class="mtiles" style="margin-top:14px">' + mediaTile('video', 'play') + mediaTile('talk', 'headphones') + '</div><div id="mplay" aria-live="polite"></div></section>';
      const words = b.words.map(w => '<button class="chip" data-peek="' + w.id + '" style="font-size:16px;min-height:42px;touch-action:auto">' + (w.emoji || '') + ' ' + esc(w.headword) + '</button>').join('');
      const inner = '<div class="hdr"><div><a class="sub" href="#/batches" style="font-weight:700">‹ ' + esc(t('nav.batches')) + '</a><h1>' + esc(t('batch.title', { n })) + '</h1><p class="sub">' + esc(t('batch.sub')) + '</p></div>' + G.starsHtml(id) + '</div>' +
        '<div class="glass card row between wrap" data-level="' + lv + '"><div class="stack tight grow" style="min-width:260px"><h2>' + esc(t('batch.level')) + '</h2>' + G.levelSeg() + '<span class="hint-text">' + esc(t('level.' + lv + '.d')) + '</span></div>' + zhSwitch() + '</div>' +
        media +
        '<div class="grid g3" data-level="' + lv + '">' +
        '<section class="glass station tint"><div class="num">1</div><div><h3>' + esc(t('station.meet')) + '</h3><div class="sub">' + esc(t('station.meet.d')) + '</div></div><div class="acts">' + meet + '</div></section>' +
        '<section class="glass station tint"><div class="num">2</div><div><h3>' + esc(t('station.use')) + '</h3><div class="sub">' + esc(t('station.use.d')) + ' ' + esc(t('use.sub')) + '</div></div><div class="acts">' + use + '</div></section>' +
        '<section class="glass station tint"><div class="num">3</div><div><h3>' + esc(t('station.story')) + '</h3><div class="sub">' + esc(t('station.story.d')) + '</div></div><div class="acts">' + article + '</div></section></div>' +
        '<section class="glass card"><h2>' + esc(t('batch.wordsIn')) + '</h2><div class="chips" style="margin-top:14px">' + words + '</div></section>';
      return G.page(inner, '#/batch/' + id);
    });
  });

  /* ---------- MEET: cards, match, build ---------- */
  G.route(/^#\/batch\/(b\d+)\/meet(?:\/[1-4])?$/, function (id) {
    return G.loadBatch(id).then(b => {
      const pg = playerPage(esc(t('station.meet')), '#/batch/' + id, '#/batch/' + id);
      pg.mount = root => meetFlow(root, b, b.words);
      return pg;
    });
  });

  /* Cards for all 20 words, then Match it (five words on screen at a time so it fits a phone, one count for the
     whole lesson), then Build it for all 20. */
  function meetFlow(root, b, ws) {
    const stage = G.$('#stage', root), lv = G.level(), ROUND = 5;
    let step = 0, card = 0, mround = 0, mdone = false, cleanupDnd = null;
    const toBuildBtn = () => '<button class="btn primary lg" data-act="toBuild">' + esc(t('meet.toBuild')) + G.icon('arrow') + '</button>';

    function cards() {
      setProg(0, 3);
      const w = ws[card];
      G.state.met[w.id] = 1; G.save();
      stage.innerHTML = '<div class="hint-text">' + esc(t('meet.cardOf', { n: card + 1, m: ws.length })) + ' · ' + esc(t('meet.tapHint')) + '</div>' +
        '<div class="glass wcard"><div class="emoji">' + (w.emoji || '') + '</div>' +
        '<div class="row"><button class="word" data-peek="' + w.id + '" style="font-size:46px;font-weight:800;letter-spacing:-.025em">' + esc(w.headword) + '</button><button class="iconbtn" data-act="say" data-say="' + esc(w.headword) + '" aria-label="' + esc(t('common.listen')) + '">' + G.icon('speaker') + '</button></div>' +
        '<div class="pos">' + esc(G.posName(w.pos)) + '</div><div class="def">' + esc(w.defEN) + '</div>' +
        (G.zhOn() ? '<div class="zh">' + esc(w.zhTW) + '</div>' : '') +
        '<div class="ex">' + G.exHtml(w.examples[lv], w.id) + ' <button class="iconbtn" style="width:36px;height:36px;vertical-align:middle" data-act="say" data-say="' + esc(G.exPlain(w.examples[lv])) + '" aria-label="' + esc(t('common.listen')) + '">' + G.icon('speaker') + '</button></div></div>' +
        '<div class="row">' + (card > 0 ? '<button class="btn ghost" data-act="cardPrev">' + G.icon('back') + esc(t('common.back')) + '</button>' : '') +
        '<button class="btn primary' + (card === ws.length - 1 ? ' lg' : '') + '" data-act="cardNext">' + esc(card === ws.length - 1 ? t('meet.toMatch') : t('common.next')) + G.icon('arrow') + '</button></div>';
    }
    G.acts.cardNext = () => { if (card < ws.length - 1) { card++; cards(); G.say(ws[card].headword); } else { step = 1; match(); } };
    G.acts.cardPrev = () => { if (card > 0) { card--; cards(); G.say(ws[card].headword); } };

    function match() {
      setProg(1, 3);
      const chunk = ws.slice(mround * ROUND, mround * ROUND + ROUND), left = G.shuffle(chunk), right = G.shuffle(chunk);
      stage.innerHTML = '<div class="row between wrap" style="width:100%"><h3>' + esc(t('match.title')) + '</h3><span class="hint-text" id="mc">' + esc(t('match.count', { n: mround * ROUND, m: ws.length })) + '</span></div><div class="match"><div class="col">' +
        left.map(w => '<button class="chip" data-w="' + w.id + '">' + (w.emoji || '') + ' ' + esc(w.headword) + '</button>').join('') + '</div><div class="col">' +
        right.map(w => '<div class="mean dz" data-w="' + w.id + '" role="button" tabindex="0" aria-label="' + esc(w.defEN) + '"><span>' + esc(w.defEN) + (G.zhOn() ? '<span class="zh">' + esc(w.zhTW) + '</span>' : '') + '</span><span class="slotfill"></span></div>').join('') + '</div></div>' +
        '<div class="hint-text" id="fb" style="min-height:22px"></div><div class="row" id="nx" style="justify-content:center"></div>';
      let matched = 0;
      const d = G.dnd.attach(stage, {
        chip: '.chip', zone: '.mean',
        onDrop: (chip, zone) => {
          const fb = G.$('#fb', stage);
          if (chip.dataset.w === zone.dataset.w) {
            zone.classList.add('done', 'locked'); G.$('.slotfill', zone).appendChild(chip); chip.classList.add('ok'); matched++;
            fb.textContent = t('fb.great'); G.$('#mc', stage).textContent = t('match.count', { n: mround * ROUND + matched, m: ws.length });
            if (matched === chunk.length) {
              if ((mround + 1) * ROUND < ws.length) { mround++; setTimeout(match, 700); }
              else { mdone = true; fb.textContent = t('match.great'); G.$('#nx', stage).innerHTML = toBuildBtn(); }
            }
          } else {
            zone.classList.add('shake'); chip.classList.add('shake'); fb.textContent = t('match.tryAnother');
            setTimeout(() => { zone.classList.remove('shake'); chip.classList.remove('shake'); }, 480);
          }
        }
      });
      cleanupDnd = d.clearSel;
    }

    function matchEnd() {
      setProg(1, 3);
      stage.innerHTML = '<div class="hint-text">' + esc(t('match.great')) + '</div><div class="row" style="justify-content:center">' + toBuildBtn() + '</div>';
    }
    G.acts.toBuild = () => { step = 2; build(); };

    function build() {
      setProg(2, 3);
      buildRound(stage, ws, {
        mode: 'build',
        onDone: () => {
          const p = G.pg(b.id, lv); p.meet[0] = 1; G.save();
          endLesson(stage, b, 'meet', t('meet.complete'), '🌟');
        }
      });
    }
    G.redraw = () => { if (step === 0) cards(); else if (step === 1) { if (mdone) matchEnd(); else match(); } };
    cards(); G.say(ws[0].headword);
  }

  /* ---------- BUILD IT and MISSING LETTERS (letter tiles) ---------- */
  function buildRound(stage, words, o) {
    const lv = G.level(), mode = o.mode || 'build';
    let i = 0, firstTry = 0, wrongThisWord = false, hint = lv !== 'advanced', locked = false;
    const decoys = mode === 'build' ? levelSupport() : 3;
    G.redraw = () => draw(true);

    function draw(keep) {
      const w = words[i], word = w.headword.toLowerCase(), letters = word.split('');
      if (!keep || !draw.cur || draw.cur.id !== w.id) {
        let blanks = letters.map((_, k) => k);
        if (mode === 'missing') {
          const nb = Math.min(letters.length - 1, { beginner: 1, intermediate: 2, advanced: 3 }[lv] + (letters.length > 6 ? 1 : 0));
          blanks = G.sample(letters.map((_, k) => k), Math.max(1, nb)).sort((a, b) => a - b);
        }
        const need = blanks.map(k => letters[k]);
        const abc = 'abcdefghijklmnopqrstuvwxyz'.split('').filter(c => letters.indexOf(c) < 0);
        const pool = need.concat(G.sample(abc, decoys));
        draw.cur = { id: w.id, blanks, letters, tiles: G.shuffle(pool.map((ch, n) => ({ ch, n }))) };
        wrongThisWord = false; locked = false;
      }
      const cur = draw.cur;
      setProg(i, words.length);
      const hintBlock = hint
        ? '<div class="bighint"><span class="e">' + (w.emoji || '') + '</span>' + (G.zhOn() ? esc(w.zhTW) : esc(w.defEN)) + '</div>'
        : '<div class="bighint"><span class="e">' + (w.emoji || '') + '</span><button class="btn sm ghost" data-act="bHint">' + G.icon('bulb') + esc(t('common.hint')) + '</button></div>';
      stage.innerHTML = '<div class="hint-text">' + esc(t(mode === 'build' ? 'build.title' : 'missing.title')) + ' · ' + (i + 1) + ' / ' + words.length + '</div>' + hintBlock +
        '<div class="row"><button class="btn ghost" data-act="say" data-say="' + esc(w.headword) + '">' + G.icon('speaker') + esc(t('common.listen')) + '</button></div>' +
        '<div class="slots" id="slots">' + cur.letters.map((ch, k) => cur.blanks.indexOf(k) >= 0
          ? '<div class="slot dz" data-k="' + k + '" role="button" tabindex="0" aria-label="letter ' + (k + 1) + '"></div>'
          : '<div class="slot right" style="border-style:solid">' + esc(ch) + '</div>').join('') + '</div>' +
        '<div class="tiles" id="tiles">' + cur.tiles.map(x => '<button class="chip tile" data-n="' + x.n + '" data-ch="' + x.ch + '">' + x.ch + '</button>').join('') + '</div>' +
        '<div class="hint-text" id="fb" style="min-height:22px"></div><div class="row" id="nx"></div>';
      const tray = G.$('#tiles', stage);
      G.dnd.attach(stage, {
        chip: '.tile', zone: '.slot.dz',
        tapPlace: chip => chip.parentElement === tray ? G.$$('.slot.dz', stage).find(s => !s.querySelector('.chip') && !s.classList.contains('locked')) || null : null,
        onTap: chip => { if (chip.parentElement.classList.contains('slot')) { tray.appendChild(chip); refreshSlots(); return true; } return false; },
        canDrag: () => !locked,
        onDrop: (chip, zone) => {
          const old = zone.querySelector('.chip'); if (old && old !== chip) tray.appendChild(old);
          zone.classList.remove('wrong'); zone.appendChild(chip); refreshSlots(); evaluate();
        }
      });
    }
    function refreshSlots() { G.$$('.slot.dz', stage).forEach(s => { if (!s.querySelector('.chip')) s.classList.remove('wrong'); }); }
    G.acts.bHint = () => { hint = true; draw(true); };

    function evaluate() {
      const cur = draw.cur, slots = G.$$('.slot.dz', stage);
      if (slots.some(s => !s.querySelector('.chip'))) return;
      const ok = slots.every(s => s.querySelector('.chip').dataset.ch === cur.letters[+s.dataset.k]);
      const fb = G.$('#fb', stage);
      if (ok) {
        locked = true;
        slots.forEach(s => { s.classList.add('right', 'locked'); s.querySelector('.chip').classList.add('ok'); });
        fb.textContent = t('build.great'); if (!wrongThisWord) firstTry++;
        G.say(words[i].headword);
        const last = i === words.length - 1;
        G.$('#nx', stage).innerHTML = '<button class="btn primary" data-act="bNext">' + esc(last ? t(o.lastLabel || 'finish.last') : t('build.next')) + G.icon('arrow') + '</button>';
      } else {
        wrongThisWord = true; fb.textContent = t('build.almost');
        slots.forEach(s => { if (s.querySelector('.chip').dataset.ch !== cur.letters[+s.dataset.k]) { s.classList.add('wrong', 'shake'); } });
        setTimeout(() => {
          const tray = G.$('#tiles', stage); if (!tray) return;
          G.$$('.slot.wrong', stage).forEach(s => { const c = s.querySelector('.chip'); if (c) tray.appendChild(c); s.classList.remove('wrong', 'shake'); });
        }, 800);
      }
    }
    G.acts.bNext = () => {
      if (i < words.length - 1) { i++; draw(false); G.say(words[i].headword); } else o.onDone(firstTry, words.length);
    };
    draw(false); G.say(words[0].headword);
  }

  /* ---------- USE: pick, maker, bee (all 20 words each) ---------- */
  G.route(/^#\/batch\/(b\d+)\/use\/(pick|maker|bee)(?:\/[12])?$/, function (id, act) {
    return G.loadBatch(id).then(b => {
      const pg = playerPage(esc(t('station.use')) + ' · ' + esc(t('act.' + act)), '#/batch/' + id, '#/batch/' + id);
      pg.mount = root => {
        const stage = G.$('#stage', root), ws = b.words, lv = G.level();
        const done = (score, total) => {
          const p = G.pg(id, lv);
          if (act === 'pick') p.pick[0] = score; else if (act === 'maker') p.maker[0] = Math.max(1, score); else p.bee[0] = score;
          G.save();
          endLesson(stage, b, act, act === 'maker' ? t('maker.done') : t('pick.score', { n: score, m: total }), '🎯');
        };
        if (act === 'pick') pickRound(stage, b, ws, done);
        else if (act === 'maker') makerRound(stage, ws, done);
        else beeRound(stage, ws, done);
      };
      return pg;
    });
  });

  function pickRound(stage, b, words, onDone) {
    const lv = G.level(), order = G.shuffle(words);
    let i = 0, score = 0, tries = 0;
    function draw() {
      const w = order[i], ex = w.examples[lv];
      const m = ex.match(/^(.*)\{([^{}]+)\}(.*)$/), form = m[2];
      const opts = G.shuffle([w.headword].concat(w.pick[lv]));
      setProg(i, order.length); tries = 0;
      stage.innerHTML = '<div class="hint-text">' + esc(t('pick.title')) + ' · ' + (i + 1) + ' / ' + order.length + '</div>' +
        '<div class="sentence">' + esc(m[1]) + '<span class="gap dz" id="gap" role="button" tabindex="0" aria-label="gap">?</span>' + esc(m[3]) + '</div>' +
        '<div class="bank">' + opts.map(h => { const ow = byHead(b, h); return '<button class="chip' + (G.zhOn() ? ' zhline' : '') + '" data-h="' + esc(h) + '">' + esc(h) + (G.zhOn() ? '<small>' + esc(ow.zhTW) + '</small>' : '') + '</button>'; }).join('') + '</div>' +
        '<div class="hint-text" id="fb" style="min-height:22px"></div><div class="row" id="nx"></div>';
      const gap = G.$('#gap', stage);
      G.dnd.attach(stage, {
        chip: '.chip', zone: '.gap',
        tapPlace: () => gap.classList.contains('locked') ? null : gap,
        onDrop: chip => {
          const fb = G.$('#fb', stage);
          if (chip.dataset.h === w.headword) {
            gap.classList.add('filled', 'right', 'locked'); gap.textContent = form;
            fb.textContent = t('pick.great'); if (tries === 0) score++;
            G.$$('.chip', stage).forEach(c => c.classList.add('used'));
            G.say(G.exPlain(ex));
            finish();
          } else {
            tries++; chip.classList.add('shake'); setTimeout(() => chip.classList.remove('shake'), 480);
            fb.textContent = t('bee.tryAnother');
            if (tries >= 2) {
              gap.classList.add('filled', 'reveal', 'locked'); gap.textContent = form; fb.textContent = t('pick.reveal');
              G.$$('.chip', stage).forEach(c => c.classList.add('used')); finish();
            }
          }
        }
      });
    }
    function finish() {
      G.$('#nx', stage).innerHTML = '<button class="btn primary" data-act="pNext">' + esc(i === order.length - 1 ? t('finish.seeScore') : t('pick.next')) + G.icon('arrow') + '</button>';
    }
    G.acts.pNext = () => { if (i < order.length - 1) { i++; draw(); } else onDone(score, order.length); };
    G.redraw = draw; draw();
  }

  const ASSEMBLE = tiles => {
    let s = tiles.join(' ').trim().replace(/\s+([,.!?])/g, '$1');
    if (s && s[0] === s[0].toLowerCase()) s = s[0].toUpperCase() + s.slice(1);
    if (s && !/[.!?]$/.test(s)) s += '.';
    return s;
  };
  function makerRound(stage, words, onDone) {
    const lv = G.level();
    let i = 0, picks = [], saved = false;
    function draw() {
      const w = words[i], rows = w.frames[lv].rows;
      picks = rows.map(() => -1); saved = false; setProg(i, words.length);
      stage.innerHTML = '<div class="hint-text">' + esc(t('maker.title')) + ' · ' + (i + 1) + ' / ' + words.length + '</div>' +
        '<div class="row"><span class="chip" style="cursor:default;touch-action:auto" data-peek="' + w.id + '">' + (w.emoji || '') + ' ' + esc(w.headword) + '</span><span class="hint-text">' + esc(t('maker.sub')) + '</span></div>' +
        '<div class="preview" id="pv"><span class="ph">' + esc(t('maker.placeholder')) + '</span></div>' +
        '<div class="maker">' + rows.map((r, ri) => '<div class="row3"><div class="rlabel">' + esc(t('maker.' + r.label)) + '</div><div class="rtiles">' +
          r.tiles.map((tile, ti) => '<button class="mt' + (r.target ? ' tgt' : '') + '" data-r="' + ri + '" data-t="' + ti + '" aria-pressed="false">' + esc(tile) + '</button>').join('') + '</div></div>').join('') + '</div>' +
        '<div class="row wrap" id="nx" style="justify-content:center"></div>';
      G.$$('.mt', stage).forEach(btn => btn.addEventListener('click', () => {
        const ri = +btn.dataset.r, ti = +btn.dataset.t; picks[ri] = ti;
        G.$$('.mt[data-r="' + ri + '"]', stage).forEach(x => { const on = +x.dataset.t === ti; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
        const chosen = picks.map((p, k) => p >= 0 ? rows[k].tiles[p] : null);
        const pv = G.$('#pv', stage);
        if (chosen.every(Boolean)) {
          const text = ASSEMBLE(chosen); pv.classList.add('done'); pv.textContent = text; draw.text = text;
          G.$('#nx', stage).innerHTML = '<button class="btn ghost" data-act="say" data-say="' + esc(text) + '">' + G.icon('speaker') + esc(t('common.listen')) + '</button>' +
            '<button class="btn ghost" data-act="mSave">' + G.icon('star') + esc(t('maker.save')) + '</button>' +
            '<button class="btn primary" data-act="mNext">' + esc(i === words.length - 1 ? t('finish.last') : t('maker.next')) + G.icon('arrow') + '</button>';
        } else {
          pv.classList.remove('done');
          pv.innerHTML = chosen.some(Boolean) ? esc(ASSEMBLE(chosen.map(x => x || '…'))) : '<span class="ph">' + esc(t('maker.placeholder')) + '</span>';
          G.$('#nx', stage).innerHTML = '';
        }
      }));
    }
    G.acts.mSave = () => {
      if (saved) return; saved = true;
      G.state.sentences.push({ w: words[i].headword, level: lv, text: draw.text, at: G.today() }); G.save();
      G.toast(t('maker.saved'));
    };
    G.acts.mNext = () => { if (i < words.length - 1) { i++; draw(); } else onDone(words.length, words.length); };
    G.redraw = null; draw();
  }

  function beeRound(stage, words, onDone) {
    const lv = G.level(), order = G.shuffle(words);
    let i = 0, score = 0, tries = 0, hint = lv !== 'advanced';
    function draw() {
      const w = order[i]; tries = 0; setProg(i, order.length);
      const opts = G.shuffle([w.headword].concat(w.confusable.slice(0, 2)));
      stage.innerHTML = '<div class="hint-text">' + esc(t('bee.title')) + ' · ' + (i + 1) + ' / ' + order.length + '</div>' +
        '<div class="bighint"><span class="e">' + (w.emoji || '') + '</span>' + (hint ? (G.zhOn() ? esc(w.zhTW) : esc(w.defEN)) : '<button class="btn sm ghost" data-act="beeHint">' + G.icon('bulb') + esc(t('common.hint')) + '</button>') + '</div>' +
        '<button class="btn primary" data-act="say" data-say="' + esc(w.headword) + '">' + G.icon('speaker') + esc(t('common.listen')) + '</button>' +
        '<div class="opts" style="grid-template-columns:repeat(' + opts.length + ',1fr);max-width:640px">' + opts.map(o => '<button class="opt" data-o="' + esc(o) + '">' + esc(o) + '</button>').join('') + '</div>' +
        '<div class="hint-text" id="fb" style="min-height:22px"></div><div class="row" id="nx"></div>';
      G.$$('.opt', stage).forEach(btn => btn.addEventListener('click', () => {
        if (btn.classList.contains('right')) return;
        const fb = G.$('#fb', stage);
        if (btn.dataset.o === w.headword) {
          btn.classList.add('right'); G.$$('.opt', stage).forEach(x => { x.disabled = true; }); fb.textContent = t('bee.great');
          if (tries === 0) score++; G.say(w.headword);
          G.$('#nx', stage).innerHTML = '<button class="btn primary" data-act="beeNext">' + esc(i === order.length - 1 ? t('finish.seeScore') : t('build.next')) + G.icon('arrow') + '</button>';
        } else { tries++; btn.classList.add('wrong', 'shake'); fb.textContent = t('bee.tryAnother'); setTimeout(() => btn.classList.remove('shake'), 480); }
      }));
      G.say(w.headword);
    }
    G.acts.beeHint = () => { hint = true; draw(); };
    G.acts.beeNext = () => { if (i < order.length - 1) { i++; draw(); } else onDone(score, order.length); };
    G.redraw = draw; draw();
  }

  /* ---------- ARTICLE: drag each of the 20 words into its gap ---------- */
  G.route(/^#\/batch\/(b\d+)\/story(?:\/[12])?$/, function (id) {
    return G.loadBatch(id).then(b => {
      const lv = G.level();
      const pg = playerPage(esc(t('station.story')), '#/batch/' + id, '#/batch/' + id);
      pg.mount = root => storyPart(G.$('#stage', root), b, lv);
      return pg;
    });
  });

  function storyPart(stage, b, lv) {
    const data = b.stories[lv].parts[0], gaps = data.gaps;
    const wordOf = id => b.words.find(w => w.id === id);
    const tries = gaps.map(() => 0), state = { done: false };
    const pieces = data.text.split(/(\[\[\d+\]\])/);
    let bankOrder = G.shuffle(gaps.map((g, k) => k));

    function draw() {
      setProg(0, 1);
      const body = pieces.map(p => { const m = p.match(/^\[\[(\d+)\]\]$/); return m ? '<span class="gap dz" data-g="' + (m[1] - 1) + '" role="button" tabindex="0" aria-label="' + esc(t('story.gapN', { n: m[1] })) + '"><span class="n">' + m[1] + '</span></span>' : esc(p); }).join('');
      stage.innerHTML = '<div class="row between wrap" style="width:100%"><h3>' + esc(data.title) + '</h3><span class="hint-text">' + esc(t('story.sub')) + '</span></div>' +
        '<div class="story" id="story">' + body + '</div>' +
        '<div class="hint-text">' + esc(t('story.bank')) + '</div>' +
        '<div class="bank sticky" id="bank">' + bankOrder.map(k => chipHtml(k)).join('') + '</div>' +
        '<div class="hint-text" id="fb" style="min-height:22px"></div><div class="row wrap" id="nx" style="justify-content:center"><button class="btn primary" data-act="sCheck">' + G.icon('check') + esc(t('common.check')) + '</button></div>';
      const bank = G.$('#bank', stage);
      const d = G.dnd.attach(stage, {
        chip: '.chip', zone: '.gap',
        onTap: chip => { if (chip.parentElement.classList.contains('gap') && !chip.classList.contains('ok')) { bank.appendChild(chip); sync(); return true; } return false; },
        onDrop: (chip, gap) => {
          if (gap.classList.contains('locked')) return;
          const old = gap.querySelector('.chip'); if (old && old !== chip) bank.appendChild(old);
          gap.classList.remove('wrong'); gap.appendChild(chip); gap.classList.add('filled'); sync();
        }
      });
      if (!stage.__dbl) { stage.__dbl = true; chip_dblclick(); }
    }
    function chipHtml(k) {
      const g = gaps[k], w = wordOf(g.w);
      return '<button class="chip' + (G.zhOn() ? ' zhline' : '') + '" data-k="' + k + '" data-w="' + g.w + '">' + esc(g.form) + (G.zhOn() ? '<small>' + esc(w.zhTW) + '</small>' : '') + '</button>';
    }
    function sync() { G.$$('.gap', stage).forEach(g => { const has = !!g.querySelector('.chip'); g.classList.toggle('filled', has); if (!has) g.classList.remove('wrong'); }); }
    function chip_dblclick() { stage.addEventListener('dblclick', e => { const c = e.target.closest('.chip'); if (c && c.dataset.w) G.peek(c.dataset.w, c); }); }

    G.acts.sCheck = () => {
      const gs = G.$$('.gap', stage), bank = G.$('#bank', stage), fb = G.$('#fb', stage);
      let right = 0, wrongGaps = [];
      gs.forEach(g => {
        const k = +g.dataset.g, chip = g.querySelector('.chip');
        if (g.classList.contains('locked')) { right++; return; }
        if (!chip) return;
        if (+chip.dataset.k === k) { g.classList.add('right', 'locked'); g.classList.remove('wrong'); chip.classList.add('ok'); right++; }
        else { g.classList.add('wrong', 'shake'); tries[k]++; wrongGaps.push(g); }
      });
      if (right === gs.length) return complete();
      fb.textContent = t('story.keepGoing', { n: right });
      setTimeout(() => {
        wrongGaps.forEach(g => { const c = g.querySelector('.chip'); if (c) bank.appendChild(c); g.classList.remove('wrong', 'shake'); g.classList.remove('filled'); });
        let revealed = false;
        gs.forEach(g => {
          const k = +g.dataset.g;
          if (!g.classList.contains('locked') && tries[k] >= 2) {
            const chip = G.$('.chip[data-k="' + k + '"]', stage);
            if (chip) { g.appendChild(chip); g.classList.add('filled', 'reveal', 'locked'); chip.classList.add('ok'); revealed = true; }
          }
        });
        if (revealed) fb.textContent = t('story.showAnswer');
        if (G.$$('.gap.locked', stage).length === gs.length) complete();
      }, 1000);
    };
    function complete() {
      if (state.done) return; state.done = true;
      const p = G.pg(b.id, lv); p.story[0] = 1; G.save();
      G.$$('.gap .chip', stage).forEach(c => { c.classList.add('ok'); c.setAttribute('data-peek', c.dataset.w); });
      const fb = G.$('#fb', stage); fb.textContent = G.$$('.gap.reveal', stage).length ? t('story.showAnswer') : t('story.allCorrect');
      const full = pieces.map(x => { const m = x.match(/^\[\[(\d+)\]\]$/); return m ? gaps[m[1] - 1].form : x; }).join('');
      const star = G.hasStar(b.id, lv);
      const e = lessonEnd(b, 'story');
      G.$('#nx', stage).innerHTML = '<button class="btn ghost" data-act="say" data-say="' + esc(full) + '">' + G.icon('speaker') + esc(t('story.readAgain')) + '</button>' +
        '<div class="hint-text" style="flex-basis:100%">' + esc(e.complete || e.count) + '</div>' + finishHtml(e);
      if (star) { fb.textContent += ' ⭐ ' + t('story.starEarned'); }
      G.confetti(); G.touchStreak();
      try { G.$('#nx .btn.primary', stage).scrollIntoView({ block: 'nearest', behavior: 'smooth' }); } catch (err) { /* older browsers */ }
    }
    G.redraw = () => { if (!state.done) { const keep = G.$$('.gap.locked', stage).length === 0; if (keep) draw(); } };
    draw();
  }

  /* ---------- GAMES: letter tiles, missing letters, spelling bee on the current lesson ---------- */
  G.route(/^#\/play\/(build|missing|bee)\/(b\d+)(?:\/[12])?$/, function (act, id) {
    return G.loadBatch(id).then(b => {
      const pg = playerPage(esc(t('games.title')) + ' · ' + esc(t('act.' + act)), '#/games', '#/games');
      pg.mount = root => {
        const stage = G.$('#stage', root), ws = b.words, lv = G.level();
        const done = (score, total) => {
          const p = G.pg(id, lv); p[act][0] = score; G.save();
          finishCard(stage, { emoji: '🏆', title: t('pick.score', { n: score, m: total }), primary: { label: t('finish.games'), href: '#/games' }, what: t('games.sub'), alts: [{ label: t('finish.gameAgain'), act: 'replay' }] });
        };
        if (act === 'bee') beeRound(stage, ws, done); else buildRound(stage, ws, { mode: act, onDone: done, lastLabel: 'finish.seeScore' });
      };
      return pg;
    });
  });
})(window.G = window.G || {});
