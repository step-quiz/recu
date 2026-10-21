/* ===========================================================================
   Construcció dels documents imprimibles.

   Dues sortides, un sol full A4 a pantalla:
     - prova:  el que rep l'alumne
     - clau:   el que es queda el professor per corregir

   El que es veu a pantalla és exactament el que surt per la impressora,
   perquè no hi ha una segona maquetació: `imprimir.css` apaga la interfície
   i deixa aquest mateix DOM.
   =========================================================================== */
(function (glob) {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /**
   * Ordres d'espaiat de LaTeX escrites FORA dels dòlars. 28 resolucions del
   * banc de `repas` separen dos càlculs amb «$…$ \quad i \quad $…$»: KaTeX
   * només compon el que hi ha entre dòlars, i al full de correcció sortia
   * «\quad» en lletra. Fora de les fórmules es converteixen en espais.
   */
  function textMates(t) {
    if (t == null) return t;
    return String(t).split(/(\$[^$]*\$)/).map(function (tros, k) {
      if (k % 2) return tros;                       // dins dels dòlars: intacte
      return tros.replace(/\\qquad\b/g, '\u2003\u2003').replace(/\\quad\b/g, '\u2003')
                 .replace(/\\[,;:]/g, ' ');
    }).join('');
  }

  function solucio(item) {
    try {
      var s = JSON.parse(decodeURIComponent(escape(atob(item.sol))));
      return { r: textMates(s.r), p: (s.p || []).map(textMates) };
    }
    catch (e) { return { r: '(no disponible)', p: [] }; }
  }

  function dataLlarga(iso) {
    if (!iso) return '';
    var m = ['gener', 'febrer', 'març', 'abril', 'maig', 'juny', 'juliol',
             'agost', 'setembre', 'octubre', 'novembre', 'desembre'];
    var p = iso.split('-');
    if (p.length !== 3) return iso;
    return Number(p[2]) + ' de ' + m[Number(p[1]) - 1] + ' de ' + p[0];
  }

  function num(n) {
    return String(n).replace('.', ',');
  }

  /* ------------------------------------------------------------ capçalera
     A la vista «Prova», la capçalera s'edita directament damunt del full:
     cada text és un `contenteditable` amb `data-camp`, i app.js en recull
     el valor. Un camp buit mostra una pista en gris que no s'imprimeix
     (vegeu `.ed:empty::before` i imprimir.css). A la clau, text. */
  function ed(cfg, camp, valor, pista) {
    if (!cfg.editable) return esc(valor);
    return '<span class="ed" contenteditable="plaintext-only" spellcheck="false" ' +
           'data-camp="' + camp + '" data-pista="' + esc(pista) + '" ' +
           'title="Clica per editar">' + esc(valor) + '</span>';
  }

  function capcalera(cfg, subtitol, subtitolEditable) {
    var centre = cfg.centre || cfg.editable;
    return '' +
      '<header class="doc-cap">' +
        (centre ? '<div class="centre">' + ed(cfg, 'centre', cfg.centre, 'Centre o departament') + '</div>' : '') +
        '<h1>' + ed(cfg, 'titol', cfg.titol, 'Títol de la prova') + '</h1>' +
        (subtitol
          ? '<p class="subtitol">' + (subtitolEditable
              ? ed(cfg, 'subtitol', subtitol, 'Subtítol')
              : esc(subtitol)) + '</p>'
          : '') +
      '</header>';
  }

  function dades(cfg) {
    /* La data no és un text lliure: clicar-la obre el calendari del
       navegador (un <input type=date> invisible), i al paper surt en
       lletra, «1 d'octubre de 2026». */
    var data = esc(dataLlarga(cfg.data));
    if (cfg.editable) {
      data = '<span class="ed ed-data" data-tria-data tabindex="0" role="button" ' +
               'data-pista="Data" title="Clica per triar la data">' + data + '</span>' +
             '<input type="date" class="tria-data" value="' + esc(cfg.data) + '" ' +
               'tabindex="-1" aria-label="Data de la prova">';
    }
    return '' +
      '<div class="doc-dades">' +
        '<div><span class="etq">Nom i cognoms</span><div class="linia">' +
          ed(cfg, 'alumne', cfg.alumne || '', 'Clica per escriure el nom (o deixa-ho en blanc)') +
          '</div></div>' +
        '<div class="estret"><span class="etq">Grup</span>' +
          '<div class="linia">' + ed(cfg, 'grup', cfg.grup || '', '3r A') + '</div></div>' +
        '<div><span class="etq">Data</span><div class="linia">' + data + '</div></div>' +
        '<div class="estret"><span class="etq">Qualificació</span>' +
          '<div class="linia"></div></div>' +
      '</div>';
  }

  /* Icones de les accions d'una pregunta, en SVG i no en caràcters: les
     fletxes circulars (⟳ ↻) no deien què feien i cada tipografia les
     dibuixa diferent. `currentColor`: agafen el color del botó.
       seguent  dues fletxes que es creuen: canvia-la per una altra
       nombres  un dau: uns altres nombres a l'atzar
       apartat  un «+»: un apartat més, b), c)… */
  function svg(cos) {
    return '<svg class="icona" viewBox="0 0 16 16" aria-hidden="true" fill="none" ' +
           'stroke="currentColor" stroke-width="1.6" stroke-linecap="round" ' +
           'stroke-linejoin="round">' + cos + '</svg>';
  }
  var ICONA = {
    seguent: svg('<path d="M2.5 5.5h10M10 3l2.5 2.5L10 8M13.5 10.5h-10M6 8l-2.5 2.5L6 13"/>'),
    nombres: svg('<rect x="2.5" y="2.5" width="11" height="11" rx="2.5"/>' +
                 '<g fill="currentColor" stroke="none"><circle cx="5.6" cy="5.6" r="1.15"/>' +
                 '<circle cx="8" cy="8" r="1.15"/><circle cx="10.4" cy="10.4" r="1.15"/></g>'),
    apartat: svg('<path d="M8 3v10M3 8h10"/>'),
    treu: svg('<path d="M4 4l8 8M12 4l-8 8"/>')
  };

  /* ------------------------------------------------ eines sobre el full
     Els `data-*` són els mateixos que fa servir la llista del panell, de
     manera que el controlador té un sol gestor de clics per als dos llocs. */
  function eines(i, q, total, saber, cfg, it) {
    var b = function (attr, txt, titol, off) {
      return '<button data-' + attr + '="' + i + '" title="' + esc(titol) + '"' +
             (off ? ' disabled' : '') + '>' + txt + '</button>';
    };
    /* Sense etiqueta de contingut: el panell de la dreta ja diu de quin
       saber és cada pregunta i amb quin nivell, i repetir-ho damunt del
       full trepitjava l'enunciat. */
    return '<div class="pregunta-eines" contenteditable="false" ' +
           'title="' + esc(saber ? saber.titol : 'Pregunta pròpia') + '">' +
      /* Només les tres accions que es fan mirant la pregunta: canviar-la,
         canviar-ne els nombres i treure-la. Fixar-la, el nivell, els punts
         i l'ordre són al panell de la dreta, clicant la pregunta: set
         botons a cada marge eren més soroll que ajuda.

         «Una altra» recorre TOTES les preguntes del contingut en un ordre
         fix: abans de repetir-ne cap les hauràs vistes totes. El dau és un
         altre eix i només surt quan la pregunta ve d'un generador propi:
         uns altres nombres sense sortir del tipus. El «+» hi afegeix un
         apartat: amb material propi, la mateixa pregunta amb uns altres
         nombres; amb el banc de `repas`, un altre apartat del mateix
         exercici (f1-24a → f1-24b). Cal consigna, que és el que uneix els
         apartats; ho decideix `cfg.potApartat`, a app.js. */
      b('seguent', ICONA.seguent, 'Una altra pregunta d\'aquest contingut', !saber) +
      (it && it.gen
        ? b('nombres', ICONA.nombres, 'Uns altres nombres, la mateixa pregunta') : '') +
      (cfg.potApartat && cfg.potApartat(i)
        ? b('apartat', ICONA.apartat, 'Un apartat més: ' + (it.gen
            ? 'la mateixa pregunta amb uns altres nombres'
            : 'un altre apartat del mateix exercici')) : '') +
      b('treu', ICONA.treu, 'Treu-la de la prova') +
    '</div>';
  }

  /**
   * Encapçalament, enunciat i figura d'un ítem, tal com surten al paper.
   * `capCal` i `figuraCal` són els dos passamans que impedeixen que un
   * interruptor buidi una pregunta: l'encapçalament es conserva quan
   * l'enunciat és una dada solta ("$3850$"), i la figura quan la pregunta
   * ÉS el dibuix. Els declara el generador; per als ítems de `repas` els
   * dedueix el compilador.
   */
  function cosItem(it, cfg) {
    return (it.cap && (cfg.encapcalaments || it.capCal)
              ? '<span class="encap">' + textMates(it.cap) + '</span>' : '') +
           textMates(it.enunciat) +
           (it.figura && (cfg.figures || it.figuraCal)
              ? '<div class="figura-cont">' + it.figura + '</div>' : '');
  }

  /**
   * Els grups d'apartats (vegeu `Composa.agrupa`) i l'etiqueta de cada
   * pregunta: «6», o «6a» i «6b». Si no n'hi ha, cada pregunta va sola.
   */
  function grupsDe(estat) {
    return estat.agrupacio ? estat.agrupacio.grups
      : estat.preguntes.map(function (_, i) { return [i]; });
  }
  function etiquetaDe(estat, i) {
    return estat.agrupacio ? estat.agrupacio.etiquetes[i] : String(i + 1);
  }

  /* ---------------------------------------------------------------- prova */
  function prova(estat, banc, sabersPerId) {
    var cfg = estat.cfg, p = estat.preguntes;
    var total = p.reduce(function (a, q) { return a + q.punts; }, 0);

    var h = capcalera(cfg, cfg.subtitol, true) + dades(cfg);

    /* Un sol bloc amb `white-space: pre-line`, i no un <p> per línia:
       així es pot editar damunt del full com un text qualsevol. Buit, només
       hi és a pantalla (per poder-hi escriure) i no s'imprimeix. */
    var instr = (cfg.instruccions || '').replace(/\n{2,}/g, '\n').trim();
    /* Només «Instruccions:», sense res més: es veu a pantalla (per poder-hi
       escriure) però no s'imprimeix, perquè una caixa buida no diu res. */
    var nomesTitol = /^instruccions\s*:?$/i.test(instr);
    if (instr) {
      h += '<div class="doc-instruccions' + (cfg.editable ? ' ed' : '') +
           (nomesTitol ? ' no-imprimeix' : '') + '"' +
           (cfg.editable ? ' contenteditable="plaintext-only" spellcheck="false" ' +
             'data-camp="instruccions" data-pista="Instruccions" title="Clica per editar"' : '') +
           '>' + esc(instr) + '</div>';
    } else if (cfg.editable) {
      h += '<div class="doc-instruccions ed buit" contenteditable="plaintext-only" ' +
           'spellcheck="false" data-camp="instruccions" ' +
           'data-pista="Instruccions per a l\'alumne (opcional)"></div>';
    }

    if (!p.length) {
      h += '<p class="doc-buit">Encara no hi ha cap ' +
           'pregunta. Marca continguts a l\'esquerra.</p>';
      return h;
    }

    var espai = cfg.espai > 0
      ? '<div class="espai ' + esc(cfg.paper) + '" style="--espai:' + cfg.espai + 'mm"></div>'
      : '';
    var punts = function (v) {
      return cfg.mostraPunts ? '<span class="pregunta-punts">' + num(v) + ' p</span>' : '';
    };
    /* Els controls van damunt del full i no en un panell a part: per
       decidir si una pregunta et va bé, l'has d'estar mirant.
       `imprimir.css` els amaga sempre, i en pantalla estreta els amaga el
       CSS i els torna a treure el panell, on sí que es poden tocar amb el
       dit. */
    var einesDe = function (i) {
      var q = p[i];
      return cfg.editable
        ? eines(i, q, p.length, sabersPerId[q.saberId], cfg, banc[q.itemId]) : '';
    };

    h += '<ol class="preguntes">';
    grupsDe(estat).forEach(function (g, n) {
      g = g.filter(function (i) { return banc[p[i].itemId]; });
      if (!g.length) return;
      if (g.length === 1) {
        var q = p[g[0]], it = banc[q.itemId];
        h += '<li class="pregunta">' +
               '<div class="pregunta-cap">' +
                 '<span class="pregunta-num">' + (n + 1) + '.</span>' +
                 '<div class="pregunta-cos">' + cosItem(it, cfg) + '</div>' +
                 punts(q.punts) +
               '</div>' +
               einesDe(g[0]) + espai +
             '</li>';
        return;
      }
      /* Apartats d'un mateix exercici: la consigna un sol cop i, a sota,
         a), b)… cadascun amb el seu espai i les seves eines. La consigna
         surt si l'opció d'enunciats generals és activa o si algun apartat
         la necessita (`capCal`). */
      var primer = banc[p[g[0]].itemId];
      var ambCap = cfg.encapcalaments ||
        g.some(function (i) { return banc[p[i].itemId].capCal; });
      h += '<li class="pregunta pregunta-grup partible">' +
             '<div class="pregunta-cap grup-cap">' +
               '<span class="pregunta-num">' + (n + 1) + '.</span>' +
               '<div class="pregunta-cos">' +
                 (ambCap ? '<span class="encap">' + textMates(primer.cap) + '</span>' : '') +
               '</div>' +
             '</div>';
      g.forEach(function (i, k) {
        var q = p[i], it = banc[q.itemId];
        h += '<div class="apartat">' +
               '<div class="pregunta-cap">' +
                 '<span class="apartat-lletra">' + 'abcdefghijklmnopqrstuvwxyz'.charAt(k) + ')</span>' +
                 '<div class="pregunta-cos">' + textMates(it.enunciat) +
                   (it.figura && (cfg.figures || it.figuraCal)
                     ? '<div class="figura-cont">' + it.figura + '</div>' : '') +
                 '</div>' +
                 punts(q.punts) +
               '</div>' +
               einesDe(i) + espai +
             '</div>';
      });
      h += '</li>';
    });
    h += '</ol>';

    if (cfg.mostraPunts) {
      h += '<p class="doc-total">Total: ' + num(total) + ' punts</p>';
    }
    /* Sense peu: ni el títol repetit ni el codi. La prova queda desada a
       l'adreça de la pàgina. */
    return h;
  }

  /* ----------------------------------------------------------------- clau */
  function clau(estat, banc, sabersPerId) {
    var cfg = estat.cfg, p = estat.preguntes;

    var h = capcalera(cfg, 'Full de correcció');

    if (!p.length) return h;

    /* Cada pregunta, una taula de quatre files, i un espai entre taules:
         1. «Enunciat»
         2. l'enunciat, copiat i numerat igual que a la prova (1., 2. a)…)
         3. «Solució» | «Passos»
         4. la solució (30 %) | els passos, a), b), c)… (70 %)
       Els punts ja són a la graella. En imprimir, una taula no es parteix
       entre dues pàgines (imprimir.css). */
    var numero = function (n, cos) {
      return '<div class="clau-num"><b>' + n + '</b><div>' + cos + '</div></div>';
    };
    var taula = function (i, enunciat) {
      var s = solucio(banc[p[i].itemId]);
      return '<table class="clau-taula"><colgroup><col class="sol"><col></colgroup><tbody>' +
               '<tr><th colspan="2">Enunciat</th></tr>' +
               '<tr><td colspan="2" class="clau-enunciat">' + enunciat + '</td></tr>' +
               '<tr><th>Solució</th><th>Passos</th></tr>' +
               '<tr>' +
                 '<td class="clau-resposta">' + s.r + '</td>' +
                 '<td>' +
                   (s.p && s.p.length
                     ? '<ol class="clau-passos">' + s.p.map(function (x) {
                         return '<li>' + x + '</li>'; }).join('') + '</ol>'
                     : '') +
                 '</td>' +
               '</tr>' +
             '</tbody></table>';
    };

    grupsDe(estat).forEach(function (g, n) {
      g = g.filter(function (i) { return banc[p[i].itemId]; });
      if (!g.length) return;
      if (g.length === 1) {
        h += taula(g[0], numero((n + 1) + '.', cosItem(banc[p[g[0]].itemId], cfg)));
        return;
      }
      /* Un grup d'apartats: una taula per apartat. La consigna va a
         l'enunciat del primer («2. Resol… a) …»); els altres només porten
         la seva lletra. */
      var primer = banc[p[g[0]].itemId];
      var ambCap = cfg.encapcalaments ||
        g.some(function (i) { return banc[p[i].itemId].capCal; });
      g.forEach(function (i, k) {
        var it = banc[p[i].itemId];
        var apartat = numero('abcdefghijklmnopqrstuvwxyz'.charAt(k) + ')',
          textMates(it.enunciat) +
          (it.figura && (cfg.figures || it.figuraCal)
            ? '<div class="figura-cont">' + it.figura + '</div>' : ''));
        h += taula(i, k
          ? apartat
          : numero((n + 1) + '.', (ambCap ? '<div class="clau-consigna">' +
              textMates(primer.cap) + '</div>' : '') + apartat));
      });
    });

    /* Graella de correcció: una fila per posar la puntuació de cada
       pregunta mentre es corregeix, sense haver de buscar-la a la taula.
       Sempre en una pàgina nova (`break-before`, a imprimir.css): així es
       pot tenir al costat de les solucions mentre es corregeix. */
    h += '<h2 class="graella-tit">Graella de correcció</h2>' +
         '<table class="graella"><thead><tr><th>Pregunta</th>';
    p.forEach(function (_, i) { h += '<th>' + etiquetaDe(estat, i) + '</th>'; });
    h += '<th>Total</th></tr></thead><tbody><tr><th>Sobre</th>';
    p.forEach(function (q) { h += '<td>' + num(q.punts) + '</td>'; });
    h += '<td>' + num(p.reduce(function (a, q) { return a + q.punts; }, 0)) +
         '</td></tr><tr><th>Obté</th>';
    p.forEach(function () { h += '<td class="buida"></td>'; });
    h += '<td class="buida"></td></tr></tbody></table>';

    return h;
  }

  glob.Full = { prova: prova, clau: clau, solucio: solucio,
                esc: esc, num: num, textMates: textMates, ICONA: ICONA };
})(window);
