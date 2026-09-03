/* ===========================================================================
   Atzar amb llavor.

   Per què no Math.random(): un examen ha de ser reproduïble. Si el
   professor tanca la pestanya i la torna a obrir amb el mateix enllaç, ha
   de sortir exactament el mateix examen; i els models A, B i C d'una
   mateixa prova són la mateixa especificació amb llavors diferents.

   mulberry32 sobre un hash de 32 bits del text de la llavor. No és
   criptografia, és repetibilitat.
   =========================================================================== */
(function (glob) {
  'use strict';

  function hash32(text) {
    var h = 2166136261 >>> 0;               // FNV-1a
    for (var i = 0; i < text.length; i++) {
      h ^= text.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function Atzar(llavor) {
    var a = hash32(String(llavor)) || 1;
    this.seguent = function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /** Enter dins [0, n). */
  Atzar.prototype.enter = function (n) {
    return Math.floor(this.seguent() * n);
  };

  /** Fisher–Yates sobre una còpia; l'original no es toca. */
  Atzar.prototype.barreja = function (llista) {
    var c = llista.slice();
    for (var i = c.length - 1; i > 0; i--) {
      var j = this.enter(i + 1);
      var t = c[i]; c[i] = c[j]; c[j] = t;
    }
    return c;
  };

  /**
   * Tria un element segons un pes per element. Els pesos no cal que sumin 1.
   * Si tots els pesos són 0 es tria uniformement, perquè un perfil de
   * dificultat que no case amb cap ítem no ha de deixar la pregunta buida.
   */
  Atzar.prototype.triaPonderada = function (llista, pes) {
    if (!llista.length) return null;
    var total = 0, i;
    for (i = 0; i < llista.length; i++) total += Math.max(0, pes(llista[i]));
    if (total <= 0) return llista[this.enter(llista.length)];
    var r = this.seguent() * total;
    for (i = 0; i < llista.length; i++) {
      r -= Math.max(0, pes(llista[i]));
      if (r <= 0) return llista[i];
    }
    return llista[llista.length - 1];
  };

  /** Llavor curta i llegible: la que es veu al peu de l'examen. */
  Atzar.novaLlavor = function () {
    var lletres = '23456789ABCDEFGHJKMNPQRSTVWXYZ';   // sense I, L, O, U
    var s = '';
    for (var i = 0; i < 5; i++) {
      s += lletres[Math.floor(Math.random() * lletres.length)];
    }
    return s;
  };

  glob.Atzar = Atzar;
})(window);
