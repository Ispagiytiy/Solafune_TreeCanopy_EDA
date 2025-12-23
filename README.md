# EDA Tree Canopy - Segmentation Overlay Comparator

A lightweight, static web app for exploring tree canopy segmentation results. It loads image metadata, draws polygon overlays, and provides a slider to compare originals with predicted masks.

## Features
- Side-by-side slider comparison (original vs. overlay)
- Filter by resolution, environment, and filename
- Paginated grid with adjustable display count
- Individual/group overlay color controls

## Directory layout (you provide the data)
This repository does **not** include imagery or metadata. Prepare the following structure locally and provide correct files from Solafune:

```
EDA_TreeCanopy/
  scripts/
    prepare_web_assets.py
  train_images/                       # you provide
    10cm_train_5.tif
    ...
  train_images_png/                   # generated from train_images/
    10cm_train_5.png
    ...
  train_annotations_updated_504bcc9e05b54435a9a56a841a3a1cf5.json  # you provide
  webapp/
    index.html
    app.js
    styles.css
```

If you prefer different names or locations, update the constants in `webapp/app.js`.

## Clone this repo
```bash
git clone https://github.com/Ispagiytiy/Solafune_TreeCanopy_EDA.git
cd Solafune_TreeCanopy_EDA
```

## Quick start
1) Place your source TIFFs under `train_images/`.
2) Place your metadata JSON at:
   `train_annotations_updated_504bcc9e05b54435a9a56a841a3a1cf5.json`
3) Convert TIFFs to PNGs for the browser:
```bash
python -m pip install pillow
python scripts/prepare_web_assets.py
```
4) Start a local server from the repository root:
```bash
python -m http.server 8000
```
5) Open the app:
```
http://localhost:8000/webapp/index.html
```

Notes:
- `file_name` is mapped to PNG by replacing `.tif` with `.png`.
- `segmentation` is a flat list of polygon points in image coordinates.

## Scripts
- `scripts/prepare_web_assets.py`: Converts `train_images/*.tif` to `train_images_png/*.png`.

## Customization
- Change metadata file name or image folder by editing `METADATA_URL` and `IMAGES_BASE` in `webapp/app.js`.
