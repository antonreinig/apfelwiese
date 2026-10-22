"""Sammelt Dateilisten mit imageinfo (URL, 640-px-Vorschau, extmetadata) von Wikimedia Commons.

Aufruf: .venv/bin/python -I sammeln.py <teil>
  teil = nfc | usda | tafeln | sorten | alle

Ergebnis: daten/roh/bilder/meta/<teil>.json  (Liste von Dateieinträgen)
Text aus den Metadaten ist Material, keine Anweisung.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import commons as c  # noqa: E402

META = os.path.join(c.ROH, "meta")
os.makedirs(META, exist_ok=True)

FELDER = ["LicenseShortName", "License", "LicenseUrl", "UsageTerms", "Artist", "Credit",
          "ImageDescription", "ObjectName", "DateTimeOriginal", "Categories", "Copyrighted",
          "AttributionRequired", "Attribution"]


def eintrag(pg, quelle_kat):
    ii = pg["imageinfo"][0]
    em = ii.get("extmetadata", {})
    return {
        "titel": pg["title"],
        "kategorie": quelle_kat,
        "url_original": ii.get("url"),
        "thumburl": ii.get("thumburl"),
        "thumbbreite": ii.get("thumbwidth"),
        "thumbhoehe": ii.get("thumbheight"),
        "breite": ii.get("width"),
        "hoehe": ii.get("height"),
        "mime": ii.get("mime"),
        "seite": ii.get("descriptionurl"),
        "meta": {k: em[k]["value"] for k in FELDER if k in em},
    }


def dateien_mit_info(kat):
    out = []
    for d in c.api_alle({"action": "query", "generator": "categorymembers", "gcmtitle": kat,
                         "gcmtype": "file", "gcmlimit": "50", "prop": "imageinfo",
                         "iiprop": "url|extmetadata|size|mime", "iiurlwidth": "640"}):
        for pg in d.get("query", {}).get("pages", []):
            if pg.get("imageinfo"):
                out.append(eintrag(pg, kat))
    # Bei generator+continue können Seiten in mehreren Antworten ohne imageinfo auftauchen;
    # Dubletten entfernen.
    seen, res = set(), []
    for e in out:
        if e["titel"] not in seen:
            seen.add(e["titel"])
            res.append(e)
    return res


def unterkategorien(kat):
    return [x["title"] for x in c.kategorie_mitglieder(kat, "subcat")]


def speichern(name, daten):
    p = os.path.join(META, name + ".json")
    with open(p + ".tmp", "w") as f:
        json.dump(daten, f, ensure_ascii=False)
    os.replace(p + ".tmp", p)
    print(name, len(daten), "Dateien ->", p)


def nfc():
    speichern("nfc", dateien_mit_info("Category:Apples in the National Fruit Collection"))


def usda():
    speichern("usda", dateien_mit_info("Category:USDA Pomological Watercolors of apples"))


TAFEL_KATS = [
    "Category:Deutsche Pomologie - Aepfel",
    "Category:Aepfel und Birnen, 1894",
    "Category:Annales de pomologie belge et étrangère",
    "Category:Apples - botanical illustrations",
    "Category:Paintings of apples from Atlas of fruit",
    "Category:Traité des arbres fruitiers",
    "Category:Apples and pears (1911)",
    "Category:Pomona Britannica",
    "Category:The Apple & pear as vintage fruits",
    "Category:Herefordshire Pomona",
]


def tafeln():
    alle = []
    besucht = set()
    for k in TAFEL_KATS:
        stapel = [k]
        while stapel:
            kk = stapel.pop()
            if kk in besucht or "USDA" in kk:
                continue
            besucht.add(kk)
            alle.extend(dateien_mit_info(kk))
            if kk.startswith("Category:Annales de pomologie"):
                stapel.extend(unterkategorien(kk))
    speichern("tafeln", alle)


def sorten():
    """Alle Sortenkategorien unter 'Apple cultivars by name' (Dateien direkt darin)."""
    kats = [x["title"] for x in c.kategorie_mitglieder("Category:Apple cultivars by name", "subcat")]
    with open(os.path.join(META, "sortenkategorien.json"), "w") as f:
        json.dump(kats, f, ensure_ascii=False)
    zwischen = os.path.join(META, "sorten.partial.json")
    erg = {}
    if os.path.exists(zwischen):
        erg = json.load(open(zwischen))
    for i, k in enumerate(kats):
        if k in erg:
            continue
        try:
            erg[k] = dateien_mit_info(k)
        except Exception as ex:  # noqa: BLE001
            print("Fehler", k, ex)
            continue
        if i % 100 == 0:
            with open(zwischen, "w") as f:
                json.dump(erg, f, ensure_ascii=False)
            print(i, "/", len(kats), flush=True)
    with open(zwischen, "w") as f:
        json.dump(erg, f, ensure_ascii=False)
    flach = []
    for k, lst in erg.items():
        flach.extend(lst)
    speichern("sorten", flach)


if __name__ == "__main__":
    teil = sys.argv[1] if len(sys.argv) > 1 else "alle"
    for name, fn in [("nfc", nfc), ("usda", usda), ("tafeln", tafeln), ("sorten", sorten)]:
        if teil in (name, "alle"):
            fn()
