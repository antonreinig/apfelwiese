# Rendert die Scan-Seite(n) eines Eintrags als PNG, damit unlesbare OCR-Stellen (Brüche, Zahlen,
# Namen) am Original nachgelesen werden können. Gibt die Bildpfade aus (mit dem Read-Tool ansehen).
#   python3 -I daten/skripte/de/seite_bild.py E:427        # Engelbrecht-Seite (mit Längsschnitt-Zeichnung)
#   python3 -I daten/skripte/de/seite_bild.py L:I:50       # alle Seiten des Handbuch-Eintrags (max. 4)
#   python3 -I daten/skripte/de/seite_bild.py E:427 --unten  # nur untere Seitenhälfte, höher aufgelöst
import json, os, re, subprocess, sys
HIER = os.path.dirname(os.path.abspath(__file__))
D = os.path.abspath(os.path.join(HIER, "..", ".."))
A = os.path.join(D, "de", "arbeit")
ROH = os.path.join(D, "roh", "de", "archive")
ZIEL = os.path.join(A, "seitenbilder")
os.makedirs(ZIEL, exist_ok=True)
PDF = {"E": "engelbrecht1889.pdf", "I": "10296123bsb.pdf", "IV": "bub_gb_Muw6AAAAcAAJ.pdf", "E1": "bub_gb_nr9BAAAAIAAJ.pdf"}
q = sys.argv[1]
unten = "--unten" in sys.argv
seiten = []
m = re.fullmatch(r"E:(\d+)", q)
if m:
    for e in json.load(open(os.path.join(A, "engelbrecht2.json"), encoding="utf-8")):
        if e["nr"] == int(m.group(1)):
            seiten = [("E", e["pdf_seite"]), ("E", e["pdf_seite"] + 1)]
            break
m = re.fullmatch(r"L:(I|IV|E1):(\d+)", q)
if m:
    datei = {"I": "lucas_bd1.json", "IV": "lucas_bd4.json", "E1": "lauche_erg.json"}[m.group(1)]
    for e in json.load(open(os.path.join(A, datei), encoding="utf-8")):
        if e["nr"] == int(m.group(2)):
            seiten = [(m.group(1), l + 1) for l in range(e["leaf"], min(e["leaf_bis"], e["leaf"] + 3) + 1)]
            break
if not seiten:
    print("Eintrag nicht gefunden"); sys.exit(1)
for werk, p in seiten:
    name = f"{werk}_{p:04d}{'_u' if unten else ''}_{os.getpid()}"
    pfad = os.path.join(ZIEL, name)
    if not os.path.exists(os.path.join(ROH, PDF[werk])):
        print(f"Scan nicht lokal vorhanden (Speicherplatz); Online-Ansicht: https://archive.org/details/10296123bsb/page/n{p-1}"); continue
    if not os.path.exists(pfad + ".jpg"):
        info = subprocess.run(["pdfinfo", "-f", str(p), "-l", str(p), os.path.join(ROH, PDF[werk])], capture_output=True, text=True).stdout
        mm = re.search(r"Page\s+\d+ size:\s+([\d.]+) x ([\d.]+)", info)
        w, h = (float(mm.group(1)), float(mm.group(2))) if mm else (600.0, 900.0)
        if unten:
            H = 2200; Wd = int(H * w / h)
            args = ["pdftoppm", "-f", str(p), "-l", str(p), "-scale-to-x", str(Wd), "-scale-to-y", str(H), "-gray", "-jpeg", "-jpegopt", "quality=70", "-singlefile",
                    "-x", "0", "-y", str(int(H * 0.45)), "-W", str(Wd), "-H", str(int(H * 0.55))]
        else:
            args = ["pdftoppm", "-f", str(p), "-l", str(p), "-scale-to", "1300", "-gray", "-jpeg", "-jpegopt", "quality=70", "-singlefile"]
        subprocess.run(args + [os.path.join(ROH, PDF[werk]), pfad], check=True)
    print(pfad + ".jpg")
