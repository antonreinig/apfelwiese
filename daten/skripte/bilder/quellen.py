"""Schreibt daten/bilder/quellen.json (Typ Quelle[]) für alle in bilder.json genutzten Sammlungen."""
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import commons as c  # noqa: E402

AB = "2026-10-22"
CAT = "https://commons.wikimedia.org/wiki/Category:"

QUELLEN = [
    {"id": "nfc-commons",
     "werk": "National Fruit Collection, Brogdale (Faversham, Kent): Fruchtfotos der Apfel-Akzessionen auf Wikimedia Commons",
     "autor": "National Fruit Collection (University of Reading / Defra)",
     "url": CAT + "Apples_in_the_National_Fruit_Collection",
     "lizenz": "OGL 2.0 (Open Government Licence v2.0), Lizenz je Datei aus den Commons-Metadaten geprüft",
     "anmerkung": "Akzessionsnummer im Dateinamen. Schnitttafeln (art 'schnitt') zeigen je vier ganze Früchte "
                  "(Seitenansichten, Stiel- und Kelchansicht) und zwei Schnitte (oben rechts Längs-, unten rechts "
                  "Querschnitt) auf grauem Fototisch mit 5-cm-Maßstab; dazu Baum- und Blütenfotos. "
                  "Zwölf Fremd-Uploads ohne NFC-Titelschema (abweichende Lizenzangaben) wurden nicht übernommen."},
    {"id": "usda-pomological",
     "werk": "USDA Pomological Watercolor Collection (Spiegel auf Wikimedia Commons)",
     "autor": "U.S. Department of Agriculture, National Agricultural Library; verschiedene Maler:innen",
     "url": CAT + "USDA_Pomological_Watercolors_of_apples",
     "lizenz": "gemeinfrei",
     "anmerkung": "Aquarelle 1886–1942, Sortenname aus der Commons-Beschreibung ('Image of the … variety'), meist "
                  "ganze Frucht und gemalter Längsschnitt. Tafeln mit Schadbildern ('showing … injury') nicht gemessen. "
                  "Original: https://naldc.nal.usda.gov/usda_pomological_watercolor"},
    {"id": "lauche1883",
     "werk": "Deutsche Pomologie – Äpfel (Chromolithographische Abbildung, Beschreibung und Kulturanweisung)",
     "autor": "Wilhelm Lauche", "jahr": 1882,
     "url": CAT + "Deutsche_Pomologie_-_Aepfel",
     "lizenz": "gemeinfrei",
     "anmerkung": "Erschienen 1882–1883 in Berlin (Parey). Digitalisat der Wageningen University Library, Special "
                  "Collections. Sortenname nach Commons-Beschreibung ('Apple cultivar shown')."},
    {"id": "goethe1894",
     "werk": "Aepfel und Birnen (Farbtafeln, 1894)",
     "autor": "Rudolf Goethe u. a.", "jahr": 1894,
     "url": CAT + "Aepfel_und_Birnen,_1894",
     "lizenz": "gemeinfrei",
     "anmerkung": "Werktitel nach Commons-Kategorie; der genaue Titel des Tafelwerks ist hier nicht geprüft. "
                  "Kompositionen mit Zweigen und Blättern, daher nicht gemessen."},
    {"id": "grebnitzki1906",
     "werk": "Atlas plodov (Атлас плодов)",
     "autor": "Adam Grebnizki (Гребницкий)", "jahr": 1906,
     "url": CAT + "Paintings_of_apples_from_Atlas_of_fruit",
     "lizenz": "gemeinfrei (PD-RusEmpire laut Commons)",
     "anmerkung": "Russische Sortennamen, transliteriert. Farbpalette der GIF-Scans verfälscht, daher nicht gemessen."},
    {"id": "hogg-bull1886",
     "werk": "The Apple and Pear as Vintage Fruits",
     "autor": "Robert Hogg, Henry Graves Bull (Hrsg.)", "jahr": 1886,
     "url": CAT + "The_Apple_%26_pear_as_vintage_fruits",
     "lizenz": "gemeinfrei",
     "anmerkung": "Scans der Biodiversity Heritage Library; Mostobstsorten. Nicht gemessen."},
    {"id": "bunyard1911",
     "werk": "Apples and Pears", "autor": "George Bunyard", "jahr": 1911,
     "url": CAT + "Apples_and_pears_(1911)", "lizenz": "gemeinfrei",
     "anmerkung": "Farbtafeln, nicht gemessen."},
    {"id": "beach1905",
     "werk": "The Apples of New York", "autor": "Spencer Ambrose Beach", "jahr": 1905,
     "url": "https://commons.wikimedia.org/w/index.php?search=%22The+apples+of+New+York+%281905%29%22&ns6=1",
     "lizenz": "gemeinfrei",
     "anmerkung": "Farbtafeln aus den Scans der Biodiversity Heritage Library / Internet Archive, Sortenzuordnung über "
                  "Commons-Sortenkategorien. Nicht gemessen."},
    {"id": "pomologische-monatshefte",
     "werk": "Pomologische Monatshefte (Farbtafeln)", "autor": "Eduard Lucas u. a. (Hrsg.)",
     "url": "https://commons.wikimedia.org/w/index.php?search=%22Pom.Mon.Hefte%22&ns6=1",
     "lizenz": "gemeinfrei",
     "anmerkung": "Tafeln 1855–1905, teils mehrere Sorten je Tafel (dann jeder Sorte zugeordnet, nicht gemessen)."},
    {"id": "pomological-magazine",
     "werk": "The Pomological Magazine", "jahr": 1828,
     "url": "https://commons.wikimedia.org/w/index.php?search=%22The+Pomological+magazine%22&ns6=1",
     "lizenz": "gemeinfrei", "anmerkung": "London 1828–1830, kolorierte Tafeln. Nicht gemessen."},
    {"id": "bivort1853",
     "werk": "Annales de pomologie belge et étrangère", "autor": "Alexandre Bivort u. a.", "jahr": 1853,
     "url": CAT + "Annales_de_pomologie_belge_et_étrangère", "lizenz": "gemeinfrei",
     "anmerkung": "1853–1860. Auf Commons fehlen meist Sortenkategorien; nur so zugeordnete Tafeln übernommen."},
    {"id": "commons-illustrationen",
     "werk": "Weitere Abbildungen in Apfelsorten-Kategorien auf Wikimedia Commons (Bücher, Kataloge, Gemälde, Zeichnungen)",
     "url": CAT + "Apple_cultivars_by_name",
     "lizenz": "je Bild angegeben (gemeinfrei, CC0, CC BY, CC BY-SA)",
     "anmerkung": "Sortenzuordnung über Commons-Sortenkategorien, ungeprüft. Nicht gemessen."},
    {"id": "commons-fotos",
     "werk": "Fotos in Apfelsorten-Kategorien auf Wikimedia Commons",
     "url": CAT + "Apple_cultivars_by_name",
     "lizenz": "je Bild angegeben (CC BY, CC BY-SA, CC0, gemeinfrei)",
     "anmerkung": "Bestimmung des Fotografen, ungeprüft. Feld 'titel' enthält den Originaltitel der Datei. Gemessen "
                  "nur bei ruhigem Hintergrund und klar freigestellter Frucht, und nur für Sorten ohne NFC-, USDA- "
                  "oder Lauche-Bild."},
]


def main():
    genutzt = set()
    bilder = json.load(open(os.path.join(c.PROJEKT, "daten", "bilder", "bilder.json")))
    for s in bilder.values():
        for b in s["bilder"]:
            genutzt.add(b["quelle"])
    out = []
    for q in QUELLEN:
        if q["id"] in genutzt:
            q = dict(q)
            q["abgerufen"] = AB
            out.append(q)
    fehlend = genutzt - {q["id"] for q in out}
    if fehlend:
        raise SystemExit("Quellen ohne Eintrag: %s" % fehlend)
    with open(os.path.join(c.PROJEKT, "daten", "bilder", "quellen.json"), "w") as f:
        json.dump(out, f, ensure_ascii=False, indent=1)
    print(len(out), "Quellen")


if __name__ == "__main__":
    main()
