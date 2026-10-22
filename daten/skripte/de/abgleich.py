# Abgleich der Wikipedia-Sorten mit Engelbrecht (über Register) und Lucas (über Kopfzeilen).
import json, re, sys, difflib
sys.path.insert(0, sys.argv[1])
from namen import norm
A = sys.argv[2]
eng = json.load(open(f"{A}/engelbrecht.json"))
luc = json.load(open(f"{A}/lucas_bd1.json")) + json.load(open(f"{A}/lucas_bd4.json")) + json.load(open(f"{A}/lauche_erg.json"))
wiki = json.load(open(sys.argv[3]))
# Register neu einlesen (aus engelbrecht.json nicht vollständig): Namen je Seite
reg = []
for e in eng:
    for n, t in e["register_seite"]:
        reg.append((n, t, e["seite"]))
seite_zu_eintrag = {}
for k, e in enumerate(eng):
    seite_zu_eintrag.setdefault(e["seite"], []).append(k)
def eng_kand(name):
    nn = norm(name)
    res = []
    for k, e in enumerate(eng):
        kn = norm(re.sub(r"^\S{1,5}[.,»]\s+", "", e["kopf_ocr"].split("(")[0]))
        w1 = difflib.SequenceMatcher(None, nn, kn).ratio()
        w2 = max([difflib.SequenceMatcher(None, nn, norm(n)).ratio() for n, t in e["register_seite"]] or [0])
        res.append((max(w1, w2), k))
    res.sort(reverse=True)
    return [(round(w, 2), eng[k]["nr"], eng[k]["seite"], eng[k]["name_register"], eng[k]["kopf_ocr"][:50]) for w, k in res[:3]]
def luc_kand(name):
    nn = norm(name)
    res = []
    for k, e in enumerate(luc):
        kn = norm(e["kopf_ocr"].split(".")[0])
        res.append((difflib.SequenceMatcher(None, nn, kn).ratio(), k))
    res.sort(reverse=True)
    return [(round(w, 2), luc[k]["band"], luc[k]["nr"], luc[k]["seite"], luc[k]["kopf_ocr"][:40]) for w, k in res[:2]]
out = {}
for t in sys.argv[4:]:
    out[t] = {"eng": eng_kand(t), "luc": luc_kand(t)}
    print(t, "\n   E:", out[t]["eng"][:2], "\n   L:", out[t]["luc"][:2])
