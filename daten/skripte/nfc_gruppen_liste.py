"""Hilfsliste zur Namenszuordnung: je MUNQ-Gruppe die NFC-Namen und die Namen derselben MUNQ
in anderen Sammlungen (MUNQ-Tabelle Denancé et al. 2020). Aufruf:
python3 -I nfc_gruppen_liste.py <nfc.csv> <munq.txt> > ausgabe.tsv"""
import csv, sys
from collections import defaultdict
nfc, munqpfad = sys.argv[1], sys.argv[2]
rows = [r for r in list(csv.reader(open(nfc, encoding='utf-8-sig')))[1:] if r[1].strip()]
munq = defaultdict(list); bevorzugt = {}
with open(munqpfad, encoding='utf-8') as f:
    for z in csv.DictReader(f, delimiter='\t'):
        munq[z['MUNQ'].strip()].append((z['Country'], z['Accession_Name']))
        bevorzugt[z['MUNQ'].strip()] = z['MUNQ_Preferred_Name']
gr = defaultdict(list)
for r in rows:
    k = r[0].strip()
    gr[k if k and k != '#N/A' else 'NA:' + r[1]].append(r[2].strip())
for k, namen in sorted(gr.items(), key=lambda x: x[1][0].lower()):
    andere = sorted({f'{n} [{c[:3]}]' for c, n in munq.get(k, []) if c != 'United_Kingdom'})
    print(k, ' | '.join(namen), bevorzugt.get(k, ''), ' ; '.join(andere), sep='\t')
