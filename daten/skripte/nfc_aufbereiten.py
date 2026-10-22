"""Aufbereitung des NFC-Datensatzes (UK National Fruit Collection, Characterization & Evaluation
2025 – Apple, DOI 10.17864/1947.001455) für die Sortendatenbank der Apfel-App.

Aufruf (aus /Users/antonreinig/Developer/apfel-app/daten):
  python3 -I skripte/nfc_aufbereiten.py roh/nfc/NFC_C_E_data_Apple_22_08_25.csv \
      roh/munq/MUNQ_20200909.txt nfc/namenpruefung_wikipedia.tsv nfc

Schreibt in den Ausgabeordner:
  sorten_nfc.json          Array von `Sorte` (app/src/daten/sorte.ts)
  quellen.json             Array von `Quelle`
  nicht_abgebildet.json    NFC-Werte ohne saubere Entsprechung im Merkmalskatalog (je Sorte)
  namen.csv                Zuordnung NFC-Name -> deutscher Name (nfc_name;deutscher_name;munq;beleg)
  namenszuordnung-offen.md Unsichere oder ungeprüfte Namenszuordnungen

Grundsätze: Nur Werte aus dem Datensatz, keine Ergänzungen. Die Abbildung NFC -> Katalog ist in
nfc/abbildung.md beschrieben; Zwischenstufen der ECPGR-Skala ("Medium to large") werden als zwei
Merkmalswerte mit derselben Originalangabe geführt, weil der Katalog diese Stufen nicht kennt.
"""
import csv, json, re, sys, unicodedata, zlib
from collections import Counter, defaultdict, OrderedDict

QUELLE = 'nfc2025'
SAMMLUNG = 'UK National Fruit Collection (Brogdale)'

# ------------------------------------------------------------------ Spalten (0-basiert)
S_MUNQ, S_NR, S_NAME, S_TYP = 0, 1, 2, 3
S_DATENQUELLE_A = 12   # 'Smith' oder 'NFC fruit' für Spalten 13–37
S_DATUM_B, S_PRUEFER_B = 42, 44   # Date recorded, Data source (P. Hale) für Spalten 45–60
MERKMALSSPALTEN = [13, 16, 17, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 45, 47, 49, 51, 53, 55,
                   57, 59, 61, 63, 64, 65, 67, 69, 71, 72]
SPALTENNAME = {
    3: 'Type', 13: 'Fruit size', 16: 'Average fruit width', 17: 'Average fruit height',
    18: 'Fruit height/width mean ratio', 20: 'Fruit shape approximated to ECPGR scale',
    22: 'Presence of ribs in top view adjusted to ECPGR scale', 24: 'Fruit crowning at apex',
    26: 'Colour of fruit skin - ground colour at eating maturity',
    28: 'Amount of over colour on fruit skin at eating maturity',
    30: 'Over colour of the fully mature fruit skin at eating maturity',
    32: 'Pattern of over colour on fruit skin at eating maturity',
    34: 'Russet on fruit skin 1 overall amount of russet', 36: 'Flesh colour at eating maturity',
    45: 'Fruit firmness 2 sensory analysis', 47: 'Flesh sweetness 1 sensory analysis',
    49: 'Flesh acidity 1 sensory analysis', 51: 'Ratio between acidity and sweetness',
    53: 'Flesh juiciness', 55: 'Flesh crunchiness', 57: 'Intensity of fruit aroma',
    59: 'Overall fruit quality (as dessert)', 61: 'Tree global architecture',
    63: 'Flowering 10% open', 65: 'Flowering 80% open', 67: 'Flowering 90% petal fall',
    69: 'Time of fruit ripening for harvest (harvest maturity)', 71: 'Storage (original)',
    72: 'Latest store date (standardised)',
}

# ------------------------------------------------------------------ Abbildung NFC-Text -> Katalog
# Wert: Liste von (merkmal, code); leere Liste = nicht abbildbar (Grund in NICHT)
def stufen(merkmal, tabelle):
    return {k.lower(): [(merkmal, c) for c in v] for k, v in tabelle.items()}

ABB = {
    13: stufen('frucht_groesse', {
        'Small': ['3'], 'Small to medium': ['3', '5'], 'Medium': ['5'], 'Medium to large': ['5', '7'],
        'Large': ['7'], 'Very large': ['9']}),
    20: stufen('frucht_form', {
        'Globose': ['rund'], 'Globose conical': ['rundkonisch'], 'Flat': ['flachrund'],
        'Flat globose': ['flachrund'], 'Conical': ['konisch'], 'Narrow conical': ['konisch'],
        'Truncate conical': ['stumpfkonisch'], 'Oblong': ['walzenfoermig'],
        'Broad globose conical': ['breitrundkonisch'], 'Ellipsoid': ['elliptisch'],
        'Ellipsoid conical': ['elliptischkonisch'], 'Oblong conical': ['laenglichkonisch']}),
    22: stufen('frucht_rippung', {
        'Absence': ['1'], 'Very light': ['1'], 'Medium': ['5'], 'Strong': ['7'], 'Very strong': ['9']}),
    24: stufen('frucht_kronung', {
        'Absent or very weak': ['1'], 'Very weak to weak': ['1'], 'Weak': ['1'],
        'Weak to medium': ['1', '5'], 'Medium': ['5'], 'Medium to strong': ['5', '9'],
        'Strong': ['9'], 'Strong to very strong': ['9'], 'Very strong': ['9']}),
    26: stufen('schale_grundfarbe', {
        'Yellow': ['gelb'], 'Whitish yellow': ['weisslichgelb'], 'Green yellow': ['gruengelb'],
        'Green': ['gruen'], 'Whitish green': ['weisslichgruen'], 'Orange': [], 'Red': []}),
    28: stufen('schale_deckfarbe_anteil', {
        'Absent': ['0'], 'Very low': ['1'], 'Low': ['3'], 'Low to medium': ['3', '5'], 'Medium': ['5'],
        'Medium to high': ['5', '7'], 'High': ['7'], 'High to very high': ['7', '9'], 'Very high': ['9']}),
    30: stufen('schale_deckfarbe_farbton', {
        'Orange': ['orange'], 'Pink': ['rosa'], 'Red': ['rot'], 'Dark red': ['dunkelrot'],
        'Purple': ['purpurrot'], 'Brownish red': ['braunrot'], 'Absent': []}),
    32: stufen('schale_deckfarbe_art', {
        'Only solid flush': ['verwaschen'], 'Flush with stripes': ['verwaschen', 'gestreift'],
        'Only stripes': ['gestreift'], 'Mottled': ['marmoriert'], 'Washed out': ['verwaschen'],
        'Absent': []}),
    34: stufen('schale_berostung_gesamt', {
        'Absent': ['0'], 'Very low': ['1'], 'Low': ['3'], 'Low to medium': ['3', '5'], 'Medium': ['5'],
        'Medium to high': ['5', '7'], 'High': ['7'], 'High to very high': ['7', '9'], 'Very high': ['9']}),
    36: stufen('fleisch_farbe', {
        'White': ['weiss'], 'Cream': ['cremeweiss'], 'Yellowish': ['gelblich'],
        'Greenish': ['gruenlich'], 'Pinkish': ['roetlich']}),
    45: stufen('fleisch_festigkeit', {
        'Extremely soft': ['3'], 'Very soft': ['3'], 'Soft': ['3'], 'Soft to intermediate': ['3', '5'],
        'Intermediate': ['5'], 'Intermediate to firm': ['5', '7'], 'Firm': ['7'], 'Very firm': ['7']}),
    47: stufen('geschmack_suesse', {
        'Very low': ['3'], 'Low': ['3'], 'Low to intermediate': ['3', '5'], 'Intermediate': ['5'],
        'Intermediate to high': ['5', '7'], 'High': ['7'], 'Very high': ['7']}),
    49: stufen('geschmack_saeure', {
        'Extremely low': ['3'], 'Very low': ['3'], 'Low': ['3'], 'Low to intermediate': ['3', '5'],
        'Intermediate': ['5'], 'Intermediate to high': ['5', '7'], 'High': ['7'], 'Very high': ['9'],
        'Extremely high': ['9']}),
    53: stufen('fleisch_saftigkeit', {
        'Very low': ['3'], 'Low': ['3'], 'Low to intermediate': ['3', '5'], 'Intermediate': ['5'],
        'Intermediate to high': ['5', '7'], 'High': ['7'], 'Very high': ['7']}),
    69: stufen('pflueckreife', {
        'Late July': ['7'], 'Early August': ['8'], 'Mid August': ['8'], 'Late August': ['8'],
        'Early September': ['9'], 'Mid September': ['9'], 'Late September': ['9'],
        'Early October': ['10'], 'Mid October': ['10'], 'Late October': ['10'],
        'Early November': ['11'], 'Mid November': ['11']}),
    72: stufen('genussreife_ende', {
        'August': ['8'], 'September': ['9'], 'October': ['10'], 'November': ['11'], 'December': ['12'],
        'January': ['1'], 'February': ['2'], 'March': ['3'], 'April': ['4'], 'May': ['5'], 'June': ['6']}),
    3: stufen('verwendung', {
        'Dessert': ['tafel'], 'Culinary': ['kueche'], 'Cider': ['most'],
        'Dual-purpose': ['tafel', 'kueche'], 'Cider (?)': [], 'Rootstock': [], 'Ornamental': []}),
}
# Spalten ganz ohne Katalogmerkmal (werden vollständig in nicht_abgebildet.json geführt)
OHNE_MERKMAL = {51, 55, 57, 59, 61, 65, 67, 71}
# Blühklasse (1–9, relativ zur Sammlung, Mittel aus zehn Jahren) -> bluete_zeit
BLUETE = {'1': ['3'], '2': ['3'], '3': ['3'], '4': ['3', '5'], '5': ['5'], '6': ['5', '7'],
          '7': ['7'], '8': ['7'], '9': ['7']}

MERKMAL_REIHENFOLGE = [
    'frucht_breite', 'frucht_hoehe', 'frucht_groesse', 'frucht_form', 'frucht_hoehe_breite',
    'frucht_rippung', 'frucht_kronung', 'schale_grundfarbe', 'schale_deckfarbe_anteil',
    'schale_deckfarbe_farbton', 'schale_deckfarbe_art', 'schale_berostung_gesamt', 'fleisch_farbe', 'fleisch_festigkeit',
    'fleisch_saftigkeit', 'geschmack_suesse', 'geschmack_saeure', 'verwendung', 'pflueckreife',
    'genussreife_ende', 'bluete_zeit', 'ploidie']

# ------------------------------------------------------------------ Hilfsfunktionen
def leer(v):
    v = (v or '').strip()
    return v == '' or v.upper() in ('NULL', '#N/A', 'N/A')

def zahl(v):
    """'70' -> (70.0, None); '64-70' -> (67.0, '64-70'); sonst (None, v)."""
    v = v.strip()
    m = re.fullmatch(r'(\d+(?:\.\d+)?)', v)
    if m:
        return float(m.group(1)), None
    m = re.fullmatch(r'(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)', v)
    if m:
        return (float(m.group(1)) + float(m.group(2))) / 2, v
    return None, v

def ascii_norm(s):
    return unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode()

def namensschluessel(s):
    s = ascii_norm(s).lower()
    s = s.replace('oe', 'o').replace('ae', 'a').replace('ue', 'u').replace('ss', 's')
    return re.sub(r'[^a-z0-9]', '', s)

def abstand1(a, b):
    """True, wenn a und b sich um genau eine Ersetzung unterscheiden (Tippfehler wie 'Edelapfer')."""
    return len(a) == len(b) and a != b and sum(x != y for x, y in zip(a, b)) == 1

def slug(name):
    s = name.lower()
    for a, b in (('ä', 'ae'), ('ö', 'oe'), ('ü', 'ue'), ('ß', 'ss')):
        s = s.replace(a, b)
    s = ascii_norm(s).replace("'", '').replace('’', '')
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')

TECHNISCH = re.compile(r'^(\d+\s*[nx].*|LA\s*\d*\w*|LA|EMLA.*|NY|NFT.*|Wisley|M\s*\d+|AW \d+|[ab]|'
                       r'syn\.?\s.*|mutation of .*)$', re.I)

def grundname(name):
    """Entfernt technische Klammerzusätze (Ploidie, Klon, Herkunft der Edelreiser, 'syn …').
    Gibt (Grundname, [Synonyme aus 'syn …']) zurück."""
    syn = []
    def ersetzen(m):
        inhalt = m.group(1).strip()
        if re.match(r'syn\.?\s', inhalt, re.I):
            syn.append(re.sub(r'^syn\.?\s+', '', inhalt, flags=re.I).strip())
            return ''
        return '' if TECHNISCH.match(inhalt) else m.group(0)
    g = name
    for _ in range(3):
        g = re.sub(r'\s*\(([^()]*)\)', ersetzen, g)
    return re.sub(r'\s+', ' ', g).strip(), syn

# ------------------------------------------------------------------ deutsche Formulierungen für Texte
# Adjektivstämme (Endung wird angehängt) bzw. fertige Wendungen; Schlüssel = NFC-Text klein
GROESSE = {'small': ['klein'], 'small to medium': ['klein', 'mittelgroß'], 'medium': ['mittelgroß'],
           'medium to large': ['mittelgroß', 'groß'], 'large': ['groß'], 'very large': ['sehr groß']}
FORM = {'globose': 'kugelig', 'globose conical': 'rundlich-kegelförmig',
        'broad globose conical': 'breit rundlich-kegelförmig', 'flat': 'stark abgeflacht',
        'flat globose': 'flachrund', 'conical': 'kegelförmig', 'narrow conical': 'schmal kegelförmig',
        'truncate conical': 'stumpf kegelförmig', 'ellipsoid': 'elliptisch',
        'ellipsoid conical': 'elliptisch-kegelförmig', 'oblong': 'walzenförmig',
        'oblong conical': 'länglich-kegelförmig'}
GRUNDFARBE = {'yellow': 'gelb', 'whitish yellow': 'weißlich gelb', 'green yellow': 'grünlich gelb',
              'whitish green': 'weißlich grün', 'green': 'grün', 'orange': 'orangefarben', 'red': 'rot'}
DECK_ANTEIL = {'very low': 'auf einem sehr kleinen Teil der Schale', 'low': 'auf einem kleinen Teil der Schale',
               'low to medium': 'auf einem kleinen bis mittleren Teil der Schale',
               'medium': 'auf etwa der halben Schale',
               'medium to high': 'auf einem mittleren bis großen Teil der Schale',
               'high': 'auf einem großen Teil der Schale',
               'high to very high': 'auf einem großen bis sehr großen Teil der Schale',
               'very high': 'auf fast der ganzen Schale'}
DECK_TON = {'orange': 'orangefarben', 'pink': 'rosafarben', 'red': 'rot', 'dark red': 'dunkelrot',
            'purple': 'purpurfarben', 'brownish red': 'bräunlich rot'}
DECK_MUSTER = {'only solid flush': ['flächig'], 'flush with stripes': ['flächig', 'gestreift'],
               'only stripes': ['gestreift'], 'mottled': ['marmoriert'], 'washed out': ['verwaschen']}
ROST = {'absent': 'ohne Berostung', 'very low': 'kaum berostet', 'low': 'wenig berostet',
        'low to medium': 'wenig bis mäßig berostet', 'medium': 'mäßig berostet',
        'medium to high': 'mäßig bis stark berostet', 'high': 'stark berostet',
        'high to very high': 'stark bis sehr stark berostet', 'very high': 'sehr stark berostet'}
FLEISCH = {'white': 'weiß', 'cream': 'cremefarben', 'yellowish': 'gelblich', 'greenish': 'grünlich',
           'pinkish': 'rosa getönt'}
FEST = {'extremely soft': 'äußerst weich', 'very soft': 'sehr weich', 'soft': 'weich',
        'soft to intermediate': 'weich bis mittelfest', 'intermediate': 'mittelfest',
        'intermediate to firm': 'mittelfest bis fest', 'firm': 'fest', 'very firm': 'sehr fest'}
SAFT = {'very low': 'sehr wenig saftig', 'low': 'wenig saftig', 'low to intermediate': 'wenig bis mäßig saftig',
        'intermediate': 'mäßig saftig', 'intermediate to high': 'mäßig saftig bis saftig', 'high': 'saftig',
        'very high': 'sehr saftig'}
SUESS = {'very low': 'sehr wenig süß', 'low': 'wenig süß', 'low to intermediate': 'wenig bis mäßig süß',
         'intermediate': 'mäßig süß', 'intermediate to high': 'mäßig bis deutlich süß',
         'high': 'deutlich süß', 'very high': 'sehr süß'}
SAUER = {'extremely low': 'äußerst säurearm', 'very low': 'sehr säurearm', 'low': 'säurearm',
         'low to intermediate': 'säurearm bis mäßig sauer', 'intermediate': 'mäßig sauer',
         'intermediate to high': 'mäßig bis deutlich sauer', 'high': 'deutlich sauer',
         'very high': 'sehr sauer', 'extremely high': 'äußerst sauer'}
AROMA = {'extremely low': 'kaum wahrnehmbarem', 'very low': 'sehr schwachem', 'low': 'schwachem',
         'low to medium': 'schwachem bis mittlerem', 'medium': 'mittlerem',
         'medium to high': 'mittlerem bis kräftigem', 'high': 'kräftigem', 'very high': 'sehr kräftigem'}
VERWENDUNG = {'dessert': 'Tafelapfel', 'culinary': 'Küchenapfel', 'cider': 'Mostapfel',
              'dual-purpose': 'Tafel- und Küchenapfel', 'rootstock': 'Unterlage', 'ornamental': 'Zierapfel'}
MONAT = {'january': 'Januar', 'february': 'Februar', 'march': 'März', 'april': 'April', 'may': 'Mai',
         'june': 'Juni', 'july': 'Juli', 'august': 'August', 'september': 'September',
         'october': 'Oktober', 'november': 'November', 'december': 'Dezember'}
DEKADE = {'early': 'Anfang', 'mid': 'Mitte', 'late': 'Ende'}

def adj(staemme, endung):
    """['klein','mittelgroß'] + 'er' -> 'kleiner bis mittelgroßer'"""
    if isinstance(staemme, str):
        staemme = [staemme]
    return ' bis '.join(s + endung for s in staemme)

def gross(s):
    return s[:1].upper() + s[1:]

# ------------------------------------------------------------------ Einlesen
def einlesen(pfad):
    with open(pfad, encoding='utf-8-sig', newline='') as f:
        zeilen = list(csv.reader(f))
    kopf = zeilen[0]
    if len(kopf) != 73 or kopf[0] != 'MUNQ' or kopf[13] != 'Fruit size':
        sys.exit('Unerwarteter Spaltenaufbau der NFC-Datei')
    daten = []
    for i, z in enumerate(zeilen[1:], start=2):
        if not z or not z[S_NR].strip():
            continue
        z = (z + [''] * 73)[:73]
        daten.append({'zeile': i, 'r': [v.strip() for v in z]})
    return daten

def hat_merkmale(r):
    return any(not leer(r[c]) for c in MERKMALSSPALTEN)

def munq_wert(r):
    v = r[S_MUNQ]
    return None if leer(v) else v

def munq_tabelle(pfad):
    bevorzugt = {}
    with open(pfad, encoding='utf-8', newline='') as f:
        for z in csv.DictReader(f, delimiter='\t'):
            bevorzugt[z['MUNQ'].strip()] = z['MUNQ_Preferred_Name'].strip()
    return bevorzugt

# ------------------------------------------------------------------ Gruppierung (Union-Find)
def gruppieren(daten):
    eltern = list(range(len(daten)))
    def wurzel(i):
        while eltern[i] != i:
            eltern[i] = eltern[eltern[i]]
            i = eltern[i]
        return i
    def vereinen(a, b):
        eltern[wurzel(a)] = wurzel(b)
    nach_munq = defaultdict(list)
    for i, d in enumerate(daten):
        m = munq_wert(d['r'])
        if m:
            nach_munq[m].append(i)
    for idx in nach_munq.values():
        for i in idx[1:]:
            vereinen(idx[0], i)
    # gleicher Name (exakt, ohne Groß-/Kleinschreibung) nur, wenn dadurch keine zwei MUNQ verbunden werden
    nach_name = defaultdict(list)
    for i, d in enumerate(daten):
        n = re.sub(r'\s+', ' ', d['r'][S_NAME]).lower()
        if n and n != 'unknown':
            nach_name[n].append(i)
    namensmerge, namenskonflikt = [], []
    for n, idx in nach_name.items():
        if len(idx) < 2:
            continue
        munqs = {munq_wert(daten[i]['r']) for i in idx} - {None}
        if len(munqs) > 1:
            namenskonflikt.append((n, sorted(munqs)))
            continue
        if len({wurzel(i) for i in idx}) > 1:
            namensmerge.append(n)
        for i in idx[1:]:
            vereinen(idx[0], i)
    gruppen = defaultdict(list)
    for i in range(len(daten)):
        gruppen[wurzel(i)].append(daten[i])
    return list(gruppen.values()), namensmerge, namenskonflikt

# ------------------------------------------------------------------ Namen
def namen_laden(pfad):
    """Liest die Wikipedia-Prüfung; liefert {namensschluessel(nfc): (deutsch, art, ergebnis, artikel)}"""
    abb = {}
    with open(pfad, encoding='utf-8') as f:
        for z in csv.DictReader(f, delimiter='\t'):
            abb[namensschluessel(z['nfc_name'])] = (z['deutscher_name'], z['art'], z['ergebnis'], z['artikel'], z.get('anmerkung', ''))
    return abb

def wiki_url(titel):
    return 'https://de.wikipedia.org/wiki/' + titel.replace(' ', '_')

DEUTSCH_MARKER = re.compile(r'(apfel|renette|reinette\b.*\b(von|aus)|[äöüß]|^(roter|rote|gelber|grüner|weißer|'
                            r'schöner|großer|graue|grauer|brauner|früher|später)\b|kalvill|rambur\b|parmäne|'
                            r'stettiner|borsdorfer|luiken|jungfern|sondergleichen)', re.I)

# ------------------------------------------------------------------ Hauptteil
def main():
    nfc_pfad, munq_pfad, namen_pfad, aus = sys.argv[1:5]
    daten = einlesen(nfc_pfad)
    bevorzugt = munq_tabelle(munq_pfad)
    namensabb = namen_laden(namen_pfad)
    gruppen, namensmerge, namenskonflikt = gruppieren(daten)

    ohne_daten = [d for d in daten if not hat_merkmale(d['r'])]
    sorten, nicht_abg, namen_zeilen, offen_kandidaten, offen_munq, offen_gruppen = [], [], [], [], [], []
    unbekannt_einzeln, ids, nur_unabbildbar = [], Counter(), []
    protokoll = Counter()

    for gruppe in gruppen:
        mit = [d for d in gruppe if hat_merkmale(d['r'])]
        if not mit:
            continue
        gruppe.sort(key=lambda d: d['r'][S_NR])
        munqs = sorted({munq_wert(d['r']) for d in gruppe} - {None})
        munq = munqs[0] if munqs else None
        basen = OrderedDict()
        nfc_syn = []
        for d in gruppe:
            g, syn = grundname(d['r'][S_NAME])
            basen.setdefault(g, []).append(d)
            nfc_syn += [(s, d) for s in syn]
        benannte = [b for b in basen if b.lower() != 'unknown']
        if not benannte:
            unbekannt_einzeln += [d['r'][S_NR] for d in mit]
            continue

        # ---- Namenswahl
        deutsch, deutsch_von = None, []
        bv = bevorzugt.get(munq or '', '')
        for b in benannte:
            e = namensabb.get(namensschluessel(b))
            if not e:
                continue
            de, art, erg, artikel, anm = e
            if erg == 'verworfen':
                continue
            if art == 'uebersetzung' and erg not in ('bestaetigt', 'manuell_bestaetigt') and bv and namensschluessel(bv) == namensschluessel(de):
                erg = 'munq'      # MUNQ-Vorzugsname ist genau der deutsche Name
            if erg != 'bestaetigt' and any(namensschluessel(x) == namensschluessel(de) or abstand1(namensschluessel(x), namensschluessel(de))
                                           for x, _d in nfc_syn):
                erg = 'nfc_syn'   # NFC nennt den deutschen Namen selbst als Synonym (ggf. mit Tippfehler)
            sicher = erg in ('bestaetigt', 'manuell_bestaetigt', 'nfc_syn', 'munq') or art in ('schreibweise', 'gleich')
            if sicher:
                deutsch_von.append((b, de, art, erg, (artikel, anm)))
            else:
                offen_kandidaten.append((b, de, munq, erg, artikel))
        if deutsch_von:
            # bei mehreren Treffern: Übersetzung vor Schreibweise
            deutsch_von.sort(key=lambda x: (x[2] != 'uebersetzung', x[0]))
            deutsch = deutsch_von[0][1]
            if len({x[1] for x in deutsch_von}) > 1:
                protokoll['mehrere_deutsche_namen'] += 1
        if deutsch:
            name = deutsch
        else:
            treffer = [b for b in benannte if bv and namensschluessel(b) == namensschluessel(bv)]
            if treffer:
                name = treffer[0]
            else:
                # häufigster Grundname unter Akzessionen mit Daten, dann unter allen
                zaehl = Counter(grundname(d['r'][S_NAME])[0] for d in mit)
                zaehl.update({b: 0 for b in benannte})
                name = max(benannte, key=lambda b: (zaehl[b], -benannte.index(b)))
        if bv and bv != '-' and DEUTSCH_MARKER.search(bv) and namensschluessel(bv) not in {namensschluessel(name)} | {namensschluessel(b) for b in benannte}:
            offen_munq.append((munq, ', '.join(benannte), bv, name))
        if len(benannte) > 1:
            offen_gruppen.append((munq, name, benannte))

        # ---- Synonyme
        synonyme, gesehen = [], {namensschluessel(name)}
        def syn_hinzu(n, d):
            k = namensschluessel(n)
            if k in gesehen or not n or any(abstand1(k, g) for g in gesehen):
                return
            gesehen.add(k)
            synonyme.append({'name': n, 'beleg': {'quelle': QUELLE, 'seite': f"Akzession {d['r'][S_NR]}"}})
        for b, de, art, erg, artikel in deutsch_von:
            if de == name:
                syn_hinzu(b, basen[b][0])
        for s, d in nfc_syn:
            syn_hinzu(s, d)
        for b, de, art, erg, artikel in deutsch_von:
            for d in basen[b]:
                if de != b:
                    namen_zeilen.append((d['r'][S_NAME], de, munq or '', namensbeleg(art, erg, artikel, bv, d)))

        # ---- ID
        basis_id = slug(name)

        # ---- Merkmale
        eintraege = defaultdict(list)   # (merkmal, wert, original) -> [seitenteile]
        fehlend = []
        for d in mit:
            merkmale_einer_akzession(d, eintraege, fehlend)
        merkmale = []
        for (merkmal, wert, original), teile in sorted(
                eintraege.items(), key=lambda x: (MERKMAL_REIHENFOLGE.index(x[0][0]), str(x[0][1]), x[0][2] or '')):
            mw = {'merkmal': merkmal, 'wert': wert, 'quelle': QUELLE, 'seite': '; '.join(sorted(set(teile)))}
            if original is not None:
                mw['original'] = original
            merkmale.append(mw)

        if not merkmale:
            # nur Werte ohne Katalogentsprechung (fast immer nur die Kronenform): kein Sorteneintrag
            nur_unabbildbar.append({'id': basis_id, 'name': name, 'nicht_in_sorten': True, 'werte': fehlend})
            continue
        ids[basis_id] += 1
        sorte = OrderedDict()
        sorte['id'] = basis_id
        sorte['name'] = name
        sorte['synonyme'] = synonyme
        if munq:
            sorte['munq'] = float(munq) if '.' in munq else int(munq)
        sorte['akzessionen'] = [{'sammlung': SAMMLUNG, 'nummer': d['r'][S_NR], 'name': d['r'][S_NAME]} for d in gruppe]
        sorte['merkmale'] = merkmale
        sorte['texte'] = []
        sorte['bilder'] = []
        sorte['_mit'] = mit
        sorte['_fehlend'] = fehlend
        sorte['_munqs'] = munqs
        sorten.append(sorte)

    # ---- eindeutige IDs
    vergeben = Counter()
    # bei Namensgleichheit behält die Gruppe, deren MUNQ-Vorzugsname dem Namen entspricht, die kurze ID
    kurz = Counter(s['id'] for s in sorten if s['_munqs'] and namensschluessel(bevorzugt.get(s['_munqs'][0], '')) == namensschluessel(s['name']))
    for s in sorted(sorten, key=lambda s: (s['id'], s['akzessionen'][0]['nummer'])):
        if ids[s['id']] > 1 and kurz[s['id']] == 1 and s['_munqs'] and namensschluessel(bevorzugt.get(s['_munqs'][0], '')) == namensschluessel(s['name']):
            pass
        elif ids[s['id']] > 1:
            zusatz = f"munq-{s['_munqs'][0]}" if s['_munqs'] else f"nfc-{s['akzessionen'][0]['nummer']}"
            s['id'] = f"{s['id']}-{slug(zusatz)}"
            protokoll['id_mit_zusatz'] += 1
        vergeben[s['id']] += 1
    assert max(vergeben.values()) == 1, 'doppelte IDs'

    # ---- Texte und nicht abgebildete Werte
    ohne_text = 0
    for s in sorten:
        t = ueberblick(s['id'], s['_mit'])
        if t:
            s['texte'].append({'thema': 'ueberblick', 'text': t, 'belege': [
                {'quelle': QUELLE, 'seite': 'Akzession ' + ', '.join(d['r'][S_NR] for d in s['_mit'])}]})
        else:
            ohne_text += 1
        if s['_fehlend']:
            nicht_abg.append({'id': s['id'], 'name': s['name'], 'werte': s['_fehlend']})
        for k in ('_mit', '_fehlend', '_munqs'):
            del s[k]

    sorten.sort(key=lambda s: s['id'])
    nicht_abg += nur_unabbildbar
    nicht_abg.sort(key=lambda x: x['id'])
    with open(f'{aus}/sorten_nfc.json', 'w', encoding='utf-8') as f:
        json.dump(sorten, f, ensure_ascii=False, indent=1)
    with open(f'{aus}/nicht_abgebildet.json', 'w', encoding='utf-8') as f:
        json.dump(nicht_abg, f, ensure_ascii=False, indent=1)
    with open(f'{aus}/quellen.json', 'w', encoding='utf-8') as f:
        json.dump(QUELLEN, f, ensure_ascii=False, indent=1)
    with open(f'{aus}/namen.csv', 'w', encoding='utf-8', newline='') as f:
        w = csv.writer(f, delimiter=';')
        w.writerow(['nfc_name', 'deutscher_name', 'munq', 'beleg'])
        for z in sorted(set(namen_zeilen), key=lambda z: (z[1], z[0])):
            w.writerow(z)
    offen_schreiben(f'{aus}/namenszuordnung-offen.md', offen_kandidaten, offen_munq, offen_gruppen,
                    namensmerge, namenskonflikt)

    print('Datenzeilen:', len(daten), '| ohne Merkmalsdaten:', len(ohne_daten),
          '| "Unknown" ohne benannte Gruppe (ausgelassen):', len(unbekannt_einzeln))
    print('Gruppen nur mit nicht abbildbaren Werten (kein Eintrag):', len(nur_unabbildbar))
    print('Sorten:', len(sorten), '| Akzessionen in Sorten:', sum(len(s['akzessionen']) for s in sorten))
    print('Namenszusammenführungen ohne MUNQ:', len(namensmerge), '| Namensgleichheit mit verschiedenen MUNQ:', len(namenskonflikt))
    print('Sorten mit deutschem Namen (abweichend vom NFC-Namen):',
          sum(1 for s in sorten if all(grundname(a['name'])[0] != s['name'] for a in s['akzessionen'])))
    print('Offene Kandidaten:', len({k[0] for k in offen_kandidaten}), '| MUNQ-Vorzugsname deutsch abweichend:', len(offen_munq),
          '| Gruppen mit mehreren Namen:', len(offen_gruppen))
    print('ohne Überblickstext:', ohne_text, '| Protokoll:', dict(protokoll))

def namensbeleg(art, erg, artikel_anm, bv, d):
    artikel, anm = artikel_anm
    anm = f' ({anm})' if anm else ''
    if erg == 'bestaetigt':
        return f'de.wikipedia, Artikel nennt NFC-Namen: {wiki_url(artikel)}{anm}'
    if erg == 'manuell_bestaetigt':
        return f'de.wikipedia {wiki_url(artikel)}, manuell geprüft{anm}'
    if erg == 'munq':
        return f'MUNQ-Vorzugsname (Denancé et al. 2020): {bv}'
    if erg == 'nfc_syn':
        return f"NFC-Akzessionsname nennt das Synonym selbst: \"{d['r'][S_NAME]}\""
    if art == 'schreibweise':
        zusatz = f'; MUNQ-Vorzugsname: {bv}' if bv and bv != '-' else ''
        art_text = f'; Artikel: {wiki_url(artikel)}' if artikel else ''
        return f'nur Schreibweise (Umlaute, ß oder deutsche Schreibung „Renette“ ergänzt){zusatz}{art_text}'
    return 'gleicher Name'

# ------------------------------------------------------------------ Merkmale einer Akzession
def merkmale_einer_akzession(d, eintraege, fehlend):
    r, nr = d['r'], d['r'][S_NR]
    qa = {'smith': 'Smith 1971', 'nfc fruit': 'NFC-Früchte'}.get(r[S_DATENQUELLE_A].lower(), '')
    teil_a = f'Akzession {nr}' + (f' ({qa})' if qa else '')
    pruef = ', '.join(x for x in (r[S_PRUEFER_B], r[S_DATUM_B]) if not leer(x))
    teil_b = f'Akzession {nr}' + (f' (Verkostung {pruef})' if pruef else '')
    teil_c = f'Akzession {nr}'

    def teil(spalte):
        if 13 <= spalte <= 37:
            return teil_a
        if 45 <= spalte <= 60:
            return teil_b
        return teil_c

    def nicht(spalte, original, grund, code=None):
        e = {'nfc_spalte': SPALTENNAME[spalte], 'original': original, 'akzession': nr, 'grund': grund}
        if code is not None and not leer(code):
            e['nfc_code'] = code
        fehlend.append(e)

    # Messwerte
    for spalte, merkmal, stellen in ((16, 'frucht_breite', 1), (17, 'frucht_hoehe', 1), (18, 'frucht_hoehe_breite', 3)):
        if leer(r[spalte]):
            continue
        wert, original = zahl(r[spalte])
        if wert is None:
            nicht(spalte, r[spalte], 'kein lesbarer Zahlenwert')
            continue
        eintraege[(merkmal, round(wert, stellen), original)].append(teil(spalte))

    # Text-Spalten mit Abbildungstabelle
    for spalte, tabelle in ABB.items():
        v = r[spalte]
        if leer(v):
            continue
        code = r[spalte + 1] if spalte not in (3, 71, 72) else None
        ziel = tabelle.get(v.lower())
        if ziel is None:
            nicht(spalte, v, 'Wert nicht in der Abbildungstabelle', code)
            continue
        if not ziel:
            nicht(spalte, v, 'keine passende Ausprägung im Katalog', code)
            continue
        for merkmal, c in ziel:
            eintraege[(merkmal, c, v)].append(teil(spalte))

    # Ploidie aus dem Akzessionsnamen: "(3n)" = triploid; "(4n)"/"(4x)" sind meist induzierte
    # tetraploide Klone und haben keine Katalogausprägung
    name = r[S_NAME]
    if re.search(r'\(\s*3n\s*\)', name):
        eintraege[('ploidie', 'triploid', f'Akzessionsname "{name}"')].append(teil_c)
    if re.search(r'\(\s*4[nx]\b', name):
        fehlend.append({'nfc_spalte': 'Accession Name', 'original': name, 'akzession': nr,
                        'grund': 'tetraploid (4n/4x): keine Ausprägung im Katalog; meist induzierter Klon'})

    # Blütezeit aus Klasse "Flowering 10% open"
    if not leer(r[64]):
        ziel = BLUETE.get(r[64])
        original = f'Klasse {r[64]} (10 % der Blüten offen' + (f', Tag {r[63]})' if not leer(r[63]) else ')')
        if ziel:
            for c in ziel:
                eintraege[('bluete_zeit', c, original)].append(teil(64))
        else:
            nicht(63, original, 'Klasse nicht lesbar')

    # Spalten ohne Katalogmerkmal
    for spalte in sorted(OHNE_MERKMAL):
        v = r[spalte]
        if leer(v):
            continue
        if spalte in (65, 67):
            code = r[spalte + 1]
            nicht(spalte, f'Tag {v}', 'kein Katalogmerkmal (nur 10 % Blüte als Blütezeit übernommen)', code)
        elif spalte == 71:
            nicht(spalte, v, 'kein Katalogmerkmal (Lagerzeitraum laut NFC; Beginn nicht als Genussreife gesichert)')
        else:
            nicht(spalte, v, 'kein Katalogmerkmal', r[spalte + 1])

# ------------------------------------------------------------------ Überblickstext
def ueberblick(sid, mit):
    """2–4 Sätze aus den NFC-Textwerten. Bei abweichenden Akzessionen gilt der häufigste Wert;
    bei Gleichstand der Wert der Akzession mit den meisten Angaben."""
    reihen = sorted(mit, key=lambda d: (-sum(not leer(d['r'][c]) for c in MERKMALSSPALTEN), d['r'][S_NR]))
    def wert(spalte):
        werte = [d['r'][spalte] for d in reihen if not leer(d['r'][spalte])]
        if not werte:
            return None
        z = Counter(w.lower() for w in werte)
        best = max(z.values())
        for w in werte:
            if z[w.lower()] == best:
                return w.lower()
    var = zlib.crc32(sid.encode())
    saetze = []

    # Satz 1: Größe, Form, Farben
    g, fo, gf = GROESSE.get(wert(13) or ''), FORM.get(wert(20) or ''), GRUNDFARBE.get(wert(26) or '')
    anteil, ton, muster = wert(28), wert(30), wert(32)
    ohne_deck = 'absent' in (anteil, ton, muster)
    deck = ''
    if ohne_deck:
        deck = 'ohne Deckfarbe'
    elif anteil or ton or muster:
        teile = []
        if muster in DECK_MUSTER:
            teile.append(' und '.join(m + 'er' for m in DECK_MUSTER[muster]))
        if ton in DECK_TON:
            teile.append(DECK_TON[ton] + 'er')
        deck = ' '.join(teile + ['Deckfarbe']) + (' ' + DECK_ANTEIL[anteil] if anteil in DECK_ANTEIL else '')
    mit_teil = []
    if gf:
        mit_teil.append(f'{gf}er Grundfarbe')
    if deck:
        if deck == 'ohne Deckfarbe':
            mit_teil.append(deck)
        else:
            mit_teil.append(deck)
    if g or fo or mit_teil:
        variante = var % 3
        endung = 'er' if variante == 0 else 'e'
        attr = ', '.join(x for x in (adj(g, endung) if g else '', adj(fo, endung) if fo else '') if x)
        nomen = {0: 'Apfel', 1: 'Frucht', 2: 'Früchte'}[variante]
        if mit_teil:
            if len(mit_teil) == 2 and mit_teil[1] == 'ohne Deckfarbe':
                anhang = f' mit {mit_teil[0]}, ohne Deckfarbe'
            elif mit_teil[0] == 'ohne Deckfarbe':
                anhang = ' ohne Deckfarbe'
            else:
                anhang = ' mit ' + ' und '.join(mit_teil)
        else:
            anhang = ''
        kern = f'{attr} {nomen}' if attr else nomen
        if variante == 2:
            saetze.append(f'Die Sorte bildet {kern}{anhang}.')
        else:
            saetze.append(gross(f'{kern}{anhang}.'))

    # Satz 2: Berostung und Fleischfarbe
    rost, fl = ROST.get(wert(34) or ''), FLEISCH.get(wert(36) or '')
    if rost and fl:
        saetze.append(f'Die Schale ist {rost}, das Fruchtfleisch {fl}.' if var % 2 == 0
                      else f'Das Fruchtfleisch ist {fl}, die Schale {rost}.')
    elif rost:
        saetze.append(f'Die Schale ist {rost}.')
    elif fl:
        saetze.append(f'Das Fruchtfleisch ist {fl}.')

    # Satz 3: Verkostung
    fe, sa, su, so, ar = (FEST.get(wert(45) or ''), SAFT.get(wert(53) or ''), SUESS.get(wert(47) or ''),
                          SAUER.get(wert(49) or ''), AROMA.get(wert(57) or ''))
    fleisch = ' und '.join(x for x in (fe, sa) if x)
    geschmack = ' und '.join(x for x in (su, so) if x)
    if fleisch or geschmack or ar:
        if (var // 3) % 2 == 0:
            teile = []
            if fleisch:
                teile.append(f'war das Fleisch {fleisch}')
            if geschmack:
                teile.append(f'der Geschmack {geschmack}' if teile else f'war der Geschmack {geschmack}')
            if teile:
                s = 'Bei der Verkostung ' + ', '.join(teile) + (f', mit {ar} Aroma' if ar else '')
            else:
                s = f'Bei der Verkostung war das Aroma {AROMA_PRAED[wert(57)]}'
        else:
            teile = []
            if fleisch:
                teile.append(f'Das Fleisch ist {fleisch}')
            if geschmack:
                teile.append(f'im Geschmack {geschmack}' if teile else f'Im Geschmack {geschmack}')
            s = '; '.join(teile)
            if ar:
                s = (s + f', mit {ar} Aroma') if s else f'Das Aroma ist {AROMA_PRAED[wert(57)]}'
        saetze.append(s + '.')

    # Satz 4: Verwendung, Pflückreife, Lagerfähigkeit
    typ = wert(3)
    verw = VERWENDUNG.get(typ or '')
    if typ == 'cider (?)':
        verw = None
    reife = None
    rf = wert(69)
    if rf:
        dek, mon = rf.split(' ', 1)
        reife = f'{DEKADE[dek]} {MONAT[mon]}'
    lager = MONAT.get(wert(72) or '')
    zeit = []
    if reife:
        zeit.append(f'pflückreif {reife}')
    if lager:
        zeit.append(f'lagerfähig bis {lager}')
    if verw or zeit:
        if verw and (var // 6) % 2 == 0:
            s = f'In der Sammlung als {verw} geführt' + ('; ' + ', '.join(zeit) if zeit else '')
        elif verw and zeit:
            s = verw + ', ' + ' und '.join(zeit)
        elif verw:
            s = f'In der Sammlung als {verw} geführt'
        else:
            s = gross(', '.join(zeit))
        saetze.append(s + '.')

    if not saetze:
        return None
    return ' '.join(saetze[:4])

AROMA_PRAED = {'extremely low': 'kaum wahrnehmbar', 'very low': 'sehr schwach', 'low': 'schwach',
               'low to medium': 'schwach bis mittel', 'medium': 'mittel', 'medium to high': 'mittel bis kräftig',
               'high': 'kräftig', 'very high': 'sehr kräftig'}

# ------------------------------------------------------------------ Quellen
QUELLEN = [
    {
        'id': 'nfc2025',
        'werk': 'Characterization and Evaluation data from the National Fruit Collection 2025_Apple',
        'autor': 'Matthew Ordidge; Penny Hale (University of Reading; Fruit Advisory Services Team LLP)',
        'jahr': 2025,
        'url': 'https://doi.org/10.17864/1947.001455',
        'lizenz': 'Open Government Licence v3.0 (© Department for Environment, Food & Rural Affairs; '
                  'https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)',
        'abgerufen': '2026-10-22',
        'anmerkung': 'Datei NFC_C_E_data_Apple_22_08_25.csv (SHA-256 1991326e…e2ae789) und '
                     'README_Ordidge_Apple_2025.txt von https://researchdata.reading.ac.uk/1455/. '
                     'Bewertungen weitgehend nach ECPGR-Deskriptoren für Apfel (2022), erhoben etwa 2000–2024 '
                     'in der National Fruit Collection, Brogdale (Kent). Angaben mit Datenquelle "Smith" sind laut '
                     'README aus Smith (1971) National Apple Register of the United Kingdom standardisiert. '
                     'Im Feld "seite" der Belege steht die Akzessionsnummer, bei Fruchtmerkmalen die Datenquelle '
                     '(Smith 1971 oder NFC-Früchte), bei Verkostungsmerkmalen Prüferin und Datum. '
                     'Namensangabe nach OGL: "Contains public sector information licensed under the Open '
                     'Government Licence v3.0."',
    },
    {
        'id': 'munq2020',
        'werk': 'MUNQ – Malus UNiQue genotype code for grouping apple accessions corresponding to a unique genotypic profile',
        'autor': 'Caroline Denancé; Hélène Muranty; Charles-Eric Durel (INRAE)',
        'jahr': 2020,
        'url': 'https://doi.org/10.15454/HKGMAS',
        'lizenz': 'Etalab Open Licence 2.0',
        'abgerufen': '2026-10-22',
        'anmerkung': 'Datei MUNQ_20200909.txt; nur zur Prüfung von Namenszuordnungen genutzt (Vorzugsnamen je MUNQ), '
                     'nicht als Merkmalsquelle.',
    },
]

# ------------------------------------------------------------------ offene Namenszuordnungen
def offen_schreiben(pfad, kandidaten, munq_abw, gruppen, namensmerge, namenskonflikt):
    z = ['# NFC: offene Namenszuordnungen', '',
         'Stand 22.10.2026, erzeugt von `daten/skripte/nfc_aufbereiten.py`. In diesen Fällen bleibt in '
         '`sorten_nfc.json` der NFC-Name stehen. Eine Übernahme des deutschen Namens braucht einen Beleg '
         '(pomologisches Werk, Sortenliste, Wikipedia-Artikel mit Synonymliste).', '']
    k = sorted({(b, de, m or '', erg, art) for b, de, m, erg, art in kandidaten})
    z += [f'## 1. Deutscher Name vermutet, nicht bestätigt ({len(k)})', '',
          'Der Wikipedia-Artikel zum vermuteten deutschen Namen fehlt oder nennt den NFC-Namen nicht.', '',
          '| NFC-Name | vermuteter deutscher Name | MUNQ | Prüfergebnis |', '|---|---|---|---|']
    z += [f'| {b} | {de} | {m} | {erg}{" (" + art + ")" if art else ""} |' for b, de, m, erg, art in k]
    m = sorted(set(munq_abw), key=lambda x: x[3])
    z += ['', f'## 2. MUNQ-Vorzugsname ist ein deutscher Name, der vom NFC-Namen abweicht ({len(m)})', '',
          'Laut MUNQ-Tabelle (Denancé et al. 2020) gehört die NFC-Akzession genetisch zu einer Sorte, deren '
          'Vorzugsname deutsch ist. Das kann ein echtes Synonym sein oder eine Fehlbenennung in einer der '
          'Sammlungen. Ohne pomologische Prüfung nicht übernommen.', '',
          '| MUNQ | NFC-Namen | MUNQ-Vorzugsname | Name in sorten_nfc.json |', '|---|---|---|---|']
    z += [f'| {a} | {b} | {c} | {d} |' for a, b, c, d in m]
    g = sorted(gruppen, key=lambda x: x[1])
    z += ['', f'## 3. MUNQ-Gruppen mit mehreren NFC-Namen ({len(g)})', '',
          'Nach Vorgabe zusammengefasst (gleiche MUNQ = gleicher Genotyp). Enthalten sind oft Mutanten '
          '(z. B. rote Sports), Klone und Fehlbenennungen. Nur der Sortenname wird geführt; die übrigen Namen '
          'stehen unter `akzessionen`, nicht als Synonyme. Prüfen, ob Mutanten eigene Einträge brauchen.', '',
          '| MUNQ | Name in sorten_nfc.json | weitere NFC-Namen |', '|---|---|---|']
    z += [f'| {a} | {b} | {", ".join(x for x in c if x != b)} |' for a, b, c in g]
    z += ['', '## 4. Gleicher Name, verschiedene MUNQ (nicht zusammengefasst)', '']
    z += [f'- {n}: MUNQ {", ".join(ms)}' for n, ms in namenskonflikt] or ['- keine']
    z += ['', '## 5. Nur über gleichen Namen zusammengefasst (mindestens eine Akzession ohne MUNQ)', '']
    z += [f'- {n}' for n in namensmerge] or ['- keine']
    with open(pfad, 'w', encoding='utf-8') as f:
        f.write('\n'.join(z) + '\n')

if __name__ == '__main__':
    main()
