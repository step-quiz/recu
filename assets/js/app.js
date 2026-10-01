/* ===========================================================================
   Controlador de l'eina.

   Una sola font de veritat: `estat.preguntes`. `estat.spec` només descriu
   com GENERAR una llista nova; un cop generada, manen les preguntes. Aquesta
   distinció és el que abans no hi era, i per això treure'n una i tocar
   qualsevol control feia tornar les 18 originals.
   =========================================================================== */
(function () {
  'use strict';

  var MAPA = window.MAPA, BANC = window.BANC;
  var $ = function (s, on) { return (on || document).querySelector(s); };
  var esc = window.Full.esc;

  /* Índexs sense prototip. Les claus arriben de l'adreça, que pot ser
     qualsevol cosa: amb un `{}` normal, un id com «constructor» trobava la
     funció d'Object i entrava a la prova com una pregunta buida. */
  var buit = function () { return Object.create(null); };

  /* --------------------------------------------------------------- índexs */
  var banc = buit();
  BANC.items.forEach(function (it) { banc[it.id] = it; });

  /* --------------------------------------------------- material propi
     Els ítems que venen de `generadors.js` porten `gen` i `llavor`, i això
     vol dir que se'n pot demanar una altra variant sense sortir del tipus
     de pregunta: uns altres nombres, la mateixa cosa avaluada. Els 592 del
     banc de `repas` són text fix i només es poden intercanviar. */
  var GEN = window.GENERADORS ||
    { llista: [], perId: {}, crea: function () { return null; } };
  var exPerGen = {}, gensPerSaber = {};

  BANC.items.forEach(function (it) {
    if (it.gen && exPerGen[it.gen] === undefined) exPerGen[it.gen] = it.ex;
  });
  GEN.llista.forEach(function (g) {
    g.sabers.forEach(function (sid) {
      (gensPerSaber[sid] = gensPerSaber[sid] || []).push(g);
    });
  });

  /**
   * Construeix (i deixa al banc) una variant d'un generador. La parella
   * generador + llavor és l'identificador: `p-div-mcd-v7`. Per això n'hi ha
   * prou amb desar l'id a l'adreça perquè la prova es pugui reconstruir,
   * encara que la variant no fos al catàleg compilat.
   */
  function variant(gen, llavor) {
    var id = 'p-' + gen + '-' + llavor;
    if (banc[id]) return banc[id];
    var g = GEN.crea(gen, llavor);
    if (!g) return null;
    banc[id] = {
      id: id, full: 0, bloc: gen, blocTitol: 'Material propi del departament',
      ex: exPerGen[gen] !== undefined ? exPerGen[gen] : 900,
      ap: '', dif: 1, nivell: g.nivell, passos: g.passos.length,
      cap: g.cap, capCal: g.capCal, figuraCal: g.figuraCal,
      enunciat: g.enunciat, figura: g.figura, nota: '',
      sol: btoa(unescape(encodeURIComponent(JSON.stringify(
        { r: g.resposta, p: g.passos })))),
      sabers: g.sabers.slice(), gen: gen, llavor: llavor
    };
    return banc[id];
  }

  /** Una llavor nova que no xoqui amb cap variant que ja hi hagi. */
  var comptadorVariants = 0;
  function novaLlavor(gen) {
    var l;
    do { l = 'v' + (++comptadorVariants); } while (banc['p-' + gen + '-' + l]);
    return l;
  }

  var sabersPerId = buit(), ordreSabers = [];
  MAPA.cursos.forEach(function (c) {
    c.sabers.forEach(function (s) {
      sabersPerId[s.id] = s;
      ordreSabers.push(s.id);
    });
  });

  /** Els sabers sense cap pregunta no es mostren; només compten al peu del curs. */
  function ambBanc(sabers) {
    return sabers.filter(function (s) { return s.items.length; });
  }

  /** Plega accents: en català, «pitagores» ha de trobar «Pitàgores». */
  function plana(s) {
    return String(s || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[·'']/g, '');
  }

  /* ---------------------------------------------------------------- estat */
  var CAPCALERA_DESADA = 'recuperacio-eso:inicials';
  var valorsInicials = false;    // n'hi ha de desats en aquest navegador?

  /* La data d'avui en hora local. `toISOString()` treballa en UTC i
     escrivia el dia d'ahir per a qualsevol prova preparada de matinada. */
  function avui() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  var estat = {
    sabers: [],
    fixades: buit(),
    preguntes: [],
    propies: buit(),      // id -> {enunciat, solucio}, per poder desar-les
    avisos: [],
    editat: false,        // s'ha tocat la llista a mà?
    vista: 'prova',
    spec: {
      nombre: 10,
      perfil: 'minims',
      pes: 'hores',
      ordre: 'curriculum',
      punts: 10,
      criteriPunts: 'nivell',
      durada: 55,            // minuts que té l'alumne: una hora de classe
      llavor: window.Atzar.novaLlavor()
    },
    cfg: {
      centre: 'Departament de Matemàtiques',
      titol: 'Prova de recuperació de Matemàtiques',
      subtitol: '',
      alumne: '',
      grup: '',
      data: avui(),
      model: '',
      llavor: '',
      instruccions:
        'Resol cada exercici a l\'espai que hi ha a sota de l\'enunciat.\n' +
        'Cal escriure tot el procés: un resultat sense els passos no puntua.\n' +
        'Pots fer servir calculadora, però no el mòbil.',
      espai: 38,
      paper: 'quadricula',
      figures: true,
      encapcalaments: true,
      mostraPunts: false,
      // Preguntes consecutives del mateix exercici: 6a, 6b.
      agrupa: true,
      // Pla de repàs: exercicis de pràctica per contingut i les solucions.
      practica: 2,
      solucionsPla: true,
      // On és publicada l'eina. Si es deixa en blanc, el fitxer que baixa
      // «Desa la prova» apunta a l'adreça d'ara mateix, que amb doble clic
      // és un `file:///...` i deixa de funcionar si mous la carpeta.
      baseUrl: ''
    }
  };

  /* Els valors inicials: com vols trobar l'eina cada vegada que l'obris en
     aquest navegador. Es desa tota la configuració menys el que és d'una
     prova concreta —l'alumne, el grup, la data, el model i el codi de la
     tria—, perquè aquests han de tornar a començar de zero cada cop.

     Els continguts marcats sí que s'hi desen: qui recupera 2n d'ESO ho fa
     moltes vegades seguides i tornar-los a marcar cada cop és feina inútil. */
  var CAMPS_INICIALS = ['centre', 'titol', 'instruccions', 'espai', 'paper',
                        'figures', 'encapcalaments', 'mostraPunts', 'baseUrl',
                        'practica', 'solucionsPla', 'agrupa'];
  var SPEC_INICIALS = ['nombre', 'perfil', 'pes', 'ordre', 'punts', 'criteriPunts', 'durada'];

  function desaInicials() {
    try {
      var cfg = {}, spec = {};
      CAMPS_INICIALS.forEach(function (k) { cfg[k] = estat.cfg[k]; });
      SPEC_INICIALS.forEach(function (k) { spec[k] = estat.spec[k]; });
      localStorage.setItem(CAPCALERA_DESADA, JSON.stringify(
        { cfg: cfg, spec: spec, sabers: estat.sabers }));
      valorsInicials = true;
      pintaResums();
      avisaInicials('Desat. En obrir l\'eina en aquest navegador, la trobaràs així.');
    } catch (e) {
      avisaInicials('No s\'han pogut desar: el navegador no ho permet ' +
                    '(finestra privada?).');
    }
  }

  function oblidaInicials() {
    try { localStorage.removeItem(CAPCALERA_DESADA); } catch (e) { /* res */ }
    valorsInicials = false;
    pintaResums();
    avisaInicials('Oblidats. La pròxima vegada l\'eina s\'obrirà de sèrie.');
  }

  function avisaInicials(text) {
    var n = $('#inicials-avis');
    if (!n) return;
    n.textContent = text;
    clearTimeout(avisaInicials.t);
    avisaInicials.t = setTimeout(function () { n.textContent = ''; }, 4000);
  }

  function recuperaInicials() {
    try {
      var d = JSON.parse(localStorage.getItem(CAPCALERA_DESADA) || 'null');
      if (!d) return false;
      // Format antic (només la capçalera): es llegeix igualment.
      var cfg = d.cfg || d, spec = d.spec || {};
      CAMPS_INICIALS.forEach(function (k) {
        if (cfg[k] !== undefined) estat.cfg[k] = cfg[k];
      });
      SPEC_INICIALS.forEach(function (k) {
        if (spec[k] !== undefined) estat.spec[k] = spec[k];
      });
      if (d.sabers) {
        estat.sabers = d.sabers.filter(function (id) { return sabersPerId[id]; });
      }
      return true;
    } catch (e) { return false; }
  }

  function subtitolAutomatic() {
    var cursos = {};
    estat.sabers.forEach(function (id) { cursos[id.slice(0, 4)] = true; });
    var noms = MAPA.cursos
      .filter(function (c) { return cursos[c.id]; })
      .map(function (c) { return c.titol; });
    if (!noms.length) return '';
    if (noms.length === 1) return 'Continguts de ' + noms[0];
    return 'Continguts de ' + noms.slice(0, -1).join(', ') + ' i ' + noms[noms.length - 1];
  }

  /* --------------------------------------------------------- composició */
  function reparteixPunts() {
    var suma = window.Composa.reparteixPunts(
      estat.preguntes, estat.spec.punts, estat.spec.criteriPunts, banc, sabersPerId);

    /* Dues causes ben diferents, i abans totes dues deien el mateix:
         - el terra de 0,25 per pregunta puja el total, i no hi ha res a
           arreglar; és aritmètica;
         - hi ha punts escrits a mà, i llavors sí que es poden alliberar.
       Amb la prova buida no n'hi ha cap: la suma és 0 i el total 10, i
       l'avís sortia com a benvinguda perquè `0 != null` és cert. */
    var minim = window.Composa.puntsMinims(estat.preguntes.length);
    var fixats = estat.preguntes.some(function (q) { return q.fix != null; });
    estat.desquadrat = null;
    if (estat.preguntes.length && Math.abs(suma - estat.spec.punts) > 0.001) {
      estat.desquadrat = { suma: suma, fixats: fixats, minim: minim };
    }
  }

  /**
   * Tria un ítem d'un saber que no sigui a la prova, respectant el perfil i
   * evitant repetir exercici pare. Si el catàleg s'ha acabat però el saber
   * té generadors, en fabrica una variant nova.
   */
  function triaItem(saber, atzar, nivellFix) {
    var usats = {}, pares = {};
    estat.preguntes.forEach(function (x) {
      usats[x.itemId] = true;
      var it = banc[x.itemId];
      if (it) pares[it.full + '-' + it.ex] = true;
    });

    // Amb un nivell fixat el perfil general no compta: el professor ha dit
    // que aquella pregunta ha de ser d'aquell nivell i prou.
    var pes = nivellFix
      ? (function () { var p = { 1: 0, 2: 0, 3: 0 }; p[nivellFix] = 1; return p; })()
      : (window.Composa.PERFILS[estat.spec.perfil] || window.Composa.PERFILS.minims);
    var bo = function (it) { return !nivellFix || it.nivell === nivellFix; };

    var tots = saber.items.map(function (id) { return banc[id]; })
      .filter(function (it) { return it && bo(it); });
    var lliures = tots.filter(function (it) {
      return !usats[it.id] && !pares[it.full + '-' + it.ex];
    });
    if (!lliures.length) {
      lliures = tots.filter(function (it) { return !usats[it.id]; });
    }
    if (!lliures.length) {
      var gens = (gensPerSaber[saber.id] || []).filter(function (g) {
        return !nivellFix || g.nivell === nivellFix;
      });
      if (!gens.length) return null;
      var g = atzar.triaPonderada(gens, function (x) { return pes[x.nivell] || 0.02; });
      return variant(g.id, novaLlavor(g.id));
    }
    return atzar.triaPonderada(lliures, function (it) { return pes[it.nivell] || 0.02; });
  }

  /**
   * Fixa (o deixa anar) el nivell d'una pregunta concreta. Serveix per fer
   * una prova de mínims amb un parell de preguntes més exigents, sense
   * haver de tocar el nivell general.
   */
  function fixaNivell(i, nivell) {
    var q = estat.preguntes[i];
    var saber = sabersPerId[q.saberId];
    if (!saber) return;

    q.nivell = nivell || undefined;
    var it = banc[q.itemId];
    if (!nivell || (it && it.nivell === nivell)) { pinta(); desaAlHash(); return; }

    var nou = triaItem(saber, new window.Atzar('niv|' + q.itemId + '|' + Date.now()), nivell);
    if (!nou) {
      estat.avisos = ['«' + saber.titol + '» no té cap pregunta de nivell ' +
                      nivell + '.'];
      q.nivell = undefined;
      pintaLlista();
      return;
    }
    if (estat.fixades[q.itemId]) {
      delete estat.fixades[q.itemId];
      estat.fixades[nou.id] = true;
    }
    q.itemId = nou.id;
    estat.editat = true;
    pinta();
    desaAlHash();
  }

  /**
   * Quins dels tres nivells pot donar un contingut. Només 27 dels 50 en
   * tenen els tres: sense això, el professor triaria un nivell i no
   * passaria res, sense saber per què.
   */
  var nivellsCache = {};
  function nivellsDisponibles(saberId) {
    if (nivellsCache[saberId]) return nivellsCache[saberId];
    var s = sabersPerId[saberId];
    var gens = gensPerSaber[saberId] || [];
    var d = [1, 2, 3].map(function (n) {
      if (s && s.perNivell && s.perNivell[n - 1] > 0) return true;
      return gens.some(function (g) { return g.nivell === n; });
    });
    nivellsCache[saberId] = d;
    return d;
  }

  /** Quin pes té un saber segons el criteri de repartiment triat. */
  function pesDelSaber(s) {
    if (estat.spec.pes === 'igual') return 1;
    if (estat.spec.pes === 'items') return s.items.length;
    return s.hores;
  }

  /** Els sabers marcats que tenen preguntes, en ordre de currículum. */
  function sabersActius() {
    return estat.sabers.map(function (id) { return sabersPerId[id]; })
      .filter(function (s) { return s && s.items.length; });
  }

  /** Avisa de quins continguts marcats no tenen cap pregunta a la prova. */
  function revisaCobertura() {
    var cobert = {};
    estat.preguntes.forEach(function (q) { cobert[q.saberId] = true; });
    var sense = sabersActius().filter(function (s) { return !cobert[s.id]; })
                              .map(function (s) { return s.titol; });
    estat.avisos = sense.length
      ? ['Sense cap pregunta a la prova: ' + sense.join(', ') +
         '. Puja el nombre de preguntes o fes servir el «+» del contingut.']
      : [];
  }

  /**
   * Porta la prova a `n` preguntes SENSE refer-la: conserva tot el que ja hi
   * ha i només afegeix o treu el que calgui per equilibrar-la.
   *
   * Aquesta és la diferència amb `recomposa()`, i és la que faltava. Marcar
   * un contingut nou feia una composició de zero i el professor perdia les
   * nou preguntes que ja havia triat i li agradaven. Ara la llista de
   * continguts és el que hi ha DINS de la prova, no una especificació per
   * tornar-la a muntar.
   */
  function ajusta(n) {
    var propies = estat.preguntes.filter(function (q) { return estat.propies[q.itemId]; });
    var sabers = sabersActius();

    if (!sabers.length) {
      estat.preguntes = propies;
      acabaCanvi();
      return;
    }

    var objectiu = Math.max(0, n - propies.length);
    var quotes = window.Composa.reparteix(sabers.map(pesDelSaber), objectiu);

    // Cap saber marcat s'ha de quedar a zero mentre n'hi hagi un altre amb
    // més d'una: si el professor l'ha marcat, l'ha de veure a la prova.
    if (objectiu >= sabers.length) {
      for (var i = 0; i < quotes.length; i++) {
        if (quotes[i]) continue;
        var max = quotes.indexOf(Math.max.apply(null, quotes));
        if (quotes[max] > 1) { quotes[max]--; quotes[i] = 1; }
      }
    }

    var atzar = new window.Atzar(estat.spec.llavor + '|ajusta|' + Date.now());
    var fora = {};

    sabers.forEach(function (s, k) {
      var seves = estat.preguntes.filter(function (q) { return q.saberId === s.id; });
      var sobren = seves.length - quotes[k];
      if (sobren > 0) {
        // Es treuen les últimes i mai una de fixada amb ☆.
        var candidates = seves.filter(function (q) { return !estat.fixades[q.itemId]; });
        candidates.slice(-sobren).forEach(function (q) { fora[q.itemId] = true; });
      }
    });
    estat.preguntes = estat.preguntes.filter(function (q) { return !fora[q.itemId]; });

    sabers.forEach(function (s, k) {
      var te = estat.preguntes.filter(function (q) { return q.saberId === s.id; }).length;
      for (var j = te; j < quotes[k]; j++) {
        var nou = triaItem(s, atzar);
        if (!nou) break;
        inserisc({ itemId: nou.id, saberId: s.id, punts: 0 });
      }
    });

    acabaCanvi();
  }

  /** El final de qualsevol canvi a la llista: punts, avisos, pintar i desar. */
  function acabaCanvi() {
    estat.spec.nombre = estat.preguntes.length;
    estat.editat = true;
    reparteixPunts();
    revisaCobertura();
    sincronitzaControls();
    pinta();
    desaAlHash();
  }

  /** Reordena sense canviar cap pregunta. */
  function reordena() {
    if (estat.spec.ordre === 'dificultat') {
      estat.preguntes.sort(function (a, b) {
        return (banc[a.itemId].nivell || 2) - (banc[b.itemId].nivell || 2);
      });
    } else if (estat.spec.ordre === 'barrejat') {
      estat.preguntes = new window.Atzar(estat.spec.llavor + '|ordre|' + Date.now())
        .barreja(estat.preguntes);
    } else {
      estat.preguntes.sort(function (a, b) {
        var ia = ordreSabers.indexOf(a.saberId), ib = ordreSabers.indexOf(b.saberId);
        return (ia < 0 ? 1e6 : ia) - (ib < 0 ? 1e6 : ib);   // les pròpies, al final
      });
    }
    acabaCanvi();
  }

  /**
   * Refà la prova de zero. És l'ÚNICA operació destructiva, i només la
   * disparen coses que el professor demana explícitament: «Altres
   * preguntes», canviar el nivell i canviar el criteri de repartiment.
   * Marcar continguts, moure el nombre de preguntes o canviar l'ordre no
   * passen per aquí: conserven el que ja hi ha.
   *
   * Les preguntes pròpies i les fixades amb ☆ se salven fins i tot aquí:
   * són l'única cosa de la prova que el professor ha escrit o triat a mà, i
   * regenerar-les seria destruir feina.
   */
  function recomposa() {
    // L'ordre de les voltes es fixa amb el codi de la tria: si el codi
    // canvia, l'ordre també, o «Altres preguntes» oferiria sempre la
    // mateixa seqüència en clicar les fletxes.
    voltes = buit();
    var conserva = estat.preguntes.filter(function (q) {
      return estat.fixades[q.itemId] || estat.propies[q.itemId];
    });

    var r = window.Composa.composa({
      sabers: estat.sabers,
      nombre: Math.max(0, estat.spec.nombre - conserva.length),
      perfil: estat.spec.perfil,
      pes: estat.spec.pes,
      ordre: estat.spec.ordre,
      punts: estat.spec.punts,
      llavor: estat.spec.llavor
    }, banc, sabersPerId);

    var ja = {};
    conserva.forEach(function (q) { ja[q.itemId] = true; });
    estat.preguntes = conserva.concat(
      r.preguntes.filter(function (q) { return !ja[q.itemId]; }));
    estat.avisos = r.avisos;
    estat.editat = false;
    estat.cfg.llavor = estat.spec.llavor;
    reparteixPunts();
    pinta();
    desaAlHash();
  }

  /* ------------------------------------------------------ la volta d'un saber
     El ⟳ triava un ítem a l'atzar cada vegada. Amb quinze ítems disponibles
     això donava seqüències com A, B, B, A, C, B, C: repeticions immediates i
     només tres preguntes vistes de quinze. Ara l'atzar decideix UNA vegada en
     quin ordre sortiran, i els botons recorren aquesta llista endavant i
     endarrere. Abans de repetir-ne cap, les hauràs vistes totes. */
  var voltes = buit();

  function volta(saberId) {
    if (!voltes[saberId]) {
      var s = sabersPerId[saberId];
      voltes[saberId] = new window.Atzar('volta|' + estat.spec.llavor + '|' + saberId)
        .barreja(s ? s.items : []);
    }
    return voltes[saberId];
  }

  /**
   * Allarga la volta d'un saber amb una variant nova d'algun dels seus
   * generadors. Serveix per no haver de tornar a començar quan s'ha donat
   * tota la volta: el material propi no s'acaba mai.
   */
  function allargaVolta(saberId) {
    var gens = gensPerSaber[saberId] || [];
    if (!gens.length) return false;
    var v = volta(saberId);
    var vistes = {};
    v.forEach(function (id) { if (banc[id]) vistes[firma(banc[id])] = true; });

    var atzar = new window.Atzar('allarga|' + saberId + '|' + v.length);
    for (var t = 0; t < 40; t++) {
      var g = atzar.tria(gens);
      var nou = variant(g.id, novaLlavor(g.id));
      if (nou && !vistes[firma(nou)]) { v.push(nou.id); return true; }
    }
    return false;
  }

  /**
   * Avança o retrocedeix una pregunta dins de la volta del seu contingut.
   * `dir` val +1 (sentit horari) o -1 (antihorari).
   */
  function passa(i, dir) {
    var q = estat.preguntes[i];
    if (!q.saberId) return;                     // pregunta pròpia: no té volta
    var v = volta(q.saberId);
    if (!v.length) return;

    // On som ara. Si l'ítem no és a la volta (ve d'una variant demanada amb
    // ↻), s'hi afegeix perquè la volta no perdi el fil.
    var pos = v.indexOf(q.itemId);
    if (pos < 0) { v.push(q.itemId); pos = v.length - 1; }

    // Ocupats per ALTRES preguntes: se salten, però sense sortir de l'ordre.
    var ocupats = {};
    estat.preguntes.forEach(function (x, k) { if (k !== i) ocupats[x.itemId] = true; });

    for (var t = 0; t < v.length + 40; t++) {
      pos += dir;
      if (pos >= v.length) {
        // S'ha acabat la volta: si el contingut té generadors, se n'hi
        // afegeix una de nova; si no, es torna a començar.
        if (!allargaVolta(q.saberId)) pos = 0;
      } else if (pos < 0) {
        pos = v.length - 1;
      }
      var cand = v[pos];
      // Amb un nivell fixat, la volta només ofereix preguntes d'aquell
      // nivell: si no, el primer clic desfaria el que s'acaba de demanar.
      if (cand && banc[cand] && q.nivell && banc[cand].nivell !== q.nivell) continue;
      if (cand && cand !== q.itemId && !ocupats[cand] && banc[cand]) {
        if (estat.fixades[q.itemId]) {
          delete estat.fixades[q.itemId];
          estat.fixades[cand] = true;
        }
        q.itemId = cand;
        estat.editat = true;
        pinta();
        desaAlHash();
        return;
      }
    }

    /* No hi havia res per oferir. Passa sobretot amb un nivell fixat que el
       contingut només té en un ítem: sense dir res, el botó semblava mort. */
    var s = sabersPerId[q.saberId];
    estat.avisos = [q.nivell
      ? '«' + s.titol + '» no té cap altra pregunta de nivell ' + q.nivell +
        '. Posa el nivell a «general» per veure la resta.'
      : 'Ja hi són totes les preguntes de «' + s.titol + '».'];
    pintaLlista();
  }

  /** El que fa que dues preguntes siguin «la mateixa» per a l'ull. */
  function firma(it) {
    return (it.cap || '') + '|' + (it.enunciat || '') + '|' + (it.figura || '');
  }

  /**
   * Uns altres nombres per a la mateixa pregunta. Només per als ítems que
   * venen d'un generador; el pou és infinit.
   */
  function altresNombres(i) {
    var q = estat.preguntes[i], it = banc[q.itemId];
    if (!it || !it.gen) return;

    /* Igual que la volta d'un saber, però dins d'un sol generador: uns
       altres nombres per a la mateixa mena d'exercici. Es descarten les
       variants que ja són a la prova i les que ja s'han vist en aquesta
       pregunta, de manera que cada clic mostra una cosa nova de debò. */
    var fora = {};
    estat.preguntes.forEach(function (x) {
      if (banc[x.itemId]) fora[firma(banc[x.itemId])] = true;
    });
    (q.vistes || []).forEach(function (f) { fora[f] = true; });

    var nou = null;
    for (var t = 0; t < 60 && !nou; t++) {
      var cand = variant(it.gen, novaLlavor(it.gen));
      if (!cand) return;
      if (!fora[firma(cand)]) nou = cand;
    }
    if (!nou) {
      // Exhaurit el que és nou de debò: es torna a començar el cicle.
      q.vistes = [];
      nou = variant(it.gen, novaLlavor(it.gen));
      if (!nou) return;
    }
    q.vistes = (q.vistes || []).concat(firma(it)).slice(-40);

    if (estat.fixades[q.itemId]) {
      delete estat.fixades[q.itemId];
      estat.fixades[nou.id] = true;
    }
    q.itemId = nou.id;
    estat.editat = true;
    pinta();
    desaAlHash();
  }

  /** Porta la pregunta `i` a la posició `desti` (1..n) d'una sola passa. */
  function mouA(i, desti) {
    desti = Math.max(1, Math.min(estat.preguntes.length, desti)) - 1;
    if (desti === i) return;
    var q = estat.preguntes.splice(i, 1)[0];
    estat.preguntes.splice(desti, 0, q);
    if (oberta === i) oberta = desti;
    acabaCanvi();
  }

  function mou(i, delta) {
    var j = i + delta;
    if (j < 0 || j >= estat.preguntes.length) return;
    var t = estat.preguntes[i];
    estat.preguntes[i] = estat.preguntes[j];
    estat.preguntes[j] = t;
    if (oberta === i) oberta = j;
    estat.editat = true;
    reparteixPunts();
    pinta();
    desaAlHash();
  }

  function treu(i) {
    var q = estat.preguntes[i];
    delete estat.fixades[q.itemId];
    delete estat.propies[q.itemId];
    estat.preguntes.splice(i, 1);
    oberta = -1;
    acabaCanvi();
  }

  /**
   * On ha d'anar una pregunta nova. Amb l'ordre del currículum s'insereix al
   * seu lloc en comptes d'anar a parar a la posició catorze quan li tocava
   * la tercera: moure-la amunt onze vegades era una feina absurda.
   */
  function inserisc(q) {
    if (estat.spec.ordre !== 'curriculum' || !q.saberId) {
      estat.preguntes.push(q);
      return;
    }
    var idx = ordreSabers.indexOf(q.saberId);
    var on = estat.preguntes.length;
    for (var i = estat.preguntes.length - 1; i >= 0; i--) {
      var j = ordreSabers.indexOf(estat.preguntes[i].saberId);
      if (j >= 0 && j <= idx) { on = i + 1; break; }
      on = i;
    }
    estat.preguntes.splice(on, 0, q);
  }

  /**
   * Una pregunta més d'un contingut concret, sense refer la prova. És el
   * control que faltava per construir la recuperació sobre els criteris que
   * l'alumne no va assolir, en comptes de sobre un total global.
   */
  function afegeixDelSaber(saberId) {
    var saber = sabersPerId[saberId];
    if (!saber || !saber.items.length) return;

    var atzar = new window.Atzar(estat.spec.llavor + '|mes|' + saberId + '|' + Date.now());
    var nou = triaItem(saber, atzar);
    if (!nou) {
      estat.avisos = ['Ja hi són totes les preguntes de «' + saber.titol +
                      '»: aquest contingut només té material del banc de repàs, ' +
                      'que és text fix.'];
      pintaLlista();
      return;
    }

    // Si el contingut no estava marcat, es marca: el pla de repàs ha
    // d'incloure el que s'avalua.
    if (estat.sabers.indexOf(saberId) < 0) marca([saberId], true);

    inserisc({ itemId: nou.id, saberId: saberId, punts: 0 });
    acabaCanvi();
  }

  /** Totes les preguntes d'un contingut: s'executa en desmarcar-lo. */
  function treuTotsDelSaber(saberId) {
    estat.preguntes = estat.preguntes.filter(function (q) { return q.saberId !== saberId; });
  }

  /** Una pregunta menys d'un contingut concret: treu l'última que en ve. */
  function treuDelSaber(saberId) {
    for (var i = estat.preguntes.length - 1; i >= 0; i--) {
      if (estat.preguntes[i].saberId === saberId) { treu(i); return; }
    }
  }

  /* --------------------------------------------------- preguntes pròpies */
  var comptadorPropies = 0;

  function creaPropia(enunciat, solucio, id) {
    id = id || ('propia-' + (++comptadorPropies));
    banc[id] = {
      id: id, full: 0, bloc: 'propia', blocTitol: 'Pregunta pròpia',
      ex: 1000 + comptadorPropies, ap: '', dif: 2, nivell: 2, passos: 0,
      cap: '', capCal: false,
      // esc() i salts de línia: "Ordena: 3<x<7" es perdia sencer perquè el
      // navegador es menjava "<x<7" com si fos una etiqueta.
      enunciat: esc(enunciat).replace(/\n/g, '<br>'),
      figura: null, nota: '',
      sol: btoa(unescape(encodeURIComponent(JSON.stringify({
        r: esc(solucio || '').replace(/\n/g, '<br>') || '(sense solució introduïda)',
        p: []
      })))),
      sabers: []
    };
    estat.propies[id] = { enunciat: enunciat, solucio: solucio || '' };
    return id;
  }

  function afegeixPropia(enunciat, solucio) {
    enunciat = (enunciat || '').trim();
    if (!enunciat) return false;
    var id = creaPropia(enunciat, (solucio || '').trim());
    estat.preguntes.push({ itemId: id, saberId: null, punts: 0 });
    acabaCanvi();
    return true;
  }

  /* ------------------------------------------------------- arbre curricular */
  function marca(ids, activa) {
    ids.forEach(function (id) {
      var i = estat.sabers.indexOf(id);
      if (activa && i < 0) estat.sabers.push(id);
      if (!activa && i >= 0) estat.sabers.splice(i, 1);
    });
    estat.sabers.sort(function (a, b) {
      return ordreSabers.indexOf(a) - ordreSabers.indexOf(b);
    });
  }

  /* Cursos plegats a la columna de l'esquerra. Qui recupera 2n no ha de
     passar per damunt dels divuit continguts de 1r cada vegada. És una
     preferència de qui fa les proves, no part de la prova: va a la memòria
     del navegador (si la hi deixa) i no a l'adreça. Mateixa idea que les
     unitats plegables del banc de 2n de batxillerat. */
  var PLEGATS = 'recuperacio-eso:plegats';
  var plegats = buit();
  try {
    JSON.parse(localStorage.getItem(PLEGATS) || '[]').forEach(function (c) {
      if (typeof c === 'string') plegats[c] = true;
    });
  } catch (e) { /* sense memòria del navegador: tot desplegat */ }

  function commutaPlegat(cursId) {
    if (plegats[cursId]) delete plegats[cursId]; else plegats[cursId] = true;
    try { localStorage.setItem(PLEGATS, JSON.stringify(Object.keys(plegats))); }
    catch (e) { /* res */ }
    pintaRail();
  }

  function visibles(curs, filtre) {
    return ambBanc(curs.sabers).filter(function (s) {
      if (!filtre) return true;
      return plana(s.titol + ' ' + s.detall + ' ' + s.sentitTitol).indexOf(filtre) >= 0;
    });
  }

  function pintaRail() {
    var filtre = plana($('#cerca').value.trim());
    // Sense això, marcar una casella amb el teclat reemplaçava tot l'HTML
    // del rail i el focus se n'anava al <body>: navegar-hi amb teclat era
    // impossible.
    var focus = document.activeElement;
    var d = focus && focus.dataset ? focus.dataset : {};
    var tornar = d.saber ? '[data-saber="' + d.saber + '"]'
               : d.mes ? '[data-mes="' + d.mes + '"]'
               : d.menys ? '[data-menys="' + d.menys + '"]'
               : d.sentit ? '[data-sentit="' + d.sentit + '"]'
               : d.curs ? '[data-curs="' + d.curs + '"]'
               : d.plega ? '[data-plega="' + d.plega + '"]' : null;

    var html = '';

    MAPA.cursos.forEach(function (curs) {
      var mostrats = visibles(curs, filtre);
      if (!mostrats.length) return;

      var totalAmbBanc = ambBanc(curs.sabers).length;
      var triats = ambBanc(curs.sabers).filter(function (s) {
        return estat.sabers.indexOf(s.id) >= 0;
      }).length;
      var tots = mostrats.every(function (s) { return estat.sabers.indexOf(s.id) >= 0; });
      var maxHores = Math.max.apply(null, mostrats.map(function (s) { return s.hores; }));

      var cos = '', sentitActual = null;
      mostrats.forEach(function (s, k) {
        if (s.sentit !== sentitActual) {
          sentitActual = s.sentit;
          var germans = mostrats.filter(function (x) { return x.sentit === s.sentit; });
          var totsSentit = germans.every(function (x) { return estat.sabers.indexOf(x.id) >= 0; });
          // Un enllaç discret i no un botó amb vora: n'hi ha un per sentit
          // i, com a botons, la columna semblava un tauler de comandament.
          cos += '<div class="sentit-tit">' +
                   '<span>' + esc(s.sentitTitol) + '</span>' +
                   '<button class="enllac" data-sentit="' + esc(curs.id + '|' + s.sentit) + '" ' +
                     'aria-pressed="' + totsSentit + '" title="' +
                     (totsSentit ? 'Desmarca' : 'Marca') + ' tot el sentit">' +
                     (totsSentit ? 'cap' : 'tots') + '</button>' +
                 '</div>';
        }
        var marcat = estat.sabers.indexOf(s.id) >= 0;
        var quantes = estat.preguntes.filter(function (q) { return q.saberId === s.id; }).length;
        cos += '<div class="saber">' +
          '<label class="saber-marca">' +
            '<input type="checkbox" data-saber="' + esc(s.id) + '"' + (marcat ? ' checked' : '') + '>' +
            '<div class="saber-cos">' +
              '<div class="saber-tit">' + esc(s.titol) + '</div>' +
              '<div class="saber-meta">' +
                '<span class="hores" style="width:' +
                  Math.round(3 + (s.hores / maxHores) * 34) + 'px"></span>' +
                '<span>' + s.hores + ' h</span><span>·</span>' +
                '<span>' + s.items.length + ' al banc</span>' +
              '</div>' +
            '</div>' +
          '</label>' +
          /* El comptador «− 2 +» només als continguts marcats. Als altres
             no diu res: marcar la casella ja hi posa una pregunta, i cent
             botons «− +» desactivats eren soroll a tota la columna. */
          (marcat
            ? '<span class="quants" title="Preguntes d\'aquest contingut a la prova">' +
                '<button class="menys" data-menys="' + esc(s.id) + '"' +
                  (quantes ? '' : ' disabled') +
                  ' title="Una pregunta menys d\'aquest contingut"' +
                  ' aria-label="Treu una pregunta de ' + esc(s.titol) + '">\u2212</button>' +
                '<span class="quantes">' + quantes + '</span>' +
                '<button class="mes" data-mes="' + esc(s.id) + '" ' +
                  'title="Una pregunta més d\'aquest contingut" ' +
                  'aria-label="Afegeix una pregunta de ' + esc(s.titol) + '">+</button>' +
              '</span>'
            : '') +
        '</div>';
      });

      var buits = curs.sabers.length - totalAmbBanc;
      // Una cerca desplega el que troba: si no, no es veuria el resultat.
      var plegat = plegats[curs.id] && !filtre;
      html += '<section class="curs">' +
        '<div class="curs-cap">' +
          '<button type="button" class="plega" data-plega="' + esc(curs.id) + '" ' +
            'aria-expanded="' + !plegat + '" title="' +
            (plegat ? 'Desplega el curs' : 'Plega el curs') + '">' +
            // Una fletxa que gira (CSS), prou gran per veure-la d'una ullada.
            '<svg class="fletxa" viewBox="0 0 12 12" aria-hidden="true">' +
              '<path d="M3 4.5 6 7.5 9 4.5" fill="none" stroke="currentColor" ' +
              'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
            '<strong>' + esc(curs.titol) + '</strong>' +
            '<span class="compte">' + triats + ' / ' + totalAmbBanc + '</span>' +
          '</button>' +
          '<button class="mini" data-curs="' + esc(curs.id) + '" aria-pressed="' + tots + '">' +
            (tots ? 'Treu-ho tot' : 'Tot el curs') + '</button>' +
        '</div>' +
        (plegat ? '' :
          '<div class="sentit">' + cos + '</div>' +
          (buits && !filtre
            ? '<p class="curs-peu">' + buits + ' continguts més, sense preguntes al banc ' +
              '(per a aquests, «+ Pregunta pròpia»).</p>'
            : '')) +
      '</section>';
    });

    $('#rail-cos').innerHTML = html ||
      '<p class="buida">Cap contingut coincideix amb «' + esc($('#cerca').value) + '».</p>';

    // Es refà tot l'HTML del rail, o sigui que el focus se'n va al <body>.
    // Sense restaurar-lo, marcar continguts amb el teclat és inviable.
    if (tornar) {
      var n2 = $(tornar);
      if (n2) n2.focus();
    }
  }

  /* ------------------------------------------------- llista de preguntes */
  function resumeix(s) {
    if (!s) return '';
    return String(s)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\\d?frac\{([^{}]*)\}\{([^{}]*)\}/g, '$1/$2')
      .replace(/\\cdot/g, '·').replace(/\\times/g, '×').replace(/\\div/g, ':')
      .replace(/\\left|\\right|\\quad|\\,|\\;/g, '')
      .replace(/\\operatorname\{([^{}]*)\}/g, '$1')
      .replace(/\\dots/g, '…').replace(/\\%/g, '%').replace(/\\circ/g, '°')
      .replace(/\^\{?(\w+)\}?/g, '^$1')
      .replace(/[${}\\]/g, '')
      .replace(/\s+/g, ' ').trim().slice(0, 90);
  }

  /**
   * Selector de nivell d'una pregunta. «General» vol dir que segueix la
   * barreja del control de dalt; 1, 2 i 3 la claven a aquell nivell, que és
   * el que permet fer una prova de mínims amb un parell de preguntes més
   * exigents. Els nivells que aquell contingut no té surten desactivats:
   * només 27 dels 50 continguts en tenen els tres, i sense això triaries un
   * nivell i no passaria res.
   */
  function selectorNivell(i, q, it, saber) {
    var disp = nivellsDisponibles(saber.id);
    var opcions = '<option value="">General (ara ' + it.nivell + ')</option>';
    for (var n = 1; n <= 3; n++) {
      opcions += '<option value="' + n + '"' +
        (q.nivell === n ? ' selected' : '') +
        (disp[n - 1] ? '' : ' disabled') +
        '>' + n + (disp[n - 1] ? '' : ' — no en té') + '</option>';
    }
    return '<select class="q-nivell' + (q.nivell ? ' fixat' : '') +
      '" data-nivell="' + i + '" aria-label="Nivell de la pregunta ' + (i + 1) +
      '">' + opcions + '</select>';
  }

  /* Quina pregunta del panell està oberta. Tancades, les files només diuen
     què és cada pregunta i quant val; obrir-ne una mostra tot el que s'hi
     pot fer. Abans cada fila portava sempre el selector de nivell, el camp
     de punts i set botons, i amb vint preguntes el panell feia cinc
     pantalles. */
  var oberta = -1;

  function obre(i, desdeFull) {
    oberta = oberta === i ? -1 : i;
    pintaLlista();
    var fila = $('#llista [data-fila="' + oberta + '"]');
    if (fila) fila.scrollIntoView({ block: 'nearest' });
    // I al full, la mateixa pregunta, perquè es vegi què s'està tocant.
    if (!desdeFull && oberta >= 0 && estat.vista === 'prova') {
      var b = $('#full .pregunta-eines [data-treu="' + oberta + '"]');
      var pr = b && b.closest('.apartat, .pregunta');
      if (pr) pr.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
    marcaAlFull();
  }

  /** Ressalta al full la pregunta oberta al panell. */
  function marcaAlFull() {
    document.querySelectorAll('#full .activa').forEach(function (x) {
      x.classList.remove('activa');
    });
    if (oberta < 0) return;
    var b = $('#full .pregunta-eines [data-treu="' + oberta + '"]');
    var pr = b && b.closest('.apartat, .pregunta');
    if (pr) pr.classList.add('activa');
  }

  function pintaLlista() {
    var h = '';
    var etiq = window.Composa.agrupa(estat.preguntes, banc, estat.cfg.agrupa).etiquetes;
    var n = window.Full.num;
    if (oberta >= estat.preguntes.length) oberta = -1;
    pintaTemps();

    /* Els avisos, a DALT: a sota d'una llista de vint preguntes no els
       veia ningú. */
    if (estat.desquadrat) {
      var d = estat.desquadrat;
      h += '<p class="avis">La prova suma ' + n(d.suma) + ' punts i no ' +
        n(estat.spec.punts) + ': ' +
        (d.fixats
          ? 'hi ha punts escrits a mà. ' +
            '<button class="mini" id="allibera">Torna a repartir-los</button>'
          : 'cada pregunta val 0,25 com a mínim, i ' + estat.preguntes.length +
            ' preguntes no poden sumar menys de ' + n(d.minim) + '.') +
        '</p>';
    }
    estat.avisos.forEach(function (a) { h += '<p class="avis">' + esc(a) + '</p>'; });

    if (!estat.preguntes.length) {
      h += '<p class="buida">' + (estat.sabers.length
        ? 'Cap pregunta. Puja el nombre de preguntes o revisa els avisos.'
        : 'Marca continguts a l\'esquerra i la prova es muntarà sola.') + '</p>';
    }
    estat.preguntes.forEach(function (q, i) {
      var it = banc[q.itemId];
      var saber = sabersPerId[q.saberId];
      if (!it) return;
      var obert = i === oberta, fixada = !!estat.fixades[q.itemId];
      h += '<div class="q' + (fixada ? ' marcada' : '') + (obert ? ' oberta' : '') +
          '" data-fila="' + i + '">' +
        /* La posició és un camp: escriure-hi 3 la porta a la tercera
           d'una passa. Amb només les fletxes, passar de la catorzena a
           la tercera eren onze clics. */
        '<input class="q-num" type="number" min="1" max="' + estat.preguntes.length +
          '" value="' + (i + 1) + '" data-posicio="' + i +
          '" aria-label="Posició de la pregunta ' + (i + 1) + '">' +
        '<button type="button" class="q-cos" data-obre="' + i + '" aria-expanded="' + obert + '">' +
          '<span class="q-tit">' + (fixada ? '<span class="estrella" title="Fixada">★</span> ' : '') +
            esc(resumeix(it.cap) || resumeix(it.enunciat) || it.id) + '</span>' +
          '<span class="q-saber">' +
            // Si és un apartat, com surt al full: «6b».
            (etiq[i] !== String(i + 1)
              ? '<span class="q-etiqueta" title="Al full surt com a ' + etiq[i] + '">' +
                etiq[i] + '</span> ' : '') +
            esc(saber ? saber.titol : it.blocTitol) +
            (q.nivell ? ' <span class="q-fix" title="Nivell fixat">niv. ' + q.nivell + '</span>' : '') +
          '</span>' +
        '</button>' +
        (obert
          ? '<button type="button" class="q-tanca" data-obre="' + i + '" ' +
              'title="Plega-la (Esc)" aria-label="Plega la pregunta ' + (i + 1) + '">\u25b4</button>'
          : '<span class="q-p' + (q.fix != null ? ' fixat' : '') + '">' + n(q.punts) + ' p</span>');

      if (obert) {
        h += '<div class="q-detall">' +
          '<div class="fila">' +
            (saber
              ? '<label class="camp"><span>Nivell</span>' + selectorNivell(i, q, it, saber) + '</label>'
              : '') +
            '<label class="camp q-punts"><span>Punts</span>' +
              '<input type="number" min="0" max="20" step="0.25" ' +
                'value="' + q.punts + '" data-punts="' + i + '" ' +
                'class="' + (q.fix != null ? 'fixat' : '') + '" ' +
                'aria-label="Punts de la pregunta ' + (i + 1) + '">' +
            '</label>' +
          '</div>' +
          '<div class="q-eines">' +
            '<button data-anterior="' + i + '" title="L\'anterior d\'aquest contingut"' +
              (saber ? '' : ' disabled') + '>⟲</button>' +
            '<button data-seguent="' + i + '" title="Una altra d\'aquest contingut"' +
              (saber ? '' : ' disabled') + '>⟳ Una altra</button>' +
            (it.gen
              ? '<button data-nombres="' + i + '" title="Uns altres nombres, ' +
                'la mateixa pregunta">↻ Nombres</button>' : '') +
            '<button data-amunt="' + i + '" title="Amunt"' + (i ? '' : ' disabled') + '>↑</button>' +
            '<button data-avall="' + i + '" title="Avall"' +
              (i === estat.preguntes.length - 1 ? ' disabled' : '') + '>↓</button>' +
          '</div>' +
          '<div class="q-eines">' +
            '<button data-fixa="' + i + '" aria-pressed="' + fixada + '" ' +
              'title="Que «Altres preguntes» no la canviï">' +
              (fixada ? '★ Fixada' : '☆ Fixa-la') + '</button>' +
            '<button data-treu="' + i + '" class="perill" title="Treu-la de la prova">✕ Treu-la</button>' +
          '</div>' +
        '</div>';
      }
      h += '</div>';
    });

    // Es refà tot l'HTML: sense tornar el focus on era, la llista no es
    // podria fer servir amb el teclat.
    var focus = document.activeElement, tornar = null;
    if (focus && $('#llista').contains(focus)) {
      ['obre', 'posicio', 'punts', 'nivell', 'anterior', 'seguent', 'nombres',
       'amunt', 'avall', 'fixa'].some(function (k) {
        if (focus.dataset[k] == null) return false;
        tornar = '#llista [data-' + k + '="' + focus.dataset[k] + '"]';
        return true;
      });
    }
    $('#llista').innerHTML = h;
    if (tornar && $(tornar)) $(tornar).focus();
  }

  /* ------------------------------------------------ exercicis de pràctica */
  /**
   * Els exercicis de pràctica del pla de repàs. La tria la fa
   * `Composa.practica` amb el catàleg; quan un contingut no en té prou
   * (Comprensió lectora de 1r, 2n i 3r comparteixen els mateixos sis
   * ítems) i té generadors, se'n fabriquen variants noves, que no poden
   * coincidir amb cap pregunta de la prova ni amb cap altre exercici.
   *
   * Les llavors són deterministes (surten del codi de la prova): la mateixa
   * adreça dona sempre el mateix pla.
   */
  function practicaDelPla() {
    var n = estat.cfg.practica;
    var idsProva = estat.preguntes.map(function (q) { return q.itemId; });
    var pr = window.Composa.practica({
      sabers: estat.sabers, n: n, perfil: estat.spec.perfil,
      llavor: estat.spec.llavor, prova: idsProva
    }, banc, sabersPerId);

    var vistes = {};
    var marca = function (id) { if (banc[id]) vistes[firma(banc[id])] = true; };
    idsProva.forEach(marca);
    Object.keys(pr).forEach(function (sid) { pr[sid].forEach(marca); });
    var pes = window.Composa.PERFILS[estat.spec.perfil] || window.Composa.PERFILS.minims;

    estat.sabers.forEach(function (sid, k) {
      if (!pr[sid] || pr[sid].length >= n) return;
      // Els generadors del nivell que la prova demana; si no n'hi ha cap, tots.
      var gens = (gensPerSaber[sid] || []).filter(function (g) { return pes[g.nivell] >= 1; });
      if (!gens.length) gens = gensPerSaber[sid] || [];
      for (var t = 0; pr[sid].length < n && gens.length && t < 40; t++) {
        var it = variant(gens[t % gens.length].id, 'pr' + estat.spec.llavor + 's' + k + 't' + t);
        if (it && !vistes[firma(it)]) {
          vistes[firma(it)] = true;
          pr[sid].push(it.id);
        }
      }
    });
    return pr;
  }

  /**
   * Temps estimat de la prova contra els minuts que té l'alumne. Surt al
   * panell, al costat del control de durada: és on es decideix quantes
   * preguntes hi caben.
   */
  function pintaTemps() {
    var t = window.Composa.minuts(estat.preguntes, banc), d = estat.spec.durada;
    var el = $('#temps');
    el.textContent = estat.preguntes.length ? '\u2248 ' + t + ' min' : '\u2014';
    el.className = 'temps' + (!estat.preguntes.length ? '' : t > d ? ' fora' : ' dins');
    $('#temps-de').textContent = estat.preguntes.length ? 'de ' + d : '';
    el.title = estat.preguntes.length
      ? (t > d ? 'Probablement massa llarga per a ' + d + ' minuts. ' : '') +
        'Estimació: ' + window.Composa.MINUTS_NIVELL[1] + ' min per pregunta de nivell 1, ' +
        window.Composa.MINUTS_NIVELL[2] + ' de nivell 2 i ' +
        window.Composa.MINUTS_NIVELL[3] + ' de nivell 3.'
      : '';
  }

  /* --------------------------------------------------------------- el full */
  function pintaFull() {
    var cfg = Object.create(estat.cfg);
    cfg.subtitol = estat.cfg.subtitol || subtitolAutomatic();
    cfg.editable = estat.vista === 'prova';
    cfg.fixades = estat.fixades;

    var dades = { cfg: cfg, preguntes: estat.preguntes, sabers: estat.sabers,
                  agrupacio: window.Composa.agrupa(estat.preguntes, banc, estat.cfg.agrupa) };
    if (estat.vista === 'pla') dades.practica = practicaDelPla();
    var html = estat.vista === 'clau' ? window.Full.clau(dades, banc, sabersPerId)
             : estat.vista === 'pla' ? window.Full.pla(dades, banc, sabersPerId, MAPA)
             : window.Full.prova(dades, banc, sabersPerId);

    var full = $('#full');
    full.innerHTML = html;

    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(full, {
          delimiters: [{ left: '$', right: '$', display: false }],
          // Els textos que s'editen damunt del full: si KaTeX hi entrés,
          // el que s'escriu deixaria de ser el que es desa.
          ignoredClasses: ['ed'],
          throwOnError: false
        });
      } catch (e) { /* si KaTeX falla es veu el LaTeX en cru: ja és prou avís */ }
    }
    comptaPagines();
    aplicaZoom();
    marcaAlFull();
  }

  /* Quantes pàgines A4 sortiran. És la decisió real del professor i abans
     només es descobria al diàleg d'impressió. */
  function comptaPagines() {
    var full = $('#full'), aMm = 25.4 / 96;

    /* A4 menys els marges de la regla @page. El peu NO es resta: com que
       està fixat, se superposa al flux en comptes de reservar-hi lloc
       (comprovat contra 126 PDF reals; restant-lo, el comptador es passava
       de llarg en els casos frontera). */
    var util = 297 - 18 - 16;

    /* No es divideix l'alçada total per l'alçada de pàgina: `break-inside:
       avoid` empeny una pregunta sencera a la pàgina següent i hi deixa
       blanc, i l'estimació lineal es podia equivocar en tres pàgines. Aquí
       es reprodueix el que farà el navegador: s'omplen pàgines amb blocs
       que no es poden partir. 125 encerts de 126. */
    var blocs = [];

    /* `offsetHeight` i no `getBoundingClientRect()`: el segon torna la mida
       JA TRANSFORMADA, i `.full` porta un `transform: scale()` per al zoom
       de pantalla. Amb el zoom al 70 % el comptador deia 3 pàgines on n'hi
       ha 4, cosa que no té cap sentit: el paper no canvia perquè el
       professor s'acosti a mirar-lo. */
    function afegeix(el) {
      blocs.push([el.offsetHeight * aMm,
                  (parseFloat(getComputedStyle(el).marginBottom) || 0) * aMm]);
    }
    /* Les llistes i el que porta `.partible` (un contingut del pla amb els
       seus exercicis) es poden partir entre pàgines: es baixa als fills. */
    function recorre(el) {
      if (el.classList.contains('doc-peu')) return;
      if (el.tagName === 'OL' || el.tagName === 'UL' || el.classList.contains('partible')) {
        Array.prototype.forEach.call(el.children, recorre);
      } else {
        afegeix(el);
      }
    }
    Array.prototype.forEach.call(full.children, recorre);
    if (!blocs.length) { $('#pagines').textContent = '1 pàgina'; return; }

    var pagines = 1, ocupat = 0;
    blocs.forEach(function (b) {
      var alt = b[0], marge = b[1];
      if (alt > util) {                          // no hi cap enlloc: es partirà
        pagines += Math.floor((ocupat + alt) / util);
        ocupat = (ocupat + alt) % util;
      } else if (ocupat + alt > util + 0.01) {   // el mig mil·límetre de folga
        pagines++;                               // evita saltar per un
        ocupat = alt + marge;                    // arrodoniment
      } else {
        ocupat += alt + marge;
      }
    });

    /* Amb «≈» a posta: contrastat contra 126 PDF reals encerta el 96-98 %
       de les vegades, i quan falla és sempre una pàgina de menys. La
       impressió no mesura exactament igual que la pantalla i afinar-ho més
       voldria paginar de debò, cosa que no paga la pena per a un número
       que serveix per decidir si val la pena imprimir. */
    $('#pagines').textContent = '\u2248 ' + pagines +
      (pagines === 1 ? ' pàgina' : ' pàgines');
  }

  /* ------------------------------------------------------------------ zoom
     El full fa sempre 210 mm d'ample (vegeu `.full` a eina.css): és l'única
     manera que la pantalla i el paper parteixin les línies igual. Perquè hi
     càpiga en un portàtil, per defecte s'escala a l'ample que queda entre
     les dues columnes ('auto'). Si el professor mou el control, mana ell
     fins que torni a prémer «Ajusta». */
  var zoom = 'auto';

  function aplicaZoom() {
    var full = $('#full'), escena = $('.escena');
    var cs = getComputedStyle(escena);
    var lloc = escena.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    if (lloc <= 0) return;                 // pestanya amagada en pantalla estreta
    var s = zoom === 'auto'
      ? Math.max(0.3, Math.min(1, Math.floor(lloc / full.offsetWidth * 100) / 100))
      : zoom;
    document.documentElement.style.setProperty('--zoom', s);
    // L'escala no redueix la caixa del full: sense això, sota un full al
    // 70 % hi quedaria un 30 % de la seva alçada en blanc.
    full.style.setProperty('--baix', ((s - 1) * full.offsetHeight) + 'px');
    // Un sol selector: «Ajustat» diu entre parèntesis a quina mida queda.
    $('#zoom option[value=auto]').textContent = 'Ajustat (' + Math.round(s * 100) + ' %)';
    $('#zoom').value = zoom === 'auto' ? 'auto' : String(zoom);
  }

  function pinta() {
    pintaRail();
    pintaLlista();
    pintaFull();
    // El pla de repàs surt dels continguts marcats i no de les preguntes:
    // amb 2n marcat i cap pregunta triada, el pla té vint entrades i s'ha
    // de poder imprimir.
    $('#imprimeix').disabled = estat.vista === 'pla'
      ? !estat.sabers.length
      : !estat.preguntes.length;
  }

  /* ------------------------------------------------- estat a l'adreça (hash) */
  function desaAlHash() {
    pintaResums();
    try {
      var d = {
        s: estat.sabers, n: estat.spec.nombre, p: estat.spec.perfil,
        w: estat.spec.pes, o: estat.spec.ordre, t: estat.spec.punts,
        l: estat.spec.llavor, e: estat.cfg.espai, q: estat.cfg.paper,
        m: estat.cfg.model, pt: estat.cfg.mostraPunts ? 1 : 0,
        cp: estat.spec.criteriPunts,
        /* Tot el que canvia el paper. Sense les dues caselles, apagar les
           figures no sobrevivia a «Desa la prova»; sense la capçalera, el
           fitxer d'un alumne concret s'obria amb el nom en blanc i la data
           d'avui. */
        fg: estat.cfg.figures ? 1 : 0, ec: estat.cfg.encapcalaments ? 1 : 0,
        ce: estat.cfg.centre, ti: estat.cfg.titol, in: estat.cfg.instruccions,
        al: estat.cfg.alumne, gr: estat.cfg.grup, da: estat.cfg.data,
        pr: estat.cfg.practica, ps: estat.cfg.solucionsPla ? 1 : 0,
        ag: estat.cfg.agrupa ? 1 : 0, du: estat.spec.durada, su: estat.cfg.subtitol
      };
      /* La llista de preguntes es desa SEMPRE, no només quan s'ha editat.
         L'especificació sola no la reprodueix: les preguntes fixades i les
         pròpies no hi surten, i n'hi ha prou de marcar un curs perquè el
         resultat canviï. Per a una prova de recuperació l'enllaç ha de ser
         el registre exacte del full que va fer l'alumne; si al juny hi ha
         una reclamació, «gairebé el mateix examen» no serveix. */
      d.q7 = estat.preguntes.map(function (x) {
        var base = estat.propies[x.itemId]
          ? ['P', estat.propies[x.itemId].enunciat, estat.propies[x.itemId].solucio]
          : [x.itemId, x.saberId];
        // El nivell fixat també ha de viatjar a l'adreça, o l'enllaç
        // desat tornaria una prova amb un altre repartiment de dificultat.
        if (x.fix != null || x.nivell) base.push(x.fix != null ? x.fix : null);
        if (x.nivell) base.push(x.nivell);
        return base;
      });
      d.fx = Object.keys(estat.fixades);
      history.replaceState(null, '',
        '#' + btoa(unescape(encodeURIComponent(JSON.stringify(d)))));
    } catch (e) { /* si el navegador no ho permet, l'eina segueix igual */ }
  }

  /* Validadors per a l'adreça. Una adreça pot arribar retallada, editada a
     mà o d'una versió anterior de l'eina: el que no s'entén s'ignora i es
     queda el valor que ja hi havia, però mai no pot trencar la pàgina ni
     deixar a l'estat un valor que després faci petar el full. */
  var DE_LLISTA = {
    p: Object.keys(window.Composa.PERFILS),
    w: ['hores', 'items', 'igual'],
    o: ['curriculum', 'dificultat', 'barrejat'],
    q: ['quadricula', 'ratlles', 'blanc'],
    cp: ['igual', 'nivell', 'hores']
  };
  function text(v, max) { return typeof v === 'string' && v.length <= max; }
  function nombre(v, min, max) { return typeof v === 'number' && isFinite(v) && v >= min && v <= max; }

  function llegeixDelHash() {
    if (!location.hash || location.hash.length < 3) return false;
    var d;
    try {
      d = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))));
    } catch (e) { return false; }
    if (!d || typeof d !== 'object' || Array.isArray(d)) return false;

    var bo = function (k) {
      return DE_LLISTA[k] ? DE_LLISTA[k].indexOf(d[k]) >= 0 : false;
    };
    try {
      if (Array.isArray(d.s)) {
        estat.sabers = d.s.filter(function (id) { return typeof id === 'string' && sabersPerId[id]; });
      }
      if (nombre(d.n, 0, 200)) estat.spec.nombre = Math.round(d.n);
      if (bo('p')) estat.spec.perfil = d.p;
      if (bo('w')) estat.spec.pes = d.w;
      if (bo('o')) estat.spec.ordre = d.o;
      if (nombre(d.t, 0.25, 100)) estat.spec.punts = d.t;
      if (text(d.l, 24) && d.l) estat.spec.llavor = d.l;
      if (nombre(d.e, 0, 90)) estat.cfg.espai = d.e;
      if (bo('q')) estat.cfg.paper = d.q;
      if (text(d.m, 40)) estat.cfg.model = d.m;
      if (d.pt != null) estat.cfg.mostraPunts = !!d.pt;
      if (bo('cp')) estat.spec.criteriPunts = d.cp;
      // Les adreces d'abans no els porten: llavors manen els valors inicials.
      if (d.fg != null) estat.cfg.figures = !!d.fg;
      if (d.ec != null) estat.cfg.encapcalaments = !!d.ec;
      if (text(d.ce, 200)) estat.cfg.centre = d.ce;
      if (text(d.ti, 200)) estat.cfg.titol = d.ti;
      if (text(d.su, 200)) estat.cfg.subtitol = d.su;
      if (text(d.in, 2000)) estat.cfg.instruccions = d.in;
      if (text(d.al, 200)) estat.cfg.alumne = d.al;
      if (text(d.gr, 60)) estat.cfg.grup = d.gr;
      if (text(d.da, 10) && /^\d{4}-\d{2}-\d{2}$/.test(d.da)) estat.cfg.data = d.da;
      if ([0, 1, 2, 3].indexOf(d.pr) >= 0) estat.cfg.practica = d.pr;
      if (d.ps != null) estat.cfg.solucionsPla = !!d.ps;
      if (d.ag != null) estat.cfg.agrupa = !!d.ag;
      if (nombre(d.du, 5, 600)) estat.spec.durada = Math.round(d.du);

      if (Array.isArray(d.q7) && d.q7.length) {
        estat.preguntes = d.q7.map(llegeixPregunta).filter(Boolean);
        // Mana la llista: si l'adreça no porta el nombre (o no quadra), el
        // control deia «10» amb cinc preguntes al full.
        estat.spec.nombre = estat.preguntes.length;
        (Array.isArray(d.fx) ? d.fx : []).forEach(function (id) {
          if (typeof id === 'string' && banc[id]) estat.fixades[id] = true;
        });
        estat.editat = true;
        estat.cfg.llavor = estat.spec.llavor;
        reparteixPunts();
      }
      return true;
    } catch (e) { return false; }
  }

  /** Una pregunta de l'adreça, o `null` si no s'entén. */
  function llegeixPregunta(x) {
    if (!Array.isArray(x) || typeof x[0] !== 'string') return null;
    var fix = nombre(x[x[0] === 'P' ? 3 : 2], 0, 100) ? x[x[0] === 'P' ? 3 : 2] : undefined;
    if (x[0] === 'P') {
      if (!text(x[1], 5000) || !x[1].trim()) return null;
      return { itemId: creaPropia(x[1], text(x[2], 5000) ? x[2] : ''),
               saberId: null, punts: 0, fix: fix };
    }
    // Una variant que no era al catàleg es torna a construir a partir del
    // seu id: `p-<generador>-<llavor>`.
    if (!banc[x[0]] && x[0].indexOf('p-') === 0) {
      var tall = x[0].lastIndexOf('-');
      variant(x[0].slice(2, tall), x[0].slice(tall + 1));
    }
    if (!banc[x[0]]) return null;
    var saberId = typeof x[1] === 'string' && sabersPerId[x[1]] ? x[1] : null;
    return { itemId: x[0], saberId: saberId, punts: 0, fix: fix,
             nivell: [1, 2, 3].indexOf(x[3]) >= 0 ? x[3] : undefined };
  }

  /* ------------------------------------------- desar la prova en un fitxer
     Un HTML petit que només conté l'adreça d'aquesta prova exacta. Obrir-lo
     amb doble clic la torna a muntar tal com era. No hi ha servidor ni base
     de dades: el fitxer és el registre, i es pot desar a la carpeta del curs
     o passar-lo a un company. La idea ve de l'eina de prova inicial de 1r. */
  /** L'adreça que ha de portar el fitxer desat. */
  function adreca() {
    var base = (estat.cfg.baseUrl || '').trim();
    if (!base) return location.href;
    if (!/^https?:\/\//i.test(base)) base = 'https://' + base;
    try {
      /* Amb `URL` i no amb una regex sobre la cadena sencera: el patró que
         retallava el fitxer final (`…/index.html`) també es menjava el
         domini quan no hi havia camí, i `https://exemple.cat` es convertia
         en `https:/`. Aquí només es toca el `pathname`. */
      var u = new URL(base);
      var cami = u.pathname.replace(/\/[^\/]*\.[a-z0-9]{2,5}$/i, '')
                           .replace(/\/+$/, '');
      return u.origin + cami + '/' + location.hash;
    } catch (e) {
      return location.href;          // adreça il·legible: val més la d'ara
    }
  }

  function fitxerDeLaProva() {
    var u = adreca();
    var local = u.indexOf('file:') === 0;
    var avui = new Date().toLocaleDateString('ca-ES');
    var cursos = {};
    estat.sabers.forEach(function (id) { cursos[id.slice(0, 4)] = true; });
    var quins = MAPA.cursos.filter(function (c) { return cursos[c.id]; })
                           .map(function (c) { return c.titol; }).join(' i ') || '—';

    return '<!DOCTYPE html>\n<html lang="ca"><head><meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width,initial-scale=1">' +
      '<title>' + esc(estat.cfg.titol) + ' \u00b7 codi ' + esc(estat.cfg.llavor) + '</title>' +
      '<style>' +
      'body{font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;' +
      'background:#F1F4F8;margin:0;padding:40px 16px;color:#16202E}' +
      'main{max-width:640px;margin:0 auto;background:#fff;border-radius:10px;' +
      'padding:32px 34px;box-shadow:0 1px 6px rgba(22,32,46,.14)}' +
      'h1{color:#2455A4;font-size:22px;margin:0 0 4px}' +
      '.sub{color:#5D6B7E;margin:0 0 22px}' +
      '.dades{background:#E7EEF9;border-radius:7px;padding:12px 16px;' +
      'margin:0 0 22px;font-size:15px}.dades b{color:#2455A4}' +
      'a.boto{display:inline-block;background:#16202E;color:#fff;' +
      'text-decoration:none;font-weight:700;padding:12px 22px;border-radius:7px}' +
      'textarea{width:100%;height:88px;margin-top:8px;font:12px/1.4 ui-monospace,' +
      'Menlo,Consolas,monospace;border:1px solid #C2CCD8;border-radius:6px;' +
      'padding:8px;resize:vertical;color:#333}' +
      '.peu{color:#5D6B7E;font-size:13px;margin-top:22px}' +
      '</style></head><body><main>' +
      '<h1>' + esc(estat.cfg.titol) + '</h1>' +
      '<p class="sub">' + esc(quins) + ' \u00b7 ' + estat.preguntes.length + ' preguntes</p>' +
      '<div class="dades">codi <b>' + esc(estat.cfg.llavor) + '</b>' +
      (estat.cfg.model ? ' \u00b7 model <b>' + esc(estat.cfg.model) + '</b>' : '') +
      '<br>Aquesta adre\u00e7a torna a muntar exactament la mateixa prova: ' +
      'les mateixes preguntes, en el mateix ordre i amb els mateixos punts.</div>' +
      '<p><a class="boto" href="' + esc(u) + '">Obre la prova</a></p>' +
      '<p class="peu">Si l\u2019enlla\u00e7 no s\u2019obre, copia aquesta adre\u00e7a ' +
      'al navegador:</p>' +
      '<textarea readonly onclick="this.select()">' + esc(u) + '</textarea>' +
      '<p class="peu">Desat el ' + avui + '. Aquest fitxer nom\u00e9s guarda ' +
      'l\u2019adre\u00e7a; la prova es munta al navegador quan l\u2019obres.' +
      (local
        ? ' Apunta a la c\u00f2pia de l\u2019eina d\u2019aquest ordinador: si mous ' +
          'la carpeta, l\u2019enlla\u00e7 deixa de funcionar. Per evitar-ho, posa ' +
          'l\u2019adre\u00e7a p\u00fablica de l\u2019eina al panell d\u2019ajustos.'
        : '') + '</p>' +
      '</main></body></html>';
  }

  function desaFitxer() {
    var b = new Blob([fitxerDeLaProva()], { type: 'text/html;charset=utf-8' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(b);
    a.download = 'prova-' + estat.cfg.llavor +
      (estat.cfg.model ? '-model-' + estat.cfg.model : '') + '.html';
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      a.parentNode.removeChild(a);
    }, 2000);
  }

  /**
   * Torna a obrir una prova desada amb «Desa la prova». El fitxer és un
   * HTML que només porta l'adreça de la prova; d'aquí se'n treu la part
   * de després del «#», que és la prova sencera, i es carrega en aquesta
   * mateixa finestra. Així funciona encara que l'adreça desada apunti a
   * una carpeta que ja no existeix.
   */
  function obreFitxer(f) {
    var r = new FileReader();
    r.onload = function () {
      var m = String(r.result).match(/href="[^"#]*#([A-Za-z0-9+\/=%]+)"/);
      if (!m) {
        alert('Aquest fitxer no és una prova desada amb «Desa la prova».');
        return;
      }
      location.hash = m[1];
      location.reload();
    };
    r.readAsText(f);
  }

  /** Canvia el document que es veu al centre: prova, clau o pla. */
  function mostraVista(vista) {
    estat.vista = vista;
    document.querySelectorAll('[data-doc]').forEach(function (x) {
      x.setAttribute('aria-selected', x.dataset.doc === vista);
    });
    $('#imprimeix').firstChild.textContent = 'Imprimeix ' + (
      vista === 'clau' ? 'la clau' : vista === 'pla' ? 'el pla' : 'la prova');
    // `pinta()` i no `pintaFull()`: el botó s'habilita segons la vista
    // —el pla depèn dels continguts marcats i no de les preguntes— i
    // canviant de pestanya no es recalculava.
    pinta();
  }

  /** «Altres preguntes» i Ctrl+G: un codi nou i una tria nova. */
  function altraTria() {
    estat.spec.llavor = window.Atzar.novaLlavor();
    sincronitzaControls();
    recomposa();
  }

  /* ---------------------------------------------------------------- lligams */
  function sincronitzaControls() {
    /* El control té un rang [3, 30] i `estat.spec.nombre` se'n pot sortir
       traient o afegint preguntes una a una. Mana l'estat, i el marcador
       ha de dir el que hi ha de debò encara que la barra estigui al topall. */
    var n = $('#nombre');
    n.value = Math.max(+n.min, Math.min(+n.max, estat.spec.nombre));
    $('#nombre-valor').textContent = estat.spec.nombre +
      (estat.spec.nombre > +n.max ? ' (per sobre del màxim del control)' :
       estat.spec.nombre < +n.min ? ' (per sota del mínim del control)' : '');
    $('#punts').value = estat.spec.punts;
    $('#espai').value = estat.cfg.espai;
    $('#espai-valor').textContent = estat.cfg.espai + ' mm';
    $('#paper').value = estat.cfg.paper;
    $('#ordre').value = estat.spec.ordre;
    $('#model').value = estat.cfg.model;
    $('#baseUrl').value = estat.cfg.baseUrl;
    $('#figures').checked = estat.cfg.figures;
    $('#encapcalaments').checked = estat.cfg.encapcalaments;
    $('#mostraPunts').checked = estat.cfg.mostraPunts;
    $('#llavor').textContent = estat.spec.llavor;
    document.querySelectorAll('[data-perfil]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.perfil === estat.spec.perfil);
    });
    document.querySelectorAll('[data-pes]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.pes === estat.spec.pes);
    });
    document.querySelectorAll('[data-criteri]').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.criteri === estat.spec.criteriPunts);
    });
    document.querySelectorAll('[data-practica]').forEach(function (b) {
      b.setAttribute('aria-pressed', +b.dataset.practica === estat.cfg.practica);
    });
    $('#solucionsPla').checked = estat.cfg.solucionsPla;
    $('#agrupa').checked = estat.cfg.agrupa;
    $('#durada').value = estat.spec.durada;
    pintaResums();
  }

  /* El títol de cada secció plegada del panell diu què hi ha triat: així no
     cal obrir-les per saber com sortirà la prova. */
  var NOM_PAPER = { quadricula: 'quadrícula', ratlles: 'ratlles', blanc: 'en blanc' };
  var NOM_ORDRE = { curriculum: 'currículum', dificultat: 'fàcil → difícil', barrejat: 'barrejat' };
  function pintaResums() {
    var c = estat.cfg, sp = estat.spec, n = window.Full.num;
    $('#resum-punts').textContent =
      n(sp.punts) + ' p · ' + sp.durada + ' min · ' + NOM_ORDRE[sp.ordre];
    $('#resum-full').textContent = c.espai + ' mm · ' + NOM_PAPER[c.paper];
    $('#resum-pla').textContent = c.practica
      ? c.practica + ' exercici' + (c.practica === 1 ? '' : 's') +
        (c.solucionsPla ? ' · amb solucions' : '')
      : 'sense exercicis';
    $('#resum-prefs').textContent = valorsInicials ? 'valors inicials desats' : '';
  }

  function lliga() {
    /* Marcar un contingut AFEGEIX una pregunta; desmarcar-lo treu les
       seves. Res més de la prova no es toca. Abans això cridava
       `recomposa()` i el professor perdia tot el que havia triat només per
       voler-hi afegir un contingut més. */
    $('#rail-cos').addEventListener('change', function (ev) {
      var id = ev.target.dataset && ev.target.dataset.saber;
      if (!id) return;
      marca([id], ev.target.checked);
      if (ev.target.checked) afegeixDelSaber(id);
      else { treuTotsDelSaber(id); acabaCanvi(); }
    });

    $('#rail-cos').addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      var filtre = plana($('#cerca').value.trim());

      if (b.dataset.plega) { commutaPlegat(b.dataset.plega); return; }
      if (b.dataset.mes) { afegeixDelSaber(b.dataset.mes); return; }
      if (b.dataset.menys) { treuDelSaber(b.dataset.menys); return; }

      var llista = null;
      if (b.dataset.curs) {
        var curs = MAPA.cursos.filter(function (c) { return c.id === b.dataset.curs; })[0];
        // Només el que es veu: amb un filtre actiu, «Tot el curs» marcava
        // també els continguts que el filtre amagava.
        llista = visibles(curs, filtre).map(function (s) { return s.id; });
      } else if (b.dataset.sentit) {
        var parts = b.dataset.sentit.split('|');
        var c2 = MAPA.cursos.filter(function (c) { return c.id === parts[0]; })[0];
        llista = visibles(c2, filtre)
          .filter(function (s) { return s.sentit === parts[1]; })
          .map(function (s) { return s.id; });
      }
      if (!llista) return;

      var activa = b.getAttribute('aria-pressed') !== 'true';
      marca(llista, activa);
      if (activa) {
        // Una pregunta per contingut nou, com si es marquessin un a un.
        var atzar = new window.Atzar(estat.spec.llavor + '|bloc|' + Date.now());
        llista.forEach(function (id) {
          var s2 = sabersPerId[id];
          if (!s2 || !s2.items.length) return;
          if (estat.preguntes.some(function (q) { return q.saberId === id; })) return;
          var nou = triaItem(s2, atzar);
          if (nou) inserisc({ itemId: nou.id, saberId: id, punts: 0 });
        });
      } else {
        llista.forEach(treuTotsDelSaber);
      }
      acabaCanvi();
    });

    $('#cerca').addEventListener('input', pintaRail);

    /* ----- la capçalera, editada damunt del full
       Mentre s'escriu no es repinta el full (el cursor saltaria a l'inici):
       només es desa l'estat i es torna a comptar pàgines. Es repinta quan
       el focus surt de la capçalera, que és quan s'arregla el format. */
    var UNA_LINIA = { centre: 200, titol: 200, subtitol: 200, alumne: 200, grup: 60 };
    $('#full').addEventListener('input', function (ev) {
      var el = ev.target.closest && ev.target.closest('[data-camp]');
      if (el) {
        var k = el.dataset.camp, v = el.innerText.replace(/\u00a0/g, ' ');
        estat.cfg[k] = UNA_LINIA[k]
          ? v.replace(/\s*\n\s*/g, ' ').trim().slice(0, UNA_LINIA[k])
          : v.replace(/\n{2,}/g, '\n').trim().slice(0, 2000);
        clearTimeout(lliga.pag);
        lliga.pag = setTimeout(comptaPagines, 300);
        desaAlHash();
        return;
      }
      if (ev.target.classList.contains('tria-data')) {
        if (/^\d{4}-\d{2}-\d{2}$/.test(ev.target.value)) estat.cfg.data = ev.target.value;
        pintaFull();
        desaAlHash();
      }
    });
    $('#full').addEventListener('keydown', function (ev) {
      var el = ev.target.closest && ev.target.closest('[data-camp]');
      // Retorn acaba un camp d'una línia; a les instruccions, fa línia nova.
      if (el && ev.key === 'Enter' && UNA_LINIA[el.dataset.camp]) {
        ev.preventDefault();
        el.blur();
      }
      if (ev.target.dataset && ev.target.dataset.triaData != null &&
          (ev.key === 'Enter' || ev.key === ' ')) {
        ev.preventDefault();
        triaData(ev.target);
      }
    });
    $('#full').addEventListener('focusout', function (ev) {
      if (!ev.target.closest || !ev.target.closest('[data-camp]')) return;
      setTimeout(function () {
        var a = document.activeElement;
        if (!a || !a.closest || !a.closest('#full [data-camp]')) pintaFull();
      }, 0);
    });
    function triaData(span) {
      var inp = span.parentNode.querySelector('.tria-data');
      try { inp.showPicker(); } catch (e) { inp.focus(); inp.click(); }
    }

    $('#llista').addEventListener('change', function (ev) {
      var niv = ev.target.dataset && ev.target.dataset.nivell;
      if (niv != null) { fixaNivell(+niv, +ev.target.value || 0); return; }
      var pos = ev.target.dataset && ev.target.dataset.posicio;
      if (pos != null) { mouA(+pos, +ev.target.value); return; }
      var i = ev.target.dataset && ev.target.dataset.punts;
      if (i == null) return;
      var v = parseFloat(ev.target.value);
      estat.preguntes[+i].fix = isNaN(v) ? null : Math.max(0, Math.round(v * 4) / 4);
      estat.editat = true;
      reparteixPunts();
      pinta();
      desaAlHash();
    });

    /* El mateix gestor per als dos llocs: els botons del full i els del
       panell fan servir els mateixos `data-*`. */
    $('#full').addEventListener('click', accioPregunta);
    $('#llista').addEventListener('click', accioPregunta);

    function accioPregunta(ev) {
      if (ev.target.id === 'allibera') {
        estat.preguntes.forEach(function (q) { delete q.fix; });
        reparteixPunts();
        pinta();
        desaAlHash();
        return;
      }
      if (ev.target.closest('[data-tria-data]')) { triaData(ev.target.closest('[data-tria-data]')); return; }
      if (ev.target.closest('[data-camp]')) return;   // s'està editant la capçalera
      var b = ev.target.closest('button');
      if (!b) {
        // Clicar una pregunta del full l'obre al panell.
        var pr = this.id === 'full' && estat.vista === 'prova' &&
                 ev.target.closest('.apartat, .pregunta:not(.pregunta-grup)');
        var t = pr && pr.querySelector(':scope > .pregunta-eines [data-treu]');
        if (t) obre(+t.dataset.treu, true);
        return;
      }
      if (b.disabled) return;
      var d = b.dataset;
      if (d.obre != null) obre(+d.obre);
      else if (d.nombres != null) altresNombres(+d.nombres);
      else if (d.seguent != null) passa(+d.seguent, 1);
      else if (d.anterior != null) passa(+d.anterior, -1);
      else if (d.amunt != null) mou(+d.amunt, -1);
      else if (d.avall != null) mou(+d.avall, 1);
      else if (d.treu != null) treu(+d.treu);
      else if (d.fixa != null) {
        var q = estat.preguntes[+d.fixa];
        if (estat.fixades[q.itemId]) delete estat.fixades[q.itemId];
        else estat.fixades[q.itemId] = true;
        pintaLlista();
        pintaFull();
        desaAlHash();
      }
    }

    $('#nombre').addEventListener('input', function () {
      estat.spec.nombre = +this.value;
      $('#nombre-valor').textContent = this.value;
    });
    // Ajusta i no refà: pujar de 9 a 12 ha d'afegir tres preguntes, no
    // canviar-ne dotze.
    $('#nombre').addEventListener('change', function () { ajusta(+this.value); });

    $('#durada').addEventListener('change', function () {
      var v = Math.round(+this.value);
      estat.spec.durada = v >= 5 && v <= 600 ? v : 55;
      this.value = estat.spec.durada;
      pintaTemps();
      desaAlHash();
    });
    // Canvia la numeració del full i les etiquetes del panell: es pinta tot.
    $('#agrupa').addEventListener('change', function () {
      estat.cfg.agrupa = this.checked;
      pinta();
      desaAlHash();
    });

    $('#punts').addEventListener('change', function () {
      estat.spec.punts = Math.max(0.25, +this.value || 10);
      reparteixPunts();
      pinta();
      desaAlHash();
    });

    document.querySelectorAll('[data-perfil]').forEach(function (b) {
      b.addEventListener('click', function () {
        estat.spec.perfil = b.dataset.perfil;
        sincronitzaControls();
        recomposa();
      });
    });
    document.querySelectorAll('[data-pes]').forEach(function (b) {
      b.addEventListener('click', function () {
        estat.spec.pes = b.dataset.pes;
        sincronitzaControls();
        recomposa();
      });
    });
    document.querySelectorAll('[data-criteri]').forEach(function (b) {
      b.addEventListener('click', function () {
        estat.spec.criteriPunts = b.dataset.criteri;
        sincronitzaControls();
        reparteixPunts();
        pinta();
        desaAlHash();
      });
    });
    /* Tocar el pla de repàs el mostra: si no, el canvi passaria a un
       document que no es veu. */
    document.querySelectorAll('[data-practica]').forEach(function (b) {
      b.addEventListener('click', function () {
        estat.cfg.practica = +b.dataset.practica;
        sincronitzaControls();
        mostraVista('pla');
        desaAlHash();
      });
    });
    $('#solucionsPla').addEventListener('change', function () {
      estat.cfg.solucionsPla = this.checked;
      mostraVista('pla');
      desaAlHash();
    });

    $('#ordre').addEventListener('change', function () {
      estat.spec.ordre = this.value;
      reordena();          // canviar l'ordre no ha de canviar les preguntes
    });

    $('#altra').addEventListener('click', altraTria);

    $('#espai').addEventListener('input', function () {
      estat.cfg.espai = +this.value;
      $('#espai-valor').textContent = this.value + ' mm';
      pintaFull();
    });
    $('#espai').addEventListener('change', desaAlHash);
    $('#paper').addEventListener('change', function () {
      estat.cfg.paper = this.value; pintaFull(); desaAlHash();
    });
    ['figures', 'encapcalaments', 'mostraPunts'].forEach(function (k) {
      $('#' + k).addEventListener('change', function () {
        estat.cfg[k] = this.checked; pintaFull(); desaAlHash();
      });
    });
    // Tot el que surt imprès va a l'adreça; `baseUrl` no, és de l'eina.
    ['model', 'baseUrl']
      .forEach(function (k) {
        $('#' + k).addEventListener('input', function () {
          estat.cfg[k] = this.value;
          pintaFull();
          if (k !== 'baseUrl') desaAlHash();
        });
      });

    document.querySelectorAll('[data-doc]').forEach(function (b) {
      b.addEventListener('click', function () { mostraVista(b.dataset.doc); });
    });

    $('#zoom').addEventListener('change', function () {
      zoom = this.value === 'auto' ? 'auto' : +this.value;
      aplicaZoom();
    });

    $('#imprimeix').addEventListener('click', function () { window.print(); });
    $('#desa-fitxer').addEventListener('click', desaFitxer);
    $('#obre-fitxer').addEventListener('click', function () { $('#fitxer').click(); });
    $('#fitxer').addEventListener('change', function () {
      if (this.files[0]) obreFitxer(this.files[0]);
      this.value = '';
    });
    // També s'hi pot deixar anar el fitxer a sobre, arrossegant-lo.
    document.addEventListener('dragover', function (ev) {
      if (ev.dataTransfer && [].indexOf.call(ev.dataTransfer.types, 'Files') >= 0) ev.preventDefault();
    });
    document.addEventListener('drop', function (ev) {
      var f = ev.dataTransfer && ev.dataTransfer.files[0];
      if (!f) return;
      ev.preventDefault();
      obreFitxer(f);
    });
    $('#desa-inicials').addEventListener('click', desaInicials);
    $('#oblida-inicials').addEventListener('click', oblidaInicials);

    $('#obre-propia').addEventListener('click', function () {
      $('#propia').hidden = false;
      this.hidden = true;
      $('#propia-enunciat').focus();
    });
    $('#cancella-propia').addEventListener('click', function () {
      $('#propia').hidden = true;
      $('#obre-propia').hidden = false;
    });
    $('#afegeix-propia').addEventListener('click', function () {
      if (!afegeixPropia($('#propia-enunciat').value, $('#propia-solucio').value)) {
        $('#propia-enunciat').focus();
        return;
      }
      $('#propia-enunciat').value = '';
      $('#propia-solucio').value = '';
      $('#propia').hidden = true;
      $('#obre-propia').hidden = false;
    });

    document.querySelectorAll('[data-mobil]').forEach(function (b) {
      b.addEventListener('click', function () {
        $('#app').dataset.vista = b.dataset.mobil;
        document.querySelectorAll('[data-mobil]').forEach(function (x) {
          x.setAttribute('aria-selected', x === b);
        });
        // Amagat, el full no té amplada on ajustar-se: es fa en tornar-hi.
        aplicaZoom();
      });
    });

    /* Ctrl/Cmd+G: una altra tria de preguntes. Esc: plega la pregunta. */
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && oberta >= 0 &&
          !(ev.target.closest && ev.target.closest('#full [data-camp]'))) {
        obre(oberta);
        return;
      }
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'g') {
        ev.preventDefault();
        altraTria();
      }
    });

    window.addEventListener('resize', function () { comptaPagines(); aplicaZoom(); });
  }

  /* Les seccions plegades del panell. Quines tens obertes és una preferència
     teva, no de la prova: va a la memòria del navegador, com els cursos
     plegats de l'esquerra. */
  var OBERTES = 'recuperacio-eso:seccions';
  function obrePlegables() {
    var obertes = [];
    try { obertes = JSON.parse(localStorage.getItem(OBERTES) || '[]'); } catch (e) { /* res */ }
    document.querySelectorAll('details[data-sec]').forEach(function (det) {
      det.open = obertes.indexOf(det.dataset.sec) >= 0;
      det.addEventListener('toggle', function () {
        var ara = [];
        document.querySelectorAll('details[data-sec]').forEach(function (x) {
          if (x.open) ara.push(x.dataset.sec);
        });
        try { localStorage.setItem(OBERTES, JSON.stringify(ara)); } catch (e) { /* res */ }
      });
    });
  }

  function arrenca() {
    var teInicials = recuperaInicials();
    var delHash = llegeixDelHash();
    valorsInicials = teInicials;
    sincronitzaControls();
    lliga();
    obrePlegables();
    if (delHash && estat.editat) { pinta(); } else { recomposa(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrenca);
  } else {
    arrenca();
  }
})();
