"""Kandidaten für deutsche Sortennamen der NFC-Akzessionen und Prüfung gegen die deutschsprachige
Wikipedia: Der Artikel zum deutschen Namen muss den NFC-Namen (oder eine eindeutig gleiche
Schreibweise) nennen. Rohantworten der API werden in daten/roh/wikipedia_namen/ abgelegt.

Aufruf: python3 -I nfc_namen_kandidaten.py <rohordner> <ausgabe.tsv>
"""
import json, sys, os, re, time, unicodedata, urllib.parse, urllib.request, urllib.error

# (NFC-Grundname, deutscher Name, Wikipedia-Artikel(e), Art)
# Art: 'uebersetzung' = anderer Name; 'schreibweise' = nur Umlaute/Schreibung ergänzt
KANDIDATEN = [
    ("Ananas Reinette", "Ananasrenette", ["Ananasrenette", "Ananas-Renette"], "uebersetzung"),
    ("Gravenstein", "Gravensteiner", ["Gravensteiner"], "uebersetzung"),
    ("Belle de Boskoop", "Schöner aus Boskoop", ["Schöner aus Boskoop", "Boskoop (Apfel)"], "uebersetzung"),
    ("Cox's Orange Pippin", "Cox Orange", ["Cox Orange", "Cox’s Orange Pippin"], "uebersetzung"),
    ("Reinette de Champagne", "Champagner Renette", ["Champagner Renette", "Champagner-Renette"], "uebersetzung"),
    ("Reinette Rouge Etoilee", "Rote Sternrenette", ["Rote Sternrenette", "Rote Sternreinette"], "uebersetzung"),
    ("Jacques Lebel", "Jakob Lebel", ["Jakob Lebel"], "uebersetzung"),
    ("King of the Pippins", "Goldparmäne", ["Goldparmäne"], "uebersetzung"),
    ("Goldparmane", "Goldparmäne", ["Goldparmäne"], "schreibweise"),
    ("Duchess of Oldenburg", "Charlamowsky", ["Charlamowsky"], "uebersetzung"),
    ("White Transparent", "Weißer Klarapfel", ["Weißer Klarapfel", "Klarapfel"], "uebersetzung"),
    ("Calville Blanc d'Hiver", "Weißer Winterkalvill", ["Weißer Winterkalvill", "Weißer Winter-Calvill"], "uebersetzung"),
    ("Calville Rouge d'Hiver", "Roter Winterkalvill", ["Roter Winterkalvill", "Roter Winter-Calvill"], "uebersetzung"),
    ("Blenheim Orange", "Goldrenette von Blenheim", ["Goldrenette von Blenheim"], "uebersetzung"),
    ("Baumann's Reinette", "Baumanns Renette", ["Baumanns Renette", "Baumanns Reinette"], "uebersetzung"),
    ("Reinette Coulon", "Coulons Renette", ["Coulons Renette"], "uebersetzung"),
    ("Landsberger Reinette", "Landsberger Renette", ["Landsberger Renette"], "uebersetzung"),
    ("Harberts Reinette", "Harberts Renette", ["Harberts Renette"], "uebersetzung"),
    ("Von Zuccalmaglios Renette", "Zuccalmaglios Renette", ["Zuccalmaglios Renette", "Zuccalmaglio-Renette"], "uebersetzung"),
    ("Orleans Reinette", "Orleans-Renette", ["Orleans-Renette", "Orléans-Renette", "Orleansrenette"], "uebersetzung"),
    ("Zabergau Renette", "Zabergäu-Renette", ["Zabergäu-Renette", "Zabergäurenette"], "schreibweise"),
    ("Ribston Pippin", "Ribston Pepping", ["Ribston Pepping"], "uebersetzung"),
    ("Peasgood's Nonsuch", "Peasgoods Sondergleichen", ["Peasgoods Sondergleichen", "Peasgood’s Nonsuch"], "uebersetzung"),
    ("Worcester Pearmain", "Worcester Parmäne", ["Worcester Parmäne", "Worcester-Parmäne"], "uebersetzung"),
    ("Adams's Pearmain", "Adams Parmäne", ["Adams Parmäne", "Adams-Parmäne"], "uebersetzung"),
    ("Winter Banana", "Winterbananenapfel", ["Winterbananenapfel"], "uebersetzung"),
    ("Rome Beauty", "Morgenduft", ["Morgenduft (Apfel)", "Morgenduft"], "uebersetzung"),
    ("Red Astrachan", "Roter Astrachan", ["Roter Astrachan"], "uebersetzung"),
    ("Court Pendu Plat", "Königlicher Kurzstiel", ["Königlicher Kurzstiel"], "uebersetzung"),
    ("Holstein", "Holsteiner Cox", ["Holsteiner Cox"], "uebersetzung"),
    ("Bismarck", "Bismarckapfel", ["Bismarckapfel"], "uebersetzung"),
    ("Boiken", "Boikenapfel", ["Boikenapfel"], "uebersetzung"),
    ("Bohnapfel", "Rheinischer Bohnapfel", ["Rheinischer Bohnapfel"], "uebersetzung"),
    ("Berner Rosen", "Berner Rosenapfel", ["Berner Rosenapfel", "Berner Rosen"], "uebersetzung"),
    ("Dulmener Rosenapfel", "Dülmener Rosenapfel", ["Dülmener Rosenapfel"], "schreibweise"),
    ("Schoner aus Herrnhut", "Schöner aus Herrnhut", ["Schöner aus Herrnhut"], "schreibweise"),
    ("Schoner von Nordhausen", "Schöner von Nordhausen", ["Schöner von Nordhausen"], "schreibweise"),
    ("Prinz Albrecht von Preussen", "Prinz Albrecht von Preußen", ["Prinz Albrecht von Preußen (Apfel)", "Prinz Albrecht von Preußen"], "schreibweise"),
    ("Prinzen Apfel", "Prinzenapfel", ["Prinzenapfel"], "schreibweise"),
    ("Finkenwerder Prinz", "Finkenwerder Herbstprinz", ["Finkenwerder Herbstprinz"], "uebersetzung"),
    ("Spatbluhender Taffetapfel", "Spätblühender Taffetapfel", ["Spätblühender Taffetapfel"], "schreibweise"),
    ("Weisser Winter Taffetapfel", "Weißer Wintertaffetapfel", ["Weißer Wintertaffetapfel", "Weißer Winter-Taffetapfel"], "schreibweise"),
    ("Gelber Munsterlander Borsdorfer", "Gelber Münsterländer Borsdorfer", ["Gelber Münsterländer Borsdorfer"], "schreibweise"),
    ("Roter Munsterlander Borsdorfer", "Roter Münsterländer Borsdorfer", ["Roter Münsterländer Borsdorfer"], "schreibweise"),
    ("Altlander Pfannkuchenapfel", "Altländer Pfannkuchenapfel", ["Altländer Pfannkuchenapfel"], "schreibweise"),
    ("Altlander Rosenapfel", "Altländer Rosenapfel", ["Altländer Rosenapfel"], "schreibweise"),
    ("Altlander Fettapfel", "Altländer Fettapfel", ["Altländer Fettapfel"], "schreibweise"),
    ("Horneburger Pfannkuchen", "Horneburger Pfannkuchenapfel", ["Horneburger Pfannkuchenapfel"], "schreibweise"),
    ("Gustav's Dauerapfel", "Gustavs Dauerapfel", ["Gustavs Dauerapfel"], "schreibweise"),
    ("Halberstadter Jungfernapfel", "Halberstädter Jungfernapfel", ["Halberstädter Jungfernapfel"], "schreibweise"),
    ("Konigin Sophiensapfel", "Königin Sophienapfel", ["Königin Sophienapfel", "Königin Sophiensapfel"], "schreibweise"),
    ("Rhode Island Greening", "Grünling von Rhode Island", ["Grünling von Rhode Island", "Rhode Island Greening"], "uebersetzung"),
    ("Reinette du Canada", "Kanadarenette", ["Kanadarenette", "Weiße Kanadarenette"], "uebersetzung"),
    ("Schweizer Orange", "Schweizer Orangenapfel", ["Schweizer Orangenapfel"], "uebersetzung"),
    ("Jubile d'Argovie", "Aargauer Jubiläumsapfel", ["Aargauer Jubiläumsapfel"], "uebersetzung"),
    ("Lane's Prince Albert", "Lanes Prinz Albert", ["Lanes Prinz Albert", "Lane’s Prince Albert"], "uebersetzung"),
    ("Manks Codlin", "Manks Küchenapfel", ["Manks Küchenapfel"], "uebersetzung"),
    ("Golden Noble", "Gelber Edelapfel", ["Gelber Edelapfel"], "uebersetzung"),
    ("Weisses Seidenhemdchen", "Weißes Seidenhemdchen", ["Weißes Seidenhemdchen"], "schreibweise"),
    ("Wilkenburger Herbstreinette", "Wilkenburger Herbstrenette", ["Wilkenburger Herbstrenette", "Wilkenburger Herbstreinette"], "schreibweise"),
    ("Weidners Goldreinette", "Weidners Goldrenette", ["Weidners Goldrenette", "Weidners Goldreinette"], "schreibweise"),
    ("Schmidtbergers Rote Reinette", "Schmidtbergers Rote Renette", ["Schmidtbergers Rote Renette", "Schmidtbergers Renette"], "schreibweise"),
    ("Burchardt's Reinette", "Burchardts Renette", ["Burchardts Renette", "Burchardts Reinette"], "schreibweise"),
    ("Heusgen's Golden Reinette", "Heusgens Goldrenette", ["Heusgens Goldrenette", "Peter Heusgens Goldrenette", "Heusgens Golden Reinette"], "uebersetzung"),
    ("Neue Goldparmane", "Neue Goldparmäne", ["Neue Goldparmäne"], "schreibweise"),
    ("Brabant Bellefleur", "Brabanter Bellefleur", ["Brabanter Bellefleur"], "uebersetzung"),
    ("Alexander", "Kaiser Alexander", ["Kaiser Alexander (Apfel)", "Kaiser Alexander"], "uebersetzung"),
    ("Transparente de Croncels", "Croncels", ["Croncels", "Transparent von Croncels", "Transparente de Croncels"], "uebersetzung"),
    ("London Pippin", "Londoner Pepping", ["Londoner Pepping"], "uebersetzung"),
    ("Mother", "Mutterapfel", ["Mutterapfel", "Amerikanischer Mutterapfel"], "uebersetzung"),
    ("Parker's Pippin", "Parkers Pepping", ["Parkers Pepping"], "uebersetzung"),
    ("Cox's Pomona", "Cox' Pomona", ["Cox’ Pomona", "Cox' Pomona", "Cox Pomona"], "uebersetzung"),
    ("Krugers Dickstiel", "Krügers Dickstiel", ["Krügers Dickstiel"], "schreibweise"),
    ("Gewurzluiken", "Gewürzluiken", ["Gewürzluiken"], "schreibweise"),
    ("Brettacher Samling", "Brettacher", ["Brettacher"], "uebersetzung"),
    ("Royal Jubilee", "Grahams Jubiläumsapfel", ["Grahams Jubiläumsapfel"], "uebersetzung"),
    ("Osnabrucker Reinette", "Osnabrücker Renette", ["Osnabrücker Renette", "Osnabrücker Reinette"], "schreibweise"),
    ("Gruner Calviner", "Grüner Calviner", ["Grüner Calviner"], "schreibweise"),
    ("Geheimrat Doktor Oldenburg", "Geheimrat Dr. Oldenburg", ["Geheimrat Dr. Oldenburg", "Geheimrat Doktor Oldenburg"], "schreibweise"),
    ("Laxton's Superb", "Laxtons Superb", ["Laxtons Superb"], "schreibweise"),
    ("Kaiser Wilhelm", "Kaiser Wilhelm", ["Kaiser Wilhelm (Apfel)"], "gleich"),
    ("Roter Eiserapfel", "Roter Eiserapfel", ["Roter Eiserapfel"], "gleich"),
]

def norm(s):
    s = unicodedata.normalize('NFKD', s).encode('ascii', 'ignore').decode().lower()
    s = s.replace('oe', 'o').replace('ae', 'a').replace('ue', 'u').replace('ss', 's')
    return re.sub(r'[^a-z0-9]', '', s)

def holen(titel, ordner):
    datei = os.path.join(ordner, re.sub(r'[^A-Za-z0-9]+', '_', unicodedata.normalize('NFKD', titel).encode('ascii', 'ignore').decode()) + '.json')
    if not os.path.exists(datei):
        url = 'https://de.wikipedia.org/w/api.php?' + urllib.parse.urlencode(
            {'action': 'parse', 'page': titel, 'prop': 'wikitext', 'format': 'json', 'redirects': 1})
        req = urllib.request.Request(url, headers={'User-Agent': 'Apfelwiese-Namenspruefung/0.1 (+https://apfelwiese.app/#/impressum)'})
        for versuch in range(6):
            try:
                with urllib.request.urlopen(req, timeout=30) as r:
                    daten = r.read()
                break
            except urllib.error.HTTPError as e:
                if e.code != 429 or versuch == 5:
                    raise
                time.sleep(10 * (versuch + 1))
        with open(datei, 'wb') as f:
            f.write(daten)
        time.sleep(2)
    with open(datei, encoding='utf-8') as f:
        j = json.load(f)
    if 'parse' not in j:
        return None, None
    return j['parse']['title'], j['parse']['wikitext']['*']

def main():
    ordner, aus = sys.argv[1], sys.argv[2]
    with open(aus, 'w', encoding='utf-8') as out:
        out.write('nfc_name\tdeutscher_name\tart\tergebnis\tartikel\n')
        for nfc, de, artikel, art in KANDIDATEN:
            ergebnis, gefunden = 'kein_artikel', ''
            for a in artikel:
                titel, text = holen(a, ordner)
                if not titel:
                    continue
                gefunden = titel
                nt = norm(text)
                # NFC-Name im Artikel? (Apostrophe, Umlaute, Bindestriche ignoriert)
                if norm(nfc) in nt:
                    ergebnis = 'bestaetigt'
                    break
                # zweiter Versuch: NFC-Name ohne "s" am Genitiv bzw. ohne Bindestrich
                if norm(nfc.replace("'s", 's').replace("'", '')) in nt:
                    ergebnis = 'bestaetigt'
                    break
                ergebnis = 'artikel_ohne_nfc_namen'
            out.write(f'{nfc}\t{de}\t{art}\t{ergebnis}\t{gefunden}\n')

main()
