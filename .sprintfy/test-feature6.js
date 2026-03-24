const playwright = require('C:/Users/Victor/AppData/Roaming/npm/node_modules/playwright');
const chromium = playwright.chromium;

const EVIDENCE_DIR = 'C:\\rasa\\workspaces\\artes-dan\\.sprintfy\\evidence';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== FEATURE #6: Cadastro de novo artista ===');

  // Step 1: Navigate to /cadastrar
  await page.goto('http://localhost:3000/cadastrar');
  await page.waitForLoadState('networkidle');
  console.log('Navigated to /cadastrar');

  // Take initial screenshot
  await page.screenshot({ path: `${EVIDENCE_DIR}\\f6-step1-initial.png` });
  console.log('Screenshot: f6-step1-initial.png');

  // Step 2: Check page structure
  const pageTitle = await page.title();
  console.log('Page title:', pageTitle);

  // Inspect inputs on the page
  const inputs = await page.$$('input');
  console.log('Total inputs:', inputs.length);
  for (let i = 0; i < inputs.length; i++) {
    const placeholder = await inputs[i].getAttribute('placeholder');
    const id = await inputs[i].getAttribute('id');
    const name = await inputs[i].getAttribute('name');
    const type = await inputs[i].getAttribute('type');
    console.log(`  Input ${i}: type="${type}", placeholder="${placeholder}", id="${id}", name="${name}"`);
  }

  // List all buttons
  const buttons = await page.$$('button');
  console.log('Total buttons:', buttons.length);
  for (let i = 0; i < buttons.length; i++) {
    const text = await buttons[i].textContent();
    const type = await buttons[i].getAttribute('type');
    console.log(`  Button ${i}: type="${type}", text="${text?.trim()}"`);
  }

  // Step 3: Find artist name input
  let nameInput = null;
  const nameSelectors = [
    'input[placeholder*="Nome"]',
    'input[placeholder*="nome"]',
    'input[id*="name"]',
    'input[id*="artista"]',
    'input[name="name"]',
    'input[name="artistName"]',
  ];
  for (const sel of nameSelectors) {
    nameInput = await page.$(sel);
    if (nameInput) {
      console.log(`Found name input with selector: ${sel}`);
      break;
    }
  }

  if (!nameInput && inputs.length > 0) {
    nameInput = inputs[0];
    console.log('Using first input as name input');
  }

  if (nameInput) {
    await nameInput.fill('Artista Teste QA');
    console.log('Filled artist name: Artista Teste QA');
  }

  // Step 4: Add a characteristic tag
  let tagInput = null;
  const tagSelectors = [
    'input[placeholder*="caracteristica"]',
    'input[placeholder*="Caracteristica"]',
    'input[placeholder*="tag"]',
    'input[placeholder*="Tag"]',
    'input[placeholder*="Adicione"]',
    'input[placeholder*="adicione"]',
  ];
  for (const sel of tagSelectors) {
    tagInput = await page.$(sel);
    if (tagInput) {
      console.log(`Found tag input with selector: ${sel}`);
      break;
    }
  }

  if (!tagInput && inputs.length > 1) {
    tagInput = inputs[1];
    console.log('Using second input as tag input');
  }

  if (tagInput) {
    await tagInput.fill('Abstrato');
    await tagInput.press('Enter');
    console.log('Added tag: Abstrato');
    await page.waitForTimeout(300);
  }

  // Take screenshot after filling
  await page.screenshot({ path: `${EVIDENCE_DIR}\\f6-step2-filled.png` });
  console.log('Screenshot: f6-step2-filled.png');

  // Step 5: Submit the form
  let submitted = false;
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("Cadastrar")',
    'button:has-text("Salvar")',
    'button:has-text("Registrar")',
  ];
  for (const sel of submitSelectors) {
    try {
      const btn = await page.$(sel);
      if (btn) {
        console.log(`Found submit button: ${sel}`);
        await btn.click();
        submitted = true;
        console.log('Clicked submit button');
        break;
      }
    } catch(e) {
      console.log(`Error with selector ${sel}:`, e.message);
    }
  }

  if (!submitted) {
    console.log('ERROR: Submit button NOT found');
  }

  await page.waitForTimeout(1500);

  // Step 6: Check for success message
  const bodyAfter = await page.textContent('body');
  const hasSuccess = bodyAfter.toLowerCase().includes('sucesso') ||
                     bodyAfter.toLowerCase().includes('cadastrado') ||
                     bodyAfter.toLowerCase().includes('salvo') ||
                     bodyAfter.toLowerCase().includes('registrado');
  console.log('Body has success text:', hasSuccess);

  // Check specific success elements
  const alertEl = await page.$('[role="alert"]');
  if (alertEl) {
    const alertText = await alertEl.textContent();
    console.log('Alert text:', alertText);
  }

  // Step 7: Final screenshot
  await page.screenshot({ path: `${EVIDENCE_DIR}\\f6-step3-after-submit.png` });
  console.log('Screenshot: f6-step3-after-submit.png');

  await browser.close();
  console.log('=== FEATURE #6 TEST COMPLETE ===');
  console.log('RESULT:', hasSuccess ? 'PASS' : 'NEED_INVESTIGATION');

  process.exit(hasSuccess ? 0 : 1);
})().catch(err => {
  console.error('TEST FAILED:', err.message);
  console.error(err.stack);
  process.exit(1);
});
