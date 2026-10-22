"""Führt die Farb- und Formmessung für alle geladenen Bilder aus.

Aufruf: .venv/bin/python -I messung_ausfuehren.py [--neu] [--pruef N]
  --neu     Zwischenspeicher ignorieren (nach Änderung am Verfahren)
  --pruef N jedes N-te Bild als Prüfbild (Maske + Klassen) nach daten/roh/bilder/pruefung/

Ausgabe: daten/bilder/farbmessung.json  { schluessel: Farbmessung[] }
Zwischenstand: daten/roh/bilder/messungen_roh.json (je Bildtitel)
"""
import json
import os
import random
import re
import sys
import time
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np  # noqa: E402

import analyse as A  # noqa: E402
import commons as c  # noqa: E402
import laden  # noqa: E402
import messen as M  # noqa: E402

VERSION = 9
# Verfahrensstand je Quelle (NFC seit Version 8 unverändert)
VERSIONEN = {"nfc-commons": 10, "usda-pomological": 10, "lauche1883": 10}  # ab 10: pixelweise Grund/Deck-Trennung über a* relativ zur Grundfarbe

ROH_ERG = os.path.join(c.ROH, "messungen_roh.json")
PRUEF = os.path.join(c.ROH, "pruefung")
AUS = os.path.join(c.PROJEKT, "daten", "bilder", "farbmessung.json")

GRUPPE = {"nfc-commons": "nfc", "usda-pomological": "usda", "lauche1883": "tafeln",
          "commons-fotos": "fotos"}

METHODE = {
    "nfc-commons": "Foto (NFC-Fototafel: 4 ganze Früchte, 2 Schnitte, Fototisch); Weißabgleich über den "
                   "Hintergrund; Frucht per Hintergrundmodell freigestellt; Schalenpixel ohne Glanzlichter "
                   "einzeln klassifiziert: Grundfarbe aus gelbgrünen Pixeln, Deckfarbe = Pixel mit deutlich "
                   "höherem a* als die Grundfarbe (auch dunkle Rot- und Braunrottöne), Anteile über Pixel; "
                   "Höhe/Breite aus dem Längsschnitt",
    "usda-pomological": "Aquarell (USDA Pomological Watercolor, ca. 1886–1942); Papierton als Weißpunkt; "
                        "Frucht vor Papier freigestellt; Schalenpixel einzeln klassifiziert (Deckfarbe = deutlich höheres a* als "
                        "die Grundfarbe, Anteile über Pixel); Höhe/Breite aus dem "
                        "gemalten Längsschnitt, sonst aus der Seitenansicht; gemessen an einer 480 px breiten Kopie; "
                        "Farbwiedergabe des Malers, nicht fotometrisch",
    "lauche1883": "Chromolithografie (Lauche, Deutsche Pomologie 1882–83); Papierton als Weißpunkt; "
                  "Frucht vor Papier freigestellt; Schalenpixel einzeln klassifiziert (Deckfarbe = deutlich höheres a* als "
                        "die Grundfarbe, Anteile über Pixel); Höhe/Breite aus dem Längsschnitt, "
                  "sonst aus der Seitenansicht; gemessen an einer 480 px breiten Kopie; Druckfarben gealtert, "
                  "nicht fotometrisch",
    "usda-umriss": "Umrisszeichnung (USDA Pomological Watercolor, ungefärbter Längsschnitt in Bleistift/Tusche); "
                   "nur Höhe/Breite aus der konvexen Hülle des gezeichneten Umrisses ohne Stiel; gemessen an einer "
                   "480 px breiten Kopie",
    "commons-fotos": "Foto (Wikimedia Commons, Sortenbestimmung des Fotografen ungeprüft); Hintergrund aus "
                     "dem Bildrand; nur Bilder mit ruhigem Hintergrund und klar freigestellter Frucht; "
                     "k-means (k=6) in Lab; Beleuchtung unkontrolliert; keine Formmessung",
}

# Kurzbezeichnung für das Feld "methode"; die ausführliche Beschreibung steht in "verfahren"
METHODE_KURZ = {"nfc-commons": "NFC-Foto", "usda-pomological": "Aquarell", "lauche1883": "Farbtafel",
                "usda-umriss": "Umrisszeichnung", "commons-fotos": "Foto"}

NFC_REF = np.array([0.676, 0.678, 0.771])


def ausgewaehlt(e):
    q = e["quelle"]
    if e["sammelbild"]:
        return False
    if q == "nfc-commons":
        return e["art"] == "schnitt"
    if q == "usda-pomological":
        b = e["beschreibung"].lower()
        return not any(w in b for w in ("showing", "injury", "disease", "rot ", "scab", "blight", "spot"))
    if q == "lauche1883":
        return True
    if q == "commons-fotos":
        return e["art"] == "frucht"
    return False


def hexwert(v):
    return None if v is None else M.lab_zu_hex(v)


def messen_eines(pfad, quelle):
    rgb = M.lade(pfad)
    if quelle == "nfc-commons":
        r = A.analysiere_nfc(rgb, NFC_REF)
    elif quelle == "commons-fotos":
        r = A.analysiere_foto(rgb)
    else:
        r = A.analysiere_tafel(rgb)
    return r


def zusammenfassen(r, quelle):
    e = r["farben"]
    info = r["info"]
    out = {"n_ganz": len(r["ganz"]), "n_schnitt": len(r["schnitt"]), "info": info,
           "hzb": r["hzb"], "hzb_quelle": r["hzb_quelle"],
           "fleisch": hexwert(r["fleisch"]),
           "fleisch_lab": None if r["fleisch"] is None else [round(float(x), 1) for x in r["fleisch"]]}
    if e:
        out.update({
            "grund": hexwert(e.get("grund")), "deck": hexwert(e.get("deck")), "rost": hexwert(e.get("rost")),
            "grund_lab": None if e.get("grund") is None else [round(float(x), 1) for x in e["grund"]],
            "deck_lab": None if e.get("deck") is None else [round(float(x), 1) for x in e["deck"]],
            "anteile": e["anteile"], "deckanteil": e["deckanteil"], "n_pixel": e["n_pixel"],
            "zentren": e["zentren"],
        })
    fg = r.get("form_ganz") or []
    out["rundheit_ganz"] = [round(f["rundheit"], 3) for f in fg]
    out["solidity_ganz"] = [round(f["solidity"], 3) for f in fg]
    return out


def gueltig(m, quelle):
    """Qualitätsprüfung; liefert (ok, grund)."""
    if not m.get("anteile"):
        if m.get("hzb_quelle") == "umrisszeichnung" and m.get("hzb") and 0.55 <= m["hzb"] <= 1.45:
            return True, ""
        return False, "keine Schale"
    if m.get("n_pixel", 0) < 500:
        return False, "zu wenig Schalenpixel"
    if quelle == "nfc-commons" and m["n_ganz"] < 2:
        return False, "weniger als 2 ganze Früchte erkannt"
    if quelle != "nfc-commons" and m["n_ganz"] < 1:
        return False, "keine ganze Frucht erkannt"
    if not m.get("grund") and not m.get("deck"):
        return False, "weder Grund- noch Deckfarbe"
    return True, ""


def farbmessung(m, quelle, url):
    if not m.get("anteile"):
        return {"bild": url, "methode": METHODE_KURZ["usda-umriss"], "verfahren": METHODE["usda-umriss"],
                "hoeheZuBreite": round(float(m["hzb"]), 3)}
    fm = {"bild": url, "methode": METHODE_KURZ[quelle], "verfahren": METHODE[quelle]}
    if m.get("grund"):
        fm["grundfarbe"] = m["grund"]
    if m.get("deck"):
        fm["deckfarbe"] = m["deck"]
    fm["deckfarbeAnteil"] = round(float(m["deckanteil"]), 2)
    if m.get("rost"):
        fm["rostfarbe"] = m["rost"]
    if m.get("fleisch") and m["n_schnitt"] > 0:
        L = m["fleisch_lab"][0]
        if L > 55:
            fm["fleischfarbe"] = m["fleisch"]
    h = m.get("hzb")
    if h and 0.55 <= h <= 1.45:
        fm["hoeheZuBreite"] = round(float(h), 3)
    return fm


def main():
    neu = "--neu" in sys.argv
    pruef_n = 0
    if "--pruef" in sys.argv:
        pruef_n = int(sys.argv[sys.argv.index("--pruef") + 1])
    nur = None
    if "--nur" in sys.argv:
        nur = sys.argv[sys.argv.index("--nur") + 1].split(",")
    os.makedirs(PRUEF, exist_ok=True)
    liste = json.load(open(os.path.join(c.ROH, "bildliste_intern.json")))
    roh = {}
    if os.path.exists(ROH_ERG) and not neu:
        roh = json.load(open(ROH_ERG))
    n = 0
    t0 = time.time()
    for i, e in enumerate(liste):
        if not ausgewaehlt(e):
            continue
        if nur and e["quelle"] not in nur:
            continue
        g = GRUPPE[e["quelle"]]
        pfad = laden.pfad(e["titel"], g)
        if not pfad:
            continue
        alt = roh.get(e["titel"])
        soll = VERSIONEN.get(e["quelle"], VERSION)
        if alt and alt.get("version") == soll and not (pruef_n and n % pruef_n == 0):
            continue
        try:
            r = messen_eines(pfad, e["quelle"])
            m = zusammenfassen(r, e["quelle"])
            if pruef_n and n % pruef_n == 0:
                ziel = os.path.join(PRUEF, "%s_%s.jpg" % (g, laden.schluessel(e["titel"])))
                extra = "hzb %s (%s) g%d s%d" % (None if r["hzb"] is None else round(r["hzb"], 2), r["hzb_quelle"],
                                                 len(r["ganz"]), len(r["schnitt"]))
                M.pruefbild(r["rgb"], r["ganz"], r["schnitt"], r["lab"], r["farben"], r["fleisch"], ziel,
                            e["schluessel"] + " | " + e["titel"][5:70], extra)
                m["pruefbild"] = os.path.relpath(ziel, c.PROJEKT)
        except Exception as ex:  # noqa: BLE001
            m = {"fehler": repr(ex)[:300]}
            traceback.print_exc()
        m["version"] = VERSIONEN.get(e["quelle"], VERSION)
        m["schluessel"] = e["schluessel"]
        m["quelle"] = e["quelle"]
        m["url"] = e["url"]
        roh[e["titel"]] = m
        n += 1
        if n % 100 == 0:
            print(n, "gemessen", round(time.time() - t0), "s", flush=True)
            with open(ROH_ERG + ".tmp", "w") as f:
                json.dump(roh, f, ensure_ascii=False)
            os.replace(ROH_ERG + ".tmp", ROH_ERG)
    with open(ROH_ERG + ".tmp", "w") as f:
        json.dump(roh, f, ensure_ascii=False)
    os.replace(ROH_ERG + ".tmp", ROH_ERG)
    ausgabe(roh)


def ausgabe(roh):
    erg = {}
    stat = {}
    # Schlüssel und URL immer aus der aktuellen Bildliste (Aliase können sich ändern)
    aktuell = {}
    for e in json.load(open(os.path.join(c.ROH, "bildliste_intern.json"))):
        if not e["sammelbild"]:
            aktuell[e["titel"]] = e
    for titel, m in roh.items():
        if titel not in aktuell:
            continue
        m = dict(m)
        m["schluessel"] = aktuell[titel]["schluessel"]
        m["url"] = aktuell[titel]["url"]
        q = m.get("quelle")
        st = stat.setdefault(q, {"gemessen": 0, "gueltig": 0, "gruende": {}})
        st["gemessen"] += 1
        if "fehler" in m:
            st["gruende"]["fehler"] = st["gruende"].get("fehler", 0) + 1
            continue
        ok, grund = gueltig(m, q)
        if not ok:
            st["gruende"][grund] = st["gruende"].get(grund, 0) + 1
            continue
        st["gueltig"] += 1
        url = re.sub(r"\?utm_[^#]*$", "", m["url"])
        erg.setdefault(m["schluessel"], []).append(farbmessung(m, q, url))
    reihen = {"nfc-commons": 0, "lauche1883": 1, "usda-pomological": 2, "usda-umriss": 3, "commons-fotos": 4}
    for k in erg:
        erg[k].sort(key=lambda f: (min([v for q, v in reihen.items() if f["methode"] == METHODE_KURZ[q]] or [9]),
                                   f["bild"]))
    erg = dict(sorted(erg.items()))
    with open(AUS + ".tmp", "w") as f:
        json.dump(erg, f, ensure_ascii=False, indent=1)
    os.replace(AUS + ".tmp", AUS)
    with open(os.path.join(c.ROH, "messung_statistik.json"), "w") as f:
        json.dump(stat, f, ensure_ascii=False, indent=1)
    print("Sorten mit Farbmessung:", len(erg), "Messungen:", sum(len(v) for v in erg.values()))
    print(json.dumps(stat, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    if "--nur-ausgabe" in sys.argv:
        ausgabe(json.load(open(ROH_ERG)))
    else:
        main()
