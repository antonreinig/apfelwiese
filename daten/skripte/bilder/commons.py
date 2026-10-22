"""Kleiner Client für die Wikimedia-Commons-API.

Regeln: eigener User-Agent mit Kontakt, keine parallelen Anfragen, maxlag=5,
bei Fehlern/Lag zurückhaltend wiederholen. Antworten werden im Cache unter
daten/roh/bilder/api-cache/ abgelegt, damit Wiederholungsläufe die API nicht belasten.
"""
import hashlib
import json
import os
import time
import urllib.parse
import urllib.request

API = "https://commons.wikimedia.org/w/api.php"
UA = "Apfelwiese/1.0 (+https://apfelwiese.app/#/impressum) python-urllib"
HIER = os.path.dirname(os.path.abspath(__file__))
PROJEKT = os.path.abspath(os.path.join(HIER, "..", "..", ".."))
ROH = os.path.join(PROJEKT, "daten", "roh", "bilder")
CACHE = os.path.join(ROH, "api-cache")
os.makedirs(CACHE, exist_ok=True)

_letzte = [0.0]


def _warte(min_abstand=0.25):
    d = time.time() - _letzte[0]
    if d < min_abstand:
        time.sleep(min_abstand - d)
    _letzte[0] = time.time()


# Medienserver (upload/thumb.wikimedia.org) begrenzen Abrufe stark (HTTP 429 mit
# Retry-After). Abstand adaptiv: nach 429 verlängern, nach vielen Erfolgen langsam verkürzen.
_medien = {"abstand": 1.0, "serie": 0}


def holen(url, versuche=8, timeout=60):
    medien = "upload.wikimedia.org" in url or "thumb.wikimedia.org" in url
    for i in range(versuche):
        _warte(_medien["abstand"] if medien else 0.25)
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                daten = r.read()
            if medien:
                _medien["serie"] += 1
                if _medien["serie"] >= 50 and _medien["abstand"] > 0.6:
                    _medien["abstand"] *= 0.9
                    _medien["serie"] = 0
            return daten
        except urllib.error.HTTPError as e:
            if e.code in (429, 500, 502, 503, 504):
                ra = e.headers.get("Retry-After")
                if medien and e.code == 429:
                    _medien["abstand"] = min(_medien["abstand"] * 1.5, 10.0)
                    _medien["serie"] = 0
                time.sleep(int(ra) if ra and ra.isdigit() else 5 * (i + 1))
                continue
            raise
        except Exception:
            time.sleep(5 * (i + 1))
    raise RuntimeError("Abruf fehlgeschlagen: " + url)


def api(params, cache=True):
    p = dict(params)
    p.update({"format": "json", "formatversion": "2", "maxlag": "5"})
    q = urllib.parse.urlencode(sorted(p.items()))
    key = hashlib.sha1(q.encode()).hexdigest()
    pfad = os.path.join(CACHE, key + ".json")
    if cache and os.path.exists(pfad):
        with open(pfad) as f:
            return json.load(f)
    for i in range(8):
        daten = json.loads(holen(API + "?" + q))
        if "error" in daten and daten["error"].get("code") == "maxlag":
            time.sleep(5 + 5 * i)
            continue
        break
    if "error" in daten:
        raise RuntimeError(json.dumps(daten["error"])[:500])
    if cache:
        with open(pfad, "w") as f:
            json.dump(daten, f)
    return daten


def api_alle(params):
    """Folgt 'continue' und liefert alle Antwortseiten."""
    p = dict(params)
    while True:
        d = api(p)
        yield d
        if "continue" not in d:
            break
        p = dict(params)
        p.update(d["continue"])


def kategorie_mitglieder(kat, typ="file|subcat"):
    out = []
    for d in api_alle({"action": "query", "list": "categorymembers", "cmtitle": kat,
                       "cmlimit": "500", "cmtype": typ}):
        out.extend(d.get("query", {}).get("categorymembers", []))
    return out


def bildinfo(titel_liste, breite=640):
    """imageinfo (url, thumburl, extmetadata) für bis zu 50 Dateien je Anfrage."""
    out = {}
    for i in range(0, len(titel_liste), 50):
        teil = titel_liste[i:i + 50]
        for d in api_alle({"action": "query", "titles": "|".join(teil), "prop": "imageinfo",
                           "iiprop": "url|extmetadata|size|mime", "iiurlwidth": str(breite)}):
            for pg in d.get("query", {}).get("pages", []):
                if pg.get("imageinfo"):
                    out[pg["title"]] = pg["imageinfo"][0]
    return out
