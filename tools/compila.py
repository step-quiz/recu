# -*- coding: utf-8 -*-
"""
Compila el banc de preguntes i el mapa curricular de l'eina.

  python3 tools/compila.py --repas <ruta-a-repas-main> --llibre <ruta-a-llibre-main>

Llegeix els dotze `data/fullN.js` de repàs, es queda només amb els ítems que
el mapa curricular assigna a algun saber de 1r o 2n d'ESO, i escriu:

  assets/js/banc.js   window.BANC = {items:[...]}   enunciats + solucions
  assets/js/mapa.js   window.MAPA = {cursos:[...]}  currículum + cobertura

Tots dos són fitxers .js que assignen a window, no JSON: així l'eina
funciona obrint index.html amb doble clic, sense servidor. Un fetch() de
JSON des de file:// el bloqueja el navegador.

La compilació és determinista: mateixes entrades, mateixa sortida.
"""
import argparse
import base64
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mapa_curricular import CURSOS, SENTITS, BOGDAN  # noqa: E402


def llegeix_full(carpeta, n):
    """Extreu l'objecte JSON de dins de `window.FULL = {...};`."""
    with open(os.path.join(carpeta, "data", f"full{n}.js"), encoding="utf-8") as f:
        s = f.read()
    return json.loads(s[s.index("{"): s.rindex("}") + 1])


def neteja_svg(svg):
    """L'SVG de repàs porta variables CSS amb color de reserva; a paper volem
    el gris de la figura i el traç en negre. Deixem `currentColor` (l'hereta
    el contenidor) i fixem les dues variables que fa servir."""
    if not svg:
        return None
    svg = svg.replace('var(--fig-plena, #E9F0F6)', 'var(--fig-plena)')
    svg = svg.replace('var(--fig-marca, #B3453C)', 'var(--fig-marca)')
    return svg


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--repas", required=True)
    p.add_argument("--llibre", required=True)
    p.add_argument("--sortida", default=os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "assets", "js"))
    args = p.parse_args()

    fulls = {n: llegeix_full(args.repas, n) for n in range(1, 13)}

    # index (full, bloc, ex) -> ítems, i (full, bloc) -> títol del bloc
    per_ex = {}
    titol_bloc = {}
    for n, d in fulls.items():
        for b in d["blocs"]:
            titol_bloc[(n, b["id"])] = b["titol"]
        for it in d["items"]:
            per_ex.setdefault((n, it["bloc"], it["ex"]), []).append(it)

    items_sortida = {}   # id global -> ítem
    cursos_sortida = []
    avisos = []

    for curs in CURSOS:
        sabers = []
        for s in curs["sabers"]:
            ids = []
            for (full, bloc, exs) in s["repas"]:
                if (full, bloc) not in titol_bloc:
                    avisos.append(f"{s['id']}: no existeix el bloc {bloc} al full {full}")
                    continue
                if exs is None:
                    exs = sorted({k[2] for k in per_ex if k[0] == full and k[1] == bloc})
                for ex in exs:
                    llista = per_ex.get((full, bloc, ex))
                    if not llista:
                        avisos.append(f"{s['id']}: no hi ha ex{ex} a full{full}/{bloc}")
                        continue
                    for it in llista:
                        gid = f"f{full}-{it['id']}"
                        if gid not in items_sortida:
                            clau = json.loads(base64.b64decode(it["clau"]).decode("utf-8"))
                            correcta = it["opcions"][clau["ok"]]
                            resolucio = clau.get("res", [])
                            items_sortida[gid] = {
                                "id": gid,
                                "full": full,
                                "bloc": bloc,
                                "blocTitol": titol_bloc[(full, bloc)],
                                "ex": it["ex"],
                                "ap": it["ap"],
                                "dif": it["dif"],
                                "cap": it.get("encapcalament", ""),
                                "enunciat": it["enunciat"],
                                "figura": neteja_svg(it.get("figura")),
                                "nota": it.get("nota", ""),
                                # Solució xifrada en base64, com fa repàs amb `clau`:
                                # evita que surti en clar si el fitxer va a parar
                                # a mans d'un alumne. No és seguretat, és higiene.
                                "sol": base64.b64encode(json.dumps(
                                    {"r": correcta, "p": resolucio},
                                    ensure_ascii=False).encode("utf-8")).decode("ascii"),
                                "sabers": [],
                            }
                        if s["id"] not in items_sortida[gid]["sabers"]:
                            items_sortida[gid]["sabers"].append(s["id"])
                        ids.append(gid)

            ids = sorted(set(ids), key=lambda g: (items_sortida[g]["full"],
                                                  items_sortida[g]["ex"],
                                                  items_sortida[g]["ap"]))
            per_dif = {1: 0, 2: 0, 3: 0}
            for g in ids:
                per_dif[items_sortida[g]["dif"]] += 1

            sabers.append({
                "id": s["id"],
                "titol": s["titol"],
                "sentit": s["sentit"],
                "sentitTitol": SENTITS[s["sentit"]],
                "hores": s["hores"],
                "detall": s["detall"],
                "items": ids,
                "perDif": [per_dif[1], per_dif[2], per_dif[3]],
                "llibre": [{"curs": c, "ud": u, "act": a} for (c, u, a) in s["llibre"]],
                "bogdan": [{"id": b, "titol": BOGDAN.get(b, b)} for b in s["bogdan"]],
            })

        cursos_sortida.append({
            "id": curs["id"], "titol": curs["titol"],
            "hores": curs["hores"], "sabers": sabers,
        })

    # Títols de les unitats i activitats del llibre, per al pla de repàs.
    llibre = {}
    for c in ("1eso", "2eso"):
        ruta = os.path.join(args.llibre, "contingut", c, "course.json")
        if not os.path.exists(ruta):
            avisos.append(f"llibre: falta {ruta}")
            continue
        with open(ruta, encoding="utf-8") as f:
            d = json.load(f)
        llibre[c] = {
            "label": d.get("label", c),
            "prefix": d.get("pdfPrefix", c),
            "units": [{"num": u["num"], "title": u["title"],
                       "activities": [{"num": a["num"], "title": a["title"]}
                                      for a in u["activities"]]}
                      for u in d["units"]],
        }

    os.makedirs(args.sortida, exist_ok=True)
    capcalera = "/* Generat per tools/compila.py — no editeu aquest fitxer a mà. */\n"

    items = [items_sortida[k] for k in sorted(items_sortida,
             key=lambda g: (items_sortida[g]["full"], items_sortida[g]["ex"],
                            items_sortida[g]["ap"]))]
    with open(os.path.join(args.sortida, "banc.js"), "w", encoding="utf-8") as f:
        f.write(capcalera + "window.BANC = ")
        json.dump({"items": items}, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    with open(os.path.join(args.sortida, "mapa.js"), "w", encoding="utf-8") as f:
        f.write(capcalera + "window.MAPA = ")
        json.dump({"cursos": cursos_sortida, "llibre": llibre},
                  f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    # ------------------------------------------------------------- informe
    print(f"Ítems al banc: {len(items)}")
    for c in cursos_sortida:
        buits = [s for s in c["sabers"] if not s["items"]]
        tot = sum(len(s["items"]) for s in c["sabers"])
        print(f"\n{c['titol']}: {len(c['sabers'])} sabers, {tot} assignacions d'ítem")
        for s in c["sabers"]:
            marca = "  " if s["items"] else "!!"
            print(f"  {marca} {s['id']:26s} {len(s['items']):3d} it. "
                  f"(f{s['perDif'][0]}/{s['perDif'][1]}/{s['perDif'][2]}) "
                  f"{s['hores']:2d}h  {s['titol']}")
        if buits:
            print(f"     -> sense cap ítem: {', '.join(s['id'] for s in buits)}")
    if avisos:
        print("\nAvisos:")
        for a in avisos:
            print("  -", a)


if __name__ == "__main__":
    main()
