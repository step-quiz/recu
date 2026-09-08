/* Prova de fum amb navegador real: obre l'eina, comprova que pinta i
   genera captures i el PDF de la prova, de la clau i del pla. */
/* Playwright pot estar instal·lat al projecte o globalment, i la ruta
   global depèn de la màquina. Es busca als dos llocs en comptes de
   codificar-ne una: amb una ruta absoluta, aquesta ordre —que el README
   documenta— petava a la primera línia a qualsevol altre ordinador. */
function carregaPlaywright() {
  try { return require('playwright'); } catch (e) { /* no és al projecte */ }
  try {
    const arrelGlobal = require('child_process')
      .execSync('npm root -g', { encoding: 'utf8' }).trim();
    return require(require('path').join(arrelGlobal, 'playwright'));
  } catch (e) {
    console.error('Cal Playwright: npm install -D playwright && npx playwright install chromium');
    process.exit(1);
  }
}
const { chromium } = carregaPlaywright();
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

  /* Edició: la volta ha d'oferir preguntes noves i no repetir-ne cap fins
     haver-les mostrat totes. És el bug de A, B, B, A, C. */
  const abans = await pag.evaluate(() => document.querySelectorAll('.q').length);
  const firma = () => pag.evaluate(() => {
    const c = document.querySelector('.pregunta-cos');
    const g = c.querySelector('svg');
    return c.textContent.replace(/\s+/g, ' ').trim() + '|' + (g ? g.outerHTML.length : 0);
  });
  const vistes = [await firma()];
  for (let k = 0; k < 12; k++) {
    await pag.evaluate(() => document.querySelector('.pregunta-eines [data-seguent]').click());
    await pag.waitForTimeout(90);
    vistes.push(await firma());
  }
  let seguides = 0;
  for (let k = 1; k < vistes.length; k++) if (vistes[k] === vistes[k - 1]) seguides++;
  console.log('VOLTA: 13 clics ->', new Set(vistes).size, 'preguntes diferents,',
    seguides, 'repeticions immediates');

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

  /* Cap interruptor pot buidar una pregunta: es prova el full amb les
     quatre combinacions d'«enunciats generals» i «figures». Els bugs de
     `capCal` i de les figures eren tots dos d'aquesta família. */
  for (const cap of [true, false]) {
    for (const fig of [true, false]) {
      await pag.evaluate(([c, f]) => {
        const e = document.querySelector('#encapcalaments');
        const g = document.querySelector('#figures');
        e.checked = c; e.dispatchEvent(new Event('change'));
        g.checked = f; g.dispatchEvent(new Event('change'));
      }, [cap, fig]);
      await pag.waitForTimeout(250);
      const buides = await pag.evaluate(() =>
        [...document.querySelectorAll('.pregunta-cos')]
          .filter(x => x.textContent.replace(/\s+/g, ' ').trim().length < 12 &&
                       !x.querySelector('svg')).length);
      console.log(`SENSE BUIDAR (encapçalaments=${cap}, figures=${fig}):`,
        buides ? `*** ${buides} preguntes buides ***` : 'cap buida');
    }
  }

  console.log('ERRORS:', errors.length ? errors : 'cap');
  await nav.close();

  /* Es neteja el que ha deixat: si no, els PDF i les captures es queden a
     l'arbre i acaben dins del zip que es passa al departament. */
  ['_prova.pdf', '_clau.pdf', '_pla.pdf',
   '_prova-pantalla.png', '_prova-pantalla2.png'].forEach(function (f) {
    try { require('fs').unlinkSync(path.join(arrel, f)); } catch (e) { /* ja no hi era */ }
  });
})();
