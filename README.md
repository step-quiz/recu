# Prova de recuperació — Matemàtiques 1r, 2n i 3r d'ESO

Lloc estàtic per muntar l'examen global de recuperació d'un alumne que arrossega
les matemàtiques d'un curs anterior (3r que recupera 2n, 4t que recupera 3r…). HTML, CSS i JavaScript vainilla: cap build,
cap servidor, cap dependència externa. **Obre `index.html` amb doble clic.**

Genera tres documents des d'una sola selecció de continguts:

| Document | Per a qui | Què porta |
|---|---|---|
| **Prova** | l'alumne | enunciats numerats, punts, i espai quadriculat per respondre |
| **Full de correcció** | el professor | solució, resolució pas a pas, contingut avaluat i graella de puntuació |
| **Pla de repàs** | l'alumne, abans | què ha d'estudiar i a quines activitats del llibre |

---

## Com es fa servir

1. **Marca els continguts** a la columna de l'esquerra. És el *Repartiment de
   continguts ESO 2025-26* del departament, tal com està escrit: curs → sentit →
   saber. Clicant el títol del curs es marquen o desmarquen tots de cop.
2. **Ajusta la prova** a la dreta: quantes preguntes, quin nivell, com es
   reparteixen i quants punts val en total.
3. **Revisa el full** al centre. El que hi veus és exactament el que sortirà per
   la impressora; no hi ha una segona maquetació.
4. **Imprimeix.** Al diàleg del navegador, desmarca *Capçaleres i peus de pàgina*
   i deixa els marges *Per defecte*: els marges reals els posa `@page`.
   «Desa com a PDF» dona el PDF.

**Desa la prova** baixa un fitxer HTML petit que només conté l'adreça d'aquesta
prova exacta, amb el codi i el model ben visibles. Obre'l amb doble clic i tens
la prova tal com la vas deixar. Va bé per guardar-la a la carpeta del curs o per
passar-la a un company. Si mous la carpeta de l'eina, l'enllaç deixa de
funcionar: apunta al lloc on hi havia `index.html`.

**Els meus valors inicials** desa al navegador com vols trobar l'eina cada
vegada: continguts marcats, nivell, criteri de punts, format del full i
capçalera. No s'hi desen el nom de l'alumne, el grup, la data, el model ni el
codi de la tria, perquè aquests han de començar de zero cada cop.

Cada prova porta un **codi de cinc caràcters** al peu. Mateix codi, mateixa
prova, sempre. L'adreça de la pàgina el guarda, així que pots desar l'enllaç i
recuperar l'examen mesos després. Per fer models A i B del mateix examen: prem
**Altres preguntes** (o `Ctrl+G`), canvia el camp *Model* i torna a imprimir.

### Els controls que no són obvis

**Nivell de les preguntes.** No és el `dif` del banc de `repas`, que està
calibrat per a repàs a l'entrada de batxillerat. Aquí es recalcula a
`tools/compila.py` mesurant les dues coses que bloquegen un alumne amb
mancances grosses:

- **quant ha de llegir** — caràcters de l'encapçalament *i* de l'enunciat, i
  quantes dades ha de processar (una llista de 50 valors és lectura pura);
- **com són els nombres** — el més gran de l'enunciat, el més gran de la
  solució, el denominador més gran del resultat, si hi ha una arrel no exacta
  *donada a l'enunciat*, i si hi ha fraccions a l'enunciat quan el tema no són
  les fraccions.

L'última també ve del departament: `x/5 = 3` es resol en un pas, però una
equació amb denominadors no és de mínims per a qui ve de suspendre tot el curs.
Les fraccions només compten com a càrrega fora dels blocs on la fracció és el
contingut que s'avalua (la llista és `BLOCS_DE_FRACCIONS`, a
`tools/mapa_curricular.py`).

L'última distinció importa: `\sqrt{89}` com a **resultat** de la diagonal d'un
rectangle de 5×8 és normal i no penalitza; `\sqrt{164}` com a **alçada donada**
d'un trapezi és artificial i el treu de nivell 1. Els casos concrets que van
fixar aquesta calibració estan a `tools/tests.js`, a la llista `VEREDICTES`,
amb el motiu escrit al costat: si algú retoca la fórmula i torna a colar la
descomposició factorial de 3850 al nivell mínim, salta una prova.

| Perfil | Per a què serveix | Nivell mitjà mesurat (2n d'ESO) |
|---|---|---|
| `Mínims` | comprovar si ha assolit els mínims | 1,05 |
| `Equilibrat` | una recuperació normal | 1,30 |
| `Exigent` | pujar nota | 1,85 |

`Mínims` i `Equilibrat` viuen tots dos al nivell 1 a propòsit: aquests alumnes
no van aprovar les matemàtiques en cap moment del curs anterior.

**Reparteix les preguntes segons.** `Hores` fa servir les hores de classe del
document del departament: si Equacions són 9 h i Percentatges 4 h, la prova
respecta aquesta proporció. `Banc` reparteix segons quantes preguntes hi ha
disponibles. `Igual` dona el mateix nombre a cada contingut.

**Les icones de cada pregunta**: `☆` la fixa perquè sobrevisqui a *Altres
preguntes*, `⟳` la canvia per una altra del mateix contingut, `↑ ↓` la mou,
`✕` la treu.

**El «+» i el «−» de cada contingut** afegeixen o treuen una pregunta d'aquell
contingut sense refer la prova. És el que cal quan la recuperació s'ha de
construir sobre els criteris concrets que l'alumne no va assolir, i no sobre un
total global. Al costat hi surt quantes n'hi ha triades.

**Els punts es reparteixen.** `Igual` dona el mateix a totes; `Per nivell` fa
que una de nivell 3 valgui el doble que una d'1; `Per hores` segueix les hores
del contingut al currículum. I es pot **escriure el valor de qualsevol pregunta
a mà**: queda fixat (es marca en blau) i la resta es reparteixen el que sobra.

**+ Pregunta pròpia.** Escriu-hi l'enunciat i la solució; el LaTeX va entre
dòlars (`$x^2+1$`). Serveix per als continguts que no tenen banc (vegeu més
avall). Les preguntes pròpies queden fixades i no es perden en regenerar.

---

## D'on surt el contingut

Res del que hi ha aquí és nou: això és una capa d'índex sobre material que ja
tenies.

```
El .docx del departament  →  l'estructura: 50 sabers, amb les seves hores
repas (banc de 892 items) →  592 preguntes, amb les seves solucions
tools/generador.py        →  244 preguntes pròpies, per als forats de repàs
llibre (296 PDFs)         →  què repassar, al pla de repàs
Mates amb Bogdan (12 PDF) →  material d'ampliació, al pla de repàs
```

Són **836 preguntes** en total. Un cop compilades, l'eina no distingeix les
d'un origen de les de l'altre.
Els enunciats, les figures SVG i les resolucions són literalment els de `repas`;
el que canvia és que aquí es fan servir com a **resposta oberta**, sense les
quatre opcions: l'alumne escriu el procés.

### Cobertura per curs

**2n d'ESO** queda ben cobert. Els blocs amb més fons són Estadística (52),
Fraccions (41), Potències (35), Pitàgores (31), Equacions de 1r grau (31) i
Poliedres (27).

**Ara mateix no hi ha cap forat**: els 50 sabers del currículum tenen preguntes,
i tots en tenen almenys una de nivell 1. Fins fa poc no era així; el que ho ha
tancat és `tools/generador.py` (vegeu més avall). Si algun dia se'n torna a
obrir un, els sabers sense preguntes no es llisten i al peu del curs hi surt una
línia que en diu el nombre.

Els forats que hi havia al banc de `repas` i que ara cobreix el material propi:

| Saber | Curs | Hores |
|---|---|---|
| Comprensió lectora matemàtica | 1r, 2n, 3r | 12 / 9 / 12 |
| Arrel quadrada | 1r | 3 |
| Elements geomètrics al pla | 1r | 3 |
| Magnituds i unitats | 1r | 2 |
| Llenguatge algebraic | 1r | 3 |
| Vocabulari geomètric | 2n | 2 |
| Moviments al pla | 3r | 9 |

I els que en tenien massa poc, o cap de prou curt: Angles (1 ítem), Perímetres
(2), Polígons (3), Divisibilitat, Nombres decimals, Gràfics i taules,
Circumferència i cercle, Semblança.

### El material propi: `tools/generador.py`

Quinze generadors deterministes que produeixen 244 preguntes amb solució i
passos, i figures SVG on calen. El criteri és el que va sortir de revisar
proves impreses:

- **nombres petits** — cap descomposició de 3850, cap potència que doni −759375;
- **enunciats curts** — el que bloqueja aquest alumnat és llegir i decidir;
- **resultats nets** — cap arrel no exacta donada com a dada.

Es comprova sol:

```sh
python3 tools/generador.py --comprova
```

Verifica que no hi hagi ids repetits, que cap ítem es quedi sense enunciat ni
figura, que els dòlars de LaTeX estiguin aparellats, i recalcula els m.c.d.,
els m.c.m. i les arrels per contrastar-los amb la resposta escrita.

Per canviar el material, s'edita el generador corresponent i es recompila. La
constant `LLAVOR` de dalt de tot fixa quins exemples surten: canviar-la genera
un joc nou d'exercicis del mateix tipus.

### Ítems que s'exclouen a propòsit

`tools/mapa_curricular.py` porta dues llistes de filtre, totes dues documentades
al fitxer:

- **`VETOS`** — 16 dels 26 exercicis de divisibilitat porten nombres negatius
  («descomposició factorial de −432», «m.c.d. de 45 i −27»). A 1r i 2n la
  divisibilitat es treballa dins dels naturals, i el signe només afegeix soroll.
  A 3r no es filtren.
- **`EXCLOSOS`** — tres enunciats es referien a unes opcions que aquí no
  s'imprimeixen («quin d'aquests valors pot tenir *x*?») i sense la llista no es
  poden respondre.

### Sabers que el perfil «Mínims» no pot servir

L'informe de `compila.py` els llista. Ara mateix són sis, i el cas de
divisibilitat val la pena entendre'l: després de treure els 16 exercicis amb
nombres negatius, els que queden són gairebé tots problemes d'aplicació del
m.c.m. («fanals cada 12 m i cada 18 m…»), que són de nivell 2 per llargada. Si
marques Divisibilitat amb el perfil `Mínims`, sortirà igualment el millor que hi
hagi, però no serà curt. Per a un exercici mecànic de descomposició amb nombres
petits cal escriure'l amb **+ Pregunta pròpia** o afegir un generador nou a
`repas`.

---

## Estructura

    index.html                  l'eina sencera (una sola pàgina)
    assets/css/eina.css         pantalla
    assets/css/imprimir.css     @page, marges A4 i salts de pàgina
    assets/js/atzar.js          atzar amb llavor: exàmens reproduïbles
    assets/js/composa.js        repartiment i tria de preguntes (funció pura)
    assets/js/full.js           construcció dels tres documents imprimibles
    assets/js/app.js            controlador: arbre, estat i render
    assets/js/banc.js           GENERAT — els 411 ítems amb solució
    assets/js/mapa.js           GENERAT — currículum, cobertura i índex del llibre
    assets/lib/katex/           KaTeX en local

    tools/mapa_curricular.py    el mapa saber → fonts. AQUÍ es toca el currículum
    tools/compila.py            genera banc.js i mapa.js
    tools/tests.js              proves de la lògica (node, sense dependències)
    tools/prova.js              prova de fum amb navegador (necessita Playwright)

### Per què fitxers `.js` i no `.json`

Perquè l'eina ha de funcionar amb doble clic. Un `fetch()` d'un JSON des de
`file://` el bloqueja el navegador; `banc.js` i `mapa.js` assignen a `window` i
es carreguen amb un `<script>`, que sí que funciona. És la mateixa decisió que ja
hi ha a `repas` amb `data/fullN.js`.

### Per què KaTeX en local i cap tipografia web

Perquè el filtre del centre bloqueja els CDN, i perquè 87 % dels enunciats porten
LaTeX: sense KaTeX l'examen surt imprès amb `$3x-4x^2$` en cru. La carpeta
`assets/lib/katex/` ha de viatjar sempre amb `index.html`.

---

## Canviar el currículum

El mapa és un sol fitxer de Python, `tools/mapa_curricular.py`. Cada saber és una
entrada com aquesta:

```python
dict(id="2eso-alg-equacions", sentit="algebraic",
     titol="Equació de 1r grau", hores=9,
     detall="ax=b; ax+b=c. Resolució agrupant termes…",
     repas=[(5, "primer_grau", None),            # (full, bloc, exercicis)
            (5, "problemes", [91, 92, 99, 100])], # None = tot el bloc
     llibre=[("2eso", 4, None)],                  # (curs, unitat, activitats)
     bogdan=["equacions-1r2n-grau"]),
```

Després es recompila:

```sh
python3 tools/compila.py --repas ../repas-main --llibre ../llibre-main
```

L'informe que surt per pantalla diu, saber per saber, quants ítems hi han quedat
i com estan repartits per dificultat, i marca amb `!!` els que s'han quedat a
zero. La compilació és determinista: entrades iguals, sortida idèntica.

**Decisions del mapa que potser vols canviar**, i que són meves, no del document:

- La fracció generatriu de decimals periòdics està a *Fraccions i decimals* de
  1r. Al banc, els exercicis 27–33 barregen periòdic pur i mixt, que molts
  departaments porten a 3r. Ara mateix només s'hi assigna l'exercici 27
  (decimals exactes); els altres no entren enlloc.
- *Angles* surt dos cops a 1r (a Sentit espacial i a Sentit de la mesura) perquè
  el document del departament ho fa així. Comparteixen l'únic ítem que hi ha, i
  per això marcar-los tots dos no dona dues preguntes.
- *Escala* de 1r hereta els 19 ítems del Full 8, que inclouen escales amb canvi
  d'unitats: per a 1r potser són massa.

---

## Comprovar que tot funciona

```sh
node tools/tests.js       # 64 comprovacions, cap dependència
node tools/prova.js       # obre l'eina en un navegador i genera els tres PDF
```

`prova.js` comprova, entre altres coses, que el full surti imprès des de
qualsevol de les tres pestanyes. No és paranoia: en imprimir, el navegador
mesura les media queries contra l'amplada del **paper** (uns 794 px a A4) i no
contra la de la finestra, o sigui que la maquetació estreta s'activa sempre. Amb
les regles de pantalla escrites com `@media (max-width:900px)` en comptes de
`@media screen and (max-width:900px)`, la regla que amaga el full a la pestanya
«Continguts» s'aplicava també al paper i sortia un full en blanc.

`tests.js` comprova les tres coses que fan mal en paper: que els punts sumin
exactament el total, que no es repeteixi cap pregunta (ni cap exercici pare
mentre en quedin d'altres), i que el mateix codi doni sempre el mateix examen.
`prova.js` necessita Playwright i deixa `_prova.pdf`, `_clau.pdf` i `_pla.pdf`
al costat de l'`index.html`.

---

## El que aquesta eina no fa

- **No corregeix.** El full de correcció porta la solució i els passos, però la
  correcció d'una resposta oberta és feina humana i ha de continuar sent-ho.
- **No sap qui és l'alumne.** No hi ha comptes, ni base de dades, ni res que
  surti del navegador. Si vols saber què ha practicat un alumne abans de decidir
  què li preguntes, això ho fa l'analitzador de `repas` amb el codi de
  verificació; són dues eines separades a propòsit.
- **No agrupa apartats.** Si dos ítems del mateix exercici entren a la mateixa
  prova, surten com dues preguntes numerades i no com «6a» i «6b». És la millora
  més evident que hi queda per fer.

---

## Avís

El **full de correcció** i el fitxer `assets/js/banc.js` porten totes les
solucions. Les solucions van codificades en base64 dins de `banc.js` — que és
higiene, no seguretat: qualsevol que sàpiga què és el base64 les llegeix. Si
publiques aquest lloc en un servidor, publica'l en un lloc que l'alumnat no
pugui obrir, igual que ja fas amb els `REVISIO-fullN.html` de `repas`.
