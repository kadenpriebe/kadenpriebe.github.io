const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 1000 } });
    await page.setContent(`<style>${fs.readFileSync('style.css', 'utf8')}</style>
      <main><ul><li class="note foldable open"><div class="note-body" data-sketches='[{"x":100,"y":60,"w":300,"h":500,"items":[]}]'><p>A short draft with a tall drawing.</p></div><div class="tags">biotech</div></li><li id="next">Next draft</li></ul></main>`);
    const source = fs.readFileSync('site.js', 'utf8');
    await page.addScriptTag({ content: `const sketchSVG = s => '<svg width="'+s.w+'" height="'+s.h+'"></svg>';\n${source.slice(source.indexOf('function placeSketches('), source.indexOf('// Re-place them'))}` });
    const check = async () => page.evaluate(() => {
      const body = document.querySelector('[data-sketches]');
      placeSketches(body);
      const sketch = body.querySelector('.sketch').getBoundingClientRect();
      return { bottom: sketch.bottom, tags: document.querySelector('.tags').getBoundingClientRect().top, height: body.getBoundingClientRect().height };
    });
    let result = await check();
    assert(result.tags >= result.bottom, 'Drawing must end before tags and the next draft');
    assert.deepEqual(await check(), result, 'Repeated layout must remain stable');
    await page.setViewportSize({ width: 350, height: 1000 });
    result = await check();
    assert(result.tags >= result.bottom, 'Narrow-screen inline drawing must fit before tags');
    await page.setViewportSize({ width: 1100, height: 1000 });
    await check();
    await page.evaluate(() => {
      document.querySelector('main').classList.add('collapsed');
      document.querySelector('.note').classList.remove('open');
      placeSketches(document.querySelector('[data-sketches]'));
    });
    assert.equal(await page.locator('.sketch-space').count(), 0, 'Collapsed drafts must not reserve drawing space');
    await page.evaluate(() => document.querySelector('.note').classList.add('open'));
    result = await check();
    assert(result.tags >= result.bottom, 'Reopening a draft must restore drawing space');
    await page.evaluate(() => { document.querySelector('[data-sketches]').dataset.sketches = '[]'; placeSketches(document.querySelector('[data-sketches]')); });
    assert(await page.locator('[data-sketches]').evaluate(el => el.getBoundingClientRect().height < 100), 'Removing a drawing must release its space');
    console.log('PASS: tall drawing containment, stable relayout, narrow viewport, collapse/reopen, and removal');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
