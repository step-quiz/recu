/* Prova de fum amb navegador real: obre l'eina, la fa servir com un
   professor i comprova el que surt a pantalla i al PDF.

       node tools/prova.js

   Abans només escrivia per pantalla i acabava sempre bé: un «*** BUIDA ***»
   passava desapercebut si ningú llegia la sortida. Ara cada comprovació
   compta i, si n'hi ha cap que falla, el procés acaba amb codi 1 (i
   l'Action de GitHub es posa en vermell). */

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

const arrel = path.resolve(__dirname, '..');
const URL_EINA = 'file://' + path.join(arrel, 'index.html');

let ok = 0, ko = 0;
function comprova(nom, cond, extra) {
  if (cond) { ok++; console.log('  ok    ' + nom); }
  else { ko++; console.log('  FALLA ' + nom + (extra !== undefined ? '  ' + extra : '')); }
}

/* Una pregunta, a paper, és una pregunta sola o un apartat d'un grup (6a,
   6b). Cadascuna té les seves eines i el seu espai. */
const PREGUNTES = '.pregunta:not(.pregunta-grup), .apartat';

/* Les seccions de baix del panell surten plegades; per fer-les servir com
   un professor, primer s'obren. */
const obreSeccions = p => p.evaluate(() =>
  document.querySelectorAll('.panell details').forEach(d => { d.open = true; }));

/** Pàgines d'un PDF: es compten els objectes /Type /Page. */
const paginesPdf = buf => (buf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;

(async () => {
  const nav = await chromium.launch();
  const pag = await nav.newPage({ viewport: { width: 1560, height: 1000 } });

  const errors = [];
  pag.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  pag.on('pageerror', e => errors.push('PAGEERROR ' + e.message));

  await pag.goto(URL_EINA);
  await pag.waitForTimeout(800);
  await obreSeccions(pag);

  console.log('Arrencada');
  const inici = await pag.evaluate(() => ({
    sabers: document.querySelectorAll('.saber').length,
    llavor: (document.querySelector('#llavor') || {}).textContent
  }));
  comprova('es llisten els continguts', inici.sabers >= 50, inici.sabers);
  const perDefecte = await pag.evaluate(() => ({
    punts: document.querySelector('[data-criteri][aria-pressed=true]').dataset.criteri,
    pes: document.querySelector('[data-pes][aria-pressed=true]').dataset.pes,
    ordre: document.querySelector('#ordre').value,
    ultima: [...document.querySelectorAll('.panell details')].pop().dataset.sec
  }));
  comprova('per defecte: punts iguals, mateix nombre per contingut, de fàcil a difícil',
    perDefecte.punts === 'igual' && perDefecte.pes === 'igual' && perDefecte.ordre === 'dificultat',
    JSON.stringify(perDefecte));
  comprova('«Punts, temps i ordre» és la darrera secció del panell', perDefecte.ultima === 'punts',
    perDefecte.ultima);
  comprova('hi ha un codi de tria de cinc caràcters', /^[0-9A-Z]{5}$/.test(inici.llavor), inici.llavor);

  /* Cada curs es plega i es desplega clicant-ne la barra. */
  const sabersDe = c => pag.evaluate(id =>
    document.querySelectorAll(`[data-saber^="${id}-"]`).length, c);
  let plegables = true;
  for (const c of ['1eso', '2eso', '3eso']) {
    const obert = await sabersDe(c);
    await pag.click(`[data-plega="${c}"]`);
    const plegat = await sabersDe(c);
    await pag.click(`[data-plega="${c}"]`);
    if (!(obert > 0 && plegat === 0 && await sabersDe(c) === obert)) plegables = false;
  }
  comprova('els tres cursos es pleguen i es despleguen', plegables);

  console.log('Composició');
  await pag.click('[data-curs="1eso"]');
  await pag.waitForTimeout(600);
  const desp = await pag.evaluate(() => ({
    preguntes: document.querySelectorAll(
      '.pregunta:not(.pregunta-grup), .apartat').length,
    subtitol: (document.querySelector('.doc-cap .subtitol') || {}).textContent,
    katex: document.querySelectorAll('.katex').length
  }));
  comprova('«Tot el curs» dona una pregunta per contingut de 1r', desp.preguntes === 18, desp.preguntes);
  comprova('el subtítol diu el curs', desp.subtitol === 'Continguts de 1r d\'ESO', desp.subtitol);
  comprova('KaTeX compon les fórmules', desp.katex > 0, desp.katex);

  /* La volta ha d'oferir preguntes noves i no repetir-ne cap fins haver-les
     mostrat totes. És el bug de A, B, B, A, C. */
  const firma = () => pag.evaluate(() => {
    const c = document.querySelector('.pregunta-eines').parentElement.querySelector('.pregunta-cos');
    const g = c.querySelector('svg');
    return c.textContent.replace(/\s+/g, ' ').trim() + '|' + (g ? g.outerHTML.length : 0);
  });
  const vistes = [await firma()];
  for (let k = 0; k < 12; k++) {
    await pag.evaluate(() => document.querySelector('.pregunta-eines [data-seguent]').click());
    await pag.waitForTimeout(60);
    vistes.push(await firma());
  }
  let seguides = 0;
  for (let k = 1; k < vistes.length; k++) if (vistes[k] === vistes[k - 1]) seguides++;
  comprova('⟳ no repeteix mai la pregunta que hi havia', seguides === 0, seguides);
  comprova('13 clics de ⟳ mostren almenys 10 preguntes diferents',
    new Set(vistes).size >= 10, new Set(vistes).size);

  const abans = await pag.evaluate(() => document.querySelectorAll('.q').length);
  await pag.evaluate(() => document.querySelector('[data-treu="1"]').click());
  await pag.waitForTimeout(300);
  const despres = await pag.evaluate(() => document.querySelectorAll('.q').length);
  comprova('✕ treu una pregunta i només una', despres === abans - 1, `${abans} -> ${despres}`);

  /* El panell mostra les preguntes plegades: clicar-ne una l'obre (nivell,
     punts i accions), la ressalta al full, i tornar-la a clicar la tanca.
     Clicar la pregunta al full també l'obre al panell. */
  await pag.click('[data-obre="2"]');
  await pag.waitForTimeout(150);
  const oberta = await pag.evaluate(() => ({
    detalls: document.querySelectorAll('#llista .q-detall').length,
    nivell: !!document.querySelector('.q-detall [data-punts="2"]'),
    activa: document.querySelectorAll('#full .activa').length
  }));
  comprova('clicar una pregunta del panell l\'obre i la ressalta al full',
    oberta.detalls === 1 && oberta.nivell && oberta.activa === 1, JSON.stringify(oberta));
  await pag.click('.q-tanca');
  await pag.waitForTimeout(150);
  comprova('el botó ▴ la plega',
    await pag.evaluate(() => !document.querySelector('.q-detall') &&
                             !document.querySelector('#full .activa')));
  await pag.locator(PREGUNTES).nth(4).locator('.pregunta-cos').first().click();
  await pag.waitForTimeout(150);
  comprova('clicar una pregunta del full l\'obre al panell',
    await pag.evaluate(() => !!document.querySelector('.q.oberta [data-punts="4"]')));
  await pag.keyboard.press('Escape');
  await pag.waitForTimeout(150);
  comprova('Esc la plega', await pag.evaluate(() => !document.querySelector('.q-detall')));

  /* Aparença: un sol botó que passa per sistema → clar → fosc → sistema. */
  const temes = [];
  for (let k = 0; k < 3; k++) {
    await pag.click('#aparenca');
    temes.push(await pag.evaluate(() => document.documentElement.dataset.theme || 'sistema'));
  }
  comprova('el botó d\'aparença fa clar → fosc → sistema', temes.join(',') === 'light,dark,sistema',
    temes.join(','));

  /* Un <label> passa el clic al primer control que conté: amb els grups de
     botons dins d'un <label>, clicar el text «Nivell de les preguntes»
     premia «Mínims» i refeia la prova sencera. */
  await pag.click('[data-perfil="exigent"]');
  await pag.waitForTimeout(300);
  const hashAbans = await pag.evaluate(() => location.hash);
  for (const titol of ['Nivell de les preguntes', 'Reparteix les preguntes segons',
                       'Els punts es reparteixen']) {
    await pag.getByText(titol, { exact: true }).click();
  }
  await pag.waitForTimeout(300);
  const perfil = await pag.evaluate(() =>
    document.querySelector('[data-perfil][aria-pressed=true]').dataset.perfil);
  comprova('clicar el títol d\'un grup de botons no el prem',
    perfil === 'exigent' && hashAbans === await pag.evaluate(() => location.hash), perfil);
  await pag.click('[data-perfil="minims"]');
  await pag.waitForTimeout(300);

  console.log('Paper');
  /* El comptador de pàgines ha de dir el mateix que el PDF real. */
  const estimat = await pag.evaluate(() =>
    +(document.querySelector('#pagines').textContent.match(/\d+/) || [0])[0]);
  const pdfProva = await pag.pdf({ format: 'A4', printBackground: true });
  const reals = paginesPdf(pdfProva);
  comprova('el comptador de pàgines encerta (±1)', Math.abs(estimat - reals) <= 1,
    `diu ${estimat}, en surten ${reals}`);

  /* El full s'ha d'imprimir des de qualsevol pestanya. En imprimir, les
     media queries es mesuren contra l'amplada del paper (uns 794 px), i per
     això la maquetació estreta s'activa sempre: si les seves regles amaguen
     .taula, surt un full en blanc. */
  for (const vista of ['full', 'curriculum', 'composicio']) {
    await pag.evaluate(v => { document.querySelector('#app').dataset.vista = v; }, vista);
    await pag.waitForTimeout(150);
    const cru = await pag.pdf({ format: 'A4', printBackground: true });
    comprova(`s'imprimeix amb contingut des de «${vista}»`, cru.length > 40000, cru.length);
  }
  await pag.evaluate(() => { document.querySelector('#app').dataset.vista = 'full'; });

  /* Cap interruptor pot buidar una pregunta: es prova el full amb les
     quatre combinacions d'«enunciats generals» i «figures». */
  for (const cap of [true, false]) {
    for (const fig of [true, false]) {
      await pag.evaluate(([c, f]) => {
        const e = document.querySelector('#encapcalaments');
        const g = document.querySelector('#figures');
        e.checked = c; e.dispatchEvent(new Event('change'));
        g.checked = f; g.dispatchEvent(new Event('change'));
      }, [cap, fig]);
      await pag.waitForTimeout(150);
      /* En un apartat, la consigna és a la capçalera del grup: compta. */
      const buides = await pag.evaluate(sel =>
        [...document.querySelectorAll(sel)].filter(el => {
          const grup = el.closest('.pregunta-grup');
          const txt = (grup ? grup.querySelector('.grup-cap').textContent : '') +
                      el.querySelector('.pregunta-cos').textContent;
          return txt.replace(/\s+/g, ' ').trim().length < 12 && !el.querySelector('svg');
        }).length, PREGUNTES);
      comprova(`cap pregunta buida (enunciats=${cap}, figures=${fig})`, !buides, buides);
    }
  }

  /* Cap botó de la barra d'una pregunta pot quedar tapat. Amb l'espai de
     resposta a 0, la barra fa 74 px i la pregunta 21: sobresurt per sota i
     se superposa a la barra de la següent. */
  await pag.evaluate(() => {
    const s = document.querySelector('#espai');
    s.value = 0; s.dispatchEvent(new Event('input'));
  });
  await pag.waitForTimeout(250);
  let tapats = 0, botons = 0;
  const quantes = await pag.evaluate(sel => document.querySelectorAll(sel).length, PREGUNTES);
  for (let i = 0; i < quantes; i++) {
    await pag.evaluate(([sel, j]) => document.querySelectorAll(sel)[j]
      .scrollIntoView({ block: 'center' }), [PREGUNTES, i]);
    await pag.locator(PREGUNTES).nth(i).locator('.pregunta-cos').first().hover();
    await pag.waitForTimeout(30);
    const r = await pag.evaluate(([sel, j]) => {
      const pr = document.querySelectorAll(sel)[j];
      return [...pr.querySelectorAll(':scope > .pregunta-eines button')].map(b => {
        const c = b.getBoundingClientRect();
        const d = document.elementFromPoint(c.x + c.width / 2, c.y + c.height / 2);
        return !!d && (d === b || b.contains(d));
      });
    }, [PREGUNTES, i]);
    r.forEach(lliure => { botons++; if (!lliure) tapats++; });
  }
  comprova(`tots els botons de les preguntes es poden clicar (${botons})`, !tapats, tapats);
  await pag.evaluate(() => {
    const s = document.querySelector('#espai');
    s.value = 38; s.dispatchEvent(new Event('input'));
  });

  console.log('Clau i pla de repàs');
  await pag.click('[data-doc="clau"]');
  await pag.waitForTimeout(400);
  const files = await pag.evaluate(() => document.querySelectorAll('.clau-taula tbody tr').length);
  comprova('la clau té una fila per pregunta', files === despres, `${files} files, ${despres} preguntes`);

  await pag.click('[data-doc="pla"]');
  await pag.waitForTimeout(400);
  const pla = await pag.evaluate(() => {
    const txt = el => el.textContent.replace(/\s+/g, ' ').trim();
    return {
      continguts: document.querySelectorAll('.pla-saber').length,
      exercicis: [...document.querySelectorAll('.exercici-cos')].map(txt),
      solucions: document.querySelectorAll('.solucions-llista li').length,
      titol: (document.querySelector('.pla-sec h2') || {}).textContent
    };
  });
  comprova('el pla té un apartat per contingut marcat', pla.continguts === 18, pla.continguts);
  comprova('el pla porta 2 exercicis de pràctica per contingut', pla.exercicis.length === 36,
    pla.exercicis.length);
  comprova('una solució per exercici', pla.solucions === pla.exercicis.length,
    `${pla.solucions} de ${pla.exercicis.length}`);
  comprova('el títol del curs surt del currículum', pla.titol === 'Matemàtiques de 1r d\'ESO', pla.titol);

  /* La regla que importa: cap exercici de pràctica és una pregunta de la
     prova. Es compara el text tal com surt imprès. */
  await pag.click('[data-doc="prova"]');
  await pag.waitForTimeout(300);
  const textProva = await pag.evaluate(sel => [...document.querySelectorAll(sel)].map(el => {
    const grup = el.closest('.pregunta-grup');
    return ((grup ? grup.querySelector('.grup-cap .pregunta-cos').textContent : '') +
            el.querySelector('.pregunta-cos').textContent).replace(/\s+/g, ' ').trim();
  }), PREGUNTES);
  const repetits = pla.exercicis.filter(t => textProva.includes(t));
  comprova('cap exercici de pràctica és una pregunta de la prova', !repetits.length,
    repetits.slice(0, 2).join(' | '));

  /* 3r d'ESO: el pla deia «Matemàtiques de 3eso» i no portava cap
     referència al llibre. */
  await pag.click('[data-curs="3eso"]');
  await pag.waitForTimeout(400);
  await pag.click('[data-doc="pla"]');
  await pag.waitForTimeout(400);
  const pla3 = await pag.evaluate(() => ({
    titols: [...document.querySelectorAll('.pla-sec h2')].map(h => h.textContent),
    llibre3: [...document.querySelectorAll('.font')].some(f => /Llibre de 3r d'ESO/.test(f.textContent)),
    sensePractica: [...document.querySelectorAll('.pla-saber')]
      .filter(li => li.querySelectorAll('.exercici').length !== 2)
      .map(li => li.querySelector('strong').textContent)
  }));
  /* Comprensió lectora de 1r i de 3r comparteixen els sis ítems del
     catàleg: el segon es quedava sense exercicis fins que app.js no hi va
     afegir variants noves dels generadors. */
  comprova('amb 1r i 3r marcats, cada contingut té els seus 2 exercicis',
    !pla3.sensePractica.length, pla3.sensePractica.join(', '));
  comprova('el pla de 3r es titula «Matemàtiques de 3r d\'ESO»',
    pla3.titols.includes('Matemàtiques de 3r d\'ESO'), pla3.titols.join(' / '));
  comprova('el pla de 3r remet al llibre de 3r', pla3.llibre3);
  await pag.click('[data-doc="prova"]');
  await pag.waitForTimeout(200);

  console.log('Adreça');
  /* L'adreça ha de tornar a muntar exactament el mateix full, capçalera
     inclosa. */
  /* La capçalera s'escriu damunt del mateix full. */
  await pag.fill('#full [data-camp="alumne"]', 'Pau Serra');
  await pag.fill('#full [data-camp="titol"]', 'Recuperació de 1r i 3r');
  await pag.fill('#full [data-camp="instruccions"]', 'Primera línia.\nSegona línia.');
  await pag.click('[data-doc="prova"]');            // el focus surt de la capçalera
  await pag.waitForTimeout(200);
  const cap = await pag.evaluate(() => ({
    alumne: document.querySelector('#full [data-camp="alumne"]').textContent,
    titol: document.querySelector('.doc-cap h1').textContent,
    peu: document.querySelector('.doc-peu').textContent,
    instr: document.querySelector('.doc-instruccions').innerText
  }));
  comprova('la capçalera s\'edita damunt del full (nom, títol i peu)',
    cap.alumne === 'Pau Serra' && cap.titol === 'Recuperació de 1r i 3r' &&
    cap.peu.includes('Recuperació de 1r i 3r'), JSON.stringify(cap));
  comprova('les instruccions conserven els salts de línia',
    cap.instr.trim() === 'Primera línia.\nSegona línia.', JSON.stringify(cap.instr));
  await pag.evaluate(() => {
    const g = document.querySelector('#figures');
    g.checked = false; g.dispatchEvent(new Event('change'));
  });
  await pag.waitForTimeout(200);
  const full1 = await pag.evaluate(() => document.querySelector('#full').innerHTML);
  const hash = await pag.evaluate(() => location.hash);
  const pag2 = await nav.newPage({ viewport: { width: 1560, height: 1000 } });
  pag2.on('pageerror', e => errors.push('PAGEERROR (adreça) ' + e.message));
  await pag2.goto(URL_EINA + hash);
  await pag2.waitForTimeout(600);
  const full2 = await pag2.evaluate(() => document.querySelector('#full').innerHTML);
  comprova('l\'adreça reprodueix el full idèntic (capçalera i figures incloses)', full1 === full2);

  /* «Desa la prova» baixa un fitxer; «Obre…» el torna a carregar. */
  const [baixada] = await Promise.all([pag.waitForEvent('download'), pag.click('#desa-fitxer')]);
  const desat = await baixada.path();
  const pag4 = await nav.newPage({ viewport: { width: 1560, height: 1000 } });
  await pag4.goto(URL_EINA);
  await pag4.waitForTimeout(400);
  await pag4.setInputFiles('#fitxer', desat);
  await pag4.waitForTimeout(800);
  comprova('«Obre…» torna a carregar una prova desada',
    await pag4.evaluate(() => document.querySelector('#full').innerHTML) === full1);
  await pag4.close();

  /* Una adreça retallada, editada a mà o amb ids que no existeixen no pot
     trencar la pàgina ni fer sortir preguntes buides. */
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64');
  for (const dolenta of ['#%%%', '#abc', '#' + b64([1, 2]),
    '#' + b64({ s: 'x', n: 'molts', p: '__proto__', q7: [['constructor', 'y'], 5, null, ['P', 7]],
                fx: ['__proto__'] })]) {
    const p3 = await nav.newPage();
    const errs = [];
    p3.on('pageerror', e => errs.push(e.message));
    await p3.goto(URL_EINA + dolenta);
    await p3.waitForTimeout(300);
    const r = await p3.evaluate(() => ({
      barra: !!document.querySelector('.barra'),
      undef: /undefined/.test(document.querySelector('#full').textContent)
    }));
    comprova(`una adreça mal formada no trenca res (${dolenta.slice(0, 12)}…)`,
      !errs.length && r.barra && !r.undef, errs.join(' | '));
    await p3.close();
  }

  console.log('Apartats i temps');
  /* Tres variants seguides del mateix generador (mateix exercici i
     mateixa consigna) han de sortir com a «2. a) b) c)», i la clau i la
     graella les han de dir 2a, 2b, 2c. */
  const ambApartats = '#' + b64({
    s: ['2eso-num-divisibilitat', '2eso-alg-equacions'], l: 'APART', du: 55,
    q7: [['p-div-mcd-0', '2eso-num-divisibilitat'], ['p-equ-dos-passos-0', '2eso-alg-equacions'],
         ['p-equ-dos-passos-1', '2eso-alg-equacions'], ['p-equ-dos-passos-2', '2eso-alg-equacions'],
         ['f5-75a', '2eso-alg-equacions']] });
  const pa = await nav.newPage({ viewport: { width: 1560, height: 1000 } });
  pa.on('pageerror', e => errors.push('PAGEERROR (apartats) ' + e.message));
  await pa.goto(URL_EINA + ambApartats);
  await pa.waitForTimeout(600);
  await obreSeccions(pa);
  const ap = await pa.evaluate(() => ({
    nums: [...document.querySelectorAll('.pregunta-num')].map(x => x.textContent).join(' '),
    lletres: [...document.querySelectorAll('.apartat-lletra')].map(x => x.textContent).join(' '),
    consignes: (document.querySelector('.pregunta-grup').textContent
      .match(/Resol aquestes equacions/g) || []).length,
    temps: document.querySelector('#temps').textContent,
    control: document.querySelector('#nombre-valor').textContent
  }));
  comprova('apartats seguits del mateix exercici surten com a 2. a) b) c)',
    ap.nums === '1. 2. 3.' && ap.lletres === 'a) b) c)', `${ap.nums} / ${ap.lletres}`);
  comprova('la consigna del grup s\'imprimeix un sol cop', ap.consignes === 1, ap.consignes);
  comprova('el control diu les preguntes que hi ha de debò', ap.control === '5', ap.control);
  /* Cinc preguntes de nivell 1 a 4 minuts, llevat de f5-75a si no ho és. */
  comprova('el temps estimat surt en minuts', /^≈ \d+ min$/.test(ap.temps), ap.temps);
  await pa.click('[data-doc="clau"]');
  await pa.waitForTimeout(300);
  const clauAp = await pa.evaluate(() => ({
    files: [...document.querySelectorAll('.clau-taula td.n')].map(x => x.textContent).join(','),
    graella: [...document.querySelectorAll('.graella thead th')].map(x => x.textContent).join(',')
  }));
  comprova('la clau numera els apartats 2a, 2b, 2c', clauAp.files === '1,2a,2b,2c,3', clauAp.files);
  comprova('la graella també', clauAp.graella === 'Pregunta,1,2a,2b,2c,3,Total', clauAp.graella);
  await pa.click('[data-doc="prova"]');
  await pa.waitForTimeout(200);
  const pdfAp = await pa.pdf({ format: 'A4', printBackground: true });
  const estimatAp = await pa.evaluate(() =>
    +(document.querySelector('#pagines').textContent.match(/\d+/) || [0])[0]);
  comprova('amb apartats, el comptador de pàgines encerta (±1)',
    Math.abs(estimatAp - paginesPdf(pdfAp)) <= 1, `diu ${estimatAp}, en surten ${paginesPdf(pdfAp)}`);
  await pa.click('#agrupa');
  await pa.waitForTimeout(300);
  const sense = await pa.evaluate(() =>
    [...document.querySelectorAll('.pregunta-num')].map(x => x.textContent).join(' '));
  comprova('sense agrupar, cinc preguntes numerades', sense === '1. 2. 3. 4. 5.', sense);
  /* Durada curta: el temps estimat passa a avís. */
  await pa.fill('#durada', '10');
  await pa.locator('#durada').dispatchEvent('change');
  await pa.waitForTimeout(150);
  comprova('si la prova no hi cap, el temps surt en ambre',
    await pa.evaluate(() => document.querySelector('#temps').classList.contains('fora')));
  await pa.close();

  console.log('Pantalla de portàtil');
  /* A 1280 px el full s'encongia fins a 592 px i ja no era el paper: ara
     fa sempre 210 mm i el zoom l'ajusta. */
  const petita = await nav.newPage({ viewport: { width: 1280, height: 720 } });
  await petita.goto(URL_EINA + hash);
  await petita.waitForTimeout(600);
  const mida = await petita.evaluate(() => {
    const f = document.querySelector('#full'), t = document.querySelector('.taula');
    return { ample: f.offsetWidth, sobresurt: t.scrollWidth > t.clientWidth,
             zoom: document.querySelector('#zoom option:checked').textContent };
  });
  comprova('a 1280 px el full fa 210 mm (794 px) de maquetació', Math.abs(mida.ample - 794) <= 1,
    mida.ample);
  comprova('a 1280 px el zoom automàtic el fa cabre sense barra horitzontal',
    !mida.sobresurt, mida.zoom);

  comprova('cap error de JavaScript', !errors.length, errors.slice(0, 3).join(' | '));
  await nav.close();

  console.log(`\n${ok} correctes, ${ko} fallades`);
  process.exit(ko ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
