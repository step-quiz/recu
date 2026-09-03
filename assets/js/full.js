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

  function solucio(item) {
    try { return JSON.parse(decodeURIComponent(escape(atob(item.sol)))); }
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

  /* ------------------------------------------------------------ capçalera */
  function capcalera(cfg, subtitol) {
    return '' +
      '<header class="doc-cap">' +
        (cfg.centre ? '<div class="centre">' + esc(cfg.centre) + '</div>' : '') +
        '<h1>' + esc(cfg.titol) + '</h1>' +
        (subtitol ? '<p class="subtitol">' + esc(subtitol) + '</p>' : '') +
      '</header>';
  }

  function dades(cfg) {
    return '' +
      '<div class="doc-dades">' +
        '<div><span class="etq">Nom i cognoms</span><div class="linia">' +
          esc(cfg.alumne || '') + '</div></div>' +
        '<div style="min-width:38mm"><span class="etq">Grup</span>' +
          '<div class="linia">' + esc(cfg.grup || '') + '</div></div>' +
        '<div><span class="etq">Data</span><div class="linia">' +
          esc(dataLlarga(cfg.data)) + '</div></div>' +
        '<div style="min-width:38mm"><span class="etq">Qualificació</span>' +
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

  /* ---------------------------------------------------------------- prova */
  function prova(estat, banc, sabersPerId) {
    var cfg = estat.cfg, p = estat.preguntes;
    var total = p.reduce(function (a, q) { return a + q.punts; }, 0);

    var h = capcalera(cfg, cfg.subtitol) + dades(cfg);

    if (cfg.instruccions) {
      h += '<div class="doc-instruccions">' +
             cfg.instruccions.split('\n').filter(Boolean)
               .map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') +
           '</div>';
    }

    if (!p.length) {
      h += '<p style="color:#666;font-style:italic">Encara no hi ha cap ' +
           'pregunta. Marca continguts a l\'esquerra.</p>';
      return h + peu(cfg, 'prova');
    }

    h += '<ol class="preguntes" style="list-style:none;margin:0;padding:0">';
    p.forEach(function (q, i) {
      var it = banc[q.itemId];
      if (!it) return;
      h += '<li class="pregunta">' +
             '<div class="pregunta-cap">' +
               '<span class="pregunta-num">' + (i + 1) + '.</span>' +
               '<div class="pregunta-cos">' +
                 (it.cap && cfg.encapcalaments
                   ? '<span class="encap">' + it.cap + '</span>' : '') +
                 it.enunciat +
                 (it.figura && cfg.figures
                   ? '<div class="figura-cont">' + it.figura + '</div>' : '') +
               '</div>' +
               (cfg.mostraPunts
                 ? '<span class="pregunta-punts">' + num(q.punts) + ' p</span>' : '') +
             '</div>' +
             (cfg.espai > 0
               ? '<div class="espai ' + esc(cfg.paper) + '" style="--espai:' +
                 cfg.espai + 'mm"></div>' : '') +
           '</li>';
    });
    h += '</ol>';

    if (cfg.mostraPunts) {
      h += '<p style="font-family:system-ui;font-size:9pt;color:#444;' +
           'text-align:right;margin-top:4mm">Total: ' + num(total) + ' punts</p>';
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
           '<th style="width:38mm">Contingut avaluat</th><th class="p">Punts</th>' +
         '</tr></thead><tbody>';

    p.forEach(function (q, i) {
      var it = banc[q.itemId];
      if (!it) return;
      var s = solucio(it);
      var saber = sabersPerId[q.saberId];
      h += '<tr>' +
             '<td class="n">' + (i + 1) + '</td>' +
             '<td>' +
               '<div class="clau-resposta">' + s.r + '</div>' +
               (s.p && s.p.length
                 ? '<ol class="clau-passos">' + s.p.map(function (x) {
                     return '<li>' + x + '</li>'; }).join('') + '</ol>'
                 : '') +
             '</td>' +
             '<td>' + esc(saber ? saber.titol : '') +
               '<div class="clau-origen">' + esc(it.blocTitol) +
               ' · ' + esc(it.id) + ' · nivell ' + it.dif + '</div></td>' +
             '<td class="p">' + num(q.punts) + '</td>' +
           '</tr>';
    });
    h += '</tbody></table>';

    /* Graella de correcció: una fila per posar la puntuació de cada
       pregunta mentre es corregeix, sense haver de buscar-la a la taula. */
    h += '<h2 style="font-size:10.5pt;margin:6mm 0 0">Graella de correcció</h2>' +
         '<table class="graella"><thead><tr><th>Pregunta</th>';
    p.forEach(function (_, i) { h += '<th>' + (i + 1) + '</th>'; });
    h += '<th>Total</th></tr></thead><tbody><tr><th>Sobre</th>';
    p.forEach(function (q) { h += '<td>' + num(q.punts) + '</td>'; });
    h += '<td>' + num(p.reduce(function (a, q) { return a + q.punts; }, 0)) +
         '</td></tr><tr><th>Obté</th>';
    p.forEach(function () { h += '<td class="buida"></td>'; });
    h += '<td class="buida"></td></tr></tbody></table>';

    return h + peu(cfg, 'correcció');
  }

  /* ------------------------------------------------------------- pla de repàs
     El mateix conjunt de sabers que ha generat la prova genera el que
     l'alumne ha d'estudiar. És l'única manera que el full de repàs i
     l'examen no se separin amb el temps. */
  function pla(estat, banc, sabersPerId, mapa) {
    var cfg = estat.cfg;
    var ids = estat.sabers.filter(function (id) { return sabersPerId[id]; });

    var h = capcalera(cfg, 'Què has de repassar per a la prova') +
            '<div class="doc-dades"><div><span class="etq">Nom i cognoms</span>' +
            '<div class="linia">' + esc(cfg.alumne || '') + '</div></div>' +
            '<div style="min-width:45mm"><span class="etq">Dia de la prova</span>' +
            '<div class="linia">' + esc(dataLlarga(cfg.data)) + '</div></div></div>';

    if (!ids.length) {
      return h + '<p style="color:#666;font-style:italic">Marca continguts a ' +
             'l\'esquerra per generar el pla.</p>' + peu(cfg, 'pla de repàs');
    }

    var perCurs = {};
    ids.forEach(function (id) {
      var s = sabersPerId[id];
      var curs = id.slice(0, 4);
      (perCurs[curs] = perCurs[curs] || []).push(s);
    });

    Object.keys(perCurs).sort().forEach(function (curs) {
      var etiqueta = (mapa.llibre[curs] && mapa.llibre[curs].label) || curs;
      h += '<section class="pla-sec"><h2>Matemàtiques de ' + esc(etiqueta) + '</h2><ul>';

      perCurs[curs].forEach(function (s) {
        h += '<li><strong>' + esc(s.titol) + '.</strong> ' + esc(s.detall);

        var refs = [];
        s.llibre.forEach(function (r) {
          var llibre = mapa.llibre[r.curs];
          if (!llibre) return;
          var u = llibre.units.filter(function (x) { return x.num === r.ud; })[0];
          if (!u) return;
          var acts = r.act
            ? u.activities.filter(function (a) { return r.act.indexOf(a.num) >= 0; })
            : u.activities;
          if (!acts.length) return;
          refs.push('Llibre de ' + llibre.label + ', UD' + u.num + ' «' + u.title +
                    '»: activitats ' + acts.map(function (a) { return a.num; }).join(', '));
        });
        s.bogdan.forEach(function (b) {
          refs.push('Apunts «' + b.titol + '» (Mates amb Bogdan) — ampliació');
        });

        if (refs.length) {
          h += '<div class="font">' + refs.map(esc).join(' · ') + '</div>';
        }
        h += '</li>';
      });
      h += '</ul></section>';
    });

    return h + peu(cfg, 'pla de repàs');
  }

  glob.Full = { prova: prova, clau: clau, pla: pla, solucio: solucio, esc: esc };
})(window);
