#!/usr/bin/env python3
"""Build content/batches.json from content/wordlist.json.

Rules (see docs/PLAN.md section 13, Phase 1):
  * Order by CEEC level (1 to 6), which is also the app's Stage.
  * Function words (articles, pronouns, auxiliaries) leave the main stream and form a
    separate "Little Words" track, because a gap-fill story cannot teach them well.
  * Inside a level, words are dealt with a stride so that alphabetical neighbours
    (accept, acceptable, acceptance) land in different batches. The research on
    learning related words together (see PLAN section 4) says this helps.
  * 20 words per batch, split into 4 sets of 5. Each set mixes parts of speech.
  * A batch at the seam between two levels may hold words from both.
  * The last batch of the whole list holds whatever is left.

Run:  python3 scripts/build_batches.py
"""
import json
import math
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BATCH = 20
SET = 5
LITTLE_BATCH = 13           # smaller batches for the grammar-heavy Little Words


def stride_order(words, size=BATCH):
    """Deal a level's words so neighbours in the alphabet end up far apart."""
    n = len(words)
    stride = max(1, math.ceil(n / size))
    out = []
    for start in range(stride):
        out.extend(words[start::stride])
    return out


def make_sets(batch_words):
    """Split 20 words into 4 sets of 5 with a spread of parts of speech and initials."""
    ordered = sorted(batch_words, key=lambda w: (w["pos"][0], w["headword"]))
    sets = [[] for _ in range(len(batch_words) // SET)]
    for i, w in enumerate(ordered):
        sets[i % len(sets)].append(w)
    return [[w["id"] for w in sorted(s, key=lambda w: w["headword"])] for s in sets]


def majority_level(batch_words):
    counts = Counter(w["level"] for w in batch_words)
    top = max(counts.values())
    return max(level for level, c in counts.items() if c == top)


def same_family(a, b):
    """True when two headwords look like members of one word family."""
    a = a["headword"].split("/")[0].split("(")[0].lower()
    b = b["headword"].split("/")[0].split("(")[0].lower()
    common = 0
    for x, y in zip(a, b):
        if x != y:
            break
        common += 1
    return common >= max(5, min(len(a), len(b)) - 2)


def clashes(chunk):
    return [(i, j) for i in range(len(chunk)) for j in range(i + 1, len(chunk))
            if same_family(chunk[i], chunk[j])]


def separate_families(stream):
    """Swap words between nearby full batches until no batch holds two family members."""
    full = (len(stream) // BATCH) * BATCH
    for attempt in range(40):
        moved = False
        for start in range(0, full, BATCH):
            chunk = stream[start:start + BATCH]
            bad = clashes(chunk)
            if not bad:
                continue
            _, j = bad[0]
            word = stream[start + j]
            for other_start in sorted(range(0, full, BATCH), key=lambda s: abs(s - start)):
                if other_start == start:
                    continue
                for k in range(BATCH):
                    cand = stream[other_start + k]
                    if cand["level"] != word["level"]:
                        continue
                    a = chunk[:j] + [cand] + chunk[j + 1:]
                    b = stream[other_start:other_start + BATCH]
                    b = b[:k] + [word] + b[k + 1:]
                    if not clashes(a) and not clashes(b):
                        stream[start + j], stream[other_start + k] = cand, word
                        moved = True
                        break
                if moved:
                    break
            if moved:
                break
        if not moved:
            return


def main():
    data = json.loads((ROOT / "content" / "wordlist.json").read_text(encoding="utf-8"))
    words = data["words"]
    little = [w for w in words if w["kind"] == "function"]
    main_words = [w for w in words if w["kind"] != "function"]

    stream = []
    for level in range(1, 7):
        level_words = [w for w in main_words if w["level"] == level]   # already alphabetical
        stream.extend(stride_order(level_words))

    separate_families(stream)

    batches = []
    for i in range(0, len(stream), BATCH):
        chunk = stream[i:i + BATCH]
        n = i // BATCH + 1
        entry = {
            "id": f"b{n:03d}",
            "n": n,
            "stage": majority_level(chunk),
            "words": [w["id"] for w in chunk],
        }
        if len(chunk) == BATCH:
            entry["sets"] = make_sets(chunk)
        batches.append(entry)

    little_batches = []
    for i in range(0, len(little), LITTLE_BATCH):
        chunk = little[i:i + LITTLE_BATCH]
        little_batches.append({"id": f"l{i // LITTLE_BATCH + 1:02d}", "words": [w["id"] for w in chunk]})

    out = {
        "batchSize": BATCH,
        "setSize": SET,
        "note": "Stage = CEEC level. Little Words are function words, to be designed separately.",
        "batches": batches,
        "littleWords": little_batches,
    }
    (ROOT / "content" / "batches.json").write_text(
        json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")

    full = sum(1 for b in batches if len(b["words"]) == BATCH)
    print(f"main words: {len(main_words)}  batches: {len(batches)} ({full} full, "
          f"last has {len(batches[-1]['words'])})")
    print(f"little words: {len(little)} in {len(little_batches)} batches of up to {LITTLE_BATCH}")
    print("batches per stage:", dict(sorted(Counter(b['stage'] for b in batches).items())))


if __name__ == "__main__":
    main()
