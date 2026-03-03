"""
Bulk image seeder — run once from the backend/ folder.

Usage:
    python seed_images.py

Setup:
    1. Create a folder called seed_images/ inside backend/
    2. Put your images there, named after the item's catalogue_nr:
           FE-CO2-5.jpg
           MAN-4521-B.png
           OIL-FILTER-7.webp
       If an item has no catalogue_nr, you can use the exact item name instead.
    3. Run this script.

Matching priority:
    1. catalogue_nr  (exact, case-insensitive)
    2. item name     (exact, case-insensitive, fallback)

Images already set on an item are skipped by default.
Pass --overwrite to replace existing images.
"""

import sys
import os
from pathlib import Path
from shutil import copy2
from uuid import uuid4

# Allow running from backend/ without installing the package
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models.item import Item

IMAGES_DIR = Path("seed_images")
MEDIA_DIR  = Path("media/items")
OVERWRITE  = "--overwrite" in sys.argv

SUPPORTED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def main():
    if not IMAGES_DIR.exists():
        print(f"ERROR: '{IMAGES_DIR}' folder not found.")
        print("Create it and put your images inside, named by catalogue_nr.")
        sys.exit(1)

    MEDIA_DIR.mkdir(parents=True, exist_ok=True)

    image_files = [
        f for f in IMAGES_DIR.iterdir()
        if f.is_file() and f.suffix.lower() in SUPPORTED_EXTENSIONS
    ]

    if not image_files:
        print(f"No images found in '{IMAGES_DIR}'. Supported: {', '.join(SUPPORTED_EXTENSIONS)}")
        sys.exit(0)

    print(f"Found {len(image_files)} image(s) in '{IMAGES_DIR}'\n")

    db = SessionLocal()

    ok = skipped = not_found = already_set = 0

    try:
        for img_path in sorted(image_files):
            stem = img_path.stem  # filename without extension

            # Try catalogue_nr first, then name
            item = db.query(Item).filter(
                Item.catalogue_nr.ilike(stem)
            ).first()

            if not item:
                item = db.query(Item).filter(
                    Item.name.ilike(stem)
                ).first()

            if not item:
                print(f"  SKIP     {img_path.name:<40} — no item found for '{stem}'")
                not_found += 1
                continue

            if item.image_path and not OVERWRITE:
                print(f"  EXISTS   {img_path.name:<40} — '{item.name}' already has an image (use --overwrite)")
                already_set += 1
                continue

            # Remove old image file if overwriting
            if item.image_path and OVERWRITE:
                old = Path(item.image_path)
                if old.exists():
                    old.unlink()

            # Copy to media/items/ with a unique filename
            ext = img_path.suffix.lower()
            dest_name = f"{uuid4()}{ext}"
            dest_path = MEDIA_DIR / dest_name
            copy2(img_path, dest_path)

            item.image_path = str(dest_path)
            action = "UPDATED" if OVERWRITE and item.image_path else "OK"
            print(f"  {action:<8} {img_path.name:<40} → {item.name}")
            ok += 1

        db.commit()

    except Exception as e:
        db.rollback()
        print(f"\nERROR during commit: {e}")
        sys.exit(1)

    finally:
        db.close()

    print(f"""
──────────────────────────────
  Imported:   {ok}
  Skipped:    {already_set}  (already had image)
  Not found:  {not_found}  (no matching item)
──────────────────────────────
""")


if __name__ == "__main__":
    main()
