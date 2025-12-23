"""
Convert train_images/*.tif to train_images_png/*.png for the web app.
"""

from __future__ import annotations

import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SRC_DIR = ROOT / "train_images"
DEST_DIR = ROOT / "train_images_png"


def main() -> int:
  try:
    from PIL import Image
  except ImportError:
    print("Pillow is required. Install with: python -m pip install pillow", file=sys.stderr)
    return 1

  if not SRC_DIR.exists():
    print(f"Missing source dir: {SRC_DIR}", file=sys.stderr)
    return 1

  DEST_DIR.mkdir(exist_ok=True)

  tiffs = sorted(SRC_DIR.glob("*.tif"))
  if not tiffs:
    print("No TIFF files found.")
    return 1

  for tif_path in tiffs:
    png_path = DEST_DIR / (tif_path.stem + ".png")
    if png_path.exists():
      continue

    try:
      with Image.open(tif_path) as img:
        img = img.convert("RGB")
        img.save(png_path, "PNG")
    except Exception as exc:
      print(f"Failed to convert {tif_path.name}: {exc}", file=sys.stderr)

  print(f"Converted {len(tiffs)} files to {DEST_DIR}")
  return 0


if __name__ == "__main__":
  raise SystemExit(main())
