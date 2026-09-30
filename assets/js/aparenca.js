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
  }
  aplica();

  document.addEventListener('DOMContentLoaded', function () {
    Array.prototype.forEach.call(document.querySelectorAll('[data-aparenca]'), function (b) {
      b.addEventListener('click', function () {
        mode = b.dataset.aparenca;
        try { localStorage.setItem(CLAU, mode); } catch (e) { /* res */ }
        aplica();
      });
    });
    aplica();
  });
})();
