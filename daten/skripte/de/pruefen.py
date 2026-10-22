# Prüft Sortendateien gegen Merkmalskatalog und Quellenliste.
# Aufruf: python3 -I pruefen.py <katalog.json> <quellen.json> <sorten.json> [weitere_quellen.json ...] [--statistik]
# Fehler (E) verhindern die Übernahme, Warnungen (W) sind zu prüfen.
import json, re, sys, collections

args = [a for a in sys.argv[1:] if not a.startswith("--")]
statistik = "--statistik" in sys.argv
katalog = {m["id"]: m for m in json.load(open(args[0], encoding="utf-8"))}
quellen = {}
for qd in [args[1]] + args[3:]:
    for q in json.load(open(qd, encoding="utf-8")):
        quellen[q["id"]] = q
sorten = json.load(open(args[2], encoding="utf-8"))

THEMEN = {"ueberblick", "herkunft", "frucht", "schale", "schnitt", "fleisch_geschmack", "reife_lagerung", "baum", "verwendung", "unterscheidung"}
BILDARTEN = {"frucht", "schnitt", "baum", "bluete", "tafel"}
SCHNITT = ["kelchhoehle_form", "kernhaus_form", "kernhaus_lage", "kernhaus_achse", "kernfaecher_oeffnung", "kernfaecher_form", "kerne_form", "kerne_anzahl"]
fehler, warn = [], []

def beleg_ok(b, wo):
    if not isinstance(b, dict) or "quelle" not in b:
        fehler.append(f"{wo}: Beleg ohne quelle"); return
    if b["quelle"] not in quellen:
        fehler.append(f"{wo}: unbekannte Quelle {b['quelle']!r}")
    for k in b:
        if k not in ("quelle", "band", "seite", "url"):
            fehler.append(f"{wo}: unbekanntes Belegfeld {k!r}")
    if b["quelle"] == "wikipedia_de" and "oldid=" not in (b.get("url") or ""):
        warn.append(f"{wo}: Wikipedia-Beleg ohne oldid-URL")

ids = collections.Counter()
for s in sorten:
    sid = s.get("id", "?")
    ids[sid] += 1
    if not re.fullmatch(r"[a-z0-9]+(-[a-z0-9]+)*", sid):
        fehler.append(f"{sid}: id nicht im Format kleinbuchstaben-mit-bindestrich")
    for feld in ("id", "name", "synonyme", "merkmale", "texte", "bilder"):
        if feld not in s:
            fehler.append(f"{sid}: Feld {feld} fehlt")
    for k in s:
        if k not in ("id", "name", "synonyme", "munq", "akzessionen", "herkunft", "merkmale", "texte", "bilder", "farbmessung"):
            fehler.append(f"{sid}: unbekanntes Feld {k!r}")
    for syn in s.get("synonyme", []):
        if not isinstance(syn, dict) or not syn.get("name"):
            fehler.append(f"{sid}: Synonym ohne name"); continue
        if "beleg" in syn:
            beleg_ok(syn["beleg"], f"{sid}/Synonym {syn['name']}")
        else:
            warn.append(f"{sid}: Synonym {syn['name']!r} ohne Beleg")
    if s.get("herkunft"):
        if not s["herkunft"].get("belege"):
            fehler.append(f"{sid}: herkunft ohne Belege")
        for b in s["herkunft"].get("belege", []):
            beleg_ok(b, f"{sid}/herkunft")
    zaehl = collections.Counter()
    for m in s.get("merkmale", []):
        mid = m.get("merkmal")
        wo = f"{sid}/{mid}"
        if mid not in katalog:
            fehler.append(f"{wo}: Merkmal nicht im Katalog"); continue
        beleg_ok({k: v for k, v in m.items() if k in ("quelle", "band", "seite", "url")}, wo)
        for k in m:
            if k not in ("merkmal", "wert", "original", "quelle", "band", "seite", "url"):
                fehler.append(f"{wo}: unbekanntes Feld {k!r}")
        kat = katalog[mid]
        w = m.get("wert")
        if kat["typ"] in ("ordinal", "kategorie"):
            codes = {c for c, _ in kat["codes"]}
            if str(w) not in codes or not isinstance(w, str):
                fehler.append(f"{wo}: Wert {w!r} kein gültiger Code (als String) {sorted(codes)}")
        elif kat["typ"] in ("messwert", "anzahl"):
            if not isinstance(w, (int, float)):
                fehler.append(f"{wo}: Messwert {w!r} keine Zahl")
        elif kat["typ"] == "text":
            if not isinstance(w, str) or not w.strip():
                fehler.append(f"{wo}: Textwert leer")
        if not m.get("original"):
            warn.append(f"{wo}: original fehlt")
        zaehl[(mid, m.get("quelle"))] += 1
    for (mid, q), n in zaehl.items():
        if n > 2 and not katalog[mid]["mehrfach"]:
            warn.append(f"{sid}/{mid}: {n} Werte aus derselben Quelle {q}")
    themen = collections.Counter()
    for t in s.get("texte", []):
        wo = f"{sid}/text {t.get('thema')}"
        if t.get("thema") not in THEMEN:
            fehler.append(f"{wo}: unbekanntes Thema")
        if not t.get("text", "").strip():
            fehler.append(f"{wo}: leerer Text")
        if not t.get("belege"):
            fehler.append(f"{wo}: Text ohne Beleg")
        for b in t.get("belege", []):
            beleg_ok(b, wo)
        tx = t.get("text", "")
        if re.search(r"\bnicht nur\b", tx) or re.search(r"\bnicht\b[^.;:]{0,80},\s*sondern\b", tx):
            warn.append(f"{wo}: Formel 'nicht nur/nicht … sondern'")
        themen[t.get("thema")] += 1
    for b in s.get("bilder", []):
        for k in ("url", "seite", "art", "urheber", "lizenz", "quelle"):
            if not b.get(k):
                fehler.append(f"{sid}/bild: Feld {k} fehlt")
        if b.get("art") not in BILDARTEN:
            fehler.append(f"{sid}/bild: art {b.get('art')!r} ungültig")
        if b.get("quelle") and b["quelle"] not in quellen:
            fehler.append(f"{sid}/bild: unbekannte Quelle {b['quelle']!r}")
for i, n in ids.items():
    if n > 1:
        fehler.append(f"id {i} {n}-mal vergeben")

for f in fehler:
    print("E", f)
for w in warn:
    print("W", w)
print(f"\n{len(sorten)} Sorten, {len(fehler)} Fehler, {len(warn)} Warnungen")

if statistik:
    abdeckung = collections.Counter()
    for s in sorten:
        for mid in {m["merkmal"] for m in s.get("merkmale", [])}:
            abdeckung[mid] += 1
    mit_schnitt = sum(1 for s in sorten if any(m["merkmal"] in SCHNITT for m in s.get("merkmale", [])))
    mit3 = sum(1 for s in sorten if len({m["merkmal"] for m in s.get("merkmale", []) if m["merkmal"] in SCHNITT}) >= 3)
    print(f"Sorten mit mindestens einem Schnittmerkmal: {mit_schnitt}; mit mindestens drei: {mit3}")
    print("Abdeckung je Merkmal (Sorten mit mindestens einem Wert):")
    for mid in katalog:
        print(f"  {mid:30} {abdeckung[mid]:4}")
    th = collections.Counter(t["thema"] for s in sorten for t in s.get("texte", []))
    print("Texte je Thema:", dict(th))
    qn = collections.Counter()
    for s in sorten:
        for q in {m["quelle"] for m in s.get("merkmale", [])} | {b["quelle"] for t in s.get("texte", []) for b in t.get("belege", [])}:
            qn[q] += 1
    print("Sorten je Quelle:", dict(qn.most_common()))
sys.exit(1 if fehler else 0)
