# Nachtrag nach Katalog-Erweiterung (22.10.2026): Juni-Codes, Kernhausform „flachrund“,
# Blütezeit mittelfrüh/mittelspät, Kernhaus- und Kernfachmaße in mm.
# Liest sorten_de.json, ergänzt Werte mit Beleg aus den gespeicherten Originalangaben bzw. den
# zerlegten Quelltexten und schreibt die Datei zurück. Wird von zusammenfuehren.py aufgerufen.
# Aufruf einzeln: python3 -I nachtrag_katalog.py <daten-ordner>
import json, os, re, sys, collections

def lade(D):
    A = os.path.join(D, "de", "arbeit")
    eng = json.load(open(os.path.join(A, "engelbrecht2.json"), encoding="utf-8"))
    luc = {}
    for f, b in (("lucas_bd1.json", "I"), ("lucas_bd4.json", "IV"), ("lauche_erg.json", "E1")):
        luc[b] = json.load(open(os.path.join(A, f), encoding="utf-8"))
    wiki = json.load(open(os.path.join(D, "roh", "de", "wikipedia", "artikel.json"), encoding="utf-8"))
    return eng, luc, wiki

def zahl(s):
    return float(s.replace(",", "."))

def mitte(a, b=None):
    v = zahl(a) if b is None else (zahl(a) + zahl(b)) / 2
    return round(v * 2) / 2

KH = re.compile(r"Kernhaus\s+(\d{2})\s*[:;]\s*(\d{2})(?:\s*[—–-]\s*(\d{2}))?")
KA = re.compile(r"Kamm\w{2,4}\s+(?:etwas\s+\w+,\s*)?(\d{1,2})(?:\s*[—–-]\s*(\d{1,2}))?\s*[:;]\s*,?\s*(\d{1,2})(?:\s*[—–-]\s*(\d{1,2}))?")

def masse(text):
    """(kh_b, kh_h, ka_b, ka_h, wortlaut_kh, wortlaut_ka) aus einem Engelbrecht-Kernhausfeld"""
    r = [None] * 6
    m = KH.search(text or "")
    if m:
        r[0], r[1] = mitte(m.group(1)), mitte(m.group(2), m.group(3)) if m.group(3) else mitte(m.group(2))
        r[4] = m.group(0)
    m = KA.search(text or "")
    if m:
        r[2] = mitte(m.group(1), m.group(2)) if m.group(2) else mitte(m.group(1))
        r[3] = mitte(m.group(3), m.group(4)) if m.group(4) else mitte(m.group(3))
        r[5] = m.group(0)
    return r

def plausibel(kb, kh, fb, fh):
    ok_k = kb is not None and 15 <= kb <= 70 and 12 <= kh <= 70
    ok_f = fb is not None and 4 <= fb <= 25 and 8 <= fh <= 40
    return ok_k, ok_f

def nachtrag(D, sorten):
    eng, luc, wiki = lade(D)
    eng_nr = collections.defaultdict(list)
    for e in eng:
        eng_nr[e["nr"]].append(e)
    zaehl = collections.Counter()
    beispiele = collections.defaultdict(list)

    def neu(s, wert):
        s["merkmale"].append(wert)
        zaehl[wert["merkmal"]] += 1
        if len(beispiele[wert["merkmal"]]) < 3:
            beispiele[wert["merkmal"]].append(f"{s['name']}: {wert['wert']} ← {wert['original'][:60]}")

    for s in sorten:
        vorhanden = collections.defaultdict(set)
        for m in s["merkmale"]:
            vorhanden[(m["merkmal"], m["quelle"])].add(str(m["wert"]))
        # ---------------- Engelbrecht-Beleg der Sorte
        e_belege = [m for m in s["merkmale"] if m["quelle"] == "engelbrecht1889"]
        e_seite, e_nr = None, None
        if e_belege:
            sz = collections.Counter(m.get("seite", "") for m in e_belege).most_common(1)[0][0]
            e_seite = sz
            mm = re.search(r"Nr\.\s*(\d+)", sz)
            e_nr = int(mm.group(1)) if mm else None
        e_beleg = {"quelle": "engelbrecht1889", "seite": e_seite} if e_seite else None
        # Eintrag finden: Nummer + Seite passend; sonst Eintrag auf derselben Seite
        eintrag = None
        if e_seite:
            sp = int(re.match(r"\s*(\d+)", e_seite).group(1))
            kand = [e for e in eng_nr.get(e_nr, []) if e["seite"] and abs(e["seite"] - sp) <= 1]
            if not kand:
                kand = [e for e in eng if e["seite"] == sp]
            eintrag = kand[0] if len(kand) == 1 else None

        # ---------------- 1. Kernhaus- und Kernfachmaße (Engelbrecht)
        if e_beleg:
            orig = " ".join(m.get("original", "") for m in e_belege)
            kb, kh, fb, fh, wk, wf = masse(orig)
            herkunft_k = herkunft_f = "original"
            if eintrag and (kb is None or fb is None):
                a = masse(eintrag["felder"].get("kernhaus", ""))
                b = masse((eintrag.get("ia_ocr") or {}).get("felder", {}).get("kernhaus", ""))
                if kb is None and a[0] is not None and a[0:2] == b[0:2]:
                    kb, kh, wk, herkunft_k = a[0], a[1], a[4], "ocr"
                if fb is None and a[2] is not None and a[2:4] == b[2:4]:
                    fb, fh, wf, herkunft_f = a[2], a[3], a[5], "ocr"
            ok_k, ok_f = plausibel(kb, kh, fb, fh)
            if ok_k and not vorhanden[("kernhaus_breite_mm", "engelbrecht1889")]:
                neu(s, {"merkmal": "kernhaus_breite_mm", "wert": kb, "original": wk, **e_beleg})
                neu(s, {"merkmal": "kernhaus_hoehe_mm", "wert": kh, "original": wk, **e_beleg})
            if ok_f and not vorhanden[("kernfach_breite_mm", "engelbrecht1889")]:
                neu(s, {"merkmal": "kernfach_breite_mm", "wert": fb, "original": wf, **e_beleg})
                neu(s, {"merkmal": "kernfach_hoehe_mm", "wert": fh, "original": wf, **e_beleg})

        # ---------------- 2. Kernhausform „flachrund“ (Engelbrecht)
        if eintrag and e_beleg:
            texte = [eintrag["felder"].get("kernhaus", ""), (eintrag.get("ia_ocr") or {}).get("felder", {}).get("kernhaus", "")]
            treffer = None
            for t in texte:
                m = re.search(r"Kernhaus\s+[\d:;—–\-\s()]+,?\s*([^.]*?(?:\.|$))", t or "")
                if not m:
                    continue
                form = m.group(1)[:60]
                # flachrund als Grundwort: nicht unmittelbar gefolgt von ei-/zwiebel-/herzförmig
                if re.search(r"flach\s*r", form) and (re.search(r"mehr\s+flach\s*r\w*\.?\s+als", form)
                        or not re.search(r"flach\s*r\w*\.?,?\s*([zZ]w|[eE]i|[hH]erz|[kK]ugel)", form)):
                    treffer = form.strip(" .,")
                    for a, b in (("his ", "bis "), ("zwiehel", "zwiebel"), ("zwlebcl", "zwiebel"), ("zwichel", "zwiebel"), ("Hachr", "flachr")):
                        treffer = treffer.replace(a, b)
                    break
            # beide OCR-Fassungen müssen „flachrund“ zeigen (Lesefehler vermeiden)
            if not (treffer and all(re.search(r"flach\s*r", t or "") for t in texte if t)):
                treffer = None
            # oder: Wortlaut der vom Bearbeiter (am Scan) gelesenen Kernhausform
            for m in e_belege:
                if treffer or m["merkmal"] != "kernhaus_form":
                    continue
                o = m.get("original", "")
                if re.search(r"(bis|oder|zuweilen)\s+(sehr\s+)?flachrund\b(?!\s*(zw|ei|herz))", o) or \
                   re.search(r"(^|[,.]\s*|Kernhaus\s+[\d:]+,?\s*)(sehr\s+|mehr\s+)?flachr\w*\.?\s*(bis|als|,|$)", o):
                    treffer = re.sub(r"^Kernhaus\s+[\d:;—–\s-]+,?\s*", "", o).strip(" .,")
            if treffer:
                if "flachrund" not in vorhanden[("kernhaus_form", "engelbrecht1889")] and len(vorhanden[("kernhaus_form", "engelbrecht1889")]) < 2:
                    neu(s, {"merkmal": "kernhaus_form", "wert": "flachrund", "original": ("Kernhaus " + treffer) if not treffer.startswith("Kernhaus") else treffer, **e_beleg})

        # ---------------- 3. Genussreife bis Juni (Engelbrecht-Kopf, beide OCR-Fassungen)
        if eintrag and e_beleg and not vorhanden[("genussreife_ende", "engelbrecht1889")]:
            k1 = eintrag["kopf"][:160]
            k2 = (eintrag.get("ia_ocr") or {}).get("kopf", "")[:160]
            m1 = re.search(r"bis\s+(?:Anf\.\s+|Ende\s+|Mitte\s+)?Juni\b", k1) or re.search(r"bis\s+(?:Anf\.\s+|Ende\s+|Mitte\s+)?Juni\b", k2)
            ocr_beide = bool(re.search(r"Juni\b", k1) and re.search(r"Juni\b", k2))
            textbeleg = any(re.search(r"Engelbrecht[^.]{0,80}?bis\s+(?:Anfang\s+|Ende\s+|Mitte\s+)?Juni\b", t["text"]) for t in s["texte"])
            if m1 and (ocr_beide or textbeleg) and not re.search(r"Juli\b", k1 + k2):
                k1 = k1 if re.search(r"Juni\b", k1) else k2
                m3 = re.search(r"((?:Anf\.|Anfang|Ende|Mitte)\s+)?[A-ZÄÖÜ][a-zäöü]{2,8}\.?\s+bis\s+(?:Anf\.\s+|Ende\s+|Mitte\s+)?Juni", k1)
                neu(s, {"merkmal": "genussreife_ende", "wert": "6", "original": "Zeitigung: " + (m3.group(0) if m3 else "… bis Juni"), **e_beleg})

        if e_beleg and not vorhanden[("genussreife_ende", "engelbrecht1889")] and \
                not any(m["merkmal"] == "genussreife_ende" and m["quelle"] == "engelbrecht1889" for m in s["merkmale"]):
            for t in s["texte"]:
                mm = re.search(r"Engelbrecht[^.]{0,80}?((?:Anfang\s+|Ende\s+|Mitte\s+)?\w+\s+bis\s+(?:Anfang\s+|Ende\s+|Mitte\s+)?Juni)\b", t["text"])
                if mm:
                    neu(s, {"merkmal": "genussreife_ende", "wert": "6", "original": "Zeitigung (Kopfzeile, am Scan gelesen): " + mm.group(1), **e_beleg})
                    break
        # ---------------- 4. Handbuch / Lauche: „bis Juni“, „bis Johannis“; Blütezeit
        hb = {}
        for m in s["merkmale"] + [b for t in s["texte"] for b in t["belege"]]:
            q = m.get("quelle")
            if q in ("illustr_hb_1", "illustr_hb_4", "lauche_erg1883") and m.get("seite"):
                band = {"illustr_hb_1": "I", "illustr_hb_4": "IV", "lauche_erg1883": "E1"}[q]
                sp = re.match(r"\s*(\d+)", m["seite"])
                if sp:
                    hb.setdefault((q, band), set()).add(int(sp.group(1)))
        for (q, band), seiten in hb.items():
            s0 = min(seiten)
            kand = [e for e in luc[band] if e["seite"] == s0] or \
                   [e for e in luc[band] if e["seite"] is not None and e["seite"] <= s0 <= (e["seite_bis"] or e["seite"])]
            if len(kand) != 1:
                continue
            tx = kand[0]["text"]
            # Text kann die Folgesorte enthalten: nur bis zum nächsten "Heimath"/"Vorkommen" nach dem ersten
            beleg = {"quelle": q, "seite": str(s0)}
            if band in ("I", "IV"):
                beleg["band"] = band
            if not vorhanden[("genussreife_ende", q)]:
                mm = re.search(r"(?:h[äa]lt\s+[sſ]ich|dauert|haltbar|h[äa]lt|Reif\w*\s+und\s+Nu\w*)[^.]{0,80}?(?:bis|gegen)\s+(?:in\s+den\s+|gegen\s+|Ende\s+|Mitte\s+|Anfang\s+)?(Juni|Johanni[s]?)\b", tx)
                if mm:
                    neu(s, {"merkmal": "genussreife_ende", "wert": "6", "original": mm.group(0)[:120], **beleg})
            if not vorhanden[("bluete_zeit", q)]:
                mm = re.search(r"Blüt?h?e?\w*[^.]{0,40}?(mittelfrüh|mittelspät)", tx)
                if mm:
                    neu(s, {"merkmal": "bluete_zeit", "wert": "4" if mm.group(1) == "mittelfrüh" else "6", "original": mm.group(0)[:120], **beleg})

        # ---------------- 5. Wikipedia: Blütezeit mittelfrüh/mittelspät, Lagerung bis Juni
        urls = {b["url"] for t in s["texte"] for b in t["belege"] if b.get("quelle") == "wikipedia_de" and b.get("url")}
        url_haeufig = collections.Counter(b["url"] for t in s["texte"] for b in t["belege"] if b.get("quelle") == "wikipedia_de" and b.get("url"))
        for u in [u for u, _ in url_haeufig.most_common(1)]:
            titel = re.search(r"title=([^&]+)&oldid", u).group(1).replace("_", " ")
            if titel not in wiki:
                continue
            tx = re.sub(r"<ref[^>]*>.*?</ref>|<ref[^>]*/>", "", wiki[titel]["text"], flags=re.S)
            tx = re.sub(r"\[\[(?:[^\]|]*\|)?([^\]]*)\]\]", r"\1", tx)
            beleg = {"quelle": "wikipedia_de", "url": u}
            if not vorhanden[("bluete_zeit", "wikipedia_de")]:
                mm = re.search(r"[^.\n]{0,60}(?:Blüte|blüht|Blütezeit)[^.\n]{0,60}?(mittelfrüh|mittelspät|mittelfrühe|mittelspäte)[^.\n]{0,20}", tx) or \
                     re.search(r"(mittelfrüh|mittelspät)\w*[^.\n]{0,30}(?:Blüte|blühend)", tx)
                if mm:
                    w = "4" if "mittelfrüh" in mm.group(0) else "6"
                    neu(s, {"merkmal": "bluete_zeit", "wert": w, "original": mm.group(0).strip()[:120], **beleg})
            if not vorhanden[("genussreife_ende", "wikipedia_de")]:
                mm = re.search(r"[^.\n]{0,80}(?:lager|haltbar|genussreif|halten|hält)[^.\n]{0,80}?\bbis\b[^.\n]{0,25}?\bJuni\b[^.\n]{0,10}", tx, flags=re.I) or \
                     re.search(r"[^.\n]{0,60}\bbis\s+(?:in\s+den\s+)?Juni\s+(?:haltbar|lagerfähig|genussreif)[^.\n]{0,10}", tx, flags=re.I)
                if mm:
                    o = mm.group(0).strip()
                    j = o.find("Juni")
                    neu(s, {"merkmal": "genussreife_ende", "wert": "6", "original": o[max(0, j - 100):j + 20].strip(), **beleg})
    return zaehl, beispiele

if __name__ == "__main__":
    D = sys.argv[1]
    pfad = os.path.join(D, "de", "sorten_de.json")
    sorten = json.load(open(pfad, encoding="utf-8"))
    z, b = nachtrag(D, sorten)
    json.dump(sorten, open(pfad, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(dict(z))
    for k, v in b.items():
        print(k, v)
