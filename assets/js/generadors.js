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
  var G = [], PER_ID = {};

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
  var ALG = ['1eso-alg-llenguatge', '2eso-alg-llenguatge'];
  var LEC = ['1eso-lec', '2eso-lec', '3eso-lec'];
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
    id: 'sem-costat', capCal: true, sabers: SEM, nivell: 1,
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
    id: 'sem-rao', capCal: true, sabers: SEM, nivell: 1,
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
