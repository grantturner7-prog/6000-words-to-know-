#!/usr/bin/env python3
"""List the texts the app speaks for the written batches, so recorded or neural-voice clips can be made.

  python3 scripts/audio_manifest.py              summary: how many clips and characters
  python3 scripts/audio_manifest.py --csv FILE   one row per clip: key, text, kind, batch
The key is what audio/index.json expects (see audio/README.md).
"""
import csv
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def key(text):
    return re.sub(r"\s+", " ", re.sub(r"[{}\[\]]", "", text.replace("_", " "))).strip().lower()


def rows():
    seen = set()
    for f in sorted((ROOT / "content/batches").glob("b*.json")):
        b = json.loads(f.read_text(encoding="utf-8"))
        for w in b["words"]:
            items = [(w["headword"], "word")]
            items += [(w["examples"][lv], "example") for lv in ("beginner", "intermediate", "advanced")]
            for text, kind in items:
                k = key(text)
                if k not in seen:
                    seen.add(k)
                    yield k, re.sub(r"[{}]", "", text), kind, b["id"]
        for lv in ("beginner", "intermediate", "advanced"):
            for part in b["stories"][lv]["parts"]:
                gaps = {i: g["form"] for i, g in enumerate(part["gaps"], 1)}
                full = re.sub(r"\[\[(\d+)\]\]", lambda m: gaps[int(m.group(1))], part["text"])
                k = key(full)
                if k not in seen:
                    seen.add(k)
                    yield k, full, "story", b["id"]


def main(argv):
    data = list(rows())
    by = {}
    for _, text, kind, _b in data:
        n, c = by.get(kind, (0, 0))
        by[kind] = (n + 1, c + len(text))
    for kind, (n, c) in by.items():
        print(f"{kind:8} {n:5} clips {c:8} characters")
    print(f"{'total':8} {len(data):5} clips {sum(c for _, c in by.values()):8} characters")
    if "--csv" in argv:
        out = Path(argv[argv.index("--csv") + 1])
        with out.open("w", newline="", encoding="utf-8") as fh:
            wr = csv.writer(fh)
            wr.writerow(["key", "text", "kind", "batch"])
            wr.writerows(data)
        print("wrote", out)
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
