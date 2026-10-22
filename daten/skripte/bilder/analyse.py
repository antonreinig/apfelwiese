"""Bildanalyse je Bildtyp: NFC-Fototafel (6 Äpfel, 2 Schnitte) und gemalte/gedruckte Tafel."""
import numpy as np
from scipy import ndimage as ndi
from skimage import color

import messen as M

# Referenz-Hintergrund der NFC-Tafeln (Median über alle Tafeln, siehe nfc_referenz())
NFC_BG_REF = None


def _bg(rgb, innen=0.0, breite=0.06, l_min=None):
    rand = M.randpixel(rgb, innen, breite)
    p = rgb[rand]
    if l_min is not None:
        lab = color.rgb2lab(p.reshape(-1, 1, 3)).reshape(-1, 3)
        sel = lab[:, 0] > l_min
        if sel.sum() > 50:
            p = p[sel]
    return np.median(p, axis=0)


def segment_hintergrund(lab, rand_breite=0.05, ab_schwelle=12.0, mit_modell=False):
    """Vordergrund gegen glatt modellierten Hintergrund; unbunte Pixel (Etikett,
    Maßstab, Glanz) zählen nicht als Vordergrund, Löcher werden später gefüllt."""
    h, w, _ = lab.shape
    rand = M.randpixel(np.zeros((h, w, 3)), 0.0, rand_breite)
    a0, b0 = np.median(lab[rand][:, 1]), np.median(lab[rand][:, 2])
    kand = (np.hypot(lab[..., 1] - a0, lab[..., 2] - b0) < 10)
    bgm = M.bg_modell(lab, rand, kand)
    for _ in range(2):
        d = np.hypot(lab[..., 1] - bgm[..., 1], lab[..., 2] - bgm[..., 2])
        heller = lab[..., 0] - bgm[..., 0]
        fg = (d > ab_schwelle) | (heller > 12)
        # zweite Runde: alles, was sicher nicht Objekt ist, als Hintergrund nachführen
        sicher_bg = ~M.morphology.binary_dilation(fg, M.morphology.disk(4)) & (d < 0.8 * ab_schwelle)
        bgm = M.bg_modell(lab, rand & ~fg, sicher_bg)
    d = np.hypot(lab[..., 1] - bgm[..., 1], lab[..., 2] - bgm[..., 2])
    heller = lab[..., 0] - bgm[..., 0]
    fg = (d > ab_schwelle) | (heller > 12)
    if mit_modell:
        return fg, bgm
    return fg


def _aufgeteilt(lbl, regs, max_flaeche=None):
    """Nur offensichtlich verschmolzene Objekte (deutlich größer als üblich und
    konkav) per Wasserscheide trennen."""
    out = []
    if not regs:
        return out
    med = float(np.median([r.area for r in regs]))
    for r in regs:
        m = lbl == r.label
        zu_gross = r.area > 1.4 * med or (max_flaeche is not None and r.area > max_flaeche)
        if r.solidity < 0.9 and zu_gross:
            out.extend(M.aufteilen(m))
        else:
            out.append(m)
    return out


def etikett_entfernen(lab, fg, bgm=None):
    """Entfernt das Etikett mit Maßstab am unteren Bildrand.

    Zeilenprofil im unteren Bilddrittel: Etikettzeilen bestehen über eine lange,
    zusammenhängende Strecke aus weißen/schwarzen (unbunten) Pixeln.
    """
    h, w = fg.shape
    L = lab[..., 0]
    C = np.hypot(lab[..., 1], lab[..., 2])
    if bgm is not None:
        unbunt = (C < 18) & ((L > bgm[..., 0] + 6) | (L < 35))
    else:
        unbunt = (C < 12) & ((L > 62) | (L < 35)) & fg
    unbunt = M.morphology.binary_closing(unbunt, M.morphology.disk(2))
    fg = fg.copy()
    y0 = int(h * 0.62)
    zeilen = []
    for y in range(y0, h):
        lbl = M.measure.label(unbunt[y])
        if lbl.max() == 0:
            continue
        laengen = np.bincount(lbl)[1:]
        k = laengen.argmax()
        if laengen[k] > 0.28 * w:
            xs = np.flatnonzero(lbl == k + 1)
            zeilen.append((y, xs[0], xs[-1]))
    if len(zeilen) < 0.03 * h:
        return fg
    ys = np.array([z[0] for z in zeilen])
    x0 = int(np.percentile([z[1] for z in zeilen], 20))
    x1 = int(np.percentile([z[2] for z in zeilen], 80))
    oben = int(np.percentile(ys, 3))
    rand = int(0.02 * h)
    fg[max(0, oben - rand):, max(0, x0 - 3):min(w, x1 + 4)] = False
    return fg


def schnitte_vereinen(schnitt):
    """Längsschnitt-Hälften, die durch das Kernhaus getrennt wurden, wieder vereinen."""
    if len(schnitt) < 2:
        return schnitt
    schnitt = sorted(schnitt, key=lambda x: x[1]["zentrum"][0])
    out = []
    benutzt = set()
    for i, (mi, fi) in enumerate(schnitt):
        if i in benutzt:
            continue
        m = mi.copy()
        for j in range(i + 1, len(schnitt)):
            if j in benutzt:
                continue
            mj, fj = schnitt[j]
            a0, _, a1, _ = fi["bbox"]
            b0, _, b1, _ = fj["bbox"]
            ueberlapp = max(0, min(a1, b1) - max(a0, b0)) / max(1, min(a1 - a0, b1 - b0))
            if ueberlapp > 0.6:
                m = m | mj
                benutzt.add(j)
        if m is not mi and m.sum() > mi.sum():
            m = M.morphology.convex_hull_image(m)
        out.append((m, M.formwerte(m)))
    return out


def nfc_bg(rgb):
    return _bg(rgb, 0.0, 0.05)


def _tal(profil, lo, hi):
    lo, hi = max(0, int(lo)), min(len(profil), int(hi))
    if hi - lo < 3:
        return None
    return lo + int(np.argmin(profil[lo:hi]))


def raster_trennen(fg, unten=None):
    """NFC-Tafeln: 2 Reihen x 3 Spalten. Trennlinien in den Tälern der Projektionen
    ziehen, damit sich berührende Früchte getrennt werden."""
    h, w = fg.shape
    oben_teil = fg[:unten] if unten else fg
    ys, xs = np.nonzero(oben_teil)
    if len(xs) < 100:
        return fg, None
    x0, x1 = np.percentile(xs, [1, 99])
    y0, y1 = np.percentile(ys, [1, 99])
    spalt = ndi.uniform_filter1d(oben_teil.sum(0).astype(float), 9)
    zeil = ndi.uniform_filter1d(oben_teil.sum(1).astype(float), 9)
    sx = x1 - x0
    t1 = _tal(spalt, x0 + sx * 0.22, x0 + sx * 0.45)
    t2 = _tal(spalt, x0 + sx * 0.55, x0 + sx * 0.78)
    sy = y1 - y0
    ty = _tal(zeil, y0 + sy * 0.35, y0 + sy * 0.65)
    fg = fg.copy()
    for t in (t1, t2):
        if t is not None:
            fg[:, max(0, t - 1):t + 2] = False
    if ty is not None:
        fg[max(0, ty - 1):ty + 2, :] = False
    return fg, (t1, t2, ty)


def analysiere_nfc(rgb, bg_ref=None):
    """NFC-Fototafel: 2x3 Raster, links Seitenansichten, Mitte Stiel-/Kelchansicht,
    rechts oben Längsschnitt, rechts unten Querschnitt. rgb: float 0..1."""
    bg = nfc_bg(rgb)
    info = {"bg_rgb": bg.round(3).tolist()}
    lab_roh = color.rgb2lab(rgb)
    if bg_ref is not None:
        rgb = M.weissabgleich(rgb, bg, bg_ref)
    lab = color.rgb2lab(rgb)
    h, w = rgb.shape[:2]
    fg, bgm = segment_hintergrund(lab_roh, mit_modell=True)
    fg_ohne = etikett_entfernen(lab_roh, fg, bgm)
    # Etikettoberkante = erste Zeile, ab der entfernt wurde
    entfernt = fg & ~fg_ohne
    unten = None
    if entfernt.any():
        unten = int(np.nonzero(entfernt.any(1))[0][0])
    fg = M.morphology.binary_opening(fg_ohne, M.morphology.disk(2))
    fg, linien = raster_trennen(fg, unten)
    info["raster"] = linien
    fg = ndi.binary_fill_holes(fg)
    lbl = M.measure.label(fg)
    zellen = {}
    if linien and None not in linien:
        t1, t2, ty = linien
        for r in M.measure.regionprops(lbl):
            if r.area < 0.008 * h * w:
                continue
            cy, cx = r.centroid
            sp = 0 if cx < t1 else (1 if cx < t2 else 2)
            ze = 0 if cy < ty else 1
            if (ze, sp) not in zellen or r.area > zellen[(ze, sp)].area:
                zellen[(ze, sp)] = r
    info["zellen"] = len(zellen)
    ganz, schnitt, verworfen = [], [], []
    for (ze, sp), r in sorted(zellen.items()):
        m = M.rundlich(lbl == r.label)
        if m.sum() < 0.008 * h * w:
            verworfen.append(("klein", None))
            continue
        f = M.formwerte(m)
        f["zelle"] = (ze, sp)
        if f["solidity"] < 0.85 or f["achsen"] > 1.8:
            verworfen.append(("form", f))
            continue
        f["fleisch"] = M.fleischanteil(lab, m)
        if sp == 2:
            if f["fleisch"] > 0.08:
                schnitt.append((m, f))
            else:
                verworfen.append(("schnitt_ohne_fleisch", f))
        else:
            ganz.append((m, f))
    if len(ganz) > 1:
        med = float(np.median([f["flaeche"] for _, f in ganz]))
        klein = [(m, f) for m, f in ganz if f["flaeche"] < 0.4 * med]
        ganz = [(m, f) for m, f in ganz if f["flaeche"] >= 0.4 * med]
        verworfen += [("klein", f) for _, f in klein]
    info["verworfen"] = [v[0] for v in verworfen]
    info["n_ganz"], info["n_schnitt"] = len(ganz), len(schnitt)
    # ab Version 10 pixelweise: Deck über a* relativ zur Grundfarbe (auch dunkle, entsättigte Rottöne)
    erg = M.schalenfarben_pixel(lab, [m for m, _ in ganz]) if ganz else None
    fleisch = None
    if schnitt:
        cols = [M.fleischfarbe(lab, m) for m, _ in schnitt]
        cols = [c for c in cols if c is not None]
        if cols:
            fleisch = np.median(np.array(cols), axis=0)
    hzb, hzb_quelle = None, None
    laengs = [f for _, f in schnitt if f["zelle"] == (0, 2)]
    if laengs:
        hzb, hzb_quelle = laengs[0]["hoehe"] / laengs[0]["breite"], "laengsschnitt"
    seiten = [f["hoehe"] / f["breite"] for _, f in ganz if f["zelle"][1] == 0]
    info["hzb_seiten"] = [round(x, 3) for x in seiten]
    if hzb is None and seiten:
        hzb, hzb_quelle = float(np.median(seiten)), "seitenansicht"
    return {
        "rgb": rgb, "lab": lab, "ganz": [m for m, _ in ganz], "schnitt": [m for m, _ in schnitt],
        "form_ganz": [f for _, f in ganz], "form_schnitt": [f for _, f in schnitt],
        "farben": erg, "fleisch": fleisch, "hzb": hzb, "hzb_quelle": hzb_quelle, "info": info,
    }


# ====================================================================== Tafeln

def papier_schaetzen(lab):
    """Papierfarbe = häufigste helle, wenig bunte Farbe (grob quantisiert)."""
    L, a, b = lab[..., 0], lab[..., 1], lab[..., 2]
    sel = (L > 50) & (np.hypot(a, b) < 40)
    p = lab[sel]
    if len(p) < 100:
        p = lab.reshape(-1, 3)
    q = np.round(p / np.array([4.0, 3.0, 3.0])).astype(int)
    keys, inv, cnt = np.unique(q, axis=0, return_inverse=True, return_counts=True)
    top = cnt.argmax()
    return np.median(p[inv.ravel() == top], axis=0)


def scanrand_maske(lab):
    """Schwarzer Scanrand / dunkle Unterlage, mit dem Bildrand verbunden."""
    L = lab[..., 0]
    C = np.hypot(lab[..., 1], lab[..., 2])
    dunkel = (L < 35) & (C < 15)
    lbl = M.measure.label(dunkel)
    h, w = L.shape
    randlabels = set(np.unique(np.concatenate([lbl[0], lbl[-1], lbl[:, 0], lbl[:, -1]]))) - {0}
    return np.isin(lbl, list(randlabels))


def umrisszeichnung(lab, papier, rand):
    """Ungefärbter Längsschnitt als Linienzeichnung (Bleistift/Tusche): größte zusammenhängende
    Linienfigur mit rundlichem Umriss, Fläche = konvexe Hülle ohne Stiel."""
    h, w = lab.shape[:2]
    dunkel = (lab[..., 0] < papier[0] - 20) & ~rand
    dunkel = M.morphology.binary_closing(dunkel, M.morphology.disk(2))
    lbl = M.measure.label(dunkel)
    best = None
    for r in M.measure.regionprops(lbl):
        minr, minc, maxr, maxc = r.bbox
        bh, bw = maxr - minr, maxc - minc
        if bh * bw < 0.05 * h * w or bw > 0.9 * w or bh > 0.9 * h:
            continue
        if not (0.55 < bh / max(bw, 1) < 1.6):
            continue
        huelle = M.rundlich(M.morphology.convex_hull_image(lbl == r.label))
        if huelle.sum() < 0.04 * h * w:
            continue
        f = M.formwerte(huelle)
        if f["rundheit"] < 0.75 or f["achsen"] > 1.5:
            continue
        # Umriss muss ringsum gezeichnet sein: Hüllrand liegt fast überall an einer Linie
        randlinie = huelle & ~M.morphology.binary_erosion(huelle, M.morphology.disk(1))
        nah = M.morphology.binary_dilation(lbl == r.label, M.morphology.disk(4))
        abdeckung = (randlinie & nah).sum() / max(1, randlinie.sum())
        f["abdeckung"] = float(abdeckung)
        if abdeckung < 0.8:
            continue
        if best is None or f["flaeche"] > best[1]["flaeche"]:
            best = (huelle, f)
    return best


def analysiere_tafel(rgb, blatt_filter=True):
    lab_roh = color.rgb2lab(rgb)
    rand = scanrand_maske(lab_roh)
    papier = papier_schaetzen(lab_roh)
    d_pap = np.hypot(lab_roh[..., 1] - papier[1], lab_roh[..., 2] - papier[2]) + 0.5 * np.abs(lab_roh[..., 0] - papier[0])
    papierartig = (d_pap < 10) & ~rand
    bgm = M.bg_modell(lab_roh, papierartig, papierartig)
    d = np.hypot(lab_roh[..., 1] - bgm[..., 1], lab_roh[..., 2] - bgm[..., 2])
    dunkler = bgm[..., 0] - lab_roh[..., 0]
    C = np.hypot(lab_roh[..., 1], lab_roh[..., 2])
    stark = ((d > 10) | ((dunkler > 25) & (C > 12))) & ~rand
    # schwacher Vordergrund (blasses Fruchtfleisch, dünne Schalenränder), nur wo er an
    # starken Vordergrund anschließt
    schwach = ((d > 5) | (dunkler > 10)) & ~rand
    schwach = M.morphology.binary_closing(schwach, M.morphology.disk(2))
    lblw = M.measure.label(schwach)
    st_lbl = np.unique(lblw[M.morphology.binary_opening(stark, M.morphology.disk(2))])
    fg = np.isin(lblw, st_lbl[st_lbl > 0]) | stark
    # gemalte Schlagschatten (grau, dunkler als Papier) nicht zur Frucht zählen
    fg &= ~((d < 9) & (dunkler > 5))
    info = {"papier_lab": papier.round(1).tolist()}
    if blatt_filter:
        h_ = M.hue(lab_roh[..., 1], lab_roh[..., 2])
        blatt = (h_ > 128) & (h_ < 200) & (C > 8) & (lab_roh[..., 0] < 62)
        fg &= ~blatt
    # Weißabgleich: Papierton -> neutral (gleiche Helligkeit)
    pap_rgb = color.lab2rgb(papier.reshape(1, 1, 3)).reshape(3)
    neutral = color.lab2rgb(np.array([papier[0], 0, 0]).reshape(1, 1, 3)).reshape(3)
    rgb_n = M.weissabgleich(rgb, pap_rgb, neutral)
    lab = color.rgb2lab(rgb_n)
    h, w = fg.shape
    lbl, regs = M.komponenten(fg, min_anteil=0.006, oeffnen=1, schliessen=2)
    kandidaten, verworfen = [], []

    def pruefen(roh, geteilt=False, tiefe=0):
        m = M.rundlich(roh)
        if m.sum() < 0.006 * h * w:
            verworfen.append("klein")
            return
        f = M.formwerte(m)
        if f["breite"] > 0.97 * w or f["hoehe"] > 0.97 * h:
            verworfen.append("randgross")
            return
        if f["rundheit"] < 0.55 or f["achsen"] > 1.7 or f["solidity"] < 0.85:
            # Schnitt mit offenem Schalenrand (Stielgrube): konvexe Hülle versuchen
            huelle = M.rundlich(M.morphology.convex_hull_image(roh))
            fh = M.formwerte(huelle) if huelle.sum() > 0 else None
            luecke = huelle & ~roh
            hell_unbunt = False
            if luecke.sum() > 0:
                Ll, Cl = lab_roh[..., 0][luecke], np.hypot(lab_roh[..., 1], lab_roh[..., 2])[luecke]
                hell_unbunt = Ll.mean() > papier[0] - 20 and (Cl < 25).mean() > 0.7
            if (fh and fh["rundheit"] > 0.7 and fh["achsen"] < 1.6 and roh.sum() < 0.75 * huelle.sum()
                    and hell_unbunt):
                fh["huelle"] = True
                fh["geteilt"] = geteilt
                fh["fleisch"] = M.fleischanteil(lab, huelle)
                kandidaten.append((huelle, fh))
                return
            # verschmolzene Früchte (Frucht + Schnitt überlappend, Fruchtgruppen) trennen
            if tiefe == 0 and f["solidity"] < 0.9:
                teile = M.aufteilen(m, 0.3)
                if len(teile) > 1:
                    for t in teile:
                        pruefen(t, True, 1)
                    return
            verworfen.append("form")
            return
        f["geteilt"] = geteilt
        f["fleisch"] = M.fleischanteil(lab, m)
        kandidaten.append((m, f))

    for r in regs:
        pruefen(lbl == r.label)
    # Hülle nur für Schnitte; ganze Früchte müssen kompakt und rund sein
    gefiltert = []
    for m, f in kandidaten:
        if f["fleisch"] <= 0.45 and (f.get("huelle") or f["rundheit"] < 0.7 or f["solidity"] < 0.9):
            verworfen.append("ganz_unrund")
            continue
        gefiltert.append((m, f))
    kandidaten = gefiltert
    info["verworfen"] = verworfen
    if not kandidaten:
        # ungefärbte Umrisszeichnung (Bleistift/Tusche)? Dann nur Höhe/Breite
        u = umrisszeichnung(lab_roh, papier, rand)
        if u is not None:
            info["umriss"] = True
            return {"rgb": rgb_n, "lab": lab, "ganz": [], "schnitt": [u[0]], "farben": None, "fleisch": None,
                    "hzb": u[1]["hoehe"] / u[1]["breite"], "hzb_quelle": "umrisszeichnung", "info": info}
        return {"rgb": rgb_n, "lab": lab, "ganz": [], "schnitt": [], "farben": None, "fleisch": None,
                "hzb": None, "hzb_quelle": None, "info": info}
    groesste = max(f["flaeche"] for _, f in kandidaten)
    kandidaten = [(m, f) for m, f in kandidaten if f["flaeche"] > 0.25 * groesste]
    # Früchte sind auf den Tafeln groß (lebensgroß gemalt); kleine runde Objekte sind
    # Knospen, Blüten oder Beiwerk
    kandidaten = [(m, f) for m, f in kandidaten if f["breite"] >= 0.18 * w]
    if not kandidaten:
        info["verworfen"].append("zu_klein")
        return {"rgb": rgb_n, "lab": lab, "ganz": [], "schnitt": [], "farben": None, "fleisch": None,
                "hzb": None, "hzb_quelle": None, "info": info}
    schnitt = [(m, f) for m, f in kandidaten if f["fleisch"] > 0.45]
    ganz = [(m, f) for m, f in kandidaten if f["fleisch"] <= 0.45]
    if ganz and schnitt:
        # ein Schnitt ist etwa so groß wie die Frucht; deutlich kleinere "Schnitte" sind nur
        # Kernhaus-Teile einer unvollständig erkannten Schnittfläche
        gross = max(f["flaeche"] for _, f in ganz)
        weg = [x for x in schnitt if x[1]["flaeche"] < 0.6 * gross]
        schnitt = [x for x in schnitt if x[1]["flaeche"] >= 0.6 * gross]
        info["verworfen"] += ["schnitt_zu_klein"] * len(weg)
    erg = M.schalenfarben_pixel(lab, [m for m, _ in ganz]) if ganz else None
    fleisch = None
    if schnitt:
        cols = [M.fleischfarbe(lab, m) for m, _ in schnitt]
        cols = [c for c in cols if c is not None]
        if cols:
            fleisch = np.median(np.array(cols), axis=0)
    hzb, quelle = None, None
    s_ok = [x for x in schnitt if not x[1].get("geteilt")]
    g_ok = [x for x in ganz if not x[1].get("geteilt")]
    if s_ok:
        s = max(s_ok, key=lambda x: x[1]["flaeche"])[1]
        hzb, quelle = s["hoehe"] / s["breite"], "laengsschnitt"
    elif g_ok:
        g = max(g_ok, key=lambda x: x[1]["flaeche"])[1]
        hzb, quelle = g["hoehe"] / g["breite"], "seitenansicht"
    info["n_ganz"], info["n_schnitt"] = len(ganz), len(schnitt)
    return {"rgb": rgb_n, "lab": lab, "ganz": [m for m, _ in ganz], "schnitt": [m for m, _ in schnitt],
            "form_ganz": [f for _, f in ganz], "form_schnitt": [f for _, f in schnitt],
            "farben": erg, "fleisch": fleisch, "hzb": hzb, "hzb_quelle": quelle, "info": info}


def analysiere_foto(rgb):
    """Freies Commons-Foto: nur verwertbar bei ruhigem, einheitlichem Hintergrund und
    einer klar abgegrenzten, rundlichen Frucht, die den Bildrand nicht berührt."""
    h, w = rgb.shape[:2]
    lab_roh = color.rgb2lab(rgb)
    rand = M.randpixel(rgb, 0.0, 0.05)
    rp = lab_roh[rand]
    med = np.median(rp, axis=0)
    abw = np.hypot(np.hypot(rp[:, 1] - med[1], rp[:, 2] - med[2]), 0.5 * (rp[:, 0] - med[0]))
    info = {"rand_streuung": round(float(np.median(abw)), 2), "rand_lab": med.round(1).tolist()}
    leer = {"rgb": rgb, "lab": lab_roh, "ganz": [], "schnitt": [], "farben": None, "fleisch": None,
            "hzb": None, "hzb_quelle": None, "info": info}
    if np.median(abw) > 6 or np.percentile(abw, 80) > 14:
        info["abgelehnt"] = "unruhiger Hintergrund"
        return leer
    fg, bgm = segment_hintergrund(lab_roh, mit_modell=True)
    lbl, regs = M.komponenten(fg, min_anteil=0.03, oeffnen=2, schliessen=2)
    kand = []
    for r in regs:
        minr, minc, maxr, maxc = r.bbox
        if minr <= 1 or minc <= 1 or maxr >= h - 1 or maxc >= w - 1:
            continue
        m = M.rundlich(lbl == r.label)
        if m.sum() < 0.03 * h * w or m.sum() > 0.7 * h * w:
            continue
        f = M.formwerte(m)
        if f["rundheit"] < 0.7 or f["solidity"] < 0.92 or f["achsen"] > 1.5:
            continue
        kand.append((m, f))
    if not kand:
        info["abgelehnt"] = "keine klar freigestellte Frucht"
        return leer
    groesste = max(f["flaeche"] for _, f in kand)
    kand = [(m, f) for m, f in kand if f["flaeche"] > 0.3 * groesste]
    # Weißabgleich nur, wenn der Hintergrund annähernd unbunt ist
    rgb_n = rgb
    if np.hypot(med[1], med[2]) < 10:
        bg_rgb = color.lab2rgb(med.reshape(1, 1, 3)).reshape(3)
        neutral = color.lab2rgb(np.array([med[0], 0, 0]).reshape(1, 1, 3)).reshape(3)
        rgb_n = M.weissabgleich(rgb, bg_rgb, neutral)
        info["weissabgleich"] = True
    lab = color.rgb2lab(rgb_n)
    ganz = [(m, f) for m, f in kand if M.fleischanteil(lab, m) < 0.5]
    info["n_ganz"] = len(ganz)
    erg = M.schalenfarben(lab, [m for m, _ in ganz]) if ganz else None
    return {"rgb": rgb_n, "lab": lab, "ganz": [m for m, _ in ganz], "schnitt": [],
            "form_ganz": [f for _, f in ganz], "farben": erg, "fleisch": None,
            "hzb": None, "hzb_quelle": None, "info": info}
