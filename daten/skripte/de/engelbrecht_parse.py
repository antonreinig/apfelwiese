# Zerlegt den OCR-Text von Engelbrecht, "Deutschlands Apfelsorten" (1889),
# Internet Archive bub_gb_tR4EMgEACAAJ, in einzelne Sortenbeschreibungen.
# Aufruf: python3 -I engelbrecht_parse.py <djvu.txt> <ausgabe.json>
import json, re, sys, difflib, unicodedata

quelle, ziel = sys.argv[1], sys.argv[2]
zeilen = open(quelle, encoding="utf-8").read().split("\n")

# ---------------------------------------------------------------- Register
reg_start = next(i for i, z in enumerate(zeilen) if z.strip() == "REGISTER.")
register = []  # (name, tag, seite)
puffer = ""
for z in zeilen[reg_start:]:
    z = z.strip()
    if not z or z.startswith("Digit") or z == "Register." or re.fullmatch(r"[A-ZÄÖÜ]\.", z):
        puffer = ""
        continue
    z = puffer + " " + z if puffer else z
    m = re.match(r"^(.+?)\s*\(([^)]*)\)?\s*([0-9OQSIl.,: ]{1,6})?\.?\s*$", z)
    if m and m.group(3):
        num = m.group(3).replace("O", "0").replace("Q", "0").replace("S", "5").replace("I", "1").replace("l", "1")
        num = re.sub(r"[^0-9]", "", num)
        if num:
            register.append((m.group(1).strip(), m.group(2).strip(), int(num)))
        puffer = ""
    elif "(" in z and ")" not in z:
        puffer = z
    else:
        puffer = ""

# ---------------------------------------------------------------- Seiten und Einträge
text_ende = reg_start
gestalt_re = re.compile(r"^G\S{4,6}\s+[0-9OoSß]{2,3}\s*[:;]")
kopf_re = re.compile(r"^(\S{1,5})[.,»]\s+\S")
# Seitenzahlen: längste Kette plausibler Zahlenzeilen (Schritt 1..8)
kand = [(i, int(z.strip())) for i, z in enumerate(zeilen[:text_ende]) if re.fullmatch(r"\d{1,3}", z.strip())]
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
seite = 0
seiten = []
for i in range(text_ende):
    if i in kette:
        seite = kette[i]
    seiten.append(seite)

def ist_gestalt(s):
    w = s.split(" ")[0] if s else ""
    return (bool(w) and w[0] == "G" and difflib.SequenceMatcher(None, w, "Gestalt").ratio() >= 0.5
            and w not in ("Geruch", "Grunde", "Gelber", "Gestreifter", "Grosser", "Grüner")
            and re.search(r"[:;]", s[:22]) is not None)
anker = [i for i in range(text_ende) if ist_gestalt(zeilen[i].strip()) and seiten[i] > 0]

def kopf_suchen(i_gestalt, untergrenze):
    """Kopfzeile (Nummer, Name, Wert, Zeitigung) oberhalb der Gestalt-Zeile suchen."""
    for j in range(i_gestalt - 1, max(untergrenze, i_gestalt - 14), -1):
        s = zeilen[j].strip()
        if not s or s.startswith("Digit"):
            continue
        if kopf_re.match(s) and "(" in s and not s.startswith(("Illustr", "lllustr", "Diel", "Monats")):
            return j
    # Fallback: erste nichtleere Zeile nach Seitenkopf
    return None

eintraege = []
vorher_ende = 0
for k, ia in enumerate(anker):
    ik = kopf_suchen(ia, vorher_ende)
    start = ik if ik is not None else max(vorher_ende, ia - 6)
    ende = anker[k + 1] if k + 1 < len(anker) else text_ende
    eintraege.append({"start": start, "gestalt": ia, "ende": ende, "kopf_gefunden": ik is not None})
    vorher_ende = ia + 1
# Ende jedes Eintrags = Beginn des nächsten Kopfes
for k in range(len(eintraege) - 1):
    eintraege[k]["ende"] = eintraege[k + 1]["start"]

def rauschen(z):
    s = z.strip()
    return (s.startswith("Digit") or re.fullmatch(r"\d{1,3}", s) is not None
            or re.fullmatch(r"[IVXL]+\s*,.*", s) is not None and len(s) < 25)

feld_re = [
    ("kelchhoehle", re.compile(r"^K\S{0,3}lch\s*h\S{1,3}hle")),
    ("kernhaus", re.compile(r"^K\S{1,2}rnh\S{1,3}s")),
    ("kelch", re.compile(r"^K\S{0,3}lch\b")),
    ("stiel", re.compile(r"^St\S{1,2}el\b")),
    ("schale", re.compile(r"^Sch\S{1,2}l\S\b")),
    ("fleisch", re.compile(r"^F\S{0,2}eisch\b")),
    ("einsender", re.compile(r"^Die\s+Fr\S{1,3}chte\s+erh")),
    ("gestalt", re.compile(r"^G\S{2,7}\s*\S{0,4}\s*[:;]")),
]

def roman_kopf_bereinigen(lines):
    return [l for l in lines if l.strip() and not rauschen(l)]

register_nach_seite = {}
for name, tag, s in register:
    register_nach_seite.setdefault(s, []).append((name, tag))

def norm(s):
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c)).lower()
    return re.sub(r"[^a-z]", "", s)

ergebnis = []
nr_erwartet = 1
for e in eintraege:
    roh = zeilen[e["start"]:e["ende"]]
    s_start = seiten[e["start"]]
    s_ende = seiten[min(e["ende"], text_ende - 1)]
    felder = {"kopf": []}
    akt = "kopf"
    for z in roh:
        if rauschen(z):
            continue
        s = z.strip()
        if not s:
            continue
        neu = None
        for name, rx in feld_re:
            if rx.match(s):
                neu = name
                break
        if neu and (neu not in felder or neu == "kelch" and "kelch" in felder and akt == "kernhaus"):
            akt = neu
            felder.setdefault(akt, [])
        elif neu == "kelchhoehle" and "kelchhoehle" not in felder:
            akt = neu
            felder.setdefault(akt, [])
        felder.setdefault(akt, []).append(s)
    def zus(t):
        t = " ".join(t)
        t = re.sub(r"(\w)- (\w)", r"\1\2", t)
        return re.sub(r"\s+", " ", t).strip()
    felder = {k: zus(v) for k, v in felder.items()}
    kopfzeile = felder.get("kopf", "")
    m = re.search(r"(?:^|\s)(\d{1,3})[.,]\s+[A-ZÄÖÜa-zäöü]", kopfzeile[:120])
    nr = int(m.group(1)) if m else None
    if nr is None or not (nr_erwartet <= nr <= nr_erwartet + 4):
        nr_geschaetzt = nr_erwartet
        nr_sicher = False
    else:
        nr_geschaetzt = nr
        nr_sicher = True
    nr_erwartet = nr_geschaetzt + 1
    # Name über Register auflösen
    kandidaten = []
    for s in {s_start, seiten[e["gestalt"]]}:
        kandidaten += [(n, t, s) for n, t in register_nach_seite.get(s, [])]
    kopfname = re.sub(r"^\S{1,5}[.,»]\s+", "", kopfzeile.split("(")[0])
    best, bestwert = None, 0
    for n, t, s in kandidaten:
        w = difflib.SequenceMatcher(None, norm(n), norm(kopfname)).ratio()
        if t.lower().startswith(("ill", "lll", "iii", "eng", "luc", "lieb", "bent")):
            w += 0.15
        if w > bestwert:
            best, bestwert = (n, t, s), w
    ergebnis.append({
        "nr": nr_geschaetzt, "nr_sicher": nr_sicher,
        "seite": seiten[e["gestalt"]], "seite_bis": s_ende,
        "kopf_ocr": kopfzeile[:400],
        "name_register": best[0] if best else None, "register_tag": best[1] if best else None,
        "name_aehnlichkeit": round(bestwert, 2),
        "register_seite": [(n, t) for n, t, s in kandidaten],
        "felder": {k: v for k, v in felder.items() if k != "kopf"},
        "zeilen": [e["start"] + 1, e["ende"]],
    })

json.dump(ergebnis, open(ziel, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(ergebnis), "Einträge;", sum(1 for x in ergebnis if x["nr_sicher"]), "Nummer sicher;",
      sum(1 for x in ergebnis if x["name_aehnlichkeit"] > 0.6), "Name > 0.6;", len(register), "Registerzeilen")
for f in ["gestalt", "kelch", "stiel", "schale", "kernhaus", "kelchhoehle", "fleisch", "einsender"]:
    print(f, sum(1 for x in ergebnis if f in x["felder"]))
