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
      data: new Date().toISOString().slice(0, 10),
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
      mostraPunts: false
    }
  };

  /* Els valors inicials: com vols trobar l'eina cada vegada que l'obris en
     aquest navegador. Es desa tota la configuració menys el que és d'una
     prova concreta —l'alumne, el grup, la data, el model i el codi de la
     tria—, perquè aquests han de tornar a començar de zero cada cop.

     Els continguts marcats sí que s'hi desen: qui recupera 2n d'ESO ho fa
     moltes vegades seguides i tornar-los a marcar cada cop és feina inútil. */
  var CAMPS_INICIALS = ['centre', 'titol', 'instruccions', 'espai', 'paper',
                        'figures', 'encapcalaments', 'mostraPunts'];
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
    // Amb punts fixats a mà la suma pot no quadrar amb el total demanat.
    // No es corregeix sol: mana el que ha escrit el professor, i l'avís ho diu.
    estat.desquadrat = Math.abs(suma - estat.spec.punts) > 0.001 ? suma : null;
  }

  /**
   * Genera una llista nova. Les preguntes pròpies i les fixades amb ☆ es
   * conserven sempre: són l'única cosa de la prova que el professor ha
   * escrit o triat a mà i regenerar-les seria destruir feina.
   */
  function recomposa() {
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

  function reemplaca(i) {
    var q = estat.preguntes[i];
    var saber = sabersPerId[q.saberId];
    if (!saber) return;                       // pregunta pròpia: no té banc

    var usats = {}, pares = {};
    estat.preguntes.forEach(function (x) {
      usats[x.itemId] = true;
      var it = banc[x.itemId];
      if (it && x !== q) pares[it.full + '-' + it.ex] = true;
    });

    var lliures = saber.items.map(function (id) { return banc[id]; })
      .filter(function (it) { return it && !usats[it.id] && !pares[it.full + '-' + it.ex]; });
    if (!lliures.length) {
      lliures = saber.items.map(function (id) { return banc[id]; })
        .filter(function (it) { return it && !usats[it.id]; });
    }
    if (!lliures.length) return;

    // El `|| PERFILS.minims` és imprescindible: amb un perfil desconegut
    // (un enllaç vell) això petava amb "Cannot read properties of undefined".
    var pes = window.Composa.PERFILS[estat.spec.perfil] || window.Composa.PERFILS.minims;
    var atzar = new window.Atzar(estat.spec.llavor + '|canvi|' + q.itemId + '|' + Date.now());
    var nou = atzar.triaPonderada(lliures, function (it) { return pes[it.nivell] || 0.02; });

    delete estat.fixades[q.itemId];
    q.itemId = nou.id;
    estat.editat = true;
    pinta();
    desaAlHash();
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
    // El comptador ha de seguir la realitat: si no, el següent toc a
    // qualsevol control feia tornar les preguntes tretes.
    estat.spec.nombre = estat.preguntes.length;
    estat.editat = true;
    reparteixPunts();
    sincronitzaControls();
    pinta();
    desaAlHash();
  }

  /**
   * Una pregunta més d'un contingut concret, sense refer la prova. És el
   * control que faltava per construir la recuperació sobre els criteris que
   * l'alumne no va assolir, en comptes de sobre un total global.
   */
  function afegeixDelSaber(saberId) {
    var saber = sabersPerId[saberId];
    if (!saber || !saber.items.length) return;

    var usats = {}, pares = {};
    estat.preguntes.forEach(function (x) {
      usats[x.itemId] = true;
      var it = banc[x.itemId];
      if (it) pares[it.full + '-' + it.ex] = true;
    });

    var lliures = saber.items.map(function (id) { return banc[id]; })
      .filter(function (it) { return it && !usats[it.id] && !pares[it.full + '-' + it.ex]; });
    if (!lliures.length) {
      lliures = saber.items.map(function (id) { return banc[id]; })
        .filter(function (it) { return it && !usats[it.id]; });
    }
    if (!lliures.length) {
      estat.avisos = ['Ja hi són totes les preguntes de «' + saber.titol + '».'];
      pintaLlista();
      return;
    }

    var pes = window.Composa.PERFILS[estat.spec.perfil] || window.Composa.PERFILS.minims;
    var atzar = new window.Atzar(estat.spec.llavor + '|mes|' + saberId + '|' + Date.now());
    var nou = atzar.triaPonderada(lliures, function (it) { return pes[it.nivell] || 0.02; });

    // Si el contingut no estava marcat, es marca: el pla de repàs ha
    // d'incloure el que s'avalua.
    if (estat.sabers.indexOf(saberId) < 0) marca([saberId], true);

    estat.preguntes.push({ itemId: nou.id, saberId: saberId, punts: 0 });
    estat.spec.nombre = estat.preguntes.length;
    estat.editat = true;
    reparteixPunts();
    sincronitzaControls();
    pinta();
    desaAlHash();
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
    estat.spec.nombre = estat.preguntes.length;
    estat.editat = true;
    reparteixPunts();
    sincronitzaControls();
    pinta();
    desaAlHash();
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
    var idFocus = focus && focus.dataset ? focus.dataset.saber : null;

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

    if (idFocus) {
      var tornar = $('[data-saber="' + idFocus + '"]');
      if (tornar) tornar.focus();
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

  function num(n) { return String(n).replace('.', ','); }

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
          '<span class="q-num">' + (i + 1) + '</span>' +
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
            '<button data-canvia="' + i + '" title="Canvia-la per una altra"' +
              (saber ? '' : ' disabled') + '>⟳</button>' +
            '<button data-amunt="' + i + '" title="Amunt"' + (i ? '' : ' disabled') + '>↑</button>' +
            '<button data-avall="' + i + '" title="Avall"' +
              (i === estat.preguntes.length - 1 ? ' disabled' : '') + '>↓</button>' +
            '<button data-treu="' + i + '" title="Treu-la">✕</button>' +
          '</span>' +
        '</div>';
      });
    }
    if (estat.desquadrat != null) {
      h += '<p class="avis">La prova suma ' + num(estat.desquadrat) + ' punts i no ' +
           num(estat.spec.punts) + ': hi ha punts fixats a mà. ' +
           '<button class="mini" id="allibera">Torna a repartir-los</button></p>';
    }
    estat.avisos.forEach(function (a) { h += '<p class="avis">' + esc(a) + '</p>'; });
    $('#llista').innerHTML = h;
  }

  /* --------------------------------------------------------------- el full */
  function pintaFull() {
    var cfg = Object.create(estat.cfg);
    cfg.subtitol = estat.cfg.subtitol || subtitolAutomatic();

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
    var util = 297 - 18 - 16;                       // A4 menys els marges de @page
    var mm = $('#full').scrollHeight / (96 / 25.4); // px de CSS a mm
    var n = Math.max(1, Math.ceil(mm / util));
    $('#pagines').textContent = n + (n === 1 ? ' pàgina' : ' pàgines');
  }

  function pinta() {
    pintaRail();
    pintaLlista();
    pintaFull();
    $('#imprimeix').disabled = !estat.preguntes.length;
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
  function fitxerDeLaProva() {
    var u = location.href;
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
      'l\u2019adre\u00e7a; la prova es munta al navegador quan l\u2019obres. Si mous ' +
      'la carpeta de l\u2019eina, l\u2019enlla\u00e7 deixa de funcionar: apunta al lloc ' +
      'on hi havia <code>index.html</code>.</p>' +
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
    $('#nombre').value = estat.spec.nombre;
    $('#nombre-valor').textContent = estat.spec.nombre;
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
    $('#rail-cos').addEventListener('change', function (ev) {
      var id = ev.target.dataset && ev.target.dataset.saber;
      if (!id) return;
      marca([id], ev.target.checked);
      recomposa();
    });

    $('#rail-cos').addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      var filtre = plana($('#cerca').value.trim());

      if (b.dataset.mes) { afegeixDelSaber(b.dataset.mes); return; }
      if (b.dataset.menys) { treuDelSaber(b.dataset.menys); return; }

      if (b.dataset.curs) {
        var curs = MAPA.cursos.filter(function (c) { return c.id === b.dataset.curs; })[0];
        // Només el que es veu: amb un filtre actiu, «Tot el curs» marcava
        // també els continguts que el filtre amagava.
        var llista = visibles(curs, filtre).map(function (s) { return s.id; });
        marca(llista, b.getAttribute('aria-pressed') !== 'true');
        recomposa();
      } else if (b.dataset.sentit) {
        var parts = b.dataset.sentit.split('|');
        var c2 = MAPA.cursos.filter(function (c) { return c.id === parts[0]; })[0];
        var ids = visibles(c2, filtre)
          .filter(function (s) { return s.sentit === parts[1]; })
          .map(function (s) { return s.id; });
        marca(ids, b.getAttribute('aria-pressed') !== 'true');
        recomposa();
      }
    });

    $('#cerca').addEventListener('input', pintaRail);

    $('#llista').addEventListener('change', function (ev) {
      var i = ev.target.dataset && ev.target.dataset.punts;
      if (i == null) return;
      var v = parseFloat(ev.target.value);
      estat.preguntes[+i].fix = isNaN(v) ? null : Math.max(0, Math.round(v * 4) / 4);
      estat.editat = true;
      reparteixPunts();
      pinta();
      desaAlHash();
    });

    $('#llista').addEventListener('click', function (ev) {
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
      if (d.canvia != null) reemplaca(+d.canvia);
      else if (d.amunt != null) mou(+d.amunt, -1);
      else if (d.avall != null) mou(+d.avall, 1);
      else if (d.treu != null) treu(+d.treu);
      else if (d.fixa != null) {
        var q = estat.preguntes[+d.fixa];
        if (estat.fixades[q.itemId]) delete estat.fixades[q.itemId];
        else estat.fixades[q.itemId] = true;
        pintaLlista();
        desaAlHash();
      }
    });

    $('#nombre').addEventListener('input', function () {
      estat.spec.nombre = +this.value;
      $('#nombre-valor').textContent = this.value;
    });
    $('#nombre').addEventListener('change', recomposa);

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
      recomposa();
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
    ['centre', 'titol', 'alumne', 'grup', 'data', 'model'].forEach(function (k) {
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
        pintaFull();
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
