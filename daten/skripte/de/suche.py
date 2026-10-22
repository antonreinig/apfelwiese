# Suchwerkzeug für die Bearbeitung: findet Einträge in Engelbrecht (1889), Illustrirtem Handbuch
# Bd. 1 und 4 und Lauches Ergänzungsband nach Name (unscharf) oder Nummer und gibt den Volltext aus.
#
#   python3 -I daten/skripte/de/suche.py "Ananas Reinette"        # beste Treffer (Kurzliste)
#   python3 -I daten/skripte/de/suche.py "Ananas Reinette" --voll # mit Volltext der 3 besten
#   python3 -I daten/skripte/de/suche.py E:431                    # Engelbrecht Nr. 431 (Volltext)
#   python3 -I daten/skripte/de/suche.py L:I:50                   # Illustr. Handbuch Bd. I Nr. 50
#   python3 -I daten/skripte/de/suche.py L:E1:741                 # Lauche, Ergänzungsband Nr. 741
#   python3 -I daten/skripte/de/suche.py --text "Rosmarin"        # Volltextsuche (Teilstring)
import json, os, re, sys, difflib
HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HIER)
from namen import norm
A = os.path.join(HIER, "..", "..", "de", "arbeit")
eng = json.load(open(os.path.join(A, "engelbrecht2.json"), encoding="utf-8"))
luc = []
for f in ("lucas_bd1.json", "lucas_bd4.json", "lauche_erg.json"):
    luc += json.load(open(os.path.join(A, f), encoding="utf-8"))

def e_text(e):
    t = [f"[Engelbrecht 1889] Nr. {e['nr']}{'' if e['nr_sicher'] else ' (Nr. unsicher)'}, S. {e['seite']} (PDF-Seite {e['pdf_seite']})",
         "KOPF: " + e["kopf"]]
    for k in ("gestalt", "kelch", "stiel", "schale", "kernhaus", "kelchhoehle", "fleisch", "einsender"):
        if k in e["felder"]:
            t.append(f"{k.upper()}: {e['felder'][k]}")
    if "ia_ocr" in e:
        t.append("--- Zweite OCR derselben Seite (Internet Archive, zum Gegenlesen) ---")
        t.append("KOPF: " + e["ia_ocr"]["kopf"])
        for k in ("gestalt", "kelch", "stiel", "schale", "kernhaus", "kelchhoehle", "fleisch", "einsender"):
            if k in e["ia_ocr"]["felder"]:
                t.append(f"{k.upper()}: {e['ia_ocr']['felder'][k]}")
    return "\n".join(t)

def l_text(e):
    werk = {"I": "Illustr. Handbuch Bd. I (1859)", "IV": "Illustr. Handbuch Bd. IV (1862-65)", "E1": "Lauche, Ergänzungsband (1883)"}[e["band"]]
    return f"[{werk}] Nr. {e['nr']}, S. {e['seite']}–{e['seite_bis']}\n{e['text']}"

args = sys.argv[1:]
voll = "--voll" in args
args = [a for a in args if a != "--voll"]
if not args:
    print(__doc__ if __doc__ else "Aufruf siehe Kopf der Datei"); sys.exit()
q = args[0]
if q == "--text":
    s = args[1].lower()
    for e in eng:
        if s in e_text(e).lower():
            print(f"E:{e['nr']}  S.{e['seite']}  {e['name_ocr'][:60]}")
    for e in luc:
        if s in e["text"].lower():
            print(f"L:{e['band']}:{e['nr']}  S.{e['seite']}  {e['kopf_ocr'][:60]}")
    sys.exit()
m = re.fullmatch(r"E:(\d+)", q)
if m:
    for e in eng:
        if e["nr"] == int(m.group(1)):
            print(e_text(e)); print()
    sys.exit()
m = re.fullmatch(r"L:(I|IV|E1):(\d+)", q)
if m:
    for e in luc:
        if e["band"] == m.group(1) and e["nr"] == int(m.group(2)):
            print(l_text(e)); print()
    sys.exit()
nq = norm(q)
re_ = []
for e in eng:
    w = difflib.SequenceMatcher(None, nq, norm(e["name_ocr"])).ratio()
    re_.append((w, "E", e))
for e in luc:
    kopf = e["kopf_ocr"].split(".")[0]
    zweit = e["text"][len(e["kopf_ocr"]):][:150].split(".")[0]
    w = max(difflib.SequenceMatcher(None, nq, norm(kopf)).ratio(), difflib.SequenceMatcher(None, nq, norm(zweit)).ratio())
    re_.append((w, "L", e))
re_.sort(key=lambda x: -x[0])
for w, t, e in re_[:8]:
    if t == "E":
        print(f"{w:.2f}  E:{e['nr']}  S.{e['seite']}  {e['name_ocr'][:70]}")
    else:
        print(f"{w:.2f}  L:{e['band']}:{e['nr']}  S.{e['seite']}  {e['kopf_ocr'][:70]}")
if voll:
    for w, t, e in re_[:3]:
        print("\n" + (e_text(e) if t == "E" else l_text(e)))
