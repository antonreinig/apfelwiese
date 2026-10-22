# Hilfsfunktionen zur Normalisierung von Sortennamen (historische und heutige Schreibweisen).
import re, unicodedata

ERSATZ = [
    ("reinette", "renette"), ("reinett", "renett"), ("rother", "roter"), ("rothe", "rote"), ("roth", "rot"),
    ("calville", "kalvill"), ("calvill", "kalvill"), ("kalville", "kalvill"), ("cardinal", "kardinal"),
    ("rambour", "rambur"), ("pepping", "peping"), ("pippin", "peping"), ("gülderling", "gulderling"),
    ("gulderling", "gulderling"), ("parmaene", "parmane"), ("parmäne", "parmane"), ("pearmain", "parmane"),
    ("thier", "tier"), ("theil", "teil"), ("canada", "kanada"), ("cousinot", "kusinot"), ("c", "k"),
    ("ph", "f"), ("th", "t"), ("ß", "ss"), ("y", "i"),
]

def norm(name: str) -> str:
    s = name.lower()
    s = re.sub(r"\(.*?\)", " ", s)
    s = s.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = s.replace("ae", "a").replace("oe", "o").replace("ue", "u")
    for a, b in ERSATZ:
        s = s.replace(a, b)
    s = re.sub(r"[^a-z]", "", s)
    s = s.replace("ss", "s")
    return s

def slug(name: str) -> str:
    s = name.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    s = unicodedata.normalize("NFKD", s)
    s = "".join(c for c in s if not unicodedata.combining(c))
    s = re.sub(r"\(apfel\)|\(apfelsorte\)", "", s)
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")
