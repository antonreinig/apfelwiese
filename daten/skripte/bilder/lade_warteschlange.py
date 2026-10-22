"""Lädt Vorschaubilder der Reihe nach: NFC-Schnitttafeln, USDA-Aquarelle, historische Tafeln,
danach optional eine Liste aus daten/roh/bilder/warteschlange.json ([titel, url, gruppe])."""
import json, os, sys, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import commons as c, laden

def eintraege():
    m = os.path.join(c.ROH, "meta")
    for e in json.load(open(os.path.join(m, "nfc.json"))):
        if "6 apples with 2 cross sections" in e["meta"].get("Categories", ""):
            yield e["titel"], e["thumburl"], "nfc"
    for e in json.load(open(os.path.join(m, "usda.json"))):
        yield e["titel"], e["thumburl"], "usda"
    for e in json.load(open(os.path.join(m, "tafeln.json"))):
        # nur Lauche wird gemessen; andere Tafelwerke nicht laden (Platz)
        if e["kategorie"] == "Category:Deutsche Pomologie - Aepfel" and e.get("mime", "").startswith("image/"):
            yield e["titel"], e["thumburl"], "tafeln"
    w = os.path.join(c.ROH, "warteschlange.json")
    if os.path.exists(w):
        for t, u, g in json.load(open(w)):
            yield t, u, g

n = f = 0
t0 = time.time()
for titel, url, gruppe in eintraege():
    if laden.pfad(titel, gruppe):
        continue
    while laden.platz_frei_mb() < 60:
        print(time.strftime("%H:%M:%S"), "Platte fast voll, warte", flush=True)
        time.sleep(120)
    try:
        laden.datei(titel, url, gruppe)
        n += 1
    except Exception as ex:
        f += 1
        print("Fehler", titel, ex, flush=True)
    if n % 100 == 0:
        print(time.strftime("%H:%M:%S"), gruppe, n, "geladen", f, "Fehler, Abstand %.2f s" % c._medien["abstand"], flush=True)
print("fertig", n, f)
