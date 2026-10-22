"""Vergleicht die Messungen an NFC-Schnitttafeln mit den NFC-Merkmalsdaten (ECPGR-Erfassung).

Liest daten/roh/nfc/NFC_C_E_data_Apple_22_08_25.csv (nur lesen) und
daten/roh/bilder/messungen_roh.json. Zuordnung über die Akzessionsnummer im Dateinamen.
Ausgabe: daten/roh/bilder/validierung.json und Text auf stdout (für bericht.md).
"""
import csv
import json
import os
import re
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np  # noqa: E402

import commons as c  # noqa: E402

VERSION = int(sys.argv[1]) if len(sys.argv) > 1 else None
CSV = os.path.join(c.PROJEKT, "daten", "roh", "nfc", "NFC_C_E_data_Apple_22_08_25.csv")


def spearman(a, b):
    a, b = np.asarray(a, float), np.asarray(b, float)
    ra = np.argsort(np.argsort(a))
    rb = np.argsort(np.argsort(b))
    return float(np.corrcoef(ra, rb)[0, 1])


def main():
    zeilen = {}
    with open(CSV, encoding="utf-8-sig") as f:
        r = csv.reader(f)
        next(r)
        for z in r:
            zeilen[z[1].strip()] = z
    roh = json.load(open(os.path.join(c.ROH, "messungen_roh.json")))
    paare = []
    for titel, m in roh.items():
        if m.get("quelle") != "nfc-commons" or "fehler" in m or not m.get("anteile"):
            continue
        if VERSION and m.get("version") != VERSION:
            continue
        mm = re.search(r"\(acc\. (\d{4})-(\d{3})\)", titel)
        if not mm:
            continue
        acc = mm.group(1) + mm.group(2)
        if acc in zeilen:
            paare.append((titel, m, zeilen[acc]))
    erg = {"paare": len(paare)}
    print("NFC-Tafeln mit Merkmalsdaten:", len(paare))

    # Höhe/Breite: Messung am Längsschnitt vs. NFC-Mittelwert (Spalte 18)
    x, y = [], []
    for t, m, z in paare:
        try:
            ref = float(z[18])
        except ValueError:
            continue
        if m.get("hzb") and m.get("hzb_quelle") == "laengsschnitt" and 0.55 <= m["hzb"] <= 1.45:
            x.append(m["hzb"])
            y.append(ref)
    if x:
        x, y = np.array(x), np.array(y)
        d = x - y
        erg["hzb"] = {"n": len(x), "mittlere_abweichung": round(float(d.mean()), 3),
                      "mittlere_abs_abweichung": round(float(np.abs(d).mean()), 3),
                      "anteil_innerhalb_0_05": round(float((np.abs(d) <= 0.05).mean()), 3),
                      "anteil_innerhalb_0_10": round(float((np.abs(d) <= 0.10).mean()), 3),
                      "pearson_r": round(float(np.corrcoef(x, y)[0, 1]), 3)}
        print("Höhe/Breite:", erg["hzb"])

    # Deckfarbenanteil vs. 'Amount of over colour' (ECPGR-Stufen, Spalte 29)
    x, y = [], []
    for t, m, z in paare:
        try:
            stufe = int(z[29])
        except ValueError:
            continue
        x.append(m["deckanteil"])
        y.append(stufe)
    if x:
        x, y = np.array(x), np.array(y)
        tab = {}
        for s in sorted(set(y)):
            v = x[y == s]
            tab[int(s)] = {"n": int(len(v)), "median_anteil": round(float(np.median(v)), 2)}
        erg["deckanteil"] = {"n": len(x), "spearman": round(spearman(x, y), 3), "je_stufe": tab}
        print("Deckfarbenanteil:", erg["deckanteil"])

    # Grundfarbe (Spalte 26) vs. gemessener Farbton der Grundfarbe
    gruppen = defaultdict(list)
    for t, m, z in paare:
        if m.get("grund_lab") and z[26].strip():
            L, a, b = m["grund_lab"]
            h = (np.degrees(np.arctan2(b, a)) + 360) % 360
            gruppen[z[26].strip()].append((h, L, np.hypot(a, b)))
    erg["grundfarbe_hue"] = {k: {"n": len(v), "median_hue": round(float(np.median([x[0] for x in v])), 1),
                                 "median_L": round(float(np.median([x[1] for x in v])), 1),
                                 "median_C": round(float(np.median([x[2] for x in v])), 1)}
                             for k, v in sorted(gruppen.items(), key=lambda kv: -len(kv[1]))}
    print("Grundfarbe (Lab-Farbton je NFC-Kategorie):", erg["grundfarbe_hue"])

    # Rost (Spalte 35, Stufen) vs. gemessener Rostanteil
    x, y = [], []
    for t, m, z in paare:
        try:
            stufe = int(z[35])
        except ValueError:
            continue
        x.append(m["anteile"]["rost"])
        y.append(stufe)
    if x:
        x, y = np.array(x), np.array(y)
        tab = {int(s): {"n": int((y == s).sum()), "median_rostanteil": round(float(np.median(x[y == s])), 3)}
               for s in sorted(set(y))}
        erg["rost"] = {"n": len(x), "spearman": round(spearman(x, y), 3), "je_stufe": tab}
        print("Rost:", erg["rost"])

    # Fleischfarbe (Spalte 36) vs. gemessenes b* (Gelbanteil)
    gruppen = defaultdict(list)
    for t, m, z in paare:
        if m.get("fleisch_lab") and z[36].strip():
            gruppen[z[36].strip()].append(m["fleisch_lab"][2])
    erg["fleisch_b"] = {k: {"n": len(v), "median_b": round(float(np.median(v)), 1)}
                        for k, v in sorted(gruppen.items(), key=lambda kv: -len(kv[1]))}
    print("Fleischfarbe (b* je NFC-Kategorie):", erg["fleisch_b"])

    with open(os.path.join(c.ROH, "validierung.json"), "w") as f:
        json.dump(erg, f, ensure_ascii=False, indent=1)


if __name__ == "__main__":
    main()
