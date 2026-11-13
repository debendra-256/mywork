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
        'src_file': 'download (1).jpeg',
        'id': 'el_event_republic_day_red_fort',
        'name': 'Republic Day Red Fort & Chakra',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'download.jpeg',
        'id': 'el_event_tricolor_crowd_celebration',
        'name': 'Tricolor Flag National Celebration',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'Gandhi Jayanti Festival Post Template _ Social Media Greeting for Instagram & Facebook.jpeg',
        'id': 'el_event_gandhi_jayanti_charkha',
        'name': 'Gandhi Jayanti Charkha Greeting',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'Happy gandhi jayanti on 2nd october a national festival of india celebration social media post _ Premium AI-generated vector.jpeg',
        'id': 'el_event_gandhi_jayanti_2nd_october',
        'name': 'Happy Gandhi Jayanti 2nd October',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'Happy International Womens Day Celebration For Young Girl Design Backgrounds _ JPG Free Download - Pikbest.jpeg',
        'id': 'el_event_womens_day_young_girl',
        'name': "International Women's Day Celebration",
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'Happy Republic Day.jpeg',
        'id': 'el_event_republic_day_wings',
        'name': 'Happy Republic Day Tricolor Wings',
        'tag': 'Events',
        'tolerance': 32
    },
    {
        'folder': 'Events',
        'src_file': 'multitasking wonaniya 🌼.jpeg',
        'id': 'el_event_multitasking_woman',
        'name': 'Multitasking Woman Illustration',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'National youth day in india with swamiji birth social media post banner template _ Premium AI-generated vector.jpeg',
        'id': 'el_event_national_youth_day_swamiji_banner',
        'name': 'National Youth Day Swamiji Banner',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'National youth day, yuwa diwas, anniversary celebrations of swami vivekananda _ Premium Vector.jpeg',
        'id': 'el_event_yuwa_diwas_vivekananda',
        'name': 'Yuwa Diwas Swami Vivekananda',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': 'Swami ji jayanti with national youth day on 12 january celebration social media post _ Premium Vector.jpeg',
        'id': 'el_event_national_youth_day_12_jan',
        'name': 'National Youth Day 12 January',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Events',
        'src_file': "Women in Aesthetics for International Women's Day.jpeg",
        'id': 'el_event_women_in_aesthetics',
        'name': 'Women in Aesthetics Graphic',
        'tag': 'Events',
        'tolerance': 28
    },
    {
        'folder': 'Festivals',
        'src_file': 'download.jpeg',
        'id': 'el_festival_ganesh_chaturthi_calligraphy',
        'name': 'Happy Ganesh Chaturthi Calligraphy',
        'tag': 'Festivals',
        'tolerance': 28
    },
    {
        'folder': 'Festivals',
        'src_file': 'Vector art happy ganesh chaturthi festival celebration background _ Premium AI-generated vector.jpeg',
        'id': 'el_festival_ganesh_chaturthi_vector_art',
        'name': 'Ganesh Chaturthi Celebration Art',
        'tag': 'Festivals',
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

new_results = []
for idx, item in enumerate(items):
    src_path = os.path.join(src_base, item['folder'], item['src_file'])
    out_filename = f"{item['id']}.png"
    dst_path = os.path.join(dst_dir, out_filename)
    width, height = process_cutout(src_path, dst_path, item['tolerance'])
    aspect = round(width / height, 3)
    new_results.append({
        'id': item['id'],
        'name': item['name'],
        'tag': item['tag'],
        'src': f"/ScannedElement/{out_filename}",
        'aspect': aspect,
        'width': width,
        'height': height,
        'slots': [],
        'createdAt': 1731460000000 + idx * 1000
    })
    print(f"Processed {item['id']}: {width}x{height} (aspect: {aspect})")

# Merge into data/scanned-elements.json
json_path = r'D:\Debendra\ImgMojo\mywork\data\scanned-elements.json'
with open(json_path, 'r', encoding='utf-8') as f:
    existing = json.load(f)

merged = {item['id']: item for item in existing}
for item in new_results:
    merged[item['id']] = item

all_elements = list(merged.values())
with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(all_elements, f, indent=2, ensure_ascii=False)

# Also dump new items for adding to elements.js and api/scanned-elements.js
with open(r'D:\Debendra\ImgMojo\mywork\data\new-scanned-elements-batch2.json', 'w', encoding='utf-8') as f:
    json.dump(new_results, f, indent=2, ensure_ascii=False)

print(f"Total elements in scanned-elements.json: {len(all_elements)}")
