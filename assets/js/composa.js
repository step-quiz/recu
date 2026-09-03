/* ===========================================================================
   Composició de l'examen.

   Entrada: què vol el professor (quins sabers, quantes preguntes, quin
   perfil de dificultat). Sortida: la llista de preguntes amb els punts.

   Funció pura: mateixa especificació i mateixa llavor, mateix examen. Tota
   la interfície viu a app.js; aquí no es toca el DOM.
   =========================================================================== */
(function (glob) {
  'use strict';

  /* Pesos per nivell de dificultat (1 = bàsic, 3 = ampliació). Un examen de
     recuperació NO és un examen ordinari: el que ha de comprovar és si
     l'alumne ha assolit els mínims, i per això el perfil per defecte carrega
     a dificultat 1 i 2 i deixa la 3 com a testimoni. */
  var PERFILS = {
    minims:  { 1: 6, 2: 3, 3: 0.4 },
    equilibrat: { 1: 3, 2: 4, 3: 1.6 },
    exigent: { 1: 1, 2: 3, 3: 3 }
  };

  /**
   * Repartiment de n preguntes entre els sabers, proporcional al pes, pel
   * mètode del residu més gran (el mateix que fa servir `repas`): reparteix
   * la part entera i després dona les que sobren als residus més grans.
   * Així la suma sempre és exactament n, sense arrossegar arrodoniments.
   */
  function reparteix(pesos, n) {
    var total = pesos.reduce(function (a, b) { return a + b; }, 0);
    if (total <= 0 || n <= 0) return pesos.map(function () { return 0; });

    var exactes = pesos.map(function (p) { return (p / total) * n; });
    var base = exactes.map(Math.floor);
    var falten = n - base.reduce(function (a, b) { return a + b; }, 0);

    var ordre = exactes
      .map(function (v, i) { return { i: i, r: v - Math.floor(v) }; })
      .sort(function (a, b) { return b.r - a.r || a.i - b.i; });

    for (var k = 0; k < falten; k++) base[ordre[k % ordre.length].i]++;
    return base;
  }

  /**
   * Tria `quantes` preguntes d'un saber.
   *
   * Dues regles que importen més del que sembla en un examen de paper:
   *  - no repetir mai el mateix exercici pare (els ítems 21a, 21b, 21c són
   *    apartats del mateix exercici; posar-ne dos seguits no mesura res nou);
   *  - no repetir un ítem que ja ha entrat per un altre saber (divisibilitat
   *    surt a 1r i a 2n d'ESO i comparteixen banc).
   */
  function triaDelSaber(saber, banc, quantes, perfil, atzar, usats, paresUsats) {
    var pes = PERFILS[perfil] || PERFILS.equilibrat;
    var candidats = saber.items
      .map(function (id) { return banc[id]; })
      .filter(function (it) { return it && !usats[it.id]; });

    var tria = [];
    while (tria.length < quantes) {
      var lliures = candidats.filter(function (it) {
        return !usats[it.id] && !paresUsats[it.full + '-' + it.ex];
      });
      // Si ja no queden exercicis pare nous, s'admeten altres apartats
      // abans que deixar la pregunta sense omplir.
      if (!lliures.length) {
        lliures = candidats.filter(function (it) { return !usats[it.id]; });
      }
      if (!lliures.length) break;

      var triat = atzar.triaPonderada(lliures, function (it) { return pes[it.dif] || 0.1; });
      usats[triat.id] = true;
      paresUsats[triat.full + '-' + triat.ex] = true;
      tria.push({ itemId: triat.id, saberId: saber.id });
    }
    return tria;
  }

  /**
   * Reparteix `total` punts entre `n` preguntes en múltiples de 0,25, de
   * manera que la suma doni exactament el total. Les primeres preguntes
   * s'emporten el quart de punt sobrant.
   */
  function puntua(n, total) {
    if (!n) return [];
    var quarts = Math.round(total * 4);
    var base = Math.floor(quarts / n);
    var sobra = quarts - base * n;
    var punts = [];
    for (var i = 0; i < n; i++) punts.push((base + (i < sobra ? 1 : 0)) / 4);
    return punts;
  }

  /**
   * spec = {
   *   sabers:    [idSaber],            en l'ordre del currículum
   *   nombre:    int,
   *   perfil:    'minims'|'equilibrat'|'exigent',
   *   pes:       'hores'|'items'|'igual',
   *   ordre:     'curriculum'|'dificultat'|'barrejat',
   *   punts:     float (total de la prova),
   *   llavor:    string
   * }
   * Retorna { preguntes:[{itemId,saberId,punts}], avisos:[string] }
   */
  function composa(spec, banc, sabersPerId) {
    var atzar = new glob.Atzar(spec.llavor + '|' + spec.sabers.join(',') +
                               '|' + spec.nombre + '|' + spec.perfil);
    var avisos = [];

    var sabers = spec.sabers
      .map(function (id) { return sabersPerId[id]; })
      .filter(function (s) { return s && s.items.length; });

    if (!sabers.length) return { preguntes: [], avisos: [] };

    var disponibles = sabers.reduce(function (a, s) { return a + s.items.length; }, 0);
    var nombre = Math.min(spec.nombre, disponibles);
    if (nombre < spec.nombre) {
      avisos.push('Els sabers triats només tenen ' + disponibles +
                  ' preguntes al banc: la prova en tindrà ' + nombre + '.');
    }

    var pesos = sabers.map(function (s) {
      if (spec.pes === 'igual') return 1;
      if (spec.pes === 'items') return s.items.length;
      return s.hores;                                   // per defecte
    });

    var quotes = reparteix(pesos, nombre);

    // Cap saber seleccionat s'ha de quedar a zero mentre n'hi hagi un altre
    // amb més d'una pregunta: si el professor l'ha marcat, l'ha d'avaluar.
    if (nombre >= sabers.length) {
      for (var i = 0; i < quotes.length; i++) {
        if (quotes[i] !== 0) continue;
        var max = quotes.indexOf(Math.max.apply(null, quotes));
        if (quotes[max] > 1) { quotes[max]--; quotes[i] = 1; }
      }
    } else {
      var fora = sabers.filter(function (s, k) { return quotes[k] === 0; })
                       .map(function (s) { return s.titol; });
      avisos.push('Amb ' + nombre + ' preguntes no hi caben els ' + sabers.length +
                  ' continguts marcats. Queden fora: ' + fora.join(', ') + '.');
    }

    var usats = {}, paresUsats = {}, preguntes = [];
    sabers.forEach(function (s, k) {
      preguntes = preguntes.concat(
        triaDelSaber(s, banc, quotes[k], spec.perfil, atzar, usats, paresUsats));
    });

    if (preguntes.length < nombre) {
      avisos.push('Han sortit ' + preguntes.length + ' preguntes de les ' + nombre +
                  ' demanades: alguns continguts marcats comparteixen els mateixos ' +
                  'exercicis del banc i no es repeteix cap pregunta dins d\'una prova.');
    }

    if (spec.ordre === 'dificultat') {
      preguntes.sort(function (a, b) { return banc[a.itemId].dif - banc[b.itemId].dif; });
    } else if (spec.ordre === 'barrejat') {
      preguntes = atzar.barreja(preguntes);
    }
    // 'curriculum' = l'ordre en què s'han generat, que ja és el del document
    // del departament perquè `sabers` ve ordenat.

    var punts = puntua(preguntes.length, spec.punts);
    preguntes.forEach(function (p, i) { p.punts = punts[i]; });

    return { preguntes: preguntes, avisos: avisos };
  }

  glob.Composa = {
    composa: composa,
    reparteix: reparteix,
    puntua: puntua,
    PERFILS: PERFILS
  };
})(window);
