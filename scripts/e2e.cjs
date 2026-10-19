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
const MEDIA = JSON.parse(fs.readFileSync(path.join(ROOT, 'content/media.json'), 'utf8'));
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
/* The end-of-activity screen: one big primary button that names the next activity, two smaller buttons, the three stations. */
const endScreen = async page => {
  await page.waitForSelector('.finish .btn.primary.lg');
  return {
    primary: (await page.textContent('.finish .btn.primary.lg')).trim(), href: await page.getAttribute('.finish .btn.primary.lg', 'href'),
    act: await page.getAttribute('.finish .btn.primary.lg', 'data-act'), alts: (await page.$$eval('.finish .alt .btn', els => els.map(e => e.textContent.trim()))),
    steps: await page.locator('.finish .step').count(), done: await page.locator('.finish .step.done').count(), next: await page.locator('.finish .step.next').count()
  };
};
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
    for (let i = 0; i < 19; i++) { assert.strictEqual((await page.textContent('[data-act=cardNext]')).trim(), 'Next'); await page.click('[data-act=cardNext]'); }
    assert.strictEqual((await page.textContent('[data-act=cardNext]')).trim(), 'Next: match words to meanings', 'the last card names the next part');
    await page.click('[data-act=cardNext]');
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
    await page.waitForSelector('[data-act=toBuild]', { timeout: 5000 });
    assert.strictEqual((await page.textContent('[data-act=toBuild]')).trim(), 'Next: spell the words');
    await page.waitForTimeout(1300); assert.strictEqual(await page.locator('.slots').count(), 0, 'Match it waits for the student to press the button');
    await page.click('[data-zhsw]'); await page.waitForSelector('[data-act=toBuild]'); await page.click('[data-zhsw]'); await page.waitForSelector('[data-act=toBuild]'); // switching the Chinese view keeps the button
    await page.click('[data-act=toBuild]'); await page.waitForSelector('.slots', { timeout: 3000 });
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
      await page.waitForSelector('[data-act=bNext]', { timeout: 3000 });
      assert.strictEqual((await page.textContent('[data-act=bNext]')).trim(), n === 19 ? 'Finish this activity' : 'Next word');
      await page.click('[data-act=bNext]');
    }
    await page.waitForSelector('.banner');
    assert.strictEqual((await state(page)).progress.b001.beginner.meet[0], 1);
    const e = await endScreen(page);
    assert.strictEqual(e.primary, 'Next activity: Pick the word'); assert(e.href.endsWith('#/batch/b001/use/pick'), e.href);
    assert.deepStrictEqual(e.alts, ['Do this activity again', 'Go to the lesson menu']);
    assert.deepStrictEqual([e.steps, e.done, e.next], [3, 1, 1]);
    assert((await page.textContent('.banner')).includes('1 of 5 activities done at Beginner level.'));
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
        await page.waitForSelector('.gap.right', { timeout: 2000 });
        assert.strictEqual((await page.textContent('[data-act=pNext]')).trim(), n === 19 ? 'See my score' : 'Next sentence');
        await page.click('[data-act=pNext]');
      }
      await page.waitForSelector('.banner'); const s = await state(page); assert(s.progress.b001[lv].pick[0] !== null);
      const e = await endScreen(page); assert.strictEqual(e.primary, 'Next activity: Sentence Maker'); assert(e.href.endsWith('#/batch/b001/use/maker'));
      assert(e.alts.includes('Do this activity again') && e.alts.includes('Go to the lesson menu'));
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
        assert.strictEqual((await page.textContent('[data-act=mNext]')).trim(), n === 19 ? 'Finish this activity' : 'Next word');
        await page.click('[data-act=mNext]');
      }
      await page.waitForSelector('.banner'); assert((await state(page)).sentences.length >= 1);
      const e = await endScreen(page); assert.strictEqual(e.primary, 'Next activity: Spelling Bee'); assert(e.href.endsWith('#/batch/b001/use/bee'));
    });
    await test(lv + ': Spelling Bee for all 20 words accepts the right spelling and rejects a look-alike', async () => {
      await go('#/batch/b001/use/bee', '.opts');
      const heads = B.words.map(w => w.headword);
      for (let n = 0; n < 20; n++) {
        const opts = await page.$$eval('.opt', els => els.map(e => e.dataset.o)); const right = opts.find(o => heads.includes(o)); assert(right);
        if (n === 0) { const wrong = opts.find(o => o !== right); await page.click('.opt[data-o="' + wrong + '"]'); await page.waitForSelector('.opt.wrong'); }
        await page.click('.opt[data-o="' + right + '"]'); await page.waitForSelector('[data-act=beeNext]');
        assert.strictEqual((await page.textContent('[data-act=beeNext]')).trim(), n === 19 ? 'See my score' : 'Next word');
        await page.click('[data-act=beeNext]');
      }
      await page.waitForSelector('.banner');
      const e = await endScreen(page); assert.strictEqual(e.primary, 'Next activity: Article'); assert(e.href.endsWith('#/batch/b001/story'));
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
      const e = await endScreen(page);
      if (lv === 'beginner') { // all done: the lesson is complete and the big button offers the next level
        assert.strictEqual(e.primary, 'Do Lesson 1 at Intermediate level'); assert.strictEqual(e.act, 'levelUp'); assert.deepStrictEqual([e.steps, e.done, e.next], [3, 3, 0]);
        assert((await page.textContent('.finish')).includes('The same 20 words'));
      } else { // earlier activities at this level are still open: the button wraps round to the first one
        assert.strictEqual(e.primary, 'Next activity: Meet the words'); assert(e.href.endsWith('#/batch/b001/meet')); assert.deepStrictEqual([e.steps, e.done, e.next], [3, 2, 1]);
      }
      assert(e.alts.includes('Do this activity again') && e.alts.includes('Go to the lesson menu'));
    });
    if (lv === 'beginner') await test('the big button after a finished lesson starts the next level', async () => {
      await page.click('.finish [data-act=levelUp]'); await page.waitForSelector('.wcard');
      assert.strictEqual((await state(page)).prefs.level, 'intermediate'); assert(page.url().endsWith('#/batch/b001/meet'));
      assert((await page.textContent('.player')).includes('Intermediate'));
    });
  }

  console.log('End of each activity');
  await test('at Advanced, finishing the last open activity completes the lesson and the big button goes to Today', async () => {
    await setLevel('advanced');
    await page.evaluate(() => { const p = G.pg('b001', 'advanced'); p.meet[0] = 1; G.save(); });
    await go('#/batch/b001/use/bee', '.opts');
    const heads = B.words.map(w => w.headword);
    for (let n = 0; n < 20; n++) { const opts = await page.$$eval('.opt', els => els.map(e => e.dataset.o)); await page.click('.opt[data-o="' + opts.find(o => heads.includes(o)) + '"]'); await page.waitForSelector('[data-act=beeNext]'); await page.click('[data-act=beeNext]'); }
    const e = await endScreen(page);
    assert.strictEqual(e.primary, 'Back to Today'); assert(e.href.endsWith('#/today')); assert.deepStrictEqual([e.done, e.next], [3, 0]);
    assert((await page.textContent('.banner')).includes('Lesson 1 complete at Advanced level!'));
    await page.click('.finish [data-act=replay]'); await page.waitForSelector('.opts'); // do this activity again
    assert((await page.textContent('.hint-text')).includes('1 / 20'));
  });
  await test('the end screen fits a 390px phone and its big button is fully on screen', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    await go('#/batch/b001/story', '.story');
    for (let k = 0; k < 20; k++) { await page.click('#bank .chip[data-k="' + k + '"]'); await page.click('.gap[data-g="' + k + '"]'); }
    await page.click('[data-act=sCheck]'); await page.waitForSelector('.finish .btn.primary.lg', { timeout: 4000 });
    const r = await page.evaluate(() => { const b = document.querySelector('.finish .btn.primary.lg').getBoundingClientRect(); return { l: b.left, r: b.right, w: innerWidth, over: document.documentElement.scrollWidth - innerWidth }; });
    assert(r.l >= 0 && r.r <= r.w, 'button inside the screen: ' + JSON.stringify(r)); assert(r.over <= 1, 'overflow ' + r.over);
    const steps = await page.$$eval('.finish .step', els => els.map(e => ({ l: e.getBoundingClientRect().left, r: e.getBoundingClientRect().right })));
    assert(steps.every(x => x.l >= 0 && x.r <= 390), 'all three steps fit across the phone');
    await page.setViewportSize({ width: 1280, height: 900 });
  });

  console.log('Watch and listen');
  const hubLevel = async lv => { await page.locator('[data-act=setLevel][data-v=' + lv + ']').first().click(); await page.waitForSelector('.shell[data-level=' + lv + ']'); await page.waitForSelector('.mtile'); };
  const mediaTexts = () => page.$$eval('.mtile', els => els.map(e => ({ title: e.querySelector('b').textContent.trim(), sub: e.querySelector('small').textContent.trim(), tag: e.tagName, href: e.getAttribute('href'), target: e.getAttribute('target'), rel: e.getAttribute('rel'), off: e.classList.contains('off'), soon: !!e.querySelector('.pill') })));
  const setMedia = (m, lang) => page.evaluate(([media, lng]) => { G.media = media; if (lng) { G.state.prefs.lang = lng; G.save(); } G.render(); }, [m, lang || null]);
  const silentWav = seconds => { const rate = 8000, n = rate * seconds, b = Buffer.alloc(44 + n, 0x80); b.write('RIFF', 0); b.writeUInt32LE(36 + n, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(rate, 24); b.writeUInt32LE(rate, 28); b.writeUInt16LE(1, 32); b.writeUInt16LE(8, 34); b.write('data', 36); b.writeUInt32LE(n, 40); return b; };
  const DRIVE = 'https://drive.google.com/file/d/ABC123_xyz-9/view?usp=drive_link', DRIVE_FRAME = 'https://drive.google.com/file/d/ABC123_xyz-9/preview';
  const none = { video: '', talk: '' }, only = (b, o) => ({ b001: Object.assign({ beginner: none, intermediate: none, advanced: none }, { [b]: o }) });
  // stand-ins for Google Drive and a media host, so the test never needs the network
  await page.route('https://drive.google.com/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>stand-in</title><p>stand-in player</p>' }));
  await page.route('https://media.example.com/**', route => /\.wav$/.test(route.request().url()) ? route.fulfill({ status: 200, contentType: 'audio/wav', body: silentWav(8) }) : route.fulfill({ status: 404, body: '' }));
  await test('how a link plays: Drive files and direct video or audio files play in the page, any other link opens in a new tab', async () => {
    const e = u => page.evaluate(x => G.mediaEmbed(x), u);
    assert.deepStrictEqual(await e(DRIVE), { kind: 'frame', src: DRIVE_FRAME });
    assert.deepStrictEqual(await e('https://drive.google.com/open?id=ABC123_xyz-9'), { kind: 'frame', src: DRIVE_FRAME });
    assert.deepStrictEqual(await e('https://media.example.com/a/b.MP4?x=1'), { kind: 'video', src: 'https://media.example.com/a/b.MP4?x=1' });
    assert.strictEqual((await e('https://media.example.com/a/talk.m4a')).kind, 'audio');
    for (const other of ['https://media.example.com/watch/abc', 'https://example.com/file.pdf', 'not a link']) assert.strictEqual(await e(other), null, other);
  });
  await test('the links written in content/media.json appear on the buttons at every level, and an empty one stays Coming soon', async () => {
    for (const lv of ['beginner', 'intermediate', 'advanced']) {
      await setLevel(lv); await go('#/batch/b001', '.mtile'); await page.reload(); await page.waitForSelector('.mtile');
      const m = await mediaTexts(), want = MEDIA.b001[lv];
      for (const [k, i] of [['video', 0], ['talk', 1]]) {
        if (!/^https:\/\//.test(want[k])) { assert(m[i].off && m[i].soon, lv + ' ' + k + ' has no link yet'); continue; }
        const em = await page.evaluate(u => G.mediaEmbed(u), want[k].trim());
        if (em) { // plays in the page
          assert.strictEqual(m[i].tag, 'BUTTON', lv + ' ' + k); await page.locator('.mtile').nth(i).click();
          assert.strictEqual(await page.getAttribute('#mplay iframe, #mplay video, #mplay audio', 'src'), em.src, lv + ' ' + k); await page.click('[data-act=mediaClose]');
        } else { assert.strictEqual(m[i].href, want[k].trim(), lv + ' ' + k); assert.strictEqual(m[i].target, '_blank'); }
      }
    }
  });
  await test('each level shows Watch the video and Listen to an in-depth conversation, each with its subtitle, and Coming soon until a link is added', async () => {
    for (const lv of ['beginner', 'intermediate', 'advanced']) {
      await setLevel(lv); await go('#/batch/b001', '.mtile'); await setMedia({}); await page.waitForSelector('.mtile.off');
      const m = await mediaTexts(); assert.strictEqual(m.length, 2);
      assert.deepStrictEqual(m.map(x => [x.title, x.sub]), [['Watch the video', 'Watch now: English video'], ['Listen to an in-depth conversation', 'Listen now: Chinese conversation about the words']]);
      assert(m.every(x => x.off && x.soon && x.tag === 'BUTTON'), lv + ': no link yet');
    }
    await page.click('.mtile[data-kind=video]', { force: true }); await page.waitForFunction(() => document.getElementById('toasts').textContent.includes('This one is coming soon.'));
  });
  await test('links are different for each level, other links open in a new tab, and only https links are used', async () => {
    await setLevel('beginner'); await go('#/batch/b001', '.mtile');
    await setMedia({ b001: { beginner: { video: 'https://media.example.com/lesson-1/watch-beginner', talk: 'https://media.example.com/lesson-1/beginner-talk.mp3' }, intermediate: { video: 'https://media.example.com/lesson-1/intermediate-video.mp4', talk: 'http://media.example.com/not-secure.mp3' }, advanced: { video: 'javascript:alert(1)', talk: '' } } });
    await page.waitForSelector('a.mtile');
    let m = await mediaTexts();
    assert.deepStrictEqual(m.map(x => x.tag), ['A', 'BUTTON']);
    assert(m[0].href === 'https://media.example.com/lesson-1/watch-beginner' && m[0].target === '_blank' && /noopener/.test(m[0].rel) && !m[0].off, 'a page link opens in a new tab');
    assert(!m[1].off && m[1].href === null, 'an audio file plays in the page');
    assert.deepStrictEqual(m.map(x => x.sub), ['Watch now: English video', 'Listen now: Chinese conversation about the words']);
    await hubLevel('intermediate');
    m = await mediaTexts();
    assert(!m[0].off && m[0].tag === 'BUTTON', 'an mp4 plays in the page'); assert(m[1].off && m[1].tag === 'BUTTON', 'an http link is not used');
    await hubLevel('advanced');
    m = await mediaTexts(); assert(m.every(x => x.off && x.tag === 'BUTTON'), 'a javascript: link and an empty link are not used');
  });
  await test('a Google Drive link plays inside the lesson page: no new tab, one player at a time, and a close button', async () => {
    await setLevel('beginner'); await go('#/batch/b001', '.mtile');
    await setMedia(only('beginner', { video: DRIVE, talk: DRIVE.replace('ABC123', 'DEF456') }));
    await page.waitForSelector('button.mtile[data-act=mediaPlay]');
    const tabs = ctx.pages().length;
    await page.click('.mtile[data-kind=video]'); await page.waitForSelector('#mplay iframe');
    assert.strictEqual(await page.getAttribute('#mplay iframe', 'src'), DRIVE_FRAME);
    assert.strictEqual(await page.getAttribute('#mplay iframe', 'title'), 'Watch the video'); assert((await page.getAttribute('#mplay iframe', 'allow')).includes('fullscreen'));
    assert.strictEqual(await page.locator('.mtile.on').count(), 1); assert.strictEqual(await page.getAttribute('.mtile[data-kind=video]', 'aria-expanded'), 'true');
    assert.strictEqual(ctx.pages().length, tabs, 'it must not open a new tab');
    const link = await page.$eval('#mplay a.sub', a => [a.textContent.trim(), a.href, a.target]); assert.deepStrictEqual(link, ['Open in a new tab', DRIVE, '_blank']);
    await page.click('.mtile[data-kind=talk]'); await page.waitForFunction(() => document.querySelectorAll('#mplay iframe').length === 1 && document.querySelector('#mplay iframe').src.includes('DEF456'));
    assert.strictEqual((await page.textContent('#mplay .top b')).trim(), 'Listen to an in-depth conversation');
    assert.strictEqual(await page.getAttribute('.mtile[data-kind=video]', 'aria-expanded'), 'false');
    await page.click('[data-act=mediaClose]'); assert.strictEqual(await page.locator('#mplay iframe').count(), 0); assert.strictEqual(await page.locator('.mtile.on').count(), 0);
    await page.click('.mtile[data-kind=video]'); await page.waitForSelector('#mplay iframe'); await hubLevel('intermediate'); assert.strictEqual(await page.locator('#mplay iframe').count(), 0, 'changing level closes the player');
  });
  await test('an audio file plays inside the page with its own controls, and starts playing', async () => {
    await setLevel('beginner'); await go('#/batch/b001', '.mtile');
    await setMedia(only('beginner', { video: '', talk: 'https://media.example.com/audio/talk.wav' }));
    await page.click('.mtile[data-kind=talk]'); await page.waitForSelector('#mplay audio[controls]');
    await page.waitForFunction(() => { const a = document.querySelector('#mplay audio'); return a && a.readyState >= 1 && a.duration > 5; }, null, { timeout: 5000 });
    await page.waitForFunction(() => { const a = document.querySelector('#mplay audio'); return a && !a.paused && a.currentTime > 0; }, null, { timeout: 5000 });
    await page.click('[data-act=mediaClose]'); assert.strictEqual(await page.locator('#mplay audio').count(), 0);
  });
  await test('in Traditional Chinese the buttons, subtitles and player are in Chinese, and they fit a 390px phone', async () => {
    await setMedia({}, 'zh'); await page.waitForSelector('.mtile');
    await hubLevel('beginner');
    const m = await mediaTexts();
    assert.deepStrictEqual(m.map(x => [x.title, x.sub]), [['觀看影片', '立即觀看：英文影片'], ['收聽深入對談', '立即收聽：關於這些單字的中文對談']]);
    await setMedia(only('beginner', { video: DRIVE, talk: '' }));
    await page.setViewportSize({ width: 390, height: 844 }); await page.click('.mtile[data-kind=video]'); await page.waitForSelector('#mplay iframe'); await page.waitForTimeout(300);
    assert.strictEqual((await page.textContent('#mplay a.sub')).trim(), '在新分頁開啟'); assert.strictEqual((await page.textContent('#mplay .top b')).trim(), '觀看影片');
    const r = await page.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth, boxes: Array.from(document.querySelectorAll('.mtile, #mplay iframe')).map(e => { const b = e.getBoundingClientRect(); return [b.left, b.right, b.height]; }) }));
    assert(r.over <= 1, 'overflow ' + r.over); assert(r.boxes.every(([l, rr]) => l >= 0 && rr <= 390), JSON.stringify(r.boxes)); assert(r.boxes[r.boxes.length - 1][2] > 150, 'the video frame has a usable height');
    await page.setViewportSize({ width: 1280, height: 900 });
    await setMedia({}, 'en'); await page.waitForSelector('.mtile');
    assert.strictEqual((await mediaTexts())[0].title, 'Watch the video');
  });
  await test('where this window refuses other sites’ players, the panel says so and offers a new tab', async () => {
    const before = consoleErrors.length;
    await setLevel('beginner'); await go('#/batch/b001', '.mtile');
    await page.evaluate(() => { const m = document.createElement('meta'); m.httpEquiv = 'Content-Security-Policy'; m.content = "frame-src 'none'"; document.head.appendChild(m); });
    await setMedia(only('beginner', { video: DRIVE, talk: '' }));
    await page.click('.mtile[data-kind=video]'); await page.waitForSelector('#mplay .mframe.blocked', { timeout: 4000 });
    assert.strictEqual((await page.textContent('#mplay .mframe.blocked p')).trim(), 'Open it in a new tab to play it.');
    const a = await page.$eval('#mplay .mframe.blocked a.btn.primary', x => [x.textContent.trim(), x.href, x.target]); assert.deepStrictEqual(a, ['Open in a new tab', DRIVE, '_blank']);
    consoleErrors.splice(before); // the browser's own "refused to frame" message is the expected result here
    await page.reload(); await page.waitForSelector('.mtile'); // clears the test policy
  });

  console.log('Games and the other stations');
  await test('Missing Letters (advanced) plays through all 20 words', async () => {
    await setLevel('advanced'); await go('#/play/missing/b001', '.slots');
    for (let n = 0; n < 20; n++) {
      await page.waitForSelector('.slots'); if (await page.locator('[data-act=bHint]').count()) await page.click('[data-act=bHint]');
      const hint = await hintText(page); const w = wordByZh(hint); assert(w, 'word for ' + hint);
      const ks = await page.$$eval('.slot.dz', els => els.map(e => +e.dataset.k));
      for (const k of ks) await page.locator('#tiles .chip[data-ch="' + w.headword[k] + '"]').first().click();
      await page.waitForSelector('[data-act=bNext]');
      assert.strictEqual((await page.textContent('[data-act=bNext]')).trim(), n === 19 ? 'See my score' : 'Next word');
      await page.click('[data-act=bNext]');
    }
    await page.waitForSelector('.banner');
    const e = await endScreen(page); assert.strictEqual(e.primary, 'Back to Games'); assert(e.href.endsWith('#/games')); assert.deepStrictEqual(e.alts, ['Play this game again']); assert.strictEqual(e.steps, 0);
    await page.click('.finish [data-act=replay]'); await page.waitForSelector('.slots'); // play again starts the game over
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
