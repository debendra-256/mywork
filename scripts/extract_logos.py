import os
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter

images = [
    r'C:/Users/deben/.gemini/antigravity/brain/73ec805a-2eaf-43c1-90d9-785fc6ff602a/.user_uploaded/media_1795403923565_38394c70.jpg',
    r'C:/Users/deben/.gemini/antigravity/brain/73ec805a-2eaf-43c1-90d9-785fc6ff602a/.user_uploaded/media_1795403923565_6a62593f.jpg',
    r'C:/Users/deben/.gemini/antigravity/brain/73ec805a-2eaf-43c1-90d9-785fc6ff602a/.user_uploaded/media_1795403923567_fdf96a55.jpg',
    r'C:/Users/deben/.gemini/antigravity/brain/73ec805a-2eaf-43c1-90d9-785fc6ff602a/.user_uploaded/media_1795403923572_3970fa6e.jpg'
]

loaded_imgs = [Image.open(p).convert('RGBA') for p in images]

parties = [
    # Image 1 (img: 0, start: 179.0, step: 114.5)
    {'img': 0, 'row': 0, 'id': 'samajsevi', 'name': 'Samajsevi'},
    {'img': 0, 'row': 1, 'id': 'bjp', 'name': 'BJP'},
    {'img': 0, 'row': 2, 'id': 'inc', 'name': 'INC'},
    {'img': 0, 'row': 3, 'id': 'jdu', 'name': 'JDU'},
    {'img': 0, 'row': 4, 'id': 'jmm', 'name': 'JMM'},
    {'img': 0, 'row': 5, 'id': 'aap', 'name': 'AAP'},
    {'img': 0, 'row': 6, 'id': 'rjd', 'name': 'RJD'},
    {'img': 0, 'row': 7, 'id': 'sp', 'name': 'SP'},

    # Image 2 (img: 1, start: 187.0, step: 114.5)
    {'img': 1, 'row': 0, 'id': 'ajsu', 'name': 'AJSU'},
    {'img': 1, 'row': 1, 'id': 'iyc', 'name': 'IYC'},
    {'img': 1, 'row': 2, 'id': 'bjym', 'name': 'BJYM'},
    {'img': 1, 'row': 3, 'id': 'ljp', 'name': 'LJP'},
    {'img': 1, 'row': 4, 'id': 'rlsp', 'name': 'RLSP'},
    {'img': 1, 'row': 5, 'id': 'ham', 'name': 'HAM'},
    {'img': 1, 'row': 6, 'id': 'rld', 'name': 'RLD'},
    {'img': 1, 'row': 7, 'id': 'apnadal', 'name': 'APNADAL'},

    # Image 3 (img: 2, start: 185.5, step: 114.5)
    {'img': 2, 'row': 0, 'id': 'bsp', 'name': 'BSP'},
    {'img': 2, 'row': 1, 'id': 'aimim', 'name': 'AIMIM'},
    {'img': 2, 'row': 2, 'id': 'jansuraj', 'name': 'JAN_SURAJ'},
    {'img': 2, 'row': 3, 'id': 'rlp', 'name': 'RLP'},
    {'img': 2, 'row': 4, 'id': 'abvp', 'name': 'ABVP'},
    {'img': 2, 'row': 5, 'id': 'asp', 'name': 'ASP'},
    {'img': 2, 'row': 6, 'id': 'gfp', 'name': 'GFP'},
    {'img': 2, 'row': 7, 'id': 'inld', 'name': 'INLD'},

    # Image 4 (img: 3, start: 176.0, step: 114.5)
    {'img': 3, 'row': 0, 'id': 'mns', 'name': 'MNS'},
    {'img': 3, 'row': 1, 'id': 'ncp', 'name': 'NCP'},
    {'img': 3, 'row': 2, 'id': 'nsui', 'name': 'NSUI'},
    {'img': 3, 'row': 3, 'id': 'sad', 'name': 'SAD'},
    {'img': 3, 'row': 4, 'id': 'shivsena', 'name': 'Shiv Sena'},
    {'img': 3, 'row': 5, 'id': 'shivsena-ubt', 'name': 'Shiv Sena (UBT)'},
    {'img': 3, 'row': 6, 'id': 'tmc', 'name': 'TMC'},
    {'img': 3, 'row': 7, 'id': 'ysr', 'name': 'YSR'}
]

starts = [179.0, 187.0, 185.5, 176.0]

out_dir = r'D:\Debendra\ImgMojo\mywork\public\templates\logos'
dist_dir = r'D:\Debendra\ImgMojo\mywork\dist\templates\logos'
os.makedirs(out_dir, exist_ok=True)
os.makedirs(dist_dir, exist_ok=True)

TARGET_SIZE = 512  # True High-Definition 512x512 resolution
SUPER_SIZE = 2048  # 4x Supersampled anti-aliased mask

for p in parties:
    im = loaded_imgs[p['img']]
    cy = starts[p['img']] + p['row'] * 114.5
    cx = 66.5
    r = 32.5  # Full circular emblem outer radius

    # Subpixel crop
    box = (int(round(cx - r)), int(round(cy - r)), int(round(cx + r)), int(round(cy + r)))
    crop = im.crop(box)

    # Step 1: Intermediate upscale with Lanczos
    mid = crop.resize((256, 256), Image.Resampling.LANCZOS)

    # Step 2: Unsharp mask to make lines, text, and symbol artwork razor-sharp
    mid = mid.filter(ImageFilter.UnsharpMask(radius=1.5, percent=160, threshold=2))

    # Step 3: Enhance color saturation and contrast for vivid HD fidelity
    mid = ImageEnhance.Color(mid).enhance(1.15)
    mid = ImageEnhance.Contrast(mid).enhance(1.12)
    mid = ImageEnhance.Sharpness(mid).enhance(1.3)

    # Step 4: Final upscale to 512x512 HD
    hd = mid.resize((TARGET_SIZE, TARGET_SIZE), Image.Resampling.LANCZOS)

    # Step 5: High-resolution supersampled circular mask for clean circular transparency
    mask_large = Image.new('L', (SUPER_SIZE, SUPER_SIZE), 0)
    draw = ImageDraw.Draw(mask_large)
    # Circular mask with smooth edge
    draw.ellipse([6, 6, SUPER_SIZE - 7, SUPER_SIZE - 7], fill=255)
    mask = mask_large.resize((TARGET_SIZE, TARGET_SIZE), Image.Resampling.LANCZOS)

    # Apply mask
    hd.putalpha(mask)

    file_name = f"logo-{p['id']}.png"
    save_path = os.path.join(out_dir, file_name)
    dist_path = os.path.join(dist_dir, file_name)
    hd.save(save_path, 'PNG', optimize=True)
    hd.save(dist_path, 'PNG', optimize=True)
    print(f"Saved HD {file_name} ({hd.size[0]}x{hd.size[1]})")

print("All 32 HD party logo units extracted and upgraded to 512x512 HD!")
