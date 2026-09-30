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

    /* `falten` pot ser negatiu si el terra d'un quart s'ha menjat el total.
       El bucle va per voltes i no per quarts: la versió anterior feia
       `falten++` en saltar una pregunta que ja era a 0,25, i això escurçava
       el bucle en comptes d'allargar-lo. Resultat mesurat: 12 preguntes
       sobre 3 punts sumaven 3,25 quan 3 és perfectament assolible. */
    var pas = falten > 0 ? 1 : -1, voltes = 0, sostre = ordre.length * 8;
    while (falten !== 0 && voltes < sostre) {
      var idx = ordre[voltes % ordre.length].i;
      voltes++;
      if (pas < 0 && base[idx] <= 1) continue;    // no es pot baixar de 0,25
      base[idx] += pas;
      falten -= pas;
    }
    return base.map(function (q) { return q / 4; });
  }

  /** El mínim que pot valer una prova: cada pregunta a 0,25. */
  function puntsMinims(n) { return n * 0.25; }

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

    /* Ids únics: Divisibilitat de 1r i de 2n comparteixen els mateixos
       exercicis, i sumant-los el banc semblava el doble de gros del que
       és. Amb el màxim del control a 15 no s'hi arribava mai; a 30, sí. */
    var unics = {};
    sabers.forEach(function (s) { s.items.forEach(function (id) { unics[id] = true; }); });
    var disponibles = Object.keys(unics).length;
    var nombre = Math.min(spec.nombre, disponibles);

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

    var usats = {}, paresUsats = {};
    var perSaber = sabers.map(function (s, k) {
      return triaDelSaber(s, banc, quotes[k], spec.perfil, atzar, usats, paresUsats);
    });

    /* Un contingut amb menys preguntes que la seva quota deixava un forat:
       Fraccions i decimals (8 ítems) i Llenguatge algebraic (12) amb 30
       preguntes demanades en donaven 18, i l'avís en prometia 20. El que
       sobra es reparteix, d'una en una i per ordre de pes, entre els que
       encara en tenen. */
    var falten = nombre - perSaber.reduce(function (a, l) { return a + l.length; }, 0);
    var perPes = pesos.map(function (p, k) { return k; })
                      .sort(function (a, b) { return pesos[b] - pesos[a] || a - b; });
    while (falten > 0) {
      var abans = falten;
      for (var j = 0; j < perPes.length && falten > 0; j++) {
        var k = perPes[j];
        var mes = triaDelSaber(sabers[k], banc, 1, spec.perfil, atzar, usats, paresUsats);
        if (mes.length) { perSaber[k] = perSaber[k].concat(mes); falten--; }
      }
      if (falten === abans) break;
    }
    var preguntes = [].concat.apply([], perSaber);

    if (preguntes.length < spec.nombre) {
      avisos.push('Els continguts triats només donen ' + preguntes.length +
                  ' preguntes diferents: la prova en tindrà ' + preguntes.length + '.');
    }

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
      /* Pel NIVELL recalculat, no pel `dif` de repàs: és el que es mostra
         al panell i el que fa servir app.js en reordenar. Amb `dif`, la
         mateixa prova sortia en un ordre o en un altre segons si s'havia
         generat o reordenat. L'ordenació és estable: dins d'un nivell es
         conserva l'ordre del currículum. */
      preguntes.sort(function (a, b) {
        return (banc[a.itemId].nivell || 2) - (banc[b.itemId].nivell || 2);
      });
    } else if (spec.ordre === 'barrejat') {
      preguntes = atzar.barreja(preguntes);
    }
    // 'curriculum' = l'ordre en què s'han generat, que ja és el del document
    // del departament perquè `sabers` ve ordenat.

    return { preguntes: preguntes, avisos: avisos };
  }

  /**
   * Exercicis de pràctica per al pla de repàs: `n` per contingut, triats
   * amb el mateix perfil de nivell que la prova.
   *
   * La regla que importa: cap pregunta de la prova hi pot sortir. I, mentre
   * n'hi hagi d'altres, tampoc cap apartat del mateix exercici pare que una
   * pregunta de la prova (21a a la prova i 21b a la pràctica és, a efectes
   * pràctics, donar-li l'examen). Si el contingut no té res més, s'admet un
   * altre apartat o una altra variant del mateix generador: practicar el
   * mateix tipus d'exercici amb uns altres nombres és legítim; repetir la
   * pregunta, no.
   *
   * Funció pura i determinista: surt de la llavor de la prova, o sigui que
   * la mateixa adreça torna el mateix pla.
   *
   * spec = { sabers:[id], n:int, perfil, llavor, prova:[itemId] }
   * Retorna { idSaber: [itemId] }.
   */
  function practica(spec, banc, sabersPerId) {
    var pare = function (it) { return it.full + '-' + it.ex; };
    var pes = PERFILS[spec.perfil] || PERFILS.minims;
    var usats = {}, paresProva = {}, out = {};
    spec.prova.forEach(function (id) {
      usats[id] = true;
      if (banc[id]) paresProva[pare(banc[id])] = true;
    });

    spec.sabers.forEach(function (sid) {
      var s = sabersPerId[sid];
      if (!s || !spec.n) return;
      var atzar = new glob.Atzar('practica|' + spec.llavor + '|' + sid);
      var candidats = s.items.map(function (id) { return banc[id]; })
                             .filter(function (it) { return it && !usats[it.id]; });
      var tria = [], pares = {};
      var lliure = function (it) { return !usats[it.id]; };
      while (tria.length < spec.n) {
        // De més a menys exigent: pare nou; pare que no sigui de la prova;
        // qualsevol ítem que no s'hagi fet servir.
        var lliures = candidats.filter(function (it) {
          return lliure(it) && !pares[pare(it)] && !paresProva[pare(it)];
        });
        if (!lliures.length) {
          lliures = candidats.filter(function (it) { return lliure(it) && !paresProva[pare(it)]; });
        }
        if (!lliures.length) lliures = candidats.filter(lliure);
        if (!lliures.length) break;
        var t = atzar.triaPonderada(lliures, function (it) { return pes[it.nivell] || 0.02; });
        usats[t.id] = true;
        pares[pare(t)] = true;
        tria.push(t.id);
      }
      out[sid] = tria;
    });
    return out;
  }

  /**
   * Apartats d'un mateix exercici: preguntes CONSECUTIVES amb el mateix
   * exercici pare i la mateixa consigna surten com una sola pregunta amb
   * apartats (6a, 6b), que és com s'escriu un examen a mà. La consigna
   * s'imprimeix un sol cop.
   *
   * Cal que la consigna no sigui buida: sense, no hi ha res que les uneixi
   * a paper (dos problemes de «Comprensió lectora» surten del mateix
   * generador però són dos problemes diferents).
   *
   * Retorna { grups: [[índex, ...], ...], etiquetes: ['1', '2a', '2b', ...] }.
   * Amb `actiu` fals, cada pregunta és un grup d'un.
   */
  function agrupa(preguntes, banc, actiu) {
    var grups = [];
    preguntes.forEach(function (q, i) {
      var it = banc[q.itemId], ant = i ? banc[preguntes[i - 1].itemId] : null;
      var continua = actiu && it && ant && it.cap && it.cap === ant.cap &&
                     it.full === ant.full && it.ex === ant.ex;
      if (continua) grups[grups.length - 1].push(i);
      else grups.push([i]);
    });
    var lletres = 'abcdefghijklmnopqrstuvwxyz', etiquetes = [];
    grups.forEach(function (g, n) {
      g.forEach(function (i, k) {
        etiquetes[i] = String(n + 1) + (g.length > 1 ? (lletres[k] || '.' + (k + 1)) : '');
      });
    });
    return { grups: grups, etiquetes: etiquetes };
  }

  /* Minuts que necessita un alumne de recuperació per a una pregunta,
     segons el nivell. No surten dels passos de la resolució: mesurats, els
     tres nivells en tenen de mitjana gairebé els mateixos (1,8, 2,0 i 2,1).
     El que els separa és la lectura i la mena de nombres, que és justament
     el que mesura el nivell. Són una estimació: si amb els teus grups les
     proves et surten sistemàticament curtes o llargues, es toca aquí. */
  var MINUTS_NIVELL = { 1: 4, 2: 6, 3: 9 };

  /** Temps estimat de la prova, en minuts. Les preguntes pròpies compten com a nivell 2. */
  function minuts(preguntes, banc) {
    return preguntes.reduce(function (a, q) {
      var it = banc[q.itemId];
      return a + (MINUTS_NIVELL[it && it.nivell] || MINUTS_NIVELL[2]);
    }, 0);
  }

  glob.Composa = {
    composa: composa,
    practica: practica,
    agrupa: agrupa,
    minuts: minuts,
    MINUTS_NIVELL: MINUTS_NIVELL,
    reparteix: reparteix,
    puntua: puntua,
    puntsMinims: puntsMinims,
    reparteixPunts: reparteixPunts,
    PERFILS: PERFILS,
    PES_NIVELL: PES_NIVELL
  };
})(window);
