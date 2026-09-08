/* ===========================================================================
   Omple el catàleg d'ítems propis a partir de `assets/js/generadors.js`.

   No escriu cap fitxer: el catàleg surt per stdout i el consumeix
   `tools/compila.py`.

   Els generadors viuen en JavaScript perquè el navegador els ha de poder
   executar: és el que fa que el botó ↻ pugui donar «uns altres nombres»
   sense sortir del tipus de pregunta. Perquè no n'hi hagi dues versions,
   la compilació els executa amb Node, aquí, en comptes de tenir-ne una
   còpia en Python.

       node tools/genera.js               escriu tools/items-propis.json
       node tools/genera.js --comprova    verifica els generadors i no escriu
       node tools/genera.js --cataleg     treu el catàleg per stdout
       node tools/genera.js --mostra 200  treu N variants de cada generador

   Què comprova `--comprova`:
     · que cap generador peti en 200 tirades;
     · que sempre torni enunciat (o figura), resposta i passos;
     · que els dòlars de LaTeX estiguin aparellats;
     · que els m.c.d., els m.c.m., les arrels i les diagonals que diu la
       resposta siguin els que surten de recalcular-los.

   El NIVELL no es mesura aquí. El mesurador viu a `tools/compila.py` i és
   l'únic que hi ha; `--mostra` li dona variants perquè comprovi que el
   nivell declarat per cada generador és el que de debò tenen totes.

   La mida del catàleg (`PER_GENERADOR`) només decideix quantes variants
   entren a `banc.js` per triar-ne a l'atzar; el pou del botó ↻ és infinit.
   =========================================================================== */
'use strict';

const fs = require('fs');
const path = require('path');

const arrel = path.resolve(__dirname, '..');
global.window = global;
require(path.join(arrel, 'assets/js/atzar.js'));
require(path.join(arrel, 'assets/js/generadors.js'));

const GEN = global.GENERADORS;
const PER_GENERADOR = 6;      // variants de cada generador que van al catàleg
const MOSTRA = 200;           // tirades per generador a --comprova

/* ---------------------------------------------------------------- catàleg */
function catalog() {
  const items = [];
  for (const g of GEN.llista) {
    const vistos = new Set();
    // Es demanen més variants de les que calen: els generadors de llista
    // tancada (definicions, problemes) repeteixen, i els repetits es
    // descarten en comptes de sortir dos cops al banc.
    for (let s = 0; s < PER_GENERADOR * 8 && vistos.size < PER_GENERADOR; s++) {
      const it = GEN.crea(g.id, s);
      const firma = it.cap + '|' + it.enunciat + '|' + (it.figura || '');
      if (vistos.has(firma)) continue;
      vistos.add(firma);
      items.push(it);
    }
  }
  return items;
}

/* -------------------------------------------------------------- comprova */
function net(s) {
  return String(s || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[${}\\]/g, '')
    .replace(/\s+/g, ' ').trim();
}

function mcd(a, b) { while (b) { const t = b; b = a % b; a = t; } return a; }

/** Comprovacions aritmètiques concretes, per generador. */
function aritmetica(it, errors, aplicades) {
  const e = net(it.enunciat), r = net(it.resposta);
  const dos = e.match(/^(-?\d+) i (-?\d+)$/);
  if (it.gen === 'div-mcd' && dos) {
    aplicades['div-mcd'] = (aplicades['div-mcd'] || 0) + 1;
    const v = mcd(+dos[1], +dos[2]);
    if (!r.endsWith('= ' + v)) errors.push(`${it.gen}/${it.llavor}: m.c.d. incorrecte`);
  }
  if (it.gen === 'div-mcm' && dos) {
    aplicades['div-mcm'] = (aplicades['div-mcm'] || 0) + 1;
    const [a, b] = [+dos[1], +dos[2]];
    if (!r.endsWith('= ' + (a * b / mcd(a, b))))
      errors.push(`${it.gen}/${it.llavor}: m.c.m. incorrecte`);
  }
  if (it.gen === 'arr-exacta') {
    aplicades['arr-exacta'] = (aplicades['arr-exacta'] || 0) + 1;
    const n = +(it.enunciat.match(/sqrt\{(\d+)\}/) || [])[1];
    if (r !== String(Math.sqrt(n))) errors.push(`${it.gen}/${it.llavor}: arrel incorrecta`);
  }
  if (it.gen === 'pol-diagonals') {
    aplicades['pol-diagonals'] = (aplicades['pol-diagonals'] || 0) + 1;
    const n = +(e.match(/\((\d+) costats\)/) || [])[1];
    if (!r.startsWith(String(n * (n - 3) / 2)))
      errors.push(`${it.gen}/${it.llavor}: diagonals incorrectes`);
  }
  if (it.gen === 'pol-angles') {
    aplicades['pol-angles'] = (aplicades['pol-angles'] || 0) + 1;
    const n = +(e.match(/\((\d+) costats\)/) || [])[1];
    if (!r.startsWith(String((n - 2) * 180)))
      errors.push(`${it.gen}/${it.llavor}: suma d'angles incorrecta`);
  }
}

function comprova() {
  const errors = [];
  let variants = 0;
  /* Les comprovacions aritmètiques depenen de la redacció de l'enunciat: si
     algú la canvia, deixarien de comprovar res en silenci. Es compta quantes
     vegades s'han pogut aplicar i es reclama si alguna ha deixat de saltar. */
  const aplicades = {};

  for (const g of GEN.llista) {
    for (let s = 0; s < MOSTRA; s++) {
      let it;
      try {
        it = GEN.crea(g.id, 'c' + s);
      } catch (err) {
        errors.push(`${g.id}: peta amb la llavor c${s} — ${err.message}`);
        break;
      }
      variants++;
      if (!it.enunciat && !it.figura) errors.push(`${g.id}/c${s}: sense enunciat ni figura`);
      if (!it.resposta) errors.push(`${g.id}/c${s}: sense resposta`);
      if (!it.passos.length) errors.push(`${g.id}/c${s}: sense passos`);
      if (!it.sabers.length) errors.push(`${g.id}: sense cap saber`);
      const text = it.cap + it.enunciat + it.resposta + it.passos.join('');
      if ((text.match(/\$/g) || []).length % 2)
        errors.push(`${g.id}/c${s}: dòlars de LaTeX desaparellats`);
      aritmetica(it, errors, aplicades);
    }
  }

  ['div-mcd', 'div-mcm', 'arr-exacta', 'pol-diagonals', 'pol-angles']
    .forEach(g => {
      if (!aplicades[g]) {
        errors.push(`${g}: la comprovació aritmètica no s'ha pogut aplicar ` +
                    'ni una sola vegada. Ha canviat la redacció de l\'enunciat?');
      }
    });

  const cat = catalog();
  console.log(`Generadors: ${GEN.llista.length}`);
  console.log(`Variants provades: ${variants}`);
  console.log(`Ítems al catàleg: ${cat.length}`);

  const perSaber = {};
  cat.forEach(it => it.sabers.forEach(s => { perSaber[s] = (perSaber[s] || 0) + 1; }));
  Object.keys(perSaber).sort().forEach(s => {
    console.log(`  ${s.padEnd(26)} ${String(perSaber[s]).padStart(3)}`);
  });

  if (errors.length) {
    console.log('\nERRORS:');
    errors.slice(0, 30).forEach(e => console.log('  -', e));
    if (errors.length > 30) console.log(`  … i ${errors.length - 30} més`);
  } else {
    console.log('\nCap error.');
  }
  return !errors.length;
}

/* ------------------------------------------------------------------ main */
function main() {
if (process.argv.includes('--cataleg')) {
  fs.writeSync(1, JSON.stringify(catalog()));
  return;
}

const iMostra = process.argv.indexOf('--mostra');
if (iMostra >= 0) {
  // Variants en cru per a compila.py, que és qui en mesura el nivell.
  const n = parseInt(process.argv[iMostra + 1], 10) || 100;
  const out = [];
  for (const g of GEN.llista) {
    for (let s = 0; s < n; s++) out.push(GEN.crea(g.id, 'c' + s));
  }
  // Escriptura síncrona: amb `process.stdout.write` seguit de `process.exit`,
  // Node talla la sortida quan va a una canonada i el JSON arriba a mitges.
  fs.writeSync(1, JSON.stringify(out));
  return;
}

// No escriu cap fitxer: el catàleg va per stdout amb `--cataleg` i és
// `compila.py` qui el consumeix. Un JSON intermedi al repositori només
// seria una còpia que es quedaria vella.
process.exitCode = comprova() ? 0 : 1;
}

main();
