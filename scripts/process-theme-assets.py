#!/usr/bin/env python3
"""Process supplied Tropical, Sports, and Drinks artwork into runtime PNGs."""

from __future__ import annotations

import json
import os
import sys
from collections import deque
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path('/tmp/asset-work')
OUT = ROOT / 'public' / 'assets' / 'images'

ALPHA_MIN = 10
BLACK_MAX = 8


def saturation(r: int, g: int, b: int) -> float:
    mx = max(r, g, b)
    mn = min(r, g, b)
    return 0.0 if mx == 0 else (mx - mn) / mx


def is_white_bg_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a <= 8:
        return False
    return r >= 238 and g >= 238 and b >= 238 and saturation(r, g, b) < 0.12


def is_black_bg_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a <= 8:
        return False
    return r <= BLACK_MAX and g <= BLACK_MAX and b <= BLACK_MAX


def flood_key(img: Image.Image, predicate) -> Image.Image:
    rgba = img.convert('RGBA')
    w, h = rgba.size
    pixels = rgba.load()
    seen = [[False] * w for _ in range(h)]
    q: deque[tuple[int, int]] = deque()

    def try_seed(x: int, y: int) -> None:
        if x < 0 or y < 0 or x >= w or y >= h or seen[y][x]:
            return
        r, g, b, a = pixels[x, y]
        if predicate(r, g, b, a):
            seen[y][x] = True
            q.append((x, y))

    for x in range(w):
        try_seed(x, 0)
        try_seed(x, h - 1)
    for y in range(h):
        try_seed(0, y)
        try_seed(w - 1, y)

    while q:
        x, y = q.popleft()
        r, g, b, a = pixels[x, y]
        pixels[x, y] = (r, g, b, 0)
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not seen[ny][nx]:
                nr, ng, nb, na = pixels[nx, ny]
                if predicate(nr, ng, nb, na):
                    seen[ny][nx] = True
                    q.append((nx, ny))
    return rgba


def visible_bounds(img: Image.Image) -> tuple[int, int, int, int] | None:
    rgba = img.convert('RGBA')
    w, h = rgba.size
    pixels = rgba.load()
    min_x, min_y, max_x, max_y = w, h, -1, -1
    for y in range(h):
        for x in range(w):
            if pixels[x, y][3] > ALPHA_MIN:
                min_x = min(min_x, x)
                min_y = min(min_y, y)
                max_x = max(max_x, x)
                max_y = max(max_y, y)
    if max_x < 0:
        return None
    return min_x, min_y, max_x - min_x + 1, max_y - min_y + 1


def process_image(src: Path, dst: Path, bg: str) -> dict:
    img = Image.open(src)
    if bg == 'white':
        out = flood_key(img, is_white_bg_pixel)
    elif bg == 'black':
        out = flood_key(img, is_black_bg_pixel)
    else:
        out = img.convert('RGBA')
    bounds = visible_bounds(out)
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, 'PNG', optimize=True)
    aspect = round(bounds[2] / bounds[3], 3) if bounds else 1.0
    return {
        'file': str(dst.relative_to(ROOT / 'public')),
        'bounds': bounds,
        'aspect': aspect,
        'source': src.name,
    }


TROPICAL = [
    ('01_raspberry.png', 'tropical/tropical_01_raspberry.png', 'white'),
    ('02_kiwi.png', 'tropical/tropical_02_kiwi.png', 'white'),
    ('03_starfruit.png', 'tropical/tropical_03_starfruit.png', 'white'),
    ('04_passionfruit.png', 'tropical/tropical_04_passionfruit.png', 'white'),
    ('05_dragonfruit.png', 'tropical/tropical_05_dragonfruit.png', 'white'),
    ('06_mango.png', 'tropical/tropical_06_mango.png', 'white'),
    ('07_banana.png', 'tropical/tropical_07_banana.png', 'white'),
    ('08_coconut.png', 'tropical/tropical_08_coconut.png', 'white'),
    ('09_papaya.png', 'tropical/tropical_09_papaya.png', 'white'),
]

SPORTS = [
    ('01_ping_pong.png', 'sports/sports_01_pingpong.png', 'none'),
    ('02_golf_ball.png', 'sports/sports_02_golf.png', 'none'),
    ('03_pool_8_ball.png', 'sports/sports_03_8ball.png', 'none'),
    ('04_tennis_ball.png', 'sports/sports_04_tennis.png', 'none'),
    ('05_baseball.png', 'sports/sports_05_baseball.png', 'none'),
    ('06_volleyball.png', 'sports/sports_06_volleyball.png', 'none'),
    ('07_soccer_trionda.png', 'sports/sports_07_soccer.png', 'none'),
    ('08_american_football.png', 'sports/sports_08_football.png', 'none'),
    ('09_rugby_ball.png', 'sports/sports_09_rugby.png', 'none'),
    ('10_basketball.png', 'sports/sports_10_basketball.png', 'none'),
    ('11_trophy.png', 'sports/sports_11_trophy.png', 'none'),
]

DRINKS = [
    ('01_ice_cube.jpg', 'drinks/drinks_01_ice.png', 'white'),
    ('02_shot_glass.jpg', 'drinks/drinks_02_shot.png', 'white'),
    ('03_whiskey_glass.jpg', 'drinks/drinks_03_whiskey.png', 'white'),
    ('04_champagne_glass.jpg', 'drinks/drinks_04_champagne.png', 'white'),
    ('05_white_wine_glass.jpg', 'drinks/drinks_05_wine_white.png', 'white'),
    ('06_red_wine_glass.jpg', 'drinks/drinks_06_wine_red.png', 'white'),
    ('07_martini_glass.jpg', 'drinks/drinks_07_martini.png', 'white'),
    ('08_long_drink.jpg', 'drinks/drinks_08_long.png', 'white'),
    ('09_beer_mug.jpg', 'drinks/drinks_09_beer.png', 'white'),
    ('10_large_cocktail_glass.jpg', 'drinks/drinks_10_cocktail.png', 'white'),
    ('11_champagne_bottle.png', 'drinks/drinks_11_bottle.png', 'black'),
]


def main() -> int:
    report: dict[str, list[dict]] = {'tropical': [], 'sports': [], 'drinks': []}
    for name, rel, bg in TROPICAL:
        report['tropical'].append(process_image(SRC / 'tropical' / name, OUT / rel, bg))
    for name, rel, bg in SPORTS:
        report['sports'].append(process_image(SRC / 'sports' / name, OUT / rel, bg))
    for name, rel, bg in DRINKS:
        report['drinks'].append(process_image(SRC / 'drinks' / name, OUT / rel, bg))

  # Remove superseded files.
    old_files = [
        OUT / 'tropical/tropical_02_starfruit.png',
        OUT / 'tropical/tropical_03_kiwi.png',
        OUT / 'tropical/tropical_05_mango.png',
        OUT / 'tropical/tropical_06_banana.png',
        OUT / 'tropical/tropical_07_dragonfruit.png',
        OUT / 'tropical/tropical_08_papaya.png',
        OUT / 'tropical/tropical_09_coconut.png',
        OUT / 'sports/sports_01_shuttlecock.png',
        OUT / 'sports/sports_02_pingpong.png',
        OUT / 'sports/sports_03_tennis.png',
        OUT / 'sports/sports_05_softball.png',
        OUT / 'sports/sports_06_8ball.png',
        OUT / 'sports/sports_07_volleyball.png',
        OUT / 'sports/sports_08_basketball.png',
        OUT / 'sports/sports_09_soccer.png',
        OUT / 'sports/sports_10_football.png',
        OUT / 'drinks/drinks_02_olive.png',
        OUT / 'drinks/drinks_04_wine.png',
        OUT / 'drinks/drinks_05_martini.png',
        OUT / 'drinks/drinks_06_whiskey.png',
        OUT / 'drinks/drinks_07_cocktail.png',
        OUT / 'drinks/drinks_08_margarita.png',
        OUT / 'drinks/drinks_09_mojito.png',
        OUT / 'drinks/drinks_10_champagne.png',
    ]
    for path in old_files:
        if path.exists():
            path.unlink()

    out_json = ROOT / 'scripts' / 'processed-assets-report.json'
    out_json.write_text(json.dumps(report, indent=2))
    print(f'Wrote {out_json}')
    return 0


if __name__ == '__main__':
    sys.exit(main())
