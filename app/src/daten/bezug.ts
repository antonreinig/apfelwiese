// Belegte Angaben für „Alte Sorten bekommen und erhalten“ und die Kaufhinweise im Ratgeber.
// Grundlage: daten/ratgeber/recherche-bezug.md, alle Seiten abgerufen am 23.10.2026.
// Termine, Gebühren und Förderprogramme ändern sich: immer mit Stand nennen.

export const STAND_BEZUG = '23.10.2026'

export interface Link { titel: string; url: string }

export const L = {
  pvGruppen: { titel: 'Pomologen-Verein: Landes- und Regionalgruppen', url: 'https://www.pomologen-verein.de/landes-und-regionalgruppen/' },
  pvFaq: { titel: 'Pomologen-Verein: Fragen und Antworten', url: 'https://www.pomologen-verein.de/fragen-antworten-faq/' },
  pvSeminare: { titel: 'Pomologen-Verein: Seminare', url: 'https://www.pomologen-verein.de/seminare/' },
  pvMitglied: { titel: 'Pomologen-Verein: Mitglied werden', url: 'https://www.pomologen-verein.de/mitglied-werden/' },
  pvSorteDesJahres: { titel: 'Pomologen-Verein: Obstsorte des Jahres', url: 'https://www.pomologen-verein.de/obstsorte-des-jahres/' },
  pvShop: { titel: 'Pomologen-Verein: Regionale Sortenbroschüren', url: 'https://shop.pomologen-verein.de/' },
  erhalter: { titel: 'Erhalternetzwerk Obstsortenvielfalt', url: 'https://www.obstsortenerhalt.de/' },
  erhalterBoerse: { titel: 'Erhalternetzwerk: Sortenbörse', url: 'https://www.obstsortenerhalt.de/index.php/sortenboerse' },
  erhalterBedingungen: { titel: 'Erhalternetzwerk: Bedingungen der Reiserabgabe', url: 'https://www.obstsortenerhalt.de/index.php/service/reiserabgabe/bedingungen' },
  dgo: { titel: 'Deutsche Genbank Obst: Materialabgaben', url: 'https://www.deutsche-genbank-obst.de/einfuehrung/zugangsbedingungen' },
  nabuBaumschulen: { titel: 'NABU: Baumschulen mit Hochstämmen nach Bundesländern', url: 'https://www.nabu.de/natur-und-landschaft/landnutzung/streuobst/service-und-adressen/12512.html' },
  hochstamm: { titel: 'Hochstamm Deutschland e. V.', url: 'https://www.hochstamm-deutschland.de/' },
  lwgUnterlagen: { titel: 'LWG Bayern: Veredlungsunterlagen von Obstgehölzen', url: 'https://www.lwg.bayern.de/mam/cms06/gartenakademie/dateien/3101_-_veredlungsunterlagen_von_obstgehoelzen.pdf' },
  lwgPflanzzeit: { titel: 'LWG Bayern: Die ideale Pflanzzeit', url: 'https://www.lwg.bayern.de/mam/cms06/gartenakademie/dateien/infoschrift_ideale_pflanzzeit.pdf' },
  lwgStreuobst: { titel: 'LWG Bayern: Bewährte Apfelsorten für den Streuobstanbau', url: 'https://www.lwg.bayern.de/mam/cms06/gartenakademie/dateien/3151_info_bf.pdf' },
  lwgHausgarten: { titel: 'LWG Bayern: Apfelsorten für Haus- und Kleingarten', url: 'https://lwg.bayern.de/mam/cms06/gartenakademie/dateien/3162_a_apfelsorten_bf.pdf' },
  stuttgartPflanzung: { titel: 'Stadt Stuttgart, Obstbauberatung: Pflanzung von Hochstämmen', url: 'https://www.stuttgart.de/medien/ibs/obstbaumpflanzung-hochstamm22.pdf' },
  bayernFoerderung: { titel: 'BayernPortal: Streuobst für alle!', url: 'https://www.bayernportal.de/dokumente/leistung/0204248953182' },
  bwSchnitt: { titel: 'Land Baden-Württemberg: Baumschnittförderung', url: 'https://www.baden-wuerttemberg.de/de/service/presse/pressemitteilung/pid/land-fuehrt-baumschnittfoerderung-fort' },
  bwSortengaerten: { titel: 'Obstsorten in Baden-Württemberg: Gärten- und Sortensuche', url: 'https://www.obstsorten-bw.de/' },
  shEmpfehlung: { titel: 'Pomologen-Verein SH/HH: Sortenempfehlungen (Stand 29.04.2026)', url: 'https://www.pomologen-verein.de/media/user_upload/Landesgruppen/SH-HH/Obstgehoelze_Empfehlungen_fuer_Schleswig-Holstein_und_Hamburg.pdf' },
  apfeltageHH: { titel: 'Norddeutsche Apfeltage im Loki-Schmidt-Garten', url: 'https://www.botanischer-garten.uni-hamburg.de/veranstaltungen/apfeltage.html' },
  reiserHH: { titel: 'Hamburger Edelreiser-Tauschbörse (Botanischer Sondergarten Wandsbek)', url: 'https://www.hamburg.de/politik-und-verwaltung/bezirke/wandsbek/themen/umwelt-natur-und-klimaschutz/botanischer-sondergarten/gartenwissen/tauschangebote' },
  appelwisch: { titel: 'BUND Hamburg: Streuobstwiese Appelwisch', url: 'https://www.bund-hamburg.de/themen/naturschutz/streuobstwiesen/streuobstwiese-appelwisch/' },
  haseldorf: { titel: 'Elbmarschenhaus: Obstgarten Haseldorf', url: 'https://elbmarschenhaus.de/startseite/naturschutz/naturvielfalt/obstgarten-haseldorf/' },
  boomgarden: { titel: 'Pomologen-Verein: Regionalgruppe Boomgarden (Helmste)', url: 'https://www.pomologen-verein.de/landes-und-regionalgruppen/rg-boomgarden' },
  pvTermine: { titel: 'Pomologen-Verein: Termine', url: 'https://www.pomologen-verein.de/termine/' },
  bergstrasse: { titel: 'hessenschau: Obstbaumprojekt Kreis Bergstraße', url: 'https://www.hessenschau.de/panorama/kreis-bergstrasse-bringt-heimische-obstbaeume-unter-die-leute-zum-einkaufspreis-v1,obstbaumprojekt-bergstrasse-100.html' },
} satisfies Record<string, Link>

const PV = 'https://www.pomologen-verein.de/landes-und-regionalgruppen/'

/** Zuständige Landesgruppe des Pomologen-Vereins je Bundesland */
export const LANDESGRUPPE: Record<string, Link> = {
  'DE-BW': { titel: 'Landesgruppe Baden-Württemberg', url: `${PV}lg-baden-wuerttemberg` },
  'DE-BY': { titel: 'Landesgruppe Bayern', url: `${PV}bayern` },
  'DE-BE': { titel: 'Landesgruppe Brandenburg/Berlin', url: `${PV}lg-brandenburg-berlin` },
  'DE-BB': { titel: 'Landesgruppe Brandenburg/Berlin', url: `${PV}lg-brandenburg-berlin` },
  'DE-HE': { titel: 'Landesgruppe Hessen', url: `${PV}lg-hessen` },
  'DE-MV': { titel: 'Landesgruppe Mecklenburg-Vorpommern', url: `${PV}lg-mecklenburg-vorpommern` },
  'DE-NI': { titel: 'Landesgruppe Niedersachsen/Bremen', url: `${PV}lg-niedersachsen-bremen` },
  'DE-HB': { titel: 'Landesgruppe Niedersachsen/Bremen', url: `${PV}lg-niedersachsen-bremen` },
  'DE-NW': { titel: 'Landesgruppe Nordrhein-Westfalen', url: `${PV}lg-nordrhein-westfalen` },
  'DE-RP': { titel: 'Landesgruppe Rheinland-Pfalz/Saarland/Luxemburg', url: `${PV}lg-rheinland-pfalz-saarland-luxemburg` },
  'DE-SL': { titel: 'Landesgruppe Rheinland-Pfalz/Saarland/Luxemburg', url: `${PV}lg-rheinland-pfalz-saarland-luxemburg` },
  'DE-SN': { titel: 'Landesgruppe Sachsen', url: `${PV}lg-sachsen` },
  'DE-ST': { titel: 'Landesgruppe Sachsen-Anhalt', url: `${PV}lg-sachsen-anhalt` },
  'DE-SH': { titel: 'Landesgruppe Schleswig-Holstein/Hamburg', url: `${PV}lg-schleswig-holstein-hamburg` },
  'DE-HH': { titel: 'Landesgruppe Schleswig-Holstein/Hamburg', url: `${PV}lg-schleswig-holstein-hamburg` },
  'DE-TH': { titel: 'Landesgruppe Thüringen', url: `${PV}lg-thueringen` },
}

/** Belegte regionale Angebote je Bundesland (Auswahl, Stand 23.10.2026) */
export const REGIONAL: Record<string, { text: string; link: Link }[]> = {
  'DE-HH': [
    { text: 'Norddeutsche Apfeltage im Loki-Schmidt-Garten (Klein Flottbek), jedes Jahr am letzten Septemberwochenende: große Apfel- und Birnenausstellung, Sortenbestimmung durch die Landesgruppe.', link: L.apfeltageHH },
    { text: 'Edelreiser-Tauschbörse im Botanischen Sondergarten Wandsbek im Februar oder März; Reiser unbekannter Sorten kommen in die „Ecke der Namenlosen“.', link: L.reiserHH },
    { text: 'Appelwisch in Sasel: rund 200 Apfelbäume mit über 100 Sorten, vom Pomologen-Verein als Archiv geretteter Sorten geführt. Pflegeeinsätze und Kurse beim BUND.', link: L.appelwisch },
    { text: 'Obstgarten Haseldorf in der Elbmarsch: über 180 alte, lokale Obstsorten, jederzeit zugänglich.', link: L.haseldorf },
    { text: 'Sortenempfehlung der Landesgruppe für Schleswig-Holstein und Hamburg mit 61 Apfelsorten, Blütezeit und Pollenqualität.', link: L.shEmpfehlung },
  ],
  'DE-SH': [
    { text: 'Sortenempfehlung der Landesgruppe für Schleswig-Holstein und Hamburg mit 61 Apfelsorten, Blütezeit und Pollenqualität.', link: L.shEmpfehlung },
    { text: 'Obstgarten Haseldorf in der Elbmarsch: über 180 alte, lokale Obstsorten, jederzeit zugänglich.', link: L.haseldorf },
    { text: 'Norddeutsche Apfeltage in Hamburg, jedes Jahr am letzten Septemberwochenende, mit Sortenbestimmung.', link: L.apfeltageHH },
  ],
  'DE-NI': [
    { text: 'Regionalgruppe Boomgarden in Helmste (Landkreis Stade): Sammlung alter, vor allem regionaler Sorten seit 1985.', link: L.boomgarden },
    { text: 'Norddeutsche Apfeltage in Hamburg, jedes Jahr am letzten Septemberwochenende, mit Sortenbestimmung.', link: L.apfeltageHH },
  ],
  'DE-HB': [
    { text: 'Norddeutsche Apfeltage in Hamburg, jedes Jahr am letzten Septemberwochenende, mit Sortenbestimmung.', link: L.apfeltageHH },
  ],
  'DE-BY': [
    { text: 'Förderprogramm „Streuobst für alle!“: Bäume auf Sämlingsunterlage, gebündelt bestellt über Vereine, Verbände oder Gemeinden. Frag dort nach.', link: L.bayernFoerderung },
    { text: 'Sortenliste der Landesanstalt (LWG) für den Streuobstanbau, getrennt nach rauen und warmen Lagen.', link: L.lwgStreuobst },
  ],
  'DE-BW': [
    { text: 'Gärten- und Sortensuche: in welchem Sorten- oder Lehrgarten eine Sorte wächst.', link: L.bwSortengaerten },
    { text: 'Baumschnittförderung für Streuobstbäume, auch für Privatleute (2026 bis 2028, unter Vorbehalt).', link: L.bwSchnitt },
  ],
  'DE-HE': [
    { text: 'Hessische Pomologentage in Naumburg, Ende Oktober.', link: L.pvTermine },
    { text: 'Sammelbestellungen heimischer Hochstämme, zum Beispiel im Kreis Bergstraße (Bestellung im Spätsommer, Ausgabe im November).', link: L.bergstrasse },
  ],
}
