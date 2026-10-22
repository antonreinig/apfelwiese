"""Lädt Vorschaubilder (thumburl aus imageinfo) nach daten/roh/bilder/img/<gruppe>/.

Bilder breiter als 480 px werden auf 480 px Breite verkleinert und als WebP (q82)
gespeichert (Platz auf der Platte ist knapp); JPEG-Bilder bis 640 px (NFC) bleiben unverändert.
Sequentiell, mit Pause, eigener User-Agent.

Aufruf als Modul: laden.datei(titel, thumburl, gruppe) -> lokaler Pfad
"""
import hashlib
import io
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import commons as c  # noqa: E402
from PIL import Image  # noqa: E402

IMG = os.path.join(c.ROH, "img")
Image.MAX_IMAGE_PIXELS = 60_000_000


def schluessel(titel):
    return hashlib.sha1(titel.encode()).hexdigest()[:16]


def pfad(titel, gruppe):
    k = schluessel(titel)
    d = os.path.join(IMG, gruppe)
    for ext in (".jpg", ".webp", ".png"):
        p = os.path.join(d, k + ext)
        if os.path.exists(p):
            return p
    return None


def datei(titel, url, gruppe):
    p = pfad(titel, gruppe)
    if p:
        return p
    d = os.path.join(IMG, gruppe)
    os.makedirs(d, exist_ok=True)
    roh = c.holen(url)
    im = Image.open(io.BytesIO(roh))
    k = schluessel(titel)
    if im.format == "JPEG" and im.width <= 640:
        p = os.path.join(d, k + ".jpg")
        with open(p, "wb") as f:
            f.write(roh)
        return p
    if im.mode in ("P", "LA", "RGBA", "PA"):
        hg = Image.new("RGB", im.size, (255, 255, 255))
        im = im.convert("RGBA")
        hg.paste(im, mask=im.split()[3])
        im = hg
    else:
        im = im.convert("RGB")
    # Platz sparen: lokale Kopie höchstens 480 px breit (für die Messung ausreichend)
    if im.width > 480:
        im = im.resize((480, max(1, round(480 * im.height / im.width))), Image.LANCZOS)
    p = os.path.join(d, k + ".webp")
    im.save(p, "WEBP", quality=82, method=4)
    return p


def platz_frei_mb():
    os.makedirs(IMG, exist_ok=True)
    st = os.statvfs(IMG)
    return st.f_bavail * st.f_frsize / 1e6
