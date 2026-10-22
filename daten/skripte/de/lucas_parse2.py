# Zerlegt einen Band des Illustrirten Handbuchs der Obstkunde bzw. Lauches Ergänzungsband
# anhand der seitengenauen Internet-Archive-OCR (hocr_searchtext + pageindex + page_numbers).
# Aufruf: python3 -I lucas_parse2.py <ordner> <ia-id> <band> <nr_min> <nr_max> <ausgabe.json> [letzte_leaf]
import gzip, json, re, sys, os

ordner, ia, band, nr_min, nr_max, ziel = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5]), sys.argv[6]
letzte_leaf = int(sys.argv[7]) if len(sys.argv) > 7 else 10 ** 9
text = gzip.open(os.path.join(ordner, f"{ia}_hocr_searchtext.txt.gz")).read().decode("utf-8")
index = json.load(gzip.open(os.path.join(ordner, f"{ia}_hocr_pageindex.json.gz")))
pn = json.load(open(os.path.join(ordner, f"{ia}_page_numbers.json"), encoding="utf-8"))["pages"]
druck = {p["leafNum"]: p["pageNumber"] for p in pn}

# Druckseite je Leaf: erkannte Seitenzahl, Lücken per Versatz aus Nachbarn
versatz = {}
for leaf, s in druck.items():
    if s and s.isdigit():
        versatz[leaf] = leaf - int(s)
def seite_von(leaf):
    nah = sorted(versatz, key=lambda l: abs(l - leaf))[:7]
    if not nah:
        return None
    vs = [versatz[l] for l in nah]
    v = max(set(vs), key=vs.count)
    return leaf - v

zeilen = []  # (leaf, zeile)
for leaf, eintrag in enumerate(index):
    if leaf > letzte_leaf:
        break
    a, b = eintrag[0], eintrag[1]
    for z in text[a:b].split("\n"):
        zeilen.append((leaf, z))

kopf_re = re.compile(r"^.{0,12}?\b[NRYVA][oOv0]?\W{0,2}\s*(\d{3}|\d{1,2}(?=\s*[.,:]))\s*[.,:]?\s*([A-ZÄÖÜ(].*)$")
kandk = []
for i, (leaf, z) in enumerate(zeilen):
    m = kopf_re.match(z) if len(z) < 120 else None
    if not m:
        continue
    nr = int(m.group(1))
    if nr_min <= nr <= nr_max:
        gew = 3 if re.search(r"Diel|Luc|Hogg|Dogg|Hegg", z) else (2 if re.match(r"^\W{0,3}N[oO0]", z) else 1)
        kandk.append((i, nr, m.group(2).strip(), gew))
W = [c[3] for c in kandk]; V = [-1] * len(kandk)
for b in range(len(kandk)):
    for a in range(max(0, b - 80), b):
        if 1 <= kandk[b][1] - kandk[a][1] <= 8 and W[a] + kandk[b][3] > W[b]:
            W[b], V[b] = W[a] + kandk[b][3], a
b = max(range(len(kandk)), key=lambda k: W[k])
koepfe = []
while b != -1:
    koepfe.append(kandk[b][:3]); b = V[b]
koepfe = koepfe[::-1]
klass_re = re.compile(r"(Diel|Dieb|Diet|Piel)\W.{0,25}(Luc|Lue|Aue|&uc|Lucas|Le\.)")
ergaenzt = []
for k in range(len(koepfe) - 1):
    (i, a, _), (j, b, _) = koepfe[k], koepfe[k + 1]
    if b - a < 2:
        continue
    kz = [x for x in range(i + 3, j) if len(zeilen[x][1]) < 120 and klass_re.search(zeilen[x][1])]
    if len(kz) == b - a - 1:
        for t, x in enumerate(kz):
            ergaenzt.append((x, a + 1 + t, zeilen[x][1].strip()))
koepfe = sorted(koepfe + ergaenzt)

eintraege = []
for k, (i, nr, rest) in enumerate(koepfe):
    ende = koepfe[k + 1][0] if k + 1 < len(koepfe) else len(zeilen)
    roh = []
    for leaf, z in zeilen[i:ende]:
        t = z.strip()
        if not t or re.fullmatch(r"\d{1,3}", t) or t.startswith("Digitized") or "Handbuch der Ob" in t:
            continue
        roh.append(t)
    tx = " ".join(roh)
    tx = re.sub(r"(\w)[-⸗] (\w)", r"\1\2", tx)
    tx = re.sub(r"\s+", " ", tx)
    leaf0, leaf1 = zeilen[i][0], zeilen[ende - 1][0]
    eintraege.append({"band": band, "nr": nr, "kopf_ocr": rest[:200], "seite": seite_von(leaf0), "seite_bis": seite_von(leaf1),
                      "leaf": leaf0, "leaf_bis": leaf1, "text": tx[:20000]})

json.dump(eintraege, open(ziel, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
fehlend = sorted(set(range(nr_min, nr_max + 1)) - {e["nr"] for e in eintraege})
print(band, len(eintraege), "Einträge; fehlend:", len(fehlend), fehlend[:40])
