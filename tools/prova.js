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

  console.log('Arrencada');
  /* La barra de dalt només porta el títol i el botó d'imprimir; la llista
     de preguntes surt plegada; «Ajustat» no diu cap percentatge. */
  const net = await pag.evaluate(() => ({
    sobrers: ['#aparenca', '#desa-fitxer', '#obre-fitxer', '[data-doc="pla"]', '.marca span',
              '.rail-cap h2', '.saber-meta'].filter(s => document.querySelector(s)),
    plegada: !document.querySelector('#sec-preguntes').open,
    ajustat: document.querySelector('#zoom option[value=auto]').textContent
  }));
  comprova('fora el tema, Obre/Desa, el pla de repàs, les hores i el banc', !net.sobrers.length,
    net.sobrers.join(', '));
  comprova('la llista de preguntes surt plegada', net.plegada);
  comprova('el zoom diu «Ajustat» sense percentatge', net.ajustat === 'Ajustat', net.ajustat);
  await obreSeccions(pag);

  const inici = await pag.evaluate(() => ({
    sabers: document.querySelectorAll('.saber').length,
    llavor: JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1))))).l,
    tria: !!document.querySelector('#llavor, #model')
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
  comprova('hi ha un codi de tria de cinc caràcters (a l\'adreça)', /^[0-9A-Z]{5}$/.test(inici.llavor),
    inici.llavor);
  comprova('el panell no mostra ni el codi ni el model', !inici.tria);

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
  /* Tot el full, Times New Roman a 12 pt (16 px). */
  const lletra = await pag.evaluate(() => ['.doc-cap h1', '.doc-dades', '.doc-instruccions', '.pregunta-cos']
    .map(sel => getComputedStyle(document.querySelector(sel)))
    .filter(cs => !/^"?Times New Roman/.test(cs.fontFamily) || cs.fontSize !== '16px')
    .map(cs => cs.fontFamily + ' ' + cs.fontSize));
  comprova('la prova va en Times New Roman 12', !lletra.length, lletra.join(' | '));

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
  comprova('«Una altra» no repeteix mai la pregunta que hi havia', seguides === 0, seguides);
  comprova('13 clics de «Una altra» mostren almenys 10 preguntes diferents',
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
  /* Amb la llista plegada, clicar una pregunta del full la desplega. */
  await pag.evaluate(() => { document.querySelector('#sec-preguntes').open = false; });
  await pag.locator(PREGUNTES).nth(4).locator('.pregunta-cos').first().click();
  await pag.waitForTimeout(150);
  comprova('clicar una pregunta del full l\'obre al panell (i desplega la llista)',
    await pag.evaluate(() => !!document.querySelector('.q.oberta [data-punts="4"]') &&
                             document.querySelector('#sec-preguntes').open));
  await pag.keyboard.press('Escape');
  await pag.waitForTimeout(150);
  comprova('Esc la plega', await pag.evaluate(() => !document.querySelector('.q-detall')));

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
     resposta a 0, la barra fa 97 px i la pregunta 21: sobresurt per sota i
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

  console.log('Correcció');
  await pag.click('[data-doc="clau"]');
  await pag.waitForTimeout(400);
  const correccio = await pag.evaluate(() => ({
    files: document.querySelectorAll('.clau-taula tbody tr:not(.clau-grup)').length,
    enunciat: document.querySelector('.clau-enunciat').textContent.replace(/\s+/g, ' ').trim(),
    peu: !!document.querySelector('.doc-peu'),
    boto: document.querySelector('#imprimeix').firstChild.textContent,
    pagines: document.querySelector('#pagines').hidden,
    subtitol: document.querySelector('.doc-cap .subtitol').textContent,
    columnes: [...document.querySelectorAll('.clau-taula thead th')].map(x => x.textContent).join(','),
    marcador: getComputedStyle(document.querySelector('.clau-passos li'), '::before').content
  }));
  comprova('la clau té les columnes Enunciat, Solució i Passos',
    correccio.columnes === 'Enunciat,Solució,Passos', correccio.columnes);
  comprova('la clau copia l\'enunciat amb el número', /^1\.\S/.test(correccio.enunciat) &&
    correccio.enunciat.length > 8, correccio.enunciat);
  comprova('la correcció no porta peu', !correccio.peu);
  comprova('la correcció va en Times New Roman 12', await pag.evaluate(() =>
    ['.clau-taula th', '.clau-enunciat', '.clau-passos li', '.graella td'].every(sel => {
      const cs = getComputedStyle(document.querySelector(sel));
      return /^"?Times New Roman/.test(cs.fontFamily) && cs.fontSize === '16px';
    })));
  comprova('els passos van amb a), b), c)', /lower-alpha/.test(correccio.marcador), correccio.marcador);
  /* La graella, sempre en una pàgina nova. Es mira la regla d'impressió i
     no el nombre de pàgines del PDF: comparar el PDF amb graella i sense
     depenia de les preguntes que sortien a l'atzar i fallava algun cop. */
  await pag.emulateMedia({ media: 'print' });
  const salt = await pag.evaluate(() => getComputedStyle(document.querySelector('.graella-tit')).breakBefore);
  await pag.emulateMedia({ media: 'screen' });
  comprova('la graella de correcció comença en una pàgina nova', salt === 'page', salt);
  comprova('la clau té una fila per pregunta', correccio.files === despres,
    `${correccio.files} files, ${despres} preguntes`);
  comprova('el botó diu «Imprimeix la correcció», sense pàgines',
    correccio.boto === 'Imprimeix la correcció' && correccio.pagines, JSON.stringify(correccio));
  comprova('el subtítol diu només «Full de correcció»', correccio.subtitol === 'Full de correcció',
    correccio.subtitol);
  await pag.click('[data-doc="prova"]');
  await pag.waitForTimeout(300);
  comprova('a la prova, «Imprimeix la prova» amb les pàgines',
    await pag.evaluate(() => document.querySelector('#imprimeix').firstChild.textContent ===
      'Imprimeix la prova' && !document.querySelector('#pagines').hidden));

  await pag.click('[data-curs="3eso"]');
  await pag.waitForTimeout(400);

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
    peu: !!document.querySelector('.doc-peu'),
    instr: document.querySelector('.doc-instruccions').innerText
  }));
  comprova('la capçalera s\'edita damunt del full (nom i títol)',
    cap.alumne === 'Pau Serra' && cap.titol === 'Recuperació de 1r i 3r', JSON.stringify(cap));
  comprova('la prova no porta peu (ni títol repetit ni codi)', !cap.peu);
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
    files: [...document.querySelectorAll('.clau-num > b')].map(x => x.textContent).join(','),
    graella: [...document.querySelectorAll('.graella thead th')].map(x => x.textContent).join(',')
  }));
  comprova('la clau numera com la prova: 1., 2. a) b) c), 3.', clauAp.files === '1.,2.,a),b),c),3.',
    clauAp.files);
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
  /* El «+» d'una pregunta hi afegeix un apartat amb uns altres nombres: a
     sota del grup, no en substitució. */
  await pa.click('#agrupa');
  await pa.waitForTimeout(300);
  await pa.evaluate(() => document.querySelector('.pregunta-eines [data-apartat="2"]').click());
  await pa.waitForTimeout(300);
  const mes = await pa.evaluate(() => ({
    nums: [...document.querySelectorAll('.pregunta-num')].map(x => x.textContent).join(' '),
    lletres: [...document.querySelectorAll('.apartat-lletra')].map(x => x.textContent).join(' '),
    textos: [...document.querySelectorAll('.apartat .pregunta-cos')].map(x => x.textContent),
    control: document.querySelector('#nombre-valor').textContent
  }));
  comprova('el «+» afegeix l\'apartat d) a sota del grup',
    mes.nums === '1. 2. 3.' && mes.lletres === 'a) b) c) d)' && mes.control === '6',
    `${mes.nums} / ${mes.lletres} / ${mes.control}`);
  comprova('l\'apartat nou té uns altres nombres', new Set(mes.textos).size === mes.textos.length,
    mes.textos.join(' | '));
  /* Un apartat nou a la primera pregunta (sola): fa 1a i 1b. */
  await pa.evaluate(() => document.querySelector('.pregunta-eines [data-apartat="0"]').click());
  await pa.waitForTimeout(300);
  comprova('a una pregunta sola, el «+» en fa 1a i 1b',
    await pa.evaluate(() => [...document.querySelectorAll('.apartat-lletra')]
      .map(x => x.textContent).join(' ')) === 'a) b) a) b) c) d)');
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
