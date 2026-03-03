from __future__ import annotations
import logging
import os
import re
from dataclasses import dataclass, field
from typing import TypedDict
from ebooklib import epub
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

MIN_IMAGE_BYTES = 5 * 1024  # 5 KB


class ExtractedImage(TypedDict):
    data: bytes
    ext: str
    mime: str
    page: int  # item index (no real pages in EPUB)
    offset: int
    width: int
    height: int


@dataclass
class EpubExtract:
    text: str
    images: list[ExtractedImage] = field(default_factory=list)

def extract_epub(path: str) -> EpubExtract:
    book = epub.read_epub(path)

    # Build map of image item file names to their raw bytes
    image_items: dict[str, epub.EpubImage] = {}
    for item in book.get_items():
        if item.get_type() == epub.ITEM_IMAGE:
            # Store by full href and by basename for flexible matching
            image_items[item.get_name()] = item
            image_items[os.path.basename(item.get_name())] = item

    parts: list[str] = []
    images: list[ExtractedImage] = []
    cursor = 0
    item_index = 0

    for item in book.get_items():
        if item.get_type() != epub.EpubHtml.TYPE_DOCUMENT:
            continue
        content = item.get_body_content()
        soup = BeautifulSoup(content, "html.parser")
        text = soup.get_text("\n")
        parts.append(text)

        # Find <img> tags and extract referenced images
        for img_tag in soup.find_all("img"):
            src = img_tag.get("src", "")
            if not src:
                continue
            # Resolve relative paths
            basename = os.path.basename(src)
            # Try matching by basename first, then full src
            img_item = image_items.get(basename) or image_items.get(src)
            if not img_item:
                # Try resolving relative to the HTML item's directory
                item_dir = os.path.dirname(item.get_name())
                resolved = os.path.normpath(os.path.join(item_dir, src))
                img_item = image_items.get(resolved)
            if not img_item:
                continue

            img_bytes = img_item.get_content()
            if len(img_bytes) < MIN_IMAGE_BYTES:
                continue

            mime = img_item.media_type or "image/png"
            ext_map = {
                "image/png": "png",
                "image/jpeg": "jpeg",
                "image/jpg": "jpg",
                "image/gif": "gif",
                "image/webp": "webp",
                "image/svg+xml": "svg",
            }
            ext = ext_map.get(mime, mime.split("/")[-1] if "/" in mime else "png")

            images.append(ExtractedImage(
                data=img_bytes,
                ext=ext,
                mime=mime,
                page=item_index,
                offset=cursor,
                width=0,  # EPUB doesn't reliably provide dimensions
                height=0,
            ))

        cursor += len(text)
        cursor += 1  # newline from join
        item_index += 1

    return EpubExtract(text="\n".join(parts), images=images)
