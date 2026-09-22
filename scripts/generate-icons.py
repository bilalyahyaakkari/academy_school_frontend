"""
Builds every app icon from public/logo.png.

Run after changing the logo:

    cd frontend
    python3 -m pip install --user Pillow      # once
    python3 scripts/generate-icons.py

The source logo is a tall PNG with a lot of transparent padding, so the crest is
cropped to its own bounds first. Icons are then drawn on a solid background:
iOS composites transparency to BLACK on the home screen, which is what makes a
transparent logo look like a black square there.
"""

from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "public" / "logo.png"
BACKGROUND = (255, 255, 255, 255)  # white; swap for (20, 36, 115, 255) navy

# (path, pixel size, padding as a fraction of the canvas on each side)
#
# Padding notes:
#   0.06  a little breathing room inside iOS's rounded-square mask
#   0.20  Android "maskable": the launcher may crop to a circle covering only
#         the middle 80%, so everything important has to sit inside that
#   0.02  favicon sizes are tiny — give the crest as many pixels as possible
TARGETS = [
    (ROOT / "app" / "apple-icon.png", 180, 0.06),
    (ROOT / "app" / "icon.png", 512, 0.06),
    (ROOT / "public" / "icon-192.png", 192, 0.06),
    (ROOT / "public" / "icon-512.png", 512, 0.06),
    (ROOT / "public" / "icon-maskable-512.png", 512, 0.20),
]
FAVICON = (ROOT / "app" / "favicon.ico", [16, 32, 48], 0.02)


def cropped_logo() -> Image.Image:
    """The crest alone, with the transparent margin trimmed off."""
    logo = Image.open(SOURCE).convert("RGBA")
    box = logo.getbbox()
    if box is None:
        raise SystemExit(f"{SOURCE} is fully transparent")
    return logo.crop(box)


def render(logo: Image.Image, size: int, padding: float) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), BACKGROUND)
    inner = max(1, round(size * (1 - 2 * padding)))

    # Fit the crest inside the padded box without distorting it.
    scale = min(inner / logo.width, inner / logo.height)
    w, h = max(1, round(logo.width * scale)), max(1, round(logo.height * scale))
    resized = logo.resize((w, h), Image.LANCZOS)

    canvas.alpha_composite(resized, ((size - w) // 2, (size - h) // 2))
    return canvas


def main() -> None:
    logo = cropped_logo()
    print(f"source {SOURCE.name}: cropped to {logo.width}x{logo.height}")

    for path, size, padding in TARGETS:
        path.parent.mkdir(parents=True, exist_ok=True)
        render(logo, size, padding).convert("RGB").save(path, "PNG", optimize=True)
        print(f"  {path.relative_to(ROOT)}  {size}x{size}  ({path.stat().st_size // 1024} KB)")

    # NB: the .ico must stay RGBA. Next's image decoder rejects an ICO whose
    # embedded PNGs are RGB ("The PNG is not in RGBA format!"), and that error
    # takes down every page, not just the icon.
    ico_path, ico_sizes, ico_padding = FAVICON
    render(logo, max(ico_sizes), ico_padding).save(
        ico_path, "ICO", sizes=[(s, s) for s in ico_sizes]
    )
    print(f"  {ico_path.relative_to(ROOT)}  {ico_sizes}")


if __name__ == "__main__":
    main()
