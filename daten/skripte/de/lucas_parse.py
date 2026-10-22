# Zerlegt den OCR-Text eines Apfelbandes des "Illustrirten Handbuchs der Obstkunde"
# (Lucas/Oberdieck/Jahn) oder von Lauches Ergänzungsband in Einträge "No. N.".
# Aufruf: python3 -I lucas_parse.py <djvu.txt> <band-kürzel> <nr_min> <nr_max> <ausgabe.json>
import json, re, sys

quelle, band, nr_min, nr_max, ziel = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
zeilen = open(quelle, encoding="utf-8").read().split("\n")
n = len(zeilen)

# Seitenzahlen als längste plausible Kette (Schritt 1..12)
kand = [(i, int(z.strip())) for i, z in enumerate(zeilen) if re.fullmatch(r"\d{1,3}", z.strip())]
best = [1] * len(kand); vor = [-1] * len(kand)
for b in range(len(kand)):
    for a in range(max(0, b - 60), b):
        if 1 <= kand[b][1] - kand[a][1] <= 12 and best[a] + 1 > best[b]:
            best[b], vor[b] = best[a] + 1, a
b = max(range(len(kand)), key=lambda k: best[k])
kette = []
while b != -1:
    kette.append(kand[b]); b = vor[b]
kette = dict(kette[::-1])
seiten, s = [], 0
for i in range(n):
    if i in kette:
        s = kette[i]
    seiten.append(s)

kopf_re = re.compile(r"^.{0,12}?\b[NRYVA][oOv0]?\W{0,2}\s*(\d{3}|\d{1,2}(?=\s*[.,:]))\s*[.,:]?\s*([A-ZÄÖÜ(].*)$")
kandk = []
for i, z in enumerate(zeilen):
    m = kopf_re.match(z) if len(z) < 120 else None
    if not m:
        continue
    nr = int(m.group(1))
    if nr_min <= nr <= nr_max:
        gew = 3 if re.search(r"Diel|Luc|Hogg|Dogg|Hegg", z) else (2 if re.match(r"^\W{0,3}N[oO0]", z) else 1)
        kandk.append((i, nr, m.group(2).strip(), gew))
# gewichtete längste Kette mit streng steigender Nummer (Schritt 1..8)
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
# Lücken füllen: Kopfzeilen ohne lesbare Nummer an der Klassifikation "… Diel; … Luc." erkennen
klass_re = re.compile(r"(Diel|Dieb|Diet|Piel)\W.{0,25}(Luc|Lue|Aue|&uc|Lucas|Le\.)")
ergaenzt = []
for k in range(len(koepfe) - 1):
    (i, a, _), (j, b, _) = koepfe[k], koepfe[k + 1]
    if b - a < 2:
        continue
    kz = [x for x in range(i + 3, j) if len(zeilen[x]) < 120 and klass_re.search(zeilen[x])]
    if len(kz) == b - a - 1:
        for t, x in enumerate(kz):
            ergaenzt.append((x, a + 1 + t, zeilen[x].strip()))
koepfe = sorted(koepfe + ergaenzt)

eintraege = []
for k, (i, nr, rest) in enumerate(koepfe):
    ende = koepfe[k + 1][0] if k + 1 < len(koepfe) else n
    roh = []
    for z in zeilen[i:ende]:
        t = z.strip()
        if not t or re.fullmatch(r"\d{1,3}", t) or t.startswith("Digitized") or "Handbuch der Ob" in t:
            continue
        roh.append(t)
    text = " ".join(roh)
    text = re.sub(r"(\w)[-⸗] (\w)", r"\1\2", text)
    text = re.sub(r"\s+", " ", text)
    eintraege.append({
        "band": band, "nr": nr, "kopf_ocr": rest[:200],
        "seite": seiten[i] or None,
        "seite_bis": seiten[ende - 1],
        "text": text,
        "zeilen": [i + 1, ende],
    })

json.dump(eintraege, open(ziel, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
fehlend = sorted(set(range(nr_min, nr_max + 1)) - {e["nr"] for e in eintraege})
print(band, len(eintraege), "Einträge; fehlend:", len(fehlend), fehlend[:40])
