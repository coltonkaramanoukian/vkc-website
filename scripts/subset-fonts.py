#!/usr/bin/env python3
"""Build the web font the site serves from the OFL variable TTF.

    python3 scripts/subset-fonts.py

Archivo ships as a variable font with wdth 62-125 and wght 100-900. The site
uses wdth 62-112.5 (condensed display 62-70, body 100, expanded 112.5) and
wght 400-900, so the axes
are pinned to those ranges before subsetting: every unused delta is weight on
the LCP path, and the glyphs at the values the CSS asks for are unchanged.
The character set is the latin range (French needs nothing more). Output is
written next to the source of truth in brand/fonts/web/.

Needs fontTools (pip) and the wawoff2 npm package (fetched by npx).
"""

from __future__ import annotations

import os
import subprocess
import sys
import tempfile

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCE = os.path.join(ROOT, "brand/fonts/ttf/Archivo[wdth,wght].ttf")
TARGET = os.path.join(ROOT, "brand/fonts/web/Archivo-latin-wdth-wght.woff2")

# Keep in step with src/app/fonts.ts (weight, font-stretch) and brand/BRAND.md.
AXES = {"wdth": (62.0, 112.5), "wght": (400.0, 900.0)}

# The latin range: ASCII, Latin-1, œ/Œ, the punctuation block, €, ™, arrows.
LATIN_RANGES = [
    (0x0000, 0x00FF), (0x0131, 0x0131), (0x0152, 0x0153), (0x02BB, 0x02BC),
    (0x02C6, 0x02C6), (0x02DA, 0x02DA), (0x02DC, 0x02DC), (0x0304, 0x0304),
    (0x0308, 0x0308), (0x0329, 0x0329), (0x2000, 0x206F), (0x20AC, 0x20AC),
    (0x2122, 0x2122), (0x2191, 0x2191), (0x2193, 0x2193), (0x2212, 0x2212),
    (0x2215, 0x2215), (0xFEFF, 0xFEFF), (0xFFFD, 0xFFFD),
]


def latin_unicodes() -> list[int]:
    return [cp for lo, hi in LATIN_RANGES for cp in range(lo, hi + 1)]


def subset_options() -> subset.Options:
    options = subset.Options()
    options.layout_features = ["*"]
    options.notdef_outline = True
    options.recalc_bounds = True
    options.hinting = False
    options.desubroutinize = True
    return options


def build() -> None:
    if not os.path.exists(SOURCE):
        sys.exit(f"missing source font: {SOURCE}")
    with tempfile.TemporaryDirectory() as tmp:
        # Pin, save, reload: the subsetter wants a font freshly read from disk.
        pinned_path = os.path.join(tmp, "archivo-pinned.ttf")
        instancer.instantiateVariableFont(
            TTFont(SOURCE), AXES, inplace=False, updateFontNames=False
        ).save(pinned_path)
        pinned = TTFont(pinned_path)
        subsetter = subset.Subsetter(subset_options())
        subsetter.populate(unicodes=latin_unicodes())
        subsetter.subset(pinned)
        ttf_path = os.path.join(tmp, "archivo.ttf")
        pinned.save(ttf_path)
        subprocess.run(
            ["npx", "-y", "-p", "wawoff2", "woff2_compress.js", ttf_path, TARGET],
            check=True,
            cwd=ROOT,
        )

    axes = ", ".join(f"{tag} {lo:g}-{hi:g}" for tag, (lo, hi) in AXES.items())
    print(f"wrote {os.path.relpath(TARGET, ROOT)}: {os.path.getsize(TARGET)} bytes, "
          f"{len(pinned.getGlyphOrder())} glyphs, {axes}")


if __name__ == "__main__":
    build()
