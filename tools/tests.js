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

comprova('tots els ítems tenen enunciat',
  window.BANC.items.every(i => i.enunciat && i.enunciat.length));
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

/* ------------------------------------------------------------- repartiment */
console.log('Repartiment');
for (const n of [1, 5, 7, 13, 20, 31]) {
  const r = window.Composa.reparteix([9, 4, 4, 3, 6, 2], n);
  comprova(`reparteix suma ${n}`, r.reduce((a, b) => a + b, 0) === n, JSON.stringify(r));
}
comprova('reparteix amb pes zero no peta',
  window.Composa.reparteix([0, 0, 0], 5).reduce((a, b) => a + b, 0) === 0);

console.log('Puntuació');
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
const mitjana = r => r.preguntes.reduce((a, q) => a + banc[q.itemId].dif, 0) / r.preguntes.length;
comprova('«mínims» és més fàcil que «exigent»', mitjana(facil) < mitjana(dur),
  `${mitjana(facil).toFixed(2)} vs ${mitjana(dur).toFixed(2)}`);

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
