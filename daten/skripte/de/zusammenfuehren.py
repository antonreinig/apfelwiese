# Führt die Stapelergebnisse zu daten/de/sorten_de.json und daten/de/quellen.json zusammen,
# ergänzt Bilder (Engelbrecht-Längsschnitte, Commons-Fotos aus den Wikipedia-Artikeln, Lauche-Tafeln)
# und schreibt eine Liste der Katalog-Lücken-Rohnotizen.
# Aufruf: python3 -I zusammenfuehren.py <daten-ordner>
import glob, gzip, json, os, re, sys, collections
D = sys.argv[1]
sys.path.insert(0, os.path.join(D, "skripte", "de"))
from namen import norm
A = os.path.join(D, "de", "arbeit")
ROH = os.path.join(D, "roh", "de")

# ------------------------------------------------------------ Sorten laden
sorten, web_quellen = [], collections.OrderedDict()
for f in sorted(glob.glob(os.path.join(A, "ergebnis", "stapel_[0-9][0-9].json"))):
    nn = f[-7:-5]
    batch = json.load(open(f, encoding="utf-8"))
    qs = json.load(open(f.replace(".json", "_quellen.json"), encoding="utf-8"))
    qurl = {}
    for q in qs:
        web_quellen.setdefault(q["id"], []).append(q)
        qurl.setdefault(q["id"], set()).add(q.get("url"))
    for s in batch:
        s["_stapel"] = nn
        # Web-Belege ohne URL: URL aus der Quellendatei des Stapels, wenn eindeutig
        def fix(b):
            if b.get("quelle", "").startswith("web_") and not b.get("url") and len(qurl.get(b["quelle"], ())) == 1:
                b["url"] = next(iter(qurl[b["quelle"]]))
        for m in s["merkmale"]: fix(m)
        for t in s["texte"]:
            for b in t["belege"]: fix(b)
        for y in s["synonyme"]:
            if "beleg" in y: fix(y["beleg"])
        for b in (s.get("herkunft") or {}).get("belege", []): fix(b)
        sorten.append(s)

# Dublette: Weißer Wintertaffetapfel (Stapel 31) = Weißer Taffetapfel (Stapel 30), beide Engelbrecht Nr. 667
nach_id = {s["id"]: s for s in sorten}
if "weisser-wintertaffetapfel" in nach_id and "weisser-taffetapfel" in nach_id:
    ziel, quelle = nach_id["weisser-taffetapfel"], nach_id["weisser-wintertaffetapfel"]
    vorhanden = {norm(y["name"]) for y in ziel["synonyme"]} | {norm(ziel["name"])}
    for y in quelle["synonyme"] + [{"name": quelle["name"], "beleg": next((y["beleg"] for y in quelle["synonyme"] if "beleg" in y), None)}]:
        if norm(y["name"]) not in vorhanden and y.get("beleg"):
            ziel["synonyme"].append(y); vorhanden.add(norm(y["name"]))
    sorten = [s for s in sorten if s["id"] != "weisser-wintertaffetapfel"]

# ------------------------------------------------------------ Quellen
quellen = json.load(open(os.path.join(D, "de", "quellen.json"), encoding="utf-8"))
quellen = [q for q in quellen if not q["id"].startswith("web_") and q["id"] not in ("commons", "lauche_dp1882")]
WEB_WERK = {
    "web_arche_noah": ("Arche Noah, Obstsortenblätter (PDF je Sorte)", "https://www.arche-noah.at"),
    "web_bogl_bw": ("BOGL Baden-Württemberg, Sortenbeschreibungen", "https://www.bogl-bw.de"),
    "web_bund_lemgo": ("BUND Lemgo, Obstsortendatenbank (nur einzelne Fakten, „für private Zwecke frei“)", "https://www.obstsortendatenbank.de"),
    "web_luthers_apfelbaum": ("Projekt „Luthers Apfelbäumchen“, Sortenblätter", "https://www.luthers-apfelbaum.de"),
    "web_logl": ("Landesverband für Obstbau, Garten und Landschaft Baden-Württemberg (LOGL), Streuobstsorte des Jahres", "https://www.logl-bw.de"),
    "web_kob": ("Kompetenzzentrum Obstbau Bodensee (KOB), Sortenbeschreibungen", "https://www.kob-bavendorf.de"),
    "web_streuobst_bayern": ("Streuobst in Bayern (Bayerischer Landesverband für Gartenbau und Landespflege), Sortenporträts", "https://www.streuobst-in-bayern.de"),
    "web_pomologen_verein": ("Pomologen-Verein e. V., Sortenblätter und Faltblätter der Landesgruppen", "https://www.pomologen-verein.de"),
    "web_orangepippin": ("Orange Pippin, Sortenbeschreibungen", "https://www.orangepippin.com"),
    "web_nfc": ("National Fruit Collection (Brogdale, UK), Sortendatenblätter", "https://www.nationalfruitcollection.org.uk"),
    "web_lachapfel": ("Hof Lachapfel, Sortenbeschreibungen", "http://www.lachapfel.de"),
    "web_trenthorst": ("TrentObst Trenthorst, Sortenblätter", "https://www.trenthorst.de"),
    "web_wendland_net": ("Urte Delft: Der Napoleonsapfel (Sortenbeschreibung)", "https://media.wendland-net.de"),
    "web_obstsortenerhalt": ("Erhalternetzwerk Obstsortenvielfalt, Sortenbeschreibungen", "https://obstsortenerhalt.de"),
    "web_apfelarche_buedingen": ("Timo Berk: ApfelArche in Büdingen (Vortrag, Wetteraukreis 2025)", "https://mitgestalten.wetteraukreis.de"),
    "web_biobaumversand": ("Biobaumversand (Baumschule), Sortenbeschreibungen", "https://biobaumversand.de"),
}
for qid, liste in web_quellen.items():
    werk, url = WEB_WERK.get(qid, (liste[0].get("werk", qid), liste[0].get("url")))
    quellen.append({"id": qid, "werk": werk, "url": url, "lizenz": "Fakten, Text nicht übernommen", "abgerufen": "2026-10-22",
                    "anmerkung": "Nur zur Absicherung einzelner Angaben; die genaue Seite steht im jeweiligen Beleg (url)."})
quellen.append({"id": "commons", "werk": "Wikimedia Commons (Fotos aus den Wikipedia-Sortenartikeln)", "url": "https://commons.wikimedia.org",
                "lizenz": "je Bild angegeben (CC BY-SA, CC BY, CC0, gemeinfrei, OGL)", "abgerufen": "2026-10-22",
                "anmerkung": "Urheber und Lizenz stehen am Bild; Bestimmung der Sorte auf den Fotos ungeprüft."})
quellen.append({"id": "lauche_dp1882", "werk": "Deutsche Pomologie. Äpfel (Farbtafeln)", "autor": "Wilhelm Lauche (1827–1883)", "jahr": 1882,
                "url": "https://commons.wikimedia.org/w/index.php?search=%22Deutsche+Pomologie+-+Aepfel%22&ns6=1", "lizenz": "gemeinfrei",
                "abgerufen": "2026-10-22", "anmerkung": "Chromolithographien, Digitalisate über Wikimedia Commons; nur als Bild verwendet."})

# ------------------------------------------------------------ Bilder
pn = json.load(open(os.path.join(ROH, "archive", "bub_gb_tR4EMgEACAAJ_page_numbers.json"), encoding="utf-8"))["pages"]
eng2 = json.load(open(os.path.join(A, "engelbrecht2.json"), encoding="utf-8"))
leaf_von_seite = {}
for e in eng2:
    if e["seite"]:
        leaf_von_seite.setdefault(e["seite"], e["pdf_seite"] - 1)
for p in pn:
    if p["pageNumber"].isdigit():
        leaf_von_seite.setdefault(int(p["pageNumber"]), p["leafNum"])
versatz = collections.Counter(l - s for s, l in leaf_von_seite.items())
haupt_versatz = versatz.most_common(1)[0][0]
cb = json.load(open(os.path.join(A, "commons_bilder.json"), encoding="utf-8"))
lauche = json.load(open(os.path.join(A, "commons_lauche.json"), encoding="utf-8"))

def art_aus(datei, beschr):
    t = (datei + " " + beschr).lower()
    if "deutsche pomologie" in t or "aquarell" in t or "tafel" in t or "watercolor" in t or "illustration" in t: return "tafel"
    if any(w in t for w in ("schnitt", "cross section", "querschnitt", "längsschnitt", "section")): return "schnitt"
    if any(w in t for w in ("blüte", "bluete", "blossom", "flower")): return "bluete"
    if any(w in t for w in ("baum", "tree", "naturdenkmal")): return "baum"
    return "frucht"

ausgeschlossen = re.compile(r"wappen|coat of arms|karte|map\b|logo|portrait|porträt|denkmal_?stein|signature|briefmarke|stamp", re.I)
for s in sorten:
    bilder = []
    # Engelbrecht-Längsschnitt: Seite des Eintrags
    seiten = []
    for m in s["merkmale"]:
        if m["quelle"] == "engelbrecht1889":
            mm = re.match(r"\s*(\d{1,3})", m.get("seite", ""))
            if mm: seiten.append(int(mm.group(1)))
    if seiten:
        sp = collections.Counter(seiten).most_common(1)[0][0]
        leaf = leaf_von_seite.get(sp, sp + haupt_versatz)
        bilder.append({"url": f"https://archive.org/download/bub_gb_tR4EMgEACAAJ/page/n{leaf}_w800.jpg",
                       "seite": f"https://archive.org/details/bub_gb_tR4EMgEACAAJ/page/n{leaf}",
                       "art": "schnitt", "urheber": "Theodor Engelbrecht (Zeichnung), Albert Probst (Holzschnitt)", "lizenz": "gemeinfrei",
                       "quelle": "engelbrecht1889", "titel": f"Längsschnitt-Umriss bei Engelbrecht 1889, S. {sp} (ganze Buchseite)"})
    # Wikipedia-Artikel der Sorte
    titel = set()
    for b in [b for t in s["texte"] for b in t["belege"]] + [m for m in s["merkmale"]]:
        u = b.get("url") or ""
        mm = re.search(r"title=([^&]+)&oldid", u)
        if b.get("quelle") == "wikipedia_de" and mm:
            titel.add(mm.group(1).replace("_", " "))
    if s["id"] != "blutapfel":
        for t in sorted(titel):
            for bi in cb.get(t, []):
                if ausgeschlossen.search(bi["datei"]) or not bi.get("thumb"):
                    continue
                art = art_aus(bi["datei"], bi.get("beschreibung", ""))
                bilder.append({"url": bi["thumb"].split("?")[0], "seite": bi["seite"], "art": art,
                               "urheber": bi.get("urheber") or "siehe Dateiseite", "lizenz": bi.get("lizenz") or "siehe Dateiseite",
                               "quelle": "lauche_dp1882" if "Deutsche Pomologie" in bi["datei"] else "commons", "titel": bi["datei"]})
    # Lauche-Tafeln über Namen und Synonyme
    namen = {norm(s["name"])} | {norm(y["name"]) for y in s["synonyme"]}
    for l in lauche:
        if l["sorte"] and norm(l["sorte"]) in namen and not any(b["seite"] == l["seite"] for b in bilder):
            bilder.append({"url": l["thumb"].split("?")[0], "seite": l["seite"], "art": "tafel", "urheber": "Wilhelm Lauche (Deutsche Pomologie, 1882)",
                           "lizenz": "gemeinfrei", "quelle": "lauche_dp1882", "titel": l["datei"] + f" ({l['sorte']})"})
    # doppelte Bilder entfernen
    gesehen, s["bilder"] = set(), []
    for b in bilder:
        if b["seite"] not in gesehen:
            gesehen.add(b["seite"]); s["bilder"].append(b)

# ------------------------------------------------------------ Ausgabe
for s in sorten:
    s.pop("_stapel", None)
sorten.sort(key=lambda s: s["name"].lower())
reihenfolge = ["id", "name", "synonyme", "munq", "akzessionen", "herkunft", "merkmale", "texte", "bilder", "farbmessung"]
sorten = [{k: s[k] for k in reihenfolge if k in s} for s in sorten]
# Nachtrag nach Katalog-Erweiterung (Juni, flachrund, mittelfrüh/mittelspät, Kernhaus-/Kernfachmaße)
import nachtrag_katalog
zaehl, _ = nachtrag_katalog.nachtrag(D, sorten)
print("Nachtrag:", dict(zaehl))
json.dump(sorten, open(os.path.join(D, "de", "sorten_de.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
json.dump(quellen, open(os.path.join(D, "de", "quellen.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(sorten), "Sorten;", len(quellen), "Quellen;", sum(len(s["bilder"]) for s in sorten), "Bilder")
print("Bilder je Art:", dict(collections.Counter(b["art"] for s in sorten for b in s["bilder"])))
