const { chromium } = require('C:/Users/Victor/AppData/Roaming/npm/node_modules/playwright');

const EVIDENCE = 'C:/rasa/workspaces/artes-dan/.sprintfy/evidence';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/catalogo', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);

  // Try each artist with R$3000+ to find one with no high-price works
  const artistOptions = await page.$$eval('select:first-of-type option', opts =>
    opts.filter(o => o.value !== '').map(o => ({ value: o.value, name: o.textContent }))
  );

  let emptyStateFound = false;
  for (const artist of artistOptions) {
    await page.selectOption('select:first-of-type', artist.value);
    // click the "Ate R$500" button - cheap price for artists who only have expensive works
    // Actually try technique filter with artist that doesn't match any technique
    const allBtns = await page.$$('button');
    // Reset to Todos price first
    for (const btn of allBtns) {
      const txt = await btn.textContent();
      if (txt && txt.trim() === 'Todos') { await btn.click(); break; }
    }
    await page.waitForTimeout(200);

    // Now select a technique that may not match this artist
    const techOptions = await page.$$eval('select:last-of-type option', opts =>
      opts.filter(o => o.value !== '').map(o => o.value)
    );

    if (techOptions.length > 1) {
      // Try last technique with this artist
      const lastTech = techOptions[techOptions.length - 1];
      await page.selectOption('select:last-of-type', lastTech);
      await page.waitForTimeout(300);

      const count = (await page.$$('article')).length;
      const emptyEl = await page.$('text=Nenhuma obra encontrada');

      if (emptyEl) {
        console.log(`EMPTY STATE found: artist "${artist.name}" + technique "${lastTech}"`);
        await page.screenshot({ path: `${EVIDENCE}/check9-empty-state.png`, fullPage: true });
        emptyStateFound = true;
        break;
      }

      // Reset technique
      await page.selectOption('select:last-of-type', '');
      await page.waitForTimeout(200);
    }

    // Reset artist too
    await page.selectOption('select:first-of-type', '');
    await page.waitForTimeout(200);
  }

  if (!emptyStateFound) {
    // Force empty state: use R$1500-R$3000 range with a specific artist
    // Find an artist with only cheap (< R$1500) or expensive (> R$3000) works
    // Let's try artist filter + very specific price range
    for (const artist of artistOptions) {
      await page.selectOption('select:first-of-type', artist.value);

      // Try "R$500-R$1500" range
      const allBtns2 = await page.$$('button');
      for (const btn of allBtns2) {
        const txt = await btn.textContent();
        if (txt && txt.includes('1500') && txt.includes('500')) { await btn.click(); break; }
      }
      await page.waitForTimeout(300);

      const count = (await page.$$('article')).length;
      const emptyEl = await page.$('text=Nenhuma obra encontrada');

      if (emptyEl) {
        console.log(`EMPTY STATE found: artist "${artist.name}" + R$500-R$1500`);
        await page.screenshot({ path: `${EVIDENCE}/check9-empty-state.png`, fullPage: true });
        emptyStateFound = true;
        break;
      }

      // Reset
      const clearBtnEl = await page.$('button:has-text("Limpar filtros")');
      if (clearBtnEl) { await clearBtnEl.click(); await page.waitForTimeout(200); }
    }
  }

  console.log('EMPTY STATE FOUND:', emptyStateFound);

  await browser.close();
}

run().catch(e => { console.error('TEST FAILED:', e.message); process.exit(1); });
