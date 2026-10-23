"""Prüft daten/ratgeber/regionen.json und seltenheit.json gegen eine Sortenliste (TSV: id, name, synonyme).
Aufruf aus dem Hauptordner: python3 -I daten/skripte/ratgeber/pruefen.py <sortennamen.tsv> daten/ratgeber"""
import json, sys
TSV=sys.argv[1]; ZIEL=sys.argv[2]
ids={l.split('\t')[0] for i,l in enumerate(open(TSV,encoding='utf-8')) if i>0}
REG={'DE-BW','DE-BY','DE-BE','DE-BB','DE-HB','DE-HH','DE-HE','DE-MV','DE-NI','DE-NW','DE-RP','DE-SL','DE-SN','DE-ST','DE-SH','DE-TH'}
fehler=[]
for datei,liste in (('regionen.json','zuordnungen'),('seltenheit.json','einstufungen')):
    d=json.load(open(f'{ZIEL}/{datei}',encoding='utf-8'))
    qids=[q['id'] for q in d['quellen']]
    if len(qids)!=len(set(qids)): fehler.append(f'{datei}: doppelte Quellen-IDs')
    for q in d['quellen']:
        for k in ('id','titel','herausgeber','url','abgerufen'):
            if not q.get(k): fehler.append(f'{datei}: Quelle {q.get("id")} ohne {k}')
    benutzt=set()
    for z in d[liste]:
        if z['sorte'] not in ids: fehler.append(f'{datei}: unbekannte Sorte {z["sorte"]}')
        if z['quelle'] not in qids: fehler.append(f'{datei}: unbekannte Quelle {z["quelle"]}')
        benutzt.add(z['quelle'])
        if 'region' in z and z['region'] not in REG: fehler.append(f'{datei}: Region {z["region"]}')
        if datei=='regionen.json' and z['art'] not in ('herkunft','regionalsorte','empfehlung'): fehler.append(f'{datei}: Art {z["art"]}')
    for x in d['nicht_in_datenbank']:
        if x['quelle'] not in qids: fehler.append(f'{datei}: nicht_in_datenbank mit unbekannter Quelle {x["quelle"]}')
        if 'region' in x and x['region'] not in REG: fehler.append(f'{datei}: Region {x["region"]}')
        benutzt.add(x['quelle'])
    for q in set(qids)-benutzt: fehler.append(f'{datei}: Quelle {q} wird nicht verwendet')
    print(datei, len(d[liste]), 'Einträge,', len(d['nicht_in_datenbank']), 'nicht in DB,', len(qids), 'Quellen')
print('FEHLER:' if fehler else 'Alles in Ordnung.', *fehler, sep='\n')
sys.exit(1 if fehler else 0)
