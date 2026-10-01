/* ===========================================================================
   Construcció dels documents imprimibles.

   Tres sortides, un sol full A4 a pantalla:
     - prova:  el que rep l'alumne
     - clau:   el que es queda el professor per corregir
     - pla:    què ha de repassar l'alumne, amb el material del centre

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
     (vegeu `.ed:empty::before` i imprimir.css). A la clau i al pla, text. */
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

  function peu(cfg, quin) {
    return '<footer class="doc-peu">' +
      '<span>' + esc(cfg.titol) + (quin ? ' · ' + esc(quin) : '') + '</span>' +
      '<span>Codi ' + esc(cfg.llavor) +
        (cfg.model ? ' · model ' + esc(cfg.model) : '') + '</span>' +
    '</footer>';
  }

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

         ⟳ recorre TOTES les preguntes del contingut en un ordre fix: abans
         de repetir-ne cap les hauràs vistes totes. ↻ és un altre eix i
         només surt quan la pregunta ve d'un generador propi: uns altres
         nombres sense sortir del tipus. */
      b('seguent', '\u27f3', 'Una altra pregunta d\'aquest contingut', !saber) +
      (it && it.gen
        ? b('nombres', '\u21bb', 'Uns altres nombres, la mateixa pregunta') : '') +
      b('treu', '\u2715', 'Treu-la de la prova') +
    '</div>';
  }

  /**
   * Encapçalament, enunciat i figura d'un ítem, tal com surten al paper.
   * `capCal` i `figuraCal` són els dos passamans que impedeixen que un
   * interruptor buidi una pregunta: l'encapçalament es conserva quan
   * l'enunciat és una dada solta ("$3850$"), i la figura quan la pregunta
   * ÉS el dibuix. Els declara el generador; per als ítems de `repas` els
   * dedueix el compilador. La prova i els exercicis de pràctica del pla
   * passen tots dos per aquí.
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
    if (instr) {
      h += '<div class="doc-instruccions' + (cfg.editable ? ' ed' : '') + '"' +
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
      return h + peu(cfg, 'prova');
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
    return h + peu(cfg, 'prova');
  }

  /* ----------------------------------------------------------------- clau */
  function clau(estat, banc, sabersPerId) {
    var cfg = estat.cfg, p = estat.preguntes;

    var h = capcalera(cfg, 'Full de correcció · no s\'ha de repartir a l\'alumnat');

    if (!p.length) return h + peu(cfg, 'correcció');

    h += '<table class="clau-taula"><thead><tr>' +
           '<th class="n">#</th><th>Solució i passos</th>' +
           '<th class="contingut">Contingut avaluat</th><th class="p">Punts</th>' +
         '</tr></thead><tbody>';

    p.forEach(function (q, i) {
      var it = banc[q.itemId];
      if (!it) return;
      var s = solucio(it);
      var saber = sabersPerId[q.saberId];
      h += '<tr>' +
             '<td class="n">' + etiquetaDe(estat, i) + '</td>' +
             '<td>' +
               '<div class="clau-resposta">' + s.r + '</div>' +
               (s.p && s.p.length
                 ? '<ol class="clau-passos">' + s.p.map(function (x) {
                     return '<li>' + x + '</li>'; }).join('') + '</ol>'
                 : '') +
             '</td>' +
             '<td>' + esc(saber ? saber.titol : '') +
               '<div class="clau-origen">' + esc(it.blocTitol) +
               ' · ' + esc(it.id) + ' · nivell ' + it.nivell + '</div></td>' +
             '<td class="p">' + num(q.punts) + '</td>' +
           '</tr>';
    });
    h += '</tbody></table>';

    /* Graella de correcció: una fila per posar la puntuació de cada
       pregunta mentre es corregeix, sense haver de buscar-la a la taula. */
    h += '<h2 class="graella-tit">Graella de correcció</h2>' +
         '<table class="graella"><thead><tr><th>Pregunta</th>';
    p.forEach(function (_, i) { h += '<th>' + etiquetaDe(estat, i) + '</th>'; });
    h += '<th>Total</th></tr></thead><tbody><tr><th>Sobre</th>';
    p.forEach(function (q) { h += '<td>' + num(q.punts) + '</td>'; });
    h += '<td>' + num(p.reduce(function (a, q) { return a + q.punts; }, 0)) +
         '</td></tr><tr><th>Obté</th>';
    p.forEach(function () { h += '<td class="buida"></td>'; });
    h += '<td class="buida"></td></tr></tbody></table>';

    return h + peu(cfg, 'correcció');
  }

  /**
   * «Llibre de 2n d'ESO, UD5 «Geometria»: activitats 2, 6». Si el llibre
   * d'aquell curs no és al mapa (el de 3r, ara mateix) o no en té la
   * unitat, se'n diu el número igualment: una referència sense títol val
   * més que cap, que és el que sortia abans. Una unitat sencera diu «totes
   * les activitats» en comptes d'enumerar-ne catorze.
   */
  function referenciaLlibre(r, llibre, nomCurs) {
    var u = llibre && llibre.units.filter(function (x) { return x.num === r.ud; })[0];
    return 'Llibre de ' + nomCurs + ', UD' + r.ud + (u ? ' «' + u.title + '»' : '') +
      ': ' + (r.act && r.act.length ? 'activitats ' + r.act.join(', ') : 'totes les activitats');
  }

  /* ------------------------------------------------------------- pla de repàs
     El mateix conjunt de sabers que ha generat la prova genera el que
     l'alumne ha d'estudiar. És l'única manera que el full de repàs i
     l'examen no se separin amb el temps. */
  function pla(estat, banc, sabersPerId, mapa) {
    var cfg = estat.cfg;
    var ids = estat.sabers.filter(function (id) { return sabersPerId[id]; });
    var practica = estat.practica || {};

    var h = capcalera(cfg, 'Què has de repassar per a la prova') +
            '<div class="doc-dades"><div><span class="etq">Nom i cognoms</span>' +
            '<div class="linia">' + esc(cfg.alumne || '') + '</div></div>' +
            '<div class="ample"><span class="etq">Dia de la prova</span>' +
            '<div class="linia">' + esc(dataLlarga(cfg.data)) + '</div></div></div>';

    if (!ids.length) {
      return h + '<p class="doc-buit">Marca continguts a ' +
             'l\'esquerra per generar el pla.</p>' + peu(cfg, 'pla de repàs');
    }

    var ambPractica = ids.some(function (id) { return (practica[id] || []).length; });
    h += '<div class="doc-instruccions pla-intro"><p>' +
         (ambPractica
           ? 'Per a cada contingut: repassa\'l al llibre i fes els exercicis de ' +
             'pràctica a la llibreta, amb tot el procés. ' +
             (cfg.solucionsPla
               ? 'Les solucions són al final: mira-les quan hagis acabat ' +
                 'l\'exercici, no abans.'
               : 'Porta\'ls fets el dia de la prova.')
           : 'Repassa cada contingut al llibre i fes-ne les activitats indicades.') +
         '</p><p>Marca la casella de cada contingut quan el tinguis repassat.</p></div>';

    var perCurs = {};
    ids.forEach(function (id) {
      var s = sabersPerId[id];
      var curs = id.slice(0, 4);
      (perCurs[curs] = perCurs[curs] || []).push(s);
    });

    /* El nom del curs surt del currículum i no del llibre: el llibre de 3r
       no és al mapa compilat, i el títol sortia com a «Matemàtiques de
       3eso». */
    var titolCurs = {};
    mapa.cursos.forEach(function (c) { titolCurs[c.id] = c.titol; });

    /* Els exercicis es numeren seguits de dalt a baix del document: les
       solucions del final hi fan referència pel número. */
    var numero = 0, solucions = [];

    Object.keys(perCurs).sort().forEach(function (curs) {
      h += '<section class="pla-sec partible"><h2>Matemàtiques de ' +
           esc(titolCurs[curs] || curs) + '</h2><ul class="partible">';

      perCurs[curs].forEach(function (s) {
        var refs = [];
        s.llibre.forEach(function (r) {
          refs.push(referenciaLlibre(r, mapa.llibre[r.curs], titolCurs[r.curs] || r.curs));
        });
        s.bogdan.forEach(function (b) {
          refs.push('Apunts «' + b.titol + '» (Mates amb Bogdan) — ampliació');
        });

        var exercicis = (practica[s.id] || []).filter(function (id) { return banc[id]; });
        h += '<li class="pla-saber' + (exercicis.length ? ' partible' : '') + '">' +
             '<div class="pla-cap">' +
               '<span class="casella" aria-hidden="true"></span>' +
               '<strong>' + esc(s.titol) + '.</strong> ' + esc(s.detall) +
               (refs.length ? '<div class="font">' + refs.map(esc).join(' · ') + '</div>' : '') +
             '</div>';

        if (exercicis.length) {
          h += '<div class="practica partible">';
          exercicis.forEach(function (id) {
            var it = banc[id];
            numero++;
            solucions.push({ n: numero, r: solucio(it).r });
            h += '<div class="exercici"><span class="exercici-num">' + numero + '.</span>' +
                 '<div class="exercici-cos">' + cosItem(it, cfg) + '</div></div>';
          });
          h += '</div>';
        }
        h += '</li>';
      });
      h += '</ul></section>';
    });

    if (cfg.solucionsPla && solucions.length) {
      h += '<section class="pla-sec solucions partible"><h2>Solucions dels exercicis</h2>' +
           '<ol class="solucions-llista">' +
           solucions.map(function (x) {
             return '<li value="' + x.n + '">' + x.r + '</li>';
           }).join('') +
           '</ol></section>';
    }

    return h + peu(cfg, 'pla de repàs');
  }

  glob.Full = { prova: prova, clau: clau, pla: pla, solucio: solucio,
                esc: esc, num: num, textMates: textMates };
})(window);
