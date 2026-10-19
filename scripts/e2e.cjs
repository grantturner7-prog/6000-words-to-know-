#!/usr/bin/env node
/* End-to-end test: plays Batch 1 in a real browser, at all three levels.
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
  await test('Batches shows Batch 1 open and the rest coming soon', async () => {
    await go('#/batches', '.bgrid');
    assert.strictEqual(await page.locator('.bcard.open').count(), 1);
    assert((await page.locator('.bcard.locked').count()) >= 40);
  });

  console.log('Meet: cards, Match it, Build it');
  await test('Chinese switch hides and shows the Chinese meaning on a word card', async () => {
    await setLevel('beginner'); await go('#/batch/b001/meet/1', '.wcard');
    assert(await page.locator('.wcard .zh').count() === 1);
    await page.click('[data-zhsw]'); await page.waitForFunction(() => !document.querySelector('.wcard .zh'));
    await page.click('[data-zhsw]'); await page.waitForSelector('.wcard .zh');
  });
  await test('tapping the highlighted word opens Word Peek with English and Chinese', async () => {
    await page.click('.wcard .ex .hl'); await page.waitForSelector('#pop:not([hidden])');
    const txt = await page.textContent('#pop'); assert(txt.includes('Not fun or interesting.') && txt.includes('無聊的'));
    await page.keyboard.press('Escape');
  });
  await test('Meet set 1: five cards, drag-and-drop matching, letter building, set marked complete', async () => {
    for (let i = 0; i < 5; i++) await page.click('[data-act=cardNext]');
    await page.waitForSelector('.match');
    const ids = await page.$$eval('.match .col:first-child .chip', els => els.map(e => e.dataset.w));
    // one wrong drop first
    const wrongZone = await page.$$eval('.mean', (els, id) => els.find(e => e.dataset.w !== id).dataset.w, ids[0]);
    await drag(page, '.chip[data-w="' + ids[0] + '"]', '.mean[data-w="' + wrongZone + '"]'); await page.waitForTimeout(150);
    assert.strictEqual(await page.locator('.mean.done').count(), 0, 'a wrong drop must not lock');
    for (const id of ids) await drag(page, '.match .chip[data-w="' + id + '"]:not(.ok)', '.mean[data-w="' + id + '"]');
    await page.waitForSelector('.slots', { timeout: 5000 });
    for (let n = 0; n < 5; n++) {
      await page.waitForSelector('.slots');
      const hint = await hintText(page); const w = wordByZh(hint); assert(w, 'word for hint ' + hint);
      if (n === 0) { // a wrong spelling first, then the right one
        const letters = w.headword.split('').reverse();
        for (const ch of letters) await page.locator('#tiles .chip[data-ch="' + ch + '"]').first().click();
        await page.waitForSelector('.slot.wrong', { timeout: 2000 }); await page.waitForFunction(() => !document.querySelector('.slot.wrong'), null, { timeout: 4000 });
      }
      for (const ch of w.headword.split('')) { const t = page.locator('#tiles .chip[data-ch="' + ch + '"]').first(); if (await t.count()) await t.click(); }
      await page.waitForSelector('[data-act=bNext]', { timeout: 3000 }); await page.click('[data-act=bNext]');
    }
    await page.waitForSelector('.banner');
    assert.strictEqual((await state(page)).progress.b001.beginner.meet[0], 1);
  });

  for (const lv of ['beginner', 'intermediate', 'advanced']) {
    console.log('Level: ' + lv);
    await test(lv + ': Pick the word, with a wrong answer, drag and tap', async () => {
      await setLevel(lv); await go('#/batch/b001/use/pick/1', '.sentence');
      for (let n = 0; n < 10; n++) {
        const sentence = (await page.textContent('.sentence')).trim();
        const w = B.words.find(x => { const m = x.examples[lv].match(/^(.*)\{([^{}]+)\}(.*)$/); return (m[1] + '?' + m[3]).trim() === sentence; });
        assert(w, 'which word? ' + sentence);
        if (n === 0) { const wrong = w.pick[lv][0]; await page.click('.chip[data-h="' + wrong + '"]'); await page.waitForTimeout(200); assert(!(await page.locator('.gap.right').count())); }
        if (n % 2 === 0) await drag(page, '.chip[data-h="' + w.headword + '"]', '#gap'); else await page.click('.chip[data-h="' + w.headword + '"]');
        await page.waitForSelector('.gap.right', { timeout: 2000 }); await page.click('[data-act=pNext]');
      }
      await page.waitForSelector('.banner'); const s = await state(page); assert(s.progress.b001[lv].pick[0] !== null);
    });
    await test(lv + ': Sentence Maker builds correct sentences from tiles', async () => {
      await go('#/batch/b001/use/maker/1', '.maker');
      for (let n = 0; n < 10; n++) {
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
    await test(lv + ': Spelling Bee accepts the right spelling and rejects a look-alike', async () => {
      await go('#/batch/b001/use/bee/1', '.opts');
      const heads = B.words.map(w => w.headword);
      for (let n = 0; n < 10; n++) {
        const opts = await page.$$eval('.opt', els => els.map(e => e.dataset.o)); const right = opts.find(o => heads.includes(o)); assert(right);
        if (n === 0) { const wrong = opts.find(o => o !== right); await page.click('.opt[data-o="' + wrong + '"]'); await page.waitForSelector('.opt.wrong'); }
        await page.click('.opt[data-o="' + right + '"]'); await page.waitForSelector('[data-act=beeNext]'); await page.click('[data-act=beeNext]');
      }
      await page.waitForSelector('.banner');
    });
    await test(lv + ': Story parts 1 and 2 by drag and tap, wrong answers handled, star earned', async () => {
      for (const part of [1, 2]) {
        await go('#/batch/b001/story/' + part, '.story');
        const gaps = B.stories[lv].parts[part - 1].gaps;
        // put two words in each other's gaps, check, expect two wrong
        await drag(page, '.chip[data-k="0"]', '.gap[data-g="1"]'); await page.click('.chip[data-k="1"]'); await page.click('.gap[data-g="0"]');
        await page.click('[data-act=sCheck]'); await page.waitForSelector('.gap.wrong');
        assert.strictEqual(await page.locator('.gap.wrong').count(), 2);
        await page.waitForFunction(() => !document.querySelector('.gap.wrong') && document.querySelectorAll('#bank .chip').length === 10, null, { timeout: 4000 });
        for (let k = 0; k < gaps.length; k++) {
          if (k % 3 === 0) await drag(page, '#bank .chip[data-k="' + k + '"]', '.gap[data-g="' + k + '"]');
          else { await page.click('#bank .chip[data-k="' + k + '"]'); await page.click('.gap[data-g="' + k + '"]'); }
        }
        assert.strictEqual(await page.locator('.gap .chip').count(), 10);
        await page.click('[data-act=sCheck]'); await page.waitForSelector('.gap.right >> nth=9', { timeout: 3000 });
        assert.strictEqual(await page.locator('.gap.right').count(), 10);
        assert.strictEqual((await state(page)).progress.b001[lv].story[part - 1], 1);
      }
      const s = await state(page); const p = s.progress.b001[lv]; assert(p.story[0] && p.story[1], 'both parts done = star');
    });
  }

  console.log('Games and the other stations');
  await test('Missing Letters (advanced) plays through', async () => {
    await setLevel('advanced'); await go('#/play/missing/b001/1', '.slots');
    for (let n = 0; n < 10; n++) {
      await page.waitForSelector('.slots'); if (await page.locator('[data-act=bHint]').count()) await page.click('[data-act=bHint]');
      const hint = await hintText(page); const w = wordByZh(hint); assert(w, 'word for ' + hint);
      const ks = await page.$$eval('.slot.dz', els => els.map(e => +e.dataset.k));
      for (const k of ks) await page.locator('#tiles .chip[data-ch="' + w.headword[k] + '"]').first().click();
      await page.waitForSelector('[data-act=bNext]'); await page.click('[data-act=bNext]');
    }
    await page.waitForSelector('.banner');
  });
  await test('Build it from the Games tab (intermediate decoys) plays through', async () => {
    await setLevel('intermediate'); await go('#/play/build/b001/2', '.slots');
    for (let n = 0; n < 10; n++) {
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
    const s = await state(page); const stars = ['beginner', 'intermediate', 'advanced'].filter(l => s.progress.b001[l].story[0] && s.progress.b001[l].story[1]).length; assert.strictEqual(stars, 3);
  });
  await test('progress survives a page reload', async () => {
    await go('#/today', '.ring'); await page.reload(); await page.waitForSelector('.ring');
    assert((await page.textContent('.hdr h1')).includes('Amy')); assert(Number(await page.textContent('.grid.g3 .stat:nth-child(2) b')) === 3);
  });

  await test('Clear my progress asks inside the page, then clears stars and sentences', async () => {
    await go('#/progress', '.stat'); await page.click('[data-act=resetAsk]'); await page.waitForSelector('[data-act=resetYes]');
    await page.click('[data-act=resetNo]'); await page.waitForSelector('[data-act=resetAsk]');
    await page.click('[data-act=resetAsk]'); await page.click('[data-act=resetYes]'); await page.waitForFunction(() => document.querySelector('.stat b').textContent === '0');
    const s = await state(page); assert.deepStrictEqual(s.progress, {}); assert.strictEqual(s.sentences.length, 0);
  });

  console.log('Phone width');
  await test('no sideways scrolling on the main screens at 390px wide', async () => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const [h, sel] of [['#/today', '.ring'], ['#/batches', '.bgrid'], ['#/batch/b001', '.station'], ['#/games', '.station'], ['#/progress', '.stat'], ['#/batch/b001/meet/1', '.wcard'], ['#/batch/b001/story/1', '.story'], ['#/batch/b001/use/maker/1', '.maker']]) {
      await go(h, sel); const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth); assert(over <= 1, h + ' overflows by ' + over + 'px');
    }
  });
  await test('no console errors during the whole run', async () => { assert.deepStrictEqual(consoleErrors, []); });

  await browser.close(); srv.close();
  console.log('\n' + pass + ' passed, ' + fails.length + ' failed'); if (fails.length) { console.log(fails.join('\n')); process.exit(1); }
})().catch(e => { console.error(e); process.exit(1); });
