"""Baut die Bildliste je Sorte aus den gesammelten Commons-Metadaten.

Ausgabe:
  daten/bilder/bilder.json   { schluessel: { namen: [...], bilder: Sortenbild[] } }
  daten/bilder/aliase.json   { normalisierte Namensvariante: schluessel }
  daten/roh/bilder/bildliste_intern.json  (zusätzliche Felder für die Messung)

Regeln:
- nur freie Lizenzen (gemeinfrei, CC0, CC BY, CC BY-SA, OGL), je Datei aus extmetadata geprüft
- Sortenzuordnung über Commons-Sortenkategorien bzw. Titel/Beschreibung der Sammlung
- Bilder mit mehreren Sorten (Sammeltafeln) werden jeder Sorte zugeordnet, aber nicht gemessen
"""
import difflib
import html
import json
import os
import re
import sys
from collections import OrderedDict, defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import aliase  # noqa: E402
import commons as c  # noqa: E402

META = os.path.join(c.ROH, "meta")
AUSGABE = os.path.join(c.PROJEKT, "daten", "bilder")

TAFEL_QUELLEN = {
    "Category:Deutsche Pomologie - Aepfel": "lauche1883",
    "Category:Aepfel und Birnen, 1894": "goethe1894",
    "Category:Paintings of apples from Atlas of fruit": "grebnitzki1906",
    "Category:Traité des arbres fruitiers": "duhamel1768",
    "Category:Apples and pears (1911)": "bunyard1911",
    "Category:Pomona Britannica": "brookshaw1812",
    "Category:The Apple & pear as vintage fruits": "hogg-bull1886",
    "Category:Herefordshire Pomona": "hogg-bull-pomona",
    "Category:Apples - botanical illustrations": "commons-illustrationen",
}

# Hinweise auf gemalte/gedruckte Abbildungen (Titel/Beschreibung bzw. Kategorien)
ILLU_TEXT = re.compile(
    r"illustration|\bplate\b|\bpl\.\s?\d|farbtafel|chromolith|lithogra|aquatint|engraving|etching|"
    r"watercolou?r|aquarell|zincograph|woodcut|holzschnitt|kupferstich|gravure|"
    r"\(1[5-9]\d\d\)|biodiversity heritage|\bbhl\d|apples of new york", re.I)
ILLU_KAT = re.compile(
    r"PD-old|PD-Art|PD-US-expired|PD-1923|PD-RusEmpire|PD-scan|Author died more than|"
    r"botanical illustrations|Biodiversity Heritage Library|Internet Archive|Watercolor|Paintings|"
    r"Drawings|Lithograph|Chromolithograph|Engravings|Pomological", re.I)


def ohne_utm(u):
    """Tracking-Parameter (utm_*) aus den Commons-URLs entfernen."""
    return re.sub(r"\?utm_[^#]*$", "", u or "")


def text(s):
    s = re.sub(r"<[^>]+>", " ", s or "")
    s = html.unescape(s)
    return re.sub(r"\s+", " ", s).strip()


def lizenz_kurz(meta):
    ls = (meta.get("LicenseShortName") or "").strip()
    lic = (meta.get("License") or "").strip().lower()
    l2 = ls.lower()
    if l2 in ("public domain", "pd") or lic.startswith("pd"):
        return "gemeinfrei"
    if l2 == "no restrictions":
        return "gemeinfrei (keine bekannten Rechte, Flickr Commons)"
    if l2.startswith("cc0"):
        return "CC0 1.0"
    m = re.match(r"cc by(-sa)? (\d\.\d)( [a-z]{2})?$", l2)
    if m:
        return ("CC BY-SA " if m.group(1) else "CC BY ") + m.group(2) + (m.group(3).upper() if m.group(3) else "")
    m = re.match(r"ogl (\d)(?:\.0)?$", l2)
    if m:
        return "OGL %s.0" % m.group(1)
    return None  # GFDL allein, FAL, "Attribution", "Copyrighted free use" usw. nicht übernommen


def urheber(meta):
    a = text(meta.get("Artist", ""))
    if not a:
        a = text(meta.get("Credit", ""))
    a = re.sub(r"\s*\.$", "", a)
    if len(a) > 160:
        a = a[:157] + "..."
    return a or "unbekannt"


def dateititel(t):
    t = t[5:] if t.startswith("File:") else t
    return re.sub(r"\.(jpe?g|png|gif|tiff?|webp)$", "", t, flags=re.I)


def ist_bild(e):
    return (e.get("mime") or "").startswith("image/") and e.get("mime") not in ("image/svg+xml", "image/vnd.djvu")


# ------------------------------------------------------------------ Sortenkategorien

def sortenkategorien():
    p = os.path.join(META, "sortenkategorien.json")
    kats = set(json.load(open(p))) if os.path.exists(p) else set()
    return kats


SAMMEL = {"Category:Apples in the National Fruit Collection", "Category:Apple cultivars",
          "Category:Unidentified apple cultivars", "Category:Alte Apfelsorten", "Category:Heirloom apples"}


def sorten_aus_kategorien(meta, kats):
    cs = ["Category:" + x.strip() for x in (meta.get("Categories") or "").split("|") if x.strip()]
    out = []
    for k in cs:
        if k in SAMMEL:
            continue
        if k in kats or re.search(r"\(apple\)$", k) or re.match(r"Category:Malus domestica '", k):
            out.append(k)
    return out


# ------------------------------------------------------------------ Namen aus Titeln

def nfc_name(titel):
    t = dateititel(titel)
    for pat in [r"^Cross section of (.+?), National Fruit Collection",
                r"^(.+?) on tree, National Fruit Collection",
                r"^Flowers of (.+?), National Fruit Collection"]:
        m = re.match(pat, t)
        if m:
            return m.group(1)
    return None


def nfc_art(titel):
    t = dateititel(titel)
    if t.startswith("Cross section of"):
        return "schnitt"
    if " on tree," in t:
        return "baum"
    if t.startswith("Flowers of"):
        return "bluete"
    return "frucht"


def ohne_klammern(n):
    return re.sub(r"\s*\([^)]*\)\s*$", "", n).strip()


def usda_name(meta):
    d = text(meta.get("ImageDescription", ""))
    m = re.search(r"Image of the (.+?) variety of (?:apples|crab ?apples)", d)
    return m.group(1) if m else None


def lauche_name(meta):
    d = text(meta.get("ImageDescription", ""))
    m = re.search(r"Apple cultivar shown:\s*(.+?)(?:$|\s{2,}|\.)", d)
    return m.group(1).strip() if m else None


def goethe_name(titel, meta):
    d = text(meta.get("ImageDescription", ""))
    m = re.match(r"(.+?) by Rudolf Goethe", d)
    return m.group(1).strip() if m else None


def art_foto(titel, meta, cats):
    s = (dateititel(titel) + " " + text(meta.get("ImageDescription", ""))[:300] + " " + cats).lower()
    if re.search(r"cross.?section|längsschnitt|querschnitt|halved|sliced|cut apple|aufgeschnitten|\bschnitt|coupe", s):
        return "schnitt"
    if re.search(r"blossom|flower|blüte|bluete|blühend|fleur|bloom", s):
        return "bluete"
    if re.search(r"\btree\b|trees|baum|bäume|orchard|streuobst|obstwiese|arbre|espalier", s):
        return "baum"
    return "frucht"


# ------------------------------------------------------------------ Zuordnung

def namen_passt(a, b):
    na, nb = aliase.schluessel(a), aliase.schluessel(b)
    return na == nb or na in nb or nb in na


def zuordnen(e, name, kats):
    """Liefert Liste (schluessel, originalname) und ob Sammelbild."""
    ks = sorten_aus_kategorien(e["meta"], kats)
    if ks:
        knamen = [aliase.kategorie_zu_name(k) for k in ks]
        if len(knamen) == 1:
            if name and not namen_passt(knamen[0], ohne_klammern(name)):
                # Name aus der Sammlung (NFC-Akzession, USDA-Beschriftung, Lauche-Tafel) weicht von
                # der Commons-Kategorie ab: nur bei ähnlicher Schreibweise der Kategorie folgen,
                # sonst (Sport, Klon, fragliches Synonym) den Sammlungsnamen behalten.
                r = difflib.SequenceMatcher(None, aliase.norm(knamen[0]), aliase.norm(ohne_klammern(name))).ratio()
                if r < 0.75:
                    return [(aliase.schluessel(ohne_klammern(name)), [name])], False
            n = [knamen[0]] + ([name] if name else [])
            return [(aliase.schluessel(knamen[0]), n)], False
        if name:
            passend = [k for k in knamen if namen_passt(k, name)]
            if len(passend) >= 1:
                return [(aliase.schluessel(passend[0]), [passend[0], name])], False
        return [(aliase.schluessel(k), [k]) for k in knamen], True
    if name:
        return [(aliase.schluessel(ohne_klammern(name)), [name])], False
    return [], False


def main():
    kats = sortenkategorien()
    eintraege = []  # (quelle, e, art, name)

    nfc = json.load(open(os.path.join(META, "nfc.json")))
    for e in nfc:
        name = nfc_name(e["titel"])
        if not name:
            continue  # Fremd-Uploads ohne NFC-Titelschema (Lizenz/Herkunft unklar) auslassen
        eintraege.append(("nfc-commons", e, nfc_art(e["titel"]), name))

    usda = json.load(open(os.path.join(META, "usda.json")))
    for e in usda:
        eintraege.append(("usda-pomological", e, "tafel", usda_name(e["meta"])))

    tafeln = json.load(open(os.path.join(META, "tafeln.json")))
    for e in tafeln:
        k = e["kategorie"]
        q = TAFEL_QUELLEN.get(k)
        if k.startswith("Category:Annales de pomologie"):
            q = "bivort1853"
        if not q:
            continue
        name = None
        if q == "lauche1883":
            name = lauche_name(e["meta"])
            if "Deutsche Pomologie" not in e["titel"]:
                q = "commons-illustrationen"  # Fremddatei in der Kategorie
        elif q == "goethe1894":
            name = goethe_name(e["titel"], e["meta"])
        eintraege.append((q, e, "tafel", name))

    bekannte = {e["titel"] for _, e, _, _ in eintraege}
    p = os.path.join(META, "sorten.json")
    if not os.path.exists(p):
        p = os.path.join(META, "sorten.partial.json")
        sorten = [x for lst in json.load(open(p)).values() for x in lst]
    else:
        sorten = json.load(open(p))
    gesehen = set()
    stat_nachgetragen = []
    for e in sorten:
        if e["titel"] in bekannte or e["titel"] in gesehen:
            continue
        gesehen.add(e["titel"])
        cats = e["meta"].get("Categories", "")
        if nfc_name(e["titel"]):
            # NFC-Datei, die in der NFC-Kategorieliste (meta/nfc.json) fehlt: hier nachtragen
            eintraege.append(("nfc-commons", e, nfc_art(e["titel"]), nfc_name(e["titel"])))
            stat_nachgetragen.append(e["titel"])
            continue
        if "USDA Pomological" in cats or "National Fruit Collection" in cats:
            continue
        beschr = dateititel(e["titel"]) + " " + text(e["meta"].get("ImageDescription", ""))[:400]
        illu = bool(ILLU_TEXT.search(beschr)) or bool(ILLU_KAT.search(cats))
        if illu:
            t = e["titel"]
            q = "commons-illustrationen"
            if t.startswith("File:The apples of New York (1905)"):
                q = "beach1905"
            elif t.startswith("File:Pom.Mon.Hefte"):
                q = "pomologische-monatshefte"
            elif t.startswith("File:The Pomological magazine"):
                q = "pomological-magazine"
            eintraege.append((q, e, "tafel", None))
        elif e.get("mime") == "image/jpeg":
            eintraege.append(("commons-fotos", e, art_foto(e["titel"], e["meta"], cats), None))
        else:
            continue  # PNG/GIF/TIFF ohne Illustrationshinweis: meist Grafiken, Diagramme

    sorten_out = defaultdict(lambda: {"namen": [], "bilder": []})
    intern = []
    alias_out = dict(aliase.ALIAS)
    stat = defaultdict(int)
    for q, e, art, name in eintraege:
        if not ist_bild(e):
            stat["kein_bild"] += 1
            continue
        lz = lizenz_kurz(e["meta"])
        if not lz:
            stat["lizenz_unpassend"] += 1
            continue
        if q == "nfc-commons" and not lz.startswith("OGL"):
            stat["nfc_nicht_ogl"] += 1
            continue
        ziele, sammel = zuordnen(e, name, kats)
        if not ziele:
            stat["ohne_sorte"] += 1
            continue
        bild = OrderedDict([
            ("url", ohne_utm(e["thumburl"] or e["url_original"])),
            ("seite", e["seite"]),
            ("art", art),
            ("urheber", urheber(e["meta"]) if q != "nfc-commons" else "National Fruit Collection, Brogdale"),
            ("lizenz", lz),
            ("quelle", q),
            ("titel", dateititel(e["titel"])),
        ])
        for key, namen in ziele:
            if not key:
                continue
            s = sorten_out[key]
            for n in namen:
                if n and n not in s["namen"]:
                    s["namen"].append(n)
                alias_out.setdefault(aliase.norm(n), key)
            if not any(b["seite"] == bild["seite"] for b in s["bilder"]):
                s["bilder"].append(bild)
            intern.append({"schluessel": key, "quelle": q, "art": art, "titel": e["titel"],
                           "url": bild["url"], "seite": bild["seite"], "sammelbild": sammel,
                           "beschreibung": text(e["meta"].get("ImageDescription", ""))[:300]})
        stat["bilder_" + q] += 1

    reihenfolge = {"nfc-commons": 0, "lauche1883": 1, "goethe1894": 1, "usda-pomological": 2}
    artfolge = {"schnitt": 0, "frucht": 1, "tafel": 2, "baum": 3, "bluete": 4}
    for key, s in sorten_out.items():
        s["bilder"].sort(key=lambda b: (artfolge.get(b["art"], 9), reihenfolge.get(b["quelle"], 5), b["titel"]))
    erg = OrderedDict(sorted(sorten_out.items()))
    os.makedirs(AUSGABE, exist_ok=True)
    with open(os.path.join(AUSGABE, "bilder.json"), "w") as f:
        json.dump(erg, f, ensure_ascii=False, indent=1)
    with open(os.path.join(AUSGABE, "aliase.json"), "w") as f:
        json.dump(OrderedDict(sorted(alias_out.items())), f, ensure_ascii=False, indent=0)
    with open(os.path.join(c.ROH, "bildliste_intern.json"), "w") as f:
        json.dump(intern, f, ensure_ascii=False)
    print("NFC nachgetragen:", len(stat_nachgetragen))
    print("Sorten:", len(erg), "Bilder:", sum(len(s["bilder"]) for s in erg.values()))
    for k, v in sorted(stat.items()):
        print(" ", k, v)


if __name__ == "__main__":
    main()
