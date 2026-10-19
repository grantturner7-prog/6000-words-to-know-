/* Core: helpers, saved state, theme, speech, data loading, router, Word Peek popover, toasts. */
(function (G) {
  'use strict';
  const KEY = 'genesis6000.v1';
  const LEVELS = ['beginner', 'intermediate', 'advanced'];

  G.LEVELS = LEVELS;
  G.$ = (s, r) => (r || document).querySelector(s);
  G.$$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  G.esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  G.shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; } return r; };
  G.sample = (a, n) => G.shuffle(a).slice(0, n);
  G.cap = s => s.charAt(0).toUpperCase() + s.slice(1);

  /* ---------- icons (stroke style, same family as the IELTS app) ---------- */
  const IC = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
    game: '<rect x="2" y="7" width="20" height="11" rx="5"/><path d="M7 10v5M4.5 12.5h5"/><circle cx="16" cy="11.5" r="1"/><circle cx="18.5" cy="14" r="1"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2-1.2L14 3h-4l-.6 2.6a7 7 0 0 0-2 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9a7 7 0 0 0 2 1.2L10 21h4l.6-2.6a7 7 0 0 0 2-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z"/>',
    speaker: '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="3"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z"/>',
    book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
    refresh: '<path d="M20 11a8 8 0 1 0 .5 3"/><path d="M20 4v7h-7"/>'
  };
  G.icon = n => '<svg viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || '') + '</svg>';

  /* ---------- saved state (this device only) ---------- */
  function defaults() {
    return {
      v: 1, profile: null,
      prefs: { theme: 'auto', lang: ((navigator.language || '').toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en'), zh: true, sound: true, motion: true, level: 'beginner', stage: 1, batch: 'b001', voice: '', pace: 'normal' },
      progress: {}, sentences: [], met: {}, streak: { last: null, count: 0 }
    };
  }
  function load() {
    const d = defaults();
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const s = JSON.parse(raw);
        return Object.assign(d, s, { prefs: Object.assign(d.prefs, s.prefs || {}) });
      }
    } catch (e) { /* private mode or blocked storage: keep going in memory */ }
    return d;
  }
  G.state = load();
  G.save = function () { try { localStorage.setItem(KEY, JSON.stringify(G.state)); } catch (e) { /* ignore */ } };
  G.level = () => G.state.prefs.level;
  G.zhOn = () => !!G.state.prefs.zh;

  G.pg = function (batch, level) {
    const p = (G.state.progress[batch] = G.state.progress[batch] || {});
    return (p[level] = p[level] || { meet: [0, 0, 0, 0], pick: [null, null], maker: [0, 0], bee: [null, null], build: [null, null], missing: [null, null], story: [0, 0] });
  };
  G.hasStar = (batch, level) => { const p = G.state.progress[batch] && G.state.progress[batch][level]; return !!(p && p.story[0] && p.story[1]); };
  G.starCount = () => Object.keys(G.state.progress).reduce((n, b) => n + LEVELS.filter(l => G.hasStar(b, l)).length, 0);
  G.metCount = () => Object.keys(G.state.met).length;
  G.today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  G.touchStreak = function () {
    const s = G.state.streak, t = G.today();
    if (s.last === t) return;
    const y = new Date(); y.setDate(y.getDate() - 1);
    const ys = y.getFullYear() + '-' + String(y.getMonth() + 1).padStart(2, '0') + '-' + String(y.getDate()).padStart(2, '0');
    s.count = (s.last === ys) ? s.count + 1 : 1; s.last = t; G.save();
  };

  /* ---------- theme and motion ---------- */
  G.applyTheme = function () {
    const p = G.state.prefs, root = document.documentElement;
    const dark = p.theme === 'dark' || (p.theme === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    root.setAttribute('data-motion', p.motion ? 'on' : 'off');
    root.setAttribute('lang', p.lang === 'zh' ? 'zh-Hant' : 'en');
    const m = document.querySelector('meta[name=theme-color]'); if (m) m.setAttribute('content', dark ? '#0c1236' : '#eef1ff');
  };
  if (window.matchMedia) {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    (mq.addEventListener ? mq.addEventListener.bind(mq, 'change') : mq.addListener.bind(mq))(() => G.applyTheme());
  }

  /* ---------- speech ----------
     The voices come from the student's device. We rank them so the most natural one is used
     (neural / "Natural" / Premium / Enhanced voices first, novelty and old desktop voices last),
     and Settings lets a student pick another and hear it. */
  const NOVELTY = /\b(albert|bad news|bahh|bells|boing|bubbles|cellos|deranged|fred|good news|hysterical|jester|junior|kathy|organ|princess|ralph|superstar|trinoids|whisper|wobble|zarvox)\b|espeak|desktop|compact/i;
  const WELL_KNOWN = /\b(samantha|ava|allison|nicky|zoe|evan|aaron|jenny|aria|guy|michelle|emma|ana|brian|ryan|sonia|libby|natasha|clara|serena|daniel|karen|moira)\b/i;
  G.scoreVoice = function (v) {
    const lang = String(v.lang || '').replace('_', '-'), name = String(v.name || '');
    let s;
    if (/^en-US/i.test(lang)) s = 30; else if (/^en-(GB|AU|CA|IE|IN|ZA|NZ)/i.test(lang)) s = 14; else if (/^en/i.test(lang)) s = 8; else return null;
    if (/natural|neural|online/i.test(name)) s += 100;
    if (/premium|enhanced|siri/i.test(name)) s += 80;
    if (/google/i.test(name)) s += 45;
    if (WELL_KNOWN.test(name)) s += 20;
    if (v.localService === false) s += 10;
    if (NOVELTY.test(name)) s -= 200;
    return s;
  };
  G.rankVoices = list => list.map(v => [G.scoreVoice(v), v]).filter(x => x[0] !== null).sort((a, b) => b[0] - a[0]).map(x => x[1]);
  let voices = [];
  function loadVoices() { voices = ('speechSynthesis' in window) ? G.rankVoices(speechSynthesis.getVoices()) : []; }
  G.voices = () => voices;
  G.voice = function () {
    const want = G.state && G.state.prefs && G.state.prefs.voice;
    return (want && voices.find(v => v.voiceURI === want)) || voices[0] || null;
  };
  if ('speechSynthesis' in window) { loadVoices(); speechSynthesis.onvoiceschanged = loadVoices; }
  /* Recorded or neural audio: audio/index.json maps a spoken text (lower case) to a clip file.
     A clip is played when one exists; otherwise the device voice speaks. See audio/README.md. */
  G.clips = {};
  const clipKey = t => String(t).replace(/[{}[\]]/g, '').replace(/_+/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const clipUrl = c => /^(https?:|data:|blob:)/.test(c) ? c : (window.G_INLINE ? 'audio/' : '../audio/') + c;
  let clipAudio = null;
  function speakWithVoice(text) {
    if (!('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(String(text).replace(/[{}[\]]/g, '').replace(/_+/g, ' ')), v = G.voice();
      u.lang = v ? v.lang : 'en-US'; u.rate = G.state.prefs.pace === 'slow' ? 0.72 : 0.95; if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { /* ignore */ }
  }
  G.say = function (text, explicit) {
    if (!G.state.prefs.sound) { if (explicit) G.toast(G.t('sound.off')); return; }
    const clip = G.clips[clipKey(text)];
    if (clip && typeof Audio !== 'undefined') {
      try {
        if (clipAudio) clipAudio.pause();
        if ('speechSynthesis' in window) speechSynthesis.cancel();
        clipAudio = new Audio(clipUrl(clip)); clipAudio.playbackRate = G.state.prefs.pace === 'slow' ? 0.8 : 1;
        const p = clipAudio.play(); if (p && p.catch) p.catch(() => speakWithVoice(text));
        return;
      } catch (e) { /* fall back to the device voice */ }
    }
    speakWithVoice(text);
  };

  /* ---------- data ---------- */
  G.data = { plan: null, batches: {} };
  const URLS = { batches: '../content/batches.json' };
  G.loadJSON = function (name, url) {
    if (window.G_INLINE && window.G_INLINE[name]) return Promise.resolve(window.G_INLINE[name]);
    return fetch(url || URLS[name]).then(r => { if (!r.ok) throw new Error(name + ' ' + r.status); return r.json(); });
  };
  G.loadBatch = function (id) {
    if (G.data.batches[id]) return Promise.resolve(G.data.batches[id]);
    return G.loadJSON(id, '../content/batches/' + id + '.json').then(b => { G.data.batches[id] = b; return b; });
  };
  G.boot = () => G.loadJSON('batches').then(p => { G.data.plan = p; return G.loadJSON('audio', '../audio/index.json').then(c => { G.clips = c || {}; }, () => {}); });
  G.isBuilt = id => G.builtList().indexOf(id) >= 0;
  G.builtIds = ['b001', 'b002'];   /* batches written and playable; the single-file build lists whatever it inlines */
  G.builtList = () => (window.G_INLINE ? Object.keys(window.G_INLINE).filter(k => /^b\d+$/.test(k)).sort() : G.builtIds);
  /* the batch the student is working on: their choice if it is playable, else the first one */
  G.curBatch = () => { const l = G.builtList(), b = G.state.prefs.batch; return l.indexOf(b) >= 0 ? b : l[0]; };
  G.batchNo = id => +String(id).slice(1);
  G.word = function (id) {
    for (const b of Object.values(G.data.batches)) { const w = b.words.find(x => x.id === id); if (w) return w; }
    return null;
  };

  /* ---------- text helpers ---------- */
  G.posName = pos => G.t('role.' + ({ n: 'noun', v: 'verb', adj: 'adj', adv: 'adv', prep: 'prep', conj: 'conj' }[pos] || 'noun'));
  /* "She {held} the baby." -> sentence with the target highlighted and tappable */
  G.exHtml = function (text, wid) {
    return G.esc(text).replace(/\{([^{}]+)\}/g, (_, f) => '<span class="hl" role="button" tabindex="0" data-peek="' + wid + '">' + f + '</span>');
  };
  G.exPlain = text => String(text).replace(/[{}]/g, '');
  G.gapId = (w, form) => form;

  /* ---------- toast and confetti ---------- */
  G.toast = function (msg) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; box.className = 'toasts'; box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const el = document.createElement('div'); el.className = 'toast glass'; el.textContent = msg; box.appendChild(el);
    setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 320); }, 2200);
  };
  G.confetti = function () {
    if (!G.state.prefs.motion) return;
    const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
    const cols = ['#2ee6c5', '#ffb454', '#b9a2ff', '#4da3ff', '#ff7ad9', '#41e08a'];
    for (let i = 0; i < 46; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + 'vw'; p.style.background = cols[i % cols.length];
      p.style.animationDelay = (Math.random() * 0.6) + 's'; p.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
      p.style.transform = 'rotate(' + Math.random() * 360 + 'deg)'; box.appendChild(p);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 3800);
  };

  /* ---------- Word Peek: tap a word, see its meaning ---------- */
  G.peek = function (wid, anchor) {
    const w = G.word(wid); if (!w) return;
    let el = document.getElementById('pop');
    if (!el) { el = document.createElement('div'); el.id = 'pop'; el.className = 'peek glass'; document.body.appendChild(el); }
    el.hidden = false;
    el.setAttribute('data-level', G.level());
    el.innerHTML = '<button class="iconbtn px" data-act="peekClose" aria-label="' + G.esc(G.t('common.close')) + '">' + G.icon('x') + '</button>' +
      '<div class="row" style="gap:10px"><span style="font-size:34px">' + (w.emoji || '') + '</span><div><div class="pw">' + G.esc(w.headword) + '</div><span class="pill">' + G.esc(G.posName(w.pos)) + '</span></div></div>' +
      '<div class="pd">' + G.esc(w.defEN) + '</div>' +
      (G.zhOn() ? '<div class="pz">' + G.esc(w.zhTW) + '</div>' : '<div class="hint-text" style="margin-top:8px">' + G.esc(G.t('peek.chineseOff')) + '</div>') +
      '<div class="row" style="margin-top:14px"><button class="btn sm ghost" data-act="say" data-say="' + G.esc(w.headword) + '">' + G.icon('speaker') + G.esc(G.t('peek.listen')) + '</button></div>';
    if (anchor && window.innerWidth > 640) {
      const r = anchor.getBoundingClientRect();
      let left = Math.min(Math.max(12, r.left + r.width / 2 - 170), window.innerWidth - 352);
      let top = r.bottom + 12; if (top + 210 > window.innerHeight) top = Math.max(12, r.top - 222);
      el.style.left = left + 'px'; el.style.top = top + 'px';
    }
    G.say(w.headword);
    G.state.met[w.id] = 1; G.save();
  };
  G.peekClose = function () { const el = document.getElementById('pop'); if (el) el.hidden = true; };

  /* ---------- global actions and events ---------- */
  G.acts = {};
  G.acts.peekClose = () => G.peekClose();
  G.acts.say = el => G.say(el.getAttribute('data-say'), true);
  G.acts.go = el => { location.hash = el.getAttribute('data-go'); };
  document.addEventListener('click', function (e) {
    const peek = e.target.closest('[data-peek]');
    if (peek) { e.preventDefault(); G.peek(peek.getAttribute('data-peek'), peek); return; }
    const act = e.target.closest('[data-act]');
    if (act && G.acts[act.getAttribute('data-act')]) { G.acts[act.getAttribute('data-act')](act, e); return; }
    if (!e.target.closest('#pop')) G.peekClose();
  });
  document.addEventListener('change', function (e) {
    const el = e.target.closest && e.target.closest('[data-change]');
    if (el && G.acts[el.getAttribute('data-change')]) G.acts[el.getAttribute('data-change')](el);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') G.peekClose();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[data-peek]')) { e.preventDefault(); G.peek(e.target.getAttribute('data-peek'), e.target); }
  });

  /* ---------- router ---------- */
  const routes = [];
  G.route = (re, fn) => routes.push([re, fn]);
  G.current = null;
  G.cleanups = []; G.redraw = null;
  G.onLeave = fn => { G.cleanups.push(fn); };
  G.render = function () {
    const app = document.getElementById('app'); if (!app) return;
    G.peekClose();
    G.cleanups.splice(0).forEach(f => { try { f(); } catch (e) { /* ignore */ } });
    G.redraw = null;
    let hash = location.hash || '#/today';
    if (!G.state.profile && hash !== '#/welcome') { location.hash = '#/welcome'; return; }
    if (G.state.profile && hash === '#/welcome') { location.hash = '#/today'; return; }
    for (const [re, fn] of routes) {
      const m = hash.match(re);
      if (m) {
        G.current = hash;
        Promise.resolve(fn.apply(null, m.slice(1))).then(v => {
          if (G.current !== hash) return;
          app.innerHTML = v.html; window.scrollTo(0, 0);
          if (v.mount) v.mount(app);
        }).catch(err => { console.error(err); app.innerHTML = '<div class="welcome"><div class="glass card hero"><h3>' + G.esc(G.t('err.load')) + '</h3></div></div>'; });
        return;
      }
    }
    location.hash = '#/today';
  };
  window.addEventListener('hashchange', G.render);

  /* ---------- shell: sidebar on large screens, floating tab bar on phones ---------- */
  const NAV = [['#/today', 'nav.today', 'home', /^#\/(today)/], ['#/batches', 'nav.batches', 'grid', /^#\/(batches|batch)/], ['#/games', 'nav.games', 'game', /^#\/(games|play)/], ['#/progress', 'nav.progress', 'chart', /^#\/progress/]];
  G.shell = function (inner, hash) {
    const lv = G.level();
    const items = NAV.map(([h, k, ic, re]) => {
      const on = re.test(hash) ? ' on' : '';
      return { h, k, ic, on };
    });
    const side = items.map(i => '<a class="nav' + i.on + '" href="' + i.h + '"' + (i.on ? ' aria-current="page"' : '') + '>' + G.icon(i.ic) + '<span>' + G.esc(G.t(i.k)) + '</span></a>').join('');
    const tabs = items.map(i => '<a class="tab' + i.on + '" href="' + i.h + '">' + G.icon(i.ic) + '<span>' + G.esc(G.t(i.k)) + '</span></a>').join('');
    const name = G.state.profile ? G.state.profile.name : '';
    return '<div class="shell" data-level="' + lv + '">' +
      '<aside class="side glass"><div class="brand"><div class="mk">6K</div><div><b>Genesis</b><small>' + G.esc(G.t('app.words')) + '</small></div></div>' + side +
      '<div class="who"><div class="row"><span class="mk" style="width:34px;height:34px;border-radius:12px;font-size:14px">' + G.esc((name[0] || '?').toUpperCase()) + '</span><b class="grow" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + G.esc(name) + '</b></div>' +
      '<button class="btn sm ghost block" data-act="openSettings">' + G.icon('gear') + G.esc(G.t('nav.account')) + '</button></div></aside>' +
      '<main class="main"><div class="mobhdr"><div class="row"><div class="mk" style="width:38px;height:38px;border-radius:12px">6K</div><b>' + G.esc(G.t('app.short')) + '</b></div><button class="iconbtn" data-act="openSettings" aria-label="' + G.esc(G.t('nav.account')) + '">' + G.icon('gear') + '</button></div>' + inner + '</main>' +
      '<nav class="tabbar glass" aria-label="Main">' + tabs + '</nav></div>' + G.settingsHtml();
  };

  G.sw = (act, on, label, extra) => '<button class="switch" role="switch" aria-checked="' + (on ? 'true' : 'false') + '" data-act="' + act + '"' + (extra || '') + '><span class="track"></span><span>' + G.esc(label) + '</span></button>';

  G.voiceRows = function () {
    const p = G.state.prefs, list = G.voices(), cur = G.voice();
    const opts = '<option value="">' + G.esc(G.t('settings.voiceAuto')) + '</option>' + list.map(v => '<option value="' + G.esc(v.voiceURI) + '"' + (p.voice === v.voiceURI ? ' selected' : '') + '>' + G.esc(v.name.replace(/^Microsoft /, '').replace(/ - English.*$/, '')) + '</option>').join('');
    return '<div class="setrow" style="flex-wrap:wrap"><span>' + G.esc(G.t('settings.voice')) + '</span>' + (list.length
      ? '<div class="row" style="min-width:0;flex:1 1 100%"><select id="voiceSel" class="sel grow" data-change="setVoice" aria-label="' + G.esc(G.t('settings.voice')) + '">' + opts + '</select><button class="btn sm" data-act="tryVoice">' + G.esc(G.t('common.listen')) + '</button></div>'
      : '<span class="hint-text">' + G.esc(G.t('settings.voiceNone')) + '</span>') + '</div>' +
      '<div class="setrow"><span>' + G.esc(G.t('settings.pace')) + '</span><div class="seg glass" role="group">' + [['normal', G.t('settings.paceNormal')], ['slow', G.t('settings.paceSlow')]].map(([v, l]) => '<button class="' + (p.pace === v ? 'on' : '') + '" data-act="setPace" data-v="' + v + '">' + G.esc(l) + '</button>').join('') + '</div></div>' +
      '<p class="hint-text" style="margin:-4px 0 10px">' + G.esc(G.t('settings.voiceHint')) + '</p>';
  };
  G.settingsHtml = function () {
    const p = G.state.prefs;
    const seg = (act, opts, cur) => '<div class="seg glass" role="group">' + opts.map(([v, label]) => '<button class="' + (cur === v ? 'on' : '') + '" data-act="' + act + '" data-v="' + v + '">' + G.esc(label) + '</button>').join('') + '</div>';
    return '<dialog class="sheet" id="settings"><h3>' + G.esc(G.t('settings.title')) + '</h3>' +
      '<div class="setrow"><span>' + G.esc(G.t('settings.theme')) + '</span>' + seg('setTheme', [['auto', G.t('settings.auto')], ['light', G.t('settings.light')], ['dark', G.t('settings.dark')]], p.theme) + '</div>' +
      '<div class="setrow"><span>' + G.esc(G.t('settings.lang')) + '</span>' + seg('setLang', [['en', 'English'], ['zh', '中文']], p.lang) + '</div>' +
      '<div class="setrow"><span>' + G.esc(G.t('settings.zh')) + '</span>' + G.sw('toggleZh', p.zh, p.zh ? G.t('common.on') : G.t('common.off')) + '</div>' +
      '<div class="setrow"><span>' + G.esc(G.t('settings.sound')) + '</span>' + G.sw('toggleSound', p.sound, p.sound ? G.t('common.on') : G.t('common.off')) + '</div>' +
      G.voiceRows() +
      '<div class="setrow"><span>' + G.esc(G.t('settings.motion')) + '</span>' + G.sw('toggleMotion', p.motion, p.motion ? G.t('common.on') : G.t('common.off')) + '</div>' +
      '<div class="setrow"><span>' + G.esc(G.t('settings.name')) + '</span><div class="row"><input id="nameEdit" value="' + G.esc(G.state.profile ? G.state.profile.name : '') + '" maxlength="24" style="padding:10px 14px;border-radius:16px;background:rgba(var(--tint),.12);border:1px solid rgba(var(--tint),.3);width:150px;outline:none"><button class="btn sm" data-act="saveName">' + G.esc(G.t('settings.saveName')) + '</button></div></div>' +
      '<div class="row" style="margin-top:16px;justify-content:flex-end"><button class="btn primary" data-act="closeSettings">' + G.esc(G.t('common.done')) + '</button></div></dialog>';
  };
  function reopenSettings() { G.render(); setTimeout(() => { const d = document.getElementById('settings'); if (d && d.showModal) d.showModal(); }, 30); }
  G.acts.openSettings = () => { const d = document.getElementById('settings'); if (d && d.showModal) d.showModal(); };
  G.acts.closeSettings = () => { const d = document.getElementById('settings'); if (d) d.close(); };
  G.acts.setTheme = el => { G.state.prefs.theme = el.getAttribute('data-v'); G.save(); G.applyTheme(); reopenSettings(); };
  G.acts.setLang = el => { G.state.prefs.lang = el.getAttribute('data-v'); G.save(); G.applyTheme(); reopenSettings(); };
  G.acts.toggleZh = () => {
    G.state.prefs.zh = !G.state.prefs.zh; G.save();
    const dlg = document.getElementById('settings');
    if (dlg && dlg.open) { reopenSettings(); return; }
    G.$$('[data-zhsw]').forEach(b => b.setAttribute('aria-checked', G.zhOn() ? 'true' : 'false'));
    if (G.redraw) G.redraw(); else G.render();
  };
  G.acts.setVoice = el => { G.state.prefs.voice = el.value; G.save(); G.say(G.t('voice.sample'), true); };
  G.acts.tryVoice = () => G.say(G.t('voice.sample'), true);
  G.acts.setPace = el => { G.state.prefs.pace = el.getAttribute('data-v'); G.save(); reopenSettings(); setTimeout(() => G.say(G.t('voice.sample'), true), 120); };
  G.acts.toggleSound = () => { G.state.prefs.sound = !G.state.prefs.sound; G.save(); reopenSettings(); };
  G.acts.toggleMotion = () => { G.state.prefs.motion = !G.state.prefs.motion; G.save(); G.applyTheme(); reopenSettings(); };
  G.acts.saveName = () => { const v = (document.getElementById('nameEdit').value || '').trim(); if (v) { G.state.profile.name = v.slice(0, 24); G.save(); reopenSettings(); } };
  G.acts.setLevel = el => { G.state.prefs.level = el.getAttribute('data-v'); G.save(); G.render(); };
})(window.G = window.G || {});
