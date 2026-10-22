import type { ReactNode } from 'react'
import { zurueck } from '../ui/router.ts'
import { Zurueck } from '../ui/symbole.tsx'

// Impressum, Datenschutzhinweise und Nutzungsbedingungen. Stand der Texte: TEXT_VERSION in konto.ts.

const STAND = '22. Oktober 2026'

function Rahmen({ titel, children }: { titel: string; children: ReactNode }) {
  return (
    <div className="seite rechtstext">
      <button className="rund-knopf" onClick={() => zurueck('/info')} aria-label="Zurück"><Zurueck /></button>
      <h1 className="name" style={{ fontSize: 40, marginTop: 8 }}>{titel}</h1>
      <p className="sehr-klein">Stand: {STAND}</p>
      <hr className="doppellinie" />
      {children}
    </div>
  )
}

const H = ({ children }: { children: ReactNode }) => <h2 className="kapitaelchen" style={{ fontSize: 17, marginTop: 22 }}>{children}</h2>

export function ImpressumSeite() {
  return (
    <Rahmen titel="Impressum">
      <H>Anbieter</H>
      <p>Anton Reinig<br />Loki-Schmidt-Platz 19<br />22297 Hamburg</p>
      <H>Kontakt</H>
      <p>E-Mail: <a href="mailto:anton.reinig@gmail.com">anton.reinig@gmail.com</a><br />Oder über „Rückmeldung geben“ in der App.</p>
      <H>Verantwortlich für den Inhalt</H>
      <p>Anton Reinig, Anschrift wie oben.</p>
      <H>Hinweis</H>
      <p>Die Apfelwiese ist ein privates, nicht kommerzielles Projekt in der Erprobung. Die Sortenvorschläge der App sind Hilfen zur Bestimmung und keine verbindliche Sortenbestimmung.</p>
      <p>Für Inhalte verlinkter fremder Seiten sind deren Betreiber verantwortlich. Die Quellen der Sortenbeschreibungen und Bilder sind in der App bei jedem Wert und unter „Über die App“ genannt.</p>
    </Rahmen>
  )
}

export function DatenschutzSeite() {
  return (
    <Rahmen titel="Datenschutz">
      <p>Hier steht, welche personenbezogenen Daten die Apfelwiese verarbeitet, wozu, auf welcher Rechtsgrundlage, wie lange und an wen sie dabei gehen.</p>

      <H>1. Verantwortlicher</H>
      <p>Anton Reinig, Loki-Schmidt-Platz 19, 22297 Hamburg, <a href="mailto:anton.reinig@gmail.com">anton.reinig@gmail.com</a>. Einen Datenschutzbeauftragten gibt es nicht; dazu besteht keine Pflicht.</p>

      <H>2. Ohne Konto: Sorten ansehen</H>
      <p>Die Sortendatenbank kannst du ohne Anmeldung nutzen. Dabei verarbeitet der Hoster technisch notwendige Zugriffsdaten (Abschnitt 8). Sortenbilder von Wikimedia Commons und Seiten alter Pomologien aus dem Internet Archive holt unser Server ab und reicht sie an die App weiter. Wikimedia Foundation und Internet Archive erhalten dabei nur den Dateinamen und die Adresse unseres Servers, keine Daten von dir.</p>

      <H>3. Konto und Anmeldung</H>
      <p><b>Daten:</b> E-Mail-Adresse, eine zufällige Kontokennung, Zeitpunkt der Anlage, Protokoll deiner Zustimmungen und Einwilligungen (Zeitpunkt, Textfassung). Für die Anmeldung wird ein einmaliger Code samt Anmeldelink erzeugt. Gespeichert werden dazu deine E-Mail-Adresse und Prüfwerte (Hashes) von Code und Link. Sie gelten 15 Minuten und werden nach der Anmeldung gelöscht, sonst spätestens nach zwei Stunden.</p>
      <p><b>Zweck und Rechtsgrundlage:</b> Bereitstellung deines Kontos und Speicherung deiner Bäume (Art. 6 Abs. 1 lit. b DSGVO). Das Protokoll der Einwilligungen dient dem Nachweis nach Art. 7 Abs. 1 DSGVO (Art. 6 Abs. 1 lit. c DSGVO).</p>
      <p><b>Missbrauchsschutz:</b> Um massenhafte Anmeldeversuche, Uploads und Nachrichten zu verhindern, speichern wir Zeitstempel der Anfragen zusammen mit einem mit geheimem Schlüssel gebildeten Prüfwert (Hash) der IP-Adresse, der E-Mail-Adresse bzw. der Kontokennung. Diese Zähler werden spätestens nach 26 Stunden gelöscht (Art. 6 Abs. 1 lit. f DSGVO; berechtigtes Interesse: Schutz vor Missbrauch und Kosten).</p>
      <p><b>Anmeldecookie:</b> Nach der Anmeldung setzt der Server ein Cookie „aw_sitzung“ (HttpOnly, nur für die Adressen unter /api, 90 Tage gültig). Es ist für den von dir gewünschten Dienst unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Weitere Cookies gibt es nicht.</p>
      <p><b>Versand der Anmeldemail:</b> über Resend (Plus Five Five, Inc., 2261 Market Street #5039, San Francisco, CA 94114, USA) als Auftragsverarbeiter. Resend verarbeitet deine E-Mail-Adresse und den Inhalt der Anmeldemail und speichert nach eigenen Angaben Versanddaten und Protokolle in den USA, im kostenlosen Tarif nach Angabe auf der Preisseite 30 Tage. Resend gibt an, nach dem EU-US Data Privacy Framework zertifiziert zu sein (Angemessenheitsbeschluss, Art. 45 DSGVO); zusätzlich gelten Standardvertragsklauseln.</p>

      <H>4. Deine Bäume, Fotos und Standorte</H>
      <p><b>Daten:</b> Fotos deiner Äpfel und daraus berechnete Bilder (entzerrtes Blatt, freigestellte Äpfel), Messwerte, Namen und Notizen zu Bäumen, deine Angaben zu Merkmalen, Bestimmungen und – wenn du ihn erfasst – der Standort des Baums mit Koordinaten.</p>
      <p><b>Zweck und Rechtsgrundlage:</b> Speicherung in deinem Konto, damit du die Daten nicht verlierst und auf mehreren Geräten nutzen kannst (Art. 6 Abs. 1 lit. b DSGVO). Gespeichert wird im privaten Speicher von Vercel Blob in der Region Frankfurt am Main; Fotos werden dabei über die Upload-Schnittstelle von Vercel (vercel.com) dorthin übertragen. Zugriff hat nur dein Konto; Fotos werden über Adressen ausgeliefert, die nach fünf Minuten verfallen. Eine Kopie liegt im Speicher deines Browsers auf dem Gerät.</p>
      <p><b>Fotos aus der Mediathek</b> können Metadaten enthalten, etwa Aufnahmeort und Gerät. Fotos, die du in der App aufnimmst, enthalten keine solchen Metadaten. Bitte fotografiere keine Personen.</p>
      <p><b>Auswertung:</b> Blatterkennung, Messung, 3D-Modell und Sortenvorschlag laufen in deinem Browser. Der Sortenvorschlag ist ein Hinweis und hat keine rechtliche Wirkung (keine automatisierte Entscheidung nach Art. 22 DSGVO).</p>
      <p><b>Dauer:</b> bis du ein Foto, einen Baum oder dein Konto löschst. Beim Löschen des Kontos werden die Daten sofort entfernt, letzte Reste (etwa ein gerade laufender Upload) innerhalb einer Stunde. Beim Abmelden werden die Daten auf dem Gerät entfernt; im Konto bleiben sie erhalten.</p>

      <H>5. Freiwillig: Fotos zur Verbesserung der App</H>
      <p>Wenn du eingewilligt hast, dürfen deine Fotos und Angaben zusätzlich genutzt werden, um die App zu verbessern: etwa um Blatterkennung, Messung und Sortenvorschlag an echten Aufnahmen zu testen und weiterzuentwickeln. Dafür kann der Verantwortliche deine Aufnahmen ansehen und mit Programmen auswerten. Sie werden nicht veröffentlicht und nicht an Dritte weitergegeben. Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Sie ist freiwillig; die App funktioniert ohne sie genauso. Du kannst sie jederzeit unter „Über die App“ widerrufen. Danach werden deine Daten für diesen Zweck nicht mehr verwendet; die bis dahin erfolgte Nutzung bleibt rechtmäßig (Art. 7 Abs. 3 DSGVO).</p>

      <H>6. Karte, Luftbild und Ortssuche</H>
      <p><b>Luftbild:</b> World Imagery von Esri (Environmental Systems Research Institute, Inc., 380 New York Street, Redlands, CA 92373, USA). Die Kacheln holt unser Server ab und reicht sie an die App weiter. Esri erhält dabei nur die Kachelkoordinaten und die Adresse unseres Servers, keine Daten von dir.</p>
      <p><b>Kartenansicht „Karte“</b> und <b>Ortssuche:</b> OpenStreetMap Foundation, St John’s Innovation Centre, Cowley Road, Cambridge CB4 0WS, Vereinigtes Königreich. Beim Laden der Kartenkacheln und bei einer Suche erhält die OSMF deine IP-Adresse, die Browserkennung, die Adresse unserer App als Herkunft und bei der Suche den Suchbegriff. Für das Vereinigte Königreich besteht ein Angemessenheitsbeschluss der EU-Kommission. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO, weil du die Karte bzw. Suche ausdrücklich nutzt. Datenschutzerklärung: <a href="https://osmfoundation.org/wiki/Privacy_Policy" target="_blank" rel="noreferrer">osmfoundation.org</a>.</p>
      <p><b>Eigener Standort:</b> Nur wenn du „Hier“ oder „Standort übernehmen“ antippst, fragt die App deinen Standort über den Browser ab. Die Koordinaten werden nur gespeichert, wenn du sie einem Baum zuordnest.</p>

      <H>7. Rückmeldungen</H>
      <p>Wenn du über „Rückmeldung geben“ schreibst, gehen deine Nachricht, eine freiwillige Kontaktadresse (bei Anmeldung deine Konto-E-Mail), die aktuelle Seite der App, der App-Stand und die Browserkennung per E-Mail (Versand über Resend, Abschnitt 3) an das Postfach des Verantwortlichen bei Google (Gmail). Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO, berechtigtes Interesse an der Bearbeitung deiner Nachricht und der Verbesserung der App. Die Nachrichten werden gelöscht, sobald sie erledigt sind, spätestens nach zwölf Monaten. Zum Schutz vor Missbrauch gilt eine Höchstzahl von Nachrichten (Zähler wie in Abschnitt 3).</p>

      <H>8. Hosting und Zugriffsdaten</H>
      <p>Die App wird von Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723, USA, bereitgestellt (Auftragsverarbeiter). Die Server-Funktionen laufen in Frankfurt am Main. Bei jedem Aufruf verarbeitet Vercel technisch notwendige Daten: IP-Adresse, Zeitpunkt, aufgerufene Adresse, Browserkennung, Statuscode. Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (sicherer und stabiler Betrieb). Vercel gibt an, nach dem EU-US Data Privacy Framework zertifiziert zu sein; zusätzlich gelten Standardvertragsklauseln. Datenschutzerklärung: <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noreferrer">vercel.com</a>.</p>
      <p><b>Fehlerprotokoll und Betriebsübersicht:</b> Tritt in der App oder auf dem Server ein unerwarteter Fehler auf, wird er protokolliert: Zeitpunkt, Art und Meldung des Fehlers, technischer Ablauf, betroffene Seite der App, App-Stand, Browserkennung und, wenn du angemeldet bist, deine Kontokennung. Fotos, Bäume und andere Inhalte gehören nicht dazu. Außerdem wird festgehalten, wann ein Konto angelegt oder gelöscht und wann eine Rückmeldung geschickt wurde. Der Verantwortliche sieht diese Angaben in einer Betriebsübersicht, zusammen mit den Konten (E-Mail-Adresse, Anlagedatum, Zahl der Bäume und Bilder), und erhält höchstens einmal täglich eine Zusammenfassung per E-Mail. Zweck ist, Fehler zu finden und den Betrieb zu überwachen; Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Die Einträge liegen im privaten Speicher in Frankfurt am Main und werden nach 30 Tagen gelöscht.</p>

      <H>9. Speicher auf deinem Gerät und Sensoren</H>
      <p>Die App speichert im Browser (IndexedDB, localStorage) deine Bäume und Fotos, gerenderte Apfelbilder, den Ausschnitt deiner Wiese und Einstellungen wie die gewählte Ansicht. Ein Service Worker hält die App, die Sortendaten, angesehene Sortenbilder und Kartenkacheln für die Nutzung ohne Netz vor. Beim Abmelden werden die Kartenkacheln entfernt. Das ist für die von dir gewünschte Funktion unbedingt erforderlich (§ 25 Abs. 2 Nr. 2 TDDDG). Kamera und Bewegungssensoren (für das Neigen des 3D-Apfels) werden nur im Browser genutzt; Sensordaten verlassen dein Gerät nicht. Schriften sind in die App eingebunden; es gibt keine Statistik- oder Werbedienste.</p>

      <H>10. Deine Rechte</H>
      <p>Du hast das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21). Einwilligungen kannst du jederzeit widerrufen. Dein Konto mit allen Daten löschst du selbst unter „Über die App“; eine Sicherung deiner Bäume kannst du dort als Datei herunterladen. Für alles Weitere genügt eine E-Mail an die oben genannte Adresse.</p>
      <p>Du kannst dich bei einer Datenschutzaufsichtsbehörde beschweren, zum Beispiel beim Hamburgischen Beauftragten für Datenschutz und Informationsfreiheit, Ludwig-Erhard-Str. 22, 20459 Hamburg, <a href="https://datenschutz-hamburg.de" target="_blank" rel="noreferrer">datenschutz-hamburg.de</a>.</p>

      <H>11. Pflicht zur Angabe</H>
      <p>Für ein Konto ist eine E-Mail-Adresse nötig. Ohne Konto kannst du die Sortendatenbank nutzen, aber keine eigenen Bäume anlegen.</p>
    </Rahmen>
  )
}

export function NutzungSeite() {
  return (
    <Rahmen titel="Nutzungsbedingungen">
      <H>1. Angebot</H>
      <p>Die Apfelwiese ist ein kostenloser Prototyp in der Erprobung, angeboten von Anton Reinig (siehe Impressum). Funktionen können sich ändern, ausfallen oder eingestellt werden. Einen Anspruch auf Verfügbarkeit gibt es nicht. Wird die App eingestellt, erfährst du es vorher per E-Mail und kannst deine Daten als Datei sichern.</p>
      <H>2. Sortenvorschläge</H>
      <p>Die App schlägt Sorten auf Grundlage von Messungen und Literaturangaben vor. Diese Vorschläge können falsch sein. Eine sichere Bestimmung erfordert eine Pomologin, einen Pomologen oder eine DNA-Analyse.</p>
      <H>3. Deine Inhalte</H>
      <p>Deine Fotos und Angaben bleiben deine. Du räumst dem Anbieter das Recht ein, sie zu speichern und zu verarbeiten, soweit es für die Funktionen der App nötig ist. Eine Nutzung zur Verbesserung der App erfolgt nur mit deiner gesonderten, freiwilligen Einwilligung. Lade nur Fotos hoch, an denen du die Rechte hast, und fotografiere keine Personen.</p>
      <H>4. Konto</H>
      <p>Pro Person ein Konto. Halte den Zugang zu deinem E-Mail-Postfach geschützt, weil die Anmeldung darüber läuft. Du kannst dein Konto jederzeit selbst löschen. Bei Missbrauch kann der Anbieter ein Konto sperren.</p>
      <H>5. Haftung</H>
      <p>Der Anbieter haftet unbeschränkt bei Vorsatz und grober Fahrlässigkeit sowie bei Verletzung von Leben, Körper oder Gesundheit. Im Übrigen ist die Haftung für diese unentgeltliche Leistung nach den gesetzlichen Regeln (§§ 521, 599 BGB entsprechend) auf Vorsatz und grobe Fahrlässigkeit beschränkt.</p>
      <H>6. Recht</H>
      <p>Es gilt deutsches Recht.</p>
    </Rahmen>
  )
}
