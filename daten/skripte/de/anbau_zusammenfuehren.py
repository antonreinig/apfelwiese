"""Führt die Arbeitsstände der Anbaumerkmale zusammen und prüft sie.

Aufruf aus dem Hauptordner:
    python3 -I daten/skripte/de/anbau_zusammenfuehren.py daten

Eingang:  daten/de/arbeit/anbau_teil*.json (Format: daten/de/arbeit/anbau-anleitung.md)
          daten/de/arbeit/selten_nachtrag.json (von Hand ausgewählte Seltenheitsangaben aus Überblickstexten)
Ausgang:  daten/de/anbau.json (nur geprüfte Einträge; Verworfenes wird aufgelistet)

Geprüft wird: Sorte existiert in sorten_de.json, Merkmal und Code stehen in der Anleitung,
der Ausschnitt `original` steht wörtlich im Text des genannten Themas, Regionscodes sind gültig.
"""
import json
import sys
from pathlib import Path

CODES = {
    "verwendung": {"tafel", "kueche", "most", "brennen", "doerren"},
    "baum_wuchs": {"3", "5", "7"},
    "ploidie": {"diploid", "triploid"},
    "ertrag_beginn": {"frueh", "mittel", "spaet"},
    "ertrag_alternanz": {"regelmaessig", "alternierend"},
    "gesundheit": {"3", "5", "7"},
    "anfaelligkeit_schorf": {"3", "5", "7"},
    "anfaelligkeit_mehltau": {"3", "5", "7"},
    "anfaelligkeit_krebs": {"3", "5", "7"},
    "bluete_frost": {"3", "7"},
    "standort_klima": {"3", "5", "7"},
    "standort_boden": {"3", "5", "7"},
    "standort_feuchte": {"trocken", "feucht"},
    "hochstamm": {"gut", "eingeschraenkt"},
    "lagerfaehigkeit": {"3", "5", "7"},
}
REGIONEN = {f"DE-{x}" for x in "BW BY BE BB HB HH HE MV NI NW RP SL SN ST SH TH".split()}


def main(daten: Path) -> None:
    sorten = {s["id"]: s for s in json.loads((daten / "de/sorten_de.json").read_text())}
    ergebnis, verworfen = [], []
    for teil in sorted((daten / "de/arbeit").glob("anbau_teil*.json")):
        for e in json.loads(teil.read_text()):
            s = sorten.get(e.get("id"))
            if not s:
                verworfen.append(f"{e.get('id')}: unbekannte Sorte")
                continue
            texte = {}
            for t in s["texte"]:
                texte.setdefault(t["thema"], []).append(t["text"])
            herkunftstexte = [s.get("herkunft", {}).get("text", "")] + texte.get("herkunft", [])
            merkmale = []
            for w in e.get("merkmale", []):
                wert = str(w.get("wert"))
                if wert not in CODES.get(w.get("merkmal"), set()):
                    verworfen.append(f"{e['id']}: {w.get('merkmal')}={wert} nicht im Katalog")
                    continue
                if not any(w.get("original", "\0") in t for t in texte.get(w.get("thema"), [])):
                    verworfen.append(f"{e['id']}: Ausschnitt nicht in {w.get('thema')}: {w.get('original')}")
                    continue
                belege = {b["quelle"] for t in s["texte"] if t["thema"] == w["thema"] for b in t["belege"]}
                if w.get("quelle") and w["quelle"] not in belege:
                    del w["quelle"]
                merkmale.append({**w, "wert": wert})
            h = e.get("herkunft") or {}
            if h:
                h["regionen"] = [r for r in h.get("regionen", []) if r in REGIONEN]
                h["verbreitung"] = [v for v in h.get("verbreitung", []) if v.get("region") in REGIONEN and any(v.get("original", "\0") in t for t in herkunftstexte)]
                if h.get("selten") and not any(h["selten"].get("original", "\0") in t for t in herkunftstexte):
                    verworfen.append(f"{e['id']}: Seltenheit nicht im Herkunftstext")
                    del h["selten"]
                if h.get("jahr") is not None and not isinstance(h["jahr"], int):
                    del h["jahr"]
            if merkmale or h:
                ergebnis.append({"id": e["id"], "merkmale": merkmale, **({"herkunft": h} if h else {})})
    # Nachtrag: Seltenheit aus Überblick oder Herkunft, wo die Auswertung keine gesetzt hat
    nachtrag = daten / "de/arbeit/selten_nachtrag.json"
    nach_id = {e["id"]: e for e in ergebnis}
    for n in json.loads(nachtrag.read_text()) if nachtrag.exists() else []:
        s = sorten.get(n["id"])
        if not s or not any(t["thema"] == n["thema"] and n["original"] in t["text"] for t in s["texte"]):
            verworfen.append(f"{n['id']}: Seltenheit nicht im Text {n['thema']}")
            continue
        e = nach_id.get(n["id"])
        if not e:
            e = {"id": n["id"], "merkmale": []}
            ergebnis.append(e)
            nach_id[n["id"]] = e
        h = e.setdefault("herkunft", {})
        if not h.get("selten"):
            h["selten"] = {"original": n["original"], "thema": n["thema"]}
    (daten / "de/anbau.json").write_text(json.dumps(ergebnis, ensure_ascii=False, indent=1))
    print(f"{len(ergebnis)} Sorten, {sum(len(e['merkmale']) for e in ergebnis)} Merkmalswerte geschrieben")
    for v in verworfen:
        print("  verworfen:", v)


if __name__ == "__main__":
    main(Path(sys.argv[1]))
