"""Lädt die NFC-Schnitttafeln (6 Äpfel mit 2 Schnitten) herunter."""
import json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import commons as c, laden
d = json.load(open(os.path.join(c.ROH, "meta", "nfc.json")))
n = 0
for e in d:
    if "6 apples with 2 cross sections" in e["meta"].get("Categories", ""):
        try:
            laden.datei(e["titel"], e["thumburl"], "nfc")
            n += 1
        except Exception as ex:
            print("Fehler", e["titel"], ex, flush=True)
        if n % 200 == 0: print(n, flush=True)
print("fertig", n)
