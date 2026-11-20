#!/usr/bin/env python3
"""Create Android icons from the official SCORACE symbol already committed in the repository."""
from pathlib import Path
from PIL import Image, ImageOps

repo = Path(__file__).resolve().parents[2]
source = repo / "scorace-symbol-256.webp"
res = repo / "android" / "app" / "src" / "main" / "res"

with Image.open(source) as original:
    image = original.convert("RGBA")
    for density, size in {"mdpi":48, "hdpi":72, "xhdpi":96, "xxhdpi":144, "xxxhdpi":192}.items():
        folder = res / ("mipmap-" + density)
        folder.mkdir(parents=True, exist_ok=True)
        ImageOps.fit(image, (size,size), method=Image.Resampling.LANCZOS).save(folder/"ic_launcher.png", optimize=True)
    background = Image.new("RGBA", (432,432), (16,16,16,255))
    artwork = ImageOps.contain(image, (280,280), method=Image.Resampling.LANCZOS)
    background.alpha_composite(artwork, ((432-artwork.width)//2, (432-artwork.height)//2))
    folder=res/"drawable-nodpi"
    folder.mkdir(parents=True,exist_ok=True)
    background.save(folder/"ic_launcher_foreground.png", optimize=True)
print("SCORACE icons generated.")
