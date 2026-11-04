# -*- coding: utf-8 -*-
"""
Instantània dels títols d'un llibre d'Overleaf, per a les referències al llibre.

  python3 tools/llibre_des_de_tex.py <arrel-overleaf> 4eso-apl "4t ESO A"

Llegeix `<curs>/index-<curs>.tex` (taula UD / títol) i els `\\horatitol{…}` de
cada activitat, i escriu `tools/llibre/<curs>.json` amb el mateix format que el
`course.json` del repositori `llibre`. Les proves escrites no porten
`\\horatitol` (no es publiquen) i queden fora, igual que al web.
"""
import json
import os
import re
import sys

arrel, curs, etiqueta = sys.argv[1], sys.argv[2], sys.argv[3]
index = open(os.path.join(arrel, curs, f"index-{curs}.tex"), encoding="utf-8").read()

titols = {}
for m in re.finditer(r"^\s*(\d+) & ([^&\\]+?)(?: \([^)]*\))? &", index, re.M):
    titols.setdefault(int(m.group(1)), m.group(2).strip())

unitats = []
for u in sorted(titols):
    acts = []
    carpeta = os.path.join(arrel, curs, f"ud{u}")
    fitxers = sorted(os.listdir(carpeta), key=lambda f: int(re.search(r"-(\d+)\.tex$", f).group(1)))
    for f in fitxers:
        n = int(re.search(r"-(\d+)\.tex$", f).group(1))
        t = open(os.path.join(carpeta, f), encoding="utf-8").read()
        m = re.search(r"^[^%\n]*\\horatitol\{Activitat \d+ — ([^}]*)\}", t, re.M)
        if m:
            acts.append({"num": n, "title": m.group(1).strip()})
    unitats.append({"num": u, "title": titols[u], "activities": acts})

sortida = os.path.join(os.path.dirname(os.path.abspath(__file__)), "llibre", f"{curs}.json")
with open(sortida, "w", encoding="utf-8") as f:
    json.dump({"label": etiqueta, "prefix": curs, "units": unitats}, f,
              ensure_ascii=False, indent=1)
    f.write("\n")
print(f"{sortida}: {len(unitats)} unitats, {sum(len(u['activities']) for u in unitats)} activitats")
