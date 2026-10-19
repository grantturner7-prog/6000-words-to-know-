#!/usr/bin/env python3
"""Build single-file versions of the app (no server needed).

  python3 scripts/build_demo.py                      -> demo/Genesis-6000-Words.html (a complete page)
  python3 scripts/build_demo.py --fragment out.html  -> the same app as a page fragment, for a host that
                                                        wraps the head and body itself (the Artifact tool)

Everything is inlined: styles, scripts, the batch list and every built batch.
Run it again after any change in app/ or content/. Needs only Python 3.
"""
import base64
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
APP = ROOT / "app"
SCRIPTS = ["i18n", "core", "dnd", "views-shell", "views-batch", "main"]
TITLE = "Genesis 6,000 English Words to Know"
FONTS = "https://fonts.googleapis.com/css2?family=Inter:wght@500;600;700;800&family=Noto+Sans+TC:wght@500;700;800&display=swap"
DESC = "Learn 20 English words at a time at three levels, with Traditional Chinese meanings you can switch on or off."


def read(p):
    return Path(p).read_text(encoding="utf-8")


def inline_data():
    data = {"batches": json.loads(read(ROOT / "content/batches.json"))}
    if (ROOT / "audio/index.json").exists():
        data["audio"] = json.loads(read(ROOT / "audio/index.json"))
    for f in sorted((ROOT / "content/batches").glob("b*.json")):
        data[f.stem] = json.loads(read(f))
    blob = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    return "window.G_INLINE=" + blob.replace("</", "<\\/") + ";"


def js_bundle():
    parts = [inline_data()]
    for name in SCRIPTS:
        src = read(APP / "js" / f"{name}.js")
        if "</script" in src.lower():
            raise SystemExit(f"{name}.js contains a closing script tag")
        parts.append(src)
    return "\n".join(parts)


def main(argv):
    css = read(APP / "css/app.css")
    js = js_bundle()
    if "--fragment" in argv:
        out = Path(argv[argv.index("--fragment") + 1])
        html = (f"<title>{TITLE}</title>\n"
                '<meta name="claude:viewport-fit-sides" content="cover">\n'
                '<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
                f'<link rel="stylesheet" href="{FONTS}">\n'
                f"<style>\n{css}\n</style>\n"
                '<div class="blobs" aria-hidden="true"><span></span><span></span><span></span></div>\n'
                '<div id="app"></div>\n'
                f"<script>\n{js}\n</script>\n")
    else:
        out = ROOT / "demo" / "Genesis-6000-Words.html"
        out.parent.mkdir(exist_ok=True)
        html = read(APP / "index.html")
        icon = "data:image/svg+xml;base64," + base64.b64encode((APP / "icon.svg").read_bytes()).decode()
        html = html.replace('<link rel="icon" href="icon.svg" type="image/svg+xml">', f'<link rel="icon" href="{icon}" type="image/svg+xml">')
        html = html.replace('<link rel="manifest" href="manifest.webmanifest">\n', "")
        html = html.replace('<link rel="stylesheet" href="css/app.css">', f"<style>\n{css}\n</style>")
        html = re.sub(r'(<script src="js/[^"]+"></script>\s*)+', lambda m: f"<script>\n{js}\n</script>\n", html, count=1)
        if 'src="js/' in html or 'href="css/' in html:
            raise SystemExit("some local file was not inlined")
    out.write_text(html, encoding="utf-8")
    print(f"wrote {out} ({out.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main(sys.argv[1:])
