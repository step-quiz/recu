/* ===========================================================================
   Generadors d'ítems propis.

   Aquest fitxer és l'ÚNIC origen del material que no ve del banc de `repas`.
   El fa servir el navegador, per donar «uns altres nombres» a una pregunta
   sense sortir del seu tipus, i el fa servir la compilació amb Node
   (`tools/genera.js`), per omplir el catàleg de `banc.js`. Abans això
   estava escrit en Python i el navegador no hi tenia accés; tenir-ho dues
   vegades hauria acabat divergint.

   Cada generador rep un Atzar i torna un ítem. Mateixa llavor, mateix ítem.

   Criteri, que ve del departament després de revisar proves impreses:
     - nombres PETITS, enunciats CURTS, resultats NETS;
     - res d'arrels no exactes donades com a dada.

   Un generador declara `nivell`: el nivell que tenen TOTES les seves
   variants. `tools/genera.js --comprova` ho verifica sobre 200 tirades
   passant-les pel mateix mesurador que fa servir el compilador; si un
   generador no és estable, salta.
   =========================================================================== */
(function (glob) {
  'use strict';

  /* ------------------------------------------------------------ utilitats */
  function divisors(n) {
    var d = [];
    for (var i = 1; i * i <= n; i++) {
      if (n % i === 0) { d.push(i); if (i !== n / i) d.push(n / i); }
    }
    return d.sort(function (a, b) { return a - b; });
  }

  function esPrimer(n) {
    if (n < 2) return false;
    for (var i = 2; i * i <= n; i++) if (n % i === 0) return false;
    return true;
  }

  function factoritza(n) {
    var f = [], d = 2;
    while (d * d <= n) {
      var e = 0;
      while (n % d === 0) { e++; n /= d; }
      if (e) f.push([d, e]);
      d++;
    }
    if (n > 1) f.push([n, 1]);
    return f;
  }

  function texFactors(f) {
    return f.map(function (p) {
      return p[1] > 1 ? p[0] + '^{' + p[1] + '}' : String(p[0]);
    }).join(' \\cdot ');
  }

  function mcd(a, b) { while (b) { var t = b; b = a % b; a = t; } return a; }

  /**
   * Llista amb conjunció, per posar DINS del mode matemàtic. La `i` va en
   * \text{}: si no, KaTeX la compon en cursiva i sembla una variable.
   */
  function llista(v) {
    if (v.length === 1) return String(v[0]);
    return v.slice(0, -1).join(', ') + ' \\text{ i } ' + v[v.length - 1];
  }

  /** `l'abril` però `el dilluns`: article definit segons la inicial. */
  function ambArticle(mot) {
    return /^[aeiouhàèéíòóú]/i.test(mot) ? "l'" + mot : 'el ' + mot;
  }

  /** Plural només quan toca: «1 triangle», «4 triangles». */
  function plural(n, singular, plural_) {
    return n + ' ' + (n === 1 ? singular : (plural_ || singular + 's'));
  }

  /**
   * Un sumand amb el signe ben escrit: `+ 5`, `- 3`, i mai `+ -3`. Els
   * passos dels moviments al pla en necessiten a cada coordenada.
   */
  function sumand(x) {
    return x < 0 ? '- ' + (-x) : '+ ' + x;
  }

  /** Un minuend negatiu va entre parèntesis; un de positiu, no. */
  function restand(x) {
    return x < 0 ? '(' + x + ')' : String(x);
  }

  /** 3.5 -> "3{,}5" (la coma decimal, en LaTeX) */
  function coma(x) {
    return String(Math.round(x * 1e6) / 1e6).replace('.', '{,}');
  }

  function sumaXifres(n) {
    return String(n).split('').reduce(function (a, c) { return a + (+c); }, 0);
  }

  /* -------------------------------------------------------------- figures */
  function svgAngle(graus, etiqueta) {
    var rad = graus * Math.PI / 180, r = 46, x0 = 30, y0 = 130;
    var x2 = x0 + 150 * Math.cos(rad), y2 = y0 - 150 * Math.sin(rad);
    var bx = x0 + r * Math.cos(rad), by = y0 - r * Math.sin(rad);
    var gran = graus > 180 ? 1 : 0;
    return '<svg class="figura" viewBox="0 0 220 160" role="img" ' +
      'xmlns="http://www.w3.org/2000/svg"><title>Angle de ' + etiqueta + '.</title>' +
      '<line x1="' + x0 + '" y1="' + y0 + '" x2="' + (x0 + 150) + '" y2="' + y0 +
      '" stroke="currentColor" stroke-width="2"/>' +
      '<line x1="' + x0 + '" y1="' + y0 + '" x2="' + x2.toFixed(1) + '" y2="' +
      y2.toFixed(1) + '" stroke="currentColor" stroke-width="2"/>' +
      '<path d="M' + (x0 + r) + ',' + y0 + ' A' + r + ',' + r + ' 0 ' + gran +
      ',0 ' + bx.toFixed(1) + ',' + by.toFixed(1) +
      '" fill="none" stroke="var(--fig-marca)" stroke-width="2"/>' +
      '<text x="' + (x0 + 62) + '" y="' + (y0 - 14) +
      '" class="fig-etq petita">' + etiqueta + '</text></svg>';
  }

  var COS_RECTES = {
    'paral·leles': '<line x1="20" y1="45" x2="200" y2="75" stroke="currentColor" ' +
      'stroke-width="2"/><line x1="20" y1="95" x2="200" y2="125" ' +
      'stroke="currentColor" stroke-width="2"/>',
    'perpendiculars': '<line x1="30" y1="30" x2="190" y2="130" stroke="currentColor" ' +
      'stroke-width="2"/><line x1="180" y1="35" x2="42" y2="127" ' +
      'stroke="currentColor" stroke-width="2"/><rect x="103" y="72" width="14" ' +
      'height="14" fill="none" stroke="var(--fig-marca)" stroke-width="2" ' +
      'transform="rotate(32 110 79)"/>',
    'secants': '<line x1="25" y1="40" x2="195" y2="120" stroke="currentColor" ' +
      'stroke-width="2"/><line x1="40" y1="130" x2="185" y2="35" ' +
      'stroke="currentColor" stroke-width="2"/>'
  };

  function svgRectes(pos) {
    return '<svg class="figura" viewBox="0 0 220 160" role="img" ' +
      'xmlns="http://www.w3.org/2000/svg"><title>Dues rectes en un pla.</title>' +
      COS_RECTES[pos] + '</svg>';
  }

  function svgRectangle(a, b) {
    return '<svg class="figura" viewBox="0 0 230 150" role="img" ' +
      'xmlns="http://www.w3.org/2000/svg"><title>Rectangle de ' + a + ' per ' +
      b + ' cm.</title><rect x="35" y="30" width="160" height="85" ' +
      'fill="var(--fig-plena)" stroke="currentColor" stroke-width="2"/>' +
      '<text x="115" y="24" text-anchor="middle" class="fig-etq petita">' + a +
      ' cm</text><text x="27" y="77" text-anchor="end" class="fig-etq petita">' +
      b + ' cm</text></svg>';
  }

  var SVG_CERCLE = '<svg class="figura" viewBox="0 0 200 180" role="img" ' +
    'xmlns="http://www.w3.org/2000/svg"><title>Circumferència amb tres ' +
    'segments marcats: a, b i c.</title><circle cx="100" cy="90" r="70" ' +
    'fill="var(--fig-plena)" stroke="currentColor" stroke-width="2"/>' +
    '<line x1="100" y1="90" x2="170" y2="90" stroke="var(--fig-marca)" ' +
    'stroke-width="2.5"/><line x1="30" y1="90" x2="170" y2="90" ' +
    'stroke="currentColor" stroke-width="1" stroke-dasharray="4 3"/>' +
    '<line x1="51" y1="41" x2="149" y2="41" stroke="var(--fig-marca)" ' +
    'stroke-width="2.5"/><circle cx="100" cy="90" r="3" fill="currentColor"/>' +
    '<text x="137" y="84" class="fig-etq petita">a</text>' +
    '<text x="60" y="105" class="fig-etq petita">b</text>' +
    '<text x="96" y="34" class="fig-etq petita">c</text></svg>';

  /* ------------------------------------------------------------- registre */
  // Sense prototip: l'id pot venir de l'adreça, i «constructor» no ha de
  // trobar la funció d'Object.
  var G = [], PER_ID = Object.create(null);

  /**
   * Dues declaracions que abans es deduïen amb una regex sobre la llargada
   * de l'enunciat, i que es deduïen DUES vegades (a compila.py i a app.js)
   * amb resultats que discrepaven en el 12 % de les variants:
   *
   *   capCal     l'enunciat no s'aguanta sense l'encapçalament. Passa quan
   *              l'enunciat és una dada solta: «$3850$» sense «Fes la
   *              descomposició en factors primers» no és una pregunta.
   *   figuraCal  la pregunta ÉS el dibuix. Apagar «Inclou les figures»
   *              deixaria un enunciat que no es pot respondre.
   *
   * Ho declara el generador, que és qui ho sap. Per als 592 ítems de
   * `repas`, que no tenen generador, ho segueix deduint `compila.py`.
   */
  function reg(o) {
    o.figura = o.figura || null;
    o.capCal = !!o.capCal;
    o.figuraCal = !!o.figuraCal;
    G.push(o);
    PER_ID[o.id] = o;
    return o;
  }

  var DIV = ['1eso-num-divisibilitat', '2eso-num-divisibilitat'];
  var ANG = ['1eso-esp-angles', '1eso-mes-angles'];
  var POL = ['1eso-esp-poligons', '2eso-esp-poligons'];
  /* 3r també: el seu saber és «Traducció al llenguatge algebraic d'un
     enunciat» i al banc de repàs només hi tenia un ítem de nivell 1. */
  var ALG = ['1eso-alg-llenguatge', '2eso-alg-llenguatge', '3eso-alg-llenguatge'];
  var EQU = ['2eso-alg-equacions', '3eso-alg-equacions'];
  var LEC = ['1eso-lec', '2eso-lec', '3eso-lec', '4eso-apl-lec'];
  var SEM = ['3eso-esp-semblanca', '3eso-mes-semblanca'];

  /* =================================================== divisibilitat ===== */
  reg({
    id: 'div-multiples', capCal: true, sabers: DIV, nivell: 1,
    cap: 'Escriu els cinc primers múltiples d\'aquests nombres.',
    fn: function (r) {
      var n = r.entre(3, 12), m = [1, 2, 3, 4, 5].map(function (k) { return n * k; });
      return {
        enunciat: '$' + n + '$',
        resposta: '$' + llista(m) + '$',
        passos: ['Es multiplica $' + n + '$ per $1, 2, 3, 4$ i $5$: $' + llista(m) + '$.']
      };
    }
  });

  reg({
    id: 'div-divisors', capCal: true, sabers: DIV, nivell: 1,
    cap: 'Escriu tots els divisors d\'aquests nombres.',
    fn: function (r) {
      var n = r.tria([12, 16, 18, 20, 24, 28, 30, 36, 40, 45, 50, 54]);
      var d = divisors(n);
      return {
        enunciat: '$' + n + '$',
        resposta: '$' + llista(d) + '$',
        passos: ['Es busquen les parelles que multiplicades donen $' + n + '$.',
                 'Divisors: $' + llista(d) + '$.']
      };
    }
  });

  reg({
    id: 'div-primer', capCal: true, sabers: DIV, nivell: 1,
    cap: 'Digues si aquests nombres són primers o compostos.',
    fn: function (r) {
      var n = r.tria([17, 21, 23, 27, 29, 31, 33, 39, 41, 49, 51, 53, 57, 59]);
      var p = esPrimer(n);
      return {
        enunciat: '$' + n + '$',
        resposta: p ? 'Primer' : 'Compost',
        passos: [p
          ? '$' + n + '$ només és divisible per $1$ i per ell mateix.'
          : '$' + n + '$ és divisible per $' + divisors(n)[1] + '$, i per tant té ' +
            'més divisors que $1$ i ell mateix.']
      };
    }
  });

  reg({
    id: 'div-criteris', capCal: true, sabers: DIV, nivell: 1,
    cap: 'Digues per quins dels nombres $2$, $3$ i $5$ són divisibles, sense fer la divisió.',
    fn: function (r) {
      var n = r.tria([24, 35, 45, 56, 70, 84, 90, 105, 120, 132, 150, 165]);
      var c = [2, 3, 5].filter(function (x) { return n % x === 0; });
      return {
        enunciat: '$' + n + '$',
        resposta: c.length ? 'Per ' + c.join(', ').replace(/, ([^,]*)$/, ' i $1')
                          : 'Per cap dels tres',
        passos: [
          'Per $2$: ' + (n % 2 === 0 ? 'acaba en xifra parella, sí'
                                     : 'no acaba en xifra parella, no') + '.',
          'Per $3$: les xifres sumen $' + sumaXifres(n) + '$, ' +
            (n % 3 === 0 ? 'múltiple de $3$, sí' : 'que no és múltiple de $3$, no') + '.',
          'Per $5$: ' + (n % 5 === 0 ? 'acaba en $0$ o $5$, sí'
                                     : 'no acaba en $0$ ni en $5$, no') + '.'
        ]
      };
    }
  });

  reg({
    id: 'div-factoritza', capCal: true, sabers: DIV, nivell: 1,
    cap: 'Fes la descomposició en factors primers.',
    fn: function (r) {
      var n = r.tria([18, 20, 24, 28, 36, 40, 45, 50, 54, 60, 72, 84, 90, 100]);
      return {
        enunciat: '$' + n + '$',
        resposta: '$' + texFactors(factoritza(n)) + '$',
        passos: ['Es va dividint entre primers de menor a major.',
                 '$' + n + ' = ' + texFactors(factoritza(n)) + '$']
      };
    }
  });

  var PARELLS = [[12, 18], [8, 12], [15, 20], [16, 24], [10, 25], [14, 21],
                 [9, 12], [20, 30], [6, 15], [18, 24], [8, 20], [12, 15]];

  reg({
    id: 'div-mcd', capCal: true, sabers: DIV, nivell: 1,
    cap: 'Calcula el màxim comú divisor.',
    fn: function (r) {
      var p = r.tria(PARELLS), g = mcd(p[0], p[1]);
      return {
        enunciat: '$' + p[0] + '$ i $' + p[1] + '$',
        resposta: '$\\operatorname{m.c.d.}(' + p[0] + ', ' + p[1] + ') = ' + g + '$',
        passos: ['$' + p[0] + ' = ' + texFactors(factoritza(p[0])) + '$ i $' +
                 p[1] + ' = ' + texFactors(factoritza(p[1])) + '$.',
                 'Es prenen els factors comuns amb el menor exponent: $' + g + '$.']
      };
    }
  });

  reg({
    id: 'div-mcm', capCal: true, sabers: DIV, nivell: 1,
    cap: 'Calcula el mínim comú múltiple.',
    fn: function (r) {
      var p = r.tria(PARELLS), m = p[0] * p[1] / mcd(p[0], p[1]);
      return {
        enunciat: '$' + p[0] + '$ i $' + p[1] + '$',
        resposta: '$\\operatorname{m.c.m.}(' + p[0] + ', ' + p[1] + ') = ' + m + '$',
        passos: ['$' + p[0] + ' = ' + texFactors(factoritza(p[0])) + '$ i $' +
                 p[1] + ' = ' + texFactors(factoritza(p[1])) + '$.',
                 'Es prenen tots els factors amb el major exponent: $' + m + '$.']
      };
    }
  });

  /* ==================================================== arrel quadrada ==== */
  reg({
    id: 'arr-exacta', capCal: true, sabers: ['1eso-num-arrel'], nivell: 1,
    cap: 'Calcula aquestes arrels quadrades.',
    fn: function (r) {
      var n = r.entre(2, 20);
      return {
        enunciat: '$\\sqrt{' + (n * n) + '}$',
        resposta: '$' + n + '$',
        passos: ['Es busca el nombre que multiplicat per ell mateix dona $' +
                 (n * n) + '$: $' + n + ' \\cdot ' + n + ' = ' + (n * n) + '$.']
      };
    }
  });

  reg({
    id: 'arr-entre', capCal: true, sabers: ['1eso-num-arrel'], nivell: 1,
    cap: 'Aquestes arrels no són exactes. Entre quins dos nombres enters consecutius es troben?',
    fn: function (r) {
      var n;
      do { n = r.entre(5, 199); } while (Math.round(Math.sqrt(n)) === Math.sqrt(n));
      var b = Math.floor(Math.sqrt(n));
      return {
        enunciat: '$\\sqrt{' + n + '}$',
        resposta: 'Entre $' + b + '$ i $' + (b + 1) + '$',
        passos: ['$' + b + '^2 = ' + (b * b) + '$ i $' + (b + 1) + '^2 = ' +
                 ((b + 1) * (b + 1)) + '$.',
                 'Com que $' + (b * b) + ' < ' + n + ' < ' + ((b + 1) * (b + 1)) +
                 '$, l\'arrel és entre $' + b + '$ i $' + (b + 1) + '$.']
      };
    }
  });

  reg({
    id: 'arr-quadrat', capCal: true, sabers: ['1eso-num-arrel'], nivell: 1,
    cap: 'Digues si aquests nombres són quadrats perfectes.',
    fn: function (r) {
      var n = r.tria([16, 20, 25, 30, 36, 40, 49, 50, 64, 72, 81, 90, 100, 110]);
      var b = Math.floor(Math.sqrt(n)), exacte = b * b === n;
      return {
        enunciat: '$' + n + '$',
        resposta: exacte ? 'Sí' : 'No',
        passos: [exacte
          ? '$\\sqrt{' + n + '} = ' + b + '$, que és un nombre enter.'
          : '$' + b + '^2 = ' + (b * b) + '$ i $' + (b + 1) + '^2 = ' +
            ((b + 1) * (b + 1)) + '$: $' + n + '$ queda entremig.']
      };
    }
  });

  /* ================================================ magnituds i unitats === */
  var CONV = [['km', 'm', 1000], ['m', 'cm', 100], ['cm', 'mm', 10],
              ['kg', 'g', 1000], ['L', 'mL', 1000], ['m', 'mm', 1000]];

  reg({
    id: 'mag-baixa', capCal: true, sabers: ['1eso-mes-magnituds'], nivell: 1,
    fn: function (r) {
      var c = r.tria(CONV), v = r.tria([2, 2.5, 3, 3.5, 4, 5, 7.5]);
      return {
        cap: 'Expressa aquestes mesures en ' + c[1] + '.',
        enunciat: '$' + coma(v) + '$ ' + c[0],
        resposta: '$' + coma(v * c[2]) + '$ ' + c[1],
        passos: ['$1$ ' + c[0] + ' $= ' + c[2] + '$ ' + c[1] + '.',
                 '$' + coma(v) + ' \\cdot ' + c[2] + ' = ' + coma(v * c[2]) + '$ ' + c[1] + '.']
      };
    }
  });

  reg({
    id: 'mag-puja', capCal: true, sabers: ['1eso-mes-magnituds'], nivell: 1,
    fn: function (r) {
      var c = r.tria(CONV);
      // El nombre de l'enunciat es manté per sota de mil: 3000 mm i 300 cm
      // costen el mateix a l'alumne, però el mesurador de nivell penalitza
      // els nombres grossos i el generador deixaria de ser estable.
      var v = r.tria(c[2] === 1000 ? [250, 500, 750]
                   : c[2] === 100 ? [150, 200, 300, 450]
                   : [20, 35, 60, 85]);
      return {
        cap: 'Expressa aquestes mesures en ' + c[0] + '.',
        enunciat: '$' + v + '$ ' + c[1],
        resposta: '$' + coma(v / c[2]) + '$ ' + c[0],
        passos: ['$1$ ' + c[0] + ' $= ' + c[2] + '$ ' + c[1] + '.',
                 '$' + v + ' : ' + c[2] + ' = ' + coma(v / c[2]) + '$ ' + c[0] + '.']
      };
    }
  });

  reg({
    id: 'mag-superficie', capCal: true, sabers: ['1eso-mes-magnituds'], nivell: 1,
    fn: function (r) {
      var c = [['cm^2', 'mm^2', 100]][0];
      var v = r.entre(2, 9);
      return {
        cap: 'Expressa aquestes superfícies en $' + c[1] + '$.',
        enunciat: '$' + v + '$ $' + c[0] + '$',
        resposta: '$' + (v * c[2]) + '$ $' + c[1] + '$',
        passos: ['$1$ $' + c[0] + ' = ' + c[2] + '$ $' + c[1] + '$.',
                 '$' + v + ' \\cdot ' + c[2] + ' = ' + (v * c[2]) + '$ $' + c[1] + '$.']
      };
    }
  });

  reg({
    /* Separat de `mag-superficie` a propòsit: $2$ m² són $20\,000$ cm², i un
       resultat de cinc xifres no és el mateix exercici que passar de cm² a
       mm². Com que la dificultat de debò és una altra, és un generador a
       part i declara el seu nivell. */
    id: 'mag-superficie-gran', capCal: true, sabers: ['1eso-mes-magnituds'], nivell: 2,
    fn: function (r) {
      var c = r.tria([['m^2', 'cm^2', 10000], ['km^2', 'm^2', 1000000]]);
      var v = r.entre(2, 6);
      return {
        cap: 'Expressa aquestes superfícies en $' + c[1] + '$.',
        enunciat: '$' + v + '$ $' + c[0] + '$',
        resposta: '$' + (v * c[2]) + '$ $' + c[1] + '$',
        passos: ['$1$ $' + c[0] + ' = ' + c[2] + '$ $' + c[1] + '$.',
                 '$' + v + ' \\cdot ' + c[2] + ' = ' + (v * c[2]) + '$ $' + c[1] + '$.']
      };
    }
  });

  /* ================================================ llenguatge algebraic == */
  var FRASES = [
    ['el doble d\'un nombre', '2x'],
    ['un nombre més $5$', 'x+5'],
    ['la meitat d\'un nombre', '\\dfrac{x}{2}'],
    ['el triple d\'un nombre menys $4$', '3x-4'],
    ['un nombre menys $7$', 'x-7'],
    ['el quadrat d\'un nombre', 'x^2'],
    ['el següent d\'un nombre enter', 'x+1'],
    ['l\'anterior d\'un nombre enter', 'x-1'],
    ['la suma d\'un nombre i el seu doble', 'x+2x'],
    ['la tercera part d\'un nombre més $2$', '\\dfrac{x}{3}+2'],
    ['el quàdruple d\'un nombre', '4x'],
    ['un nombre dividit entre $5$', '\\dfrac{x}{5}']
  ];

  reg({
    id: 'alg-frase', capCal: true, sabers: ALG, nivell: 1,
    cap: 'Escriu en llenguatge algebraic, anomenant $x$ el nombre desconegut.',
    fn: function (r) {
      var f = r.tria(FRASES);
      return {
        enunciat: f[0].charAt(0).toUpperCase() + f[0].slice(1) + '.',
        resposta: '$' + f[1] + '$',
        passos: ['Si el nombre és $x$, ' + f[0] + ' s\'escriu $' + f[1] + '$.']
      };
    }
  });

  var CONTEXTOS = [
    ['Tinc $x$ anys. Quina edat tindré d\'aquí a $6$ anys?', 'x+6',
     'D\'aquí a $6$ anys tindré $6$ anys més: $x+6$.'],
    ['Tinc $x$ anys. Quina edat tenia fa $4$ anys?', 'x-4',
     'Fa $4$ anys en tenia $4$ menys: $x-4$.'],
    ['Un quadrat té el costat de $x$ cm. Quin és el seu perímetre?', '4x',
     'El quadrat té quatre costats iguals: $4x$.'],
    ['Un rectangle fa $x$ cm de base i $3$ cm d\'alçada. Quina és la seva àrea?',
     '3x', 'L\'àrea del rectangle és base per alçada: $x \\cdot 3 = 3x$.'],
    ['Una llibreta val $x$ euros. Quant valen $5$ llibretes?', '5x',
     'Cinc llibretes valen cinc vegades el preu d\'una: $5x$.'],
    ['Un triangle equilàter té el costat de $x$ cm. Quin és el seu perímetre?',
     '3x', 'El triangle equilàter té tres costats iguals: $3x$.'],
    ['Un pastís es reparteix entre $x$ persones. Quina part en toca a cadascuna?',
     '\\dfrac{1}{x}', 'Es reparteix un pastís en $x$ parts iguals: $\\dfrac{1}{x}$.']
  ];

  reg({
    id: 'alg-context', sabers: ALG, nivell: 1, cap: '',
    fn: function (r) {
      var c = r.tria(CONTEXTOS);
      return { enunciat: c[0], resposta: '$' + c[1] + '$', passos: [c[2]] };
    }
  });

  /* ================================================ elements geomètrics === */
  var PISTES_RECTES = {
    'paral·leles': 'No es tallen mai, per molt que s\'allarguin.',
    'secants': 'Es tallen en un punt, però no formen angle recte.',
    'perpendiculars': 'Es tallen formant quatre angles rectes.'
  };

  reg({
    id: 'ele-rectes', figuraCal: true, capCal: true, sabers: ['1eso-esp-elements'], nivell: 1,
    cap: 'Digues quina és la posició relativa d\'aquestes dues rectes.',
    fn: function (r) {
      var p = r.tria(['paral·leles', 'secants', 'perpendiculars']);
      return { enunciat: '', figura: svgRectes(p),
               resposta: 'Són ' + p, passos: [PISTES_RECTES[p]] };
    }
  });

  var SEGMENTS_CERCLE = [
    ['a', 'El radi', 'Va del centre a un punt de la circumferència.'],
    ['b', 'El radi', 'També va del centre a la circumferència.'],
    ['c', 'Una corda', 'Uneix dos punts de la circumferència sense passar pel centre.']
  ];

  reg({
    id: 'ele-cercle', figuraCal: true, capCal: true, sabers: ['1eso-esp-elements'], nivell: 1,
    fn: function (r) {
      var s = r.tria(SEGMENTS_CERCLE);
      return {
        cap: 'Com s\'anomena el segment $' + s[0] + '$ d\'aquesta circumferència?',
        enunciat: '', figura: SVG_CERCLE, resposta: s[1], passos: [s[2]]
      };
    }
  });

  var DEF_ELEMENTS = [
    ['Quants punts calen per determinar una recta?', 'Dos',
     'Per dos punts diferents hi passa una recta i només una.'],
    ['Com s\'anomena la part de recta que té principi i final?', 'Un segment',
     'El segment està limitat pels seus dos extrems.'],
    ['Com s\'anomena la part de recta que té principi però no final?',
     'Una semirecta', 'La semirecta té origen i s\'allarga indefinidament.'],
    ['Com s\'anomena la corda que passa pel centre de la circumferència?',
     'El diàmetre', 'El diàmetre mesura el doble que el radi.'],
    ['Com s\'anomenen dues rectes que es tallen formant angle recte?',
     'Perpendiculars', 'Formen quatre angles de $90^\\circ$.']
  ];

  reg({
    id: 'ele-definicions', sabers: ['1eso-esp-elements'], nivell: 1, cap: '',
    fn: function (r) {
      var d = r.tria(DEF_ELEMENTS);
      return { enunciat: d[0], resposta: d[1], passos: [d[2]] };
    }
  });

  /* =============================================================== angles = */
  reg({
    id: 'ang-complementari', capCal: true, sabers: ANG, nivell: 1,
    cap: 'Calcula l\'angle complementari d\'aquests angles.',
    fn: function (r) {
      var a = r.tria([15, 25, 30, 35, 40, 55, 62, 70, 78, 20, 48]);
      return {
        enunciat: '$' + a + '^\\circ$',
        resposta: '$' + (90 - a) + '^\\circ$',
        passos: ['Dos angles complementaris sumen $90^\\circ$.',
                 '$90^\\circ - ' + a + '^\\circ = ' + (90 - a) + '^\\circ$']
      };
    }
  });

  reg({
    id: 'ang-suplementari', capCal: true, sabers: ANG, nivell: 1,
    cap: 'Calcula l\'angle suplementari d\'aquests angles.',
    fn: function (r) {
      var a = r.tria([35, 48, 60, 72, 95, 110, 125, 140, 155, 82]);
      return {
        enunciat: '$' + a + '^\\circ$',
        resposta: '$' + (180 - a) + '^\\circ$',
        passos: ['Dos angles suplementaris sumen $180^\\circ$.',
                 '$180^\\circ - ' + a + '^\\circ = ' + (180 - a) + '^\\circ$']
      };
    }
  });

  reg({
    id: 'ang-triangle', capCal: true, sabers: ANG.concat(['1eso-esp-triangles']), nivell: 1,
    cap: 'Coneixem dos angles d\'un triangle. Calcula el tercer.',
    fn: function (r) {
      var p = r.tria([[40, 60], [35, 90], [50, 70], [25, 105], [45, 45],
                      [30, 80], [55, 65], [20, 120]]);
      return {
        enunciat: '$' + p[0] + '^\\circ$ i $' + p[1] + '^\\circ$',
        resposta: '$' + (180 - p[0] - p[1]) + '^\\circ$',
        passos: ['Els tres angles d\'un triangle sumen $180^\\circ$.',
                 '$180^\\circ - ' + p[0] + '^\\circ - ' + p[1] + '^\\circ = ' +
                 (180 - p[0] - p[1]) + '^\\circ$']
      };
    }
  });

  reg({
    id: 'ang-classifica', figuraCal: true, capCal: true, sabers: ANG, nivell: 1,
    cap: 'Classifica aquests angles.',
    fn: function (r) {
      var a = r.tria([35, 90, 118, 145, 180, 62, 105, 20]);
      var t = a < 90 ? 'agut' : a === 90 ? 'recte' : a < 180 ? 'obtús' : 'pla';
      var pas = { agut: 'Fa menys de $90^\\circ$.', recte: 'Fa exactament $90^\\circ$.',
                  'obtús': 'Fa més de $90^\\circ$ i menys de $180^\\circ$.',
                  pla: 'Fa exactament $180^\\circ$.' }[t];
      return { enunciat: '', figura: svgAngle(a, a + '°'),
               resposta: 'Angle ' + t, passos: [pas] };
    }
  });

  /* ============================================================= polígons = */
  var NOMS = { 3: 'triangle', 4: 'quadrilàter', 5: 'pentàgon', 6: 'hexàgon',
               7: 'heptàgon', 8: 'octàgon', 9: 'eneàgon', 10: 'decàgon' };

  reg({
    id: 'pol-diagonals', capCal: true, sabers: POL, nivell: 1,
    cap: 'Quantes diagonals té cadascun d\'aquests polígons?',
    fn: function (r) {
      var n = r.entre(3, 10), d = n * (n - 3) / 2;
      return {
        enunciat: 'Un ' + NOMS[n] + ' ($' + n + '$ costats).',
        resposta: '$' + d + '$ diagonals',
        passos: ['D\'un vèrtex en surten $' + n + ' - 3 = ' + (n - 3) + '$ diagonals.',
                 '$\\dfrac{' + n + ' \\cdot ' + (n - 3) + '}{2} = ' + d + '$']
      };
    }
  });

  reg({
    id: 'pol-angles', capCal: true, sabers: POL, nivell: 1,
    cap: 'Calcula la suma dels angles interiors d\'aquests polígons.',
    fn: function (r) {
      var n = r.entre(3, 10), s = (n - 2) * 180;
      return {
        enunciat: 'Un ' + NOMS[n] + ' ($' + n + '$ costats).',
        resposta: '$' + s + '^\\circ$',
        passos: ['Es descompon en ' + plural(n - 2, 'triangle') +
                 ' ($' + n + ' - 2 = ' + (n - 2) + '$).',
                 '$' + (n - 2) + ' \\cdot 180^\\circ = ' + s + '^\\circ$']
      };
    }
  });

  var QUADRI = [
    ['Té els quatre costats iguals i els quatre angles rectes.', 'El quadrat'],
    ['Té els costats iguals dos a dos i els quatre angles rectes.', 'El rectangle'],
    ['Té els quatre costats iguals però els angles no són rectes.', 'El rombe'],
    ['Només té dos costats paral·lels.', 'El trapezi'],
    ['Té els costats paral·lels dos a dos i els angles no són rectes.',
     'El paral·lelogram']
  ];

  reg({
    id: 'pol-quadrilater', sabers: POL, nivell: 1,
    cap: 'Quin quadrilàter es descriu?',
    fn: function (r) {
      var q = r.tria(QUADRI);
      return { enunciat: q[0], resposta: q[1],
               passos: [q[1] + ' és l\'únic que compleix les condicions.'] };
    }
  });

  /* =========================================================== perímetres = */
  reg({
    id: 'per-rectangle', figuraCal: true, capCal: true, sabers: ['1eso-mes-perimetres'], nivell: 1,
    cap: 'Calcula el perímetre d\'aquests rectangles.',
    fn: function (r) {
      var a = r.entre(3, 9), b = r.entre(a + 1, 14);
      return {
        enunciat: '', figura: svgRectangle(b, a),
        resposta: '$' + (2 * (a + b)) + '$ cm',
        passos: ['$P = 2 \\cdot (' + b + ' + ' + a + ')$',
                 '$P = 2 \\cdot ' + (a + b) + ' = ' + (2 * (a + b)) + '$ cm']
      };
    }
  });

  reg({
    id: 'per-quadrat', capCal: true, sabers: ['1eso-mes-perimetres'], nivell: 1,
    cap: 'Calcula el perímetre d\'aquests quadrats.',
    fn: function (r) {
      var c = r.entre(3, 14);
      return {
        enunciat: 'Costat de $' + c + '$ cm.',
        resposta: '$' + (4 * c) + '$ cm',
        passos: ['$P = 4 \\cdot ' + c + ' = ' + (4 * c) + '$ cm']
      };
    }
  });

  /* «Un quadrilàter regular» no es diu: se'n diu quadrat, i d'un triangle
     regular, equilàter. Els noms van a part dels genèrics. */
  var NOMS_REGULARS = { 3: 'triangle equilàter', 4: 'quadrat',
                        5: 'pentàgon regular', 6: 'hexàgon regular',
                        8: 'octàgon regular' };

  reg({
    id: 'per-regular', capCal: true, sabers: ['1eso-mes-perimetres'], nivell: 1,
    cap: 'Calcula el perímetre d\'aquests polígons regulars.',
    fn: function (r) {
      var n = r.tria([3, 4, 5, 6, 8]), c = r.entre(3, 12);
      return {
        enunciat: 'Un ' + NOMS_REGULARS[n] + ' de costat $' + c + '$ cm.',
        resposta: '$' + (n * c) + '$ cm',
        passos: ['Té $' + n + '$ costats iguals: $P = ' + n + ' \\cdot ' + c +
                 ' = ' + (n * c) + '$ cm.']
      };
    }
  });

  reg({
    id: 'per-circumferencia', capCal: true, sabers: ['1eso-mes-perimetres'], nivell: 1,
    cap: 'Calcula la longitud d\'aquestes circumferències. Deixa el resultat en funció de $\\pi$.',
    fn: function (r) {
      var v = r.entre(2, 12);
      return {
        enunciat: 'Radi de $' + v + '$ cm.',
        resposta: '$' + (2 * v) + '\\pi$ cm',
        passos: ['$L = 2 \\pi r = 2 \\pi \\cdot ' + v + ' = ' + (2 * v) + '\\pi$ cm']
      };
    }
  });

  /* ==================================================== comprensió lectora = */
  var PROBLEMES = [
    ['La Marta compra $3$ llibretes de $2$ € cada una i paga amb un bitllet de $10$ €. Quants euros li tornen?',
     '$4$ €', ['Les llibretes valen $3 \\cdot 2 = 6$ €.', '$10 - 6 = 4$ €']],
    ['Un autobús surt amb $34$ passatgers. A la primera parada en baixen $12$ i en pugen $7$. Quants passatgers hi ha ara?',
     '$29$ passatgers', ['$34 - 12 = 22$', '$22 + 7 = 29$ passatgers']],
    ['En una classe de $28$ alumnes, la meitat fan francès i la resta, alemany. Quants fan alemany?',
     '$14$ alumnes', ['La meitat de $28$ és $14$.', 'La resta també són $14$.']],
    ['Un llibre té $180$ pàgines. En Pau n\'ha llegit $45$. Quantes li\'n queden?',
     '$135$ pàgines', ['$180 - 45 = 135$ pàgines']],
    ['Una capsa conté $6$ paquets i cada paquet, $8$ galetes. Si me\'n menjo $5$, quantes en queden?',
     '$43$ galetes', ['A la capsa hi ha $6 \\cdot 8 = 48$ galetes.', '$48 - 5 = 43$ galetes']],
    ['L\'entrada del cinema val $7$ €. Si hi anem $4$ amics i tenim un descompte de $5$ € en total, quant paguem?',
     '$23$ €', ['Sense descompte: $4 \\cdot 7 = 28$ €.', '$28 - 5 = 23$ €']],
    ['Un tren surt a les $9$:$15$ i el viatge dura $50$ minuts. A quina hora arriba?',
     'A les $10$:$05$', ['De les $9$:$15$ a les $10$:$00$ hi ha $45$ minuts.',
                         'Queden $5$ minuts més: arriba a les $10$:$05$.']],
    ['La Núria té estalviats $85$ € i cada setmana n\'estalvia $10$ més. Quants en tindrà d\'aquí a $4$ setmanes?',
     '$125$ €', ['En $4$ setmanes estalvia $4 \\cdot 10 = 40$ €.', '$85 + 40 = 125$ €']],
    ['Un jardí rectangular fa $12$ m de llarg i $5$ m d\'ample. Quants metres de tanca calen per envoltar-lo?',
     '$34$ m', ['$P = 2 \\cdot (12 + 5)$', '$P = 2 \\cdot 17 = 34$ m']],
    ['En una excursió hi van $52$ alumnes i cada autocar té $24$ places. Quants autocars calen?',
     '$3$ autocars', ['$52 : 24 = 2$ i en sobren $4$.',
                      'Amb $2$ autocars no hi caben tots: en calen $3$.']],
    ['Una pel·lícula comença a les $18$:$40$ i dura $95$ minuts. A quina hora acaba?',
     'A les $20$:$15$', ['$95$ minuts són $1$ hora i $35$ minuts.',
                         'De les $18$:$40$, més $1$ h són les $19$:$40$; més $35$ min, les $20$:$15$.']],
    ['Un paquet de $12$ retoladors val $9$ €. Quant val cada retolador?',
     '$0{,}75$ €', ['$9 : 12 = 0{,}75$ €']]
  ];

  reg({
    id: 'lec-problema', sabers: LEC, nivell: 1, cap: '',
    fn: function (r) {
      var p = r.tria(PROBLEMES);
      return { enunciat: p[0], resposta: p[1], passos: p[2] };
    }
  });

  /* ================================================ vocabulari geomètric == */
  var DEF_VOC = [
    ['Com s\'anomena el punt on es troben tres o més arestes d\'un poliedre?',
     'Un vèrtex', 'Les arestes conflueixen als vèrtexs.'],
    ['Com s\'anomena el segment on es troben dues cares d\'un poliedre?',
     'Una aresta', 'L\'aresta és la intersecció de dues cares.'],
    ['Com s\'anomena cadascun dels polígons que limiten un poliedre?', 'Una cara',
     'Les cares d\'un poliedre són polígons plans.'],
    ['Quin cos s\'obté fent girar un rectangle al voltant d\'un dels seus costats?',
     'Un cilindre', 'El costat sobre el qual gira és l\'eix del cilindre.'],
    ['Quin cos s\'obté fent girar un triangle rectangle al voltant d\'un catet?',
     'Un con', 'L\'altre catet és el radi de la base.'],
    ['Quin cos s\'obté fent girar un semicercle al voltant del seu diàmetre?',
     'Una esfera', 'Tots els punts queden a la mateixa distància del centre.'],
    ['Com s\'anomena el poliedre que té totes les cares iguals i regulars?',
     'Un poliedre regular', 'N\'hi ha cinc: tetraedre, cub, octaedre, dodecaedre i icosaedre.'],
    ['Quants poliedres regulars hi ha?', 'Cinc',
     'Tetraedre, cub, octaedre, dodecaedre i icosaedre.']
  ];

  reg({
    id: 'voc-definicions', sabers: ['2eso-esp-vocabulari'], nivell: 1, cap: '',
    fn: function (r) {
      var d = r.tria(DEF_VOC);
      return { enunciat: d[0], resposta: d[1], passos: [d[2]] };
    }
  });

  var POLIEDRES = [['un cub', 6, 8, 12], ['un tetraedre', 4, 4, 6],
                   ['un octaedre', 8, 6, 12], ['una piràmide de base quadrada', 5, 5, 8],
                   ['un prisma triangular', 5, 6, 9], ['un prisma hexagonal', 8, 12, 18],
                   ['un prisma pentagonal', 7, 10, 15]];

  reg({
    id: 'voc-euler', sabers: ['2eso-esp-vocabulari'], nivell: 1,
    cap: 'Aplica la fórmula d\'Euler ($C + V = A + 2$).',
    fn: function (r) {
      var p = r.tria(POLIEDRES);
      var que = r.tria(['arestes', 'vèrtexs', 'cares']);
      var c = p[1], v = p[2], a = p[3];
      var conegut = { arestes: 'té $' + c + '$ cares i $' + v + '$ vèrtexs',
                      'vèrtexs': 'té $' + c + '$ cares i $' + a + '$ arestes',
                      cares: 'té $' + v + '$ vèrtexs i $' + a + '$ arestes' }[que];
      var val = { arestes: a, 'vèrtexs': v, cares: c }[que];
      return {
        enunciat: 'Si ' + p[0] + ' ' + conegut + ', quantes ' + que + ' té?',
        resposta: '$' + val + '$ ' + que,
        passos: ['$C + V = A + 2$',
                 '$' + c + ' + ' + v + ' = ' + a + ' + 2$, i per tant les ' + que +
                 ' són $' + val + '$.']
      };
    }
  });

  /* ==================================================== moviments al pla == */
  var PUNTS = [[2, 3], [-1, 4], [5, -2], [-3, -1], [0, 5], [4, 1], [-2, 2],
               [3, -4], [-5, 1], [1, 6]];
  var VECTORS = [[3, -1], [-2, 4], [1, 5], [-4, -2], [2, 2], [5, -3], [-1, -4]];

  reg({
    id: 'mov-translacio', capCal: true, sabers: ['3eso-esp-moviments'], nivell: 1,
    cap: 'Aplica la translació de vector $\\vec{v}$ al punt $A$ i escriu les coordenades de $A\'$.',
    fn: function (r) {
      var p = r.tria(PUNTS), v = r.tria(VECTORS);
      return {
        enunciat: '$A(' + p[0] + ', ' + p[1] + ')$ i $\\vec{v} = (' + v[0] + ', ' + v[1] + ')$.',
        resposta: '$A\'(' + (p[0] + v[0]) + ', ' + (p[1] + v[1]) + ')$',
        passos: ['Es suma el vector a cada coordenada.',
                 '$A\'(' + p[0] + ' ' + sumand(v[0]) + ', ' + p[1] + ' ' +
                 sumand(v[1]) + ') = A\'(' + (p[0] + v[0]) + ', ' +
                 (p[1] + v[1]) + ')$']
      };
    }
  });

  reg({
    id: 'mov-simetria', capCal: true, sabers: ['3eso-esp-moviments'], nivell: 1,
    cap: 'Calcula el simètric d\'aquest punt.',
    fn: function (r) {
      var p = r.tria(PUNTS);
      var e = r.tria([
        ['l\'eix $X$', [p[0], -p[1]], 'Es canvia el signe de l\'ordenada.'],
        ['l\'eix $Y$', [-p[0], p[1]], 'Es canvia el signe de l\'abscissa.'],
        ['l\'origen', [-p[0], -p[1]], 'Es canvien els signes de les dues coordenades.']
      ]);
      return {
        enunciat: 'El simètric de $A(' + p[0] + ', ' + p[1] + ')$ respecte de ' + e[0] + '.',
        resposta: '$A\'(' + e[1][0] + ', ' + e[1][1] + ')$',
        passos: [e[2], '$A\'(' + e[1][0] + ', ' + e[1][1] + ')$']
      };
    }
  });

  reg({
    id: 'mov-gir', capCal: true, sabers: ['3eso-esp-moviments'], nivell: 1,
    cap: 'Calcula la imatge del punt en un gir de $90^\\circ$ en sentit antihorari al voltant de l\'origen.',
    fn: function (r) {
      var p = r.tria(PUNTS);
      return {
        enunciat: '$A(' + p[0] + ', ' + p[1] + ')$',
        resposta: '$A\'(' + (-p[1]) + ', ' + p[0] + ')$',
        passos: ['En un gir de $90^\\circ$ antihorari, $(x, y)$ va a $(-y, x)$.',
                 '$A\'(' + (-p[1]) + ', ' + p[0] + ')$']
      };
    }
  });

  reg({
    id: 'mov-vector', capCal: true, sabers: ['3eso-esp-moviments'], nivell: 1,
    cap: 'Escriu les components del vector que va del primer punt al segon.',
    fn: function (r) {
      var a = r.tria(PUNTS), b;
      do { b = r.tria(PUNTS); } while (b[0] === a[0] && b[1] === a[1]);
      return {
        enunciat: 'De $A(' + a[0] + ', ' + a[1] + ')$ a $B(' + b[0] + ', ' + b[1] + ')$.',
        resposta: '$\\vec{AB} = (' + (b[0] - a[0]) + ', ' + (b[1] - a[1]) + ')$',
        passos: ['Es resten les coordenades de l\'origen a les de l\'extrem.',
                 '$\\vec{AB} = (' + b[0] + ' - ' + restand(a[0]) + ', ' + b[1] +
                 ' - ' + restand(a[1]) + ') = (' + (b[0] - a[0]) + ', ' +
                 (b[1] - a[1]) + ')$']
      };
    }
  });

  /* ============================================================= decimals = */
  reg({
    id: 'dec-centesimes', capCal: true, sabers: ['1eso-num-decimals'], nivell: 1,
    cap: 'Arrodoneix a les centèsimes.',
    fn: function (r) {
      var v = (r.entre(100, 2999) + r.entre(1, 999) / 1000);
      v = Math.round(v * 1000) / 1000 / 100;
      var mil = Math.round(v * 1000) % 10;
      return {
        enunciat: '$' + coma(v) + '$',
        resposta: '$' + coma(Math.round(v * 100) / 100) + '$',
        passos: ['La xifra de les mil·lèsimes és $' + mil + '$: ' +
                 (mil >= 5 ? 's\'arrodoneix cap amunt' : 'es deixa igual') + '.',
                 '$' + coma(Math.round(v * 100) / 100) + '$']
      };
    }
  });

  reg({
    id: 'dec-unitats', capCal: true, sabers: ['1eso-num-decimals'], nivell: 1,
    cap: 'Arrodoneix a les unitats.',
    fn: function (r) {
      var e = r.entre(0, 40), d = r.entre(1, 9), v = e + d / 10;
      return {
        enunciat: '$' + coma(v) + '$',
        resposta: '$' + Math.round(v) + '$',
        passos: ['La primera xifra decimal és $' + d + '$.',
                 '$' + coma(v) + ' \\approx ' + Math.round(v) + '$']
      };
    }
  });

  reg({
    id: 'dec-ordena', capCal: true, sabers: ['1eso-num-decimals'], nivell: 1,
    cap: 'Ordena de menor a major.',
    fn: function (r) {
      var a = r.entre(1, 8), b = r.entre(1, 9);
      var g = [a + b / 10, a + b / 100, a + b / 10 + b / 100];
      var o = g.slice().sort(function (x, y) { return x - y; });
      return {
        enunciat: '$' + g.map(coma).join(' \\quad ') + '$',
        resposta: '$' + o.map(coma).join(' < ') + '$',
        passos: ['Es comparen les xifres decimals una a una, de l\'esquerra cap a la dreta.',
                 '$' + o.map(coma).join(' < ') + '$']
      };
    }
  });

  reg({
    id: 'dec-resta', capCal: true, sabers: ['1eso-num-decimals'], nivell: 1,
    cap: 'Fes aquestes restes.',
    fn: function (r) {
      var a = r.entre(20, 90) / 10, b = r.entre(10, 19) / 10;
      var d = Math.round((a - b) * 100) / 100;
      return {
        enunciat: '$' + coma(a) + ' - ' + coma(b) + '$',
        resposta: '$' + coma(d) + '$',
        passos: ['S\'alineen les comes: $' + coma(a) + ' - ' + coma(b) + ' = ' +
                 coma(d) + '$.']
      };
    }
  });

  /* ====================================================== gràfics i taules = */
  /* L'article va DINS de la descripció: «recull la temperatura» però
     «recull els gols marcats». Cosir-lo fora donava «recull la gols». */
  var TAULES = [
    ['la temperatura, en graus, d\'una setmana', ['dl', 'dt', 'dc', 'dj', 'dv'], '°C', [8, 20]],
    ['els gols marcats en cinc partits', ['1r', '2n', '3r', '4t', '5è'], 'gols', [0, 5]],
    ['els alumnes que han faltat cada dia', ['dl', 'dt', 'dc', 'dj', 'dv'], 'alumnes', [0, 6]],
    ['els llibres llegits cada mes', ['gen', 'feb', 'mar', 'abr', 'mai'], 'llibres', [0, 7]]
  ];

  function taulaHtml(etq, vals) {
    return '<table class="dades"><tr><th>' + etq.join('</th><th>') +
           '</th></tr><tr><td>' + vals.join('</td><td>') + '</td></tr></table>';
  }

  reg({
    id: 'tau-maxim', sabers: ['1eso-alg-grafics', '2eso-est-variables'], nivell: 1,
    fn: function (r) {
      var t = r.tria(TAULES), vals, mx;
      /* Es torna a tirar fins que el màxim sigui únic: amb un empat la
         pregunta té dues respostes bones i el full de correcció en dona
         una per dolenta. Passava en el 31 % de les variants. */
      do {
        vals = t[1].map(function () { return r.entre(t[3][0], t[3][1]); });
        mx = Math.max.apply(null, vals);
      } while (vals.filter(function (v) { return v === mx; }).length > 1);
      return {
        cap: 'Aquesta taula recull ' + t[0] + '.',
        enunciat: taulaHtml(t[1], vals) +
                  ' Quin és el valor més gran, i a quin correspon?',
        resposta: '$' + mx + '$ ' + t[2] + ', ' + ambArticle(t[1][vals.indexOf(mx)]),
        passos: ['Es compara columna per columna: el màxim és $' + mx + '$.']
      };
    }
  });

  reg({
    id: 'tau-suma', sabers: ['1eso-alg-grafics', '2eso-est-variables'], nivell: 1,
    fn: function (r) {
      var t = r.tria(TAULES);
      var vals = t[1].map(function () { return r.entre(t[3][0], t[3][1]); });
      var s = vals.reduce(function (a, b) { return a + b; }, 0);
      return {
        cap: 'Aquesta taula recull ' + t[0] + '.',
        enunciat: taulaHtml(t[1], vals) + ' Quant sumen totes les dades?',
        resposta: '$' + s + '$ ' + t[2],
        passos: ['$' + vals.join(' + ') + ' = ' + s + '$']
      };
    }
  });

  /* ================================================ circumferència i cercle */
  reg({
    id: 'cir-diametre', capCal: true, sabers: ['2eso-esp-circumferencia'], nivell: 1,
    cap: 'Calcula el diàmetre d\'aquestes circumferències.',
    fn: function (r) {
      var v = r.entre(2, 14);
      return { enunciat: 'Radi de $' + v + '$ cm.',
               resposta: '$' + (2 * v) + '$ cm',
               passos: ['El diàmetre és el doble del radi: $2 \\cdot ' + v + ' = ' +
                        (2 * v) + '$ cm.'] };
    }
  });

  reg({
    id: 'cir-radi', capCal: true, sabers: ['2eso-esp-circumferencia'], nivell: 1,
    cap: 'Calcula el radi d\'aquestes circumferències.',
    fn: function (r) {
      var d = 2 * r.entre(3, 14);
      return { enunciat: 'Diàmetre de $' + d + '$ cm.',
               resposta: '$' + (d / 2) + '$ cm',
               passos: ['El radi és la meitat del diàmetre: $' + d + ' : 2 = ' +
                        (d / 2) + '$ cm.'] };
    }
  });

  reg({
    id: 'cir-area', capCal: true, sabers: ['2eso-esp-circumferencia'], nivell: 1,
    cap: 'Calcula l\'àrea d\'aquests cercles. Deixa el resultat en funció de $\\pi$.',
    fn: function (r) {
      var v = r.entre(2, 11);
      return { enunciat: 'Radi de $' + v + '$ cm.',
               resposta: '$' + (v * v) + '\\pi$ cm$^2$',
               passos: ['$A = \\pi r^2 = \\pi \\cdot ' + v + '^2 = ' + (v * v) +
                        '\\pi$ cm$^2$'] };
    }
  });

  /* ============================================================ semblança = */
  reg({
    id: 'sem-costat', capCal: true, sabers: SEM.concat('4eso-apl-esp-repas'), nivell: 1,
    cap: 'Dos polígons són semblants amb raó de semblança $k$. Si un costat del petit fa la mesura que es diu, quant fa el corresponent del gran?',
    fn: function (r) {
      var a = r.entre(3, 9), k = r.entre(2, 5);
      return { enunciat: 'Costat de $' + a + '$ cm, $k = ' + k + '$.',
               resposta: '$' + (a * k) + '$ cm',
               passos: ['Es multiplica pel factor de semblança: $' + a + ' \\cdot ' +
                        k + ' = ' + (a * k) + '$ cm.'] };
    }
  });

  reg({
    id: 'sem-rao', capCal: true, sabers: SEM.concat('4eso-apl-esp-repas'), nivell: 1,
    cap: 'Dues figures són semblants. Calcula la raó de semblança del gran respecte del petit.',
    fn: function (r) {
      var petit = r.entre(3, 8), k = r.entre(2, 5), gran = petit * k;
      return { enunciat: 'Costats corresponents de $' + gran + '$ cm i $' + petit + '$ cm.',
               resposta: '$k = ' + k + '$',
               passos: ['$k = \\dfrac{' + gran + '}{' + petit + '} = ' + k + '$'] };
    }
  });

  reg({
    id: 'sem-arees', capCal: true, sabers: SEM, nivell: 1,
    cap: 'Dues figures són semblants amb raó $k$. Quina és la raó entre les seves àrees?',
    fn: function (r) {
      var k = r.entre(2, 6);
      return { enunciat: '$k = ' + k + '$', resposta: '$' + (k * k) + '$',
               passos: ['La raó entre àrees és $k^2$: $' + k + '^2 = ' + (k * k) + '$.'] };
    }
  });

  /* ========================================= equacions de primer grau ===
     Els continguts que més pesen de l'àlgebra de 2n i 3r, i al banc de
     repàs només 7 de cada 30 ítems eren de nivell 1: la resta porten
     denominadors o són problemes llargs. Aquí, el que un alumne que ve de
     suspendre ha de saber fer abans de res: aïllar la x amb nombres petits
     i solucions enteres. Els passos són els que s'escriurien a la pissarra. */

  /** `3x`, `x`, `-x`: el coeficient 1 no s'escriu. */
  function termeX(a) {
    return a === 1 ? 'x' : a === -1 ? '-x' : a + 'x';
  }

  /** `3x + 5`, `3x - 5`, `3x` (sense el terme si és 0). */
  function binomi(a, b) {
    return termeX(a) + (b ? ' ' + sumand(b) : '');
  }

  reg({
    id: 'equ-un-pas', capCal: true, sabers: EQU, nivell: 1,
    cap: 'Resol aquestes equacions.',
    fn: function (r) {
      var x = r.entre(2, 15), forma = r.enter(3), a, eq, pas;
      if (forma === 0) {
        a = r.entre(2, 12);
        eq = 'x + ' + a + ' = ' + (x + a);
        pas = 'Es resta $' + a + '$ als dos membres: $x = ' + (x + a) + ' - ' + a + '$.';
      } else if (forma === 1) {
        a = r.entre(2, 9);
        eq = 'x - ' + a + ' = ' + (x - a);
        pas = 'Se suma $' + a + '$ als dos membres: $x = ' + restand(x - a) + ' + ' + a + '$.';
      } else {
        a = r.entre(2, 9);
        x = r.entre(2, 12);
        eq = a + 'x = ' + (a * x);
        pas = 'Es divideixen els dos membres entre $' + a + '$: $x = ' + (a * x) + ' : ' + a + '$.';
      }
      return { enunciat: '$' + eq + '$', resposta: '$x = ' + x + '$',
               passos: [pas, '$x = ' + x + '$']};
    }
  });

  reg({
    id: 'equ-dos-passos', capCal: true, sabers: EQU, nivell: 1,
    cap: 'Resol aquestes equacions.',
    fn: function (r) {
      var a = r.entre(2, 6), x = r.entre(1, 10), b;
      do { b = r.entre(-9, 12); } while (!b || a * x + b < 1);
      var c = a * x + b;
      return {
        enunciat: '$' + binomi(a, b) + ' = ' + c + '$',
        resposta: '$x = ' + x + '$',
        passos: ['El terme independent passa a l\'altre membre: $' + a + 'x = ' + c + ' ' +
                 sumand(-b) + ' = ' + (a * x) + '$.',
                 'Es divideix entre el coeficient de la $x$: $x = ' + (a * x) + ' : ' + a +
                 ' = ' + x + '$.',
                 'Comprovació: $' + a + ' \\cdot ' + x + ' ' + sumand(b) + ' = ' + c + '$.']
      };
    }
  });

  reg({
    id: 'equ-dues-bandes', capCal: true, sabers: EQU, nivell: 1,
    cap: 'Resol aquestes equacions.',
    fn: function (r) {
      var c = r.entre(1, 4), a = c + r.entre(1, 4), x = r.entre(1, 8), b, d;
      do {
        b = r.entre(-8, 10);
        d = (a - c) * x + b;
      } while (!b || !d || d > 40 || d < -20);
      var passos = ['Els termes amb $x$ a l\'esquerra i els nombres a la dreta: $' +
                    termeX(a) + ' - ' + termeX(c) + ' = ' + d + ' ' + sumand(-b) + '$.',
                    'Es redueix cada membre: $' + termeX(a - c) + ' = ' + (d - b) + '$.'];
      // Amb coeficient 1 la x ja queda aïllada: un tercer pas només repetiria.
      if (a - c > 1) passos.push('Es divideix entre $' + (a - c) + '$: $x = ' + x + '$.');
      return {
        enunciat: '$' + binomi(a, b) + ' = ' + binomi(c, d) + '$',
        resposta: '$x = ' + x + '$',
        passos: passos
      };
    }
  });

  reg({
    id: 'equ-parentesi', capCal: true, sabers: EQU, nivell: 1,
    cap: 'Resol aquestes equacions. Comença traient el parèntesi.',
    fn: function (r) {
      var a = r.entre(2, 5), x = r.entre(1, 9), b;
      do { b = r.entre(-5, 6); } while (!b || x + b < 1);
      var c = a * (x + b);
      return {
        enunciat: '$' + a + '(x ' + sumand(b) + ') = ' + c + '$',
        resposta: '$x = ' + x + '$',
        passos: ['Propietat distributiva: $' + a + 'x ' + sumand(a * b) + ' = ' + c + '$.',
                 '$' + a + 'x = ' + c + ' ' + sumand(-a * b) + ' = ' + (a * x) + '$.',
                 '$x = ' + (a * x) + ' : ' + a + ' = ' + x + '$.']
      };
    }
  });

  /* ================================================ comprovar la solució === */
  reg({
    id: 'alg-comprova', capCal: true,
    sabers: ['2eso-alg-llenguatge', '3eso-alg-llenguatge'], nivell: 1,
    cap: 'Comprova si el valor de $x$ que es dona és solució de l\'equació.',
    fn: function (r) {
      var a = r.entre(2, 5), x = r.entre(1, 6), b;
      do { b = r.entre(-6, 9); } while (!b || a * x + b < 1);
      var c = a * x + b;
      // La meitat de les vegades el valor proposat NO és la solució: si
      // sempre ho fos, la resposta seria sempre «sí» sense calcular res.
      var prova = r.enter(2) ? x : x + r.tria([-1, 1, 2]);
      var val = a * prova + b, es = val === c;
      return {
        enunciat: '$' + binomi(a, b) + ' = ' + c + '$, amb $x = ' + prova + '$',
        resposta: es ? 'Sí, és solució' : 'No, no és solució',
        passos: ['Se substitueix la $x$: $' + a + ' \\cdot ' + restand(prova) + ' ' +
                 sumand(b) + ' = ' + val + '$.',
                 es ? 'Dona $' + c + '$, el mateix que l\'altre membre: és solució.'
                    : 'Dona $' + val + '$ i no $' + c + '$: no és solució.']
      };
    }
  });

  /* ========================================= fraccions i nombres decimals = */
  var FRACCIONS_DECIMALS = [[1, 2], [3, 2], [5, 2], [1, 4], [3, 4], [5, 4], [1, 5],
                            [2, 5], [3, 5], [4, 5], [6, 5], [3, 10], [7, 10], [9, 10],
                            [1, 20], [3, 20]];

  reg({
    id: 'fd-a-decimal', capCal: true, sabers: ['1eso-num-fracdec'], nivell: 1,
    cap: 'Expressa aquestes fraccions com a nombre decimal.',
    fn: function (r) {
      var f = r.tria(FRACCIONS_DECIMALS), v = f[0] / f[1];
      return {
        enunciat: '$\\dfrac{' + f[0] + '}{' + f[1] + '}$',
        resposta: '$' + coma(v) + '$',
        passos: ['Es divideix el numerador entre el denominador: $' + f[0] + ' : ' +
                 f[1] + ' = ' + coma(v) + '$.']
      };
    }
  });

  reg({
    id: 'fd-a-fraccio', capCal: true, sabers: ['1eso-num-fracdec'], nivell: 1,
    cap: 'Expressa aquests nombres decimals com a fracció irreductible.',
    fn: function (r) {
      // Només dècimes: amb centèsimes el pas intermedi porta /100, i un
      // denominador de 100 el mesurador el compta, amb raó, com a càrrega.
      var n = r.tria([1, 2, 3, 4, 5, 6, 7, 8, 9, 12, 15, 25]);
      var g = mcd(n, 10), num = n / g, den = 10 / g;
      var passos = ['$' + coma(n / 10) + '$ són $' + n + '$ dècimes: $\\dfrac{' + n + '}{10}$.'];
      passos.push(g > 1
        ? 'Se simplifica dividint entre $' + g + '$: $\\dfrac{' + num + '}{' + den + '}$.'
        : 'Ja és irreductible: $' + n + '$ i $10$ no tenen cap divisor comú.');
      return {
        enunciat: '$' + coma(n / 10) + '$',
        resposta: '$\\dfrac{' + num + '}{' + den + '}$',
        passos: passos
      };
    }
  });

  /* =========================================== proporcionalitat directa == */
  /* a: enunciat; u: unitat del resultat; q: unitat de la quantitat;
     una: què val una unitat, per al pas intermedi. */
  var REGLES_DE_TRES = [
    { a: 'Si $A$ kg de pomes costen $P$ €, quant costen $B$ kg?',
      u: '€', q: 'kg', una: 'Preu d\'$1$ kg' },
    { a: 'Si $A$ llibretes costen $P$ €, quant costen $B$ llibretes?',
      u: '€', q: 'llibretes', una: 'Preu d\'una llibreta' },
    { a: 'Una aixeta omple $A$ galledes en $P$ minuts. Quant tarda a omplir-ne $B$?',
      u: 'minuts', q: 'galledes', una: 'Temps per omplir una galleda' },
    { a: 'Amb $A$ litres de benzina un cotxe fa $P$ km. Quants km fa amb $B$ litres?',
      u: 'km', q: 'litres', una: 'Km que fa amb $1$ litre' }
  ];

  reg({
    id: 'pro-regla-tres', sabers: ['2eso-alg-proporcionalitat'], nivell: 1, cap: '',
    fn: function (r) {
      var c = r.tria(REGLES_DE_TRES), u = r.entre(2, 6), a = r.entre(2, 6), b;
      if (c.u === 'km') u = r.tria([10, 12, 15]);
      do { b = r.entre(2, 10); } while (b === a);
      var p = a * u;
      return {
        enunciat: c.a.replace('$A$', '$' + a + '$').replace('$P$', '$' + p + '$')
                     .replace('$B$', '$' + b + '$'),
        resposta: '$' + (b * u) + '$ ' + c.u,
        passos: ['És proporcionalitat directa: el doble de quantitat, el doble de resultat.',
                 c.una + ': $' + p + ' : ' + a + ' = ' + u + '$ ' + c.u + '.',
                 'Per a $' + b + '$ ' + c.q + ': $' + b + ' \\cdot ' + u + ' = ' + (b * u) +
                 '$ ' + c.u + '.']
      };
    }
  });

  /* ======================================================= pla cartesià == */
  var QUADRANTS = { '++': 'primer', '-+': 'segon', '--': 'tercer', '+-': 'quart' };

  reg({
    id: 'pc-quadrant', capCal: true, sabers: ['2eso-alg-placartesia', '4eso-apl-esp-repas'], nivell: 1,
    cap: 'En quin quadrant és aquest punt?',
    fn: function (r) {
      var x = r.entre(1, 9) * (r.enter(2) ? 1 : -1), y = r.entre(1, 9) * (r.enter(2) ? 1 : -1);
      var lletra = r.tria(['A', 'B', 'C', 'P', 'Q']);
      var q = QUADRANTS[(x > 0 ? '+' : '-') + (y > 0 ? '+' : '-')];
      return {
        enunciat: '$' + lletra + '(' + x + ', ' + y + ')$',
        resposta: 'Al ' + q + ' quadrant',
        passos: ['La $x$ és ' + (x > 0 ? 'positiva' : 'negativa') + ' i la $y$ és ' +
                 (y > 0 ? 'positiva' : 'negativa') + ': ' + q + ' quadrant.']
      };
    }
  });

  /* ============================================== àrees i volums bàsics == */
  reg({
    id: 'are-basica', capCal: true, sabers: ['1eso-mes-arees', '2eso-mes-arees'], nivell: 1,
    cap: 'Calcula l\'àrea d\'aquestes figures.',
    fn: function (r) {
      var forma = r.enter(3), a, b;
      if (forma === 0) {
        a = r.entre(3, 12);
        return { enunciat: 'Un quadrat de $' + a + '$ cm de costat.',
                 resposta: '$' + (a * a) + '$ cm$^2$',
                 passos: ['$A = c^2 = ' + a + '^2 = ' + (a * a) + '$ cm$^2$'] };
      }
      if (forma === 1) {
        a = r.entre(4, 12);
        do { b = r.entre(2, 9); } while (b === a);
        return { enunciat: 'Un rectangle de $' + a + '$ cm de base i $' + b + '$ cm d\'alçada.',
                 resposta: '$' + (a * b) + '$ cm$^2$',
                 passos: ['$A = b \\cdot h = ' + a + ' \\cdot ' + b + ' = ' + (a * b) + '$ cm$^2$'] };
      }
      // Triangle: base parell, perquè l'àrea surti entera.
      a = 2 * r.entre(2, 7);
      b = r.entre(3, 9);
      return { enunciat: 'Un triangle de $' + a + '$ cm de base i $' + b + '$ cm d\'alçada.',
               resposta: '$' + (a * b / 2) + '$ cm$^2$',
               passos: ['$A = \\dfrac{b \\cdot h}{2} = \\dfrac{' + a + ' \\cdot ' + b + '}{2} = ' +
                        (a * b / 2) + '$ cm$^2$'] };
    }
  });

  reg({
    id: 'vol-cossos', capCal: true, sabers: ['2eso-mes-volums'], nivell: 1,
    cap: 'Calcula el volum d\'aquests cossos.',
    fn: function (r) {
      var a = r.entre(2, 9), b, c;
      if (r.enter(3) === 0) {
        return { enunciat: 'Un cub de $' + a + '$ cm d\'aresta.',
                 resposta: '$' + (a * a * a) + '$ cm$^3$',
                 passos: ['$V = a^3 = ' + a + '^3 = ' + (a * a * a) + '$ cm$^3$'] };
      }
      b = r.entre(2, 8);
      c = r.entre(2, 6);
      return { enunciat: 'Un ortoedre de dimensions $' + a + '$ cm, $' + b + '$ cm i $' + c + '$ cm.',
               resposta: '$' + (a * b * c) + '$ cm$^3$',
               passos: ['El volum és el producte de les tres dimensions.',
                        '$V = ' + a + ' \\cdot ' + b + ' \\cdot ' + c + ' = ' + (a * b * c) +
                        '$ cm$^3$'] };
    }
  });

  /* =====================================================================
     4t d'ESO · APLICADES
     Mateix criteri que la resta: nombres petits, enunciats curts, resultats
     nets. Els tipus d'exercici (Caça l'error, Quina família?, Decideix…)
     vénen de les activitats d'estudi del llibre `4eso-apl`.
     ===================================================================== */
  var REA = '4eso-apl-num-reals', PCT = '4eso-apl-num-percentatge',
      REP = '4eso-apl-esp-repas', LLE = '4eso-apl-alg-llenguatge',
      EQ2 = '4eso-apl-alg-equacio2', QUA = '4eso-apl-alg-quadratica',
      INV = '4eso-apl-alg-inversa', EXP = '4eso-apl-alg-exponencial',
      ESV = '4eso-apl-est-variable', COM = '4eso-apl-est-combinatoria',
      PRO = '4eso-apl-est-probabilitat';

  /** Fracció simplificada en LaTeX: 6/8 -> \dfrac{3}{4}; 4/2 -> 2. */
  function fracTex(a, b) {
    var g = mcd(Math.abs(a), b);
    a /= g; b /= g;
    return b === 1 ? String(a) : '\\dfrac{' + a + '}{' + b + '}';
  }

  /** Milers amb espai fi: 1000 -> 1\,000. */
  function milers(n) {
    var s = String(n);
    return s.length > 4 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, '\\,') : s;
  }

  /** `x + 3`, `x - 3`: un nombre amb el seu signe darrere de la x. */
  function xMes(a) { return a < 0 ? 'x - ' + (-a) : 'x + ' + a; }

  /* ----------------------------------------------------- nombres reals == */
  var NOMBRES = [
    ['12', 'Natural', '$12$ és un nombre natural (també és enter i racional).'],
    ['0', 'Natural', 'El zero compta com a natural (i és enter i racional).'],
    ['-5', 'Enter (no natural)', 'És negatiu: és enter, però no natural.'],
    ['-8', 'Enter (no natural)', 'És negatiu: és enter, però no natural.'],
    ['\\dfrac{3}{4}', 'Racional (no enter)', 'És una fracció que no és un nombre enter.'],
    ['-\\dfrac{2}{3}', 'Racional (no enter)', 'És una fracció que no és un nombre enter.'],
    ['2{,}5', 'Racional (no enter)', 'És un decimal exacte: $2{,}5 = \\dfrac{5}{2}$.'],
    ['0{,}25', 'Racional (no enter)', 'És un decimal exacte: $0{,}25 = \\dfrac{1}{4}$.'],
    ['\\sqrt{16}', 'Natural', '$\\sqrt{16} = 4$, que és natural.'],
    ['\\sqrt{25}', 'Natural', '$\\sqrt{25} = 5$, que és natural.'],
    ['\\sqrt{2}', 'Irracional', 'L\'arrel no és exacta: té infinits decimals sense període.'],
    ['\\sqrt{7}', 'Irracional', 'L\'arrel no és exacta: té infinits decimals sense període.'],
    ['\\pi', 'Irracional', '$\\pi$ té infinits decimals sense període.']
  ];

  reg({
    id: 'rea-classifica', capCal: true, sabers: [REA], nivell: 1,
    cap: 'Classifica aquest nombre: natural, enter, racional o irracional (el conjunt més petit on és).',
    fn: function (r) {
      var n = r.tria(NOMBRES);
      return { enunciat: '$' + n[0] + '$', resposta: n[1], passos: [n[2]] };
    }
  });

  var FDP = [[1, 2], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5], [1, 10],
             [3, 10], [7, 10], [9, 10], [1, 20], [3, 20]];

  reg({
    id: 'rea-fdp', capCal: true, sabers: [REA], nivell: 1,
    cap: 'Expressa aquesta fracció com a decimal i com a percentatge.',
    fn: function (r) {
      var f = r.tria(FDP), d = f[0] / f[1], p = 100 * f[0] / f[1];
      return {
        enunciat: '$\\dfrac{' + f[0] + '}{' + f[1] + '}$',
        resposta: '$' + coma(d) + '$ i $' + coma(p) + '\\,\\%$',
        passos: ['$' + f[0] + ' : ' + f[1] + ' = ' + coma(d) + '$.',
                 'El percentatge és el decimal per $100$: $' + coma(d) + ' \\cdot 100 = ' +
                 coma(p) + '\\,\\%$.']
      };
    }
  });

  reg({
    id: 'rea-pot-neg', capCal: true, sabers: [REA], nivell: 1,
    cap: 'Calcula aquestes potències.',
    fn: function (r) {
      var a = r.tria([2, 3, 5]), n = r.entre(1, a === 2 ? 4 : 2);
      if (r.enter(4) === 0) {
        return { enunciat: '$' + a + '^{0}$', resposta: '$1$',
                 passos: ['Tot nombre diferent de zero elevat a $0$ val $1$.'] };
      }
      return {
        enunciat: '$' + a + '^{-' + n + '}$',
        resposta: '$\\dfrac{1}{' + Math.pow(a, n) + '}$',
        passos: ['Un exponent negatiu inverteix la base: $' + a + '^{-' + n +
                 '} = \\dfrac{1}{' + a + '^{' + n + '}}$.',
                 '$\\dfrac{1}{' + Math.pow(a, n) + '}$']
      };
    }
  });

  var RACIONALS = [[4, 1, 2, 2], [9, 1, 2, 3], [25, 1, 2, 5], [8, 1, 3, 2], [27, 1, 3, 3],
                   [16, 1, 4, 2], [81, 1, 4, 3], [4, 3, 2, 8], [9, 3, 2, 27], [8, 2, 3, 4]];

  reg({
    id: 'rea-pot-racional', capCal: true, sabers: [REA], nivell: 1,
    cap: 'Calcula aquestes potències d\'exponent fraccionari.',
    fn: function (r) {
      var p = r.tria(RACIONALS), arrel = p[2] === 2 ? '\\sqrt{' + p[0] + '}' :
        '\\sqrt[' + p[2] + ']{' + p[0] + '}';
      var passos = ['L\'exponent $\\dfrac{' + p[1] + '}{' + p[2] + '}$ vol dir arrel ' +
                    (p[2] === 2 ? 'quadrada' : p[2] === 3 ? 'cúbica' : 'quarta') +
                    ' i, després, potència.'];
      if (p[1] === 1) passos.push('$' + arrel + ' = ' + p[3] + '$');
      else passos.push('$(' + arrel + ')^{' + p[1] + '} = ' + Math.round(Math.pow(p[0], 1 / p[2])) +
                       '^{' + p[1] + '} = ' + p[3] + '$');
      return { enunciat: '$' + p[0] + '^{\\frac{' + p[1] + '}{' + p[2] + '}}$',
               resposta: '$' + p[3] + '$', passos: passos };
    }
  });

  reg({
    id: 'rea-solucio-real', capCal: true, sabers: [REA], nivell: 1,
    cap: 'Té solució dins dels nombres reals aquesta equació? Si en té, troba-la.',
    fn: function (r) {
      var k = r.tria([1, 4, 9, 16, 25, 36, 49, 0, -1, -4, -9, -16, -25]), s;
      if (k > 0) {
        s = Math.round(Math.sqrt(k));
        return { enunciat: '$x^2 = ' + k + '$', resposta: '$x = ' + s + '$ o $x = -' + s + '$',
                 passos: ['Hi ha dos nombres que elevats al quadrat donen $' + k + '$.',
                          '$x = \\pm\\sqrt{' + k + '} = \\pm ' + s + '$']};
      }
      if (k === 0) {
        return { enunciat: '$x^2 = 0$', resposta: '$x = 0$',
                 passos: ['L\'únic nombre que al quadrat dona $0$ és el $0$.'] };
      }
      return { enunciat: '$x^2 = ' + k + '$', resposta: 'No té solució real',
               passos: ['Un quadrat mai no és negatiu: cap nombre real al quadrat dona $' + k + '$.'] };
    }
  });

  reg({
    id: 'rea-entre', capCal: true, sabers: [REA], nivell: 1,
    cap: 'Escriu un nombre decimal que sigui entre aquests dos.',
    fn: function (r) {
      var a = r.entre(1, 9), dec = r.enter(2) === 0, x, y, m;
      if (dec) { x = a / 10; y = (a + 1) / 10; m = (2 * a + 1) / 20; }
      else { x = a; y = a + 1; m = a + 0.5; }
      return {
        enunciat: '$' + coma(x) + '$ i $' + coma(y) + '$',
        resposta: 'Per exemple, $' + coma(m) + '$',
        passos: ['Entre dos nombres reals diferents n\'hi ha infinits.',
                 'El punt mig és $\\dfrac{' + coma(x) + ' + ' + coma(y) + '}{2} = ' + coma(m) + '$.']
      };
    }
  });

  /* ------------------------------------------------------ percentatge == */
  reg({
    id: 'pct-variacio', sabers: [PCT], nivell: 1, cap: '',
    fn: function (r) {
      var preu = r.tria([20, 40, 60, 80, 100, 120, 160, 200]), p = r.tria([10, 20, 25, 50]),
          puja = r.enter(2) === 0, f = puja ? 1 + p / 100 : 1 - p / 100, nou = preu * f;
      return {
        enunciat: 'Un preu de $' + preu + '$ € ' + (puja ? 'augmenta' : 'disminueix') + ' un $' + p +
          '\\,\\%$. Quin és el preu nou?',
        resposta: '$' + coma(nou) + '$ €',
        passos: ['El factor multiplicador és $1 ' + (puja ? '+' : '-') + ' ' + coma(p / 100) +
                 ' = ' + coma(f) + '$.',
                 '$' + preu + ' \\cdot ' + coma(f) + ' = ' + coma(nou) + '$ €']
      };
    }
  });

  reg({
    id: 'pct-factor', capCal: true, sabers: [PCT], nivell: 1,
    cap: 'Escriu el factor multiplicador d\'aquest canvi.',
    fn: function (r) {
      var p = r.tria([5, 8, 10, 12, 15, 20, 25, 30, 40, 50]), puja = r.enter(2) === 0,
          f = puja ? 1 + p / 100 : 1 - p / 100;
      return {
        enunciat: (puja ? 'Un augment' : 'Una disminució') + ' del $' + p + '\\,\\%$',
        resposta: '$' + coma(f) + '$',
        passos: ['$1 ' + (puja ? '+' : '-') + ' ' + coma(p / 100) + ' = ' + coma(f) + '$']
      };
    }
  });

  var TIPUS_IVA = [[21, [100, 200, 300, 400, 500]], [10, [20, 40, 50, 80, 150, 200]],
                   [4, [25, 50, 75, 100, 200]]];

  reg({
    id: 'pct-iva', sabers: [PCT], nivell: 1, cap: '',
    fn: function (r) {
      var t = r.tria(TIPUS_IVA), base = r.tria(t[1]), iva = base * t[0] / 100;
      return {
        enunciat: 'Un producte costa $' + base + '$ € sense IVA. Hi apliquem un IVA del $' + t[0] +
          '\\,\\%$. Quant val amb IVA?',
        resposta: '$' + coma(base + iva) + '$ €',
        passos: ['L\'IVA és el $' + t[0] + '\\,\\%$ de $' + base + '$: $' + base + ' \\cdot ' +
                 coma(t[0] / 100) + ' = ' + coma(iva) + '$ €.',
                 '$' + base + ' + ' + coma(iva) + ' = ' + coma(base + iva) + '$ €']
      };
    }
  });

  reg({
    id: 'pct-interes', sabers: [PCT], nivell: 1, cap: '',
    fn: function (r) {
      var c, p, t, i;
      if (r.enter(2) === 0) {
        c = r.tria([100, 200, 300, 500]); p = r.tria([2, 3, 4, 5]); t = r.entre(2, 3);
        i = c / 100 * p * t;
        return {
          enunciat: 'Un crèdit de $' + milers(c) + '$ € al $' + p + '\\,\\%$ d\'interès simple anual, ' +
            'durant $' + t + '$ anys. Quin interès es paga?',
          resposta: '$' + milers(i) + '$ €',
          passos: ['Cada any paguem el $' + p + '\\,\\%$ de $' + milers(c) + '$: $' + (c / 100 * p) + '$ €.',
                   '$' + (c / 100 * p) + ' \\cdot ' + t + ' = ' + milers(i) + '$ €']
        };
      }
      c = r.tria([100, 200, 500]); p = r.tria([10, 20]);
      var f = 1 + p / 100, fin = Math.round(c * f * f * 100) / 100;
      return {
        enunciat: '$' + c + '$ € al $' + p + '\\,\\%$ d\'interès compost anual. Quant hi haurà al cap de $2$ anys?',
        resposta: '$' + coma(fin) + '$ €',
        passos: ['El factor de cada any és $' + coma(f) + '$.',
                 '$' + milers(c) + ' \\cdot ' + coma(f) + '^2 = ' + coma(fin) + '$ €']
      };
    }
  });

  reg({
    id: 'pct-ponderada', sabers: [PCT], nivell: 1, cap: '',
    fn: function (r) {
      var pes = r.tria([[40, 60], [30, 70], [25, 75], [20, 80]]), a = r.entre(3, 9), b = r.entre(3, 9),
          nota = (a * pes[0] + b * pes[1]) / 100;
      return {
        enunciat: 'L\'examen val un $' + pes[0] + '\\,\\%$ de la nota i el treball, un $' + pes[1] +
          '\\,\\%$. Si has tret un $' + a + '$ a l\'examen i un $' + b + '$ al treball, quina és la nota final?',
        resposta: '$' + coma(nota) + '$',
        passos: ['Mitjana ponderada: cada nota es multiplica pel seu pes.',
                 '$' + a + ' \\cdot ' + coma(pes[0] / 100) + ' + ' + b + ' \\cdot ' +
                 coma(pes[1] / 100) + ' = ' + coma(nota) + '$']
      };
    }
  });

  reg({
    id: 'pct-sectors', sabers: [PCT], nivell: 1, cap: '',
    fn: function (r) {
      var tot, ang, n;
      if (r.enter(2) === 0) {
        tot = r.tria([40, 60, 72, 120, 180, 360]); ang = r.tria([30, 45, 60, 90, 120, 180]);
        n = tot * ang / 360;
        if (n !== Math.floor(n)) { tot = 360; n = ang; }
        return {
          enunciat: 'En una enquesta a $' + tot + '$ persones, un sector del diagrama de sectors fa $' +
            ang + '^\\circ$. Quantes persones representa?',
          resposta: '$' + n + '$ persones',
          passos: ['Cada sector és ' + ang + ' graus de $360$: ' + ang + ' : 360.',
                   '$' + tot + ' \\cdot ' + ang + ' : 360 = ' + n + '$']
        };
      }
      ang = r.tria([18, 36, 45, 72, 90, 144, 180]);
      return {
        enunciat: 'Quin percentatge representa un sector de $' + ang + '^\\circ$ en un diagrama de sectors?',
        resposta: '$' + coma(ang / 3.6) + '\\,\\%$',
        passos: ['Tot el cercle són $360^\\circ$ i és el $100\\,\\%$.',
                 '$' + ang + ' : 360 \\cdot 100 = ' + coma(ang / 3.6) + '\\,\\%$']
      };
    }
  });

  /* -------------------------------------------- repàs: Pitàgores i semblança */
  var TRIPLETS = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [7, 24, 25]];

  reg({
    id: 'pit-hipotenusa', sabers: [REP], nivell: 1, cap: '',
    fn: function (r) {
      var t = r.tria(TRIPLETS);
      return {
        enunciat: 'Un triangle rectangle té els catets de $' + t[0] + '$ cm i $' + t[1] +
          '$ cm. Quant fa la hipotenusa?',
        resposta: '$' + t[2] + '$ cm',
        passos: ['$h^2 = ' + t[0] + '^2 + ' + t[1] + '^2 = ' + (t[0] * t[0] + t[1] * t[1]) + '$',
                 '$h = \\sqrt{' + t[2] * t[2] + '} = ' + t[2] + '$ cm']
      };
    }
  });

  reg({
    id: 'pit-catet', sabers: [REP], nivell: 1, cap: '',
    fn: function (r) {
      var t = r.tria(TRIPLETS);
      return {
        enunciat: 'Un triangle rectangle té la hipotenusa de $' + t[2] + '$ cm i un catet de $' + t[0] +
          '$ cm. Quant fa l\'altre catet?',
        resposta: '$' + t[1] + '$ cm',
        passos: ['$c^2 = ' + t[2] + '^2 - ' + t[0] + '^2 = ' + (t[2] * t[2] - t[0] * t[0]) + '$',
                 '$c = \\sqrt{' + t[1] * t[1] + '} = ' + t[1] + '$ cm']
      };
    }
  });

  /* ------------------------------------------ llenguatge algebraic i identitats */
  reg({
    id: 'ide-notable', capCal: true, sabers: [LLE], nivell: 1,
    cap: 'Desenvolupa amb una identitat notable.',
    fn: function (r) {
      var a = r.entre(1, 9), f = r.enter(3);
      if (f === 0) {
        return { enunciat: '$(x + ' + a + ')^2$', resposta: '$x^2 + ' + (2 * a) + 'x + ' + (a * a) + '$',
                 passos: ['$(a+b)^2 = a^2 + 2ab + b^2$', '$x^2 + 2 \\cdot x \\cdot ' + a + ' + ' + a +
                          '^2 = x^2 + ' + (2 * a) + 'x + ' + (a * a) + '$'] };
      }
      if (f === 1) {
        return { enunciat: '$(x - ' + a + ')^2$', resposta: '$x^2 - ' + (2 * a) + 'x + ' + (a * a) + '$',
                 passos: ['$(a-b)^2 = a^2 - 2ab + b^2$', '$x^2 - 2 \\cdot x \\cdot ' + a + ' + ' + a +
                          '^2 = x^2 - ' + (2 * a) + 'x + ' + (a * a) + '$'] };
      }
      return { enunciat: '$(x + ' + a + ')(x - ' + a + ')$', resposta: '$x^2 - ' + (a * a) + '$',
               passos: ['$(a+b)(a-b) = a^2 - b^2$', '$x^2 - ' + a + '^2 = x^2 - ' + (a * a) + '$'] };
    }
  });

  reg({
    id: 'ide-caca', capCal: true, sabers: [LLE], nivell: 1,
    cap: 'Aquesta igualtat és correcta? Si no ho és, escriu-ne la bona.',
    fn: function (r) {
      var a = r.entre(2, 9), f = r.enter(4);
      if (f === 0) {
        return { enunciat: '$(x + ' + a + ')^2 = x^2 + ' + a * a + '$', resposta: 'No: falta el doble producte',
                 passos: ['Falta el terme del mig: $2 \\cdot x \\cdot ' + a + '$.',
                          '$(x + ' + a + ')^2 = x^2 + ' + 2 * a + 'x + ' + a * a + '$'] };
      }
      if (f === 1) {
        return { enunciat: '$(x - ' + a + ')^2 = x^2 - ' + a * a + '$', resposta: 'No: falta el doble producte',
                 passos: ['El quadrat d\'una resta no és la resta de quadrats.',
                          '$(x - ' + a + ')^2 = x^2 - ' + 2 * a + 'x + ' + a * a + '$'] };
      }
      if (f === 2) {
        return { enunciat: '$(x + ' + a + ')(x - ' + a + ') = x^2 - ' + a * a + '$', resposta: 'Sí, és correcta',
                 passos: ['Suma per diferència: $(a+b)(a-b) = a^2 - b^2$.'] };
      }
      return { enunciat: '$(x + ' + a + ')^2 = x^2 + ' + 2 * a + 'x + ' + a * a + '$', resposta: 'Sí, és correcta',
               passos: ['Quadrat d\'una suma: $a^2 + 2ab + b^2$ amb $a = x$ i $b = ' + a + '$.'] };
    }
  });

  reg({
    id: 'ide-patro', capCal: true, sabers: [LLE, '4eso-apl-lec'], nivell: 1,
    cap: 'Escriu la fórmula del terme que ocupa el lloc $n$ d\'aquesta successió.',
    fn: function (r) {
      var d = r.entre(2, 6), c = r.entre(-2, 6), t = [], i;
      for (i = 1; i <= 4; i++) t.push(d * i + c);
      var f = d + 'n' + (c > 0 ? ' + ' + c : c < 0 ? ' - ' + (-c) : '');
      return {
        enunciat: '$' + t.join(', ') + ', \\ldots$',
        resposta: '$' + f + '$',
        passos: ['Cada terme és $' + d + '$ més gran que l\'anterior: la fórmula comença per $' + d + 'n$.',
                 'Per al lloc $1$: $' + d + ' \\cdot 1 = ' + d + '$ i cal arribar a $' + t[0] +
                 '$, o sigui ' + (c === 0 ? 'no cal res més' : (c > 0 ? 'sumar ' : 'restar ') + Math.abs(c)) + '.',
                 '$a_n = ' + f + '$']
      };
    }
  });

  /* ------------------------------------------------- equació de 2n grau == */
  reg({
    id: 'eq2-x2k', capCal: true, sabers: [EQ2], nivell: 1,
    cap: 'Resol aquestes equacions.',
    fn: function (r) {
      var a = r.tria([1, 1, 2, 3, 4, 5]), s = r.entre(2, 9), k = a * s * s;
      return {
        enunciat: '$' + (a === 1 ? '' : a) + 'x^2 = ' + k + '$',
        resposta: '$x = ' + s + '$ o $x = -' + s + '$',
        passos: a === 1 ? ['$x = \\pm\\sqrt{' + k + '} = \\pm ' + s + '$']
          : ['Primer es divideix entre $' + a + '$: $x^2 = ' + (k / a) + '$.',
             '$x = \\pm\\sqrt{' + (k / a) + '} = \\pm ' + s + '$']
      };
    }
  });

  reg({
    id: 'eq2-parentesi', capCal: true, sabers: [EQ2], nivell: 1,
    cap: 'Resol aquestes equacions.',
    fn: function (r) {
      var a = r.entre(-5, 5) || 3, s = r.entre(2, 5), k = s * s;
      return {
        enunciat: '$(' + xMes(-a) + ')^2 = ' + k + '$',
        resposta: '$x = ' + (a + s) + '$ o $x = ' + (a - s) + '$',
        passos: ['Arrel als dos membres: $' + xMes(-a) + ' = \\pm ' + s + '$.',
                 '$x = ' + a + ' + ' + s + ' = ' + (a + s) + '$ i $x = ' + a + ' - ' + s + ' = ' + (a - s) + '$']
      };
    }
  });

  reg({
    id: 'eq2-producte', capCal: true, sabers: [EQ2], nivell: 1,
    cap: 'Resol aquestes equacions.',
    fn: function (r) {
      var p = r.entre(-6, 6) || 2, q;
      do { q = r.entre(-6, 6); } while (q === p);
      if (r.enter(4) === 0) {
        p = r.entre(2, 8);
        return { enunciat: '$x(x - ' + p + ') = 0$', resposta: '$x = 0$ o $x = ' + p + '$',
                 passos: ['Un producte és zero si un dels factors ho és.',
                          '$x = 0$ o $x - ' + p + ' = 0$, o sigui $x = ' + p + '$']};
      }
      return {
        enunciat: '$(' + xMes(-p) + ')(' + xMes(-q) + ') = 0$',
        resposta: '$x = ' + p + '$ o $x = ' + q + '$',
        passos: ['Un producte és zero si un dels factors ho és.',
                 '$' + xMes(-p) + ' = 0 \\Rightarrow x = ' + p + '$',
                 '$' + xMes(-q) + ' = 0 \\Rightarrow x = ' + q + '$']
      };
    }
  });

  reg({
    id: 'eq2-incompleta', capCal: true, sabers: [EQ2], nivell: 1,
    cap: 'Resol aquestes equacions traient factor comú.',
    fn: function (r) {
      var a = r.entre(2, 9), m = r.tria([1, 2, 3]);
      return {
        enunciat: '$' + (m === 1 ? '' : m) + 'x^2 - ' + (m * a) + 'x = 0$',
        resposta: '$x = 0$ o $x = ' + a + '$',
        passos: ['Factor comú: $' + (m === 1 ? '' : m) + 'x\\,(x - ' + a + ') = 0$.',
                 '$x = 0$ o $x - ' + a + ' = 0$, o sigui $x = ' + a + '$']
      };
    }
  });

  reg({
    id: 'eq2-discriminant', capCal: true, sabers: [EQ2], nivell: 1,
    cap: 'Calcula el discriminant i digues quantes solucions reals té l\'equació.',
    fn: function (r) {
      var a = r.tria([1, 1, 2]), b = r.entre(-6, 6), c = r.entre(-4, 5), d = b * b - 4 * a * c,
          eq = (a === 1 ? '' : a) + 'x^2 ' + (b < 0 ? '- ' + (-b) : '+ ' + b) + 'x ' +
               (c < 0 ? '- ' + (-c) : '+ ' + c) + ' = 0';
      return {
        enunciat: '$' + eq + '$',
        resposta: '$\\Delta = ' + d + '$: ' + (d > 0 ? 'dues solucions' : d === 0 ? 'una solució' : 'cap solució real'),
        passos: ['$\\Delta = b^2 - 4ac = ' + restand(b) + '^2 - 4 \\cdot ' + a + ' \\cdot ' + restand(c) +
                 ' = ' + d + '$',
                 d > 0 ? '$\\Delta > 0$: dues solucions.' : d === 0 ? '$\\Delta = 0$: una solució.' :
                 '$\\Delta < 0$: cap solució real.']
      };
    }
  });

  reg({
    id: 'eq2-formula', capCal: true, sabers: [EQ2], nivell: 1,
    cap: 'Resol amb la fórmula de l\'equació de 2n grau.',
    fn: function (r) {
      var p = r.entre(-5, 5) || 1, q;
      do { q = r.entre(-5, 5); } while (q === p || q === 0);
      var b = -(p + q), c = p * q, d = b * b - 4 * c, s = Math.abs(p - q), lo = Math.min(p, q),
          hi = Math.max(p, q);
      var eq = 'x^2' + (b === 0 ? '' : b < 0 ? ' - ' + (-b) + 'x' : ' + ' + b + 'x') +
               (c < 0 ? ' - ' + (-c) : ' + ' + c) + ' = 0';
      return {
        enunciat: '$' + eq + '$',
        resposta: '$x = ' + hi + '$ o $x = ' + lo + '$',
        passos: ['$a = 1$, $b = ' + b + '$, $c = ' + c + '$.',
                 '$\\Delta = ' + restand(b) + '^2 - 4 \\cdot 1 \\cdot ' + restand(c) + ' = ' + d +
                 '$ i $\\sqrt{\\Delta} = ' + s + '$.',
                 '$x = \\dfrac{' + (-b) + ' \\pm ' + s + '}{2}$, o sigui $x = ' + hi + '$ i $x = ' + lo + '$']
      };
    }
  });

  /* ---------------------------------------------------- funció quadràtica == */
  /** ax^2 + bx + c en LaTeX, sense termes nuls. */
  function polinomi2(a, b, c) {
    var t = (a === 1 ? '' : a === -1 ? '-' : a) + 'x^2';
    if (b) t += (b < 0 ? ' - ' : ' + ') + (Math.abs(b) === 1 ? '' : Math.abs(b)) + 'x';
    if (c) t += (c < 0 ? ' - ' : ' + ') + Math.abs(c);
    return t;
  }

  reg({
    id: 'qua-valor', sabers: [QUA], nivell: 1, cap: '',
    fn: function (r) {
      var a = r.tria([1, 2, 3, -1, -2]), c = r.entre(-4, 5), x = r.entre(-3, 3) || 2, y = a * x * x + c;
      return {
        enunciat: 'Calcula $y$ quan $x = ' + x + '$ a la funció $y = ' + polinomi2(a, 0, c) + '$.',
        resposta: '$y = ' + y + '$',
        passos: ['$y = ' + (a === 1 ? '' : a === -1 ? '-' : a + ' \\cdot ') + '(' + x + ')^2' +
                 (c ? (c < 0 ? ' - ' : ' + ') + Math.abs(c) : '') + '$',
                 '$y = ' + (a * x * x) + (c ? (c < 0 ? ' - ' : ' + ') + Math.abs(c) : '') + ' = ' + y + '$']
      };
    }
  });

  reg({
    id: 'qua-vertex', sabers: [QUA], nivell: 1, cap: '',
    fn: function (r) {
      var a = r.tria([1, 1, 2, -1]), h = r.entre(-3, 4) || 2, c = r.entre(-5, 6), b = -2 * a * h,
          k = a * h * h + b * h + c;
      return {
        enunciat: 'Troba el vèrtex de la paràbola $y = ' + polinomi2(a, b, c) + '$.',
        resposta: '$V(' + h + ', ' + k + ')$',
        passos: ['L\'abscissa del vèrtex és $x = \\dfrac{-b}{2a} = \\dfrac{' + (-b) + '}{' + (2 * a) +
                 '} = ' + h + '$.',
                 'Es substitueix: $y = ' + a + ' \\cdot ' + restand(h) + '^2 + ' + restand(b) + ' \\cdot ' +
                 restand(h) + ' + ' + restand(c) + ' = ' + k + '$.',
                 '$V(' + h + ', ' + k + ')$']
      };
    }
  });

  reg({
    id: 'qua-talls', sabers: [QUA], nivell: 1, cap: '',
    fn: function (r) {
      var p = r.entre(-4, 5) || 2, q;
      do { q = r.entre(-4, 5) || 3; } while (q === p);
      var lo = Math.min(p, q), hi = Math.max(p, q);
      return {
        enunciat: 'Troba els punts de tall amb els eixos de $y = ' + polinomi2(1, -(p + q), p * q) + '$.',
        resposta: 'Eix $OY$: $(0, ' + (p * q) + ')$. Eix $OX$: $(' + lo + ', 0)$ i $(' + hi + ', 0)$',
        passos: ['Amb $x = 0$: $y = ' + (p * q) + '$.',
                 'Amb $y = 0$: $' + polinomi2(1, -(p + q), p * q) + ' = 0$ es factoritza com $(' +
                 xMes(-p) + ')(' + xMes(-q) + ') = 0$.',
                 'Les arrels són $x = ' + lo + '$ i $x = ' + hi + '$.']
      };
    }
  });

  reg({
    id: 'qua-branques', capCal: true, sabers: [QUA], nivell: 1,
    cap: 'Les branques d\'aquesta paràbola van cap amunt o cap avall? Té un màxim o un mínim?',
    fn: function (r) {
      var a = r.tria([1, 2, 3, -1, -2, -3]), b = r.entre(-4, 4), c = r.entre(-3, 5);
      return {
        enunciat: '$y = ' + polinomi2(a, b, c) + '$',
        resposta: a > 0 ? 'Cap amunt; el vèrtex és un mínim' : 'Cap avall; el vèrtex és un màxim',
        passos: ['Només importa el signe de $a = ' + a + '$.',
                 a > 0 ? '$a > 0$: les branques van cap amunt i el vèrtex és el punt més baix (mínim).' :
                         '$a < 0$: les branques van cap avall i el vèrtex és el punt més alt (màxim).']
      };
    }
  });

  /* --------------------------------- magnituds inversament proporcionals == */
  reg({
    id: 'inv-regla', sabers: [INV], nivell: 1, cap: '',
    fn: function (r) {
      var k = r.tria([12, 24, 36, 48, 60]), ds = divisors(k).filter(function (d) { return d > 1 && d < k; }),
          n1 = r.tria(ds), n2;
      do { n2 = r.tria(ds); } while (n2 === n1);
      var c = r.enter(2) === 0;
      return {
        enunciat: c ? '$' + n1 + '$ obrers fan una feina en $' + (k / n1) + '$ dies. Quants dies trigarien $' + n2 + '$ obrers?'
                    : 'Amb $' + n1 + '$ aixetes, un dipòsit s\'omple en $' + (k / n1) +
                      '$ h. Quantes hores trigaria amb $' + n2 + '$ aixetes?',
        resposta: '$' + (k / n2) + '$ ' + (c ? 'dies' : 'hores'),
        passos: ['Si n\'hi ha més, triguen menys: és inversa. El producte es manté: $' + n1 + ' \\cdot ' +
                 (k / n1) + ' = ' + k + '$.', '$' + k + ' : ' + n2 + ' = ' + (k / n2) + '$']
      };
    }
  });

  reg({
    id: 'inv-area', sabers: [INV], nivell: 1, cap: '',
    fn: function (r) {
      var A = r.tria([12, 18, 24, 36, 48]), b = r.tria(divisors(A).filter(function (d) { return d > 1 && d < A; }));
      return {
        enunciat: 'Un rectangle té $' + A + '$ cm$^2$ d\'àrea. Si la base fa $' + b + '$ cm, quant fa l\'alçada?',
        resposta: '$' + (A / b) + '$ cm',
        passos: ['Base i alçada són inversament proporcionals: $b \\cdot h = A = ' + A + '$.',
                 '$h = ' + A + ' : ' + b + ' = ' + (A / b) + '$ cm']
      };
    }
  });

  reg({
    id: 'inv-hiperbola', sabers: [INV], nivell: 1, cap: '',
    fn: function (r) {
      var k = r.tria([6, 8, 12, 24, -6, -12]), x;
      if (r.enter(2) === 0) {
        x = r.tria(divisors(Math.abs(k)).filter(function (d) { return d <= 8; }));
        return {
          enunciat: 'Calcula $y$ quan $x = ' + x + '$ a la funció $y = \\dfrac{' + k + '}{x}$.',
          resposta: '$y = ' + (k / x) + '$',
          passos: ['$y = \\dfrac{' + k + '}{' + x + '} = ' + (k / x) + '$']
        };
      }
      return {
        enunciat: 'En quins quadrants és la gràfica de $y = \\dfrac{' + k + '}{x}$?',
        resposta: k > 0 ? 'Al primer i al tercer' : 'Al segon i al quart',
        passos: [k > 0 ? '$k > 0$: $x$ i $y$ tenen el mateix signe, o sigui primer i tercer quadrant.' :
                         '$k < 0$: $x$ i $y$ tenen signe contrari, o sigui segon i quart quadrant.']
      };
    }
  });

  reg({
    id: 'inv-tipus', capCal: true, sabers: [INV], nivell: 1,
    cap: 'Aquestes magnituds són directament o inversament proporcionals? Quina és la constant?',
    fn: function (r) {
      var directa = r.enter(2) === 0, k, xs = [1, 2, 3, 4], ys;
      if (directa) { k = r.entre(2, 6); ys = xs.map(function (x) { return k * x; }); }
      else { k = r.tria([12, 24]); ys = xs.map(function (x) { return k / x; }); }
      return {
        enunciat: '$x$: $' + xs.join(',\\ ') + '$ i $y$: $' + ys.join(',\\ ') + '$',
        resposta: directa ? 'Directament proporcionals; $y/x = ' + k + '$' :
                            'Inversament proporcionals; $x \\cdot y = ' + k + '$',
        passos: directa ? ['El quocient $y/x$ és sempre $' + k + '$.'] :
                          ['El producte $x \\cdot y$ és sempre $' + k + '$.']
      };
    }
  });

  /* ------------------------------------------------ funció exponencial == */
  reg({
    id: 'exp-valor', capCal: true, sabers: [EXP], nivell: 1,
    cap: 'Calcula el valor de la funció.',
    fn: function (r) {
      var b = r.tria([2, 3, 5, 10]), x = r.entre(0, b === 2 ? 5 : 3), c = r.tria([1, 1, 2, 3]),
          v = c * Math.pow(b, x);
      return {
        enunciat: '$f(x) = ' + (c === 1 ? '' : c + ' \\cdot ') + b + '^x$, calcula $f(' + x + ')$',
        resposta: '$' + v + '$',
        passos: ['$f(' + x + ') = ' + (c === 1 ? '' : c + ' \\cdot ') + b + '^{' + x + '} = ' +
                 (c === 1 ? '' : c + ' \\cdot ') + Math.pow(b, x) + ' = ' + v + '$']
      };
    }
  });

  reg({
    id: 'exp-creix', capCal: true, sabers: [EXP], nivell: 1,
    cap: 'Aquesta funció creix o decreix? Per què?',
    fn: function (r) {
      var b = r.tria([2, 3, 10, 1.5, 0.5, 0.1, 0.8, 0.25]), creix = b > 1;
      return {
        enunciat: '$y = ' + coma(b) + '^x$',
        resposta: creix ? 'Creix, perquè $b > 1$' : 'Decreix, perquè $0 < b < 1$',
        passos: ['En $y = b^x$ només importa la base: ' + (creix ? '$b = ' + coma(b) + ' > 1$, i cada pas de $x$ multiplica per $b$: augmenta.'
                 : '$b = ' + coma(b) + '$ és entre $0$ i $1$, i cada pas de $x$ multiplica per un nombre més petit que $1$: disminueix.')]
      };
    }
  });

  reg({
    id: 'exp-context', sabers: [EXP], nivell: 1, cap: '',
    fn: function (r) {
      var n0 = r.tria([5, 10, 20]), f = r.tria([2, 3]), t = r.entre(2, 4), v = n0 * Math.pow(f, t);
      return {
        enunciat: 'Un cultiu té $' + n0 + '$ bacteris i ' + (f === 2 ? 'es duplica' : 'es triplica') +
          ' cada hora. Quants bacteris hi haurà al cap de $' + t + '$ hores?',
        resposta: '$' + milers(v) + '$ bacteris',
        passos: ['Cada hora es multiplica per $' + f + '$: $N = ' + n0 + ' \\cdot ' + f + '^{' + t + '}$.',
                 '$' + n0 + ' \\cdot ' + Math.pow(f, t) + ' = ' + milers(v) + '$']
      };
    }
  });

  reg({
    id: 'exp-tall', capCal: true, sabers: [EXP], nivell: 1,
    cap: 'On talla la gràfica aquest eix?',
    fn: function (r) {
      var c = r.tria([2, 3, 4, 5]), b = r.tria([2, 3, 5]);
      if (r.enter(2) === 0) {
        return { enunciat: 'L\'eix $OY$ a $y = ' + c + ' \\cdot ' + b + '^x$',
                 resposta: '$(0, ' + c + ')$',
                 passos: ['Amb $x = 0$: $y = ' + c + ' \\cdot ' + b + '^0 = ' + c + ' \\cdot 1 = ' + c + '$.'] };
      }
      return { enunciat: 'L\'eix $OX$ a $y = ' + c + ' \\cdot ' + b + '^x$',
               resposta: 'No el talla mai',
               passos: ['$' + b + '^x$ és sempre positiu, així que $y$ mai no val $0$.',
                        'L\'eix $OX$ (la recta $y = 0$) és una asímptota.'] };
    }
  });

  /* ---------------------------------------------------- estadística == */
  reg({
    id: 'est-recorregut', capCal: true, sabers: [ESV], nivell: 1,
    cap: 'Calcula el recorregut d\'aquestes dades.',
    fn: function (r) {
      var n = r.entre(6, 8), d = [], i;
      for (i = 0; i < n; i++) d.push(r.entre(2, 30));
      var mx = Math.max.apply(null, d), mn = Math.min.apply(null, d);
      return {
        enunciat: '$' + d.join(',\\ ') + '$',
        resposta: '$' + (mx - mn) + '$',
        passos: ['Recorregut = dada més gran $-$ dada més petita.', '$' + mx + ' - ' + mn + ' = ' + (mx - mn) + '$']
      };
    }
  });

  reg({
    id: 'est-desv-mitjana', capCal: true, sabers: [ESV], nivell: 1,
    cap: 'Calcula la mitjana i la desviació mitjana d\'aquestes dades.',
    fn: function (r) {
      var m, ds, s, n = 4, i;
      do {
        m = r.entre(6, 14); ds = [];
        for (i = 0; i < n - 1; i++) ds.push(r.entre(-4, 4));
        ds.push(-ds.reduce(function (a, b) { return a + b; }, 0));
        s = ds.reduce(function (a, b) { return a + Math.abs(b); }, 0);
      } while (s % n !== 0 || s === 0 || Math.abs(ds[n - 1]) > 6);
      var xs = ds.map(function (d) { return m + d; });
      return {
        enunciat: '$' + xs.join(',\\ ') + '$',
        resposta: 'Mitjana $' + m + '$; desviació mitjana $' + (s / n) + '$',
        passos: ['Mitjana: $\\dfrac{' + xs.join(' + ') + '}{' + n + '} = ' + m + '$.',
                 'Desviacions respecte de la mitjana (en valor absolut): $' +
                 ds.map(function (d) { return Math.abs(d); }).join(',\\ ') + '$.',
                 'Desviació mitjana: $\\dfrac{' + s + '}{' + n + '} = ' + (s / n) + '$']
      };
    }
  });

  reg({
    id: 'est-marca', capCal: true, sabers: [ESV], nivell: 1,
    cap: 'Quina és la marca de classe d\'aquest interval?',
    fn: function (r) {
      var a = r.tria([0, 10, 20, 30, 40, 150, 160]), w = r.tria([4, 10, 20]), b = a + w;
      return {
        enunciat: '$[' + a + ',\\ ' + b + ')$',
        resposta: '$' + (a + b) / 2 + '$',
        passos: ['La marca de classe és el punt mig de l\'interval.', '$\\dfrac{' + a + ' + ' + b + '}{2} = ' + (a + b) / 2 + '$']
      };
    }
  });

  reg({
    id: 'est-mitjana-taula', capCal: true, sabers: [ESV], nivell: 1,
    cap: 'Calcula la mitjana d\'aquesta taula de freqüències.',
    fn: function (r) {
      var xs, fs, n, s, i;
      do {
        xs = [r.entre(1, 3), 0, 0]; xs[1] = xs[0] + r.entre(1, 2); xs[2] = xs[1] + r.entre(1, 2);
        fs = [r.entre(1, 5), r.entre(1, 5), r.entre(1, 5)];
        n = fs[0] + fs[1] + fs[2];
        s = xs[0] * fs[0] + xs[1] * fs[1] + xs[2] * fs[2];
      } while (s % n !== 0);
      var termes = [];
      for (i = 0; i < 3; i++) termes.push(xs[i] + ' \\cdot ' + fs[i]);
      return {
        enunciat: '$x_i$: $' + xs.join(',\\ ') + '$ i $f_i$: $' + fs.join(',\\ ') + '$',
        resposta: '$' + s / n + '$',
        passos: ['$\\bar{x} = \\dfrac{\\sum x_i f_i}{N} = \\dfrac{' + termes.join(' + ') + '}{' + n + '}$',
                 '$= \\dfrac{' + s + '}{' + n + '} = ' + s / n + '$']
      };
    }
  });

  /* ------------------------------------------------------ combinatòria == */
  reg({
    id: 'com-factorial', capCal: true, sabers: [COM], nivell: 1,
    cap: 'Calcula aquests factorials.',
    fn: function (r) {
      var n = r.entre(3, 6), fact = function (k) { return k <= 1 ? 1 : k * fact(k - 1); }, m;
      if (r.enter(2) === 0) {
        return { enunciat: '$' + n + '!$', resposta: '$' + fact(n) + '$',
                 passos: ['$' + n + '! = ' + Array.apply(null, Array(n)).map(function (_, i) { return n - i; }).join(' \\cdot ') +
                          ' = ' + fact(n) + '$'] };
      }
      m = n - r.entre(1, 2);
      var factors = Array.apply(null, Array(n - m)).map(function (_, i) { return n - i; });
      return { enunciat: '$' + n + '! : ' + m + '!$', resposta: '$' + fact(n) / fact(m) + '$',
               passos: ['Es simplifica: $' + n + '! : ' + m + '! = ' + factors.join(' \\cdot ') +
                        (factors.length > 1 ? ' = ' + fact(n) / fact(m) : '') + '$'] };
    }
  });

  var CONJUNTS = [['camises', 'pantalons', 'conjunts'], ['entrants', 'plats principals', 'menús'],
                  ['samarretes', 'gorres', 'combinacions'], ['camins de A a B', 'camins de B a C', 'rutes de A a C']];

  reg({
    id: 'com-arbre', sabers: [COM], nivell: 1, cap: '',
    fn: function (r) {
      var c = r.tria(CONJUNTS), a = r.entre(2, 4), b = r.entre(2, 4);
      return {
        enunciat: 'Hi ha $' + a + '$ ' + c[0] + ' i $' + b + '$ ' + c[1] + '. Quants ' + c[2] + ' diferents es poden fer?',
        resposta: '$' + a * b + '$',
        passos: ['Cada una de les $' + a + '$ primeres opcions es combina amb les $' + b + '$ segones (un arbre).',
                 '$' + a + ' \\cdot ' + b + ' = ' + a * b + '$']
      };
    }
  });

  reg({
    id: 'com-permutacions', sabers: [COM], nivell: 1, cap: '',
    fn: function (r) {
      var n = r.entre(3, 5), v = [1, 1, 2, 6, 24, 120][n];
      return {
        enunciat: 'De quantes maneres es poden posar $' + n + '$ persones en fila?',
        resposta: '$' + v + '$',
        passos: ['Per al primer lloc hi ha $' + n + '$ opcions, per al segon una menys, i així successivament.',
                 '$' + n + '! = ' + v + '$']
      };
    }
  });

  /* ------------------------------------------------------- probabilitat == */
  /** `1 bola vermella`, `3 boles vermelles`. */
  function boles(n, color) {
    return n === 1 ? '$1$ bola ' + color[0] : '$' + n + '$ boles ' + color[1];
  }

  reg({
    id: 'pro-bossa', sabers: [PRO], nivell: 1, cap: '',
    fn: function (r) {
      var v = r.entre(1, 4), b = r.entre(1, 4), g = r.entre(0, 3), t = v + b + g, c = r.enter(3),
          col = [['vermella', 'vermelles'], ['blava', 'blaves'], ['verda', 'verdes']],
          q = c === 2 && g === 0 ? 0 : c, n = [v, b, g][q];
      return {
        enunciat: 'Una bossa té ' + boles(v, col[0]) + (g ? ', ' : ' i ') + boles(b, col[1]) +
          (g ? ' i ' + boles(g, col[2]) : '') + '. En traiem una a l\'atzar. Quina és la probabilitat que sigui ' +
          col[q][0] + '?',
        resposta: '$' + fracTex(n, t) + '$',
        passos: ['Casos favorables: $' + n + '$. Casos possibles: $' + t + '$.',
                 '$P = \\dfrac{' + n + '}{' + t + '}' + (fracTex(n, t) !== '\\dfrac{' + n + '}{' + t + '}' ? ' = ' + fracTex(n, t) : '') + '$']
      };
    }
  });

  reg({
    id: 'pro-contrari', sabers: [PRO], nivell: 2, cap: '',
    fn: function (r) {
      var d = r.tria([4, 5, 8, 10]), n = r.entre(1, d - 1);
      return {
        enunciat: 'La probabilitat que un tren arribi tard és $' + fracTex(n, d) +
          '$. Quina és la probabilitat que no arribi tard?',
        resposta: '$' + fracTex(d - n, d) + '$',
        passos: ['El succés contrari: $P(\\text{no A}) = 1 - P(A)$.', '$1 - ' + fracTex(n, d) + ' = ' + fracTex(d - n, d) + '$']
      };
    }
  });

  var DAU = [['un nombre parell', 3], ['un nombre imparell', 3], ['un múltiple de $3$', 2],
             ['un nombre més gran que $4$', 2], ['un $6$', 1], ['un nombre més petit que $3$', 2],
             ['un nombre que no sigui el $6$', 5]];

  reg({
    id: 'pro-dau', sabers: [PRO], nivell: 1, cap: '',
    fn: function (r) {
      var e = r.tria(DAU);
      return {
        enunciat: 'Llancem un dau. Quina és la probabilitat de treure ' + e[0] + '?',
        resposta: '$' + fracTex(e[1], 6) + '$',
        passos: ['Casos possibles: $6$. Casos favorables: $' + e[1] + '$.', '$P = \\dfrac{' + e[1] + '}{6}' + (fracTex(e[1], 6) !== '\\dfrac{' + e[1] + '}{6}' ? ' = ' + fracTex(e[1], 6) : '') + '$']
      };
    }
  });

  reg({
    id: 'pro-venn', sabers: [PRO], nivell: 2, cap: '',
    fn: function (r) {
      var t = r.tria([20, 30]), a, b, c;
      do {
        a = r.entre(6, t * 0.6); b = r.entre(4, t * 0.5); c = r.entre(1, Math.min(a, b) - 1);
      } while (a + b - c >= t);
      var u = a + b - c;
      return {
        enunciat: 'De $' + t + '$ alumnes, $' + a + '$ fan anglès, $' + b + '$ francès i $' + c +
          '$ les dues llengües. Quina és la probabilitat que un alumne triat faci anglès o francès?',
        resposta: '$' + fracTex(u, t) + '$',
        passos: ['$P(A \\cup B) = P(A) + P(B) - P(A \\cap B)$, comptant alumnes: $' + a + ' + ' + b + ' - ' + c + ' = ' + u + '$.',
                 '$P = \\dfrac{' + u + '}{' + t + '}' + (fracTex(u, t) !== '\\dfrac{' + u + '}{' + t + '}' ? ' = ' + fracTex(u, t) : '') + '$']
      };
    }
  });

  reg({
    id: 'pro-condicionada', sabers: [PRO], nivell: 1, cap: '',
    fn: function (r) {
      var t = r.tria([20, 30]), a = r.tria([10, 12, 15]), c = r.tria([4, 5, 6, 8, 9]);
      while (c >= a) c--;
      return {
        enunciat: 'A una classe de $' + t + '$ alumnes, $' + a + '$ fan teatre i $' + c +
          '$ fan teatre i música. Triem un alumne que fa teatre: quina és la probabilitat que també faci música?',
        resposta: '$' + fracTex(c, a) + '$',
        passos: ['Ara només mirem els que fan teatre: $' + a + '$ alumnes.',
                 '$P(\\text{música} \\mid \\text{teatre}) = \\dfrac{' + c + '}{' + a + '} = ' + fracTex(c, a) + '$']
      };
    }
  });

  reg({
    id: 'pro-composta', sabers: [PRO], nivell: 1, cap: '',
    fn: function (r) {
      var v = r.entre(2, 4), b = r.entre(2, 3), t = v + b, num = v * (v - 1), den = t * (t - 1);
      return {
        enunciat: 'Una urna té $' + v + '$ boles vermelles i $' + b + '$ blaves. En traiem dues, una darrere de l\'altra i sense tornar-les. ' +
          'Quina és la probabilitat que les dues siguin vermelles?',
        resposta: '$' + fracTex(num, den) + '$',
        passos: ['Primera: $\\dfrac{' + v + '}{' + t + '}$. Segona (queden $' + (t - 1) + '$ boles, $' + (v - 1) + '$ vermelles): $\\dfrac{' + (v - 1) + '}{' + (t - 1) + '}$.',
                 '$P = \\dfrac{' + v + '}{' + t + '} \\cdot \\dfrac{' + (v - 1) + '}{' + (t - 1) + '} = ' + fracTex(num, den) + '$']
      };
    }
  });

  reg({
    id: 'pro-grans-nombres', sabers: [PRO], nivell: 1, cap: '',
    fn: function (r) {
      var n = r.tria([50, 100]), c = n / 2 + r.entre(-n / 10, n / 10), f = c / n;
      return {
        enunciat: 'Tirem una moneda $' + n + '$ cops i surten $' + c + '$ cares. Quina és la freqüència relativa de cares?',
        resposta: '$' + coma(f) + '$',
        passos: ['$f = ' + c + ' : ' + n + ' = ' + coma(f) + '$.',
                 'Llei dels grans nombres: amb molts més tirs, la freqüència s\'acosta a la probabilitat teòrica, $0{,}5$.']
      };
    }
  });

  /* ------------------------------------------- comprensió lectora de 4t == */
  var PROBLEMES4 = [
    ['Un telèfon de $100$ € té un $20\\,\\%$ de rebaixa i un val de $5$ €. Quant paguem?',
     '$75$ €', ['La rebaixa és el $20\\,\\%$ de $100$, o sigui $20$ €: queden $80$ €.', 'Amb el val: $80 - 5 = 75$ €.']],
    ['Una escala de $5$ m s\'aguanta contra una paret amb el peu a $3$ m de la paret. A quina alçada toca la paret?',
     '$4$ m', ['L\'escala és la hipotenusa: $h = 5$, un catet val $3$.', '$c^2 = 5^2 - 3^2 = 16$, o sigui $c = 4$ m.']],
    ['Un rectangle té un perímetre de $20$ cm i un costat de $4$ cm. Quant fa l\'altre costat?',
     '$6$ cm', ['Dos costats de $4$ cm sumen $8$ cm.', 'Queden $20 - 8 = 12$ cm per als altres dos: $6$ cm cadascun.']],
    ['La mitjana de $4$ notes és $7$. Tres notes són $6$, $8$ i $5$. Quina és la quarta?',
     '$9$', ['La suma de les quatre és $4 \\cdot 7 = 28$.', '$28 - (6 + 8 + 5) = 9$.']],
    ['En una classe de $25$ alumnes, $10$ practiquen futbol. Quin percentatge no practica futbol?',
     '$60\\,\\%$', ['Practica futbol el $\\dfrac{10}{25} = 0{,}4$, o sigui el $40\\,\\%$.', 'No practica futbol el $100 - 40 = 60\\,\\%$.']],
    ['Un préstec de $1\\,000$ € amb un $5\\,\\%$ d\'interès simple anual dura $2$ anys. Quin és el total que cal tornar?',
     '$1\\,100$ €', ['Interès d\'un any: $1\\,000 \\cdot 0{,}05 = 50$ €.', 'En dos anys: $100$ €, i el total és $1\\,100$ €.']],
    ['Un diagrama de sectors té $80$ persones. El sector dels que van en bus fa $90^\\circ$. Quantes en són?',
     '$20$ persones', ['$90^\\circ$ són la quarta part de $360^\\circ$ ($90 \\cdot 4 = 360$).', 'Són la quarta part de les persones: $80 : 4 = 20$.']],
    ['Una funció dona el benefici d\'una botiga: $B(x) = -x^2 + 6x$, amb $x$ en centenars d\'euros invertits. Per a $x = 2$, quin és el benefici?',
     '$8$', ['$B(2) = -2^2 + 6 \\cdot 2 = -4 + 12 = 8$.']],
    ['En un joc es guanya el $20\\,\\%$ de les partides. Si jugues $50$ vegades, quantes en guanyaràs?',
     '$10$ partides', ['El $20\\,\\%$ de $50$ és $50 \\cdot 0{,}20 = 10$.']],
    ['Un autocar fa $120$ km a $60$ km/h. A $80$ km/h, quant trigaria?',
     '$1{,}5$ h', ['A $60$ km/h triga $120 : 60 = 2$ h; la velocitat i el temps són inversament proporcionals.',
                  'A $80$ km/h: $120 : 80 = 1{,}5$ h.']]
  ];

  reg({
    id: 'lec-problema4', sabers: ['4eso-apl-lec'], nivell: 1, cap: '',
    fn: function (r) {
      var p = r.tria(PROBLEMES4);
      return { enunciat: p[0], resposta: p[1], passos: p[2] };
    }
  });

  var VOCAB4 = [
    ['Què és la hipotenusa d\'un triangle rectangle?', 'El costat oposat a l\'angle recte (el més llarg)',
     'Els altres dos costats s\'anomenen catets.'],
    ['Què és el discriminant d\'una equació de segon grau?', 'L\'expressió $\\Delta = b^2 - 4ac$',
     'Segons el seu signe sabem quantes solucions reals té l\'equació.'],
    ['Què és el vèrtex d\'una paràbola?', 'El punt més alt o més baix de la paràbola',
     'És on la paràbola canvia de creixent a decreixent, o a l\'inrevés.'],
    ['Què és un nombre irracional?', 'Un nombre amb infinits decimals sense període',
     'No es pot escriure com a fracció; per exemple $\\sqrt{2}$ o $\\pi$.'],
    ['Què és el factor multiplicador d\'un augment del $20\\,\\%$?', '$1{,}20$',
     'Multiplicar per $1{,}20$ equival a sumar el $20\\,\\%$.'],
    ['Què és una asímptota?', 'Una recta de la qual la gràfica s\'acosta sense arribar-hi a tocar',
     'A $y = 2^x$, l\'eix $OX$ n\'és una.'],
    ['Què és el recorregut d\'un conjunt de dades?', 'La diferència entre la dada més gran i la més petita',
     'Mesura la dispersió de les dades.'],
    ['Què és la probabilitat condicionada?', 'La probabilitat d\'un succés sabent que ja n\'ha passat un altre',
     'Es llegeix «$P(A \\mid B)$»: probabilitat d\'$A$ sabent $B$.'],
    ['Què és la marca de classe d\'un interval?', 'El punt mig de l\'interval',
     'Representa tots els valors del grup en els càlculs.'],
    ['Què són magnituds inversament proporcionals?', 'Quan una es multiplica, l\'altra es divideix pel mateix nombre',
     'El seu producte es manté constant.']
  ];

  reg({
    id: 'lec-vocab4', sabers: ['4eso-apl-lec'], nivell: 1, cap: '',
    fn: function (r) {
      var d = r.tria(VOCAB4);
      return { enunciat: d[0], resposta: d[1], passos: [d[2]] };
    }
  });

  /* ------------------------------------------------------------- interfície */

  /**
   * Construeix una variant. `llavor` identifica la variant: la mateixa
   * llavor dona sempre exactament el mateix ítem.
   */
  function crea(id, llavor) {
    var g = PER_ID[id];
    if (!g) return null;
    var r = new glob.Atzar('propi|' + id + '|' + llavor);
    var it = g.fn(r);
    return {
      gen: id,
      llavor: String(llavor),
      sabers: g.sabers.slice(),
      nivell: g.nivell,
      cap: it.cap !== undefined ? it.cap : (g.cap || ''),
      capCal: g.capCal,
      figuraCal: g.figuraCal,
      enunciat: it.enunciat || '',
      figura: it.figura || null,
      resposta: it.resposta,
      passos: it.passos || []
    };
  }

  glob.GENERADORS = { llista: G, perId: PER_ID, crea: crea };

  /* Perquè `tools/genera.js` el pugui carregar amb Node sense navegador. */
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = glob.GENERADORS;
  }
})(typeof window !== 'undefined' ? window : global);
