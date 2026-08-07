"""Dimensiunile unei imagini, citite din antetul fișierului.

Facebook nu redă imaginea de share la prima accesare a unui link dacă
`og:image:width` / `og:image:height` lipsesc: pune descărcarea în coadă și
afișează între timp un preview fără poză. Ca să le putem publica, avem nevoie de
dimensiuni — fără a adăuga o dependență (Pillow) doar pentru atât.

Se citesc primii octeți ai fișierului, formatele acceptate la upload:
PNG, JPEG, GIF, WebP. Necunoscut / fișier corupt → None, iar apelantul renunță
tăcut la dimensiuni (metadatele rămân valide, doar mai sărace).
"""

from __future__ import annotations

import struct
from pathlib import Path


def _png(head: bytes) -> tuple[int, int] | None:
    if len(head) < 24 or head[:8] != b"\x89PNG\r\n\x1a\n":
        return None
    w, h = struct.unpack(">II", head[16:24])
    return int(w), int(h)


def _gif(head: bytes) -> tuple[int, int] | None:
    if len(head) < 10 or head[:6] not in (b"GIF87a", b"GIF89a"):
        return None
    w, h = struct.unpack("<HH", head[6:10])
    return int(w), int(h)


def _webp(head: bytes) -> tuple[int, int] | None:
    if len(head) < 30 or head[:4] != b"RIFF" or head[8:12] != b"WEBP":
        return None
    chunk = head[12:16]
    if chunk == b"VP8X":
        w = int.from_bytes(head[24:27], "little") + 1
        h = int.from_bytes(head[27:30], "little") + 1
        return w, h
    if chunk == b"VP8 ":
        w, h = struct.unpack("<HH", head[26:30])
        return int(w & 0x3FFF), int(h & 0x3FFF)
    if chunk == b"VP8L":
        bits = int.from_bytes(head[21:25], "little")
        return int(bits & 0x3FFF) + 1, int((bits >> 14) & 0x3FFF) + 1
    return None


def _jpeg(fh) -> tuple[int, int] | None:
    """JPEG ține dimensiunile într-un segment SOF, oriunde în fișier."""
    fh.seek(0)
    if fh.read(2) != b"\xff\xd8":
        return None
    while True:
        marker = fh.read(2)
        if len(marker) < 2 or marker[0] != 0xFF:
            return None
        size_bytes = fh.read(2)
        if len(size_bytes) < 2:
            return None
        (size,) = struct.unpack(">H", size_bytes)
        # SOF0..SOF15, mai puțin markerii care nu descriu cadrul.
        if 0xC0 <= marker[1] <= 0xCF and marker[1] not in (0xC4, 0xC8, 0xCC):
            body = fh.read(5)
            if len(body) < 5:
                return None
            h, w = struct.unpack(">HH", body[1:5])
            return int(w), int(h)
        fh.seek(size - 2, 1)


def image_dimensions(path: str | Path) -> tuple[int, int] | None:
    """(lățime, înălțime) în pixeli, sau None dacă nu se poate determina."""
    try:
        p = Path(path)
        with p.open("rb") as fh:
            head = fh.read(30)
            for parse in (_png, _gif, _webp):
                dims = parse(head)
                if dims:
                    return dims
            return _jpeg(fh)
    except (OSError, ValueError, struct.error):
        return None
