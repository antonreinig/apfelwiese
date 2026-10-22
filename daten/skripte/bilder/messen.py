"""Farb- und Formmessung an Referenzbildern (rein per Code, kein Sprachmodell).

Verfahren (Kurzfassung, Details in daten/bilder/bericht.md):
1. Hintergrund (Fototisch bzw. Papier) aus dem Bildrand schätzen, Farbstich über
   den Hintergrund ausgleichen (von-Kries-Skalierung im linearen RGB).
2. Vordergrund = Pixel, die sich in a*b* (bzw. deutlich in L*) vom Hintergrund
   unterscheiden; Löcher füllen, Öffnen, Zusammenhangskomponenten.
3. Komponenten filtern: Etiketten/Maßstab (rechteckig), Blätter (länglich,
   konkav), Kleinteile. Je Komponente "Schnitt" (heller, wenig bunter Fleischanteil)
   oder "ganze Frucht".
4. Schale: Rand abtragen, Glanzlichter und tiefe Schatten ausschließen,
   k-means (k=6) in Lab, Cluster nach Farbton/Buntheit/Helligkeit einordnen:
   Grundfarbe (gelb/grün), Deckfarbe (rot/orange), Rost (braun, matt).
5. Fleisch: Schnittflächen ohne Schalenrand und Kernhaus, hellster großer Cluster.
6. Höhe/Breite: achsenparalleler Umriss des Längsschnitts (NFC: Schnitt oben
   rechts), sonst der Seitenansicht.
"""
import warnings

import numpy as np
from PIL import Image

warnings.filterwarnings("ignore", category=FutureWarning)
from scipy import ndimage as ndi
from scipy.cluster.vq import kmeans2
from skimage import color, measure, morphology

# ---------------------------------------------------------------- Farbe


def srgb_zu_linear(x):
    return np.where(x <= 0.04045, x / 12.92, ((x + 0.055) / 1.055) ** 2.4)


def linear_zu_srgb(x):
    x = np.clip(x, 0, 1)
    return np.where(x <= 0.0031308, 12.92 * x, 1.055 * x ** (1 / 2.4) - 0.055)


def lab_zu_hex(lab):
    rgb = color.lab2rgb(np.array(lab, dtype=float).reshape(1, 1, 3)).reshape(3)
    rgb = np.clip(np.round(rgb * 255), 0, 255).astype(int)
    return "#%02x%02x%02x" % tuple(rgb)


def weissabgleich(rgb, ref_rgb, ziel_rgb, staerke=1.0):
    """von Kries: Kanalweise so skalieren, dass ref_rgb auf ziel_rgb fällt."""
    lin = srgb_zu_linear(rgb)
    r = srgb_zu_linear(np.asarray(ref_rgb, float))
    z = srgb_zu_linear(np.asarray(ziel_rgb, float))
    f = (z / np.maximum(r, 1e-4)) ** staerke
    return linear_zu_srgb(lin * f)


# ---------------------------------------------------------------- Laden


def lade(pfad, max_breite=640):
    im = Image.open(pfad)
    if im.mode in ("RGBA", "LA", "P", "PA"):
        im = im.convert("RGBA")
        hg = Image.new("RGB", im.size, (255, 255, 255))
        hg.paste(im, mask=im.split()[3])
        im = hg
    im = im.convert("RGB")
    if im.width > max_breite:
        im = im.resize((max_breite, round(max_breite * im.height / im.width)), Image.LANCZOS)
    return np.asarray(im, dtype=float) / 255.0


def randpixel(rgb, innen=0.0, breite=0.06):
    h, w, _ = rgb.shape
    m = np.zeros((h, w), bool)
    a, b = int(h * innen), int(w * innen)
    dh, dw = max(2, int(h * breite)), max(2, int(w * breite))
    m[a:a + dh, b:w - b] = True
    m[h - a - dh:h - a, b:w - b] = True
    m[a:h - a, b:b + dw] = True
    m[a:h - a, w - b - dw:w - b] = True
    return m


# ---------------------------------------------------------------- Segmentierung


def bg_modell(lab, start_maske, kandidat, iterationen=3, grad=2):
    """Glattes Hintergrundmodell (Polynom 2. Grades in x,y je Lab-Kanal).

    start_maske: sichere Hintergrundpixel (Rand); kandidat: Pixel, die farblich
    zum Hintergrund passen könnten. Gibt Bild mit geschätzter Hintergrundfarbe zurück.
    """
    h, w, _ = lab.shape
    yy, xx = np.mgrid[0:h, 0:w]
    xn, yn = xx / w - 0.5, yy / h - 0.5
    terme = [np.ones_like(xn)]
    for gx in range(grad + 1):
        for gy in range(grad + 1 - gx):
            if gx + gy > 0:
                terme.append(xn ** gx * yn ** gy)
    A = np.stack([t.ravel() for t in terme], 1)
    sel = (start_maske | kandidat).ravel()
    sub = np.flatnonzero(sel)
    if len(sub) > 30000:
        sub = np.random.default_rng(0).choice(sub, 30000, replace=False)
    werte = lab.reshape(-1, 3)
    for _ in range(iterationen):
        koeff, *_ = np.linalg.lstsq(A[sub], werte[sub], rcond=None)
        pred = A[sub] @ koeff
        res = np.hypot(*(werte[sub][:, 1:] - pred[:, 1:]).T) + 0.3 * np.abs(werte[sub][:, 0] - pred[:, 0])
        grenze = np.median(res) + 2.5 * 1.4826 * np.median(np.abs(res - np.median(res))) + 1.0
        sub = sub[res < grenze]
        if len(sub) < 200:
            break
    return (A @ koeff).reshape(h, w, 3)


def aufteilen(maske, min_abstand_rel=0.35):
    """Trennt berührende runde Objekte per Wasserscheide auf der Distanztransformation."""
    from skimage.feature import peak_local_max
    from skimage.segmentation import watershed
    dist = ndi.distance_transform_edt(maske)
    rmax = dist.max()
    peaks = peak_local_max(dist, min_distance=max(3, int(rmax * min_abstand_rel)),
                           threshold_abs=rmax * 0.45, labels=maske.astype(int), exclude_border=False)
    if len(peaks) < 2:
        return [maske]
    markers = np.zeros(maske.shape, int)
    for i, (r, c) in enumerate(peaks, 1):
        markers[r, c] = i
    ws = watershed(-dist, markers, mask=maske)
    return [ws == i for i in range(1, ws.max() + 1) if (ws == i).sum() > 0]


def vordergrund(lab, bg_lab, ab_schwelle=11.0, l_schwelle=30.0, chroma_min=6.0):
    d_ab = np.hypot(lab[..., 1] - bg_lab[1], lab[..., 2] - bg_lab[2])
    d_l = bg_lab[0] - lab[..., 0]
    chroma = np.hypot(lab[..., 1], lab[..., 2])
    fg = (d_ab > ab_schwelle) | ((d_l > l_schwelle) & (chroma > chroma_min))
    return fg


def komponenten(fg, min_anteil=0.004, oeffnen=2, schliessen=4):
    h, w = fg.shape
    fg = morphology.binary_opening(fg, morphology.disk(oeffnen))
    if schliessen:
        fg = morphology.binary_closing(fg, morphology.disk(schliessen))
    fg = ndi.binary_fill_holes(fg)
    lab_img = measure.label(fg)
    out = []
    for r in measure.regionprops(lab_img):
        if r.area < min_anteil * h * w:
            continue
        out.append(r)
    return lab_img, out


def rundlich(maske):
    """Entfernt dünne Anhängsel (Blätter, Stiele) durch Öffnen mit großem Kreis."""
    a = maske.sum()
    if a == 0:
        return maske
    rad = max(2, int(0.10 * np.sqrt(a / np.pi)))
    m = morphology.binary_opening(maske, morphology.disk(rad))
    lbl = measure.label(m)
    if lbl.max() == 0:
        return m
    groessen = np.bincount(lbl.ravel())
    groessen[0] = 0
    return lbl == groessen.argmax()


def formwerte(maske):
    r = measure.regionprops(maske.astype(np.uint8))[0]
    minr, minc, maxr, maxc = r.bbox
    hoehe, breite = maxr - minr, maxc - minc
    umfang = max(r.perimeter, 1)
    return {
        "flaeche": int(r.area),
        "hoehe": int(hoehe),
        "breite": int(breite),
        "solidity": float(r.solidity),
        "rundheit": float(4 * np.pi * r.area / umfang ** 2),
        "extent": float(r.extent),
        "achsen": float(r.axis_major_length / max(r.axis_minor_length, 1)),
        "zentrum": (float(r.centroid[0]), float(r.centroid[1])),
        "bbox": (int(minr), int(minc), int(maxr), int(maxc)),
    }


def fleischanteil(lab, maske):
    """Anteil heller, wenig bunter Pixel im Inneren (Schnittfläche)."""
    inn = morphology.binary_erosion(maske, morphology.disk(max(2, int(0.12 * np.sqrt(maske.sum() / np.pi)))))
    if inn.sum() < 30:
        inn = maske
    L, a, b = lab[..., 0][inn], lab[..., 1][inn], lab[..., 2][inn]
    C = np.hypot(a, b)
    hell = (L > 68) & (C < 38) & (np.abs(a) < 14)
    return float(hell.mean())


# ---------------------------------------------------------------- Klassifikation der Schale

KLASSEN = ["grund", "deck", "rost", "aus", "misch"]


def hue(a, b):
    return (np.degrees(np.arctan2(b, a)) + 360) % 360


def cluster_klasse(Lc, ac, bc):
    C = np.hypot(ac, bc)
    h = hue(ac, bc)
    if Lc < 12 or C < 7:
        return "aus"  # Schatten, Kelch/Stielgrube, graue Reflexe
    rotlich = (h < 48 or h > 320) and ac > 10
    if rotlich:
        return "deck"
    if 48 <= h < 68 and ac > 14 and C > 28:
        return "deck"  # orange Deckfarbe
    if 40 <= h < 92 and C < 34 and Lc < 60 and ac > 2:
        return "rost"
    if 62 <= h < 140:
        return "grund"
    if 40 <= h < 62:
        return "grund" if Lc >= 60 else "rost"
    return "aus"


def schalenfarben(lab, masken, k=6, seed=1):
    """Grund-, Deck-, Rostfarbe aus den Schalenpixeln aller ganzen Früchte."""
    pix = []
    for m in masken:
        rad = max(2, int(0.07 * np.sqrt(m.sum() / np.pi)))
        inn = morphology.binary_erosion(m, morphology.disk(rad))
        p = lab[inn]
        L = p[:, 0]
        C = np.hypot(p[:, 1], p[:, 2])
        glanz = (L > 90) | ((L > 78) & (C < 14))
        schatten = L < np.percentile(L, 4)
        pix.append(p[~glanz & ~schatten])
    if not pix:
        return None
    p = np.concatenate(pix)
    if len(p) < 200:
        return None
    rng = np.random.default_rng(seed)
    if len(p) > 40000:
        p = p[rng.choice(len(p), 40000, replace=False)]
    # Lab leicht gewichten: L halb so stark wie a*/b* (Beleuchtung soll weniger trennen)
    w = np.array([0.5, 1.0, 1.0])
    zentren, zuordnung = kmeans2(p * w, k, seed=seed, minit="++", iter=30)
    zentren = zentren / w
    n = np.bincount(zuordnung, minlength=k)
    klassen = {}
    for i in range(k):
        if n[i] == 0:
            continue
        klassen[i] = cluster_klasse(*zentren[i])
    # Mischcluster: braun wirkende Übergänge zwischen Deck- und Grundfarbe
    # (Rot über Grün mischt sich optisch zu Braun) nicht als Rost zählen.
    gi = [i for i in klassen if klassen[i] == "grund"]
    di = [i for i in klassen if klassen[i] == "deck"]
    if gi and di:
        g = np.average(zentren[gi], axis=0, weights=n[gi])[1:]
        d = np.average(zentren[di], axis=0, weights=n[di])[1:]
        for i in [i for i in klassen if klassen[i] == "rost"]:
            c = zentren[i][1:]
            v = d - g
            t = float(np.dot(c - g, v) / max(np.dot(v, v), 1e-6))
            abst = float(np.linalg.norm(c - (g + t * v)))
            if 0.1 < t < 0.9 and abst < 12:
                klassen[i] = "misch"
    anteil = {kl: sum(n[i] for i in klassen if klassen[i] == kl) for kl in KLASSEN + ["misch"]}
    # Mischpixel je zur Hälfte Grund und Deck zuschlagen (nur für die Anteile)
    anteil["grund"] += anteil["misch"] / 2
    anteil["deck"] += anteil["misch"] / 2
    gesamt_schale = anteil["grund"] + anteil["deck"] + anteil["rost"]
    if gesamt_schale < 100:
        return None

    def mittel(kl, hell_bevorzugt=False):
        idx = [i for i in klassen if klassen[i] == kl]
        if not idx:
            return None
        # Pixel der Klasse; Farbe = Median der helleren Hälfte (beleuchtete Seite)
        m = np.isin(zuordnung, idx)
        q = p[m]
        if hell_bevorzugt and len(q) > 50:
            q = q[q[:, 0] >= np.percentile(q[:, 0], 40)]
        return np.median(q, axis=0)

    erg = {
        "anteile": {kl: float(anteil[kl] / gesamt_schale) for kl in ("grund", "deck", "rost")},
        "zentren": [(zentren[i].round(1).tolist(), int(n[i]), klassen[i]) for i in klassen],
        "n_pixel": int(len(p)),
    }
    g = mittel("grund", True)
    d = mittel("deck", False)
    r = mittel("rost", False)
    if g is not None and anteil["grund"] / gesamt_schale >= 0.03:
        erg["grund"] = g
    if d is not None and anteil["deck"] / gesamt_schale >= 0.02:
        erg["deck"] = d
    if r is not None and anteil["rost"] / gesamt_schale >= 0.05:
        erg["rost"] = r
    erg["deckanteil"] = float(anteil["deck"] / gesamt_schale)
    # Klassenkarte je Pixel (für die Prüfbilder): nächstes Zentrum
    erg["_zentren"] = zentren
    erg["_klassen"] = klassen
    return erg


def klassenkarte(lab, maske, erg):
    z = erg["_zentren"]
    w = np.array([0.5, 1.0, 1.0])
    p = lab[maske] * w
    d = ((p[:, None, :] - (z * w)[None, :, :]) ** 2).sum(-1)
    idx = d.argmin(1)
    karte = np.full(maske.shape, -1, int)
    werte = np.array([KLASSEN.index(erg["_klassen"].get(i, "aus")) for i in range(len(z))])
    karte[maske] = werte[idx]
    return karte


def fleischfarbe(lab, maske):
    rad = max(3, int(0.14 * np.sqrt(maske.sum() / np.pi)))
    inn = morphology.binary_erosion(maske, morphology.disk(rad))
    p = lab[inn]
    if len(p) < 100:
        return None
    L = p[:, 0]
    C = np.hypot(p[:, 1], p[:, 2])
    # Fleisch: hell, mäßig bunt; Kerne/Kernhauslinien/Schatten raus
    sel = (L > 55) & (C < 45) & (p[:, 1] < 18)
    q = p[sel]
    if len(q) < 80:
        return None
    # dominanter heller Bereich: mittlere 50 % nach Helligkeit
    lo, hi = np.percentile(q[:, 0], [35, 85])
    q = q[(q[:, 0] >= lo) & (q[:, 0] <= hi)]
    return np.median(q, axis=0)


# ---------------------------------------------------------------- Prüfbild


def pruefbild(rgb, masken_ganz, masken_schnitt, lab, erg, fleisch, pfad, titel="", extra=None):
    from PIL import ImageDraw
    h, w, _ = rgb.shape
    basis = (rgb * 255).astype(np.uint8)
    links = basis.copy()
    for m, col in [(mm, (0, 255, 255)) for mm in masken_ganz] + [(mm, (255, 0, 255)) for mm in masken_schnitt]:
        rand = m & ~morphology.binary_erosion(m, morphology.disk(2))
        links[rand] = col
    rechts = (basis * 0.25 + 40).astype(np.uint8)
    farben = {0: (60, 200, 60), 1: (220, 30, 30), 2: (140, 90, 40), 3: (90, 90, 90), 4: (230, 150, 40)}
    if erg is not None:
        for m in masken_ganz:
            rad = max(2, int(0.07 * np.sqrt(m.sum() / np.pi)))
            inn = morphology.binary_erosion(m, morphology.disk(rad))
            karte = klassenkarte_pixel(lab, inn, erg) if "_ref" in erg else klassenkarte(lab, inn, erg)
            for k, col in farben.items():
                rechts[karte == k] = col
    for m in masken_schnitt:
        rechts[m] = (basis[m] * 0.6 + np.array([255, 255, 255]) * 0.4).astype(np.uint8)
    leiste = np.full((60, 2 * w, 3), 255, np.uint8)
    can = Image.fromarray(np.concatenate([np.concatenate([links, rechts], 1), leiste], 0))
    dr = ImageDraw.Draw(can)
    x = 5
    for name, val in [("Grund", erg.get("grund") if erg else None), ("Deck", erg.get("deck") if erg else None),
                      ("Rost", erg.get("rost") if erg else None), ("Fleisch", fleisch)]:
        if val is not None:
            hx = lab_zu_hex(val)
            dr.rectangle([x, h + 5, x + 40, h + 35], fill=hx, outline="black")
            dr.text((x, h + 38), f"{name} {hx}", fill="black")
        x += 120
    if erg:
        dr.text((x, h + 5), "Anteile g/d/r: %.2f/%.2f/%.2f" % (erg["anteile"]["grund"], erg["anteile"]["deck"], erg["anteile"]["rost"]), fill="black")
    if extra:
        dr.text((x, h + 22), extra, fill="black")
    dr.text((x, h + 40), titel[:90], fill="black")
    if can.width > 1000:
        can = can.resize((1000, round(1000 * can.height / can.width)))
    can.save(pfad, quality=72)


# ---------------------------------------------------------------- pixelweise Klassifikation (ab Version 10)

def _pixel_vorauswahl(lab, masken):
    """Schalenpixel der ganzen Früchte: Rand, Glanzlichter und fast schwarze/graue Schatten raus.
    Dunkle Rottöne bleiben drin (kein Perzentil-Schnitt auf L)."""
    pix, innen = [], []
    for m in masken:
        rad = max(2, int(0.07 * np.sqrt(m.sum() / np.pi)))
        inn = morphology.binary_erosion(m, morphology.disk(rad))
        p = lab[inn]
        L = p[:, 0]
        C = np.hypot(p[:, 1], p[:, 2])
        ok = ~((L > 90) | ((L > 78) & (C < 14))) & ~(L < 10) & ~(C < 6)
        sel = inn.copy()
        sel[inn] = ok
        innen.append(sel)
        pix.append(p[ok])
    return pix, innen


def grund_referenz(p):
    """a* und Farbe der Grundfarbe: gelbgrüne/gelbe Pixel (Farbton 72–135°, a* < 12)."""
    h = hue(p[:, 1], p[:, 2])
    C = np.hypot(p[:, 1], p[:, 2])
    kand = (h >= 72) & (h < 135) & (p[:, 1] < 12) & (C > 12) & (p[:, 0] > 35)
    if kand.sum() < max(50, 0.03 * len(p)):
        return None
    q = p[kand]
    q = q[q[:, 0] >= np.percentile(q[:, 0], 40)]  # beleuchtete Seite
    return np.median(q, axis=0)


def pixelklassen(p, ref):
    """Klasse je Pixel (Index in KLASSEN): Deck über a* relativ zur Grundfarbe, auch bei geringer Helligkeit."""
    L, a, b = p[:, 0], p[:, 1], p[:, 2]
    h = hue(a, b)
    C = np.hypot(a, b)
    a_g = ref[1] if ref is not None else 0.0
    L_g = ref[0] if ref is not None else 70.0
    da = a - a_g
    k = np.full(len(p), KLASSEN.index("grund"), int)
    # Rost: ocker- bis zimtbraun, matt, dunkler als die Grundfarbe, Farbton gelblicher als Rot
    rost = (h >= 55) & (h < 90) & (C >= 12) & (C < 36) & (L >= 40) & (L < L_g - 8) & (da > 5)
    # Deck: deutlich röter als die Grundfarbe (rot, rosa, orange, braunrot), unabhängig von L
    deck = ((da >= 12) & ((h < 62) | (h >= 300))) | ((da >= 20) & (h < 72)) | (((h < 40) | (h >= 320)) & (a > 8))
    k[rost & ~deck] = KLASSEN.index("rost")
    # sehr dunkle, nicht eindeutig rote Pixel: Schatten (Grund/Rost dort nicht unterscheidbar)
    k[(L < 40) & ~deck & ~rost & (da > 5)] = KLASSEN.index("aus")
    k[deck] = KLASSEN.index("deck")
    aus = (h >= 135) & (h < 300) & ~deck  # Blau-/Violettreflexe vom Hintergrund
    k[aus] = KLASSEN.index("aus")
    return k


def schalenfarben_pixel(lab, masken):
    pix, innen = _pixel_vorauswahl(lab, masken)
    if not pix:
        return None
    p = np.concatenate(pix)
    if len(p) < 200:
        return None
    ref = grund_referenz(p)
    k = pixelklassen(p, ref)
    n = {kl: int((k == KLASSEN.index(kl)).sum()) for kl in KLASSEN}
    gesamt = n["grund"] + n["deck"] + n["rost"]
    if gesamt < 100:
        return None
    ant = {kl: n[kl] / gesamt for kl in ("grund", "deck", "rost")}
    erg = {"anteile": {kl: float(v) for kl, v in ant.items()}, "n_pixel": int(len(p)),
           "zentren": [], "deckanteil": float(ant["deck"]), "_ref": ref}

    def farbe(kl, hell):
        q = p[k == KLASSEN.index(kl)]
        if len(q) < 30:
            return None
        if hell:
            q = q[q[:, 0] >= np.percentile(q[:, 0], 40)]
        return np.median(q, axis=0)

    if ant["grund"] >= 0.03:
        erg["grund"] = ref if ref is not None else farbe("grund", True)
    if ant["deck"] >= 0.02:
        # Deckfarbe: kräftigster Bereich (obere Hälfte nach a*), damit Mischsäume nicht verwässern
        q = p[k == KLASSEN.index("deck")]
        erg["deck"] = np.median(q[q[:, 1] >= np.percentile(q[:, 1], 50)], axis=0)
    if ant["rost"] >= 0.05:
        erg["rost"] = farbe("rost", False)
    return erg


def klassenkarte_pixel(lab, maske, erg):
    karte = np.full(maske.shape, -1, int)
    karte[maske] = pixelklassen(lab[maske], erg["_ref"])
    return karte
