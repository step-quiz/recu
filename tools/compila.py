# -*- coding: utf-8 -*-
"""
Compila el banc de preguntes i el mapa curricular de l'eina.

  python3 tools/compila.py --repas <ruta-a-repas-main> --llibre <ruta-a-llibre-main>

Llegeix els dotze `data/fullN.js` de repàs, es queda només amb els ítems que
el mapa curricular assigna a algun saber de 1r, 2n o 3r d'ESO, i escriu:

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
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mapa_curricular import (CURSOS, SENTITS, BOGDAN, VETOS, EXCLOSOS,  # noqa: E402
                             BLOCS_DE_FRACCIONS, BLOCS_D_ARRELS)


def llegeix_full(carpeta, n):
    """Extreu l'objecte JSON de dins de `window.FULL = {...};`."""
    with open(os.path.join(carpeta, "data", f"full{n}.js"), encoding="utf-8") as f:
        s = f.read()
    return json.loads(s[s.index("{"): s.rindex("}") + 1])


def node(args):
    """Executa un script de Node del projecte i torna la seva sortida."""
    arrel = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return subprocess.run(["node"] + [os.path.join(arrel, args[0])] + args[1:],
                          check=True, capture_output=True, text=True).stdout


def nivells_per_generador(n):
    """
    Els nivells que surten de `n` variants de cada generador, mesurats amb
    el mateix `calcula_nivell` que la resta del banc.
    """
    out = {}
    for it in json.loads(node(["tools/genera.js", "--mostra", str(n)])):
        out.setdefault(it["gen"], set()).add(calcula_nivell(
            {"enunciat": it["enunciat"], "dif": 1},
            it["passos"], it["resposta"], it["cap"], it["gen"]))
    return out


def text_pla(html):
    """Enunciat sense etiquetes ni ordres de LaTeX, per mesurar-ne la llargada."""
    t = re.sub(r"<[^>]+>", " ", html or "")
    t = re.sub(r"\\[a-zA-Z]+", " ", t)
    t = re.sub(r"[${}\\]", "", t)
    return re.sub(r"\s+", " ", t).strip()


def nombres(text):
    r"""
    Tots els valors numèrics d'un text, com a floats.

    Cal desfer abans el separador de milers de LaTeX: el banc escriu
    -759\,375 i, sense això, es llegia com dos nombres (759 i 375) i una
    potència que dona -759375 passava per petita.
    """
    text = re.sub(r"(\d)\\[,;:]\s*(\d)", r"\1\2", text or "")
    return [float(x.replace("{,}", ".").replace(",", "."))
            for x in re.findall(r"\d+(?:\{,\}\d+|[.,]\d+)?", text)]


def denominadors(text):
    """Denominadors de les fraccions LaTeX: \\dfrac{a}{b} -> b."""
    out = []
    for b in re.findall(r"\\d?frac\{[^{}]*\}\{(\d+)\}", text or ""):
        out.append(int(b))
    return out


def arrels_lletges(text):
    """Arrels quadrades no exactes: \\sqrt{164} sí, \\sqrt{144} no."""
    out = []
    for n in re.findall(r"\\sqrt\{(\d+)\}", text or ""):
        v = int(n)
        if int(v ** 0.5) ** 2 != v:
            out.append(v)
    return out


def calcula_nivell(item, resolucio, resposta, cap, bloc=""):
    """
    Nivell 1..3 recalculat, que NO és el `dif` del banc.

    El `dif` de repàs està calibrat per a repàs a l'entrada de batxillerat i,
    mesurat, no distingeix la càrrega de càlcul: els ítems de dif 1 tenen de
    mitjana 2,1 passos de resolució i els de dif 2 en tenen 1,9.

    Un alumne que ve de suspendre tot el curs es bloqueja per dues coses:
    haver de llegir molt i haver de manegar nombres grossos o lletjos. Les
    dues es mesuren aquí. Els casos que ho han motivat, tots donats per bons
    pel meu mesurador anterior i tots rebutjats pel departament:

      f1-5a    descomposició factorial de 3850
      f2-37b   [(-5)*3]^5, que dona -759375
      f7-140b  un trapezi amb l'alçada donada com \\sqrt{164}
      f11-224a una llista de 50 dades per contestar de quin tipus és la variable

    L'últim també destapa un error de mesura: les 50 dades viuen a
    l'encapçalament, no a l'enunciat, i abans només es mirava l'enunciat.
    """
    punts = 0
    imprès = text_pla(cap) + " " + text_pla(item["enunciat"])
    passos = len(resolucio)
    sol = resposta + " " + " ".join(resolucio)

    # --- llegir -------------------------------------------------------------
    # Llindars sobre encapçalament + enunciat, que és el que l'alumne llegeix
    # de debò. Un exercici normal amb la seva consigna ("Troba l'àrea
    # d'aquests trapezis isòsceles. Bases de 3 cm i 10 cm, alçada de 6 cm.")
    # fa uns 80 caràcters i ha de comptar com a curt.
    n = len(imprès.strip())
    if n >= 240:
        punts += 3
    elif n >= 165:
        punts += 2
    elif n >= 105:
        punts += 1

    # Una llista de dades és lectura pura: comptar-les mesura millor la
    # feina que no pas els caràcters.
    dades = len(nombres(imprès))
    if dades >= 25:
        punts += 3
    elif dades >= 15:
        punts += 2

    # --- calcular -----------------------------------------------------------
    if passos >= 5:
        punts += 2
    elif passos == 4:
        punts += 1

    gran_enunciat = max(nombres(imprès), default=0)
    if gran_enunciat >= 1000:
        punts += 2
    elif gran_enunciat >= 200:
        punts += 1

    # Es mesura la RESPOSTA i no tot el desenvolupament: el que costa és el
    # nombre que l'alumne ha de produir. Als passos hi surten factors de
    # conversió ("1 m = 1000 mm") que no són cap càrrega de càlcul i que
    # feien que un canvi d'unitats es comptés com un exercici gros.
    gran_solucio = max(nombres(resposta), default=0)
    if gran_solucio >= 100000:
        punts += 3
    elif gran_solucio >= 10000:
        punts += 2
    elif gran_solucio >= 1000:
        punts += 1

    denom = max(denominadors(sol), default=0)
    if denom >= 50:
        punts += 2
    elif denom >= 20:
        punts += 1

    # Una arrel no exacta DONADA a l'enunciat és sempre artificial: ningú
    # mesura l'alçada d'un trapezi i li surt \sqrt{164}. Com a RESULTAT és
    # normal i esperable —la diagonal d'un rectangle de 5x8 és \sqrt{89}— i
    # per això només penalitza quan surt a l'enunciat.
    if bloc not in BLOCS_D_ARRELS and arrels_lletges(cap + " " + item["enunciat"]):
        punts += 3

    # Una fracció a l'enunciat, quan el tema NO són les fraccions, és
    # maquinària afegida: `x/5 = 3` no és una equació de mínims encara que
    # es resolgui en un pas.
    if bloc not in BLOCS_DE_FRACCIONS and re.search(r"\\d?frac", item["enunciat"]):
        punts += 2
    if re.search(r"frac\{[^{}]*\\d?frac", item["enunciat"]):   # fraccions imbricades
        punts += 1
    if item["dif"] == 3:
        punts += 1

    return 1 if punts <= 1 else (2 if punts <= 3 else 3)


def neteja_svg(svg):
    """L'SVG de repàs porta variables CSS amb color de reserva; a paper volem
    el gris de la figura i el traç en negre. Deixem `currentColor` (l'hereta
    el contenidor) i fixem les dues variables que fa servir."""
    if not svg:
        return None
    svg = svg.replace('var(--fig-plena, #E9F0F6)', 'var(--fig-plena)')
    svg = svg.replace('var(--fig-marca, #B3453C)', 'var(--fig-marca)')
    return svg


def item_de_repas(full, it, titol_bloc, bloc):
    """Un ítem del banc de repàs, tal com va a `banc.js`."""
    clau = json.loads(base64.b64decode(it["clau"]).decode("utf-8"))
    correcta = it["opcions"][clau["ok"]]
    resolucio = clau.get("res", [])
    # 23 ítems porten l'encapçalament repetit dins de l'enunciat i
    # s'imprimien dos cops seguits.
    cap = it.get("encapcalament", "")
    if cap and text_pla(it["enunciat"]).startswith(text_pla(cap).rstrip(":. ")):
        cap = ""
    return {
        "id": f"f{full}-{it['id']}",
        "full": full,
        "bloc": bloc,
        "blocTitol": titol_bloc[(full, bloc)],
        "ex": it["ex"],
        "ap": it["ap"],
        "dif": it["dif"],
        "nivell": calcula_nivell(it, resolucio, correcta, cap, bloc),
        "passos": len(resolucio),
        "cap": cap,
        # Sense l'encapçalament, uns quants ítems del banc es queden en un
        # nombre solt ("$3850$"): tota la consigna hi viu i no el poden
        # perdre encara que el professor apagui l'opció.
        "capCal": len(text_pla(it["enunciat"])) < 25,
        # La pregunta ÉS el dibuix: apagar les figures deixaria un full sense res.
        "figuraCal": bool(it.get("figura")) and
                     len(text_pla(cap + " " + it["enunciat"])) < 45,
        "enunciat": it["enunciat"],
        "figura": neteja_svg(it.get("figura")),
        "nota": it.get("nota", ""),
        # Solució xifrada en base64, com fa repàs amb `clau`: evita que surti
        # en clar si el fitxer va a parar a mans d'un alumne. No és
        # seguretat, és higiene.
        "sol": base64.b64encode(json.dumps(
            {"r": correcta, "p": resolucio},
            ensure_ascii=False).encode("utf-8")).decode("ascii"),
        "sabers": [],
    }


def repas_de_les_fonts(ruta_repas, ruta_llibre):
    """
    La part del banc que ve de `repas` i el llibre, llegida de les fonts.

    Torna {items, per_saber, llibre, vetats, avisos}: els ítems de repàs
    (amb els sabers a què pertanyen), els ids de repàs de cada saber, els
    títols del llibre i l'informe de filtres.
    """
    fulls = {n: llegeix_full(ruta_repas, n) for n in range(1, 13)}

    # index (full, bloc, ex) -> ítems, i (full, bloc) -> títol del bloc
    per_ex = {}
    titol_bloc = {}
    for n, d in fulls.items():
        for b in d["blocs"]:
            titol_bloc[(n, b["id"])] = b["titol"]
        for it in d["items"]:
            per_ex.setdefault((n, it["bloc"], it["ex"]), []).append(it)

    items, per_saber, vetats, avisos = {}, {}, {}, []
    for curs in CURSOS:
        for s in curs["sabers"]:
            ids = per_saber.setdefault(s["id"], [])
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
                        if f"f{full}-{it['id']}" in EXCLOSOS:
                            continue
                        vetat = any(s["id"] in sabers_veto and re.search(patro, it["enunciat"])
                                    for patro, sabers_veto in VETOS)
                        if vetat:
                            vetats[s["id"]] = vetats.get(s["id"], 0) + 1
                            continue
                        gid = f"f{full}-{it['id']}"
                        if gid not in items:
                            items[gid] = item_de_repas(full, it, titol_bloc, bloc)
                        if s["id"] not in items[gid]["sabers"]:
                            items[gid]["sabers"].append(s["id"])
                        ids.append(gid)

    # Títols de les unitats i activitats del llibre, per al pla de repàs.
    # Tots els cursos del mapa: amb la llista escrita a mà ("1eso", "2eso"),
    # en afegir 3r el seu llibre no s'hi va llegir mai i el pla de repàs de
    # 3r sortia sense cap referència.
    llibre = {}
    for c in [curs["id"] for curs in CURSOS]:
        ruta = os.path.join(ruta_llibre, "contingut", c, "course.json")
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
    return {"items": items, "per_saber": per_saber, "llibre": llibre,
            "vetats": vetats, "avisos": avisos}


def llegeix_generat(ruta):
    """L'objecte de dins de `window.X = {...};` d'un fitxer generat."""
    with open(ruta, encoding="utf-8") as f:
        s = f.read()
    return json.loads(s[s.index("{"): s.rindex("}") + 1])


def repas_compilat(sortida):
    """
    La mateixa part del banc, però treta del `banc.js` i el `mapa.js` que ja
    hi ha. És el que fa `--nomes-propis`: per tocar `generadors.js` no cal
    tenir a mà `repas` ni el llibre, i sense fonts no hi ha res a filtrar
    (els VETOS i els EXCLOSOS ja hi són aplicats).

    Del mapa compilat només se n'agafen els ids de repàs de cada saber i el
    llibre; la resta del saber (títol, hores, detall, referències) torna a
    sortir de `mapa_curricular.py`.
    """
    banc = llegeix_generat(os.path.join(sortida, "banc.js"))
    mapa = llegeix_generat(os.path.join(sortida, "mapa.js"))
    items = {it["id"]: it for it in banc["items"] if it["full"] != 0}
    per_saber, avisos = {}, []
    for c in mapa["cursos"]:
        for s in c["sabers"]:
            per_saber[s["id"]] = [g for g in s["items"] if g in items]
    for curs in CURSOS:
        for s in curs["sabers"]:
            if s["id"] not in per_saber and s["repas"]:
                avisos.append(f"{s['id']}: saber nou, sense ítems de repàs; "
                              "cal la compilació completa (--repas i --llibre)")
    return {"items": items, "per_saber": per_saber, "llibre": mapa["llibre"],
            "vetats": {}, "avisos": avisos}


def ordre_item(it):
    """
    Ordre dels ítems a `banc.js` i a cada saber de `mapa.js`: full, exercici,
    apartat i, per desempatar, l'id en ordre natural (`p-x-2` abans que
    `p-x-10`).

    Sense el desempat, les variants d'un mateix generador (mateix full,
    exercici i apartat) sortien en l'ordre d'un `set` de Python, que canvia
    a cada execució (PYTHONHASHSEED). La compilació no era determinista, i
    com que l'atzar de la composició recorre aquestes llistes, un mateix
    codi de prova donava una altra prova després de cada recompilació.
    """
    return (it["full"], it["ex"], it["ap"], len(it["id"]), it["id"])


def compila(repas, sortida):
    """Afegeix el material propi a la part de repàs i escriu banc.js i mapa.js."""
    # Ítems escrits per al departament, per als continguts que el banc de
    # repàs no cobreix. Els genera `assets/js/generadors.js`, que és el
    # mateix fitxer que fa servir el navegador per donar «uns altres
    # nombres»: si els tinguéssim aquí en Python, hi hauria dues versions
    # de cada exercici i acabarien divergint.
    propis = json.loads(node(["tools/genera.js", "--cataleg"]))
    propis_per_saber = {}
    for it in propis:
        it["origen"] = it["gen"]
        it["dif"] = 1
        for sid in it["sabers"]:
            propis_per_saber.setdefault(sid, []).append(it)

    items_sortida = dict(repas["items"])   # id global -> ítem
    cursos_sortida = []
    avisos = list(repas["avisos"])
    n_propis = 0
    ex_generador = {}

    # El nivell d'una variant NOVA (la que surt del botó ↻) no es pot mesurar
    # al navegador: el mesurador viu aquí. El que es fa és comprovar, per
    # cada generador i sobre moltes tirades, que el nivell declarat sigui el
    # que de debò tenen totes les seves variants. Si un generador no és
    # estable, salta aquí i no al full de l'alumne.
    mesurats = nivells_per_generador(200)
    inestables = {g: n for g, n in mesurats.items() if len(n) > 1}
    if inestables:
        # Atura la compilació. Un avís no servia: la compilació acabava bé i
        # el banc sortia amb un nivell que no és el que diu el generador,
        # que és justament el que el perfil «mínims» promet a l'alumne.
        detall = "; ".join(f"{g} -> {sorted(n)}" for g, n in sorted(inestables.items()))
        raise SystemExit(
            "El nivell d'aquests generadors no és estable: " + detall +
            "\nCal estrènyer-ne els paràmetres a assets/js/generadors.js.")
    # I el nivell mesurat ha de ser el que el generador declara: és el que
    # el navegador fa servir per a les variants noves (↻ i el selector de
    # nivell de cada pregunta), sense poder-lo mesurar.
    declarats = {g["gen"]: g["nivell"] for g in propis}
    mentiders = {g: (declarats[g], sorted(n)[0]) for g, n in mesurats.items()
                 if g in declarats and declarats[g] != sorted(n)[0]}
    if mentiders:
        detall = "; ".join(f"{g} declara {d} i fa {m}" for g, (d, m) in sorted(mentiders.items()))
        raise SystemExit("El nivell declarat d'aquests generadors no és el mesurat: " +
                         detall + "\nCal corregir `nivell` a assets/js/generadors.js.")

    for curs in CURSOS:
        sabers = []
        for s in curs["sabers"]:
            ids = list(repas["per_saber"].get(s["id"], []))

            for it in propis_per_saber.get(s["id"], []):
                # `p-<generador>-<llavor>`: l'id du a dins com tornar a
                # construir l'ítem, que és el que fa possible el botó ↻.
                gid = f"p-{it['gen']}-{it['llavor']}"
                if gid not in items_sortida:
                    n_propis += 1
                    items_sortida[gid] = {
                        "id": gid,
                        "full": 0,
                        "bloc": it["origen"],
                        "blocTitol": "Material propi del departament",
                        # L'exercici pare és el GENERADOR, no la variant.
                        # Amb un `ex` per variant, la regla de «un exercici
                        # pare només un cop» no protegia mai el material
                        # propi i sortien sis preguntes que en mesuraven dues.
                        "ex": 900 + ex_generador.setdefault(
                            it["gen"], len(ex_generador)),
                        "ap": "",
                        "dif": it["dif"],
                        "nivell": calcula_nivell(
                            {"enunciat": it["enunciat"], "dif": it["dif"]},
                            it["passos"], it["resposta"], it["cap"],
                            it["origen"]),
                        # D'on ha sortit i amb quina llavor: és el que
                        # permet al navegador demanar-ne una altra variant.
                        "gen": it["gen"],
                        "llavor": it["llavor"],
                        "passos": len(it["passos"]),
                        "cap": it["cap"],
                        # Els declara el generador: la regla per llargada
                        # es deduïa dues vegades i discrepava en el 12 %.
                        "capCal": it["capCal"],
                        "figuraCal": it["figuraCal"],
                        "enunciat": it["enunciat"],
                        "figura": it["figura"],
                        "nota": "",
                        "sol": base64.b64encode(json.dumps(
                            {"r": it["resposta"], "p": it["passos"]},
                            ensure_ascii=False).encode("utf-8")).decode("ascii"),
                        "sabers": [],
                    }
                if s["id"] not in items_sortida[gid]["sabers"]:
                    items_sortida[gid]["sabers"].append(s["id"])
                ids.append(gid)

            ids = sorted(set(ids), key=lambda g: ordre_item(items_sortida[g]))
            per_niv = {1: 0, 2: 0, 3: 0}
            for g in ids:
                per_niv[items_sortida[g]["nivell"]] += 1

            sabers.append({
                "id": s["id"],
                "titol": s["titol"],
                "sentit": s["sentit"],
                "sentitTitol": SENTITS[s["sentit"]],
                "hores": s["hores"],
                "detall": s["detall"],
                "items": ids,
                "perNivell": [per_niv[1], per_niv[2], per_niv[3]],
                "llibre": [{"curs": c, "ud": u, "act": a} for (c, u, a) in s["llibre"]],
                "bogdan": [{"id": b, "titol": BOGDAN.get(b, b)} for b in s["bogdan"]],
            })

        cursos_sortida.append({
            "id": curs["id"], "titol": curs["titol"],
            "hores": curs["hores"], "sabers": sabers,
        })

    os.makedirs(sortida, exist_ok=True)
    capcalera = "/* Generat per tools/compila.py — no editeu aquest fitxer a mà. */\n"

    items = [items_sortida[k] for k in sorted(items_sortida,
             key=lambda g: ordre_item(items_sortida[g]))]
    with open(os.path.join(sortida, "banc.js"), "w", encoding="utf-8") as f:
        f.write(capcalera + "window.BANC = ")
        json.dump({"items": items}, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    with open(os.path.join(sortida, "mapa.js"), "w", encoding="utf-8") as f:
        f.write(capcalera + "window.MAPA = ")
        json.dump({"cursos": cursos_sortida, "llibre": repas["llibre"]},
                  f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")

    # ------------------------------------------------------------- informe
    print(f"Ítems al banc: {len(items)}  ({n_propis} propis, {len(items) - n_propis} de repàs)")
    for c in cursos_sortida:
        buits = [s for s in c["sabers"] if not s["items"]]
        tot = sum(len(s["items"]) for s in c["sabers"])
        print(f"\n{c['titol']}: {len(c['sabers'])} sabers, {tot} assignacions d'ítem")
        for s in c["sabers"]:
            marca = "  " if s["items"] else "!!"
            print(f"  {marca} {s['id']:26s} {len(s['items']):3d} it. "
                  f"(n{s['perNivell'][0]}/{s['perNivell'][1]}/{s['perNivell'][2]}) "
                  f"{s['hores']:2d}h  {s['titol']}")
        if buits:
            print(f"     -> sense cap ítem: {', '.join(s['id'] for s in buits)}")
        prims = [s for s in c["sabers"] if s["items"] and not s["perNivell"][0]]
        if prims:
            print("     -> sense cap ítem de nivell 1 (el perfil «mínims» no els "
                  "podrà fer servir): " + ", ".join(s["id"] for s in prims))
    if repas["vetats"]:
        print("\nÍtems vetats per curs (nombres negatius on no toquen):")
        for k, v in sorted(repas["vetats"].items()):
            print(f"  {k}: {v}")
    if avisos:
        print("\nAvisos:")
        for a in avisos:
            print("  -", a)


def main():
    p = argparse.ArgumentParser(
        description="Genera assets/js/banc.js i assets/js/mapa.js.")
    p.add_argument("--repas", help="carpeta de repas-main (compilació completa)")
    p.add_argument("--llibre", help="carpeta de llibre-main (compilació completa)")
    p.add_argument("--nomes-propis", action="store_true",
                   help="refà només el material propi (generadors.js) i el mapa, "
                        "reaprofitant la part de repàs del banc.js que ja hi ha")
    p.add_argument("--sortida", default=os.path.join(
        os.path.dirname(os.path.abspath(__file__)), "..", "assets", "js"))
    args = p.parse_args()

    if args.nomes_propis:
        repas = repas_compilat(args.sortida)
    elif args.repas and args.llibre:
        repas = repas_de_les_fonts(args.repas, args.llibre)
    else:
        p.error("cal --repas i --llibre, o bé --nomes-propis")
    compila(repas, args.sortida)


if __name__ == "__main__":
    main()
