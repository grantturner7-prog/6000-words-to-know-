#!/usr/bin/env node
/* Print HTML pages to PDF with Chromium. Reads a JSON list on stdin: [{html, pdf, footer}, ...].
   Run through scripts/make_level_pdfs.py. Needs the "playwright" package (NODE_PATH=$(npm root -g)). */
const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const jobs = JSON.parse(fs.readFileSync(0, 'utf8'));
  const chrome = process.env.CHROME || ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome'].find(p => fs.existsSync(p));
  const browser = await chromium.launch(chrome ? { executablePath: chrome, args: ['--no-sandbox'] } : { args: ['--no-sandbox'] });
  for (const j of jobs) {
    const page = await browser.newPage();
    await page.setContent(j.html, { waitUntil: 'load' });
    await page.emulateMedia({ media: 'print' });
    await page.pdf({
      path: j.pdf, format: 'A4', printBackground: true, displayHeaderFooter: true,
      margin: { top: '15mm', bottom: '17mm', left: '15mm', right: '15mm' },
      headerTemplate: '<div></div>',
      footerTemplate: '<div style="width:100%;font-size:8px;color:#7a8494;text-align:center;font-family:Inter,sans-serif">' + j.footer + ' · <span class="pageNumber"></span> / <span class="totalPages"></span></div>'
    });
    await page.close(); console.log('wrote', j.pdf);
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
