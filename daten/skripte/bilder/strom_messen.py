"""Laden und Messen in einem Durchgang, ohne die Bilder dauerhaft zu speichern.

Grund: Die Platte ist voll (andere Prozesse schreiben parallel). Jedes Vorschaubild wird in den
Speicher geladen, gemessen und verworfen: NFC-Tafeln in Originalgröße (640 px), Aquarelle, Tafeln
und Fotos wie in laden.py auf höchstens 480 px Breite verkleinert. Nur jedes N-te Bild bekommt ein
Prüfbild (Maske + Klassen) in daten/roh/bilder/pruefung/.

Aufruf: .venv/bin/python -I strom_messen.py [--pruef N] [--nur quelle1,quelle2]
Ergebnis: ergänzt daten/roh/bilder/messungen_roh.json; danach messung_ausfuehren.py --nur-ausgabe.
"""
import io
import json
import os
import sys
import time
import traceback

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np  # noqa: E402
from PIL import Image  # noqa: E402

import analyse as A  # noqa: E402
import commons as c  # noqa: E402
import laden  # noqa: E402
import messen as M  # noqa: E402
import messung_ausfuehren as MA  # noqa: E402

Image.MAX_IMAGE_PIXELS = 60_000_000


def bild_aus_bytes(roh, max_breite):
    im = Image.open(io.BytesIO(roh))
    if im.mode in ("P", "LA", "RGBA", "PA"):
        im = im.convert("RGBA")
        hg = Image.new("RGB", im.size, (255, 255, 255))
        hg.paste(im, mask=im.split()[3])
        im = hg
    im = im.convert("RGB")
    if im.width > max_breite:
        im = im.resize((max_breite, max(1, round(max_breite * im.height / im.width))), Image.LANCZOS)
    return np.asarray(im, dtype=float) / 255.0


def speichern(roh):
    """Zwischenstand schreiben; bei voller Platte warten und erneut versuchen statt abzubrechen."""
    while True:
        try:
            with open(MA.ROH_ERG + ".tmp", "w") as f:
                json.dump(roh, f, ensure_ascii=False)
            os.replace(MA.ROH_ERG + ".tmp", MA.ROH_ERG)
            return
        except OSError as ex:
            try:
                os.remove(MA.ROH_ERG + ".tmp")
            except OSError:
                pass
            print(time.strftime("%H:%M:%S"), "Speichern fehlgeschlagen (%s), warte" % ex.errno, flush=True)
            time.sleep(60)


def main():
    pruef_n = int(sys.argv[sys.argv.index("--pruef") + 1]) if "--pruef" in sys.argv else 0
    nur = sys.argv[sys.argv.index("--nur") + 1].split(",") if "--nur" in sys.argv else None
    liste = json.load(open(os.path.join(c.ROH, "bildliste_intern.json")))
    fotos = set()
    w = os.path.join(c.ROH, "warteschlange.json")
    if os.path.exists(w):
        fotos = {t for t, _, _ in json.load(open(w))}
    roh = json.load(open(MA.ROH_ERG)) if os.path.exists(MA.ROH_ERG) else {}
    gesehen = set()
    n = 0
    t0 = time.time()
    for e in liste:
        q = e["quelle"]
        if not MA.ausgewaehlt(e) or e["titel"] in gesehen:
            continue
        if nur and q not in nur:
            continue
        if q == "commons-fotos" and e["titel"] not in fotos:
            continue
        gesehen.add(e["titel"])
        alt = roh.get(e["titel"])
        soll = MA.VERSIONEN.get(q, MA.VERSION)
        if alt and alt.get("version") == soll and "fehler" not in alt:
            continue
        try:
            p = laden.pfad(e["titel"], MA.GRUPPE[q])
            if p:
                rgb = M.lade(p, 640 if q == "nfc-commons" else 480)
            else:
                rgb = bild_aus_bytes(c.holen(e["url"]), 640 if q == "nfc-commons" else 480)
            if q == "nfc-commons":
                r = A.analysiere_nfc(rgb, MA.NFC_REF)
            elif q == "commons-fotos":
                r = A.analysiere_foto(rgb)
            else:
                r = A.analysiere_tafel(rgb)
            m = MA.zusammenfassen(r, q)
        except Exception as ex:  # noqa: BLE001
            m = {"fehler": repr(ex)[:300]}
            traceback.print_exc()
            r = None
        if r is not None and pruef_n and n % pruef_n == 0 and laden.platz_frei_mb() > 150:
            try:
                ziel = os.path.join(MA.PRUEF, "%s_%s.jpg" % (MA.GRUPPE[q], laden.schluessel(e["titel"])))
                extra = "hzb %s (%s) g%d s%d" % (None if r["hzb"] is None else round(r["hzb"], 2), r["hzb_quelle"],
                                                 len(r["ganz"]), len(r["schnitt"]))
                M.pruefbild(r["rgb"], r["ganz"], r["schnitt"], r["lab"], r["farben"], r["fleisch"], ziel,
                            e["schluessel"] + " | " + e["titel"][5:70], extra)
                m["pruefbild"] = os.path.relpath(ziel, c.PROJEKT)
            except OSError as ex:
                print("Prüfbild nicht geschrieben:", ex, flush=True)
        m["version"] = soll
        m["schluessel"] = e["schluessel"]
        m["quelle"] = q
        m["url"] = e["url"]
        roh[e["titel"]] = m
        n += 1
        if n % 50 == 0:
            print(time.strftime("%H:%M:%S"), q, n, "gemessen", round(time.time() - t0), "s, Abstand %.2f s" % c._medien["abstand"],
                  "frei %.0f MB" % laden.platz_frei_mb(), flush=True)
            speichern(roh)
    speichern(roh)
    print("fertig", n)


if __name__ == "__main__":
    main()
