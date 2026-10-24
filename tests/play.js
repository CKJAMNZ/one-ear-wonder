// node tests/play.js [url]   (default http://localhost:8766/index.html)
const { chromium, webkit } = require('/workspace/pwt/node_modules/playwright');
const URL = process.argv[2] || 'http://localhost:8766/index.html';
const TAG = process.argv[3] || 'local';
const SHOTS = __dirname + '/../shots/';
let pass = 0, fail = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); c ? pass++ : fail++; };
const VPS = { phone: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
              ipad: { viewport: { width: 1024, height: 768 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 } };
(async () => {
  for (const [en, bt] of [['chromium', chromium], ['webkit', webkit]]) {
    const b = await bt.launch();
    for (const [vn, opt] of Object.entries(VPS)) {
      const n = `${en}/${vn}`, errs = [];
      const page = await (await b.newContext(opt)).newPage();
      page.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
      page.on('pageerror', e => errs.push(String(e)));
      await page.goto(URL); await page.waitForTimeout(400);
      await page.screenshot({ path: `${SHOTS}${TAG}-${en}-${vn}-1-start.png` });
      await page.click('#go'); await page.waitForTimeout(200);
      ok(await page.evaluate(() => OEW.state === 'play'), n + ' play starts');
      // keyboard
      await page.evaluate(() => { OEW.sounds = []; });
      let x0 = await page.evaluate(() => OEW.p.x);
      await page.keyboard.down('ArrowRight'); await page.waitForTimeout(300); await page.keyboard.up('ArrowRight');
      let x1 = await page.evaluate(() => OEW.p.x); ok(x1 > x0 + 10, `${n} keyboard ArrowRight moves (${x0.toFixed(0)}->${x1.toFixed(0)})`);
      let y0 = await page.evaluate(() => OEW.p.y);
      await page.keyboard.down('KeyW'); await page.waitForTimeout(300); await page.keyboard.up('KeyW');
      ok(await page.evaluate(() => OEW.p.y) < y0 - 10, n + ' keyboard W moves up');
      // button
      x0 = await page.evaluate(() => OEW.p.x);
      await page.locator('#left').dispatchEvent('pointerdown', { pointerId: 5, pointerType: 'touch' }); await page.waitForTimeout(300);
      await page.locator('#left').dispatchEvent('pointerup', { pointerId: 5, pointerType: 'touch' });
      x1 = await page.evaluate(() => OEW.p.x); ok(x1 < x0 - 10, `${n} on-screen button moves left`);
      // touch drag (with a button held: drag must win)
      const tgt = await page.evaluate(() => ({ x: OEW.p.x + 100, y: OEW.p.y + 120 }));
      await page.evaluate(t => { OEW.btn.left = true; const c = document.getElementById('c');
        const ev = (ty, x, y) => c.dispatchEvent(new PointerEvent(ty, { pointerId: 9, pointerType: 'touch', clientX: x, clientY: y, bubbles: true }));
        ev('pointerdown', t.x, t.y); window._ev = ev; }, tgt);
      await page.waitForTimeout(700);
      const pd = await page.evaluate(() => ({ x: OEW.p.x, y: OEW.p.y }));
      await page.evaluate(t => { window._ev('pointerup', t.x, t.y); OEW.btn.left = false; }, tgt);
      ok(Math.hypot(pd.x - tgt.x, pd.y - tgt.y) < 30, `${n} touch drag moves toward finger, beats held button`);
      // collect
      await page.evaluate(() => { OEW.sounds = []; });
      await page.evaluate(() => { const s = OEW.sounds; s.push({ x: OEW.p.x + 120, y: OEW.p.y, k: { n: 'bell', e: '🔔', c: '#ffb703', f: 660 }, ph: 0 }); });
      ok(await page.evaluate(() => OEW.near() < 260), n + ' hearing radar sees nearby sound');
      await page.screenshot({ path: `${SHOTS}${TAG}-${en}-${vn}-2-ear-glow.png` });
      const c0 = await page.evaluate(() => OEW.count);
      await page.keyboard.down('ArrowRight'); await page.waitForTimeout(500); await page.keyboard.up('ArrowRight');
      const c1 = await page.evaluate(() => OEW.count);
      ok(c1 === c0 + 1 && (await page.textContent('#count')) === String(c1), `${n} collecting a sound increases count (${c0}->${c1})`);
      // win
      await page.evaluate(() => { while (OEW.count < OEW.GOAL) OEW.collect(OEW.sounds[0]); });
      await page.waitForTimeout(200);
      ok(await page.isVisible('#win') && await page.evaluate(() => OEW.state === 'win'), n + ' win screen at 10');
      await page.screenshot({ path: `${SHOTS}${TAG}-${en}-${vn}-3-win.png` });
      await page.click('#again'); await page.waitForTimeout(200);
      ok(await page.evaluate(() => OEW.state === 'play' && OEW.count === 0 && OEW.sounds.length === 3) && !(await page.isVisible('#win')), n + ' play again resets');
      ok(await page.evaluate(() => { const c = document.getElementById('c'); return c.clientWidth === innerWidth && c.clientHeight === innerHeight; }), n + ' canvas fills viewport');
      ok(errs.length === 0, n + ' no console errors ' + JSON.stringify(errs));
    }
    await b.close();
  }
  console.log(`\n${pass} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
})();
