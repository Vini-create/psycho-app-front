#!/usr/bin/env python3
from pathlib import Path
import shutil

import cairo
import gi

gi.require_version("Rsvg", "2.0")
from gi.repository import Rsvg  # noqa: E402


ROOT = Path(__file__).resolve().parent
PAGE_DIR = ROOT / "pages"
VERSION = "0.8"
OUTPUT = ROOT / f"Sinapsa-Design-System-v{VERSION}.pdf"
LATEST_OUTPUT = ROOT / "Sinapsa-Design-System.pdf"
PAGE_WIDTH = 16 * 72
PAGE_HEIGHT = 10 * 72


def export() -> None:
    pages = sorted(PAGE_DIR.glob("*.svg"))
    if not pages:
        raise RuntimeError("Nenhuma página SVG encontrada. Rode generate-pages.mjs primeiro.")

    surface = cairo.PDFSurface(str(OUTPUT), PAGE_WIDTH, PAGE_HEIGHT)
    surface.set_metadata(cairo.PDF_METADATA_TITLE, f"Sinapsa. — Design Direction {VERSION}")
    surface.set_metadata(cairo.PDF_METADATA_AUTHOR, "Sinapsa.")
    surface.set_metadata(cairo.PDF_METADATA_SUBJECT, "Sistema visual provisório")

    for page in pages:
        context = cairo.Context(surface)
        context.scale(PAGE_WIDTH / 1600, PAGE_HEIGHT / 1000)
        handle = Rsvg.Handle.new_from_file(str(page))
        viewport = Rsvg.Rectangle()
        viewport.x = 0
        viewport.y = 0
        viewport.width = 1600
        viewport.height = 1000
        handle.render_document(context, viewport)
        surface.show_page()

    surface.finish()
    shutil.copyfile(OUTPUT, LATEST_OUTPUT)
    print(f"Exportado: {OUTPUT} ({len(pages)} páginas)")


if __name__ == "__main__":
    export()
