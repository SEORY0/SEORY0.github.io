#!/usr/bin/env python3
"""Turn a high-contrast illustration into portable, seven-bit ASCII art.

The output is a character drawing, not a text rendering of an image file.
Each character cell combines local darkness with a vote for the direction of
nearby edges. This works best with a simple cat/CRT silhouette on a plain
background. Use --mode to compare hybrid, edge-only, and tone-only results.
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageEnhance, ImageOps


# Darkest first. The final space is selected only by the blank-cell rule below.
TONES = "@%#*+=-:. "
DIRECTIONS = ("|", "-", "/", "\\")
CELL_WIDTH = 8
CELL_HEIGHT = 14  # A terminal glyph is narrower than it is tall.
BAYER_4 = (
    (0, 8, 2, 10),
    (12, 4, 14, 6),
    (3, 11, 1, 9),
    (15, 7, 13, 5),
)


def open_ink_image(path: Path, background: str, polarity: str) -> Image.Image:
    """Return grayscale with the subject dark and the background light."""
    with Image.open(path) as source:
        image = ImageOps.exif_transpose(source).convert("RGBA")

    if background == "auto":
        total = count = 0
        pixels = image.load()
        for y in range(image.height):
            for x in range(image.width):
                r, g, b, alpha = pixels[x, y]
                if alpha >= 32:
                    total += (r * 299 + g * 587 + b * 114) / 1000
                    count += 1
        mean = total / count if count else 0
        fill = 0 if mean > 127 else 255
    else:
        fill = 255 if background == "white" else 0

    canvas = Image.new("RGBA", image.size, (fill, fill, fill, 255))
    canvas.alpha_composite(image)
    gray = ImageOps.grayscale(canvas.convert("RGB"))

    if polarity == "auto":
        width, height = gray.size
        border = (
            [gray.getpixel((x, 0)) for x in range(width)]
            + [gray.getpixel((x, height - 1)) for x in range(width)]
            + [gray.getpixel((0, y)) for y in range(height)]
            + [gray.getpixel((width - 1, y)) for y in range(height)]
        )
        light_on_dark = sum(border) / len(border) < 127
    else:
        light_on_dark = polarity == "light-on-dark"

    if light_on_dark:
        gray = ImageOps.invert(gray)
    return ImageOps.autocontrast(gray, cutoff=1)


def trim_background(image: Image.Image, threshold: int, padding: float) -> Image.Image:
    """Crop plain margins while retaining a small safety margin."""
    mask = image.point(lambda value: 255 if value < threshold else 0)
    bounds = mask.getbbox()
    if bounds is None:
        return image
    left, top, right, bottom = bounds
    border = round(max(right - left, bottom - top) * padding)
    bounds = (
        max(0, left - border),
        max(0, top - border),
        min(image.width, right + border),
        min(image.height, bottom + border),
    )
    return image.crop(bounds)


def fit_to_cells(image: Image.Image, cols: int, rows: int, fit: str) -> Image.Image:
    """Place the subject in a canvas sized like the eventual character grid."""
    size = (cols * CELL_WIDTH, rows * CELL_HEIGHT)
    if fit == "stretch":
        return image.resize(size, Image.Resampling.LANCZOS)
    if fit == "cover":
        return ImageOps.fit(image, size, method=Image.Resampling.LANCZOS, centering=(0.5, 0.5))

    subject = ImageOps.contain(image, size, method=Image.Resampling.LANCZOS)
    canvas = Image.new("L", size, 255)
    canvas.paste(subject, ((size[0] - subject.width) // 2, (size[1] - subject.height) // 2))
    return canvas


def edge_vote(pixels, x0: int, y0: int, width: int, height: int) -> tuple[str, float, float]:
    """Find the strongest tangent direction and average edge energy in a cell."""
    votes = [0.0, 0.0, 0.0, 0.0]
    horizontal_sign = 0.0
    total = 0.0
    for y in range(y0, y0 + CELL_HEIGHT):
        up = max(0, y - 1)
        down = min(height - 1, y + 1)
        for x in range(x0, x0 + CELL_WIDTH):
            left = max(0, x - 1)
            right = min(width - 1, x + 1)
            gx = pixels[right, y] - pixels[left, y]
            gy = pixels[x, down] - pixels[x, up]
            ax, ay = abs(gx), abs(gy)
            strength = ax + ay
            if strength < 12:
                continue
            total += strength
            if ax > ay * 1.75:
                votes[0] += strength  # Edge runs vertically.
            elif ay > ax * 1.75:
                votes[1] += strength  # Edge runs horizontally.
                horizontal_sign += gy
            elif gx * gy > 0:
                votes[2] += strength  # Rising slash in image coordinates.
            else:
                votes[3] += strength

    index = max(range(4), key=votes.__getitem__)
    area = CELL_WIDTH * CELL_HEIGHT
    direction = "_" if index == 1 and horizontal_sign > 0 else DIRECTIONS[index]
    return direction, votes[index] / area, total / area


def tone_for_cell(
    pixels, x0: int, y0: int, gamma: float, low_weight: float, tone_floor: float
) -> tuple[str, float]:
    """Use the mean and a low percentile so thin dark strokes survive."""
    samples = [
        pixels[x, y]
        for y in range(y0, y0 + CELL_HEIGHT)
        for x in range(x0, x0 + CELL_WIDTH)
    ]
    average = sum(samples) / len(samples)
    samples.sort()
    low = samples[len(samples) // 10]
    darkness = (1 - low_weight) * (255 - average) + low_weight * (255 - low)
    normalized = max(0.0, (darkness - tone_floor) / (255 - tone_floor))
    adjusted = 255 * normalized ** gamma
    index = min(len(TONES) - 1, int((1 - adjusted / 255) * (len(TONES) - 1)))
    return TONES[index], darkness


def render_ascii(
    image: Image.Image,
    cols: int = 64,
    rows: int = 40,
    mode: str = "hybrid",
    fit: str = "contain",
    edge_threshold: float = 16.0,
    ink_threshold: float = 24.0,
    gamma: float = 0.9,
    low_weight: float = 0.15,
    tone_floor: float = 0.0,
    dither: str = "none",
) -> str:
    """Return exactly ``rows`` lines of at most ``cols`` ASCII characters."""
    canvas = fit_to_cells(image, cols, rows, fit)
    pixels = canvas.load()
    width, height = canvas.size
    cells: list[list[tuple[str, float, str, float, float]]] = []

    for row in range(rows):
        cell_row = []
        y0 = row * CELL_HEIGHT
        for col in range(cols):
            x0 = col * CELL_WIDTH
            tone, darkness = tone_for_cell(pixels, x0, y0, gamma, low_weight, tone_floor)
            edge, edge_energy, total_energy = edge_vote(pixels, x0, y0, width, height)
            cell_row.append((tone, darkness, edge, edge_energy, total_energy))
        cells.append(cell_row)

    lines: list[str] = []

    for row in range(rows):
        result: list[str] = []
        for col in range(cols):
            tone, darkness, edge, edge_energy, total_energy = cells[row][col]
            adjacent = [
                cells[neighbor_row][neighbor_col][1]
                for neighbor_row, neighbor_col in (
                    (row - 1, col), (row + 1, col),
                    (row, col - 1), (row, col + 1),
                )
                if 0 <= neighbor_row < rows and 0 <= neighbor_col < cols
            ]
            compact_blob = (
                darkness >= 185
                and adjacent
                and max(adjacent) <= darkness - 45
                and total_energy >= edge_threshold
            )
            tone_strength = max(0.0, (darkness - tone_floor) / (255 - tone_floor)) ** gamma
            tone_visible = darkness >= ink_threshold
            if dither == "ordered" and tone_strength < 0.8:
                tone_visible = tone_visible and tone_strength >= (BAYER_4[row % 4][col % 4] + 0.5) / 16

            if mode == "tone":
                char = tone if tone_visible else " "
            elif mode == "edge":
                char = edge if edge_energy >= edge_threshold else " "
            elif compact_blob:
                char = "o"
            elif edge_energy >= edge_threshold and edge_energy >= total_energy * 0.48:
                char = edge
            else:
                char = tone if tone_visible else " "
            result.append(char)
        lines.append("".join(result).rstrip())

    # Keep leading spaces (the drawing's alignment) and all requested rows.
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("input", type=Path, help="Source PNG or JPG illustration")
    parser.add_argument("output", type=Path, help="ASCII .txt output, or '-' for stdout")
    parser.add_argument("--cols", type=int, default=64, help="Character columns (default: 64)")
    parser.add_argument("--rows", type=int, default=40, help="Character rows (default: 40)")
    parser.add_argument("--mode", choices=("hybrid", "edge", "tone"), default="hybrid")
    parser.add_argument("--fit", choices=("contain", "cover", "stretch"), default="contain")
    parser.add_argument("--background", choices=("auto", "white", "black"), default="auto")
    parser.add_argument("--polarity", choices=("auto", "dark-on-light", "light-on-dark"), default="auto")
    parser.add_argument("--no-trim", action="store_true", help="Keep all source-image margins")
    parser.add_argument("--trim-threshold", type=int, default=225)
    parser.add_argument("--padding", type=float, default=0.04, help="Safety margin when trimming (default: 0.04)")
    parser.add_argument("--edge-threshold", type=float, default=16.0)
    parser.add_argument("--ink-threshold", type=float, default=24.0)
    parser.add_argument("--gamma", type=float, default=0.9, help="Tone contrast; lower is darker")
    parser.add_argument("--low-weight", type=float, default=0.15, help="Weight of the darkest 10%% of each cell")
    parser.add_argument("--tone-floor", type=float, default=0.0, help="Darkness subtracted before mapping tones")
    parser.add_argument("--dither", choices=("none", "ordered"), default="none", help="Space out middle tones")
    args = parser.parse_args()

    if args.cols <= 0 or args.rows <= 0:
        parser.error("--cols and --rows must be positive")
    if not 0 <= args.trim_threshold <= 255:
        parser.error("--trim-threshold must be in 0..255")
    if not 0 <= args.padding < 0.5:
        parser.error("--padding must be in [0, 0.5)")
    if args.edge_threshold < 0 or args.ink_threshold < 0 or args.gamma <= 0:
        parser.error("thresholds must be nonnegative and gamma must be positive")
    if not 0 <= args.low_weight <= 1 or not 0 <= args.tone_floor < 255:
        parser.error("--low-weight must be in [0, 1] and --tone-floor in [0, 255)")
    if not args.input.is_file():
        parser.error(f"input does not exist: {args.input}")

    try:
        image = open_ink_image(args.input, args.background, args.polarity)
    except OSError as exc:
        parser.error(f"cannot read input image: {exc}")
    if not args.no_trim:
        image = trim_background(image, args.trim_threshold, args.padding)

    art = render_ascii(
        image,
        cols=args.cols,
        rows=args.rows,
        mode=args.mode,
        fit=args.fit,
        edge_threshold=args.edge_threshold,
        ink_threshold=args.ink_threshold,
        gamma=args.gamma,
        low_weight=args.low_weight,
        tone_floor=args.tone_floor,
        dither=args.dither,
    )
    assert art.isascii()

    if str(args.output) == "-":
        sys.stdout.write(art)
    else:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(art, encoding="ascii", newline="\n")
        print(f"Wrote {args.cols} columns x {args.rows} rows to {args.output}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
