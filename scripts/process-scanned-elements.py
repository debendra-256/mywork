import os
from PIL import Image
import numpy as np
from collections import deque
import json

src_base = r'c:\Users\deben\Downloads\ScannedImages'
dst_dir = r'D:\Debendra\ImgMojo\mywork\public\ScannedElement'
os.makedirs(dst_dir, exist_ok=True)

items = [
    {
        'folder': 'Events',
        'src_file': 'Birthday Sticker (3 Inch) Happy Birthday Vibrant Colors Paint Splash Yellow.jpeg',
        'id': 'el_event_birthday_splash',
        'name': 'Happy Birthday Vibrant Splash',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'download (1).jpeg',
        'id': 'el_event_birthday_cake',
        'name': 'Happy Birthday Cake Badge',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'Happy anniversary wedding wish lettering text illustration with red love _ Premium Vector.jpeg',
        'id': 'el_event_anniversary_lettering',
        'name': 'Happy Anniversary Lettering',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'Happy Birthday Text PNG _ Gold & Red Celebration Graphic.jpeg',
        'id': 'el_event_birthday_gold_red',
        'name': 'Happy Birthday Gold & Red',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'Happy New Year 2026 Celebration Clipart with Golden Styling and Transparent PNG.jpeg',
        'id': 'el_event_new_year_2026',
        'name': 'Happy New Year 2026',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'Kids Party Decor Ideas for First Birthday Celebration.jpeg',
        'id': 'el_event_first_birthday_decor',
        'name': 'Kids First Birthday Decor',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'Nav Varsh 2023 Design Creative Hindi New Year Designs, New Year Hindi, Nav Varsh, Nav Varsh Calligraphy PNG and Vector with Transparent Background for Free Download.jpeg',
        'id': 'el_event_nav_varsh_creative',
        'name': 'Nav Varsh Hindi Calligraphy',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'Nav Varsh Ki Hardik Shubhkamnaye Hindi Calligraphy With Decorative Elements, Nav Varsh Hindi Calligraphy, Happy New Year In Hindi, Nutan Varsh PNG and Vector with Transparent Background for Free Download.jpeg',
        'id': 'el_event_nav_varsh_hardik',
        'name': 'Nav Varsh Hardik Shubhkamnaye',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'Sharing this stunning image with everyone, hope it will bring you inspiration and joy_.jpeg',
        'id': 'el_event_anniversary_hearts',
        'name': 'Happy Anniversary Hearts',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Festivals',
        'src_file': 'Chhath Puja Arghya Hindi Text Clipart _ Beautiful Festival Design.jpeg',
        'id': 'el_festival_chhath_puja_arghya',
        'name': 'Chhath Puja Arghya Clipart',
        'tag': 'Festivals',
        'tolerance': 28
    },
    {
        'folder': 'Festivals',
        'src_file': 'Diwali Festival Colorful Creative Calligraphy Of Shubh Decorative Artwork Illustration, Diwali, Colorful, Hindi Calligraphy PNG and Vector with Transparent Background for Free Download.jpeg',
        'id': 'el_festival_diwali_shubh_calligraphy',
        'name': 'Shubh Diwali Calligraphy',
        'tag': 'Festivals',
        'tolerance': 28
    },
    {
        'folder': 'Festivals',
        'src_file': 'Diwali Wall Art Print _ Colourful Diya & Rangoli Festival of Lights Decor.jpeg',
        'id': 'el_festival_diwali_diya_rangoli',
        'name': 'Diwali Diya & Rangoli Decor',
        'tag': 'Festivals',
        'tolerance': 32
    },
    {
        'folder': 'Festivals',
        'src_file': 'download.jpeg',
        'id': 'el_festival_chhath_puja_wishes',
        'name': 'Chhath Puja Mahaparv Wishes',
        'tag': 'Festivals',
        'tolerance': 32
    },
    {
        'folder': 'Festivals',
        'src_file': 'Happy diwali festive greeting with ornate lettering and a traditional oil lamp illustration.jpeg',
        'id': 'el_festival_happy_diwali_oil_lamp',
        'name': 'Happy Diwali Oil Lamp Greeting',
        'tag': 'Festivals',
        'tolerance': 28
    },
    {
        'folder': 'Festivals',
        'src_file': 'Typography Colorful Happy Diwali Or Lettering Multicolor Greeting Illustration, Happy Diwali, Typography, Lettering PNG and Vector with Transparent Background for Free Download.jpeg',
        'id': 'el_festival_diwali_multicolor',
        'name': 'Happy Diwali Multicolor Typography',
        'tag': 'Festivals',
        'tolerance': 28
    },
    {
        'folder': 'others',
        'src_file': 'download (2).jpeg',
        'id': 'el_other_comic_boom_yellow',
        'name': 'Comic Boom Yellow Splash',
        'tag': 'Others',
        'tolerance': 28
    },
    {
        'folder': 'others',
        'src_file': 'download (3).jpeg',
        'id': 'el_other_comic_boom_cyan',
        'name': 'Comic Boom Cyan Splash',
        'tag': 'Others',
        'tolerance': 28
    }
]

def process_cutout(src_path, dst_path, tolerance=28):
    im = Image.open(src_path).convert('RGB')
    w, h = im.size
    arr = np.array(im, dtype=np.int32)
    top = arr[0, :, :]
    bottom = arr[-1, :, :]
    left = arr[:, 0, :]
    right = arr[:, -1, :]
    border = np.concatenate([top, bottom, left, right], axis=0)
    bg = np.median(border, axis=0)
    limit = 3 * (tolerance ** 2)
    visited = np.zeros((h, w), dtype=bool)
    is_bg = np.zeros((h, w), dtype=bool)
    diff_sq = np.sum((arr - bg) ** 2, axis=-1)
    near = diff_sq <= limit
    q = deque()
    def seed(y, x):
        if not visited[y, x]:
            visited[y, x] = True
            if near[y, x]:
                is_bg[y, x] = True
                q.append((y, x))
    for x in range(w):
        seed(0, x); seed(h - 1, x)
    for y in range(h):
        seed(y, 0); seed(y, w - 1)
    while q:
        cy, cx = q.popleft()
        for dy, dx in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
            ny, nx = cy + dy, cx + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                visited[ny, nx] = True
                if near[ny, nx]:
                    is_bg[ny, nx] = True
                    q.append((ny, nx))
    rgba = np.zeros((h, w, 4), dtype=np.uint8)
    rgba[:, :, :3] = np.clip(arr, 0, 255).astype(np.uint8)
    rgba[:, :, 3] = np.where(is_bg, 0, 255).astype(np.uint8)
    res = Image.fromarray(rgba, 'RGBA')
    bbox = res.getbbox()
    if bbox:
        pad = 2
        bbox = (max(0, bbox[0]-pad), max(0, bbox[1]-pad), min(w, bbox[2]+pad), min(h, bbox[3]+pad))
        res = res.crop(bbox)
    res.save(dst_path, format='PNG')
    return res.size

results = []
for item in items:
    src_path = os.path.join(src_base, item['folder'], item['src_file'])
    out_filename = f"{item['id']}.png"
    dst_path = os.path.join(dst_dir, out_filename)
    width, height = process_cutout(src_path, dst_path, item['tolerance'])
    aspect = round(width / height, 3)
    results.append({
        'id': item['id'],
        'name': item['name'],
        'tag': item['tag'],
        'src': f"/ScannedElement/{out_filename}",
        'aspect': aspect,
        'width': width,
        'height': height,
        'slots': [],
        'createdAt': 1731450000000 + len(results) * 1000
    })
    print(f"Processed {item['id']}: {width}x{height} (aspect: {aspect})")

with open(r'D:\Debendra\ImgMojo\mywork\data\new-scanned-elements.json', 'w', encoding='utf-8') as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
print('Complete! All cutouts created.')
