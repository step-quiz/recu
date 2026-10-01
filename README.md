# Prova de recuperació — Matemàtiques 1r, 2n i 3r d'ESO

Lloc estàtic per muntar l'examen global de recuperació d'un alumne que arrossega
les matemàtiques d'un curs anterior (3r que recupera 2n, 4t que recupera 3r…). HTML, CSS i JavaScript vainilla: cap build,
cap servidor, cap dependència externa. **Obre `index.html` amb doble clic.**

Genera tres documents des d'una sola selecció de continguts:

| Document | Per a qui | Què porta |
|---|---|---|
| **Prova** | l'alumne | enunciats numerats, punts, i espai quadriculat per respondre |
| **Full de correcció** | el professor | solució, resolució pas a pas, contingut avaluat i graella de puntuació |
| **Pla de repàs** | l'alumne, abans | què ha d'estudiar, a quines activitats del llibre, i exercicis de pràctica amb les solucions |

---

## Com es fa servir

> **La prova és un document, no una consulta.** Marcar un contingut hi
> **afegeix** una pregunta; desmarcar-lo en treu les seves; moure el nombre de
> preguntes n'afegeix o en treu; canviar l'ordre només reordena. Res d'això
> toca les preguntes que ja has triat. L'única cosa que refà la prova de zero
> és el que ho demana explícitament: **Altres preguntes**, canviar el **nivell**
> i canviar el **criteri de repartiment**. I fins i tot allà se salven les
> preguntes pròpies i les marcades amb ☆.

1. **Marca els continguts** a la columna de l'esquerra. És el *Repartiment de
   continguts ESO 2025-26* del departament, tal com està escrit: curs → sentit →
   saber. Clicant el títol del curs es marquen o desmarquen tots de cop.
2. **Ajusta la prova** a la dreta. A dalt hi ha el que es toca a cada prova:
   quantes preguntes, quin nivell i la llista de preguntes. A sota, plegat,
   el que es toca de tant en tant: *Punts, temps i ordre*, *Format del full*,
   *Pla de repàs* i *Preferències*. Cada secció plegada diu al
   títol què hi tens triat (per exemple «38 mm · quadrícula»), o sigui que
   no cal obrir-la per saber-ho; el navegador recorda quines tens obertes.
3. **Revisa el full** al centre. El que hi veus és exactament el que sortirà per
   la impressora; no hi ha una segona maquetació. **La capçalera s'escriu
   damunt del mateix full**: clica el centre, el títol, el subtítol, el nom,
   el grup o les instruccions i escriu-hi (Retorn acaba el camp; a les
   instruccions fa línia nova). Clicant la data s'obre el calendari. Els camps
   buits mostren una pista en gris que no s'imprimeix. El subtítol, si el
   deixes en blanc, torna a ser l'automàtic («Continguts de 2n d'ESO»).
4. **Imprimeix.** Al diàleg del navegador, desmarca *Capçaleres i peus de pàgina*
   i deixa els marges *Per defecte*: els marges reals els posa `@page`.
   «Desa com a PDF» dona el PDF.

**Desa la prova** baixa un fitxer HTML petit que només conté l'adreça d'aquesta
prova exacta, amb el codi i el model ben visibles. Per recuperar-la, fes doble
clic al fitxer, o bé prem **Obre…** a la barra de dalt i tria'l (també el pots
arrossegar damunt de la pàgina). Tens la prova tal com la vas deixar: les preguntes, els punts, el format del full
(espai, fons, figures, enunciats generals) i la capçalera sencera, **nom de
l'alumne inclòs**. Va bé per guardar-la a la carpeta del curs o per passar-la a
un company. (Si hi ha escrit el nom de l'alumne, el fitxer també el porta: tingues-ho
present abans de passar-lo a ningú.)

Si l'eina està publicada en un web, escriu-ne l'adreça al camp **Adreça pública
de l'eina** (a *Preferències*): el fitxer desat hi apuntarà i funcionarà des de
qualsevol ordinador. En blanc, l'enllaç apunta a la còpia d'aquest ordinador
(`file:///…`), i el mateix fitxer t'avisa que si mous la carpeta deixarà de
funcionar. L'adreça es desa amb els valors inicials, o sigui que s'escriu un
cop.

**Desa com a valors inicials** (a *Preferències*) desa al navegador com vols trobar l'eina cada
vegada: continguts marcats, nivell, criteri de punts, format del full i
capçalera. No s'hi desen el nom de l'alumne, el grup, la data, el model ni el
codi de la tria, perquè aquests han de començar de zero cada cop.

Cada prova porta un **codi de cinc caràcters** al peu. Mateix codi, mateixa
prova, sempre. L'adreça de la pàgina el guarda, així que pots desar l'enllaç i
recuperar l'examen mesos després. Per fer models A i B del mateix examen: prem
**Altres preguntes** (o `Ctrl+G`), canvia el camp *Model* (al costat del codi,
a dalt del panell) i torna a imprimir.

### Els controls que no són obvis

**El zoom del full.** El full fa sempre 210 mm d'ample, també en un portàtil on
no hi cap: és l'única manera que la pantalla parteixi les línies igual que el
paper i que el comptador de pàgines encerti. Per defecte s'escala perquè hi
càpiga sencer d'ample (a 1366 px, un 93 %): és l'opció **Ajustat** del
selector *Zoom*, que diu entre parèntesis a quina mida queda. Si hi tries un
altre valor (50, 75, 100 o 125 %), mana el teu fins que hi tornis a posar
*Ajustat*.

Fins ara no era així: a les pantalles de 1280–1440 px el full s'encongia
(fins a 592 px en lloc de 794), el text es partia en més línies que en paper i
el que es veia deixava de ser el que s'imprimia.

**Els cursos es pleguen.** Clicant el nom del curs a la columna de l'esquerra
(«▾ 1r d'ESO») se n'amaguen els continguts; el comptador «3 / 18» continua dient
quants n'hi ha de marcats. Una cerca desplega el que troba. El navegador recorda
quins cursos tens plegats.

**Aparença.** El botó ◐ de dalt passa pel mode del sistema operatiu, el
clar (☀) i el fosc (☾); la icona diu el mode d'ara. El full no canvia mai de color: és paper. La preferència es
desa al navegador, no a la prova.

**Apartats (6a, 6b).** Si dues o més preguntes SEGUIDES són del mateix
exercici i tenen la mateixa consigna, surten com una sola pregunta amb apartats:
«6. Resol aquestes equacions.» i a sota a), b), c), cadascun amb el seu espai de
resposta, els seus punts i les seves icones al marge. La consigna s'imprimeix
un sol cop. La clau i la graella de correcció les numeren 6a, 6b, 6c, i al
panell de la dreta cada pregunta porta l'etiqueta que té al full quan no
coincideix amb la posició. Passa amb els apartats del banc de repàs (f5-75a,
f5-75b…) i amb les variants d'un mateix generador; dos problemes de
*Comprensió lectora*, que no tenen consigna comuna, no s'agrupen. Per tenir-les
separades, desmarca *Agrupa apartats* a la secció *Format del full*.

**Temps estimat.** A dalt del panell, al costat de «La prova», surt quant
tardarà l'alumne a fer la prova contra la *Durada (minuts)* que té (per defecte
55, una hora de classe; es canvia a *Punts, temps i ordre*): en verd si hi cap, en ambre
si probablement no. Compta 4 minuts per pregunta de nivell 1, 6 de nivell 2 i 9
de nivell 3 (les pròpies, com a nivell 2). No surt dels passos de la resolució:
mesurats, els tres nivells en tenen de mitjana gairebé els mateixos (1,8, 2,0 i
2,1); el que els separa és la lectura i la mena de nombres, que és justament el
que mesura el nivell. És una estimació: si amb els teus grups les proves surten
sistemàticament curtes o llargues, els tres valors són a `MINUTS_NIVELL`, a
`assets/js/composa.js`. Una prova de mínims de 10 preguntes surt a uns 40
minuts. La durada es desa amb *Els meus valors inicials* i a l'adreça.

**Exercicis de pràctica.** A la secció *Pla de repàs* del panell tries quants
exercicis per contingut (cap, 1, 2 o 3) porta el pla, i si hi van les solucions
al final. Són del mateix contingut i del mateix nivell que la prova, i la regla
que importa és que **cap no és una pregunta de la prova**; mentre n'hi hagi
d'altres, tampoc un apartat del mateix exercici (21a a la prova i 21b a la
pràctica seria donar-li l'examen). Si el contingut no té res més, s'admet una
altra variant del mateix generador: el mateix tipus d'exercici amb uns altres
nombres. Surten del codi de la prova, o sigui que el mateix enllaç dona sempre
el mateix pla. Cada contingut porta una casella perquè l'alumne el marqui quan
l'ha repassat.

**El nivell d'una pregunta concreta.** Al panell de la dreta, clicant una
pregunta, s'obre amb un selector de nivell. Per defecte diu «General (ara 1)»:
segueix la barreja del control de dalt. Si hi tries 1, 2 o 3, la
clava a aquell nivell i s'hi queda —les fletxes `⟲ ⟳` només oferiran preguntes
d'aquell nivell— fins que la tornis a posar a «general».

Serveix per al cas que ho va motivar: una prova de mínims amb un parell de
preguntes més exigents, sense haver de tocar el nivell general.

Els nivells que un contingut no té surten **desactivats**: només 27 dels 50
en tenen els tres. Angles de 1r d'ESO, per exemple, té 25 preguntes i totes de
nivell 1.

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
| `Mínims` | comprovar si ha assolit els mínims | 1,01 |
| `Equilibrat` | una recuperació normal | 1,25 |
| `Exigent` | pujar nota | 1,84 |

(Mitjana de 300 proves de 20 preguntes amb tot 2n d'ESO marcat.)

`Mínims` i `Equilibrat` viuen tots dos al nivell 1 a propòsit: aquests alumnes
no van aprovar les matemàtiques en cap moment del curs anterior.

**Reparteix les preguntes segons.** `Hores` fa servir les hores de classe del
document del departament: si Equacions són 9 h i Percentatges 4 h, la prova
respecta aquesta proporció. `Banc` reparteix segons quantes preguntes hi ha
disponibles. `Igual` dona el mateix nombre a cada contingut.

**Dos passamans que no es poden apagar.** Un ítem pot declarar que necessita
l'encapçalament (`capCal`: l'enunciat és una dada solta, com «$3850$») o que
necessita la figura (`figuraCal`: la pregunta *és* el dibuix). Aquests dos
elements es continuen imprimint encara que el professor apagui les opcions
corresponents, perquè si no el full sortiria amb preguntes que no es poden
respondre. Els declara el generador; per als 592 ítems de `repas` els dedueix
el compilador. Una comprovació de `tests.js` recorre les quatre combinacions
dels dos interruptors i verifica que cap ítem no es quedi buit amb cap.

**Les accions de cada pregunta.** Al panell de la dreta, cada pregunta és
una fila plegada que només diu què és, de quin contingut i quant val.
Clicant-la (al panell o al mateix full) s'obre, es ressalta al full i
mostra tot el que s'hi pot fer: nivell, punts i aquests botons. Per plegar-la,
el botó `▴` de la fila, tornar-la a clicar o la tecla `Esc`.

| | Què fa | Al marge del full? |
|---|---|---|
| `⟲ ⟳` | la pregunta anterior i la següent d'aquest contingut | `⟳` sí |
| `↻` | uns altres nombres, **la mateixa pregunta** (material propi) | sí |
| `☆` | la fixa perquè sobrevisqui a *Altres preguntes* | no |
| `↑ ↓` | la mou una posició | no |
| `✕` | la treu de la prova | sí |

Al marge esquerre del full només hi ha les tres que es fan mirant la
pregunta (`⟳ ↻ ✕`); abans n'hi havia set a cada pregunta i eren més soroll
que ajuda.

**`⟲` i `⟳` no tiren un dau cada cop.** L'atzar decideix una sola vegada en
quin ordre sortiran totes les preguntes del contingut, i els dos botons
recorren aquesta llista endavant i endarrere. Abans de repetir-ne cap, les
hauràs vistes totes: en un contingut de 31 preguntes calen 31 clics per
tornar a veure la primera. Amb una tria a l'atzar cada clic, el que sortia
era A, B, B, A, C, B, C — tres preguntes vistes de trenta-una.

Quan el contingut té material propi, la volta no s'acaba mai: en arribar al
final s'hi afegeixen variants noves en comptes de tornar a començar.

**La posició de cada pregunta és un camp** al panell de la dreta: escriure-hi
un número la porta allà d'una passa. Les fletxes `↑ ↓` són per a l'ajust fi;
per anar de la catorzena a la tercera no cal fer onze clics.

**Les preguntes noves s'insereixen al seu lloc**, no al final: si afegeixes un
contingut de 1r d'ESO a una prova de 2n, la pregunta va on li toca segons el
currículum. Amb l'ordre «Barrejat» o «De fàcil a difícil» s'afegeix al final,
perquè allà la posició curricular no vol dir res.

`↻` només pot existir on la pregunta ve d'un generador. Les 592 preguntes que
venen del banc de `repas` són text ja escrit i no es poden reparametritzar; les
351 pròpies sí, i el pou és infinit. Trenta-tres dels cinquanta sabers tenen
material propi, i a aquests, a la pràctica, no se'ls acaben mai les preguntes. Per decidir si una pregunta et va bé, l'has d'estar mirant.

El carril dels botons queda dins de la caixa de la pregunta (un `padding-left`
amb un `margin-left` negatiu igual), de manera que el contingut no es mou i
l'alçada tampoc —que és el que mesura el comptador de pàgines— però passar-hi
el ratolí ja compta com a estar sobre la pregunta. I la barra inactiva porta
`pointer-events:none`: amb l'espai de resposta a 0 la barra fa 74 px i la
pregunta 21, o sigui que sobresurt, i un element amb `opacity:0` segueix rebent
clics. `tools/prova.js` comprova tots els botons amb l'espai més atapeït.

En pantalla estreta el full es dibuixa a escala reduïda i uns botons de 17 px en
quedarien 9, o sigui que allà les icones del marge s'amaguen i les accions es
fan des del panell d'ajustos, obrint la pregunta.

**El «− 2 +» de cada contingut marcat** diu quantes preguntes en té la prova
i n'afegeix o en treu d'una en una. És el que cal quan la recuperació s'ha de
construir sobre els criteris concrets que l'alumne no va assolir, i no sobre un
total global. Als continguts no marcats no surt: marcar la casella ja hi posa
una pregunta.

**El nombre de pàgines** surt al costat del botó d'imprimir, amb un «≈»
que no és decoratiu: es calcula simulant la paginació —cada pregunta és un
bloc que no es parteix— i, contrastat contra 126 PDF reals, encerta el
96-98 % de les vegades. Quan falla és sempre una pàgina de menys. Afinar-ho
més voldria paginar de debò, i per a un número que serveix per decidir si val
la pena imprimir no compensa.

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
assets/js/generadors.js   →  351 preguntes pròpies, i infinites variants
llibre (296 PDFs)         →  què repassar, al pla de repàs
Mates amb Bogdan (12 PDF) →  material d'ampliació, al pla de repàs
```

Són **943 preguntes** al catàleg. Un cop compilades, l'eina no distingeix les
d'un origen de les de l'altre.
Els enunciats, les figures SVG i les resolucions són literalment els de `repas`;
el que canvia és que aquí es fan servir com a **resposta oberta**, sense les
quatre opcions: l'alumne escriu el procés.

### Cobertura per curs

**2n d'ESO** queda ben cobert. Els blocs amb més fons són Variables
estadístiques (64), Equacions de 1r grau (55), Divisibilitat (50), Fraccions
(41), Potències (35) i Pitàgores (31).

**Ara mateix no hi ha cap forat**: els 50 sabers del currículum tenen preguntes,
i tots en tenen almenys una de nivell 1. Fins fa poc no era així; el que ho ha
tancat és `assets/js/generadors.js` (vegeu més avall). Si algun dia se'n torna a
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

### El material propi: `assets/js/generadors.js`

Seixanta generadors deterministes que produeixen preguntes amb solució i
passos, i figures SVG on calen. El criteri és el que va sortir de revisar
proves impreses:

- **nombres petits** — cap descomposició de 3850, cap potència que doni −759375;
- **enunciats curts** — el que bloqueja aquest alumnat és llegir i decidir;
- **resultats nets** — cap arrel no exacta donada com a dada.

**Per què són en JavaScript i no en Python.** Perquè el navegador els ha de
poder executar: és el que fa que `↻` pugui donar uns altres nombres sense
sortir del tipus de pregunta. Si el compilador en tingués una còpia en Python,
hi hauria dues versions de cada exercici i acabarien divergint. Per això
`tools/compila.py` executa aquest mateix fitxer amb Node
(`tools/genera.js --cataleg`) per omplir el catàleg de `banc.js`.

**Això vol dir que compilar necessita Node.** Fer servir l'eina, no.

Es comprova sol:

```sh
node tools/genera.js --comprova
```

Verifica sobre 200 tirades de cada generador que cap peti, que sempre tornin
enunciat (o figura), resposta i passos, que els dòlars de LaTeX estiguin
aparellats, i recalcula els m.c.d., els m.c.m., les arrels i les diagonals per
contrastar-los amb la resposta escrita.

**El nivell no es mesura allà.** El mesurador viu a `tools/compila.py` i és
l'únic que hi ha. Cada generador declara el nivell que tenen totes les seves
variants, i en compilar es generen 200 variants de cadascun i es comprova que
sigui cert. Si un generador no és estable, **la compilació s'atura amb error**
i diu quin és i quins nivells li surten: no es genera cap `banc.js` que
prometi un nivell que no és cert. Va atrapar tres casos reals mentre s'escrivia:

- `arr-entre` («entre quins enters és $\sqrt{50}$») el penalitzava l'arrel no
  exacta de l'enunciat, que aquí és l'exercici mateix i no un defecte: exempció
  a `BLOCS_D_ARRELS`.
- `mag-puja` sortia a nivell 1 o 2 segons si el factor de conversió era 10 o
  1000. El factor apareix als passos («$1$ m $= 1000$ mm») i no és cap càrrega
  de càlcul, així que el mesurador va passar a mirar la mida de la **resposta** i
  no la de tot el desenvolupament.
- `mag-superficie` barrejava passar de cm² a mm² amb passar de m² a cm². Són
  exercicis de dificultat diferent —un resultat de cinc xifres no és el mateix—
  i ara són dos generadors, `mag-superficie` i `mag-superficie-gran`.

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

### El material de nivell 1 de cada saber

Tots els sabers en tenen almenys sis de nivell 1 menys un (*Cossos de
revolució*, amb cinc), i l'informe de `compila.py` marca els que es quedin
sense cap («el perfil mínims no els podrà fer servir»). Onze generadors
s'han escrit expressament per als continguts que en tenien menys:

| Generador | Saber | Nivell 1 abans → ara |
|---|---|---|
| `equ-un-pas`, `equ-dos-passos`, `equ-dues-bandes`, `equ-parentesi` | Equació de 1r grau (2n i 3r) | 7 → 31 |
| `alg-comprova`, i `alg-frase` / `alg-context` també per a 3r | Llenguatge algebraic (2n i 3r) | 3r: 1 → 19 · 2n: 13 → 19 |
| `fd-a-decimal`, `fd-a-fraccio` | Fraccions i decimals (1r) | 2 → 14 |
| `pro-regla-tres` | Proporcionalitat (2n) | 5 → 11 |
| `pc-quadrant` | El pla cartesià (2n) | 5 → 11 |
| `are-basica` | Càlcul d'àrees (1r) i Perímetres i àrees (2n) | 5 → 11 · 8 → 14 |
| `vol-cossos` | Àrees i volums a l'espai (2n) | 4 → 10 |

Les equacions són les que un alumne que ve de suspendre ha de saber fer abans
de res: aïllar la *x* amb nombres petits i solucions enteres, amb els passos que
s'escriurien a la pissarra. Les de repàs, en canvi, porten gairebé totes
denominadors o són problemes llargs. `genera.js --comprova` verifica
l'aritmètica de tots: substitueix la solució a l'equació, recalcula el decimal,
la regla de tres, l'àrea i el volum.

---

## Estructura

    index.html                  l'eina sencera (una sola pàgina)
    assets/css/eina.css         pantalla
    assets/css/imprimir.css     @page, marges A4 i salts de pàgina
    assets/js/aparenca.js       clar / fosc / sistema (es carrega al <head>)
    assets/js/atzar.js          atzar amb llavor: exàmens reproduïbles
    assets/js/composa.js        repartiment i tria de preguntes (funció pura)
    assets/js/full.js           construcció dels tres documents imprimibles
    assets/js/app.js            controlador: arbre, estat i render
    assets/js/banc.js           GENERAT — els 943 ítems amb solució
    assets/js/mapa.js           GENERAT — currículum, cobertura i índex del llibre
    assets/lib/katex/           KaTeX en local

    assets/js/generadors.js     els 60 generadors del material propi

    tools/mapa_curricular.py    el mapa saber → fonts. AQUÍ es toca el currículum
    tools/compila.py            genera banc.js i mapa.js (necessita Node)
    tools/genera.js             executa els generadors: catàleg i verificacions
    tools/tests.js              proves de la lògica (node, sense dependències)
    tools/prova.js              prova amb navegador (necessita Playwright)
    tools/prova_compilacio.py   banc.js i mapa.js al dia, compilació determinista

    .github/workflows/proves.yml        les proves, a cada push
    .github/workflows/unzip-upload.yml  descomprimeix els ZIP de _uploads/

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

Fins ara no ho era, tot i que aquí ja ho deia: les variants d'un mateix
generador s'ordenaven tal com sortien d'un `set` de Python, i aquest ordre
canvia a cada execució. Com que l'atzar de la composició recorre aquestes
llistes, un mateix codi de prova donava una altra prova després de cada
recompilació. `tools/prova_compilacio.py` ho vigila.

**Si només has tocat `generadors.js`** (o els títols, les hores o les
referències de `mapa_curricular.py`), no cal tenir a mà `repas` ni el llibre:

```sh
python3 tools/compila.py --nomes-propis
```

Refà el material propi i el mapa i reaprofita la part de repàs del `banc.js` que
ja hi ha. Sense cap canvi, dona un `banc.js` idèntic byte a byte. El que no pot
fer és canviar quins ítems de repàs van a cada saber (la llista `repas`, els
`VETOS`, els `EXCLOSOS`): per a això cal la compilació completa.

La compilació s'atura si el nivell que declara un generador no és el que mesura
`calcula_nivell`: el navegador fa servir el declarat per a les variants noves
(↻ i el selector de nivell de cada pregunta) i no el pot mesurar.

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
node tools/tests.js               # 166 comprovacions de la lògica, cap dependència
node tools/genera.js --comprova   # els 60 generadors sobre 12 000 variants
python3 tools/prova_compilacio.py # banc.js i mapa.js al dia, compilació determinista
node tools/prova.js               # 45 comprovacions en un navegador de debò
```

Totes quatre acaben amb codi 1 si alguna cosa falla. `prova.js` abans només
escrivia per pantalla i acabava sempre bé: un «*** BUIDA ***» passava si ningú
llegia la sortida. Necessita Playwright (`npm install --no-save playwright` i
`npx playwright install chromium`) i no deixa cap fitxer a l'arbre.

`prova.js` comprova, entre altres coses, que el full surti imprès des de
qualsevol de les tres pestanyes. No és paranoia: en imprimir, el navegador
mesura les media queries contra l'amplada del **paper** (uns 794 px a A4) i no
contra la de la finestra, o sigui que la maquetació estreta s'activa sempre. Amb
les regles de pantalla escrites com `@media (max-width:900px)` en comptes de
`@media screen and (max-width:900px)`, la regla que amaga el full a la pestanya
«Continguts» s'aplicava també al paper i sortia un full en blanc. També
comprova que el comptador de pàgines digui el mateix que el PDF real, que cap
exercici de pràctica sigui una pregunta de la prova, que l'adreça torni el
mateix full i que una adreça mal formada no trenqui res.

`tests.js` comprova les coses que fan mal en paper: que els punts sumin
exactament el total demanat (o el mínim assolible, si el terra de 0,25 el puja), que no es repeteixi cap pregunta (ni cap exercici pare
mentre en quedin d'altres), i que el mateix codi doni sempre el mateix examen.

---

## GitHub: proves automàtiques i pujades per ZIP

- **`.github/workflows/proves.yml`** executa les quatre proves a cada push i a
  cada pull request. No escriu res al repositori (no fa cap commit), o sigui
  que no afecta Cloudflare Pages. Es veu a la pestanya **Actions**: verd, tot
  bé; vermell, clica-hi i surt quina comprovació ha fallat.
- **`.github/workflows/unzip-upload.yml`** és el mateix que el del banc de 2n
  de batxillerat: un ZIP pujat a `_uploads/` es descomprimeix a l'arrel, s'hi
  esborra i se'n fa un commit. En acabar, es llancen les proves soles.
  El commit **no** porta «[skip ci]», perquè Cloudflare no el publicaria.
- Els fitxers de `.github/workflows/` no poden arribar dins d'un ZIP: el bot no
  hi té permís. Es creen i s'editen des de la web de GitHub.

---

## El que aquesta eina no fa

- **No corregeix.** El full de correcció porta la solució i els passos, però la
  correcció d'una resposta oberta és feina humana i ha de continuar sent-ho.
- **No sap qui és l'alumne.** No hi ha comptes, ni base de dades, ni res que
  surti del navegador. Si vols saber què ha practicat un alumne abans de decidir
  què li preguntes, això ho fa l'analitzador de `repas` amb el codi de
  verificació; són dues eines separades a propòsit.

---

## Avís

El **full de correcció** i el fitxer `assets/js/banc.js` porten totes les
solucions. Les solucions van codificades en base64 dins de `banc.js` — que és
higiene, no seguretat: qualsevol que sàpiga què és el base64 les llegeix. Si
publiques aquest lloc en un servidor, publica'l en un lloc que l'alumnat no
pugui obrir, igual que ja fas amb els `REVISIO-fullN.html` de `repas`.

El mateix val per al repositori de GitHub: si és **públic**, `banc.js` hi és a
la vista de tothom. Les preguntes del pla de repàs, en canvi, no són cap
secret: estan fetes per donar-les a l'alumne.
