"""Normalisierung von Sortennamen und gängige deutsche Namen als Alias.

Schlüssel: kleingeschrieben, ä/ö/ü -> ae/oe/ue, ß -> ss, übrige Akzente entfernt,
Apostrophe und Satzzeichen entfernt, Leerzeichen -> Bindestrich.

ALIAS ordnet nur dort einen deutschen Hauptnamen zu, wo die Gleichsetzung in der
Pomologie geläufig und eindeutig ist. Im Zweifel bleibt der Originalname Schlüssel.
"""
import re
import unicodedata


_KYR = dict(zip("абвгдеёжзийклмнопрстуфхцчшщъыьэюя",
                ["a", "b", "v", "g", "d", "e", "e", "zh", "z", "i", "i", "k", "l", "m", "n", "o", "p", "r", "s",
                 "t", "u", "f", "kh", "ts", "ch", "sh", "shch", "", "y", "", "e", "yu", "ya"]))


def norm(name):
    s = name.strip().lower()
    s = "".join(_KYR.get(ch, ch) for ch in s)
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(ch for ch in s if not unicodedata.combining(ch))
    s = re.sub(r"[’'`´ʼ΄]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


# deutscher Hauptschlüssel -> Namensvarianten (beliebige Sprache)
_GRUPPEN = {
    "ananasrenette": ["Ananas Reinette", "Ananasrenette", "Ananas Renette", "Ananasreinette", "Reinette Ananas"],
    "gravensteiner": ["Gravenstein", "Gravensteiner"],
    "roter-gravensteiner": ["Red Gravenstein", "Roter Gravensteiner"],
    "schoener-aus-boskoop": ["Belle de Boskoop", "Schöner aus Boskoop", "Boskoop", "Boskop", "Schoener von Boskoop", "Schone van Boskoop", "Schöne van Boskoop", "Schöner von Boskoop"],
    "roter-boskoop": ["Roter Boskoop", "Red Boskoop", "Boskoop Rouge"],
    "cox-orange": ["Cox's Orange Pippin", "Cox Orange", "Cox Orangenrenette", "Cox Orange Renette", "Cox's Orange"],
    "goldparmaene": ["Goldparmäne", "Wintergoldparmäne", "King of the Pippins", "King of Pippins", "Reine des Reinettes", "Reine de Reinette", "Winter-Goldparmäne"],
    "weisser-klarapfel": ["Weißer Klarapfel", "Weisser Klarapfel", "Klarapfel", "Yellow Transparent", "Transparente Blanche"],
    "kaiser-wilhelm": ["Kaiser Wilhelm"],
    "jakob-lebel": ["Jakob Lebel", "Jacques Lebel"],
    "landsberger-renette": ["Landsberger Reinette", "Landsberger Renette", "Reinette de Landsberg"],
    "kanadarenette": ["Kanadarenette", "Reinette du Canada", "Canada Reinette", "Reinette Blanche du Canada", "Weiße Kanadarenette", "Weisse Kanadarenette", "Canada Blanc", "Kanada Renette", "Kanada-Renette"],
    "baumanns-renette": ["Baumanns Renette", "Baumanns Reinette", "Reinette de Bauman", "Baumann's Reinette"],
    "prinzenapfel": ["Prinzenapfel", "Prinzen"],
    "schoener-aus-nordhausen": ["Schöner aus Nordhausen"],
    "rheinischer-bohnapfel": ["Rheinischer Bohnapfel", "Großer Rheinischer Bohnapfel", "Grosser Rheinischer Bohnapfel", "Bohnapfel", "Großer Bohnapfel"],
    "roter-eiserapfel": ["Roter Eiserapfel"],
    "weisser-winterkalvill": ["Weißer Winterkalvill", "Weisser Winterkalvill", "Calville Blanc d'Hiver", "White Winter Calville", "Calville Blanc"],
    "roter-herbstkalvill": ["Roter Herbstkalvill", "Calville Rouge d'Automne"],
    "charlamowsky": ["Charlamowsky", "Charlamovsky", "Duchess of Oldenburg", "Borovinka", "Borowitzky", "Боровинка"],
    "weisser-astrachan": ["Weißer Astrachan", "Weisser Astrachan", "Weisse Astracan", "White Astrachan"],
    "roter-astrachan": ["Roter Astrachan", "Red Astrachan"],
    "freiherr-von-berlepsch": ["Freiherr von Berlepsch", "Berlepsch", "Goldrenette Freiherr von Berlepsch"],
    "goldrenette-von-blenheim": ["Goldrenette von Blenheim", "Blenheim Orange", "Blenheim Pippin"],
    "grahams-jubilaeumsapfel": ["Grahams Jubiläumsapfel", "Graham's Royal Jubilee", "Grahams Royal Jubilee"],
    "ribston-pepping": ["Ribston Pepping", "Ribston Pippin"],
    "peasgoods-sondergleichen": ["Peasgoods Sondergleichen", "Peasgood's Nonsuch", "Peasgood Nonsuch"],
    "lanes-prinz-albert": ["Lanes Prinz Albert", "Lane's Prince Albert"],
    "allington-pepping": ["Allington Pepping", "Allington Pippin"],
    "champagner-renette": ["Champagner Renette", "Champagner Reinette", "Reinette de Champagne"],
    "coulons-renette": ["Coulons Renette", "Reinette Coulon", "Coulons Reinette", "Coulon's Reinette"],
    "orleans-renette": ["Orleans Renette", "Orleansrenette", "Reinette d'Orléans", "Orleans Reinette", "Orléans Reinette"],
    "harberts-renette": ["Harberts Renette", "Harberts Reinette"],
    "biesterfelder-renette": ["Biesterfelder Renette", "Biesterfelder Reinette"],
    "edelborsdorfer": ["Edelborsdorfer", "Edler Winterborsdorfer", "Borsdorfer"],
    "gelber-edelapfel": ["Gelber Edelapfel", "Golden Noble"],
    "geheimrat-dr-oldenburg": ["Geheimrat Dr. Oldenburg", "Geheimrat Oldenburg", "Geheimrat Doktor Oldenburg"],
    "zuccalmaglios-renette": ["Zuccalmaglios Renette", "Zuccalmaglio", "Zuccalmaglios Reinette"],
    "rheinischer-winterrambur": ["Rheinischer Winterrambur", "Winterrambur"],
    "bismarckapfel": ["Bismarckapfel", "Bismarck"],
    "transparent-von-croncels": ["Transparent von Croncels", "Transparente de Croncels", "Croncels"],
    "schoener-von-herrnhut": ["Schöner von Herrnhut"],
    "weisser-wintertaffetapfel": ["Weißer Wintertaffetapfel", "Weisser Wintertaffetapfel", "Wintertaffet"],
    "adersleber-kalvill": ["Adersleber Kalvill", "Adersleber Calville"],
    "koeniglicher-kurzstiel": ["Königlicher Kurzstiel", "Court Pendu Plat", "Court-Pendu Plat", "Court pendu Plat"],
    "kaiser-alexander": ["Kaiser Alexander", "Aport", "Emperor Alexander"],
    "boikenapfel": ["Boikenapfel", "Boiken"],
    "winterbananenapfel": ["Winterbananenapfel", "Winter Banana"],
    "gelber-bellefleur": ["Gelber Bellefleur", "Yellow Bellflower", "Belle Fleur Jaune"],
    "schoener-aus-bath": ["Schöner aus Bath", "Beauty of Bath"],
    "pfirsichroter-sommerapfel": ["Pfirsichroter Sommerapfel"],
    "purpurroter-cousinot": ["Purpurroter Cousinot"],
    "roter-trierer-weinapfel": ["Roter Trierer Weinapfel"],
    "duelmener-rosenapfel": ["Dülmener Rosenapfel", "Dülmener Herbstrosenapfel"],
    "alantapfel": ["Alantapfel", "Alant"],
    "geflammter-kardinal": ["Geflammter Kardinal", "Geflammter Cardinal"],
}

ALIAS = {}
for haupt, varianten in _GRUPPEN.items():
    for v in varianten + [haupt]:
        ALIAS[norm(v)] = haupt


def schluessel(name):
    n = norm(name)
    return ALIAS.get(n, n)


def kategorie_zu_name(kat):
    """'Category:Alant (apple)' -> 'Alant'; "Malus domestica 'X'" -> 'X'."""
    k = kat.split(":", 1)[-1].strip()
    m = re.match(r"^Malus(?: domestica| pumila)?\s*[׳'‘’΄]\s*(.+?)\s*[׳'‘’΄]\s*$", k)
    if m:
        return m.group(1)
    k = re.sub(r"\s*\((?:apple|apples|apple cultivar|cultivar|Malus domestica)\)\s*$", "", k, flags=re.I)
    k = re.sub(r" apple$", "", k)  # 'Haralson apple' -> 'Haralson' (nur klein geschrieben)
    k = k.strip("'΄ ")
    return k
