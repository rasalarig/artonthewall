const playwright = require('C:/Users/Victor/AppData/Roaming/npm/node_modules/playwright');
const chromium = playwright.chromium;

const EVIDENCE_DIR = 'C:\\rasa\\workspaces\\artes-dan\\.sprintfy\\evidence';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('=== FEATURE #7: Cadastro de obra para um artista ===');

  // Step 1: First register an artist so we have one available for artwork
  await page.goto('http://localhost:3000/cadastrar');
  await page.waitForLoadState('networkidle');
  console.log('Navigated to /cadastrar');

  // Take initial screenshot
  await page.screenshot({ path: `${EVIDENCE_DIR}\\f7-step1-initial.png` });
  console.log('Screenshot: f7-step1-initial.png');

  // Register an artist first so we have one to select
  const artistNameInput = await page.$('#artist-name');
  if (artistNameInput) {
    await artistNameInput.fill('Artista Para Obra QA');
    console.log('Filled artist name for pre-registration');
  }

  const charInput = await page.$('#artist-characteristics');
  if (charInput) {
    await charInput.fill('Pintura');
    await charInput.press('Enter');
    console.log('Added characteristic tag: Pintura');
    await page.waitForTimeout(200);
  }

  // Submit artist form
  const submitArtist = await page.$('button[type="submit"]');
  if (submitArtist) {
    await submitArtist.click();
    console.log('Submitted artist form');
    await page.waitForTimeout(1000);
  }

  // Now switch to Obra tab
  console.log('\n--- Switching to Obra tab ---');

  // Find and click "Cadastrar Obra" tab button
  const obraTabBtn = await page.$('button:has-text("Cadastrar Obra")');
  if (obraTabBtn) {
    await obraTabBtn.click();
    console.log('Clicked "Cadastrar Obra" tab');
    await page.waitForTimeout(500);
  } else {
    console.log('ERROR: "Cadastrar Obra" tab button not found!');
    // List all buttons
    const buttons = await page.$$('button');
    for (let i = 0; i < buttons.length; i++) {
      const text = await buttons[i].textContent();
      console.log(`  Button ${i}: "${text?.trim()}"`);
    }
  }

  // Take screenshot of obra tab
  await page.screenshot({ path: `${EVIDENCE_DIR}\\f7-step2-obra-tab.png` });
  console.log('Screenshot: f7-step2-obra-tab.png');

  // Inspect inputs in obra form
  const inputs = await page.$$('input, select, textarea');
  console.log('Inputs/selects/textareas found in obra tab:', inputs.length);
  for (let i = 0; i < inputs.length; i++) {
    const tagName = await inputs[i].evaluate(el => el.tagName.toLowerCase());
    const placeholder = await inputs[i].getAttribute('placeholder');
    const id = await inputs[i].getAttribute('id');
    const name = await inputs[i].getAttribute('name');
    const type = await inputs[i].getAttribute('type');
    console.log(`  ${tagName} ${i}: type="${type}", placeholder="${placeholder}", id="${id}", name="${name}"`);
  }

  // Step 3: Select an artist from dropdown
  const artistSelect = await page.$('select[id*="artist"], select[name*="artist"], select');
  if (artistSelect) {
    // Get options
    const options = await artistSelect.$$('option');
    console.log('Artist select options:', options.length);
    for (let i = 0; i < options.length; i++) {
      const val = await options[i].getAttribute('value');
      const text = await options[i].textContent();
      console.log(`  Option ${i}: value="${val}", text="${text?.trim()}"`);
    }

    // Select the first non-empty option
    if (options.length > 1) {
      const secondOptionVal = await options[1].getAttribute('value');
      await artistSelect.selectOption({ index: 1 });
      console.log(`Selected artist option index 1, value: ${secondOptionVal}`);
    } else {
      console.log('WARNING: No artist options available in dropdown (only placeholder)');
    }
  } else {
    console.log('Artist select NOT found');
  }

  // Step 4: Fill in artwork fields
  // titulo
  const tituloInput = await page.$('input[id*="titulo"], input[id*="title"], input[placeholder*="titulo"], input[placeholder*="Titulo"]');
  if (tituloInput) {
    await tituloInput.fill('Obra Teste QA');
    console.log('Filled titulo: Obra Teste QA');
  } else {
    console.log('titulo input not found');
  }

  // tecnica
  const tecnicaInput = await page.$('input[id*="tecnica"], input[id*="technique"], input[placeholder*="tecnica"], input[placeholder*="Tecnica"]');
  if (tecnicaInput) {
    await tecnicaInput.fill('Oleo sobre tela');
    console.log('Filled tecnica: Oleo sobre tela');
  } else {
    console.log('tecnica input not found, trying all inputs');
    // Try all text inputs on page
    const allTextInputs = await page.$$('input[type="text"], input:not([type])');
    console.log('All text inputs:', allTextInputs.length);
    for (let i = 0; i < allTextInputs.length; i++) {
      const placeholder = await allTextInputs[i].getAttribute('placeholder');
      const id = await allTextInputs[i].getAttribute('id');
      console.log(`  TextInput ${i}: id="${id}", placeholder="${placeholder}"`);
    }
  }

  // tamanho
  const tamanhoInput = await page.$('input[id*="tamanho"], input[id*="size"], input[placeholder*="tamanho"], input[placeholder*="Tamanho"]');
  if (tamanhoInput) {
    await tamanhoInput.fill('50x70cm');
    console.log('Filled tamanho: 50x70cm');
  } else {
    console.log('tamanho input not found');
  }

  // valor
  const valorInput = await page.$('input[id*="valor"], input[id*="value"], input[id*="price"], input[placeholder*="valor"], input[placeholder*="Valor"]');
  if (valorInput) {
    await valorInput.fill('1500');
    console.log('Filled valor: 1500');
  } else {
    console.log('valor input not found');
  }

  // Take screenshot after filling
  await page.screenshot({ path: `${EVIDENCE_DIR}\\f7-step3-filled.png` });
  console.log('Screenshot: f7-step3-filled.png');

  // Step 5: Submit the obra form
  let submitted = false;
  const submitSelectors = [
    'button[type="submit"]',
    'button:has-text("Cadastrar Obra")',
    'button:has-text("Salvar Obra")',
    'button:has-text("Salvar")',
    'button:has-text("Registrar")',
  ];

  // Get the visible submit button in the current form
  for (const sel of submitSelectors) {
    try {
      const btns = await page.$$(sel);
      for (const btn of btns) {
        const isVisible = await btn.isVisible();
        if (isVisible) {
          const text = await btn.textContent();
          console.log(`Found visible submit button: "${text?.trim()}" (${sel})`);
          await btn.click();
          submitted = true;
          console.log('Clicked submit button');
          break;
        }
      }
      if (submitted) break;
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
                     bodyAfter.toLowerCase().includes('cadastrada') ||
                     bodyAfter.toLowerCase().includes('obra cadastrada') ||
                     bodyAfter.toLowerCase().includes('salvo');
  console.log('Body has success text:', hasSuccess);

  // Check specific success elements
  const alertEls = await page.$$('[role="alert"]');
  for (const el of alertEls) {
    const text = await el.textContent();
    if (text?.trim()) {
      console.log('Alert text:', text.trim());
    }
  }

  // Step 7: Final screenshot
  await page.screenshot({ path: `${EVIDENCE_DIR}\\f7-step4-after-submit.png` });
  console.log('Screenshot: f7-step4-after-submit.png');

  await browser.close();
  console.log('\n=== FEATURE #7 TEST COMPLETE ===');
  console.log('RESULT:', hasSuccess ? 'PASS' : 'NEED_INVESTIGATION');

  process.exit(hasSuccess ? 0 : 1);
})().catch(err => {
  console.error('TEST FAILED:', err.message);
  console.error(err.stack);
  process.exit(1);
});
