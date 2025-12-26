# TreeCanopy Segmentation Comparator

A lightweight web app to compare original satellite images with segmentation overlays generated from metadata.

## Features
- Side-by-side slider comparison (original vs. overlay)
- Filter by resolution, environment, and filename
- Paginated grid with adjustable display count
- Individual/Group color controls

## Dataset Assumptions
- `train_images_png/` contains PNG versions of the training images
- `train_annotations_updated/json` contains segmentation metadata
- File names in metadata match the images (e.g., `10cm_train_5.tif` -> `10cm_train_5.png`)

## Setup
1) Convert TIFF to PNG (required for browsers):
```bash
python scripts/prepare_web_assets.py
```

2) Start a local server from the repository root:
```bash
python -m http.server 8000
```

3) Open in your browser:
```
http://localhost:8000/webapp/index.html
```

## File Structure
```
webapp/
  index.html
  styles.css
  app.js
train_images_png/
train_annotations_updated/json
scripts/prepare_web_assets.py
```

## Notes
- Overlays are rendered on a canvas aligned to the displayed image size.
- If you see missing images, ensure PNGs exist in `train_images_png/`.
