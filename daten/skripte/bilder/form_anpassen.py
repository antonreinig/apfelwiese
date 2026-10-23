"""Passt die 3D-Form (Höhe/Breite, Kegelform, Walzenform, Schiefe, Rippung, Unregelmäßigkeit)
per Code an die NFC-Fototafeln an.

NFC-Tafeln „Cross section of …“ (640 x 480): 2 Reihen x 3 Spalten auf graublauem Grund.
Links oben und unten: ganze Frucht von der Seite (Stiel oben), Mitte oben: Stielansicht,
Mitte unten: Kelchansicht, rechts: Längs- und Querschnitt; darunter Etikett und Maßstab.

Verfahren
1. Hintergrund aus dem Bildrand (Lab), Vordergrund = deutlicher Farb- oder Helligkeitsabstand.
2. Raster über die Täler der Spalten- und Zeilenprojektion, je Zelle die größte Fläche,
   Löcher gefüllt, Stiel durch Öffnen mit einer Ellipse (8 % der Fruchtbreite) entfernt.
3. Seitenansichten: halbe Breite je Höhe (Umriss), normiert auf Breite 1 und Höhe 1.
   Verglichen mit dem Umriss des Modells (gleiche Formel wie app/src/apfel3d/geometrie.ts,
   Funktion profil ohne Richtung: Superellipse, Kegelform, Gruben); gesucht wird im Raster
   über hoeheZuBreite, konisch und walze die kleinste mittlere quadratische Abweichung.
4. Schiefe: Höhenunterschied der Schultern (bei ±30 % der Breite) relativ zur Breite; nur als
   Rohwert gespeichert, weil er schiefe und symmetrische Sorten nicht trennt.
5. Stielansicht: Radius des Umrisses je Winkel; Anteil der 4.–6. Harmonischen → Rippung,
   der 2.–3. → Unregelmäßigkeit (Eichung in werte_aus_roh).

Aufruf (aus daten/):
    python3 -I skripte/bilder/form_anpassen.py            # alle NFC-Tafeln
    python3 -I skripte/bilder/form_anpassen.py gravensteiner ananasrenette   # nur diese
    python3 -I skripte/bilder/form_anpassen.py --umrechnen   # neue Eichung auf gespeicherte Rohwerte
Ausgabe: daten/bilder/form3d.json  { schluessel: { bild, seite, verfahren, werte, guete } }
Bilder werden über laden.datei() in daten/roh/bilder/img/nfc zwischengespeichert (nicht im Repo).
"""
import json
import math
import os
import sys

import cv2
import numpy as np

HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HIER)
import laden  # noqa: E402

DATEN = os.path.normpath(os.path.join(HIER, "..", ".."))
ZIEL = os.path.join(DATEN, "bilder", "form3d.json")
VERFAHREN = "Umriss der NFC-Seitenansichten gegen den Modellumriss (Rastersuche über Höhe/Breite, Kegel- und Walzenform), Lage am Stielrest erkannt, Rippung aus der Stielansicht; Version 3"

# Standardwerte der Gruben wie STANDARD in darstellung.ts
STANDARD = {"stielgrubeTiefe": 0.45, "stielgrubeWeite": 0.4, "kelchgrubeTiefe": 0.35, "kelchgrubeWeite": 0.4}


# ----------------------------------------------------------------------------- Modell

def glatt(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def delle(u):
    """wie delle() in geometrie.ts: glockenförmig, weich in die Schulter auslaufend"""
    return np.exp(-2.4 * u * u)


def rohes_profil(hzb, konisch, walze, g, n=240):
    """Mittlerer Längsumriss vor der Höhenkorrektur (rohesProfil in geometrie.ts); Breite 1"""
    halb = hzb / 2
    ex = 2.12 + walze * 1.1
    th = np.linspace(0, math.pi, n + 1)
    s, c = np.sin(th), np.cos(th)
    x = 0.5 * np.sign(s) * np.abs(s) ** (2 / ex)
    y = -halb * np.sign(c) * np.abs(c) ** (2 / ex)
    rel = y / halb
    x = x * (1 + konisch * rel - 0.04 * np.maximum(0, -rel) ** 3)
    x = x * (0.5 / x.max())
    sw = 0.1 + g["stielgrubeWeite"] * 0.28
    st = (0.05 + g["stielgrubeTiefe"] * 0.22) * hzb
    kw = 0.1 + g["kelchgrubeWeite"] * 0.26
    kt = (0.03 + g["kelchgrubeTiefe"] * 0.17) * hzb
    oben = y > 0
    y = y.copy()
    y[oben] -= st * delle(x[oben] / sw) * glatt(0, 0.25 * halb, y[oben])
    y[~oben] += kt * delle(x[~oben] / kw) * glatt(0, 0.25 * halb, -y[~oben])
    return x, y


def modell_profil(hzb, konisch, walze, g, n=240):
    """Wie profil() in geometrie.ts: hzb ist die sichtbare Höhe von Grubenrand zu Grubenrand"""
    f = 1.0
    for _ in range(3):
        x, y = rohes_profil(hzb * f, konisch, walze, g, n)
        f *= hzb / (y.max() - y.min())
    return rohes_profil(hzb * f, konisch, walze, g, n)


def silhouette(x, y, hoehen):
    """Halbe Breite des Seitenumrisses je Höhe: größter Radius, der diese Höhe erreicht"""
    w = np.zeros_like(hoehen)
    for i in range(len(x) - 1):
        y0, y1, x0, x1 = y[i], y[i + 1], x[i], x[i + 1]
        lo, hi = min(y0, y1), max(y0, y1)
        sel = (hoehen >= lo) & (hoehen <= hi)
        if not sel.any():
            continue
        t = (hoehen[sel] - y0) / (y1 - y0) if y1 != y0 else 0.5
        w[sel] = np.maximum(w[sel], x0 + (x1 - x0) * t)
    return w


def normierte_silhouette(x, y, stuetz=60):
    lo, hi = y.min(), y.max()
    # Pole: dort ist der Umriss sehr flach und im Foto unsicher; nur 6 %..94 % der Höhe
    h = lo + (hi - lo) * np.linspace(0.06, 0.94, stuetz)
    w = silhouette(x, y, h)
    return w / w.max(), (hi - lo) / (2 * w.max())


_ANGEBOT = {}


def modell_tabelle(g):
    """Vorab berechnete Modellumrisse für die Rastersuche"""
    k = tuple(sorted((kk, v) for kk, v in g.items() if kk in STANDARD))
    if k in _ANGEBOT:
        return _ANGEBOT[k]
    tab = []
    for hzb in np.arange(0.6, 1.16, 0.02):
        for kon in np.arange(-0.24, 0.36, 0.02):
            for wa in np.arange(-0.4, 1.01, 0.1):
                x, y = modell_profil(hzb, kon, wa, g)
                s, r = normierte_silhouette(x, y)
                tab.append((round(hzb, 2), round(kon, 2), round(wa, 2), s, r))
    _ANGEBOT[k] = tab
    return tab


# ----------------------------------------------------------------------------- Bild

def lab_von(rgb_u8):
    return cv2.cvtColor(rgb_u8.astype(np.float32) / 255.0, cv2.COLOR_RGB2LAB)


def vordergrund(rgb_u8):
    """Frucht gegen den graublauen Grund. Der Grund ist nicht gleichmäßig (Vignette, Schatten):
    Lab-Werte des Grunds als glatte quadratische Fläche geschätzt; Vordergrund ist, was sich
    in der Farbe (a*, b*) deutlich unterscheidet und selbst farbig ist. Schatten, Etikett und
    Glanzlichter sind unbunt; Glanzlichter innen schließt das Füllen der Löcher."""
    lab = lab_von(rgb_u8)
    h, w = lab.shape[:2]
    rand = np.zeros((h, w), bool)
    b = int(0.05 * min(h, w))
    rand[:b] = rand[-b:] = True
    rand[:, :b] = rand[:, -b:] = True
    ref = np.median(lab[rand], axis=0)
    yy, xx = np.mgrid[0:h, 0:w]
    X = np.stack([np.ones(h * w), xx.ravel() / w, yy.ravel() / h, (xx.ravel() / w) ** 2, (yy.ravel() / h) ** 2, xx.ravel() * yy.ravel() / (w * h)], 1)
    kand = np.hypot(lab[..., 1] - ref[1], lab[..., 2] - ref[2]) < 8
    modell = np.empty_like(lab)
    for _ in range(2):
        sel = kand.ravel()
        for c in range(3):
            koef, *_ = np.linalg.lstsq(X[sel][::7], lab.reshape(-1, 3)[sel, c][::7], rcond=None)
            modell[..., c] = (X @ koef).reshape(h, w)
        d_ab = np.hypot(lab[..., 1] - modell[..., 1], lab[..., 2] - modell[..., 2])
        kand = (d_ab < 6) & (lab[..., 0] > modell[..., 0] - 25)
    d_ab = np.hypot(lab[..., 1] - modell[..., 1], lab[..., 2] - modell[..., 2])
    chroma = np.hypot(lab[..., 1], lab[..., 2])
    # Schalen sind farbig (Chroma über 12); Etikett, Maßstab, Schatten und Glanz sind unbunt
    dunkel = lab[..., 0] < modell[..., 0] - 30
    # dazu dunkle Fruchtränder (dunkelrot im Schatten): deutlich dunkler und leicht farbig
    fg = ((d_ab > 12) & (chroma > 12)) | (dunkel & (d_ab > 6))
    fg = cv2.morphologyEx(fg.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7)))
    return fg.astype(bool), lab


def tal(profil, lo, hi):
    lo, hi = max(0, int(lo)), min(len(profil), int(hi))
    if hi - lo < 3:
        return None
    return lo + int(np.argmin(profil[lo:hi]))


def raster(fg):
    """Trennlinien zwischen den Spalten und Reihen; Etikett unten wird ausgespart"""
    h, w = fg.shape
    ys, xs = np.nonzero(fg)
    x0, x1 = np.percentile(xs, [1, 99])
    y0, y1 = np.percentile(ys, [1, 99])
    sp = np.convolve(fg.sum(0).astype(float), np.ones(9) / 9, mode="same")
    ze = np.convolve(fg.sum(1).astype(float), np.ones(9) / 9, mode="same")
    sx, sy = x1 - x0, y1 - y0
    t1 = tal(sp, x0 + sx * 0.22, x0 + sx * 0.45)
    t2 = tal(sp, x0 + sx * 0.55, x0 + sx * 0.78)
    ty = tal(ze, y0 + sy * 0.3, y0 + sy * 0.6)
    return t1, t2, ty


def zelle(fg, x_bereich, y_bereich):
    m = np.zeros_like(fg)
    (xa, xb), (ya, yb) = x_bereich, y_bereich
    m[ya:yb, xa:xb] = fg[ya:yb, xa:xb]
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(m.astype(np.uint8), 8)
    if n <= 1:
        return None
    i = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    maske = (lbl == i).astype(np.uint8)
    # Löcher füllen
    hohl = maske.copy()
    ff = np.zeros((maske.shape[0] + 2, maske.shape[1] + 2), np.uint8)
    cv2.floodFill(hohl, ff, (0, 0), 1)
    maske = maske | (1 - hohl)
    return maske.astype(bool)


def ohne_stiel(maske):
    ys, xs = np.nonzero(maske)
    breite = xs.max() - xs.min() + 1
    k = max(3, int(breite * 0.08) | 1)
    m = cv2.morphologyEx(maske.astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k)))
    n, lbl, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    if n <= 1:
        return maske
    i = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    return lbl == i


def stiel_lage(roh, ohne):
    """Lage des Stielrests: +1 oben, -1 unten, 0 nicht erkennbar. Der Stiel ist der dünne Fortsatz,
    den das Öffnen entfernt, mittig über oder unter der Frucht."""
    rest = (roh & ~ohne).astype(np.uint8)
    ys, xs = np.nonzero(ohne)
    if not len(ys):
        return 0
    y0, y1, cx, W = ys.min(), ys.max(), (xs.min() + xs.max()) / 2, xs.max() - xs.min()
    n, lbl, stats, cent = cv2.connectedComponentsWithStats(rest, 8)
    beste, lage = 0, 0
    for i in range(1, n):
        x, y, bw, bh, fl = stats[i]
        if fl < 6 or abs(cent[i][0] - cx) > 0.18 * W:
            continue
        # über dem oberen oder unter dem unteren Rand der Frucht herausragend
        if y < y0 - 2 and fl > beste:
            beste, lage = fl, 1
        elif y + bh > y1 + 2 and fl > beste:
            beste, lage = fl, -1
    return lage


def hals_kappen(maske):
    """Schatten- oder Spiegelungsreste und Stielreste abtrennen: Vom Äquator zu den Polen wird
    der Umriss schmaler; wird er danach wieder breiter, gehört der Rest nicht zur Frucht."""
    m = maske.copy()
    zeilen = np.nonzero(m.any(1))[0]
    breite = m.sum(1).astype(float)
    W = breite.max()
    aeq = int(np.argmax(breite))
    for richtung in (1, -1):
        tief = W
        y = aeq
        while 0 <= y + richtung < m.shape[0] and m[y + richtung].any():
            y += richtung
            tief = min(tief, breite[y])
            if breite[y] > tief + 0.06 * W:
                if richtung == 1:
                    m[y:] = False
                else:
                    m[:y + 1] = False
                break
    return m if zeilen.size else maske


def umriss_seite(maske):
    """Normierte halbe Breite je Höhe (von unten nach oben), Höhe/Breite, Schulterdifferenz"""
    ys, xs = np.nonzero(maske)
    y0, y1 = ys.min(), ys.max()
    zeilen = []
    for y in range(y0, y1 + 1):
        r = np.nonzero(maske[y])[0]
        if len(r):
            zeilen.append((y, r.min(), r.max()))
    z = np.array(zeilen, float)
    breite = (z[:, 2] - z[:, 1] + 1)
    mitte = (z[:, 2] + z[:, 1]) / 2
    W = breite.max()
    H = y1 - y0 + 1
    # Höhe von unten (Kelch) nach oben (Stiel), 0..1
    hoehe = (y1 - z[:, 0]) / H
    stuetz = np.linspace(0.06, 0.94, 60)
    w = np.interp(stuetz, hoehe[::-1], breite[::-1]) / W
    # Schultern: oberste Zeile, in der die Frucht bei ±30 % der Breite links bzw. rechts beginnt
    cx = mitte[np.argmax(breite)]
    def schulter(dx):
        spalte = int(round(cx + dx * W))
        sp = np.nonzero(maske[:, max(0, min(maske.shape[1] - 1, spalte))])[0]
        return sp.min() if len(sp) else y0
    schief = abs(schulter(-0.3) - schulter(0.3)) / W
    return w, H / W, schief


def harmonische(maske):
    """Anteil der Harmonischen 2–3 und 4–6 am mittleren Radius des Umrisses"""
    kont, _ = cv2.findContours(maske.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    if not kont:
        return None
    k = max(kont, key=cv2.contourArea)[:, 0, :].astype(float)
    mom = cv2.moments(maske.astype(np.uint8))
    cx, cy = mom["m10"] / mom["m00"], mom["m01"] / mom["m00"]
    win = np.arctan2(k[:, 1] - cy, k[:, 0] - cx)
    rad = np.hypot(k[:, 0] - cx, k[:, 1] - cy)
    raster_w = np.linspace(-math.pi, math.pi, 360, endpoint=False)
    ordn = np.argsort(win)
    r = np.interp(raster_w, win[ordn], rad[ordn], period=2 * math.pi)
    f = np.abs(np.fft.rfft(r)) / len(r) * 2
    mittel = r.mean()
    return {"h23": float(np.hypot(f[2], f[3]) / mittel), "h456": float(np.sqrt(f[4] ** 2 + f[5] ** 2 + f[6] ** 2) / mittel)}


def werte_aus_roh(roh):
    """Rippung und Unregelmäßigkeit aus den Harmonischen der Stielansicht, geeicht an den
    Merkmalsklassen (23.10.2026, 842 Tafeln): h456 im Median 0,014 bei Rippung 1 (fehlend),
    0,017 bei 5, 0,020 bei 7, 0,024 bei 9; darunter liegt ein Grundrauschen aus Lage und Umriss.
    h23 enthält vor allem Lage und Perspektive (Median 0,028), daher vorsichtig.
    Die Schiefe (Schulterversatz) trennte schiefe und symmetrische Sorten nicht; sie bleibt nur Rohwert."""
    w = {}
    if "h456" in roh:
        w["rippung"] = round(min(1, max(0, (roh["h456"] - 0.013) / 0.011)), 2)
    if "h23" in roh:
        w["unregelmaessig"] = round(min(0.6, max(0, (roh["h23"] - 0.02) / 0.08)), 2)
    return w


def anpassen(bild_pfad, g):
    rgb = np.asarray(cv2.cvtColor(cv2.imread(bild_pfad), cv2.COLOR_BGR2RGB))
    if rgb.shape[1] > 640:
        rgb = cv2.resize(rgb, (640, round(640 * rgb.shape[0] / rgb.shape[1])), interpolation=cv2.INTER_AREA)
    fg, _ = vordergrund(rgb)
    t1, t2, ty = raster(fg)
    if None in (t1, t2, ty):
        return None, "raster"
    h, w = fg.shape
    seiten = []
    for yb in ((0, ty), (ty, h)):
        m = zelle(fg, (0, t1), yb)
        if m is None or m.sum() < 0.01 * h * w:
            continue
        roh = m
        m = hals_kappen(ohne_stiel(m))
        lage = stiel_lage(roh, m)
        # nur runde, ganze Früchte (keine angeschnittenen Ränder)
        ys, xs = np.nonzero(m)
        if ys.min() <= 1 or xs.min() <= 1 or ys.max() >= h - 2:
            if not seiten:
                seiten.append(None)  # Platz der oberen Ansicht freihalten
            continue
        flaeche = m.sum()
        kont, _ = cv2.findContours(m.astype(np.uint8), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
        huelle = cv2.contourArea(cv2.convexHull(max(kont, key=cv2.contourArea)))
        if flaeche / max(1, huelle) < 0.93:
            if not seiten:
                seiten.append(None)
            continue
        w_s, r_s, schief_s = umriss_seite(m)
        # Profil immer vom Kelch zum Stiel; bei Stiel unten umdrehen
        if lage == -1:
            w_s = w_s[::-1]
        seiten.append((w_s, r_s, schief_s, lage))
    oben_ok = bool(seiten) and seiten[0] is not None
    seiten = [x for x in seiten if x is not None]
    if not oben_ok and seiten:
        # nur die untere Ansicht: Ausrichtung unbekannt, Kegelform nicht verlässlich
        pass
    if not seiten:
        return None, "keine_seitenansicht"
    # obere Ansicht (Stiel oben) ist die verlässlichste; weicht die untere im Höhen-Breiten-
    # Verhältnis stark ab, stören dort Schatten oder Etikettreste
    if len(seiten) == 2 and abs(seiten[1][1] - seiten[0][1]) > 0.08:
        seiten = seiten[:1]
    tab = modell_tabelle(g)
    beste = None
    for hzb, kon, wa, s, r in tab:
        fehler = 0.0
        for w_foto, hzb_foto, _, lage in seiten:
            f_normal = float(np.mean((s - w_foto) ** 2))
            # Lage unbekannt: beide Richtungen zulassen
            f_kopf = float(np.mean((s - w_foto[::-1]) ** 2)) if lage == 0 else f_normal
            fehler += min(f_normal, f_kopf) + 0.5 * (r - hzb_foto) ** 2
        fehler /= len(seiten)
        if beste is None or fehler < beste[0]:
            beste = (fehler, hzb, kon, wa)
    fehler, hzb, kon, wa = beste
    schief = float(np.median([x[2] for x in seiten]))
    werte = {"hoeheZuBreite": float(hzb), "konisch": float(kon), "walze": float(wa)}
    roh = {"schulterversatz": round(schief, 4), "hzb_seiten": [round(x[1], 3) for x in seiten]}
    # ohne erkannten Stiel ist die Richtung der Kegelform offen: Richtung aus den Merkmalen
    richtung_sicher = any(x[3] != 0 for x in seiten)
    if not richtung_sicher:
        vorgabe = g.get("konisch_merkmal", 0.0)
        werte["konisch"] = float(abs(kon) * (1 if vorgabe >= 0 else -1))
    oben = zelle(fg, (t1, t2), (0, ty))
    if oben is not None and oben.sum() > 0.01 * h * w:
        hm = harmonische(ohne_stiel(oben))
        if hm:
            roh.update({k: round(v, 4) for k, v in hm.items()})
    werte.update(werte_aus_roh(roh))
    return {"werte": werte, "guete": round(math.sqrt(fehler), 4), "seiten": len(seiten), "richtung_sicher": richtung_sicher, "roh": roh}, None


# ----------------------------------------------------------------------------- Ablauf

def main(nur):
    bilder = json.load(open(os.path.join(DATEN, "bilder", "bilder.json")))
    index = json.load(open(os.path.join(DATEN, "..", "app", "public", "sorten", "index.json")))
    darst = {s["id"]: s.get("darstellung", {}) for s in index["sorten"]}
    alt = json.load(open(ZIEL)) if os.path.exists(ZIEL) else {}
    # Tafeln, die laut Etikett eine andere Sorte zeigen
    falsche = json.load(open(os.path.join(DATEN, "bilder", "falsche_bilder.json")))
    erg = dict(alt)
    gruende = {}
    schluessel = [k for k in bilder if not nur or k in nur]
    for n, k in enumerate(schluessel):
        tafeln = [b for b in bilder[k]["bilder"] if b["quelle"] == "nfc-commons" and "Cross_section" in b["url"] and b["url"].split("?")[0] not in falsche]
        if not tafeln:
            continue
        if k in alt and not nur:
            continue
        b = tafeln[0]
        try:
            pfad = laden.datei(b.get("titel") or b["url"], b["url"], "nfc")
        except Exception as e:  # noqa: BLE001
            gruende["laden"] = gruende.get("laden", 0) + 1
            print("  Laden fehlgeschlagen:", k, e)
            continue
        d = darst.get(k, {})
        g = {kk: float(d.get(kk, STANDARD[kk])) for kk in STANDARD}
        g["konisch_merkmal"] = float(d.get("konisch", 0.06))
        r, grund = anpassen(pfad, g)
        if r is None:
            gruende[grund] = gruende.get(grund, 0) + 1
            continue
        erg[k] = {"bild": b["url"], "seite": b.get("seite"), "verfahren": VERFAHREN, **r}
        if n % 25 == 0:
            print(f"{n}/{len(schluessel)} {k}: {r['werte']} Güte {r['guete']}", flush=True)
            json.dump(erg, open(ZIEL + ".tmp", "w"), ensure_ascii=False)
            os.replace(ZIEL + ".tmp", ZIEL)
    json.dump(erg, open(ZIEL + ".tmp", "w"), ensure_ascii=False, indent=0)
    os.replace(ZIEL + ".tmp", ZIEL)
    print(f"{len(erg)} Sorten angepasst; nicht angepasst: {gruende}")


def umrechnen():
    """Nach neuer Eichung: Werte aus den gespeicherten Rohwerten neu berechnen, ohne Bilder"""
    erg = json.load(open(ZIEL))
    for e in erg.values():
        e["werte"].pop("asymmetrie", None)
        e["werte"].pop("rippung", None)
        e["werte"].pop("unregelmaessig", None)
        e["werte"].update(werte_aus_roh(e.get("roh", {})))
        e["verfahren"] = VERFAHREN
    json.dump(erg, open(ZIEL + ".tmp", "w"), ensure_ascii=False, indent=0)
    os.replace(ZIEL + ".tmp", ZIEL)
    print(f"{len(erg)} Einträge umgerechnet")


if __name__ == "__main__":
    if sys.argv[1:] == ["--umrechnen"]:
        umrechnen()
    else:
        main(set(sys.argv[1:]))
