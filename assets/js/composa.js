/* ===========================================================================
   Composició de l'examen.

   Entrada: què vol el professor (quins sabers, quantes preguntes, quin
   perfil de dificultat). Sortida: la llista de preguntes amb els punts.

   Funció pura: mateixa especificació i mateixa llavor, mateix examen. Tota
   la interfície viu a app.js; aquí no es toca el DOM.
   =========================================================================== */
(function (glob) {
  'use strict';

  /* Pesos per nivell (1 = curt i directe, 3 = llarg o d'interpretació).
     Aquests alumnes no van aprovar les matemàtiques en tot el curs anterior:
     arriben amb mancances grosses i el que els bloqueja no és el càlcul,
     és haver de llegir i decidir. Per això «mínims» i «equilibrat» viuen
     tots dos al nivell 1, i el nivell 3 només apareix a «exigent», que és
     el perfil per pujar nota, no per aprovar. */
  var PERFILS = {
    minims:     { 1: 14,  2: 0.4, 3: 0 },
    equilibrat: { 1: 2.6, 2: 2,   3: 0.25 },
    exigent:    { 1: 0.3, 2: 2.5, 3: 3 }
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
    var pes = PERFILS[perfil] || PERFILS.minims;
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

      var triat = atzar.triaPonderada(lliures, function (it) { return pes[it.nivell] || 0.02; });
      usats[triat.id] = true;
      paresUsats[triat.full + '-' + triat.ex] = true;
      tria.push({ itemId: triat.id, saberId: saber.id });
    }
    return tria;
  }

  /* Quant val una pregunta segons el seu nivell, quan es puntua per
     dificultat. Una de nivell 3 val el doble que una de nivell 1: prou per
     reconèixer que costa més, sense que una sola pregunta decideixi la nota. */
  var PES_NIVELL = { 1: 1, 2: 1.5, 3: 2 };

  /**
   * Reparteix `total` punts entre preguntes amb pesos relatius, en múltiples
   * de 0,25 i de manera que la suma doni exactament el total.
   *
   * `pesos` pot ser un nombre (n preguntes que valen igual) o un vector de
   * pesos. Les preguntes amb el pes més gran s'emporten els quarts sobrants,
   * pel mètode del residu més gran.
   *
   * Terra d'un quart de punt per pregunta: amb 30 preguntes i 5 punts el
   * repartiment cru deixava deu preguntes a "0 p" impreses al full.
   */
  function puntua(pesos, total) {
    if (typeof pesos === 'number') {
      pesos = new Array(pesos);
      for (var k = 0; k < pesos.length; k++) pesos[k] = 1;
    }
    var n = pesos.length;
    if (!n) return [];

    var quarts = Math.round(total * 4);
    if (quarts < n) quarts = n;

    var suma = pesos.reduce(function (a, b) { return a + Math.max(0, b); }, 0) || n;
    var exactes = pesos.map(function (p) { return (Math.max(0, p) / suma) * quarts; });
    var base = exactes.map(function (v) { return Math.max(1, Math.floor(v)); });
    var falten = quarts - base.reduce(function (a, b) { return a + b; }, 0);

    var ordre = exactes
      .map(function (v, i) { return { i: i, r: v - Math.floor(v) }; })
      .sort(function (a, b) { return b.r - a.r || a.i - b.i; });

    // `falten` pot ser negatiu si el terra d'un quart s'ha menjat el total.
    var pas = falten > 0 ? 1 : -1;
    for (var t = 0; t < Math.abs(falten); t++) {
      var idx = ordre[t % ordre.length].i;
      if (pas < 0 && base[idx] <= 1) { falten++; continue; }
      base[idx] += pas;
    }
    return base.map(function (q) { return q / 4; });
  }

  /**
   * Pesos de cada pregunta segons el criteri triat, respectant els punts que
   * el professor hagi fixat a mà. Una pregunta amb `fix` conserva el seu
   * valor i la resta es reparteixen el que sobra.
   */
  function reparteixPunts(preguntes, total, criteri, banc, sabersPerId) {
    var fixats = 0, lliures = [];
    preguntes.forEach(function (q, i) {
      if (q.fix != null) fixats += q.fix;
      else lliures.push(i);
    });

    var resta = Math.max(0, total - fixats);
    var pesos = lliures.map(function (i) {
      var q = preguntes[i], it = banc[q.itemId], s = sabersPerId[q.saberId];
      if (criteri === 'nivell') return it ? (PES_NIVELL[it.nivell] || 1) : 1;
      if (criteri === 'hores') return s ? s.hores : 4;
      return 1;
    });

    var repartits = lliures.length ? puntua(pesos, resta) : [];
    preguntes.forEach(function (q) { if (q.fix != null) q.punts = q.fix; });
    lliures.forEach(function (i, k) { preguntes[i].punts = repartits[k]; });

    return preguntes.reduce(function (a, q) { return a + q.punts; }, 0);
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
    }

    var usats = {}, paresUsats = {}, preguntes = [];
    sabers.forEach(function (s, k) {
      preguntes = preguntes.concat(
        triaDelSaber(s, banc, quotes[k], spec.perfil, atzar, usats, paresUsats));
    });

    /* Quins continguts marcats s'han quedat sense cap pregunta. És el que
       el professor necessita saber de debò: 94 ítems del banc pertanyen a
       més d'un saber (Divisibilitat de 1r i de 2n són literalment els
       mateixos), i sense això un contingut marcat pot desaparèixer de la
       prova sense que res el nomeni. */
    var cobert = {};
    preguntes.forEach(function (q) { cobert[q.saberId] = true; });
    var sense = sabers.filter(function (s) { return !cobert[s.id]; })
                      .map(function (s) { return s.titol; });
    if (sense.length) {
      avisos.push('Sense cap pregunta a la prova: ' + sense.join(', ') + '. ' +
                  (nombre < sabers.length
                    ? 'Puja el nombre de preguntes o desmarca continguts.'
                    : 'Aquests continguts comparteixen exercicis amb altres de ' +
                      'marcats i no es repeteix cap pregunta dins d\'una prova.'));
    }

    if (spec.ordre === 'dificultat') {
      preguntes.sort(function (a, b) { return banc[a.itemId].dif - banc[b.itemId].dif; });
    } else if (spec.ordre === 'barrejat') {
      preguntes = atzar.barreja(preguntes);
    }
    // 'curriculum' = l'ordre en què s'han generat, que ja és el del document
    // del departament perquè `sabers` ve ordenat.

    return { preguntes: preguntes, avisos: avisos };
  }

  glob.Composa = {
    composa: composa,
    reparteix: reparteix,
    puntua: puntua,
    reparteixPunts: reparteixPunts,
    PERFILS: PERFILS,
    PES_NIVELL: PES_NIVELL
  };
})(window);
