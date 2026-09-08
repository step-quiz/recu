/* Proves de la lògica. Només Node, cap dependència:  node tools/tests.js
   No comproven la interfície (això ho fa tools/prova.js amb un navegador),
   sinó les tres coses que si es trenquen fan mal en paper: que la suma de
   punts doni el que toca, que no es repeteixi cap pregunta i que el mateix
   codi doni sempre el mateix examen. */
const path = require('path');
global.window = global;
const arrel = path.resolve(__dirname, '..');
require(path.join(arrel, 'assets/js/mapa.js'));
require(path.join(arrel, 'assets/js/banc.js'));
require(path.join(arrel, 'assets/js/atzar.js'));
require(path.join(arrel, 'assets/js/generadors.js'));
require(path.join(arrel, 'assets/js/composa.js'));

let ok = 0, ko = 0;
function comprova(nom, cond, extra) {
  if (cond) { ok++; }
  else { ko++; console.log('  FALLA: ' + nom + (extra ? '  ' + extra : '')); }
}

const banc = {};
window.BANC.items.forEach(i => { banc[i.id] = i; });
const sp = {};
const cursos = window.MAPA.cursos;
cursos.forEach(c => c.sabers.forEach(s => { sp[s.id] = s; }));

/* -------------------------------------------------- integritat de les dades */
console.log('Dades');
let orfes = 0;
cursos.forEach(c => c.sabers.forEach(s =>
  s.items.forEach(id => { if (!banc[id]) orfes++; })));
comprova('cap saber apunta a un ítem inexistent', orfes === 0, `(${orfes} orfes)`);

/* Alguns ítems propis són només la figura més la consigna: la pregunta és
   el dibuix. El que no pot passar és que no hi hagi res a mostrar. */
comprova('tots els ítems tenen alguna cosa per mostrar',
  window.BANC.items.every(i => (i.enunciat && i.enunciat.length) || i.figura));
comprova('els ítems sense enunciat conserven la consigna encara que s\'apaguin',
  window.BANC.items.filter(i => !i.enunciat).every(i => i.cap && i.capCal));
comprova('cap saber del currículum es queda sense preguntes',
  cursos.every(c => c.sabers.every(s => s.items.length)));
/* Cap equació amb denominadors al nivell mínim: resoldre x/5 = 3 no és de
   mínims per a qui ve de suspendre tot el curs, encara que sigui d'un pas. */
comprova('cap ítem de nivell 1 porta fraccions fora del seu tema',
  window.BANC.items.filter(i => i.nivell === 1 && /\\d?frac/.test(i.enunciat))
    .every(i => ['fraccions', 'decimals', 'percentatges',
                 'factor_multiplicador', 'directa_inversa'].includes(i.bloc)),
  window.BANC.items.filter(i => i.nivell === 1 && /\\d?frac/.test(i.enunciat))
    .map(i => i.id + '/' + i.bloc).slice(0, 5).join());
comprova('el bloc de fraccions conserva els seus ítems de nivell 1',
  window.BANC.items.filter(i => i.bloc === 'fraccions' && i.nivell === 1).length > 10);
comprova('tots els sabers tenen almenys un ítem de nivell 1',
  cursos.every(c => c.sabers.every(s => s.perNivell[0] > 0)),
  cursos.flatMap(c => c.sabers).filter(s => !s.perNivell[0]).map(s => s.id).join());
comprova('tots els ítems tenen solució',
  window.BANC.items.every(i => {
    try {
      const s = JSON.parse(Buffer.from(i.sol, 'base64').toString('utf8'));
      return s.r && s.r.length;
    } catch (e) { return false; }
  }));
comprova('tots els ítems pertanyen a algun saber',
  window.BANC.items.every(i => i.sabers && i.sabers.length));
comprova('la dificultat és 1, 2 o 3',
  window.BANC.items.every(i => [1, 2, 3].includes(i.dif)));
comprova('el nivell recalculat és 1, 2 o 3',
  window.BANC.items.every(i => [1, 2, 3].includes(i.nivell)));
comprova('cap ítem repeteix l\'encapçalament dins de l\'enunciat',
  window.BANC.items.every(i => !i.cap ||
    !i.enunciat.replace(/<[^>]+>/g, '').trim().toLowerCase()
      .startsWith(i.cap.replace(/<[^>]+>/g, '').trim().toLowerCase().slice(0, 25))));
comprova('divisibilitat de 1r i 2n no té nombres negatius',
  ['1eso-num-divisibilitat', '2eso-num-divisibilitat'].every(id =>
    sp[id].items.every(x => !/[−-]\s*\d/.test(banc[x].enunciat))));
comprova('cap enunciat es refereix a unes opcions que no s\'imprimeixen',
  window.BANC.items.every(i => !/qu(in|ina)\s+d'aquest/i.test(i.enunciat)));
comprova('hi ha els tres cursos', cursos.length === 3 &&
  cursos.map(c => c.id).join() === '1eso,2eso,3eso');

/* Veredictes del departament sobre ítems concrets, del repàs d'una prova
   impresa. Són el criteri real de què és assequible per a un alumne que ve
   de suspendre tot el curs, i queden aquí perquè cap recalibració futura de
   `calcula_nivell` els pugui desfer sense que salti una prova. */
console.log('Nivell contra el criteri del departament');
const VEREDICTES = [
  ['f1-5a',    'fora', 'descomposició factorial de 3850: nombre massa gran'],
  ['f2-37b',   'fora', '[(-5)*3]^5 dona -759375'],
  ['f7-140b',  'fora', 'trapezi amb l\'alçada donada com sqrt(164)'],
  ['f11-224a', 'fora', 'llista de 50 dades per dir de quin tipus és la variable'],
  ['f1-24f',   'fora', '7/9*(-12/5)+(-3/4): obliga a un m.c.m. gros, dona -157/60'],
  ['f7-140a',  'val',  'trapezi de bases 3 i 10, alçada 6'],
  ['f7-123c',  'val',  'diagonal d\'un rectangle 5x8: l\'arrel és el RESULTAT'],
  ['f6-276a',  'val',  'augmentar una quantitat un 20 %'],
  ['f5-75a',   'val',  'equació de primer grau'],
  ['f1-1c',    'val',  'operacions combinades amb enters']
];
VEREDICTES.forEach(([id, veredicte, per]) => {
  const it = banc[id];
  if (!it) { comprova(`${id} existeix`, false); return; }
  comprova(
    `${id} ${veredicte === 'val' ? 'és de nivell 1' : 'NO és de nivell 1'} (${per})`,
    veredicte === 'val' ? it.nivell === 1 : it.nivell > 1,
    `nivell ${it.nivell}`);
});

/* ------------------------------------------------------------- generadors */
console.log('Generadors propis');
{
  const G = window.GENERADORS;
  comprova('hi ha generadors carregats', G.llista.length > 40, String(G.llista.length));
  comprova('cap id de generador repetit',
    new Set(G.llista.map(g => g.id)).size === G.llista.length);
  comprova('tots declaren sabers i nivell',
    G.llista.every(g => g.sabers.length && [1, 2, 3].includes(g.nivell)));

  /* La mateixa llavor ha de donar la mateixa pregunta: sense això,
     l'enllaç desat d'una prova no la reconstruiria. */
  const a = G.crea('div-mcd', 'x9'), b = G.crea('div-mcd', 'x9');
  comprova('la mateixa llavor dona la mateixa variant',
    JSON.stringify(a) === JSON.stringify(b));
  comprova('llavors diferents donen variants diferents',
    G.llista.some(g => {
      const v = new Set();
      for (let i = 0; i < 20; i++) v.add(G.crea(g.id, i).enunciat);
      return v.size > 1;
    }));

  let mal = [];
  G.llista.forEach(g => {
    for (let i = 0; i < 40; i++) {
      const it = G.crea(g.id, 'z' + i);
      if (!it) { mal.push(g.id + ': no crea'); break; }
      if (!it.enunciat && !it.figura) mal.push(g.id + ': sense enunciat ni figura');
      if (!it.resposta || !it.passos.length) mal.push(g.id + ': sense solució');
      const t = it.cap + it.enunciat + it.resposta + it.passos.join('');
      if ((t.match(/\$/g) || []).length % 2) mal.push(g.id + ': LaTeX desaparellat');
    }
  });
  /* Llengua i notació: tot això surt imprès i es va veure en un full. */
  let llengua = [];
  const revisa = (id, re, que) => {
    for (let i = 0; i < 120; i++) {
      const it = G.crea(id, 'L' + i);
      const t = it.cap + ' ' + it.enunciat + ' ' + it.resposta + ' ' + it.passos.join(' ');
      if (re.test(t)) { llengua.push(id + ': ' + que); break; }
    }
  };
  revisa('tau-maxim', /recull la (gols|alumnes|llibres)/, 'concordança de l\'article');
  revisa('tau-suma', /recull la (gols|alumnes|llibres)/, 'concordança de l\'article');
  revisa('tau-maxim', /\bel [aeiouàèéíòóú]/i, 'apostrofació de l\'article');
  revisa('mov-vector', /- \(\d/, 'parèntesis en un positiu');
  revisa('mov-translacio', /\+ -/, 'signes «+ −» seguits');
  revisa('per-regular', /(triangle|quadrilàter) regular/, 'nom del polígon regular');
  revisa('pol-angles', /\b1 triangles\b/, 'plural amb un sol element');
  comprova('cap generador escriu català incorrecte', !llengua.length,
    [...new Set(llengua)].join(' | '));

  /* Una pregunta amb dues respostes bones fa que el full de correcció en
     doni una per dolenta. Passava en el 31 % de les taules. */
  let empats = 0;
  for (let i = 0; i < 300; i++) {
    const v = (G.crea('tau-maxim', 'E' + i).enunciat.match(/<td>\d+<\/td>/g) || [])
      .map(x => +x.replace(/\D/g, ''));
    const mx = Math.max(...v);
    if (v.filter(x => x === mx).length > 1) empats++;
  }
  comprova('tau-maxim no genera màxims empatats', empats === 0, String(empats));

  /* KaTeX compon la «i» com una variable en cursiva si va dins dels dòlars.
     Cal mirar cada camp per separat i només dins de cada tros $…$: enganxant
     l'enunciat amb la solució, els dòlars s'aparellen mal i surten falsos
     positius. */
  const conjuncioSolta = txt => (String(txt || '').match(/\$[^$]*\$/g) || [])
    .some(tros => /[\d}]\s+i\s+[\d\\]/.test(tros));
  const ambConjuncio = window.BANC.items.filter(i => {
    const sol = JSON.parse(Buffer.from(i.sol, 'base64').toString('utf8'));
    return [i.cap, i.enunciat, sol.r].concat(sol.p || []).some(conjuncioSolta);
  });
  comprova('cap conjunció solta dins del mode matemàtic',
    !ambConjuncio.length, ambConjuncio.slice(0, 3).map(i => i.id).join());

  comprova('40 variants de cada generador surten senceres', !mal.length,
    [...new Set(mal)].slice(0, 3).join(' | '));

  /* Els ítems propis del banc han de dur d'on venen: és el que permet
     demanar-ne uns altres nombres i reconstruir-los des de l'adreça. */
  const props = window.BANC.items.filter(i => i.full === 0);
  comprova('els ítems propis porten generador i llavor',
    props.length > 200 && props.every(i => i.gen && i.llavor), String(props.length));
  comprova('el generador de cada ítem propi existeix',
    props.every(i => G.perId[i.gen]));
  /* Cap interruptor pot buidar una pregunta. Els tres bugs de la família
     —`capCal` deduït dues vegades, les figures apagades, i el llindar de 25
     caràcters— es tanquen tots amb aquesta comprovació. */
  const netej = t => String(t || '').replace(/<[^>]+>/g, ' ')
    .replace(/\\[a-zA-Z]+/g, ' ').replace(/[${}\\]/g, '')
    .replace(/\s+/g, ' ').trim();
  let buides = [];
  for (const ambCap of [true, false]) {
    for (const ambFig of [true, false]) {
      window.BANC.items.forEach(i => {
        const cap = (ambCap || i.capCal) && i.cap ? netej(i.cap) + ' ' : '';
        const teFig = i.figura && (ambFig || i.figuraCal);
        if ((cap + netej(i.enunciat)).trim().length < 12 && !teFig) buides.push(i.id);
      });
    }
  }
  comprova('cap ítem queda buit amb cap combinació de figures i encapçalaments',
    !buides.length, [...new Set(buides)].slice(0, 4).join());

  /* `capCal` i `figuraCal` els declara el generador i el compilador els
     copia: no s'han de tornar a deduir enlloc. */
  comprova('els ítems propis hereten capCal i figuraCal del generador',
    props.every(i => i.capCal === G.perId[i.gen].capCal &&
                     i.figuraCal === G.perId[i.gen].figuraCal));

  /* Totes les variants d'un generador són el mateix exercici pare: si no,
     la regla de «un pare només un cop» no les separa i surten sis
     preguntes que en mesuren dues. */
  const exPerGen = {};
  props.forEach(i => { (exPerGen[i.gen] = exPerGen[i.gen] || new Set()).add(i.ex); });
  comprova('les variants d\'un generador comparteixen exercici pare',
    Object.values(exPerGen).every(s => s.size === 1),
    Object.entries(exPerGen).filter(([, s]) => s.size > 1).map(([g]) => g).join());

  comprova('el nivell del catàleg coincideix amb el declarat pel generador',
    props.every(i => i.nivell === G.perId[i.gen].nivell),
    props.filter(i => i.nivell !== G.perId[i.gen].nivell).map(i => i.id).slice(0, 3).join());
}

/* ------------------------------------------------------------- repartiment */
console.log('Repartiment');
for (const n of [1, 5, 7, 13, 20, 31]) {
  const r = window.Composa.reparteix([9, 4, 4, 3, 6, 2], n);
  comprova(`reparteix suma ${n}`, r.reduce((a, b) => a + b, 0) === n, JSON.stringify(r));
}
comprova('reparteix amb pes zero no peta',
  window.Composa.reparteix([0, 0, 0], 5).reduce((a, b) => a + b, 0) === 0);

console.log('Puntuació');
/* Punts per pes: una pregunta de nivell 3 ha de valer més que una d'1. */
{
  const p = window.Composa.puntua([1, 1, 2, 2], 10);
  comprova('els pesos es respecten', p[2] > p[0] && p[3] > p[1], JSON.stringify(p));
  comprova('amb pesos, la suma quadra',
    Math.abs(p.reduce((a, b) => a + b, 0) - 10) < 1e-9);
}
{
  /* Punts fixats a mà: la resta es reparteixen el que sobra. */
  const preg = [{ itemId: 'x', saberId: null, fix: 3 },
                { itemId: 'y', saberId: null },
                { itemId: 'z', saberId: null }];
  const suma = window.Composa.reparteixPunts(preg, 10, 'igual', {}, {});
  comprova('un valor fixat es conserva', preg[0].punts === 3, String(preg[0].punts));
  comprova('la resta es reparteix el que sobra',
    Math.abs(suma - 10) < 1e-9 && preg[1].punts === preg[2].punts,
    JSON.stringify(preg.map(q => q.punts)));
}
for (const [n, t] of [[7, 10], [18, 10], [3, 10], [11, 7.5], [1, 10], [20, 20]]) {
  const p = window.Composa.puntua(n, t);
  const suma = p.reduce((a, b) => a + b, 0);
  comprova(`punts de ${n} preguntes sumen ${t}`, Math.abs(suma - t) < 1e-9, `-> ${suma}`);
  comprova(`punts de ${n} en múltiples de 0,25`,
    p.every(x => Math.abs(x * 4 - Math.round(x * 4)) < 1e-9));
}

/* ------------------------------------------------------------- composició */
console.log('Composició');
const tots = cursos.flatMap(c => c.sabers.filter(s => s.items.length).map(s => s.id));
const base = { perfil: 'minims', pes: 'hores', ordre: 'curriculum', punts: 10 };

/* Dos bugs alhora. Amb 30 preguntes i 5 punts sortien deu preguntes a «0 p»
   impreses; i el bucle de decrement escurçava el repartiment, de manera que
   12 preguntes sobre 3 punts sumaven 3,25 tot i que 3 és assolible. La
   segona comprovació és la que hauria fet saltar el segon bug: no n'hi ha
   prou de mirar que cap sigui zero, la suma ha de ser la mínima possible. */
/* Amb pesos DESIGUALS, que és el cas que va destapar el desquadrament: amb
   pesos uniformes el bucle de decrement no s'arribava a exercitar. */
for (const [pesos, t] of [[[2, 3, 4, 12, 5, 6], 3], [[1, 1, 2, 2], 10],
                          [[9, 4, 4, 3, 6, 2], 2], [[1, 5], 0.5],
                          [[3, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], 3]]) {
  const p = window.Composa.puntua(pesos, t);
  const esperat = Math.max(t, window.Composa.puntsMinims(pesos.length));
  comprova(`pesos [${pesos}] sobre ${t}: suma ${esperat}`,
    Math.abs(p.reduce((a, b) => a + b, 0) - esperat) < 1e-9,
    String(p.reduce((a, b) => a + b, 0)));
  comprova(`pesos [${pesos}] sobre ${t}: cap a zero`, p.every(x => x >= 0.25));
}
for (const [n, t] of [[30, 5], [15, 1], [15, 3], [40, 2], [12, 3], [3, 0.5]]) {
  const p = window.Composa.puntua(n, t);
  comprova(`punts de ${n} sobre ${t}: cap pregunta a zero`, p.every(x => x >= 0.25));
  const esperat = Math.max(t, window.Composa.puntsMinims(n));
  comprova(`punts de ${n} sobre ${t}: la suma és la mínima assolible (${esperat})`,
    Math.abs(p.reduce((a, b) => a + b, 0) - esperat) < 1e-9,
    String(p.reduce((a, b) => a + b, 0)));
}

for (const curs of cursos) {
  const sel = curs.sabers.filter(s => s.items.length).map(s => s.id);
  for (const n of [3, 8, 14, 20]) {
    const r = window.Composa.composa(
      { ...base, sabers: sel, nombre: n, llavor: 'T' + n }, banc, sp);
    const ids = r.preguntes.map(q => q.itemId);
    comprova(`${curs.id}/${n}: cap pregunta repetida`,
      new Set(ids).size === ids.length);
    /* Un exercici pare es pot repetir dins d'un mateix saber quan aquell
       saber no té més exercicis pare que preguntes li han tocat (per
       exemple, "Càlcul de perímetres" de 1r només té l'exercici 126, amb
       dos apartats). El que no pot passar mai és que es repeteixi tenint-ne
       d'altres per triar. */
    const pare = id => banc[id].full + '-' + banc[id].ex;
    let malament = null;
    sel.forEach(sid => {
      const meves = r.preguntes.filter(q => q.saberId === sid).map(q => q.itemId);
      const distints = new Set(meves.map(pare)).size;
      const disponibles = new Set(sp[sid].items.map(pare)).size;
      if (distints < meves.length && distints < Math.min(meves.length, disponibles)) {
        malament = sid;
      }
    });
    comprova(`${curs.id}/${n}: cap exercici pare repetit sense necessitat`,
      malament === null, malament || '');
    comprova(`${curs.id}/${n}: no en surten més de les demanades`,
      r.preguntes.length <= n);
    comprova(`${curs.id}/${n}: cada pregunta ve d'un saber marcat`,
      r.preguntes.every(q => sel.includes(q.saberId)));
  }
}

const c1 = window.Composa.composa({ ...base, sabers: tots, nombre: 16, llavor: 'IGUAL' }, banc, sp);
const c2 = window.Composa.composa({ ...base, sabers: tots, nombre: 16, llavor: 'IGUAL' }, banc, sp);
comprova('la mateixa llavor dona el mateix examen',
  JSON.stringify(c1.preguntes) === JSON.stringify(c2.preguntes));
const c3 = window.Composa.composa({ ...base, sabers: tots, nombre: 16, llavor: 'ALTRA' }, banc, sp);
comprova('una llavor diferent dona un examen diferent',
  JSON.stringify(c1.preguntes) !== JSON.stringify(c3.preguntes));

comprova('sense sabers, cap pregunta',
  window.Composa.composa({ ...base, sabers: [], nombre: 10, llavor: 'X' }, banc, sp)
    .preguntes.length === 0);

/* El perfil "mínims" ha de carregar de debò a les preguntes fàcils: si no,
   l'examen de recuperació acaba sent més dur que l'ordinari. */
const facil = window.Composa.composa(
  { ...base, perfil: 'minims', sabers: tots, nombre: 24, llavor: 'F' }, banc, sp);
const dur = window.Composa.composa(
  { ...base, perfil: 'exigent', sabers: tots, nombre: 24, llavor: 'F' }, banc, sp);
const mitjana = r => r.preguntes.reduce((a, q) => a + banc[q.itemId].nivell, 0) / r.preguntes.length;
comprova('«mínims» és més fàcil que «exigent»', mitjana(facil) < mitjana(dur),
  `${mitjana(facil).toFixed(2)} vs ${mitjana(dur).toFixed(2)}`);
comprova('«mínims» és gairebé tot nivell 1', mitjana(facil) < 1.25,
  mitjana(facil).toFixed(2));
comprova('un perfil desconegut no peta', (() => {
  try {
    return window.Composa.composa(
      { ...base, perfil: 'inventat', sabers: tots, nombre: 6, llavor: 'Q' },
      banc, sp).preguntes.length > 0;
  } catch (e) { return false; }
})());

/* L'avís ha de NOMENAR el contingut que s'ha quedat sense pregunta. */
const pocs = window.Composa.composa(
  { ...base, sabers: tots, nombre: 4, llavor: 'AV' }, banc, sp);
comprova('l\'avís nomena els continguts sense pregunta',
  pocs.avisos.some(a => a.startsWith('Sense cap pregunta')), JSON.stringify(pocs.avisos));

/* ------------------------------------------------------------------ atzar */
console.log('Atzar');
const a = new window.Atzar('AB12');
const mostra = Array.from({ length: 2000 }, () => a.enter(10));
comprova('enter(10) es queda dins del rang', mostra.every(x => x >= 0 && x < 10));
comprova('enter(10) fa servir les deu caselles', new Set(mostra).size === 10);
const llista = [1, 2, 3, 4, 5, 6, 7, 8];
const bar = new window.Atzar('X').barreja(llista);
comprova('barreja conserva tots els elements',
  bar.slice().sort().join() === llista.join());
comprova('barreja no toca l\'original', llista.join() === '1,2,3,4,5,6,7,8');

console.log(`\n${ok} correctes, ${ko} fallades`);
process.exit(ko ? 1 : 0);
