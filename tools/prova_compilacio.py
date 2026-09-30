# -*- coding: utf-8 -*-
"""
Els fitxers generats estan al dia i la compilació és determinista.

    python3 tools/prova_compilacio.py

Torna a compilar el material propi (`compila.py --nomes-propis`) en una
carpeta temporal, dues vegades i amb dues llavors de hash de Python
diferents, i comprova que totes dues sortides siguin idèntiques, byte a
byte, als `assets/js/banc.js` i `assets/js/mapa.js` del repositori.

Atrapa dues coses:
  - algú ha tocat `generadors.js` o `mapa_curricular.py` i no ha
    recompilat: el navegador faria servir un generador que el catàleg no
    coneix, o un títol que el mapa no diu;
  - la compilació ha deixat de ser determinista. Ja va passar: les
    variants d'un generador s'ordenaven com sortien d'un `set`, i un mateix
    codi de prova canviava de preguntes després de cada recompilació.

No comprova la part de `repas` (cal repas-main i llibre-main); aquesta la
dona per bona tal com és a `banc.js`.
"""
import filecmp
import os
import shutil
import subprocess
import sys
import tempfile

ARREL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
GENERATS = ("banc.js", "mapa.js")


def compila_a(carpeta, llavor_hash):
    for f in GENERATS:
        shutil.copy(os.path.join(ARREL, "assets", "js", f), carpeta)
    entorn = dict(os.environ, PYTHONHASHSEED=str(llavor_hash), PYTHONDONTWRITEBYTECODE="1")
    subprocess.run([sys.executable, os.path.join(ARREL, "tools", "compila.py"),
                    "--nomes-propis", "--sortida", carpeta],
                   check=True, capture_output=True, text=True, env=entorn)


def main():
    fallades = 0
    for llavor in (1, 2):
        with tempfile.TemporaryDirectory() as tmp:
            compila_a(tmp, llavor)
            for f in GENERATS:
                igual = filecmp.cmp(os.path.join(tmp, f),
                                    os.path.join(ARREL, "assets", "js", f), shallow=False)
                print(f"  {'ok   ' if igual else 'FALLA'} {f} al dia (PYTHONHASHSEED={llavor})")
                fallades += not igual
    if fallades:
        print("\nCal recompilar:  python3 tools/compila.py --nomes-propis\n"
              "Si després d'això segueix fallant amb una sola de les llavors, "
              "la compilació ha deixat de ser determinista.")
    print(f"\n{4 - fallades} correctes, {fallades} fallades")
    sys.exit(1 if fallades else 0)


if __name__ == "__main__":
    main()
