"""Kennzahlen für bericht.md: Sorten mit Bild je Quelle, Sorten mit Farbmessung je Quelle."""
import json
import os
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import commons as c  # noqa: E402

B = os.path.join(c.PROJEKT, "daten", "bilder")


def main():
    bilder = json.load(open(os.path.join(B, "bilder.json")))
    farb = json.load(open(os.path.join(B, "farbmessung.json"))) if os.path.exists(os.path.join(B, "farbmessung.json")) else {}
    sorten_je_quelle = defaultdict(set)
    bilder_je_quelle = defaultdict(int)
    art_je_quelle = defaultdict(lambda: defaultdict(int))
    for k, s in bilder.items():
        for b in s["bilder"]:
            sorten_je_quelle[b["quelle"]].add(k)
            bilder_je_quelle[b["quelle"]] += 1
            art_je_quelle[b["quelle"]][b["art"]] += 1
    print("Sorten mit Bild:", len(bilder), "Bildeinträge:", sum(bilder_je_quelle.values()))
    print("| Quelle | Sorten | Bildeinträge | Ansichten |")
    print("|---|---:|---:|---|")
    for q in sorted(sorten_je_quelle, key=lambda q: -len(sorten_je_quelle[q])):
        arten = ", ".join("%s %d" % (a, n) for a, n in sorted(art_je_quelle[q].items(), key=lambda x: -x[1]))
        print("| %s | %d | %d | %s |" % (q, len(sorten_je_quelle[q]), bilder_je_quelle[q], arten))
    # nur offene Fotos/Tafeln mit geprüfter Herkunft (ohne commons-fotos/-illustrationen)
    gepr = set()
    for q, ks in sorten_je_quelle.items():
        if q not in ("commons-fotos", "commons-illustrationen"):
            gepr |= ks
    print("Sorten mit Bild aus Sammlungen mit gesicherter Sortenzuordnung:", len(gepr))

    methode_q = {}
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    import messung_ausfuehren as ma
    for q, txt in ma.METHODE_KURZ.items():
        methode_q[txt] = q
    sorten_m = defaultdict(set)
    n_m = defaultdict(int)
    felder = defaultdict(lambda: defaultdict(int))
    for k, lst in farb.items():
        for f in lst:
            q = methode_q.get(f["methode"], "?")
            sorten_m[q].add(k)
            n_m[q] += 1
            for fe in ("grundfarbe", "deckfarbe", "rostfarbe", "fleischfarbe", "hoeheZuBreite"):
                if fe in f:
                    felder[q][fe] += 1
    print()
    print("Sorten mit Farbmessung:", len(farb), "Messungen:", sum(n_m.values()))
    print("| Quelle | Sorten | Messungen | Grundfarbe | Deckfarbe | Rost | Fleisch | Höhe/Breite |")
    print("|---|---:|---:|---:|---:|---:|---:|---:|")
    for q in sorted(sorten_m, key=lambda q: -len(sorten_m[q])):
        f = felder[q]
        print("| %s | %d | %d | %d | %d | %d | %d | %d |" % (q, len(sorten_m[q]), n_m[q], f["grundfarbe"], f["deckfarbe"],
                                                           f["rostfarbe"], f["fleischfarbe"], f["hoeheZuBreite"]))
    mit_hzb = sum(1 for lst in farb.values() if any("hoeheZuBreite" in f for f in lst))
    mit_fleisch = sum(1 for lst in farb.values() if any("fleischfarbe" in f for f in lst))
    print("Sorten mit Höhe/Breite:", mit_hzb, "mit Fleischfarbe:", mit_fleisch)


if __name__ == "__main__":
    main()
