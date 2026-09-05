/* Prova de fum amb navegador real: obre l'eina, comprova que pinta i
   genera captures i el PDF de la prova, de la clau i del pla. */
const { chromium } = require('/home/claude/.npm-global/lib/node_modules/playwright');
const path = require('path');

(async () => {
  const arrel = path.resolve(__dirname, '..');
  const nav = await chromium.launch();
  const pag = await nav.newPage({ viewport: { width: 1560, height: 1000 } });

  const errors = [];
  pag.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  pag.on('pageerror', e => errors.push('PAGEERROR ' + e.message));

  await pag.goto('file://' + path.join(arrel, 'index.html'));
  await pag.waitForTimeout(1200);

  const info = await pag.evaluate(() => ({
    preguntes: document.querySelectorAll('.pregunta').length,
    sabers: document.querySelectorAll('.saber').length,
    buits: document.querySelectorAll('.saber.buit').length,
    katex: document.querySelectorAll('.katex').length,
    figures: document.querySelectorAll('.figura').length,
    titol: (document.querySelector('.doc-cap h1') || {}).textContent,
    subtitol: (document.querySelector('.doc-cap .subtitol') || {}).textContent,
    avisos: [...document.querySelectorAll('.avis')].map(a => a.textContent),
    llavor: (document.querySelector('#llavor') || {}).textContent
  }));
  console.log('PROVA:', JSON.stringify(info, null, 1));

  await pag.screenshot({ path: path.join(arrel, '_prova-pantalla.png'), fullPage: false });

  await pag.pdf({ path: path.join(arrel, '_prova.pdf'), format: 'A4', printBackground: true });

  // clau
  await pag.click('[data-doc="clau"]');
  await pag.waitForTimeout(700);
  const files = await pag.evaluate(() => document.querySelectorAll('.clau-taula tbody tr').length);
  console.log('CLAU: files =', files);
  await pag.pdf({ path: path.join(arrel, '_clau.pdf'), format: 'A4', printBackground: true });

  // pla
  await pag.click('[data-doc="pla"]');
  await pag.waitForTimeout(600);
  const seccions = await pag.evaluate(() => document.querySelectorAll('.pla-sec li').length);
  console.log('PLA: elements =', seccions);
  await pag.pdf({ path: path.join(arrel, '_pla.pdf'), format: 'A4', printBackground: true });

  // interacció: marcar 1r d'ESO sencer
  await pag.click('[data-doc="prova"]');
  await pag.click('[data-curs="1eso"]');
  await pag.waitForTimeout(700);
  const desp = await pag.evaluate(() => ({
    preguntes: document.querySelectorAll('.pregunta').length,
    subtitol: (document.querySelector('.doc-cap .subtitol') || {}).textContent,
    avisos: [...document.querySelectorAll('.avis')].map(a => a.textContent.slice(0, 120))
  }));
  console.log('AMB 1r+2n:', JSON.stringify(desp, null, 1));
  await pag.screenshot({ path: path.join(arrel, '_prova-pantalla2.png') });

  // canviar una pregunta i treure'n una
  const abans = await pag.evaluate(() => document.querySelectorAll('.q').length);
  await pag.evaluate(() => document.querySelector('[data-canvia="0"]').click());
  await pag.evaluate(() => document.querySelector('[data-treu="1"]').click());
  await pag.waitForTimeout(400);
  const despres = await pag.evaluate(() => document.querySelectorAll('.q').length);
  console.log('EDICIÓ:', abans, '->', despres);

  /* El full s'ha d'imprimir des de qualsevol pestanya. En imprimir, les
     media queries es mesuren contra l'amplada del paper (uns 794 px), i per
     això la maquetació estreta s'activa sempre: si les seves regles amaguen
     .taula, surt un full en blanc. */
  const fs = require('fs');
  for (const vista of ['full', 'curriculum', 'composicio']) {
    await pag.evaluate(v => { document.querySelector('#app').dataset.vista = v; }, vista);
    await pag.waitForTimeout(200);
    const tmp = path.join(arrel, '_v.pdf');
    await pag.pdf({ path: tmp, format: 'A4', printBackground: true });
    const cru = fs.readFileSync(tmp);
    fs.unlinkSync(tmp);
    console.log(`IMPRESSIÓ des de «${vista}»:`,
      cru.length > 40000 ? 'amb contingut' : '*** BUIDA ***');
  }
  await pag.evaluate(() => { document.querySelector('#app').dataset.vista = 'full'; });

  console.log('ERRORS:', errors.length ? errors : 'cap');
  await nav.close();
})();
