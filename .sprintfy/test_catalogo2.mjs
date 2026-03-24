import { chromium } from 'C:/Users/Victor/AppData/Roaming/npm/node_modules/playwright/index.mjs';

const EVIDENCE = 'C:/rasa/workspaces/artes-dan/.sprintfy/evidence';

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

const errors = [];
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

// CHECK 1: Navigate to catalog page
await page.goto('http://localhost:3000/catalogo', { waitUntil: 'networkidle' });
await page.waitForTimeout(1500);
await page.screenshot({ path: `${EVIDENCE}/check1-initial-load.png`, fullPage: true });

// Gather page info
const title = await page.textContent('h1');
const totalWorksText = await page.textContent('header p');
const resultsCountText = await page.textContent('section p.mt-3');
const artistOptions = await page.$$eval('select:first-of-type option', opts => opts.map(o => o.textContent));
const techniqueOptions = await page.$$eval('select:last-of-type option', opts => opts.map(o => o.textContent));
const cards = await page.$$('article');
const priceButtons = await page.$$eval('button', btns => btns.map(b => b.textContent.trim()).filter(t => t.includes('R$') || t === 'Todos'));

console.log('TITLE:', title);
console.log('TOTAL WORKS:', totalWorksText);
console.log('RESULTS COUNT:', resultsCountText);
console.log('ARTIST OPTIONS:', JSON.stringify(artistOptions));
console.log('TECHNIQUE OPTIONS:', JSON.stringify(techniqueOptions));
console.log('CARDS COUNT:', cards.length);
console.log('PRICE BUTTONS:', JSON.stringify(priceButtons));
console.log('CONSOLE ERRORS:', JSON.stringify(errors));

// CHECK 2: Test artist filter - select first non-all artist
const firstArtistValue = await page.$eval('select:first-of-type option:nth-child(2)', o => o.value);
const firstArtistName = await page.$eval('select:first-of-type option:nth-child(2)', o => o.textContent);
await page.selectOption('select:first-of-type', firstArtistValue);
await page.waitForTimeout(500);
await page.screenshot({ path: `${EVIDENCE}/check2-artist-filter.png`, fullPage: true });
const filteredCount = (await page.$$('article')).length;
const resultsAfterArtist = await page.textContent('section p.mt-3');
console.log('ARTIST FILTER name:', firstArtistName, 'cards:', filteredCount, 'results text:', resultsAfterArtist);

// CHECK 3: Clear filters button appears and works
const clearBtn = await page.$('button:has-text("Limpar filtros")');
console.log('CLEAR BUTTON VISIBLE:', !!clearBtn);
if (clearBtn) {
  await clearBtn.click();
  await page.waitForTimeout(500);
}
const afterClearCount = (await page.$$('article')).length;
const clearBtnGone = !(await page.$('button:has-text("Limpar filtros")'));
console.log('AFTER CLEAR cards:', afterClearCount, 'clear btn gone:', clearBtnGone);
await page.screenshot({ path: `${EVIDENCE}/check3-clear-filters.png`, fullPage: true });

// CHECK 4: Test technique filter
const techniqueVal = await page.$eval('select:last-of-type option:nth-child(2)', o => o.value).catch(() => null);
if (techniqueVal) {
  await page.selectOption('select:last-of-type', techniqueVal);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${EVIDENCE}/check4-technique-filter.png`, fullPage: true });
  const techCount = (await page.$$('article')).length;
  const techResults = await page.textContent('section p.mt-3');
  console.log('TECHNIQUE FILTER val:', techniqueVal, 'cards:', techCount, 'results:', techResults);
  const clearBtn2 = await page.$('button:has-text("Limpar filtros")');
  if (clearBtn2) { await clearBtn2.click(); await page.waitForTimeout(300); }
}

// CHECK 5: Test price range button (find Ate R$500 or similar)
const allBtns = await page.$$('button');
let priceBtnAte = null;
for (const btn of allBtns) {
  const txt = await btn.textContent();
  if (txt && txt.includes('500') && txt.includes('R$')) { priceBtnAte = btn; break; }
}
if (priceBtnAte) {
  await priceBtnAte.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${EVIDENCE}/check5-price-filter.png`, fullPage: true });
  const priceCount = (await page.$$('article')).length;
  const priceResults = await page.textContent('section p.mt-3');
  console.log('PRICE FILTER cards:', priceCount, 'results:', priceResults);
  const clearBtn3 = await page.$('button:has-text("Limpar filtros")');
  if (clearBtn3) { await clearBtn3.click(); await page.waitForTimeout(300); }
}

// CHECK 6: Test R$3000+ filter
const allBtns2 = await page.$$('button');
let highPriceBtn = null;
for (const btn of allBtns2) {
  const txt = await btn.textContent();
  if (txt && txt.includes('3000')) { highPriceBtn = btn; break; }
}
if (highPriceBtn) {
  await highPriceBtn.click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${EVIDENCE}/check6-high-price-filter.png`, fullPage: true });
  const highPriceCount = (await page.$$('article')).length;
  const emptyState = await page.$('text=Nenhuma obra encontrada');
  console.log('HIGH PRICE FILTER cards:', highPriceCount, 'empty state:', !!emptyState);
  const clearBtn4 = await page.$('button:has-text("Limpar filtros")');
  if (clearBtn4) { await clearBtn4.click(); await page.waitForTimeout(300); }
}

// CHECK 7: Mobile responsive layout
await context.close();
const mobileContext = await browser.newContext({ viewport: { width: 375, height: 812 } });
const mobilePage = await mobileContext.newPage();
await mobilePage.goto('http://localhost:3000/catalogo', { waitUntil: 'networkidle' });
await mobilePage.waitForTimeout(1500);
await mobilePage.screenshot({ path: `${EVIDENCE}/check7-mobile-layout.png`, fullPage: true });
const mobileCards = await mobilePage.$$('article');
console.log('MOBILE CARDS:', mobileCards.length);
await mobileContext.close();

// CHECK 8: Empty state - try combining artist + high price
const desktopContext = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const desktopPage = await desktopContext.newPage();
await desktopPage.goto('http://localhost:3000/catalogo', { waitUntil: 'networkidle' });
await desktopPage.waitForTimeout(1000);
const artist2Val = await desktopPage.$eval('select:first-of-type option:nth-child(2)', o => o.value);
await desktopPage.selectOption('select:first-of-type', artist2Val);
const allBtns3 = await desktopPage.$$('button');
let highBtn2 = null;
for (const btn of allBtns3) {
  const txt = await btn.textContent();
  if (txt && txt.includes('3000')) { highBtn2 = btn; break; }
}
if (highBtn2) await highBtn2.click();
await desktopPage.waitForTimeout(500);
const emptyCheck = await desktopPage.$('text=Nenhuma obra encontrada');
const emptyCount = (await desktopPage.$$('article')).length;
console.log('EMPTY STATE TEST: empty element found:', !!emptyCheck, 'cards:', emptyCount);
if (emptyCheck) {
  await desktopPage.screenshot({ path: `${EVIDENCE}/check8-empty-state.png`, fullPage: true });
  console.log('EMPTY STATE SCREENSHOT TAKEN');
} else {
  await desktopPage.screenshot({ path: `${EVIDENCE}/check8-combined-filters.png`, fullPage: true });
  console.log('COMBINED FILTERS - no empty state');
}

// CHECK 9: Gradient backgrounds on cards
await desktopPage.goto('http://localhost:3000/catalogo', { waitUntil: 'networkidle' });
await desktopPage.waitForTimeout(1000);
const gradients = await desktopPage.$$eval('article div[style]', divs => divs.slice(0,3).map(d => d.style.background));
console.log('GRADIENT BACKGROUNDS:', JSON.stringify(gradients));

// CHECK 10: hover effects - check group class on article
const hasGroupClass = await desktopPage.$eval('article:first-child', el => el.classList.contains('group'));
console.log('HAS HOVER GROUP CLASS:', hasGroupClass);

await browser.close();
console.log('ALL TESTS DONE');
