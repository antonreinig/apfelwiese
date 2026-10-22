# Lädt Wikitext aller Artikel der Kategorie:Apfelsorte (de.wikipedia) mit Revisions-ID.
import json, sys, time, urllib.parse, urllib.request
ZIEL = sys.argv[1]
UA = "ApfelApp-Recherche/0.1 (Sortendatenbank, privat)"
API = "https://de.wikipedia.org/w/api.php"
def get(params):
    url = API + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)
cat = json.load(open(f"{ZIEL}/cat1.json"))["query"]["categorymembers"]
titel = [m["title"] for m in cat if m["ns"] == 0 and not m["title"].startswith("Liste")]
out = {}
for i in range(0, len(titel), 50):
    batch = titel[i:i+50]
    d = get({"action": "query", "prop": "revisions|pageprops", "rvprop": "content|ids|timestamp", "rvslots": "main",
             "titles": "|".join(batch), "format": "json", "formatversion": "2", "redirects": "1"})
    for p in d["query"]["pages"]:
        rev = p["revisions"][0]
        out[p["title"]] = {"pageid": p["pageid"], "revid": rev["revid"], "timestamp": rev["timestamp"],
                           "wikibase": p.get("pageprops", {}).get("wikibase_item"),
                           "text": rev["slots"]["main"]["content"]}
    time.sleep(1)
json.dump(out, open(f"{ZIEL}/artikel.json", "w"), ensure_ascii=False, indent=0)
print(len(out))
