# Baut Arbeitsstapel (Dossiers) für die Bearbeitung durch Unteragenten.
# Aufruf: python3 -I stapel_bauen.py <daten-ordner> <stapelgröße>
import json, os, re, sys, difflib
D = sys.argv[1]
GROESSE = int(sys.argv[2])
sys.path.insert(0, os.path.join(D, "skripte", "de"))
from namen import norm, slug

A = os.path.join(D, "de", "arbeit")
wiki = json.load(open(os.path.join(D, "roh/de/wikipedia/artikel.json"), encoding="utf-8"))
lang = json.load(open(os.path.join(D, "roh/de/wikipedia/langlinks.json"), encoding="utf-8"))
eng = json.load(open(os.path.join(A, "engelbrecht2.json"), encoding="utf-8"))
luc = []
for f in ("lucas_bd1.json", "lucas_bd4.json", "lauche_erg.json"):
    luc += json.load(open(os.path.join(A, f), encoding="utf-8"))

def klartext(wt):
    t = wt
    t = re.sub(r"<!--.*?-->", "", t, flags=re.S)
    # Infobox in Zeilen
    m = re.search(r"\{\{Infobox Apfelsorte(.*?)\n\}\}", t, flags=re.S)
    info = ""
    if m:
        felder = re.findall(r"\|\s*([^=\n|]+?)\s*=\s*([^\n]*)", m.group(1))
        info = "INFOBOX: " + "; ".join(f"{k.strip()}: {v.strip()}" for k, v in felder if v.strip())
        t = t.replace(m.group(0), "")
    t = re.sub(r"<ref[^>/]*/>", "", t)
    t = re.sub(r"<ref[^>]*>(.*?)</ref>", lambda x: " [Ref: " + x.group(1)[:300] + "]", t, flags=re.S)
    t = re.sub(r"\[\[(?:Datei|File|Bild):[^\[\]]*(?:\[\[[^\]]*\]\][^\[\]]*)*\]\]", "", t)
    t = re.sub(r"\[\[Kategorie:[^\]]*\]\]", "", t)
    for _ in range(3):
        t = re.sub(r"\{\{(?:[^{}]|\{[^{}]*\})*\}\}", lambda x: (" {" + x.group(0)[2:-2][:200] + "} ") if re.match(r"\{\{(Internetquelle|Literatur|cite|Webarchiv|Google Buch)", x.group(0), re.I) else "", t)
    t = re.sub(r"\[\[[^\]|]*\|([^\]]*)\]\]", r"\1", t)
    t = re.sub(r"\[\[([^\]]*)\]\]", r"\1", t)
    t = re.sub(r"\[(https?://\S+) ([^\]]*)\]", r"\2 (\1)", t)
    t = re.sub(r"'''?", "", t)
    t = re.sub(r"<[^>]+>", "", t)
    t = re.sub(r"&nbsp;", " ", t)
    t = re.sub(r"\n{3,}", "\n\n", t)
    return (info + "\n" + t).strip()

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

def vorschlaege(namen):
    nn = [norm(n) for n in namen if norm(n)]
    res = []
    for e in eng:
        w = max(difflib.SequenceMatcher(None, a, norm(e["name_ocr"])).ratio() for a in nn)
        res.append((w, f"E:{e['nr']}", f"S.{e['seite']} {e['name_ocr'][:50]}"))
    for e in luc:
        kopf = norm(e["kopf_ocr"].split(".")[0]); zweit = norm(e["text"][len(e["kopf_ocr"]):][:150].split(".")[0])
        w = max(max(difflib.SequenceMatcher(None, a, kopf).ratio(), difflib.SequenceMatcher(None, a, zweit).ratio()) for a in nn)
        res.append((w, f"L:{e['band']}:{e['nr']}", f"S.{e['seite']} {e['kopf_ocr'][:50]}"))
    res.sort(key=lambda x: -x[0])
    return [f"{w:.2f} {c} {b}" for w, c, b in res[:6]]

wl = [l.strip() for l in open(os.path.join(A, "auswahl_wiki.txt"), encoding="utf-8") if l.strip()]
zl = [l.strip() for l in open(os.path.join(A, "auswahl_zusatz.txt"), encoding="utf-8") if l.strip()]
eintraege = []
for t in wl:
    w = wiki[t]
    namen = wiki_namen(t)
    eintraege.append({
        "arbeitsname": re.sub(r"\s*\((Apfel|Apfelsorte)\)", "", t),
        "vorschlag_id": slug(re.sub(r"\s*\((Apfel|Apfelsorte)\)", "", t)),
        "wikipedia": {"titel": t, "url": f"https://de.wikipedia.org/w/index.php?title={t.replace(' ', '_')}&oldid={w['revid']}",
                      "revid": w["revid"], "wikidata": w.get("wikibase"), "sprachversionen": lang.get(t, {}),
                      "text": klartext(w["text"])},
        "namen_aus_wikipedia": namen,
        "kandidaten_historisch": vorschlaege(namen),
    })
for n in zl:
    eintraege.append({"arbeitsname": n, "vorschlag_id": None, "wikipedia": None, "namen_aus_wikipedia": [],
                      "kandidaten_historisch": vorschlaege([n])})

# mischen: abwechselnd Wikipedia- und Zusatzsorten, damit die Stapel ähnlich aufwendig sind
w_e = eintraege[:len(wl)]; z_e = eintraege[len(wl):]
gemischt = []
i = j = 0
verh = len(w_e) / max(1, len(z_e))
while i < len(w_e) or j < len(z_e):
    if j >= len(z_e) or (i < len(w_e) and i <= j * verh):
        gemischt.append(w_e[i]); i += 1
    else:
        gemischt.append(z_e[j]); j += 1
os.makedirs(os.path.join(A, "stapel"), exist_ok=True)
n = 0
for k in range(0, len(gemischt), GROESSE):
    n += 1
    json.dump(gemischt[k:k + GROESSE], open(os.path.join(A, "stapel", f"stapel_{n:02d}.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(len(gemischt), "Sorten in", n, "Stapeln")
