from pathlib import Path
from PIL import Image

root = Path('/home/ubuntu/e-cedvel')
src = root / 'public/icons/e-cedvel-logo-source.png'
out = root / 'public/icons'
out.mkdir(parents=True, exist_ok=True)

image = Image.open(src).convert('RGBA')
# Keep the full supplied square logo so its original composition and background remain intact.
for size in (16, 32, 48, 180, 192, 512):
    resized = image.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(out / f'e-cedvel-icon-{size}.png', optimize=True)

image.resize((256, 256), Image.Resampling.LANCZOS).save(out / 'e-cedvel-favicon.ico', format='ICO', sizes=[(16,16), (32,32), (48,48), (64,64), (128,128), (256,256)])
print('Generated favicon assets in', out)
