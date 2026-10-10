#!/usr/bin/env python3
"""Copy the ASCII drawings into the home page's <pre> elements.

Two drawings (the cat on the CRT and Lucy), each in a light- and a
dark-theme version: assets/avatars/crt-cat-photo-light.txt goes into
<pre class="art-cat-light">, and so on.
"""

from __future__ import annotations

import html
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
HOME = ROOT / "_layouts/home.html"
ARTS = {
    "art-cat-light": ROOT / "assets/avatars/crt-cat-photo-light.txt",
    "art-cat-dark": ROOT / "assets/avatars/crt-cat-photo-dark.txt",
    "art-lucy-light": ROOT / "assets/avatars/lucy-light.txt",
    "art-lucy-dark": ROOT / "assets/avatars/lucy-dark.txt",
}


def main() -> None:
    source = HOME.read_bytes()
    newline = b"\r\n" if b"\r\n" in source else b"\n"
    for cls, path in ARTS.items():
        art = path.read_text(encoding="ascii").rstrip("\n")
        if not art.isascii() or "^" in art:
            raise ValueError(f"{path.name}: the home ASCII art must use supported 7-bit characters")
        escaped = html.escape(art, quote=False).replace("\n", newline.decode("ascii"))
        pattern = rb'(<pre class="' + cls.encode("ascii") + rb'">).*?(</pre>)'
        source, count = re.subn(
            pattern,
            lambda match: match.group(1) + escaped.encode("ascii") + match.group(2),
            source,
            count=1,
            flags=re.DOTALL,
        )
        if count != 1:
            raise ValueError(f'Expected one <pre class="{cls}"> on the home page')
    HOME.write_bytes(source)


if __name__ == "__main__":
    main()
