# -*- coding: utf-8 -*-
"""
Mapa curricular 1r i 2n d'ESO -> fonts de material.

Font de veritat de l'estructura: "Repartiment de continguts ESO 2025-26"
(Departament de Matemàtiques). Els títols dels sentits i dels sabers, i les
hores, són literals d'aquell document: si el departament el canvia, cal
canviar aquest fitxer i prou.

Cada saber declara d'on surten les preguntes:

    repas:  [(full, bloc, [exercicis] | None)]   None = tot el bloc
    llibre: [(curs, unitat, [activitats] | None)]
    bogdan: [nom-de-fitxer-sense-extensio]

'repas' alimenta l'examen. 'llibre' i 'bogdan' alimenten el pla de repàs
que s'imprimeix a part; no generen preguntes.
"""

SENTITS = {
    "lectora":  "Millora de la comprensió lectora",
    "numeric":  "Sentit numèric",
    "espacial": "Sentit espacial",
    "mesura":   "Sentit de la mesura",
    "algebraic": "Sentit algebraic",
    "estocastic": "Sentit estocàstic",
}

# ---------------------------------------------------------------- 1r d'ESO
SABERS_1ESO = [
    dict(id="1eso-lec", sentit="lectora", titol="Comprensió lectora matemàtica", hores=12,
         detall="Vocabulari específic. Obtenció d'informació en textos d'àmbit "
                "matemàtic. Expressió algebraica de patrons. Resolució de problemes "
                "a partir d'un context.",
         repas=[], llibre=[], bogdan=[]),

    dict(id="1eso-num-naturals", sentit="numeric", titol="Nombres naturals", hores=9,
         detall="Ordre. Sistemes de numeració. Potències de base i exponent naturals. "
                "Jerarquia de les operacions. Operacions combinades.",
         repas=[(2, "basiques", [35]), (2, "verifica", [43])],
         llibre=[("1eso", 1, None)], bogdan=[]),

    dict(id="1eso-num-divisibilitat", sentit="numeric", titol="Divisibilitat", hores=9,
         detall="Múltiples i divisors. Criteris de divisibilitat. Nombres primers i "
                "compostos. Factorització. MCD i mcm.",
         repas=[(1, "divisibilitat", None)],
         llibre=[("1eso", 2, None)], bogdan=[]),

    dict(id="1eso-num-decimals", sentit="numeric", titol="Nombres decimals", hores=3,
         detall="Representació a la recta. Ordre. Operacions. Aproximació per "
                "truncament i per arrodoniment.",
         repas=[(1, "decimals", [26])],
         llibre=[("1eso", 5, [1, 2, 3])], bogdan=[]),

    dict(id="1eso-num-fraccions", sentit="numeric", titol="Fraccions", hores=9,
         detall="Fracció pròpia i impròpia. Equivalents. Simplificació i fracció "
                "irreductible. Comparació. Suma i resta amb mateix denominador. "
                "Fracció d'un nombre.",
         repas=[(1, "fraccions", [18, 19, 20, 22])],
         llibre=[("1eso", 3, [1, 2, 6, 7]), ("1eso", 4, [2, 3, 4])], bogdan=[]),

    dict(id="1eso-num-fracdec", sentit="numeric", titol="Fraccions i decimals", hores=3,
         detall="Expressar una fracció com a nombre decimal i, donat un decimal, "
                "expressar-lo com una fracció.",
         repas=[(1, "decimals", [27])],
         llibre=[("1eso", 5, [4])], bogdan=["nombres-reals"]),

    dict(id="1eso-num-arrel", sentit="numeric", titol="Arrel quadrada", hores=3,
         detall="Quadrats perfectes. Arrel quadrada exacta i no exacta.",
         repas=[],
         llibre=[("1eso", 5, [5])], bogdan=["nombres-reals"]),

    dict(id="1eso-esp-elements", sentit="espacial", titol="Elements geomètrics al pla", hores=3,
         detall="Punt, segment, recta, semirecta, circumferència, angle. Rectes "
                "secants, paral·leles i perpendiculars. Vocabulari de la circumferència.",
         repas=[],
         llibre=[("1eso", 6, [1, 2])], bogdan=["geometria"]),

    dict(id="1eso-esp-angles", sentit="espacial", titol="Angles", hores=3,
         detall="Angles entre dues rectes secants. Angles convexos i còncaus. Mesura "
                "amb el transportador. Complementaris i suplementaris.",
         repas=[(7, "triangles", [119])],
         llibre=[("1eso", 6, [3])], bogdan=["geometria"]),

    dict(id="1eso-esp-poligons", sentit="espacial", titol="Polígons", hores=3,
         detall="Vèrtex, costat, diagonal, angle intern. Triangle, quadrilàter, "
                "pentàgon, hexàgon. Polígon regular.",
         repas=[(7, "triangles", [127])],
         llibre=[("1eso", 6, [4])], bogdan=["geometria"]),

    dict(id="1eso-esp-triangles", sentit="espacial", titol="Triangles", hores=4,
         detall="Condició per construir un triangle. Suma dels tres angles. "
                "Classificació segons angles i costats.",
         repas=[(7, "triangles", [119, 120, 122])],
         llibre=[("1eso", 6, [5])], bogdan=["geometria"]),

    dict(id="1eso-mes-magnituds", sentit="mesura", titol="Magnituds i unitats", hores=2,
         detall="Mesures de longitud, massa i capacitat. Mesures de superfície.",
         repas=[],
         llibre=[("1eso", 3, [3])], bogdan=[]),

    dict(id="1eso-mes-escala", sentit="mesura", titol="Escala", hores=2,
         detall="Escales en un plànol i en un mapa. Tria adequada de l'escala.",
         repas=[(8, "escales", None), (8, "escales_calcul", [285, 286, 287, 288])],
         llibre=[("2eso", 5, [3])], bogdan=["semblanca"]),

    dict(id="1eso-mes-perimetres", sentit="mesura", titol="Càlcul de perímetres", hores=6,
         detall="Perímetre del quadrat, del rectangle i del polígon regular. "
                "Perímetre de la circumferència.",
         repas=[(7, "triangles", [126])],
         llibre=[("2eso", 5, [2])], bogdan=["geometria"]),

    dict(id="1eso-mes-arees", sentit="mesura", titol="Càlcul d'àrees", hores=6,
         detall="Visualització d'un metre quadrat. Àrea del quadrat, rectangle i "
                "triangle. Àrea del cercle. Àrea de figures descomponibles.",
         repas=[(7, "arees_poli", [140, 141, 143, 144, 145])],
         llibre=[("1eso", 3, [4, 5, 8, 9])], bogdan=["geometria"]),

    dict(id="1eso-mes-angles", sentit="mesura", titol="Angles (mesura i càlcul)", hores=12,
         detall="Càlcul d'angles amb el transportador. Classificació. Angles "
                "complementaris, de triangles i de quadrilàters.",
         repas=[(7, "triangles", [119])],
         llibre=[("1eso", 6, [3, 5])], bogdan=["geometria"]),

    dict(id="1eso-alg-llenguatge", sentit="algebraic", titol="Llenguatge algebraic", hores=3,
         detall="Traduir al llenguatge algebraic un enunciat (edat d'aquí 5 anys, "
                "perímetre d'un quadrat de costat x, etc.).",
         repas=[],
         llibre=[("2eso", 4, [2])], bogdan=["algebra"]),

    dict(id="1eso-alg-grafics", sentit="algebraic", titol="Gràfics i taules", hores=3,
         detall="Interpretació de gràfics i taules. Buidat de dades i deducció de "
                "patrons a partir d'informació gràfica o de taules.",
         repas=[(11, "frequencies", [220, 226]), (11, "grafics", [227, 230, 231])],
         llibre=[("2eso", 6, [2])], bogdan=[]),
]

# ---------------------------------------------------------------- 2n d'ESO
SABERS_2ESO = [
    dict(id="2eso-lec", sentit="lectora", titol="Comprensió lectora matemàtica", hores=9,
         detall="Vocabulari específic. Obtenció d'informació en textos d'àmbit "
                "matemàtic. Expressió algebraica de patrons. Resolució de problemes "
                "a partir d'un context.",
         repas=[], llibre=[], bogdan=[]),

    dict(id="2eso-num-divisibilitat", sentit="numeric", titol="Divisibilitat", hores=4,
         detall="Múltiples i divisors. Nombres primers i compostos. Màxim comú "
                "divisor. Mínim comú múltiple.",
         repas=[(1, "divisibilitat", None)],
         llibre=[("2eso", 1, [3, 4])], bogdan=[]),

    dict(id="2eso-num-fraccions", sentit="numeric", titol="Fraccions", hores=4,
         detall="Representació. Fracció d'un nombre. Equivalents i reducció a comú "
                "denominador. Les quatre operacions.",
         repas=[(1, "fraccions", None)],
         llibre=[("2eso", 1, [8, 9])], bogdan=["nombres-reals"]),

    dict(id="2eso-num-percentatges", sentit="numeric", titol="Percentatges", hores=4,
         detall="Relació entre fracció, decimal i percentatge. Representació gràfica. "
                "Percentatges menors i majors que 100 %.",
         repas=[(6, "percentatges", None), (6, "factor_multiplicador", [275, 276, 278])],
         llibre=[("2eso", 2, [3])], bogdan=[]),

    dict(id="2eso-num-enters", sentit="numeric", titol="Nombres enters", hores=9,
         detall="Representació a la recta. Oposat i valor absolut. Ordre. Suma, "
                "resta, multiplicació i divisió d'enters.",
         repas=[(1, "enters", None)],
         llibre=[("2eso", 1, [2, 5, 6, 7])], bogdan=["nombres-reals"]),

    dict(id="2eso-num-potencies", sentit="numeric", titol="Potències", hores=3,
         detall="Potències de base natural, entera i racional amb exponent natural.",
         repas=[(2, "basiques", None), (2, "verifica", [42, 43])],
         llibre=[("2eso", 1, [10])], bogdan=["nombres-reals"]),

    dict(id="2eso-esp-vocabulari", sentit="espacial", titol="Vocabulari geomètric", hores=2,
         detall="Vocabulari al pla i a l'espai: vèrtex, aresta, cara, poliedre, cos "
                "de revolució.",
         repas=[],
         llibre=[("2eso", 5, [1, 6])], bogdan=["geometria"]),

    dict(id="2eso-esp-poligons", sentit="espacial", titol="Polígons", hores=4,
         detall="Triangles: classificació segons angles i costats. Quadrilàters: "
                "paral·lelogram, rombe, rectangle, quadrat, trapezi. Polígons "
                "convexos, còncaus i regulars.",
         repas=[(7, "triangles", [120, 122, 127])],
         llibre=[("2eso", 5, [2])], bogdan=["geometria"]),

    dict(id="2eso-esp-triangles", sentit="espacial", titol="Triangles i teorema de Pitàgores", hores=6,
         detall="Altures i peu d'altura. Triangle rectangle: catets i hipotenusa. "
                "Teorema de Pitàgores. Resolució de triangles rectangles i de "
                "problemes.",
         repas=[(7, "triangles", [121, 123, 124, 125, 128, 129]),
                (7, "arees_pit", None),
                (7, "problemes", [146, 147, 148, 149, 150, 151])],
         llibre=[("2eso", 5, [4, 5])], bogdan=["geometria", "semblanca"]),

    dict(id="2eso-esp-circumferencia", sentit="espacial", titol="Circumferència i cercle", hores=3,
         detall="Radi, diàmetre, arc. Circumferència i polígon regular inscrit.",
         repas=[(7, "triangles", [129]), (7, "arees_poli", [144])],
         llibre=[("2eso", 5, [2])], bogdan=["geometria"]),

    dict(id="2eso-esp-poliedres", sentit="espacial", titol="Poliedres", hores=3,
         detall="Desenvolupament pla. Fórmula d'Euler. Poliedres regulars: tetraedre, "
                "cub, octaedre, dodecaedre, icosaedre.",
         repas=[(9, "prismes", None), (9, "piramides", None)],
         llibre=[("2eso", 5, [6, 7])], bogdan=["geometria"]),

    dict(id="2eso-esp-revolucio", sentit="espacial", titol="Cossos de revolució", hores=3,
         detall="Cilindre, con i esfera. Base, altura i generatriu. Desenvolupament pla.",
         repas=[(9, "cossos_rodons", None)],
         llibre=[("2eso", 5, [8])], bogdan=["geometria"]),

    dict(id="2eso-mes-arees", sentit="mesura", titol="Perímetres i àrees al pla", hores=4,
         detall="Perímetre d'un polígon i d'una circumferència. Àrea del quadrat, "
                "rectangle, triangle, rombe, paral·lelogram, trapezi i cercle.",
         repas=[(7, "arees_poli", None), (7, "triangles", [126])],
         llibre=[("2eso", 5, [2])], bogdan=["geometria"]),

    dict(id="2eso-mes-volums", sentit="mesura", titol="Àrees i volums a l'espai", hores=2,
         detall="Construcció d'un metre cúbic. Àrea de les cares i volum del cub, "
                "ortoedre, piràmide, cilindre i con.",
         repas=[(9, "volums_aplicacions", None)],
         llibre=[("2eso", 5, [9, 12])], bogdan=["geometria"]),

    dict(id="2eso-alg-placartesia", sentit="algebraic", titol="El pla cartesià", hores=3,
         detall="Coordenades d'un punt, eixos, origen. Representació de punts als "
                "quatre quadrants.",
         repas=[(10, "concepte_funcio", [201, 202, 203])],
         llibre=[("2eso", 3, [1, 2])], bogdan=["funcions"]),

    dict(id="2eso-alg-proporcionalitat", sentit="algebraic", titol="Proporcionalitat", hores=3,
         detall="Magnituds directament proporcionals. Funció lineal y=mx. "
                "Representació gràfica.",
         repas=[(6, "directa_inversa", None), (10, "funcions_lineals", [207, 208])],
         llibre=[("2eso", 2, [1, 2]), ("2eso", 3, [3])], bogdan=["funcions"]),

    dict(id="2eso-alg-llenguatge", sentit="algebraic", titol="Llenguatge algebraic", hores=3,
         detall="Patrons geomètrics. Traducció d'un enunciat. Vocabulari: equació, "
                "identitat, grau, membres, termes, incògnita. Solució i comprovació.",
         repas=[(5, "problemes", [93, 94, 97, 98])],
         llibre=[("2eso", 4, [2, 3])], bogdan=["algebra"]),

    dict(id="2eso-alg-equacions", sentit="algebraic", titol="Equació de 1r grau", hores=9,
         detall="ax=b; ax+b=c. Resolució agrupant termes i aplicant la propietat "
                "distributiva. Resolució d'un enunciat plantejant una equació.",
         repas=[(5, "primer_grau", None), (5, "problemes", [91, 92, 99, 100])],
         llibre=[("2eso", 4, None)], bogdan=["equacions-1r2n-grau"]),

    dict(id="2eso-est-variables", sentit="estocastic", titol="Variables estadístiques", hores=6,
         detall="Població i mostra. Variables quantitatives i qualitatives, discretes "
                "i contínues. Taula de freqüències. Gràfic de barres i diagrama de "
                "sectors.",
         repas=[(11, "variables", None), (11, "frequencies", None), (11, "grafics", None)],
         llibre=[("2eso", 6, [1, 2, 4])], bogdan=[]),

    dict(id="2eso-est-centralitzacio", sentit="estocastic", titol="Mesures de centralització", hores=3,
         detall="La mediana i els quartils. La mitjana aritmètica. La mitjana "
                "aritmètica ponderada.",
         repas=[(11, "centralitzacio", [260, 261, 262, 263, 265, 267])],
         llibre=[("2eso", 6, [3])], bogdan=[]),
]

# ---------------------------------------------------------------- 3r d'ESO
SABERS_3ESO = [
    dict(id="3eso-lec", sentit="lectora", titol="Comprensió lectora matemàtica", hores=12,
         detall="Vocabulari específic. Obtenció d'informació en textos d'àmbit "
                "matemàtic. Expressió algebraica de patrons. Resolució de problemes "
                "a partir d'un context.",
         repas=[], llibre=[], bogdan=[]),

    dict(id="3eso-num-enters", sentit="numeric", titol="Nombres enters i potències", hores=6,
         detall="Operacions combinades amb nombres enters. Potència de base entera i "
                "exponent natural. Potència amb exponent negatiu i amb exponent zero.",
         repas=[(1, "enters", None), (2, "basiques", None),
                (2, "negatiu", None), (2, "combinades", None)],
         llibre=[("3eso", 1, None)], bogdan=["nombres-reals"]),

    dict(id="3eso-num-cientifica", sentit="numeric", titol="Notació científica", hores=3,
         detall="Potències de base 10 amb exponent positiu o negatiu. Aproximar "
                "nombres i expressar-los en notació científica. Multiplicar i dividir "
                "en notació científica.",
         repas=[(2, "verifica", None)],
         llibre=[("3eso", 2, None)], bogdan=["nombres-reals"]),

    dict(id="3eso-esp-semblanca", sentit="espacial", titol="Semblança i teorema de Tales", hores=6,
         detall="Teorema de Tales. Triangles en posició de Tales. Triangles semblants. "
                "Resolució de problemes emprant semblança. Figures semblants i raó de "
                "semblança.",
         repas=[(8, "tales", None), (8, "semblanca", None), (8, "aplicacions", None)],
         llibre=[("3eso", 6, None)], bogdan=["semblanca"]),

    dict(id="3eso-esp-moviments", sentit="espacial", titol="Moviments al pla", hores=9,
         detall="Mòdul, direcció i sentit d'un vector lliure. Coordenades d'un vector. "
                "Translació, gir, simetria axial i simetria central.",
         repas=[],
         llibre=[("3eso", 7, None)], bogdan=["vectors"]),

    dict(id="3eso-mes-semblanca", sentit="mesura", titol="Perímetres i àrees de figures semblants", hores=3,
         detall="Càlcul de perímetres i àrees de figures semblants. Raó entre "
                "perímetres i raó entre àrees de figures semblants.",
         repas=[(8, "semblanca_arees", None)],
         llibre=[("3eso", 6, None)], bogdan=["semblanca"]),

    dict(id="3eso-alg-lineal", sentit="algebraic", titol="Funció lineal i funció afí", hores=6,
         detall="Representació de y=mx i y=mx+n. Pendent i ordenada a l'origen. "
                "Rectes paral·leles. Equació de la recta per dos punts o per pendent "
                "i un punt.",
         repas=[(10, "funcions_lineals", None), (10, "rectes_produccio", None)],
         llibre=[("3eso", 4, None)], bogdan=["funcions"]),

    dict(id="3eso-alg-llenguatge", sentit="algebraic", titol="Llenguatge algebraic", hores=2,
         detall="Traducció al llenguatge algebraic d'un enunciat. Vocabulari: equació, "
                "identitat, grau, membres, termes, incògnita, aïllar. Comprovar la solució.",
         repas=[(5, "problemes", None)],
         llibre=[("3eso", 3, None)], bogdan=["algebra"]),

    dict(id="3eso-alg-equacions", sentit="algebraic", titol="Equació de 1r grau", hores=8,
         detall="ax+b=c. Resolució agrupant termes, aplicant la propietat distributiva "
                "i manipulant denominadors.",
         repas=[(5, "primer_grau", None)],
         llibre=[("3eso", 3, None)], bogdan=["equacions-1r2n-grau"]),

    dict(id="3eso-alg-sistemes", sentit="algebraic", titol="Sistemes d'equacions de 1r grau", hores=8,
         detall="Resolució gràfica. Nombre de solucions i punts en comú de dues rectes. "
                "Mètode de substitució.",
         repas=[(5, "sistemes", None)],
         llibre=[("3eso", 5, None)], bogdan=["sistemes-2x2"]),

    dict(id="3eso-alg-funcions", sentit="algebraic", titol="Estudi d'una funció", hores=12,
         detall="Definició de funció i exemples de no funció. Variable independent i "
                "dependent. Text, taula, gràfica i fórmula. Domini. Creixement i "
                "decreixement. Màxims i mínims. Punts de tall amb els eixos.",
         repas=[(10, "concepte_funcio", None)],
         llibre=[("3eso", 4, None)], bogdan=["funcions"]),

    dict(id="3eso-est-aleatoris", sentit="estocastic", titol="Experiments aleatoris", hores=15,
         detall="Espai mostral. Esdeveniment elemental, segur, impossible i contrari. "
                "Diagrames de Venn. Taules i diagrames d'arbre. Probabilitat d'un "
                "esdeveniment. Regla de Laplace.",
         repas=[(12, "espais_mostrals", None), (12, "combinatoria", None),
                (12, "laplace", None), (12, "esdeveniments", None)],
         llibre=[("3eso", 8, None)], bogdan=[]),
]

CURSOS = [
    dict(id="1eso", titol="1r d'ESO", hores=90, sabers=SABERS_1ESO),
    dict(id="2eso", titol="2n d'ESO", hores=90, sabers=SABERS_2ESO),
    dict(id="3eso", titol="3r d'ESO", hores=90, sabers=SABERS_3ESO),
]

# ---------------------------------------------------------------------------
# Vetos: ítems que el banc genera bé per al seu context original (repàs a
# l'entrada de 1r de batxillerat) però que a un curs baix estan malament.
#
# El cas que ho motiva: 16 dels 26 exercicis de divisibilitat porten nombres
# negatius ("descomposició factorial de -432", "m.c.d. de 45 i -27"). A 1r i
# 2n d'ESO la divisibilitat es treballa dins dels naturals i el signe només
# afegeix soroll. Es filtren pel curs, no pel banc: a 3r, amb els enters ja
# treballats, no caldria.
#
#   (patró sobre l'enunciat, [sabers als quals s'aplica])
VETOS = [
    (r"[−-]\s*\d", ["1eso-num-divisibilitat", "2eso-num-divisibilitat"]),
]

# Ítems fora del banc a tot arreu. El banc de repàs és de resposta múltiple i
# aquests tres enunciats es refereixen a unes opcions que aquí no s'imprimeixen
# ("quin d'aquests valors pot tenir x?"). Sense la llista, no es poden respondre.
EXCLOSOS = {
    "f1-8": "«quin d'aquests valors» — necessita les opcions del test",
    "f1-11": "«quin d'aquests parells» — necessita les opcions del test",
    "f12-238b": "«quin d'aquests és un exemple» — necessita les opcions del test",
}

# Fitxers de "Mates amb Bogdan": material d'ampliació, no genera preguntes.
BOGDAN = {
    "nombres-reals": "Nombres reals",
    "algebra": "Àlgebra",
    "equacions-1r2n-grau": "Equacions de 1r i 2n grau",
    "geometria": "Geometria",
    "semblanca": "Semblança",
    "funcions": "Funcions",
    "polinomis": "Polinomis",
    "sistemes-2x2": "Sistemes 2x2",
    "trigonometria": "Trigonometria",
    "vectors": "Vectors",
}
