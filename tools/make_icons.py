"""產生 PWA 圖示（深紫底、金色骰子）。改圖示就改這裡再跑一次：python tools/make_icons.py"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'icons')
os.makedirs(ROOT, exist_ok=True)


def draw(size, pad):
    s = size * 4  # 先畫大張再縮小，邊緣才平滑
    im = Image.new('RGBA', (s, s), '#14111f')
    d = ImageDraw.Draw(im)
    m = s * (0.2 + pad)
    d.rounded_rectangle([m, m, s - m, s - m], radius=s * 0.12, fill='#e0b04f')
    # 骰子五點
    r = s * 0.055
    c = s / 2
    off = (s - 2 * m) * 0.27
    for dx, dy in ((0, 0), (-1, -1), (1, -1), (-1, 1), (1, 1)):
        x, y = c + dx * off, c + dy * off
        d.ellipse([x - r, y - r, x + r, y + r], fill='#14111f')
    return im.resize((size, size), Image.LANCZOS)


draw(192, 0).save(os.path.join(ROOT, 'icon-192.png'))
draw(512, 0).save(os.path.join(ROOT, 'icon-512.png'))
draw(512, 0.06).save(os.path.join(ROOT, 'icon-maskable-512.png'))
print('ok')
