# Holt Sprachverweise (en, fr, nl) der deutschen Apfelsorten-Artikel.
import json, sys, time, urllib.parse, urllib.request
d = json.load(open(sys.argv[1]))
UA = "ApfelApp-Recherche/0.1 (Sortendatenbank, privat)"
titel = list(d)
out = {}
for i in range(0, len(titel), 50):
    b = titel[i:i + 50]
    q = {"action": "query", "prop": "langlinks", "lllimit": "500", "titles": "|".join(b), "format": "json", "formatversion": "2"}
    req = urllib.request.Request("https://de.wikipedia.org/w/api.php?" + urllib.parse.urlencode(q), headers={"User-Agent": UA})
    r = json.load(urllib.request.urlopen(req, timeout=60))
    for p in r["query"]["pages"]:
        out[p["title"]] = {l["lang"]: l["title"] for l in p.get("langlinks", []) if l["lang"] in ("en", "fr", "nl", "da", "sv", "cs", "pl")}
    time.sleep(1)
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
print(len(out), sum(1 for v in out.values() if "en" in v), "mit en")
