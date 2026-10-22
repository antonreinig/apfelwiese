# Kandidaten-Abgleich der Auswahl (Wikipedia) mit Engelbrecht und Lucas/Lauche, inkl. Synonymen.
import json, re, sys, difflib
sys.path.insert(0, sys.argv[1])
from namen import norm
A = sys.argv[2]
eng = json.load(open(f"{A}/engelbrecht.json"))
luc = json.load(open(f"{A}/lucas_bd1.json")) + json.load(open(f"{A}/lucas_bd4.json")) + json.load(open(f"{A}/lauche_erg.json"))
wiki = json.load(open(sys.argv[3]))
titel = [l.strip() for l in open(sys.argv[4]) if l.strip()]

def wiki_namen(t):
    tx = wiki[t]["text"]
    namen = {re.sub(r"\s*\(.*\)", "", t)}
    m = re.search(r"\|\s*Synonyme\s*=\s*([^\n]*)", tx)
    if m:
        for s in re.split(r",|;|<br\s*/?>|\bund\b", m.group(1)):
            s = re.sub(r"\[\[|\]\]|''|\(.*?\)|<.*?>", "", s).strip()
            if 2 < len(s) < 50: namen.add(s)
    lead = re.sub(r"\{\{.*?\}\}", "", tx, flags=re.S)[:3000]
    for b in re.findall(r"'''(.+?)'''", lead):
        b = re.sub(r"\[\[|\]\]|''", "", b)
        if 2 < len(b) < 50: namen.add(b)
    return sorted(namen)

eng_namen = []
for k, e in enumerate(eng):
    ns = [re.sub(r"^\S{1,5}[.,»]\s+", "", e["kopf_ocr"].split("(")[0])] + [n for n, t in e["register_seite"]]
    eng_namen.append([norm(n) for n in ns if n])
luc_namen = [[norm(e["kopf_ocr"].split(".")[0]), norm(e["text"][len(e["kopf_ocr"]):][:120].split(".")[0])] for e in luc]

def best(namen, kand):
    res = []
    nn = [norm(n) for n in namen]
    for k, ks in enumerate(kand):
        w = max(difflib.SequenceMatcher(None, a, b).ratio() for a in nn for b in ks if b) if any(ks) else 0
        res.append((w, k))
    res.sort(reverse=True)
    return res[:3]

out = []
for t in titel:
    ns = wiki_namen(t)
    be = best(ns, eng_namen); bl = best(ns, luc_namen)
    out.append({"titel": t, "namen": ns,
        "eng": [(round(w, 2), eng[k]["nr"], eng[k]["seite"], eng[k]["name_register"], eng[k]["kopf_ocr"][:45], k) for w, k in be],
        "luc": [(round(w, 2), luc[k]["band"], luc[k]["nr"], luc[k]["seite"], luc[k]["kopf_ocr"][:40], k) for w, k in bl]})
json.dump(out, open(sys.argv[5], "w"), ensure_ascii=False, indent=0)
for o in out:
    e, l = o["eng"][0], o["luc"][0]
    print(f'{o["titel"][:28]:28} E {e[0]:.2f} {e[1]:>3} {str(e[3])[:22]:22} {e[4][:30]:30} | L {l[0]:.2f} {l[1]} {l[2]} {l[4][:28]}')
