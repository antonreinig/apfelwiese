# Listet die Lauche-Farbtafeln (Deutsche Pomologie, Äpfel) auf Commons mit dargestellter Sorte.
import json, re, sys, time, urllib.parse, urllib.request, urllib.error
UA = "ApfelApp-Recherche/0.1 (Sortendatenbank, privat)"
def api(q):
    req = urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + urllib.parse.urlencode(q), headers={"User-Agent": UA})
    for v in range(6):
        try:
            return json.load(urllib.request.urlopen(req, timeout=60))
        except urllib.error.HTTPError as e:
            if e.code != 429: raise
            time.sleep(20 * (v + 1))
    raise SystemExit("429")
out = []
cont = {}
while True:
    q = {"action": "query", "generator": "search", "gsrsearch": 'intitle:"Deutsche Pomologie - Aepfel"', "gsrnamespace": "6", "gsrlimit": "50",
         "prop": "imageinfo", "iiprop": "url|extmetadata", "iiurlwidth": "640", "format": "json", "formatversion": "2"}
    q.update(cont)
    r = api(q)
    for p in r.get("query", {}).get("pages", []):
        ii = p["imageinfo"][0]; em = ii.get("extmetadata", {})
        desc = re.sub(r"<[^>]+>", "", em.get("ImageDescription", {}).get("value", ""))
        m = re.search(r"Apple cultivar shown:\s*(.+)", desc)
        out.append({"datei": p["title"][5:], "sorte": m.group(1).strip() if m else None, "thumb": ii.get("thumburl"), "seite": ii.get("descriptionurl"),
                    "lizenz": re.sub(r"<[^>]+>", "", em.get("LicenseShortName", {}).get("value", ""))})
    if "continue" in r:
        cont = {k: v for k, v in r["continue"].items()}
        time.sleep(1)
    else:
        break
json.dump(out, open(sys.argv[1], "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(out), sum(1 for x in out if x["sorte"]))
