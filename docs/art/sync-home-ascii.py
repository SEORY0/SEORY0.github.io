#!/usr/bin/env python3
"""Copy the portable ASCII cat into the home page's <pre> element."""

from __future__ import annotations

import html
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
ART = ROOT / "assets/avatars/crt-cat.txt"
HOME = ROOT / "_layouts/home.html"


def main() -> None:
    art = ART.read_text(encoding="ascii").rstrip("\n")
    if not art.isascii() or "^" in art:
        raise ValueError("The home ASCII art must use supported 7-bit characters")

    source = HOME.read_bytes()
    newline = b"\r\n" if b"\r\n" in source else b"\n"
    escaped = html.escape(art, quote=False).replace("\n", newline.decode("ascii"))
    pattern = rb'(<pre class="crt-cat" aria-hidden="true">).*?(</pre>)'
    updated, count = re.subn(
        pattern,
        lambda match: match.group(1) + escaped.encode("ascii") + match.group(2),
        source,
        count=1,
        flags=re.DOTALL,
    )
    if count != 1:
        raise ValueError("Expected one home page CRT cat <pre> element")
    HOME.write_bytes(updated)


if __name__ == "__main__":
    main()
