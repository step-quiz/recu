# -*- coding: utf-8 -*-
"""
Ítems propis, per als continguts que el banc de `repas` no cobreix.

Motiu. El banc de repàs està fet per a l'entrada a 1r de batxillerat i deixa
sis sabers de 1r d'ESO sense cap pregunta (arrel quadrada, elements
geomètrics, magnituds i unitats, llenguatge algebraic, comprensió lectora) o
gairebé (angles 1, perímetres 2, polígons 3). A més, en filtrar els nombres
negatius de divisibilitat, el que queda són tot problemes d'aplicació del
m.c.m. i no queda cap exercici mecànic curt.

Criteri, que ve del departament després de revisar proves impreses:

  - nombres PETITS. Res de descomposicions de 3850 ni de potències que donen
    -759375. Aquests alumnes no van aprovar la matèria en tot el curs.
  - enunciats CURTS. El que els bloqueja és haver de llegir i decidir.
  - resultats NETS. Cap arrel no exacta donada com a dada.

Tot és determinista: la mateixa llavor dona sempre els mateixos ítems, i per
tant `banc.js` no canvia si no es toca aquest fitxer.

    python3 tools/generador.py --comprova     # verifica les solucions

Cada ítem té la forma que espera compila.py:

    dict(id=..., sabers=[...], cap=..., enunciat=..., figura=None|svg,
         resposta=..., passos=[...], dif=1)
"""
import argparse
import math
import random
from fractions import Fraction

LLAVOR = 20260904          # canviar-la regenera tots els ítems


# --------------------------------------------------------------- utilitats
def divisors(n):
    d = [i for i in range(1, int(n ** 0.5) + 1) if n % i == 0]
    return sorted(set(d + [n // i for i in d]))


def es_primer(n):
    if n < 2:
        return False
    for i in range(2, int(n ** 0.5) + 1):
        if n % i == 0:
            return False
    return True


def factoritza(n):
    f, d = {}, 2
    while d * d <= n:
        while n % d == 0:
            f[d] = f.get(d, 0) + 1
            n //= d
        d += 1
    if n > 1:
        f[n] = f.get(n, 0) + 1
    return f


def tex_factors(f):
    """{2:2, 3:1} -> '2^{2} \\cdot 3'"""
    parts = []
    for b in sorted(f):
        parts.append(f"{b}^{{{f[b]}}}" if f[b] > 1 else str(b))
    return " \\cdot ".join(parts)


def llista(vals, conj="i"):
    vals = [str(v) for v in vals]
    if len(vals) == 1:
        return vals[0]
    return ", ".join(vals[:-1]) + f" {conj} " + vals[-1]


def coma(x):
    """3.5 -> '3{,}5' (la coma decimal, en LaTeX)"""
    s = f"{x:g}"
    return s.replace(".", "{,}")


# ------------------------------------------------------------------ figures
def svg_angle(graus, etiqueta):
    """Un angle marcat sobre dues semirectes des d'un vèrtex."""
    import math as m
    r, x0, y0 = 46, 30, 130
    x1, y1 = x0 + 150, y0
    x2 = x0 + 150 * m.cos(m.radians(graus))
    y2 = y0 - 150 * m.sin(m.radians(graus))
    ax, ay = x0 + r, y0
    bx = x0 + r * m.cos(m.radians(graus))
    by = y0 - r * m.sin(m.radians(graus))
    gran = 1 if graus > 180 else 0
    return (
        f'<svg class="figura" viewBox="0 0 220 160" role="img" '
        f'xmlns="http://www.w3.org/2000/svg"><title>Angle de {etiqueta}.</title>'
        f'<line x1="{x0}" y1="{y0}" x2="{x1:.1f}" y2="{y1:.1f}" '
        f'stroke="currentColor" stroke-width="2"/>'
        f'<line x1="{x0}" y1="{y0}" x2="{x2:.1f}" y2="{y2:.1f}" '
        f'stroke="currentColor" stroke-width="2"/>'
        f'<path d="M{ax:.1f},{ay:.1f} A{r},{r} 0 {gran},0 {bx:.1f},{by:.1f}" '
        f'fill="none" stroke="var(--fig-marca)" stroke-width="2"/>'
        f'<text x="{x0 + 62}" y="{y0 - 14}" class="fig-etq petita">{etiqueta}</text>'
        f'</svg>')


def svg_rectes(posicio):
    """Dues rectes: secants, paral·leles o perpendiculars."""
    cos = {
        "paral·leles": '<line x1="20" y1="45" x2="200" y2="75" stroke="currentColor" '
                       'stroke-width="2"/><line x1="20" y1="95" x2="200" y2="125" '
                       'stroke="currentColor" stroke-width="2"/>',
        "perpendiculars": '<line x1="30" y1="30" x2="190" y2="130" stroke="currentColor" '
                          'stroke-width="2"/><line x1="180" y1="35" x2="42" y2="127" '
                          'stroke="currentColor" stroke-width="2"/>'
                          '<rect x="103" y="72" width="14" height="14" fill="none" '
                          'stroke="var(--fig-marca)" stroke-width="2" '
                          'transform="rotate(32 110 79)"/>',
        "secants": '<line x1="25" y1="40" x2="195" y2="120" stroke="currentColor" '
                   'stroke-width="2"/><line x1="40" y1="130" x2="185" y2="35" '
                   'stroke="currentColor" stroke-width="2"/>',
    }[posicio]
    return (f'<svg class="figura" viewBox="0 0 220 160" role="img" '
            f'xmlns="http://www.w3.org/2000/svg">'
            f'<title>Dues rectes en un pla.</title>{cos}</svg>')


def svg_rectangle(a, b, unitat="cm"):
    return (f'<svg class="figura" viewBox="0 0 230 150" role="img" '
            f'xmlns="http://www.w3.org/2000/svg">'
            f'<title>Rectangle de {a} per {b} {unitat}.</title>'
            f'<rect x="35" y="30" width="160" height="85" '
            f'fill="var(--fig-plena)" stroke="currentColor" stroke-width="2"/>'
            f'<text x="115" y="24" text-anchor="middle" class="fig-etq petita">'
            f'{a} {unitat}</text>'
            f'<text x="27" y="77" text-anchor="end" class="fig-etq petita">'
            f'{b} {unitat}</text></svg>')


def svg_cercle():
    return ('<svg class="figura" viewBox="0 0 200 180" role="img" '
            'xmlns="http://www.w3.org/2000/svg">'
            '<title>Circumferència amb tres segments marcats: a, b i c.</title>'
            '<circle cx="100" cy="90" r="70" fill="var(--fig-plena)" '
            'stroke="currentColor" stroke-width="2"/>'
            '<line x1="100" y1="90" x2="170" y2="90" stroke="var(--fig-marca)" '
            'stroke-width="2.5"/>'
            '<line x1="30" y1="90" x2="170" y2="90" stroke="currentColor" '
            'stroke-width="1" stroke-dasharray="4 3"/>'
            '<line x1="51" y1="41" x2="149" y2="41" stroke="var(--fig-marca)" '
            'stroke-width="2.5"/>'
            '<circle cx="100" cy="90" r="3" fill="currentColor"/>'
            '<text x="137" y="84" class="fig-etq petita">a</text>'
            '<text x="60" y="105" class="fig-etq petita">b</text>'
            '<text x="96" y="34" class="fig-etq petita">c</text></svg>')


# ------------------------------------------------------------- generadors
def divisibilitat(rnd):
    """Exercicis mecànics i curts: el banc de repàs no en té cap."""
    items = []
    sab = ["1eso-num-divisibilitat", "2eso-num-divisibilitat"]

    for n in rnd.sample(range(3, 13), 5):
        muls = [n * k for k in range(1, 6)]
        items.append(dict(
            sabers=sab, cap="Escriu els cinc primers múltiples d'aquests nombres.",
            enunciat=f"${n}$", figura=None,
            resposta=f"${llista(muls)}$",
            passos=[f"Es multiplica ${n}$ per $1, 2, 3, 4$ i $5$: ${llista(muls)}$."],
            dif=1))

    for n in rnd.sample([12, 16, 18, 20, 24, 28, 30, 36, 40, 45], 5):
        d = divisors(n)
        items.append(dict(
            sabers=sab, cap="Escriu tots els divisors d'aquests nombres.",
            enunciat=f"${n}$", figura=None,
            resposta=f"${llista(d)}$",
            passos=[f"Es busquen les parelles que multiplicades donen ${n}$.",
                    f"Divisors: ${llista(d)}$."],
            dif=1))

    for n in rnd.sample([17, 21, 23, 27, 29, 31, 33, 39, 41, 49, 51, 53], 6):
        primer = es_primer(n)
        if primer:
            passos = [f"${n}$ només és divisible per $1$ i per ell mateix."]
        else:
            d = [x for x in divisors(n) if x not in (1, n)][0]
            passos = [f"${n}$ és divisible per ${d}$, i per tant té més "
                      f"divisors que $1$ i ell mateix."]
        items.append(dict(
            sabers=sab, cap="Digues si aquests nombres són primers o compostos.",
            enunciat=f"${n}$", figura=None,
            resposta="Primer" if primer else "Compost",
            passos=passos, dif=1))

    for n in rnd.sample([24, 35, 45, 56, 70, 84, 90, 105, 120, 132], 6):
        crit = [c for c in (2, 3, 5) if n % c == 0]
        items.append(dict(
            sabers=sab,
            cap="Digues per quins dels nombres $2$, $3$ i $5$ són divisibles, "
                "sense fer la divisió.",
            enunciat=f"${n}$", figura=None,
            resposta=("Per " + llista(crit)) if crit else "Per cap dels tres",
            passos=[
                f"Per $2$: {'acaba en xifra parella, sí' if n % 2 == 0 else 'no acaba en xifra parella, no'}.",
                f"Per $3$: les xifres sumen ${sum(int(c) for c in str(n))}$, "
                f"{'múltiple de $3$, sí' if n % 3 == 0 else 'que no és múltiple de $3$, no'}.",
                f"Per $5$: {'acaba en $0$ o $5$, sí' if n % 5 == 0 else 'no acaba en $0$ ni en $5$, no'}."],
            dif=1))

    for n in rnd.sample([18, 20, 24, 28, 36, 40, 45, 50, 54, 60, 72, 84], 7):
        f = factoritza(n)
        items.append(dict(
            sabers=sab, cap="Fes la descomposició en factors primers.",
            enunciat=f"${n}$", figura=None,
            resposta=f"${tex_factors(f)}$",
            passos=[f"Es va dividint entre primers de menor a major.",
                    f"${n} = {tex_factors(f)}$"],
            dif=1))

    parells = [(12, 18), (8, 12), (15, 20), (16, 24), (10, 25),
               (14, 21), (9, 12), (20, 30), (6, 15), (18, 24)]
    for a, b in rnd.sample(parells, 6):
        g = math.gcd(a, b)
        items.append(dict(
            sabers=sab, cap="Calcula el màxim comú divisor.",
            enunciat=f"${a}$ i ${b}$", figura=None,
            resposta=f"$\\operatorname{{m.c.d.}}({a}, {b}) = {g}$",
            passos=[f"${a} = {tex_factors(factoritza(a))}$ i "
                    f"${b} = {tex_factors(factoritza(b))}$.",
                    f"Es prenen els factors comuns amb el menor exponent: ${g}$."],
            dif=1))
    for a, b in rnd.sample(parells, 6):
        m = a * b // math.gcd(a, b)
        items.append(dict(
            sabers=sab, cap="Calcula el mínim comú múltiple.",
            enunciat=f"${a}$ i ${b}$", figura=None,
            resposta=f"$\\operatorname{{m.c.m.}}({a}, {b}) = {m}$",
            passos=[f"${a} = {tex_factors(factoritza(a))}$ i "
                    f"${b} = {tex_factors(factoritza(b))}$.",
                    f"Es prenen tots els factors amb el major exponent: ${m}$."],
            dif=1))
    return items


def arrel_quadrada(rnd):
    items = []
    sab = ["1eso-num-arrel"]

    for n in rnd.sample(range(2, 21), 8):
        items.append(dict(
            sabers=sab, cap="Calcula aquestes arrels quadrades.",
            enunciat=f"$\\sqrt{{{n * n}}}$", figura=None,
            resposta=f"${n}$",
            passos=[f"Es busca el nombre que multiplicat per ell mateix dona "
                    f"${n * n}$: ${n} \\cdot {n} = {n * n}$."],
            dif=1))

    quadrats = [k * k for k in range(1, 21)]
    for n in rnd.sample([x for x in range(5, 200) if x not in quadrats], 6):
        b = int(n ** 0.5)
        items.append(dict(
            sabers=sab,
            cap="Aquestes arrels no són exactes. Entre quins dos nombres "
                "enters consecutius es troben?",
            enunciat=f"$\\sqrt{{{n}}}$", figura=None,
            resposta=f"Entre ${b}$ i ${b + 1}$",
            passos=[f"${b}^2 = {b * b}$ i ${b + 1}^2 = {(b + 1) ** 2}$.",
                    f"Com que ${b * b} < {n} < {(b + 1) ** 2}$, l'arrel és "
                    f"entre ${b}$ i ${b + 1}$."],
            dif=1))

    for n in rnd.sample([16, 20, 25, 30, 36, 40, 49, 50, 64, 72, 81, 90], 6):
        exacte = int(n ** 0.5) ** 2 == n
        items.append(dict(
            sabers=sab, cap="Digues si aquests nombres són quadrats perfectes.",
            enunciat=f"${n}$", figura=None,
            resposta="Sí" if exacte else "No",
            passos=([f"$\\sqrt{{{n}}} = {int(n ** 0.5)}$, que és un nombre enter."]
                    if exacte else
                    [f"${int(n ** 0.5)}^2 = {int(n ** 0.5) ** 2}$ i "
                     f"${int(n ** 0.5) + 1}^2 = {(int(n ** 0.5) + 1) ** 2}$: "
                     f"${n}$ queda entremig."]),
            dif=1))
    return items


def magnituds(rnd):
    items = []
    sab = ["1eso-mes-magnituds"]

    conv = [("km", "m", 1000), ("m", "cm", 100), ("cm", "mm", 10),
            ("kg", "g", 1000), ("L", "mL", 1000), ("m", "mm", 1000)]
    for gran, petit, f in conv:
        for v in rnd.sample([2, 2.5, 3, 3.5, 4, 5, 7.5], 2):
            items.append(dict(
                sabers=sab, cap=f"Expressa aquestes mesures en {petit}.",
                enunciat=f"${coma(v)}$ {gran}", figura=None,
                resposta=f"${coma(v * f)}$ {petit}",
                passos=[f"$1$ {gran} $= {f}$ {petit}.",
                        f"${coma(v)} \\cdot {f} = {coma(v * f)}$ {petit}."],
                dif=1))

    for gran, petit, f in conv:
        for v in rnd.sample([f // 2, f * 2, f * 3, int(f * 1.5)], 1):
            items.append(dict(
                sabers=sab, cap=f"Expressa aquestes mesures en {gran}.",
                enunciat=f"${v}$ {petit}", figura=None,
                resposta=f"${coma(v / f)}$ {gran}",
                passos=[f"$1$ {gran} $= {f}$ {petit}.",
                        f"${v} : {f} = {coma(v / f)}$ {gran}."],
                dif=1))

    for a, b, f in [("m^2", "cm^2", 10000), ("cm^2", "mm^2", 100),
                    ("km^2", "m^2", 1000000)]:
        for v in rnd.sample([2, 3, 5], 1):
            items.append(dict(
                sabers=sab, cap=f"Expressa aquestes superfícies en ${b}$.",
                enunciat=f"${v}$ ${a}$", figura=None,
                resposta=f"${v * f}$ ${b}$",
                passos=[f"$1$ ${a} = {f}$ ${b}$.",
                        f"${v} \\cdot {f} = {v * f}$ ${b}$."],
                dif=1))
    return items


def llenguatge_algebraic(rnd):
    items = []
    sab = ["1eso-alg-llenguatge", "2eso-alg-llenguatge"]

    frases = [
        ("el doble d'un nombre", "2x"),
        ("un nombre més $5$", "x+5"),
        ("la meitat d'un nombre", "\\dfrac{x}{2}"),
        ("el triple d'un nombre menys $4$", "3x-4"),
        ("un nombre menys $7$", "x-7"),
        ("el quadrat d'un nombre", "x^2"),
        ("el següent d'un nombre enter", "x+1"),
        ("l'anterior d'un nombre enter", "x-1"),
        ("la suma d'un nombre i el seu doble", "x+2x"),
        ("la tercera part d'un nombre més $2$", "\\dfrac{x}{3}+2"),
    ]
    for text, expr in frases:
        items.append(dict(
            sabers=sab,
            cap="Escriu en llenguatge algebraic, anomenant $x$ el nombre "
                "desconegut.",
            enunciat=text.capitalize() + ".", figura=None,
            resposta=f"${expr}$",
            passos=[f"Si el nombre és $x$, {text} s'escriu ${expr}$."],
            dif=1))

    contextos = [
        ("Tinc $x$ anys. Quina edat tindré d'aquí a $6$ anys?", "x+6",
         "D'aquí a $6$ anys tindré $6$ anys més: $x+6$."),
        ("Tinc $x$ anys. Quina edat tenia fa $4$ anys?", "x-4",
         "Fa $4$ anys en tenia $4$ menys: $x-4$."),
        ("Un quadrat té el costat de $x$ cm. Quin és el seu perímetre?", "4x",
         "El quadrat té quatre costats iguals: $4x$."),
        ("Un rectangle fa $x$ cm de base i $3$ cm d'alçada. Quina és la seva àrea?",
         "3x", "L'àrea del rectangle és base per alçada: $x \\cdot 3 = 3x$."),
        ("Una llibreta val $x$ euros. Quant valen $5$ llibretes?", "5x",
         "Cinc llibretes valen cinc vegades el preu d'una: $5x$."),
        ("Un triangle equilàter té el costat de $x$ cm. Quin és el seu perímetre?",
         "3x", "El triangle equilàter té tres costats iguals: $3x$."),
    ]
    for enunciat, expr, pas in contextos:
        items.append(dict(
            sabers=sab, cap="", enunciat=enunciat, figura=None,
            resposta=f"${expr}$", passos=[pas], dif=1))
    return items


def elements_geometrics(rnd):
    items = []
    sab = ["1eso-esp-elements"]

    for pos in ("paral·leles", "secants", "perpendiculars"):
        pistes = {
            "paral·leles": "No es tallen mai, per molt que s'allarguin.",
            "secants": "Es tallen en un punt, però no formen angle recte.",
            "perpendiculars": "Es tallen formant quatre angles rectes.",
        }
        items.append(dict(
            sabers=sab,
            cap="Digues quina és la posició relativa d'aquestes dues rectes.",
            enunciat="", figura=svg_rectes(pos),
            resposta=f"Són {pos}",
            passos=[pistes[pos]], dif=1))

    for etq, resp, pas in [
        ("a", "El radi", "Va del centre a un punt de la circumferència."),
        ("b", "El radi", "També va del centre a la circumferència."),
        ("c", "Una corda", "Uneix dos punts de la circumferència sense passar "
                           "pel centre."),
    ]:
        items.append(dict(
            sabers=sab,
            cap=f"Com s'anomena el segment ${etq}$ d'aquesta circumferència?",
            enunciat="", figura=svg_cercle(),
            resposta=resp, passos=[pas], dif=1))

    definicions = [
        ("Quants punts calen per determinar una recta?", "Dos",
         "Per dos punts diferents hi passa una recta i només una."),
        ("Com s'anomena la part de recta que té principi i final?", "Un segment",
         "El segment està limitat pels seus dos extrems."),
        ("Com s'anomena la part de recta que té principi però no final?",
         "Una semirecta", "La semirecta té origen i s'allarga indefinidament."),
        ("Com s'anomena la corda que passa pel centre de la circumferència?",
         "El diàmetre", "El diàmetre mesura el doble que el radi."),
    ]
    for enunciat, resp, pas in definicions:
        items.append(dict(sabers=sab, cap="", enunciat=enunciat, figura=None,
                          resposta=resp, passos=[pas], dif=1))
    return items


def angles(rnd):
    items = []
    sab = ["1eso-esp-angles", "1eso-mes-angles"]

    for a in rnd.sample([15, 25, 30, 35, 40, 55, 62, 70, 78], 5):
        items.append(dict(
            sabers=sab, cap="Calcula l'angle complementari d'aquests angles.",
            enunciat=f"${a}^\\circ$", figura=None,
            resposta=f"${90 - a}^\\circ$",
            passos=[f"Dos angles complementaris sumen $90^\\circ$.",
                    f"$90^\\circ - {a}^\\circ = {90 - a}^\\circ$"],
            dif=1))

    for a in rnd.sample([35, 48, 60, 72, 95, 110, 125, 140], 5):
        items.append(dict(
            sabers=sab, cap="Calcula l'angle suplementari d'aquests angles.",
            enunciat=f"${a}^\\circ$", figura=None,
            resposta=f"${180 - a}^\\circ$",
            passos=[f"Dos angles suplementaris sumen $180^\\circ$.",
                    f"$180^\\circ - {a}^\\circ = {180 - a}^\\circ$"],
            dif=1))

    for a, b in [(40, 60), (35, 90), (50, 70), (25, 105), (45, 45), (30, 80)]:
        items.append(dict(
            sabers=sab + ["1eso-esp-triangles"],
            cap="Coneixem dos angles d'un triangle. Calcula el tercer.",
            enunciat=f"${a}^\\circ$ i ${b}^\\circ$", figura=None,
            resposta=f"${180 - a - b}^\\circ$",
            passos=[f"Els tres angles d'un triangle sumen $180^\\circ$.",
                    f"$180^\\circ - {a}^\\circ - {b}^\\circ = {180 - a - b}^\\circ$"],
            dif=1))

    for a in rnd.sample([35, 90, 118, 145, 180], 4):
        tipus = ("agut" if a < 90 else "recte" if a == 90
                 else "obtús" if a < 180 else "pla")
        items.append(dict(
            sabers=sab, cap="Classifica aquests angles.",
            enunciat="", figura=svg_angle(a, f"{a}°"),
            resposta=f"Angle {tipus}",
            passos=[{"agut": "Fa menys de $90^\\circ$.",
                     "recte": "Fa exactament $90^\\circ$.",
                     "obtús": "Fa més de $90^\\circ$ i menys de $180^\\circ$.",
                     "pla": "Fa exactament $180^\\circ$."}[tipus]],
            dif=1))
    return items


def poligons(rnd):
    items = []
    sab = ["1eso-esp-poligons", "2eso-esp-poligons"]

    noms = {3: "triangle", 4: "quadrilàter", 5: "pentàgon", 6: "hexàgon",
            7: "heptàgon", 8: "octàgon", 9: "eneàgon", 10: "decàgon"}
    for n in rnd.sample(list(noms), 5):
        d = n * (n - 3) // 2
        items.append(dict(
            sabers=sab, cap="Quantes diagonals té cadascun d'aquests polígons?",
            enunciat=f"Un {noms[n]} (${n}$ costats).", figura=None,
            resposta=f"${d}$ diagonals",
            passos=[f"D'un vèrtex en surten ${n} - 3 = {n - 3}$ diagonals.",
                    f"$\\dfrac{{{n} \\cdot {n - 3}}}{{2}} = {d}$"],
            dif=1))

    for n in rnd.sample(list(noms), 5):
        s = (n - 2) * 180
        items.append(dict(
            sabers=sab,
            cap="Calcula la suma dels angles interiors d'aquests polígons.",
            enunciat=f"Un {noms[n]} (${n}$ costats).", figura=None,
            resposta=f"${s}^\\circ$",
            passos=[f"Es descompon en ${n} - 2 = {n - 2}$ triangles.",
                    f"${n - 2} \\cdot 180^\\circ = {s}^\\circ$"],
            dif=1))

    quadri = [
        ("Té els quatre costats iguals i els quatre angles rectes.", "El quadrat"),
        ("Té els costats iguals dos a dos i els quatre angles rectes.", "El rectangle"),
        ("Té els quatre costats iguals però els angles no són rectes.", "El rombe"),
        ("Només té dos costats paral·lels.", "El trapezi"),
    ]
    for text, resp in quadri:
        items.append(dict(
            sabers=sab, cap="Quin quadrilàter es descriu?",
            enunciat=text, figura=None, resposta=resp,
            passos=[f"{resp} és l'únic que compleix les dues condicions."],
            dif=1))
    return items


def perimetres(rnd):
    items = []
    sab = ["1eso-mes-perimetres"]

    for a, b in rnd.sample([(4, 7), (5, 9), (6, 10), (3, 8), (7, 12), (5, 6)], 4):
        items.append(dict(
            sabers=sab, cap="Calcula el perímetre d'aquests rectangles.",
            enunciat="", figura=svg_rectangle(b, a),
            resposta=f"${2 * (a + b)}$ cm",
            passos=[f"$P = 2 \\cdot ({b} + {a})$",
                    f"$P = 2 \\cdot {a + b} = {2 * (a + b)}$ cm"],
            dif=1))

    for c in rnd.sample([3, 5, 6, 8, 9, 12], 3):
        items.append(dict(
            sabers=sab, cap="Calcula el perímetre d'aquests quadrats.",
            enunciat=f"Costat de ${c}$ cm.", figura=None,
            resposta=f"${4 * c}$ cm",
            passos=[f"$P = 4 \\cdot {c} = {4 * c}$ cm"], dif=1))

    for n, c in [(5, 4), (6, 3), (8, 5), (3, 7), (4, 9)]:
        noms = {3: "triangle", 4: "quadrat", 5: "pentàgon", 6: "hexàgon",
                8: "octàgon"}
        items.append(dict(
            sabers=sab,
            cap="Calcula el perímetre d'aquests polígons regulars.",
            enunciat=f"Un {noms[n]} regular de costat ${c}$ cm.", figura=None,
            resposta=f"${n * c}$ cm",
            passos=[f"Té ${n}$ costats iguals: $P = {n} \\cdot {c} = {n * c}$ cm."],
            dif=1))

    for r in rnd.sample([2, 3, 4, 5, 10], 3):
        items.append(dict(
            sabers=sab,
            cap="Calcula la longitud d'aquestes circumferències. Deixa el "
                "resultat en funció de $\\pi$.",
            enunciat=f"Radi de ${r}$ cm.", figura=None,
            resposta=f"${2 * r}\\pi$ cm",
            passos=[f"$L = 2 \\pi r = 2 \\pi \\cdot {r} = {2 * r}\\pi$ cm"],
            dif=1))
    return items


def comprensio_lectora(rnd):
    """
    Problemes curts d'una o dues operacions. El que s'avalua és treure les
    dades del text, no el càlcul: per això els nombres són petits i les
    operacions, immediates.
    """
    sab = ["1eso-lec", "2eso-lec", "3eso-lec"]
    casos = [
        ("La Marta compra $3$ llibretes de $2$ € cada una i paga amb un bitllet "
         "de $10$ €. Quants euros li tornen?", "$4$ €",
         ["Les llibretes valen $3 \\cdot 2 = 6$ €.", "$10 - 6 = 4$ €"]),
        ("Un autobús surt amb $34$ passatgers. A la primera parada en baixen $12$ "
         "i en pugen $7$. Quants passatgers hi ha ara?", "$29$ passatgers",
         ["$34 - 12 = 22$", "$22 + 7 = 29$ passatgers"]),
        ("En una classe de $28$ alumnes, la meitat fan francès i la resta, alemany. "
         "Quants fan alemany?", "$14$ alumnes",
         ["La meitat de $28$ és $14$.", "La resta també són $14$."]),
        ("Un llibre té $180$ pàgines. En Pau n'ha llegit $45$. Quantes li'n queden?",
         "$135$ pàgines", ["$180 - 45 = 135$ pàgines"]),
        ("Una capsa conté $6$ paquets i cada paquet, $8$ galetes. Si me'n menjo $5$, "
         "quantes en queden?", "$43$ galetes",
         ["A la capsa hi ha $6 \\cdot 8 = 48$ galetes.", "$48 - 5 = 43$ galetes"]),
        ("L'entrada del cinema val $7$ €. Si hi anem $4$ amics i tenim un descompte "
         "de $5$ € en total, quant paguem?", "$23$ €",
         ["Sense descompte: $4 \\cdot 7 = 28$ €.", "$28 - 5 = 23$ €"]),
        ("Un tren surt a les $9$:$15$ i el viatge dura $50$ minuts. A quina hora "
         "arriba?", "A les $10$:$05$",
         ["De les $9$:$15$ a les $10$:$00$ hi ha $45$ minuts.",
          "Queden $5$ minuts més: arriba a les $10$:$05$."]),
        ("La Núria té estalviats $85$ € i cada setmana n'estalvia $10$ més. "
         "Quants en tindrà d'aquí a $4$ setmanes?", "$125$ €",
         ["En $4$ setmanes estalvia $4 \\cdot 10 = 40$ €.", "$85 + 40 = 125$ €"]),
        ("Un jardí rectangular fa $12$ m de llarg i $5$ m d'ample. Quants metres "
         "de tanca calen per envoltar-lo?", "$34$ m",
         ["$P = 2 \\cdot (12 + 5)$", "$P = 2 \\cdot 17 = 34$ m"]),
        ("En una excursió hi van $52$ alumnes i cada autocar té $24$ places. "
         "Quants autocars calen?", "$3$ autocars",
         ["$52 : 24 = 2$ i en sobren $4$.",
          "Amb $2$ autocars no hi caben tots: en calen $3$."]),
    ]
    return [dict(sabers=sab, cap="", enunciat=e, figura=None,
                 resposta=r, passos=p, dif=1) for e, r, p in casos]


def vocabulari_geometric(rnd):
    """2n d'ESO: vocabulari al pla i a l'espai, i fórmula d'Euler."""
    items = []
    sab = ["2eso-esp-vocabulari"]

    definicions = [
        ("Com s'anomena el punt on es troben tres o més arestes d'un poliedre?",
         "Un vèrtex", "Les arestes conflueixen als vèrtexs."),
        ("Com s'anomena el segment on es troben dues cares d'un poliedre?",
         "Una aresta", "L'aresta és la intersecció de dues cares."),
        ("Com s'anomena cadascun dels polígons que limiten un poliedre?",
         "Una cara", "Les cares d'un poliedre són polígons plans."),
        ("Quin cos s'obté fent girar un rectangle al voltant d'un dels seus costats?",
         "Un cilindre", "El costat sobre el qual gira és l'eix del cilindre."),
        ("Quin cos s'obté fent girar un triangle rectangle al voltant d'un catet?",
         "Un con", "L'altre catet és el radi de la base."),
        ("Quin cos s'obté fent girar un semicercle al voltant del seu diàmetre?",
         "Una esfera", "Tots els punts queden a la mateixa distància del centre."),
        ("Com s'anomena el poliedre que té totes les cares iguals i regulars?",
         "Un poliedre regular", "N'hi ha cinc: tetraedre, cub, octaedre, "
                               "dodecaedre i icosaedre."),
        ("Quants poliedres regulars hi ha?", "Cinc",
         "Tetraedre, cub, octaedre, dodecaedre i icosaedre."),
    ]
    for enunciat, resp, pas in definicions:
        items.append(dict(sabers=sab, cap="", enunciat=enunciat, figura=None,
                          resposta=resp, passos=[pas], dif=1))

    # Euler: C + V = A + 2
    poliedres = [("un cub", 6, 8, 12), ("un tetraedre", 4, 4, 6),
                 ("un octaedre", 8, 6, 12), ("una piràmide de base quadrada", 5, 5, 8),
                 ("un prisma triangular", 5, 6, 9),
                 ("un prisma hexagonal", 8, 12, 18)]
    for nom, c, v, a in poliedres:
        que = rnd.choice(["arestes", "vèrtexs", "cares"])
        conegut = {"arestes": f"té ${c}$ cares i ${v}$ vèrtexs",
                   "vèrtexs": f"té ${c}$ cares i ${a}$ arestes",
                   "cares": f"té ${v}$ vèrtexs i ${a}$ arestes"}[que]
        val = {"arestes": a, "vèrtexs": v, "cares": c}[que]
        items.append(dict(
            sabers=sab,
            cap="Aplica la fórmula d'Euler ($C + V = A + 2$).",
            enunciat=f"Si {nom} {conegut}, quantes {que} té?",
            figura=None, resposta=f"${val}$ {que}",
            passos=[f"$C + V = A + 2$",
                    f"${c} + {v} = {a} + 2$, i per tant les {que} són ${val}$."],
            dif=1))
    return items


def moviments(rnd):
    """
    3r d'ESO: vectors i moviments al pla. Amb coordenades enteres i petites,
    surten curts i el resultat sempre és net.
    """
    items = []
    sab = ["3eso-esp-moviments"]

    punts = [(2, 3), (-1, 4), (5, -2), (-3, -1), (0, 5), (4, 1), (-2, 2)]
    vectors = [(3, -1), (-2, 4), (1, 5), (-4, -2), (2, 2)]

    for (x, y), (u, v) in zip(rnd.sample(punts, 5), rnd.sample(vectors, 5)):
        items.append(dict(
            sabers=sab,
            cap="Aplica la translació de vector $\\vec{v}$ al punt $A$ i "
                "escriu les coordenades de $A'$.",
            enunciat=f"$A({x}, {y})$ i $\\vec{{v}} = ({u}, {v})$.", figura=None,
            resposta=f"$A'({x + u}, {y + v})$",
            passos=[f"Es suma el vector a cada coordenada.",
                    f"$A'({x} + {u}, {y} + {v}) = A'({x + u}, {y + v})$"],
            dif=1))

    eixos = [("l'eix $X$", lambda p: (p[0], -p[1]),
              "Es canvia el signe de l'ordenada."),
             ("l'eix $Y$", lambda p: (-p[0], p[1]),
              "Es canvia el signe de l'abscissa."),
             ("l'origen", lambda p: (-p[0], -p[1]),
              "Es canvien els signes de les dues coordenades.")]
    for (x, y) in rnd.sample(punts, 6):
        nom, f, pas = rnd.choice(eixos)
        r = f((x, y))
        items.append(dict(
            sabers=sab,
            cap="Calcula el simètric d'aquest punt.",
            enunciat=f"El simètric de $A({x}, {y})$ respecte de {nom}.",
            figura=None, resposta=f"$A'({r[0]}, {r[1]})$",
            passos=[pas, f"$A'({r[0]}, {r[1]})$"], dif=1))

    for (x, y) in rnd.sample(punts, 4):
        items.append(dict(
            sabers=sab,
            cap="Calcula la imatge del punt en un gir de $90^\\circ$ en sentit "
                "antihorari al voltant de l'origen.",
            enunciat=f"$A({x}, {y})$", figura=None,
            resposta=f"$A'({-y}, {x})$",
            passos=["En un gir de $90^\\circ$ antihorari, $(x, y)$ va a $(-y, x)$.",
                    f"$A'({-y}, {x})$"], dif=1))

    for (x1, y1), (x2, y2) in zip(rnd.sample(punts, 4), rnd.sample(punts, 4)):
        if (x1, y1) == (x2, y2):
            continue
        items.append(dict(
            sabers=sab,
            cap="Escriu les components del vector que va del primer punt al segon.",
            enunciat=f"De $A({x1}, {y1})$ a $B({x2}, {y2})$.", figura=None,
            resposta=f"$\\vec{{AB}} = ({x2 - x1}, {y2 - y1})$",
            passos=["Es resten les coordenades de l'origen a les de l'extrem.",
                    f"$\\vec{{AB}} = ({x2} - ({x1}), {y2} - ({y1})) = "
                    f"({x2 - x1}, {y2 - y1})$"], dif=1))
    return items


def decimals(rnd):
    """1r d'ESO: el banc només té fracció generatriu, que no és de nivell 1."""
    items = []
    sab = ["1eso-num-decimals"]

    for v in rnd.sample([3.472, 12.518, 0.634, 7.285, 25.149, 1.876], 4):
        items.append(dict(
            sabers=sab, cap="Arrodoneix a les centèsimes.",
            enunciat=f"${coma(v)}$", figura=None,
            resposta=f"${coma(round(v, 2))}$",
            passos=[f"La xifra de les mil·lèsimes és ${str(v)[-1]}$: "
                    f"{'s’arrodoneix cap amunt' if int(str(v)[-1]) >= 5 else 'es deixa igual'}.",
                    f"${coma(round(v, 2))}$"], dif=1))

    for v in rnd.sample([4.7, 12.3, 8.5, 23.9, 0.6, 15.2], 3):
        items.append(dict(
            sabers=sab, cap="Arrodoneix a les unitats.",
            enunciat=f"${coma(v)}$", figura=None,
            resposta=f"${round(v)}$",
            passos=[f"La primera xifra decimal és ${str(v).split('.')[1][0]}$.",
                    f"${coma(v)} \\approx {round(v)}$"], dif=1))

    grups = [[2.5, 2.05, 2.55], [0.9, 0.89, 0.98], [1.4, 1.04, 1.44],
             [3.7, 3.07, 3.77]]
    for g in rnd.sample(grups, 3):
        ordenat = sorted(g)
        items.append(dict(
            sabers=sab, cap="Ordena de menor a major.",
            enunciat="$" + " \\quad ".join(coma(x) for x in g) + "$", figura=None,
            resposta="$" + " < ".join(coma(x) for x in ordenat) + "$",
            passos=["Es comparen les xifres decimals una a una, de l'esquerra "
                    "cap a la dreta.",
                    "$" + " < ".join(coma(x) for x in ordenat) + "$"], dif=1))

    for a, b in [(2.5, 1.3), (4.7, 2.4), (6.2, 3.8), (5.5, 1.9)]:
        items.append(dict(
            sabers=sab, cap="Fes aquestes restes.",
            enunciat=f"${coma(a)} - {coma(b)}$", figura=None,
            resposta=f"${coma(round(a - b, 2))}$",
            passos=[f"S'alineen les comes: ${coma(a)} - {coma(b)} = "
                    f"{coma(round(a - b, 2))}$."], dif=1))
    return items


def grafics_taules(rnd):
    """1r d'ESO: llegir una taula. Poques dades, a propòsit."""
    items = []
    sab = ["1eso-alg-grafics", "2eso-est-variables"]

    taules = [
        ("temperatura, en graus, d'una setmana",
         ["dl", "dt", "dc", "dj", "dv"], [12, 15, 11, 18, 14], "°C"),
        ("gols marcats en cinc partits",
         ["1r", "2n", "3r", "4t", "5è"], [2, 0, 3, 1, 4], "gols"),
        ("alumnes que han faltat cada dia",
         ["dl", "dt", "dc", "dj", "dv"], [3, 1, 0, 5, 2], "alumnes"),
    ]
    for titol, etq, vals, unitat in taules:
        taula = ("<table class=\"dades\"><tr><th>" + "</th><th>".join(etq) +
                 "</th></tr><tr><td>" +
                 "</td><td>".join(str(v) for v in vals) + "</td></tr></table>")
        mx = max(vals)
        items.append(dict(
            sabers=sab, cap=f"Aquesta taula recull la {titol}.",
            enunciat=taula + " Quin és el valor més gran, i a quin dia correspon?",
            figura=None,
            resposta=f"${mx}$ {unitat}, el {etq[vals.index(mx)]}",
            passos=[f"Es compara fila per fila: el màxim és ${mx}$."], dif=1))
        items.append(dict(
            sabers=sab, cap=f"Aquesta taula recull la {titol}.",
            enunciat=taula + " Quant sumen totes les dades?", figura=None,
            resposta=f"${sum(vals)}$ {unitat}",
            passos=["$" + " + ".join(str(v) for v in vals) + f" = {sum(vals)}$"],
            dif=1))
    return items


def circumferencia(rnd):
    """2n d'ESO: el banc no té cap ítem curt de circumferència i cercle."""
    items = []
    sab = ["2eso-esp-circumferencia"]

    for r in rnd.sample([3, 4, 5, 6, 7, 10], 4):
        items.append(dict(
            sabers=sab, cap="Calcula el diàmetre d'aquestes circumferències.",
            enunciat=f"Radi de ${r}$ cm.", figura=None,
            resposta=f"${2 * r}$ cm",
            passos=[f"El diàmetre és el doble del radi: $2 \\cdot {r} = {2 * r}$ cm."],
            dif=1))

    for d in rnd.sample([8, 12, 16, 20, 24], 3):
        items.append(dict(
            sabers=sab, cap="Calcula el radi d'aquestes circumferències.",
            enunciat=f"Diàmetre de ${d}$ cm.", figura=None,
            resposta=f"${d // 2}$ cm",
            passos=[f"El radi és la meitat del diàmetre: ${d} : 2 = {d // 2}$ cm."],
            dif=1))

    for r in rnd.sample([2, 3, 5, 6, 9], 3):
        items.append(dict(
            sabers=sab,
            cap="Calcula l'àrea d'aquests cercles. Deixa el resultat en "
                "funció de $\\pi$.",
            enunciat=f"Radi de ${r}$ cm.", figura=None,
            resposta=f"${r * r}\\pi$ cm$^2$",
            passos=[f"$A = \\pi r^2 = \\pi \\cdot {r}^2 = {r * r}\\pi$ cm$^2$"],
            dif=1))
    return items


def semblanca(rnd):
    """3r d'ESO: raó de semblança amb nombres nets."""
    items = []
    sab = ["3eso-esp-semblanca", "3eso-mes-semblanca"]

    for a, k in [(3, 2), (4, 3), (5, 2), (6, 4), (7, 3)]:
        items.append(dict(
            sabers=sab,
            cap="Dos polígons són semblants amb raó de semblança $k$. Si un "
                "costat del petit fa la mesura que es diu, quant fa el "
                "corresponent del gran?",
            enunciat=f"Costat de ${a}$ cm, $k = {k}$.", figura=None,
            resposta=f"${a * k}$ cm",
            passos=[f"Es multiplica pel factor de semblança: "
                    f"${a} \\cdot {k} = {a * k}$ cm."], dif=1))

    for gran, petit in [(12, 4), (15, 5), (18, 6), (20, 4), (21, 7)]:
        items.append(dict(
            sabers=sab,
            cap="Dues figures són semblants. Calcula la raó de semblança del "
                "gran respecte del petit.",
            enunciat=f"Costats corresponents de ${gran}$ cm i ${petit}$ cm.",
            figura=None, resposta=f"$k = {gran // petit}$",
            passos=[f"$k = \\dfrac{{{gran}}}{{{petit}}} = {gran // petit}$"],
            dif=1))

    for k in [2, 3, 4, 5]:
        items.append(dict(
            sabers=sab,
            cap="Dues figures són semblants amb raó $k$. Quina és la raó "
                "entre les seves àrees?",
            enunciat=f"$k = {k}$", figura=None, resposta=f"${k * k}$",
            passos=[f"La raó entre àrees és $k^2$: ${k}^2 = {k * k}$."], dif=1))
    return items


GENERADORS = [
    ("divisibilitat", divisibilitat),
    ("arrel", arrel_quadrada),
    ("magnituds", magnituds),
    ("algebra", llenguatge_algebraic),
    ("elements", elements_geometrics),
    ("angles", angles),
    ("poligons", poligons),
    ("perimetres", perimetres),
    ("lectora", comprensio_lectora),
    ("vocabulari", vocabulari_geometric),
    ("moviments", moviments),
    ("decimals", decimals),
    ("taules", grafics_taules),
    ("circumferencia", circumferencia),
    ("semblanca", semblanca),
]


def genera():
    """Tots els ítems propis, amb id estable."""
    items = []
    for nom, fn in GENERADORS:
        rnd = random.Random(f"{LLAVOR}-{nom}")
        for k, it in enumerate(fn(rnd), 1):
            it = dict(it)
            it["id"] = f"p-{nom}-{k}"
            it["origen"] = nom
            items.append(it)
    return items


# ---------------------------------------------------------------- comprova
def comprova():
    """
    Repassa que els enunciats i les solucions siguin correctes. No substitueix
    llegir-los, però atrapa el que es pot atrapar sol.
    """
    items = genera()
    errors = []
    vistos = set()

    for it in items:
        if it["id"] in vistos:
            errors.append(f"{it['id']}: id repetit")
        vistos.add(it["id"])
        if not it["enunciat"] and not it["figura"]:
            errors.append(f"{it['id']}: sense enunciat ni figura")
        if not it["resposta"]:
            errors.append(f"{it['id']}: sense resposta")
        if not it["sabers"]:
            errors.append(f"{it['id']}: sense cap saber")
        text = it["cap"] + it["enunciat"] + it["resposta"] + "".join(it["passos"])
        if text.count("$") % 2:
            errors.append(f"{it['id']}: dòlars de LaTeX desaparellats")
        if it["figura"] and "<svg" not in it["figura"]:
            errors.append(f"{it['id']}: figura que no és un SVG")

    # comprovacions aritmètiques concretes
    for it in items:
        o = it["origen"]
        if o == "divisibilitat" and "màxim comú divisor" in it["cap"]:
            a, b = [int(x) for x in it["enunciat"].replace("$", "").split(" i ")]
            if f"= {math.gcd(a, b)}$" not in it["resposta"]:
                errors.append(f"{it['id']}: m.c.d. incorrecte")
        if o == "divisibilitat" and "mínim comú múltiple" in it["cap"]:
            a, b = [int(x) for x in it["enunciat"].replace("$", "").split(" i ")]
            if f"= {a * b // math.gcd(a, b)}$" not in it["resposta"]:
                errors.append(f"{it['id']}: m.c.m. incorrecte")
        if o == "arrel" and it["cap"].startswith("Calcula"):
            n = int(it["enunciat"].split("{")[1].split("}")[0])
            if it["resposta"] != f"${int(n ** 0.5)}$":
                errors.append(f"{it['id']}: arrel incorrecta")

    print(f"Ítems propis generats: {len(items)}")
    per_saber = {}
    for it in items:
        for s in it["sabers"]:
            per_saber[s] = per_saber.get(s, 0) + 1
    for s in sorted(per_saber):
        print(f"  {s:28s} {per_saber[s]:3d}")
    if errors:
        print("\nERRORS:")
        for e in errors:
            print("  -", e)
    else:
        print("\nCap error.")
    return not errors


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--comprova", action="store_true")
    a = ap.parse_args()
    ok = comprova()
    raise SystemExit(0 if ok else 1)
