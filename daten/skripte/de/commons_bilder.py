# Holt Lizenz- und URL-Angaben (Wikimedia Commons) zu den Bildern der ausgewählten Wikipedia-Artikel.
# Aufruf: python3 -I commons_bilder.py <artikel.json> <auswahl_wiki.txt> <ausgabe.json>
import json, re, sys, time, urllib.parse, urllib.request
art = json.load(open(sys.argv[1], encoding="utf-8"))
titel = [l.strip() for l in open(sys.argv[2], encoding="utf-8") if l.strip()]
UA = "ApfelApp-Recherche/0.1 (Sortendatenbank, privat)"
dateien = {}
for t in titel:
    tx = art[t]["text"]
    fs = re.findall(r"\[\[(?:Datei|File|Bild):([^|\]]+)", tx)
    m = re.search(r"\|\s*Bild\s*=\s*([^\n|]+)", tx)
    if m and m.group(1).strip():
        fs.insert(0, m.group(1).strip())
    dateien[t] = list(dict.fromkeys(f.strip().replace("_", " ") for f in fs if f.strip()))
alle = sorted({f for v in dateien.values() for f in v})
info = {}
for i in range(0, len(alle), 40):
    b = ["File:" + f for f in alle[i:i + 40]]
    q = {"action": "query", "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": "640", "titles": "|".join(b), "format": "json", "formatversion": "2"}
    req = urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(q), headers={"User-Agent": UA})
    r = json.load(urllib.request.urlopen(req, timeout=60))
    norm = {n["to"]: n["from"] for n in r["query"].get("normalized", [])}
    for p in r["query"]["pages"]:
        if "imageinfo" not in p:
            continue
        ii = p["imageinfo"][0]; em = ii.get("extmetadata", {})
        def g(k):
            v = em.get(k, {}).get("value", "")
            return re.sub(r"<[^>]+>", "", v).strip()
        info[p["title"][5:]] = {"thumb": ii.get("thumburl"), "seite": ii.get("descriptionurl"), "lizenz": g("LicenseShortName"),
                                "urheber": g("Artist") or g("Credit"), "beschreibung": g("ImageDescription")[:300]}
    time.sleep(1)
out = {t: [dict(datei=f, **info[f]) for f in fs if f in info] for t, fs in dateien.items()}
json.dump(out, open(sys.argv[3], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(alle), "Dateien,", len(info), "mit Angaben")
