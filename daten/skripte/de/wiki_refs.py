# Sucht in den Wikipedia-Artikeln Verweise auf Engelbrecht (Nr./S.) und das Illustrirte Handbuch.
import json, re, sys
d = json.load(open(sys.argv[1]))
out = {}
for t, v in d.items():
    tx = v["text"]
    eng = re.findall(r"Engelbrecht[^<\n]{0,400}?(?:S\.|Seite)\s*(\d{1,3})[^<\n]{0,40}?(?:Nr\.|No\.)\s*(\d{1,3})", tx)
    eng += [(b, a) for a, b in re.findall(r"Engelbrecht[^<\n]{0,400}?(?:Nr\.|No\.)\s*(\d{1,3})[^<\n]{0,40}?(?:S\.|Seite)\s*(\d{1,3})", tx)]
    luc = re.findall(r"(?:Handbuch der Obstkunde|Illustrirtes Handbuch|Ilustrites Handbuch|Lucas)[^<\n]{0,250}?(?:S\.|Seite)\s*(\d{1,3})[^<\n]{0,30}?(?:Nr\.|No\.)\s*(\d{1,3})", tx)
    out[t] = {"engelbrecht": sorted(set(eng)), "lucas": sorted(set(luc))}
json.dump(out, open(sys.argv[2], "w"), ensure_ascii=False, indent=0)
print(sum(1 for x in out.values() if x["engelbrecht"]), "mit Engelbrecht-Verweis;", sum(1 for x in out.values() if x["lucas"]), "mit Lucas-Verweis")
