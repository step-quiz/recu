/* ===========================================================================
   Aparença: clar, fosc o el del sistema.

   Es carrega al <head>, abans de pintar res: així la pàgina no fa un
   parpelleig del tema equivocat en obrir-se. És la mateixa peça que el banc
   de preguntes de 2n de batxillerat.

   «Sistema» (per defecte) no posa cap atribut: el full d'estil segueix
   `prefers-color-scheme`, i canvia sol si el sistema operatiu canvia.
   «Clar» i «Fosc» posen `data-theme` a <html> i manen sobre el sistema.

   És una preferència de qui fa les proves, no part de la prova: no va a
   l'adreça, sinó a la memòria del navegador, si la hi deixa. El full A4 no
   canvia mai de color: és paper.
   =========================================================================== */
(function () {
  'use strict';

  var CLAU = 'recuperacio-eso:aparenca';
  var ATRIBUT = { clar: 'light', fosc: 'dark', sistema: null };
  var mode = 'sistema';
  /* Un sol botó que va passant pels tres modes: tres botons per a una
     preferència que es toca un cop a la vida omplien la barra. */
  var CICLE = ['sistema', 'clar', 'fosc'];
  var ICONA = { sistema: '\u25d0', clar: '\u2600', fosc: '\u263e' };
  var NOM = { sistema: 'la del sistema', clar: 'clara', fosc: 'fosca' };

  try {
    var m = localStorage.getItem(CLAU);
    if (Object.prototype.hasOwnProperty.call(ATRIBUT, m)) mode = m;
  } catch (e) { /* sense memòria del navegador: sistema */ }

  function aplica() {
    var arrel = document.documentElement;
    if (ATRIBUT[mode]) arrel.setAttribute('data-theme', ATRIBUT[mode]);
    else arrel.removeAttribute('data-theme');
    Array.prototype.forEach.call(document.querySelectorAll('[data-aparenca]'), function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.aparenca === mode));
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-aparenca-cicle]'), function (b) {
      b.textContent = ICONA[mode];
      var seguent = CICLE[(CICLE.indexOf(mode) + 1) % CICLE.length];
      b.title = 'Aparença: ' + NOM[mode] + '. Clica per passar a ' + NOM[seguent] + '.';
      b.setAttribute('aria-label', b.title);
    });
  }

  function tria(m) {
    mode = m;
    try { localStorage.setItem(CLAU, mode); } catch (e) { /* res */ }
    aplica();
  }
  aplica();

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-aparenca]'), function (b) {
      b.addEventListener('click', function () { tria(b.dataset.aparenca); });
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-aparenca-cicle]'), function (b) {
      b.addEventListener('click', function () {
        tria(CICLE[(CICLE.indexOf(mode) + 1) % CICLE.length]);
      });
    });
    aplica();
  });
})();
