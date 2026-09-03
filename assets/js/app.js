/* ===========================================================================
   Controlador de l'eina.

   Un sol estat, una sola funció que pinta. Cada canvi toca l'estat i torna a
   pintar; no hi ha actualitzacions parcials del full perquè el document és
   prou petit i així el que es veu no pot divergir mai del que s'imprimirà.
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

  /* ---------------------------------------------------------------- estat */
  var estat = {
    sabers: [],
    fixades: {},
    preguntes: [],
    avisos: [],
    vista: 'prova',
    spec: {
      nombre: 14,
      perfil: 'minims',
      pes: 'hores',
      ordre: 'curriculum',
      punts: 10,
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
      espai: 24,
      paper: 'quadricula',
      figures: true,
      encapcalaments: true,
      mostraPunts: true
    }
  };

  /* --------------------------------------------- el subtítol es dedueix sol */
  function subtitolAutomatic() {
    var cursos = {};
    estat.sabers.forEach(function (id) { cursos[id.slice(0, 4)] = true; });
    var noms = MAPA.cursos
      .filter(function (c) { return cursos[c.id]; })
      .map(function (c) { return c.titol; });
    if (!noms.length) return '';
    return 'Continguts de ' + (noms.length === 2
      ? noms[0] + ' i ' + noms[1] : noms[0]);
  }

  /* --------------------------------------------------------- composició */
  function recomposa(conservaFixades) {
    var fixes = [];
    if (conservaFixades) {
      fixes = estat.preguntes.filter(function (q) { return estat.fixades[q.itemId]; });
    } else {
      estat.fixades = {};
    }

    var r = window.Composa.composa({
      sabers: estat.sabers,
      nombre: estat.spec.nombre,
      perfil: estat.spec.perfil,
      pes: estat.spec.pes,
      ordre: estat.spec.ordre,
      punts: estat.spec.punts,
      llavor: estat.spec.llavor
    }, banc, sabersPerId);

    if (fixes.length) {
      // Les fixades es queden; la resta s'omple amb la composició nova,
      // saltant els ítems que ja hi són.
      var ja = {};
      fixes.forEach(function (q) { ja[q.itemId] = true; });
      var noves = r.preguntes.filter(function (q) { return !ja[q.itemId]; });
      var junt = fixes.concat(noves).slice(0, estat.spec.nombre);
      var punts = window.Composa.puntua(junt.length, estat.spec.punts);
      junt.forEach(function (q, i) { q.punts = punts[i]; });
      r.preguntes = junt;
    }

    estat.preguntes = r.preguntes;
    estat.avisos = r.avisos;
    estat.cfg.llavor = estat.spec.llavor;
    if (!estat.cfg.subtitol) estat.cfg.subtitolAuto = subtitolAutomatic();
    pinta();
    desaAlHash();
  }

  /** Canvia una pregunta per una altra del mateix saber. */
  function reemplaca(i) {
    var q = estat.preguntes[i];
    var saber = sabersPerId[q.saberId];
    if (!saber) return;
    var usats = {};
    estat.preguntes.forEach(function (x) { usats[x.itemId] = true; });
    var pares = {};
    estat.preguntes.forEach(function (x) {
      var it = banc[x.itemId];
      if (it && x !== q) pares[it.full + '-' + it.ex] = true;
    });

    var atzar = new window.Atzar(estat.spec.llavor + '|canvi|' + q.itemId + '|' + Date.now());
    var lliures = saber.items.map(function (id) { return banc[id]; })
      .filter(function (it) { return it && !usats[it.id] && !pares[it.full + '-' + it.ex]; });
    if (!lliures.length) {
      lliures = saber.items.map(function (id) { return banc[id]; })
        .filter(function (it) { return it && !usats[it.id]; });
    }
    if (!lliures.length) return;

    var pes = window.Composa.PERFILS[estat.spec.perfil];
    var nou = atzar.triaPonderada(lliures, function (it) { return pes[it.dif] || 0.1; });
    delete estat.fixades[q.itemId];
    q.itemId = nou.id;
    pinta();
  }

  function mou(i, delta) {
    var j = i + delta;
    if (j < 0 || j >= estat.preguntes.length) return;
    var t = estat.preguntes[i];
    estat.preguntes[i] = estat.preguntes[j];
    estat.preguntes[j] = t;
    var punts = window.Composa.puntua(estat.preguntes.length, estat.spec.punts);
    estat.preguntes.forEach(function (q, k) { q.punts = punts[k]; });
    pinta();
  }

  function treu(i) {
    delete estat.fixades[estat.preguntes[i].itemId];
    estat.preguntes.splice(i, 1);
    var punts = window.Composa.puntua(estat.preguntes.length, estat.spec.punts);
    estat.preguntes.forEach(function (q, k) { q.punts = punts[k]; });
    pinta();
  }

  /* --------------------------------------------------- preguntes pròpies
     Cinc sabers de 1r d'ESO (arrel quadrada, elements geomètrics, magnituds
     i unitats, llenguatge algebraic i comprensió lectora) no tenen cap
     pregunta al banc. Sense això, l'única sortida seria escriure l'examen
     a mà en un altre programa. La pregunta pròpia entra al banc en memòria
     amb la mateixa forma que les altres, i així la resta de l'eina —
     impressió, clau de correcció, punts — no se n'ha d'assabentar. */
  var comptadorPropies = 0;

  function afegeixPropia(enunciat, solucio) {
    enunciat = (enunciat || '').trim();
    if (!enunciat) return false;
    var id = 'propia-' + (++comptadorPropies);
    banc[id] = {
      id: id, full: 0, bloc: 'propia', blocTitol: 'Pregunta pròpia',
      ex: 1000 + comptadorPropies, ap: '', dif: 2,
      cap: '', enunciat: enunciat, figura: null, nota: '',
      sol: btoa(unescape(encodeURIComponent(JSON.stringify({
        r: (solucio || '').trim() || '(sense solució introduïda)', p: []
      })))),
      sabers: []
    };
    // Les pròpies queden fixades: si no, el següent "Altres preguntes" les
    // esborraria i el professor perdria el que ha escrit.
    estat.preguntes.push({ itemId: id, saberId: null, punts: 0 });
    estat.fixades[id] = true;
    var punts = window.Composa.puntua(estat.preguntes.length, estat.spec.punts);
    estat.preguntes.forEach(function (q, k) { q.punts = punts[k]; });
    pinta();
    return true;
  }

  /* ------------------------------------------------------- arbre curricular */
  function pintaRail() {
    var filtre = ($('#cerca').value || '').toLowerCase().trim();
    var html = '';

    MAPA.cursos.forEach(function (curs) {
      var maxHores = Math.max.apply(null, curs.sabers.map(function (s) { return s.hores; }));
      var triats = curs.sabers.filter(function (s) {
        return estat.sabers.indexOf(s.id) >= 0;
      }).length;

      var cos = '', sentitActual = null, teContingut = false;

      curs.sabers.forEach(function (s) {
        if (filtre && (s.titol + ' ' + s.detall).toLowerCase().indexOf(filtre) < 0) return;
        teContingut = true;
        if (s.sentit !== sentitActual) {
          sentitActual = s.sentit;
          cos += '<div class="sentit-tit">' + esc(s.sentitTitol) + '</div>';
        }
        var buit = !s.items.length;
        var marcat = estat.sabers.indexOf(s.id) >= 0;
        cos += '<label class="saber' + (buit ? ' buit' : '') + '">' +
          '<input type="checkbox" data-saber="' + esc(s.id) + '"' +
            (marcat ? ' checked' : '') + (buit ? ' disabled' : '') + '>' +
          '<div class="saber-cos">' +
            '<div class="saber-tit">' + esc(s.titol) + '</div>' +
            '<div class="saber-meta">' +
              '<span class="hores" style="width:' +
                Math.round(3 + (s.hores / maxHores) * 34) + 'px" ' +
                'title="' + s.hores + ' hores de classe"></span>' +
              '<span>' + s.hores + ' h</span>' +
              '<span>·</span>' +
              '<span>' + (buit ? 'sense preguntes al banc' : s.items.length + ' preguntes') + '</span>' +
            '</div>' +
          '</div>' +
        '</label>';
      });

      if (!teContingut) return;
      html += '<section class="curs">' +
        '<button class="curs-cap" data-curs="' + esc(curs.id) + '">' +
          '<strong>' + esc(curs.titol) + '</strong>' +
          '<span class="compte">' + triats + ' / ' + curs.sabers.length + '</span>' +
        '</button>' +
        '<div class="sentit">' + cos + '</div>' +
      '</section>';
    });

    $('#rail-cos').innerHTML = html || '<p class="buida">Cap contingut coincideix amb la cerca.</p>';
  }

  /* ------------------------------------------------- llista de preguntes */

  /** LaTeX -> text pla, prou aproximat per reconèixer la pregunta d'un cop d'ull. */
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
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 90);
  }

  function pintaLlista() {
    var h = '';
    if (!estat.preguntes.length) {
      h = '<p class="buida">La prova és buida. Marca continguts al panell ' +
          'de l\'esquerra i les preguntes apareixeran aquí.</p>';
    } else {
      estat.preguntes.forEach(function (q, i) {
        var it = banc[q.itemId];
        var saber = sabersPerId[q.saberId];
        if (!it) return;
        // Un enunciat que és tot LaTeX es queda en no res si se n'esborra
        // la fórmula, així que es fa servir l'encapçalament de l'exercici
        // (que sempre és text) i el LaTeX s'aproxima en text pla.
        var text = resumeix(it.cap) || resumeix(it.enunciat) || it.id;
        h += '<div class="q' + (estat.fixades[q.itemId] ? ' marcada' : '') + '">' +
          '<span class="q-num">' + (i + 1) + '</span>' +
          '<span class="q-cos">' +
            '<span class="q-tit" title="' + esc(it.id) + '">' + esc(text || it.id) + '</span>' +
            '<span class="q-saber">' +
              esc(saber ? saber.titol : it.blocTitol) +
              (saber ? ' · nivell ' + it.dif : '') + '</span>' +
          '</span>' +
          '<span class="q-eines">' +
            '<button data-fixa="' + i + '" title="Conserva-la en tornar a generar">' +
              (estat.fixades[q.itemId] ? '★' : '☆') + '</button>' +
            '<button data-canvia="' + i + '" title="Canvia-la per una altra">⟳</button>' +
            '<button data-amunt="' + i + '" title="Amunt">↑</button>' +
            '<button data-avall="' + i + '" title="Avall">↓</button>' +
            '<button data-treu="' + i + '" title="Treu-la">✕</button>' +
          '</span>' +
        '</div>';
      });
    }
    estat.avisos.forEach(function (a) {
      h += '<p class="avis">' + esc(a) + '</p>';
    });
    $('#llista').innerHTML = h;
  }

  /* --------------------------------------------------------------- el full */
  function pintaFull() {
    var cfg = Object.create(estat.cfg);
    cfg.subtitol = estat.cfg.subtitol || subtitolAutomatic();

    var dades = { cfg: cfg, preguntes: estat.preguntes, sabers: estat.sabers };
    var html = estat.vista === 'clau' ? window.Full.clau(dades, banc, sabersPerId)
             : estat.vista === 'pla'  ? window.Full.pla(dades, banc, sabersPerId, MAPA)
             :                          window.Full.prova(dades, banc, sabersPerId);

    var full = $('#full');
    full.innerHTML = html;
    full.style.setProperty('--separacio', (estat.cfg.espai > 0 ? 5 : 4) + 'mm');

    if (window.renderMathInElement) {
      try {
        window.renderMathInElement(full, {
          delimiters: [{ left: '$', right: '$', display: false }],
          throwOnError: false
        });
      } catch (e) { /* si KaTeX falla, es veu el LaTeX en cru: prou avís */ }
    }
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
        m: estat.cfg.model
      };
      history.replaceState(null, '', '#' + btoa(unescape(encodeURIComponent(JSON.stringify(d)))));
    } catch (e) { /* si el navegador no ho permet, l'eina segueix funcionant */ }
  }

  function llegeixDelHash() {
    if (!location.hash || location.hash.length < 3) return false;
    try {
      var d = JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(1)))));
      estat.sabers = (d.s || []).filter(function (id) { return sabersPerId[id]; });
      if (d.n) estat.spec.nombre = d.n;
      if (d.p) estat.spec.perfil = d.p;
      if (d.w) estat.spec.pes = d.w;
      if (d.o) estat.spec.ordre = d.o;
      if (d.t) estat.spec.punts = d.t;
      if (d.l) estat.spec.llavor = d.l;
      if (d.e != null) estat.cfg.espai = d.e;
      if (d.q) estat.cfg.paper = d.q;
      if (d.m) estat.cfg.model = d.m;
      return true;
    } catch (e) { return false; }
  }

  /* ------------------------------------------------------------- impressió */
  function imprimeix() {
    // El navegador imprimeix el que hi ha a #full en aquell moment, així que
    // n'hi ha prou de canviar de vista, imprimir i tornar on érem.
    window.print();
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
  }

  function lliga() {
    /* rail: marcar sabers */
    $('#rail-cos').addEventListener('change', function (ev) {
      var id = ev.target.dataset && ev.target.dataset.saber;
      if (!id) return;
      var i = estat.sabers.indexOf(id);
      if (ev.target.checked && i < 0) estat.sabers.push(id);
      if (!ev.target.checked && i >= 0) estat.sabers.splice(i, 1);
      estat.sabers.sort(function (a, b) {
        return ordreSabers.indexOf(a) - ordreSabers.indexOf(b);
      });
      recomposa(true);
    });

    /* rail: clicar el curs marca o desmarca tot el que té preguntes */
    $('#rail-cos').addEventListener('click', function (ev) {
      var b = ev.target.closest('[data-curs]');
      if (!b) return;
      var curs = MAPA.cursos.filter(function (c) { return c.id === b.dataset.curs; })[0];
      var amb = curs.sabers.filter(function (s) { return s.items.length; });
      var totsMarcats = amb.every(function (s) { return estat.sabers.indexOf(s.id) >= 0; });
      amb.forEach(function (s) {
        var i = estat.sabers.indexOf(s.id);
        if (totsMarcats && i >= 0) estat.sabers.splice(i, 1);
        if (!totsMarcats && i < 0) estat.sabers.push(s.id);
      });
      estat.sabers.sort(function (a, b2) {
        return ordreSabers.indexOf(a) - ordreSabers.indexOf(b2);
      });
      recomposa(false);
    });

    $('#cerca').addEventListener('input', pintaRail);

    /* llista de preguntes */
    $('#llista').addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
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
      }
    });

    /* controls de composició */
    $('#nombre').addEventListener('input', function () {
      estat.spec.nombre = +this.value;
      $('#nombre-valor').textContent = this.value;
    });
    $('#nombre').addEventListener('change', function () { recomposa(true); });

    $('#punts').addEventListener('change', function () {
      estat.spec.punts = Math.max(0.25, +this.value || 10);
      var punts = window.Composa.puntua(estat.preguntes.length, estat.spec.punts);
      estat.preguntes.forEach(function (q, i) { q.punts = punts[i]; });
      pinta(); desaAlHash();
    });

    document.querySelectorAll('[data-perfil]').forEach(function (b) {
      b.addEventListener('click', function () {
        estat.spec.perfil = b.dataset.perfil;
        sincronitzaControls(); recomposa(true);
      });
    });
    document.querySelectorAll('[data-pes]').forEach(function (b) {
      b.addEventListener('click', function () {
        estat.spec.pes = b.dataset.pes;
        sincronitzaControls(); recomposa(true);
      });
    });
    $('#ordre').addEventListener('change', function () {
      estat.spec.ordre = this.value; recomposa(true);
    });

    $('#altra').addEventListener('click', function () {
      estat.spec.llavor = window.Atzar.novaLlavor();
      sincronitzaControls();
      recomposa(true);
    });

    /* format del full */
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
        estat.cfg[k] = this.checked; pintaFull();
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
      estat.cfg.instruccions = this.value; pintaFull();
    });

    /* pestanyes del full */
    document.querySelectorAll('[data-doc]').forEach(function (b) {
      b.addEventListener('click', function () {
        estat.vista = b.dataset.doc;
        document.querySelectorAll('[data-doc]').forEach(function (x) {
          x.setAttribute('aria-selected', x === b);
        });
        $('#imprimeix').textContent = 'Imprimeix ' + (
          estat.vista === 'clau' ? 'la clau' :
          estat.vista === 'pla' ? 'el pla' : 'la prova');
        pintaFull();
      });
    });

    /* zoom */
    $('#zoom').addEventListener('input', function () {
      document.documentElement.style.setProperty('--zoom', this.value);
      $('#zoom-valor').textContent = Math.round(this.value * 100) + ' %';
    });

    $('#imprimeix').addEventListener('click', imprimeix);

    /* pregunta pròpia */
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

    /* vistes en pantalla estreta */
    document.querySelectorAll('[data-mobil]').forEach(function (b) {
      b.addEventListener('click', function () {
        $('#app').dataset.vista = b.dataset.mobil;
        document.querySelectorAll('[data-mobil]').forEach(function (x) {
          x.setAttribute('aria-selected', x === b);
        });
      });
    });

    /* dreceres: Ctrl/Cmd+P imprimeix el que hi ha a la vista activa */
    document.addEventListener('keydown', function (ev) {
      if ((ev.ctrlKey || ev.metaKey) && ev.key === 'g') {
        ev.preventDefault();
        estat.spec.llavor = window.Atzar.novaLlavor();
        sincronitzaControls(); recomposa(true);
      }
    });
  }

  /* ---------------------------------------------------------------- arrenca */
  function arrenca() {
    var delHash = llegeixDelHash();
    if (!delHash) {
      // Estat inicial útil: tot 2n d'ESO amb preguntes. És el cas més
      // freqüent (alumne de 3r que recupera 2n) i evita la pantalla buida.
      var segon = MAPA.cursos.filter(function (c) { return c.id === '2eso'; })[0];
      estat.sabers = segon.sabers
        .filter(function (s) { return s.items.length; })
        .map(function (s) { return s.id; });
      // Una pregunta per contingut marcat: així la prova d'entrada els cobreix
      // tots i el professor va traient, que és més ràpid que anar afegint.
      estat.spec.nombre = Math.max(6, Math.min(24, estat.sabers.length));
    }
    sincronitzaControls();
    lliga();
    recomposa(false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', arrenca);
  } else {
    arrenca();
  }
})();
