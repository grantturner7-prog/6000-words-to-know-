#!/usr/bin/env python3
"""Build content/wordlist.json from source/wordlist-raw.txt.

Source: the CEEC Senior High English Reference Word List (6 levels), transcribed
into one entry per line as  headword|parts of speech|level.

Each entry becomes:
  id        w0001 ... in alphabetical order of the source
  headword  as printed (for example "actor/actress", "agree(ment)")
  forms     every spelling the entry teaches (actor, actress / agree, agreement)
  pos       list of parts of speech  (n, v, adj, adv, prep, conj, pron, art, aux)
  posRaw    as printed
  level     1 to 6 (the CEEC level; also the Stage of the app)
  kind      "function" for articles, pronouns and auxiliaries, otherwise "content"

Run:  python3 scripts/build_wordlist.py
It prints a summary and exits non-zero if any line cannot be parsed.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "source" / "wordlist-raw.txt"
OUT = ROOT / "content" / "wordlist.json"

POS_NAMES = {"n", "v", "adj", "adv", "prep", "conj", "pron", "art", "aux"}
SUFFIX_FORMS = {"ment", "ism"}        # "enjoy(ment)" -> enjoyment, "capital(ism)" -> capitalism
FUNCTION_POS = {"art", "pron", "aux"}


def parse_pos(raw):
    """'v./(n.)' -> ['v', 'n'];  'adj./adv.' -> ['adj', 'adv']"""
    found = []
    for token in re.findall(r"[a-z]+", raw):
        if token in POS_NAMES and token not in found:
            found.append(token)
        elif token not in POS_NAMES:
            raise ValueError(f"unknown part of speech {token!r} in {raw!r}")
    return found


def expand_forms(headword):
    """All spellings an entry teaches."""
    forms = []

    def add(word):
        word = word.strip().strip(",")
        if word and word not in forms:
            forms.append(word)

    # "he (him, his, himself)" -> list of full words in parentheses
    m = re.match(r"^(\S+)\s*\(([^)]*)\)$", headword)
    if m and ("," in m.group(2) or " " in m.group(2)):
        add(m.group(1))
        for part in m.group(2).split(","):
            add(part)
        return forms

    for part in headword.split("/"):
        part = part.strip()
        m = re.match(r"^([^()]+)\(([^()]*)\)$", part)
        if m:
            stem, inner = m.group(1), m.group(2)
            add(stem)
            if inner in SUFFIX_FORMS:
                add(stem + inner)           # enjoy -> enjoyment
            elif inner == "s":
                add(stem + "s")             # shoe(s) -> shoes
            else:
                add(inner)                  # argue(argument) -> argument
        else:
            add(part)
    return forms


def main():
    entries = []
    problems = []
    for lineno, line in enumerate(RAW.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip() or line.startswith("#"):
            continue
        bits = line.split("|")
        if len(bits) != 3:
            problems.append(f"line {lineno}: expected 3 fields: {line!r}")
            continue
        headword, pos_raw, level = (b.strip() for b in bits)
        try:
            pos = parse_pos(pos_raw)
            level_n = int(level)
            if not 1 <= level_n <= 6:
                raise ValueError(f"level {level_n} out of range")
        except ValueError as err:
            problems.append(f"line {lineno}: {err}: {line!r}")
            continue
        entries.append((headword, pos_raw, pos, level_n))

    if problems:
        print("\n".join(problems))
        sys.exit(1)

    words = []
    for i, (headword, pos_raw, pos, level) in enumerate(entries, 1):
        words.append({
            "id": f"w{i:04d}",
            "headword": headword,
            "forms": expand_forms(headword),
            "pos": pos,
            "posRaw": pos_raw,
            "level": level,
            "kind": "function" if (set(pos) & FUNCTION_POS) else "content",
        })

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(
        {"source": "CEEC Senior High English Reference Word List (高中英文參考詞彙表)",
         "count": len(words), "words": words},
        ensure_ascii=False, indent=0, separators=(",", ":")) + "\n", encoding="utf-8")

    levels = Counter(w["level"] for w in words)
    spellings = sum(len(w["forms"]) for w in words)
    kinds = Counter(w["kind"] for w in words)
    print(f"entries: {len(words)}   spellings taught: {spellings}")
    print("by level:", dict(sorted(levels.items())))
    print("by kind:", dict(kinds))


if __name__ == "__main__":
    main()
