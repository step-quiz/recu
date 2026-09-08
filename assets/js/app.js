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

  /* --------------------------------------------------------------- índexs */
  var banc = {};
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

  var sabersPerId = {}, ordreSabers = [];
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
    fixades: {},
    preguntes: [],
    propies: {},          // id -> {enunciat, solucio}, per poder desar-les
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
                        'figures', 'encapcalaments', 'mostraPunts', 'baseUrl'];
  var SPEC_INICIALS = ['nombre', 'perfil', 'pes', 'ordre', 'punts', 'criteriPunts'];

  function desaInicials() {
    try {
      var cfg = {}, spec = {};
      CAMPS_INICIALS.forEach(function (k) { cfg[k] = estat.cfg[k]; });
      SPEC_INICIALS.forEach(function (k) { spec[k] = estat.spec[k]; });
      localStorage.setItem(CAPCALERA_DESADA, JSON.stringify(
        { cfg: cfg, spec: spec, sabers: estat.sabers }));
      avisaInicials('Desat. En obrir l\'eina en aquest navegador, la trobaràs així.');
    } catch (e) {
      avisaInicials('No s\'han pogut desar: el navegador no ho permet ' +
                    '(finestra privada?).');
    }
  }

  function oblidaInicials() {
    try { localStorage.removeItem(CAPCALERA_DESADA); } catch (e) { /* res */ }
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
   * Genera una llista nova. Les preguntes pròpies i les fixades amb ☆ es
   * conserven sempre: són l'única cosa de la prova que el professor ha
   * escrit o triat a mà i regenerar-les seria destruir feina.
   */
  /**
   * Tria un ítem d'un saber que no sigui a la prova, respectant el perfil i
   * evitant repetir exercici pare. Si el catàleg s'ha acabat però el saber
   * té generadors, en fabrica una variant nova.
   */
  function triaItem(saber, atzar) {
    var usats = {}, pares = {};
    estat.preguntes.forEach(function (x) {
      usats[x.itemId] = true;
      var it = banc[x.itemId];
      if (it) pares[it.full + '-' + it.ex] = true;
    });

    var pes = window.Composa.PERFILS[estat.spec.perfil] || window.Composa.PERFILS.minims;
    var lliures = saber.items.map(function (id) { return banc[id]; })
      .filter(function (it) { return it && !usats[it.id] && !pares[it.full + '-' + it.ex]; });
    if (!lliures.length) {
      lliures = saber.items.map(function (id) { return banc[id]; })
        .filter(function (it) { return it && !usats[it.id]; });
    }
    if (!lliures.length) {
      var gens = gensPerSaber[saber.id] || [];
      if (!gens.length) return null;
      var g = atzar.triaPonderada(gens, function (x) { return pes[x.nivell] || 0.02; });
      return variant(g.id, novaLlavor(g.id));
    }
    return atzar.triaPonderada(lliures, function (it) { return pes[it.nivell] || 0.02; });
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
   * Les preguntes pròpies i les fixades amb ☆ se salven fins i tot aquí.
   */
  function recomposa() {
    // L'ordre de les voltes es fixa amb el codi de la tria: si el codi
    // canvia, l'ordre també, o «Altres preguntes» oferiria sempre la
    // mateixa seqüència en clicar les fletxes.
    voltes = {};
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

  /**
   * Uns altres nombres per a la mateixa pregunta. Només per als ítems que
   * venen d'un generador; el pou és infinit.
   */
  /* ------------------------------------------------------ la volta d'un saber
     El ⟳ triava un ítem a l'atzar cada vegada. Amb quinze ítems disponibles
     això donava seqüències com A, B, B, A, C, B, C: repeticions immediates i
     només tres preguntes vistes de quinze. Ara l'atzar decideix UNA vegada en
     quin ordre sortiran, i els botons recorren aquesta llista endavant i
     endarrere. Abans de repetir-ne cap, les hauràs vistes totes. */
  var voltes = {};

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
  }

  /** El que fa que dues preguntes siguin «la mateixa» per a l'ull. */
  function firma(it) {
    return (it.cap || '') + '|' + (it.enunciat || '') + '|' + (it.figura || '');
  }

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

  /** El que fa que dues variants siguin «la mateixa pregunta» per a l'ull. */
  function firma(it) {
    return (it.cap || '') + '|' + (it.enunciat || '') + '|' + (it.figura || '');
  }

  /** Porta la pregunta `i` a la posició `desti` (1..n) d'una sola passa. */
  function mouA(i, desti) {
    desti = Math.max(1, Math.min(estat.preguntes.length, desti)) - 1;
    if (desti === i) return;
    var q = estat.preguntes.splice(i, 1)[0];
    estat.preguntes.splice(desti, 0, q);
    acabaCanvi();
  }

  function mou(i, delta) {
    var j = i + delta;
    if (j < 0 || j >= estat.preguntes.length) return;
    var t = estat.preguntes[i];
    estat.preguntes[i] = estat.preguntes[j];
    estat.preguntes[j] = t;
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
    acabaCanvi();
  }

  /**
   * Una pregunta més d'un contingut concret, sense refer la prova. És el
   * control que faltava per construir la recuperació sobre els criteris que
   * l'alumne no va assolir, en comptes de sobre un total global.
   */
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
               : d.curs ? '[data-curs="' + d.curs + '"]' : null;

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
          cos += '<div class="sentit-tit">' +
                   '<span>' + esc(s.sentitTitol) + '</span>' +
                   '<button class="mini" data-sentit="' + esc(curs.id + '|' + s.sentit) + '" ' +
                     'aria-pressed="' + totsSentit + '">' +
                     (totsSentit ? 'Treu' : 'Tot') + '</button>' +
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
                (quantes ? '<span class="a-prova">· ' + quantes + ' triades</span>' : '') +
              '</div>' +
            '</div>' +
          '</label>' +
          '<span class="quants">' +
            '<button class="menys" data-menys="' + esc(s.id) + '"' +
              (quantes ? '' : ' disabled') +
              ' title="Treu una pregunta d\'aquest contingut"' +
              ' aria-label="Treu una pregunta de ' + esc(s.titol) + '">\u2212</button>' +
            '<button class="mes" data-mes="' + esc(s.id) + '" ' +
              'title="Afegeix una pregunta d\'aquest contingut" ' +
              'aria-label="Afegeix una pregunta de ' + esc(s.titol) + '">+</button>' +
          '</span>' +
        '</div>';
      });

      var buits = curs.sabers.length - totalAmbBanc;
      html += '<section class="curs">' +
        '<div class="curs-cap">' +
          '<strong>' + esc(curs.titol) + '</strong>' +
          '<span class="compte">' + triats + ' / ' + totalAmbBanc + '</span>' +
          '<button class="mini" data-curs="' + esc(curs.id) + '" aria-pressed="' + tots + '">' +
            (tots ? 'Treu-ho tot' : 'Tot el curs') + '</button>' +
        '</div>' +
        '<div class="sentit">' + cos + '</div>' +
        (buits && !filtre
          ? '<p class="curs-peu">' + buits + ' continguts del currículum no tenen ' +
            'preguntes al banc i no es llisten. Fes-los amb «+ Pregunta pròpia».</p>'
          : '') +
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

  function pintaLlista() {
    var h = '';
    if (!estat.preguntes.length) {
      h = '<p class="buida">' + (estat.sabers.length
        ? 'Cap pregunta. Puja el nombre de preguntes o revisa els avisos.'
        : 'Marca continguts a l\'esquerra i la prova es muntarà sola.') + '</p>';
    } else {
      estat.preguntes.forEach(function (q, i) {
        var it = banc[q.itemId];
        var saber = sabersPerId[q.saberId];
        if (!it) return;
        h += '<div class="q' + (estat.fixades[q.itemId] ? ' marcada' : '') + '">' +
          /* La posició és un camp: escriure-hi 3 la porta a la tercera
             d'una passa. Amb només les fletxes, passar de la catorzena a
             la tercera eren onze clics. */
          '<input class="q-num" type="number" min="1" max="' + estat.preguntes.length +
            '" value="' + (i + 1) + '" data-posicio="' + i +
            '" aria-label="Posició de la pregunta ' + (i + 1) + '">' +
          '<span class="q-cos">' +
            '<span class="q-tit">' + esc(resumeix(it.cap) || resumeix(it.enunciat) || it.id) + '</span>' +
            '<span class="q-saber">' + esc(saber ? saber.titol : it.blocTitol) +
              (saber ? ' · nivell ' + it.nivell : '') + '</span>' +
          '</span>' +
          '<span class="q-punts">' +
            '<input type="number" min="0" max="20" step="0.25" ' +
              'value="' + q.punts + '" data-punts="' + i + '" ' +
              'class="' + (q.fix != null ? 'fixat' : '') + '" ' +
              'aria-label="Punts de la pregunta ' + (i + 1) + '">' +
            '<span>p</span>' +
          '</span>' +
          '<span class="q-eines">' +
            '<button data-fixa="' + i + '" title="Conserva-la en tornar a generar" ' +
              'aria-label="Fixa la pregunta ' + (i + 1) + '">' +
              (estat.fixades[q.itemId] ? '★' : '☆') + '</button>' +
            '<button data-anterior="' + i + '" title="L\'anterior d\'aquest contingut"' +
              (saber ? '' : ' disabled') + '>\u27f2</button>' +
            '<button data-seguent="' + i + '" title="La següent d\'aquest contingut"' +
              (saber ? '' : ' disabled') + '>\u27f3</button>' +
            (it.gen
              ? '<button data-nombres="' + i + '" title="Uns altres nombres, ' +
                'la mateixa pregunta">\u21bb</button>' : '') +
            '<button data-amunt="' + i + '" title="Amunt"' + (i ? '' : ' disabled') + '>↑</button>' +
            '<button data-avall="' + i + '" title="Avall"' +
              (i === estat.preguntes.length - 1 ? ' disabled' : '') + '>↓</button>' +
            '<button data-treu="' + i + '" title="Treu-la">✕</button>' +
          '</span>' +
        '</div>';
      });
    }
    if (estat.desquadrat) {
      var d = estat.desquadrat, n = window.Full.num;
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
    $('#llista').innerHTML = h;
  }

  /* --------------------------------------------------------------- el full */
  function pintaFull() {
    var cfg = Object.create(estat.cfg);
    cfg.subtitol = estat.cfg.subtitol || subtitolAutomatic();
    cfg.editable = estat.vista === 'prova';
    cfg.fixades = estat.fixades;

    var dades = { cfg: cfg, preguntes: estat.preguntes, sabers: estat.sabers };
    var html = estat.vista === 'clau' ? window.Full.clau(dades, banc, sabersPerId)
             : estat.vista === 'pla' ? window.Full.pla(dades, banc, sabersPerId, MAPA)
             : window.Full.prova(dades, banc, sabersPerId);

    var full = $('#full');
    full.innerHTML = html;

    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(full, {
          delimiters: [{ left: '$', right: '$', display: false }],
          throwOnError: false
        });
      } catch (e) { /* si KaTeX falla es veu el LaTeX en cru: ja és prou avís */ }
    }
    comptaPagines();
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
    Array.prototype.forEach.call(full.children, function (fill) {
      if (fill.tagName === 'OL' || fill.tagName === 'UL') {
        Array.prototype.forEach.call(fill.children, afegeix);
      } else if (!fill.classList.contains('doc-peu')) {
        afegeix(fill);
      }
    });
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
    try {
      var d = {
        s: estat.sabers, n: estat.spec.nombre, p: estat.spec.perfil,
        w: estat.spec.pes, o: estat.spec.ordre, t: estat.spec.punts,
        l: estat.spec.llavor, e: estat.cfg.espai, q: estat.cfg.paper,
        m: estat.cfg.model, pt: estat.cfg.mostraPunts ? 1 : 0,
        cp: estat.spec.criteriPunts
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
        if (x.fix != null) base.push(x.fix);
        return base;
      });
      d.fx = Object.keys(estat.fixades);
      history.replaceState(null, '',
        '#' + btoa(unescape(encodeURIComponent(JSON.stringify(d)))));
    } catch (e) { /* si el navegador no ho permet, l'eina segueix igual */ }
  }

  function llegeixDelHash() {
    if (!location.hash || location.hash.length < 3) return false;
    try {
      var d = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))));
      estat.sabers = (d.s || []).filter(function (id) { return sabersPerId[id]; });
      if (d.n) estat.spec.nombre = d.n;
      if (d.p && window.Composa.PERFILS[d.p]) estat.spec.perfil = d.p;
      if (d.w) estat.spec.pes = d.w;
      if (d.o) estat.spec.ordre = d.o;
      if (d.t) estat.spec.punts = d.t;
      if (d.l) estat.spec.llavor = d.l;
      if (d.e != null) estat.cfg.espai = d.e;
      if (d.q) estat.cfg.paper = d.q;
      if (d.m) estat.cfg.model = d.m;
      if (d.pt != null) estat.cfg.mostraPunts = !!d.pt;
      if (d.cp) estat.spec.criteriPunts = d.cp;

      if (d.q7 && d.q7.length) {
        estat.preguntes = d.q7.map(function (x) {
          if (x[0] === 'P') {
            return { itemId: creaPropia(x[1], x[2]), saberId: null, punts: 0,
                     fix: x[3] != null ? x[3] : undefined };
          }
          // Una variant que no era al catàleg es torna a construir a
          // partir del seu id: `p-<generador>-<llavor>`.
          if (!banc[x[0]] && x[0].indexOf('p-') === 0) {
            var tall = x[0].lastIndexOf('-');
            variant(x[0].slice(2, tall), x[0].slice(tall + 1));
          }
          return banc[x[0]]
            ? { itemId: x[0], saberId: x[1], punts: 0,
                fix: x[2] != null ? x[2] : undefined }
            : null;
        }).filter(Boolean);
        (d.fx || []).forEach(function (id) { estat.fixades[id] = true; });
        estat.editat = true;
        estat.cfg.llavor = estat.spec.llavor;
        reparteixPunts();
      }
      return true;
    } catch (e) { return false; }
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

  /* ---------------------------------------------------------------- lligams */
  function sincronitzaControls() {
    /* El control té un rang [3, 15] i `estat.spec.nombre` se'n pot sortir
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
    $('#centre').value = estat.cfg.centre;
    $('#titol').value = estat.cfg.titol;
    $('#alumne').value = estat.cfg.alumne;
    $('#grup').value = estat.cfg.grup;
    $('#data').value = estat.cfg.data;
    $('#model').value = estat.cfg.model;
    $('#baseUrl').value = estat.cfg.baseUrl;
    $('#instruccions').value = estat.cfg.instruccions;
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

    $('#llista').addEventListener('change', function (ev) {
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
      var b = ev.target.closest('button');
      if (!b || b.disabled) return;
      var d = b.dataset;
      if (d.nombres != null) altresNombres(+d.nombres);
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
    $('#ordre').addEventListener('change', function () {
      estat.spec.ordre = this.value;
      reordena();          // canviar l'ordre no ha de canviar les preguntes
    });

    $('#altra').addEventListener('click', function () {
      estat.spec.llavor = window.Atzar.novaLlavor();
      sincronitzaControls();
      recomposa();
    });

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
    ['centre', 'titol', 'alumne', 'grup', 'data', 'model', 'baseUrl'].forEach(function (k) {
      $('#' + k).addEventListener('input', function () {
        estat.cfg[k] = this.value;
        if (k === 'model') desaAlHash();
        pintaFull();
      });
    });
    $('#instruccions').addEventListener('input', function () {
      estat.cfg.instruccions = this.value;
      pintaFull();
    });

    document.querySelectorAll('[data-doc]').forEach(function (b) {
      b.addEventListener('click', function () {
        estat.vista = b.dataset.doc;
        document.querySelectorAll('[data-doc]').forEach(function (x) {
          x.setAttribute('aria-selected', x === b);
        });
        $('#imprimeix').firstChild.textContent = 'Imprimeix ' + (
          estat.vista === 'clau' ? 'la clau' : estat.vista === 'pla' ? 'el pla' : 'la prova');
        // `pinta()` i no `pintaFull()`: el botó s'habilita segons la vista
        // —el pla depèn dels continguts marcats i no de les preguntes— i
        // canviant de pestanya no es recalculava.
        pinta();
      });
    });

    $('#zoom').addEventListener('input', function () {
      document.documentElement.style.setProperty('--zoom', this.value);
      $('#zoom-valor').textContent = Math.round(this.value * 100) + ' %';
    });

    $('#imprimeix').addEventListener('click', function () { window.print(); });
    $('#desa-fitxer').addEventListener('click', desaFitxer);
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
      });
    });

    /* Ctrl/Cmd+G: una altra tria de preguntes. */
    document.addEventListener('keydown', function (ev) {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'g') {
        ev.preventDefault();
        estat.spec.llavor = window.Atzar.novaLlavor();
        sincronitzaControls();
        recomposa();
      }
    });

    window.addEventListener('resize', comptaPagines);
  }

  function arrenca() {
    var teInicials = recuperaInicials();
    var delHash = llegeixDelHash();
    sincronitzaControls();
    lliga();
    if (teInicials && !delHash) $('#inicials-nota').hidden = false;
    if (delHash && estat.editat) { pinta(); } else { recomposa(); }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrenca);
  } else {
    arrenca();
  }
})();
