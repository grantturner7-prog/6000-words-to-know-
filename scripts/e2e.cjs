#!/usr/bin/env node
/* End-to-end test: plays Lesson 1 (20 words, batch file b001) in a real browser at all three levels.
   Run:  NODE_PATH=$(npm root -g) node scripts/e2e.cjs          (the app, served from this folder)
   or: DEMO=1 NODE_PATH=$(npm root -g) node scripts/e2e.cjs     (the single-file demo, opened straight from disk)
   It starts its own static server, so nothing else needs to be running.
   Needs the "playwright" package and a Chromium (set CHROME=/path/to/chrome if it is not found). */
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert');
const { chromium } = require('playwright');

const ROOT = path.resolve(__dirname, '..');
const B = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/batches/b001.json'), 'utf8'));
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const ASSEMBLE = tiles => { let s = tiles.join(' ').trim().replace(/\s+([,.!?])/g, '$1'); if (s && s[0] === s[0].toLowerCase()) s = s[0].toUpperCase() + s.slice(1); if (s && !/[.!?]$/.test(s)) s += '.'; return s; };

function serve() {
  return new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
      res.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
    }).listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function drag(page, from, to) {
  await page.locator(to).first().scrollIntoViewIfNeeded();
  const a = await page.locator(from).first().boundingBox(), b = await page.locator(to).first().boundingBox();
  assert(a && b, 'drag needs both elements: ' + from + ' -> ' + to);
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2); await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 14, a.y + a.height / 2 + 14, { steps: 4 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 14 }); await page.mouse.up();
}
const state = page => page.evaluate(() => JSON.parse(localStorage.getItem('genesis6000.v1')));
const wordByZh = zh => B.words.find(w => w.zhTW === zh.trim());
const hintText = page => page.$eval('.bighint', e => Array.from(e.childNodes).filter(n => n.nodeType === 3).map(n => n.textContent).join(''));

(async () => {
  const srv = await serve();
  const base = process.env.DEMO ? 'file://' + path.join(ROOT, 'demo/Genesis-6000-Words.html') : 'http://127.0.0.1:' + srv.address().port + '/app/index.html';
  const chrome = process.env.CHROME || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p => fs.existsSync(p));
  const browser = await chromium.launch(chrome ? { executablePath: chrome, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  const consoleErrors = []; page.on('console', m => { if (m.type() === 'error') consoleErrors.push(m.text()); }); page.on('pageerror', e => consoleErrors.push(String(e)));
  let pass = 0; const fails = [];
  const test = async (name, fn) => { try { await fn(); pass++; console.log('  ok   ' + name); } catch (e) { fails.push(name + ': ' + e.message); console.log('  FAIL ' + name + '\n       ' + e.message.split('\n')[0]); } };
  const go = async (hash, sel) => { await page.goto(base + hash); await page.waitForSelector(sel, { timeout: 8000 }); };
  const setLevel = async lv => { await go('#/today', '.ring'); await page.click('.hdr [data-act=setLevel][data-v=' + lv + ']'); await page.waitForSelector('.shell[data-level=' + lv + ']'); };

  console.log('Welcome, shell and settings');
  await test('welcome screen shows the required title', async () => {
    await page.goto(base); await page.waitForSelector('.hero');
    assert.strictEqual((await page.textContent('.hero h1')).trim(), 'Welcome to Genesis 6,000 English Words to Know');
  });
  await test('name then Get started opens Today', async () => {
    await page.fill('#nm', 'Amy'); await page.click('[data-act=startApp]'); await page.waitForSelector('.ring');
    assert((await page.textContent('.hdr h1')).includes('Hi, Amy'));
  });
  await test('light and dark themes switch and the page stays readable', async () => {
    await page.locator('[data-act=openSettings]:visible').first().click();
    await page.click('[data-act=setTheme][data-v=light]'); await page.waitForFunction(() => document.documentElement.dataset.theme === 'light');
    await page.waitForSelector('dialog[open]'); await page.click('[data-act=setTheme][data-v=dark]');
    await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark'); await page.waitForSelector('dialog[open]'); await page.click('[data-act=closeSettings]');
  });
  await test('interface language switches to Traditional Chinese and back', async () => {
    await page.locator('[data-act=openSettings]:visible').first().click(); await page.click('[data-act=setLang][data-v=zh]');
    await page.waitForFunction(() => document.querySelector('.nav') && document.querySelector('.nav').textContent.includes('今天')); await page.waitForSelector('dialog[open]');
    await page.click('[data-act=setLang][data-v=en]'); await page.waitForFunction(() => document.querySelector('.nav').textContent.includes('Today')); await page.waitForSelector('dialog[open]'); await page.click('[data-act=closeSettings]');
  });
  await test('Lessons shows Lesson 1 open and the rest coming soon', async () => {
    await go('#/batches', '.bgrid');
    assert.strictEqual(await page.locator('.bcard.open').count(), 1);
    assert((await page.locator('.bcard.locked').count()) >= 40);
  });

  console.log('Meet: cards, Match it, Build it (all 20 words)');
  await test('Chinese switch hides and shows the Chinese meaning on a word card', async () => {
    await setLevel('beginner'); await go('#/batch/b001/meet', '.wcard');
    assert(await page.locator('.wcard .zh').count() === 1);
    await page.click('[data-zhsw]'); await page.waitForFunction(() => !document.querySelector('.wcard .zh'));
    await page.click('[data-zhsw]'); await page.waitForSelector('.wcard .zh');
  });
  await test('tapping the highlighted word opens Word Peek with English and Chinese', async () => {
    await page.click('.wcard .ex .hl'); await page.waitForSelector('#pop:not([hidden])');
    const txt = await page.textContent('#pop'); assert(txt.includes('Not fun or interesting.') && txt.includes('無聊的'));
    await page.keyboard.press('Escape');
  });
  await test('Meet: 20 cards, matching all 20 words, spelling all 20 (with a wrong spelling corrected), lesson marked met', async () => {
    assert((await page.textContent('.hint-text')).includes('Card 1 of 20'));
    for (let i = 0; i < 20; i++) await page.click('[data-act=cardNext]');
    await page.waitForSelector('.match');
    for (let r = 0; r < 4; r++) {
      await page.waitForFunction(n => document.querySelector('#mc') && document.querySelector('#mc').textContent.includes('Matched ' + n + ' of 20') && !document.querySelector('.mean.done'), r * 5);
      const ids = await page.$$eval('.match .col:first-child .chip', els => els.map(e => e.dataset.w)); assert.strictEqual(ids.length, 5);
      if (r === 0) { // one wrong drop first
        const wrongZone = await page.$$eval('.mean', (els, id) => els.find(e => e.dataset.w !== id).dataset.w, ids[0]);
        await drag(page, '.chip[data-w="' + ids[0] + '"]', '.mean[data-w="' + wrongZone + '"]'); await page.waitForTimeout(150);
        assert.strictEqual(await page.locator('.mean.done').count(), 0, 'a wrong drop must not lock');
      }
      for (const id of ids) {
        if (r === 0) await drag(page, '.match .chip[data-w="' + id + '"]:not(.ok)', '.mean[data-w="' + id + '"]');
        else { await page.click('.match .chip[data-w="' + id + '"]:not(.ok)'); await page.click('.mean[data-w="' + id + '"]'); }
      }
    }
    await page.waitForSelector('.slots', { timeout: 5000 });
    for (let n = 0; n < 20; n++) {
      await page.waitForSelector('.slots');
      const hint = await hintText(page); const w = wordByZh(hint); assert(w, 'word for hint ' + hint);
      if (n < 2) { // a wrong spelling first, then fix it: no letter may vanish (words 1 and 2)
        const total = await page.locator('#tiles .chip').count();
        const order = w.headword.split(''); if (order.length > 1) { const x = order[0]; order[0] = order[1]; order[1] = x; } if (order.join('') === w.headword) order.reverse();
        for (const ch of order) await page.locator('#tiles .chip[data-ch="' + ch + '"]').first().click();
        await page.waitForSelector('.slot.wrong', { timeout: 2000 });
        await page.locator('.slot.dz .chip').first().click(); // take one letter back at once
        assert.strictEqual((await page.locator('#tiles .chip').count()) + (await page.locator('.slot.dz .chip').count()), total, 'no letter may vanish');
        await page.waitForFunction(() => !document.querySelector('.slot.wrong'), null, { timeout: 4000 });
        assert.strictEqual((await page.locator('#tiles .chip').count()) + (await page.locator('.slot.dz .chip').count()), total, 'no letter may vanish after the slots reset');
        for (const k of await page.$$eval('.slot.dz', els => els.map(e => e.dataset.k))) { const placed = await page.locator('.slot.dz[data-k="' + k + '"] .chip').count(); if (placed) await page.locator('.slot.dz[data-k="' + k + '"] .chip').click(); }
      }
      for (const ch of w.headword.split('')) { const t = page.locator('#tiles .chip[data-ch="' + ch + '"]').first(); if (await t.count()) await t.click(); }
      await page.waitForSelector('[data-act=bNext]', { timeout: 3000 }); await page.click('[data-act=bNext]');
    }
    await page.waitForSelector('.banner');
    assert.strictEqual((await state(page)).progress.b001.beginner.meet[0], 1);
  });

  for (const lv of ['beginner', 'intermediate', 'advanced']) {
    console.log('Level: ' + lv);
    await test(lv + ': Pick the word for all 20 words, with a wrong answer, drag and tap', async () => {
      await setLevel(lv); await go('#/batch/b001/use/pick', '.sentence');
      assert((await page.textContent('.hint-text')).includes('1 / 20'));
      for (let n = 0; n < 20; n++) {
        const sentence = (await page.textContent('.sentence')).trim();
        const w = B.words.find(x => { const m = x.examples[lv].match(/^(.*)\{([^{}]+)\}(.*)$/); return (m[1] + '?' + m[3]).trim() === sentence; });
        assert(w, 'which word? ' + sentence);
        if (n === 0) { const wrong = w.pick[lv][0]; await page.click('.chip[data-h="' + wrong + '"]'); await page.waitForTimeout(200); assert(!(await page.locator('.gap.right').count())); }
        if (n % 2 === 0) await drag(page, '.chip[data-h="' + w.headword + '"]', '#gap'); else await page.click('.chip[data-h="' + w.headword + '"]');
        await page.waitForSelector('.gap.right', { timeout: 2000 }); await page.click('[data-act=pNext]');
      }
      await page.waitForSelector('.banner'); const s = await state(page); assert(s.progress.b001[lv].pick[0] !== null);
    });
    await test(lv + ': Sentence Maker builds correct sentences from tiles for all 20 words', async () => {
      await go('#/batch/b001/use/maker', '.maker');
      for (let n = 0; n < 20; n++) {
        const id = await page.getAttribute('.chip[data-peek]', 'data-peek'); const w = B.words.find(x => x.id === id);
        const rows = w.frames[lv].rows;
        for (let r = 0; r < rows.length; r++) await page.click('.mt[data-r="' + r + '"][data-t="0"]');
        await page.waitForSelector('.preview.done');
        assert.strictEqual((await page.textContent('.preview')).trim(), ASSEMBLE(rows.map(r => r.tiles[0])));
        if (n === 0) { await page.click('[data-act=mSave]'); }
        await page.click('[data-act=mNext]');
      }
      await page.waitForSelector('.banner'); assert((await state(page)).sentences.length >= 1);
    });
    await test(lv + ': Spelling Bee for all 20 words accepts the right spelling and rejects a look-alike', async () => {
      await go('#/batch/b001/use/bee', '.opts');
      const heads = B.words.map(w => w.headword);
      for (let n = 0; n < 20; n++) {
        const opts = await page.$$eval('.opt', els => els.map(e => e.dataset.o)); const right = opts.find(o => heads.includes(o)); assert(right);
        if (n === 0) { const wrong = opts.find(o => o !== right); await page.click('.opt[data-o="' + wrong + '"]'); await page.waitForSelector('.opt.wrong'); }
        await page.click('.opt[data-o="' + right + '"]'); await page.waitForSelector('[data-act=beeNext]'); await page.click('[data-act=beeNext]');
      }
      await page.waitForSelector('.banner');
    });
    await test(lv + ': one article with 20 gaps by drag and tap, wrong answers handled, star earned', async () => {
      await go('#/batch/b001/story', '.story');
      const gaps = B.stories[lv].parts[0].gaps; assert.strictEqual(gaps.length, 20);
      assert.strictEqual(await page.locator('.gap').count(), 20); assert.strictEqual(await page.locator('#bank .chip').count(), 20);
      // put two words in each other's gaps, check, expect two wrong
      await drag(page, '.chip[data-k="0"]', '.gap[data-g="1"]'); await page.click('.chip[data-k="1"]'); await page.click('.gap[data-g="0"]');
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 3));
      const inView = await page.evaluate(() => { const r = document.getElementById('bank').getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; });
      assert(inView, 'the word bank stays on screen while the article scrolls');
      await page.click('[data-act=sCheck]'); await page.waitForSelector('.gap.wrong');
      assert.strictEqual(await page.locator('.gap.wrong').count(), 2);
      await page.waitForFunction(() => !document.querySelector('.gap.wrong') && document.querySelectorAll('#bank .chip').length === 20, null, { timeout: 4000 });
      for (let k = 0; k < gaps.length; k++) {
        if (k % 4 === 0) await drag(page, '#bank .chip[data-k="' + k + '"]', '.gap[data-g="' + k + '"]');
        else { await page.click('#bank .chip[data-k="' + k + '"]'); await page.click('.gap[data-g="' + k + '"]'); }
      }
      assert.strictEqual(await page.locator('.gap .chip').count(), 20);
      assert.strictEqual(await page.evaluate(() => getComputedStyle(document.getElementById('bank')).display), 'none', 'the empty word bank gets out of the way');
      await page.click('[data-act=sCheck]'); await page.waitForSelector('.gap.right >> nth=19', { timeout: 3000 });
      assert.strictEqual(await page.locator('.gap.right').count(), 20);
      const p = (await state(page)).progress.b001[lv]; assert.strictEqual(p.story[0], 1, 'article done = star');
    });
  }

  console.log('Games and the other stations');
  await test('Missing Letters (advanced) plays through all 20 words', async () => {
    await setLevel('advanced'); await go('#/play/missing/b001', '.slots');
    for (let n = 0; n < 20; n++) {
      await page.waitForSelector('.slots'); if (await page.locator('[data-act=bHint]').count()) await page.click('[data-act=bHint]');
      const hint = await hintText(page); const w = wordByZh(hint); assert(w, 'word for ' + hint);
      const ks = await page.$$eval('.slot.dz', els => els.map(e => +e.dataset.k));
      for (const k of ks) await page.locator('#tiles .chip[data-ch="' + w.headword[k] + '"]').first().click();
      await page.waitForSelector('[data-act=bNext]'); await page.click('[data-act=bNext]');
    }
    await page.waitForSelector('.banner');
  });
  await test('Build it from the Games tab (intermediate decoys) plays through all 20 words', async () => {
    await setLevel('intermediate'); await go('#/play/build/b001', '.slots');
    for (let n = 0; n < 20; n++) {
      await page.waitForSelector('.slots'); const hint = await hintText(page); const w = wordByZh(hint); assert(w, 'word for ' + hint);
      for (const ch of w.headword.split('')) await page.locator('#tiles .chip[data-ch="' + ch + '"]').first().click();
      await page.waitForSelector('[data-act=bNext]'); await page.click('[data-act=bNext]');
    }
    await page.waitForSelector('.banner');
  });
  await test('Games and Progress screens show the work done', async () => {
    await go('#/games', '.station'); assert(await page.locator('.station').count() >= 6);
    await go('#/progress', '.stat'); assert((await page.textContent('body')).includes('My Sentences'));
    assert((await page.locator('.saved').count()) >= 1, 'saved sentence listed');
    const s = await state(page); const stars = ['beginner', 'intermediate', 'advanced'].filter(l => s.progress.b001[l].story[0] === 1).length; assert.strictEqual(stars, 3);
  });
  await test('progress survives a page reload', async () => {
    await go('#/today', '.ring'); await page.reload(); await page.waitForSelector('.ring');
    assert((await page.textContent('.hdr h1')).includes('Amy')); assert(Number(await page.textContent('.grid.g3 .stat:nth-child(2) b')) === 3);
  });

  await test('Save code: copy it, lose the progress, paste it back; a damaged code is ignored safely', async () => {
    await go('#/progress', '.stat'); const before = await state(page);
    await page.click('[data-act=showCode]'); await page.waitForSelector('#codeOut'); const code = await page.inputValue('#codeOut'); assert(code.startsWith('G6K1.'), code.slice(0, 12));
    await page.fill('#restoreIn', 'G6K1.not-a-real-code'); await page.click('[data-act=restoreCode]'); await page.waitForSelector('.toast');
    assert.deepStrictEqual((await state(page)).progress.b001, before.progress.b001, 'garbage code leaves progress alone');
    await page.evaluate(() => { G.state.progress = {}; G.state.sentences = []; G.state.met = {}; G.save(); G.render(); }); await page.waitForSelector('#restoreIn');
    assert.deepStrictEqual((await state(page)).progress, {}, 'progress cleared');
    await page.fill('#restoreIn', code); await page.click('[data-act=restoreCode]'); await page.waitForFunction(() => G.starCount() === 3);
    const after = await state(page); assert.deepStrictEqual(after.progress.b001, before.progress.b001, 'progress restored'); assert.strictEqual(after.sentences.length, before.sentences.length); assert.strictEqual(Object.keys(after.met).length, Object.keys(before.met).length);
    const bad = 'G6K1.' + Buffer.from(JSON.stringify({ v: 1, progress: { b001: { beginner: { meet: 'x', story: [1, 'a'] } }, evil: 1 }, met: { w0001: 1, '<b>': 1 } })).toString('base64');
    await page.fill('#restoreIn', bad); await page.click('[data-act=restoreCode]'); await page.waitForSelector('.stat');
    const fixed = await state(page); assert(!('evil' in fixed.progress)); assert.deepStrictEqual(fixed.progress.b001.beginner.meet, [0]); assert.deepStrictEqual(fixed.progress.b001.beginner.story, [0]); assert.deepStrictEqual(Object.keys(fixed.met), ['w0001']);
    await page.fill('#restoreIn', code); await page.click('[data-act=restoreCode]'); await page.waitForFunction(() => G.starCount() === 3);
  });

  await test('Clear my progress asks inside the page, then clears stars and sentences', async () => {
    await go('#/progress', '.stat'); await page.click('[data-act=resetAsk]'); await page.waitForSelector('[data-act=resetYes]');
    await page.click('[data-act=resetNo]'); await page.waitForSelector('[data-act=resetAsk]');
    await page.click('[data-act=resetAsk]'); await page.click('[data-act=resetYes]'); await page.waitForFunction(() => document.querySelector('.stat b').textContent === '0');
    const s = await state(page); assert.deepStrictEqual(s.progress, {}); assert.strictEqual(s.sentences.length, 0);
  });

  console.log('Lessons');
  await test('only Lesson 1 is playable, and the lesson chips appear when a second lesson is added', async () => {
    await go('#/today', '.ring'); assert.deepStrictEqual(await page.evaluate(() => G.builtList()), ['b001']);
    assert.strictEqual(await page.locator('[data-act=setBatch]').count(), 0);
    assert((await page.textContent('section.tint h3')).includes('Lesson 1'));
    await page.evaluate(() => { G.builtList = () => ['b001', 'b002']; G.render(); }); await page.waitForSelector('[data-act=setBatch]');
    assert.strictEqual(await page.locator('[data-act=setBatch]').count(), 2); assert((await page.textContent('[data-act=setBatch]')).includes('Lesson 1'));
    await go('#/today', '.ring');
  });
  await test('an older save with sets and parts is folded into the one-lesson shape', async () => {
    const r = await page.evaluate(() => { G.state.progress.b001.beginner = { meet: [1, 1, 1, 1], pick: [8, 9], maker: [2, 0], bee: [null, 7], build: [null, null], missing: [3, 4], story: [1, 1] }; return JSON.stringify(G.pg('b001', 'beginner')); });
    assert.deepStrictEqual(JSON.parse(r), { meet: [1], maker: [0], story: [1], pick: [17], bee: [null], build: [null], missing: [7] });
    await page.evaluate(() => { G.state.progress.b001.beginner = G.normPg(null); G.save(); });
  });

  console.log('Voices');
  const FAKE = [
    { name: 'Fred', lang: 'en-US', localService: true, voiceURI: 'fred' },
    { name: 'Microsoft Zira Desktop - English (United States)', lang: 'en-US', localService: true, voiceURI: 'zira' },
    { name: 'Samantha', lang: 'en-US', localService: true, voiceURI: 'sam' },
    { name: 'Google US English', lang: 'en-US', localService: false, voiceURI: 'goog' },
    { name: 'Microsoft Aria Online (Natural) - English (United States)', lang: 'en-US', localService: false, voiceURI: 'aria' },
    { name: 'Ava (Premium)', lang: 'en-US', localService: true, voiceURI: 'ava' },
    { name: 'Amelie', lang: 'fr-CA', localService: true, voiceURI: 'fr' }];
  await test('voices are ranked: natural and premium first, novelty and old desktop voices last, other languages left out', async () => {
    await go('#/today', '.ring');
    const order = await page.evaluate(v => G.rankVoices(v).map(x => x.voiceURI), FAKE);
    assert.deepStrictEqual(order, ['aria', 'ava', 'goog', 'sam', 'fred', 'zira']);
  });
  await test('Settings lists the voices, a student picks one and hears it, and the speed setting changes the pace', async () => {
    await page.evaluate(v => {
      window.__spoken = []; window.SpeechSynthesisUtterance = function (t) { this.text = t; };
      speechSynthesis.cancel = () => {}; speechSynthesis.speak = u => window.__spoken.push({ text: u.text, voice: u.voice && u.voice.voiceURI, rate: u.rate });
      speechSynthesis.getVoices = () => v; speechSynthesis.onvoiceschanged(); G.render();
    }, FAKE);
    assert.strictEqual(await page.evaluate(() => G.voice().voiceURI), 'aria');
    await page.locator('[data-act=openSettings]:visible').first().click(); await page.waitForSelector('dialog[open] #voiceSel');
    assert.strictEqual(await page.locator('#voiceSel option').count(), 7);
    assert((await page.locator('#voiceSel option').nth(1).textContent()).includes('Aria Online (Natural)'));
    await page.selectOption('#voiceSel', 'ava');
    let spoken = await page.evaluate(() => window.__spoken); assert.strictEqual(spoken[spoken.length - 1].voice, 'ava'); assert(spoken[spoken.length - 1].text.includes('learn some English words'));
    assert.strictEqual((await state(page)).prefs.voice, 'ava');
    await page.click('[data-act=tryVoice]'); spoken = await page.evaluate(() => window.__spoken); assert.strictEqual(spoken[spoken.length - 1].voice, 'ava');
    const normal = spoken[spoken.length - 1].rate;
    await page.click('[data-act=setPace][data-v=slow]'); await page.waitForFunction(() => window.__spoken.length >= 3 && window.__spoken[window.__spoken.length - 1].rate < 0.8);
    assert.strictEqual((await state(page)).prefs.pace, 'slow'); assert(normal > 0.9, 'normal pace is close to natural speed');
    await page.waitForSelector('dialog[open] #voiceSel'); await page.selectOption('#voiceSel', ''); assert.strictEqual(await page.evaluate(() => G.voice().voiceURI), 'aria');
    await page.click('[data-act=setPace][data-v=normal]'); await page.waitForSelector('dialog[open] #voiceSel'); await page.click('[data-act=closeSettings]');
    assert.strictEqual((await state(page)).prefs.pace, 'normal');
  });

  await test('a listed audio clip is played, and any other text falls back to the device voice', async () => {
    const r = await page.evaluate(() => {
      const log = { audio: [], voice: [] }; window.Audio = function (src) { this.src = src; this.pause = () => {}; this.play = () => { log.audio.push(this.src); return Promise.resolve(); }; };
      speechSynthesis.speak = u => log.voice.push(u.text);
      G.clips = { 'hello world': 'words/hello.mp3' }; G.state.prefs.sound = true;
      G.say('Hello  {world}'.replace('{world}', 'world')); G.say('Something else');
      return log;
    });
    assert.strictEqual(r.audio.length, 1); assert(r.audio[0].endsWith('audio/words/hello.mp3'), r.audio[0]);
    assert.deepStrictEqual(r.voice, ['Something else']);
    await page.evaluate(() => { G.clips = {}; });
  });

  console.log('Phone width');
  await test('no sideways scrolling on the main screens at 390px wide, at every level', async () => {
    for (const lv of ['beginner', 'intermediate', 'advanced']) {
      await page.setViewportSize({ width: 1280, height: 800 }); await setLevel(lv); await page.setViewportSize({ width: 390, height: 844 });
      for (const [h, sel] of [['#/today', '.ring'], ['#/batches', '.bgrid'], ['#/batch/b001', '.station'], ['#/games', '.station'], ['#/progress', '.stat'], ['#/batch/b001/meet', '.wcard'], ['#/batch/b001/story', '.story'], ['#/batch/b001/use/maker', '.maker']]) {
        await go(h, sel); const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); assert(over <= 1, lv + ' ' + h + ' overflows by ' + over + 'px');
      }
    }
  });
  await test('no console errors during the whole run', async () => { assert.deepStrictEqual(consoleErrors, []); });

  await browser.close(); srv.close();
  console.log('\n' + pass + ' passed, ' + fails.length + ' failed'); if (fails.length) { console.log(fails.join('\n')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
