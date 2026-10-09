"""Photo -> ASCII for the home willow.
usage: willow_ascii.py <image> <cols> <left> <top> <right> <bottom> <gamma> <ramp>
Cell aspect is Server Mono's: advance 0.63em, line-height 1.15em."""
import sys
from PIL import Image, ImageOps, ImageFilter

RAMPS = {
    'short': ' .:-=+*#%@',
    'long': " .'`^\",:;Il!i~+_-?][}{1)(|\\/tfjrxnuvczXYUJCLQ0OZmwqpdbkhao*#MW&8%B@$",
    'tree': " .,:;'\"|/\\({)}*%#@",
}
src, cols = sys.argv[1], int(sys.argv[2])
l, t, r, b = map(int, sys.argv[3:7])
gamma = float(sys.argv[7]); ramp = RAMPS[sys.argv[8]]
CELL = 1.15 / 0.63

im = Image.open(src).convert('L').crop((l, t, r, b))
im = ImageOps.autocontrast(im, cutoff=1)
rows = round(im.height / im.width * cols / CELL)
im = im.resize((cols, rows), Image.LANCZOS)
px = im.load()
out = []
for y in range(rows):
    line = ''
    for x in range(cols):
        v = px[x, y] / 255.0                 # 0 black .. 1 white
        d = (1 - v) ** gamma                 # darkness, shaped
        line += ramp[min(len(ramp) - 1, int(d * len(ramp)))]
    out.append(line.rstrip())
print('\n'.join(out))
