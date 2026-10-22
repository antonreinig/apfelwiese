"""Erkundung des NFC-Datensatzes: Spalten und Wertehäufigkeiten (nur Ausgabe auf stdout)."""
import csv, sys
from collections import Counter
pfad = sys.argv[1]
with open(pfad, encoding='utf-8-sig', newline='') as f:
    rows = list(csv.reader(f))
kopf, daten = rows[0], rows[1:]
print('Zeilen:', len(daten), 'Spalten:', len(kopf))
for i, h in enumerate(kopf):
    c = Counter(r[i].strip() if i < len(r) else '' for r in daten)
    n_leer = c.get('', 0)
    print(f'\n[{i}] {h!r}  leer={n_leer} verschiedene={len(c)}')
    if len(c) <= 40:
        for v, n in c.most_common():
            print(f'    {v!r}: {n}')
    else:
        print('    Beispiele:', [v for v, _ in c.most_common(12)])
