#!/usr/bin/env python3
"""Make a reading sheet for recording a batch's video and voice, from the batch's own content.

  python3 scripts/make_recording_sheet.py content/batches/b001.json            prints the sheet
  python3 scripts/make_recording_sheet.py --all                                writes docs/recording/batch-NNN.md for every batch
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
POS = {"n": "noun", "v": "verb", "adj": "adjective", "adv": "adverb", "prep": "preposition", "conj": "conjunction"}
LEVELS = (("beginner", "Beginner"), ("intermediate", "Intermediate"), ("advanced", "Advanced"))


def sheet(batch):
    n = int(batch["id"][1:])
    words = batch["words"]
    out = [f"# Batch {n}: recording sheet", "",
           f"Status of the content: {batch.get('status', 'draft')}. Read the sheet from top to bottom. Section 2 is for recording each word on its own; those clips can be added to the app's audio folder.", "",
           "## 1. The 20 words", "", "Say the word, then the Chinese, then the English meaning.", "",
           "| # | Word | Type | 中文 | English meaning |", "|---|---|---|---|---|"]
    for i, w in enumerate(words, 1):
        out.append(f"| {i} | **{w['headword']}** | {POS.get(w['pos'], w['pos'])} | {w['zhTW']} | {w['defEN']} |")
    out += ["", "## 2. Each word on its own", "", "One clean take per word, with a short pause between words:", ""]
    out += [f"{i}. {w['headword']}" for i, w in enumerate(words, 1)]
    out += ["", "## 3. Example sentences", ""]
    for key, label in LEVELS:
        out += [f"### {label}", ""]
        out += [f"- **{w['headword']}**: {re.sub(r'[{}]', '', w['examples'][key])}" for w in words]
        out.append("")
    out += ["## 4. The stories", ""]
    for key, label in LEVELS:
        for pi, part in enumerate(batch["stories"][key]["parts"], 1):
            gaps = {i: g["form"] for i, g in enumerate(part["gaps"], 1)}
            text = re.sub(r"\[\[(\d+)\]\]", lambda m: f"**{gaps[int(m.group(1))]}**", part["text"])
            out += [f"### {label}, part {pi}: {part['title']}", "", text, ""]
    return "\n".join(out)


def main(argv):
    if "--all" in argv:
        dest = ROOT / "docs" / "recording"
        dest.mkdir(parents=True, exist_ok=True)
        for f in sorted((ROOT / "content" / "batches").glob("b*.json")):
            b = json.loads(f.read_text(encoding="utf-8"))
            (dest / f"batch-{int(b['id'][1:]):03d}.md").write_text(sheet(b) + "\n", encoding="utf-8")
            print("wrote", dest / f"batch-{int(b['id'][1:]):03d}.md")
        return 0
    if not argv:
        print(__doc__)
        return 2
    print(sheet(json.loads(Path(argv[0]).read_text(encoding="utf-8"))))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
