# Zerlegt die neue Tesseract-OCR (eine Datei je PDF-Seite) von Engelbrecht,
# "Deutschlands Apfelsorten" (1889), in Sortenbeschreibungen.
# Aufruf: python3 -I engelbrecht_parse2.py <ocr-ordner> <ausgabe.json>
import json, re, sys, os, difflib

ordner, ziel = sys.argv[1], sys.argv[2]
dateien = sorted(f for f in os.listdir(ordner) if re.fullmatch(r"p\d{4}\.txt", f))

# Druckseite je PDF-Seite: Zahl am Anfang oder Ende der ersten Zeile; Lücken per Versatz füllen
seiten = []
for f in dateien:
    pdfseite = int(f[1:5])
    txt = open(os.path.join(ordner, f), encoding="utf-8").read()
    zeilen = [z for z in txt.split("\n") if z.strip()]
    druck = None
    for z in zeilen[:2]:
        m = re.match(r"^\s*(\d{1,3})\s", z) or re.search(r"\s(\d{1,3})\s*$", z)
        if m:
            druck = int(m.group(1))
            break
    seiten.append({"pdf": pdfseite, "druck_ocr": druck, "zeilen": txt.split("\n")})

# Versatz pdf - druck robust bestimmen (gleitender Mehrheitswert)
versatz = [s["pdf"] - s["druck_ocr"] if s["druck_ocr"] else None for s in seiten]
for i, s in enumerate(seiten):
    fenster = [v for v in versatz[max(0, i - 6):i + 7] if v is not None]
    if fenster:
        v = max(set(fenster), key=fenster.count)
        s["druck"] = s["pdf"] - v
    else:
        s["druck"] = None

kopf_re = re.compile(r"^\s*(\d{1,3})\s*[.,]\s+(.+)$")
def ist_gestalt(z):
    w = z.strip().split(" ")[0] if z.strip() else ""
    return bool(w) and w[0] == "G" and difflib.SequenceMatcher(None, w, "Gestalt").ratio() >= 0.6 \
        and re.search(r"\d", z[:20]) is not None

# Alle Zeilen mit Seitenbezug
alle = []
for s in seiten:
    for k, z in enumerate(s["zeilen"]):
        alle.append((s["pdf"], s["druck"], k, z))

# Kopfzeilen: Nummer + Name, gefolgt (innerhalb von 8 Zeilen) von einer Gestalt-Zeile
koepfe = []
for i, (pdf, druck, k, z) in enumerate(alle):
    m = kopf_re.match(z)
    if not m or len(z) > 160:
        continue
    if not any(ist_gestalt(alle[j][3]) for j in range(i + 1, min(i + 9, len(alle)))):
        continue
    rest = m.group(2).strip()
    if re.match(r"^(Gruppe|Ordnung|Classe|Clasge|Abtheilung|Unterabth)", rest) or len(rest) < 4:
        continue
    koepfe.append((i, int(m.group(1)), rest))

# Nummernfolge glätten: längste steigende Kette
W = [1] * len(koepfe); V = [-1] * len(koepfe)
for b in range(len(koepfe)):
    for a in range(max(0, b - 30), b):
        if 1 <= koepfe[b][1] - koepfe[a][1] <= 6 and W[a] + 1 > W[b]:
            W[b], V[b] = W[a] + 1, a
b = max(range(len(koepfe)), key=lambda x: W[x])
kette = []
while b != -1:
    kette.append(koepfe[b]); b = V[b]
kette = kette[::-1]
gute = {k[0] for k in kette}
# Kopfzeilen außerhalb der Kette mit unplausibler Nummer: Nummer interpolieren
alle_koepfe = []
letzte = 0
for (i, nr, rest) in koepfe:
    if i in gute:
        alle_koepfe.append((i, nr, rest, True)); letzte = nr
    else:
        alle_koepfe.append((i, letzte + 1, rest, False)); letzte = letzte + 1

feld_re = [
    ("kelchhoehle", re.compile(r"^K\S{0,3}lch\s*h\S{1,3}hle")),
    ("kernhaus", re.compile(r"^K\S{1,2}rnh\S{1,3}s")),
    ("kelch", re.compile(r"^K\S{0,3}lch\b")),
    ("stiel", re.compile(r"^St\S{1,2}el\b")),
    ("schale", re.compile(r"^Sch\S{1,2}l\S\b")),
    ("fleisch", re.compile(r"^F\S{0,2}eisch\b")),
    ("einsender", re.compile(r"^Die\s+Fr\S{1,3}chte\s+erh")),
]

def kolumnentitel(z):
    s = z.strip()
    return (re.match(r"^\d{1,3}\s+[A-ZÄÖÜ][a-zäöü]+.*[IVX]+[,.]", s) is not None
            or re.match(r"^[IVX]+[,.].*\d{1,3}$", s) is not None
            or re.fullmatch(r"\d{1,3}", s) is not None or "Google" in s)

ergebnis = []
for n, (i, nr, rest, sicher) in enumerate(alle_koepfe):
    ende = alle_koepfe[n + 1][0] if n + 1 < len(alle_koepfe) else len(alle)
    # Register am Buchende abschneiden
    felder = {"kopf": []}
    akt = "kopf"
    for j in range(i, ende):
        z = alle[j][3]
        s = z.strip()
        if not s or kolumnentitel(s):
            continue
        if s.startswith("REGISTER"):
            break
        neu = None
        if ist_gestalt(s) and "gestalt" not in felder:
            neu = "gestalt"
        else:
            for name, rx in feld_re:
                if rx.match(s) and name not in felder:
                    neu = name
                    break
        if neu:
            akt = neu
            felder[akt] = []
        felder[akt].append(s)
    def zus(t):
        t = " ".join(t)
        t = re.sub(r"(\w)- (\w)", r"\1\2", t)
        return re.sub(r"\s+", " ", t).strip()
    felder = {k: zus(v) for k, v in felder.items()}
    kopf = felder.pop("kopf")
    name = re.split(r"\s\(", rest)[0].strip()
    ergebnis.append({
        "nr": nr, "nr_sicher": sicher, "name_ocr": name, "kopf": kopf[:600],
        "seite": alle[i][1], "pdf_seite": alle[i][0],
        "felder": felder,
    })

# Zuordnung der älteren IA-OCR (engelbrecht.json) über Seite und Gestalt-Zahlen
alt_pfad = os.path.join(os.path.dirname(ziel), "engelbrecht.json")
if os.path.exists(alt_pfad):
    alt = json.load(open(alt_pfad, encoding="utf-8"))
    def zahlen(t):
        return re.findall(r"\d+", (t or "")[:40])
    for e in ergebnis:
        best, bw = None, 0
        for a in alt:
            if a["seite"] is None or e["seite"] is None or abs(a["seite"] - e["seite"]) > 2:
                continue
            w = difflib.SequenceMatcher(None, " ".join(zahlen(e["felder"].get("gestalt"))), " ".join(zahlen(a["felder"].get("gestalt")))).ratio()
            w += difflib.SequenceMatcher(None, (e["felder"].get("kernhaus") or "")[:60], (a["felder"].get("kernhaus") or "")[:60]).ratio()
            if w > bw:
                best, bw = a, w
        if best and bw > 1.0:
            e["ia_ocr"] = {"kopf": best["kopf_ocr"], "felder": best["felder"], "aehnlichkeit": round(bw, 2)}
ergebnis = [e for e in ergebnis if "gestalt" in e["felder"]]
json.dump(ergebnis, open(ziel, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(ergebnis), "Einträge,", sum(1 for e in ergebnis if e["nr_sicher"]), "mit sicherer Nummer; letzte Nr.", ergebnis[-1]["nr"])
fehl = sorted(set(range(1, ergebnis[-1]["nr"] + 1)) - {e["nr"] for e in ergebnis})
print("fehlende Nummern:", len(fehl), fehl[:60])
for f in ["gestalt", "kelch", "stiel", "schale", "kernhaus", "kelchhoehle", "fleisch", "einsender"]:
    print(f, sum(1 for x in ergebnis if f in x["felder"]))
