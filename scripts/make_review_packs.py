#!/usr/bin/env python3
"""Make review packs for independent reviewers (see docs/CONTENT-STANDARDS.md, "Independent review").

  python3 scripts/make_review_packs.py content/batches/b001.json PACK_DIR KEY_FILE
      PACK_DIR/blind_questions.json   gap-fill items with no answers, for a blind solver
      PACK_DIR/language_pack.json     every sentence, meaning and story, for a language reviewer
      KEY_FILE                        the answer key; keep it OUT of PACK_DIR so reviewers never see it

  python3 scripts/make_review_packs.py content/batches/b001.json --score ANSWERS.json KEY_FILE
      compares a solver's answers with the key and lists every disagreement

The blind solver answers {"pick": {"p1": "back", ...}, "stories": {"s-beginner-1": {"1": "chair", ...}}}.
"""
import itertools
import json
import random
import re
import sys
from pathlib import Path

LEVELS = ("beginner", "intermediate", "advanced")


def assemble(tiles):
    s = " ".join(tiles).strip()
    s = re.sub(r"\s+([,.!?])", r"\1", s)
    if s and s[0].islower():
        s = s[0].upper() + s[1:]
    if s and s[-1] not in ".!?":
        s += "."
    return s


def make(batch_path, pack_dir, key_path):
    b = json.loads(Path(batch_path).read_text(encoding="utf-8"))
    rnd = random.Random(7)
    words = {w["id"]: w for w in b["words"]}
    pick, pick_key, stories, story_key = [], {}, [], {}
    n = 0
    for lvl in LEVELS:
        for w in b["words"]:
            n += 1
            m = re.match(r"^(.*)\{([^{}]+)\}(.*)$", w["examples"][lvl])
            opts = [w["headword"]] + w["pick"][lvl]
            rnd.shuffle(opts)
            pid = f"p{n}"
            pick.append({"id": pid, "level": lvl, "sentence": m[1] + "_____" + m[3], "options": opts})
            pick_key[pid] = w["headword"]
        for pi, part in enumerate(b["stories"][lvl]["parts"], 1):
            sid = f"s-{lvl}-{pi}"
            bank = [g["form"] for g in part["gaps"]]
            rnd.shuffle(bank)
            stories.append({"id": sid, "level": lvl, "title": part["title"], "text": part["text"].replace("[[", "(gap ").replace("]]", ")"), "word_bank": bank})
            story_key[sid] = {str(i): g["form"] for i, g in enumerate(part["gaps"], 1)}
    blind = {
        "instructions": ("Each item has one correct answer. For 'pick', choose the one option that completes the sentence best. "
                         "For 'stories', every word in the word bank is used exactly once: say which word goes in each numbered gap. "
                         "If more than one answer could be defended, still give your single best answer and add the id to 'ambiguous'."),
        "pick": pick, "stories": stories}
    lang = {"words": [], "stories": []}
    for w in b["words"]:
        entry = {"headword": w["headword"], "pos": w["pos"], "defEN": w["defEN"], "zhTW": w["zhTW"], "examples": w["examples"], "sentence_maker": {}}
        for lvl in LEVELS:
            rows = w["frames"][lvl]["rows"]
            entry["sentence_maker"][lvl] = [assemble(c) for c in itertools.product(*[r["tiles"] for r in rows])]
        lang["words"].append(entry)
    for lvl in LEVELS:
        for pi, part in enumerate(b["stories"][lvl]["parts"], 1):
            text = part["text"]
            for i, g in enumerate(part["gaps"], 1):
                text = text.replace(f"[[{i}]]", g["form"])
            lang["stories"].append({"level": lvl, "part": pi, "title": part["title"], "text": text})
    Path(pack_dir).mkdir(parents=True, exist_ok=True)
    (Path(pack_dir) / "blind_questions.json").write_text(json.dumps(blind, ensure_ascii=False, indent=1), encoding="utf-8")
    (Path(pack_dir) / "language_pack.json").write_text(json.dumps(lang, ensure_ascii=False, indent=1), encoding="utf-8")
    Path(key_path).write_text(json.dumps({"pick": pick_key, "stories": story_key}, ensure_ascii=False), encoding="utf-8")
    total_sentences = sum(len(v) for w in lang["words"] for v in w["sentence_maker"].values())
    print(f"{len(pick)} pick items, {len(stories)} story parts ({sum(len(v) for v in story_key.values())} gaps), {total_sentences} Sentence Maker sentences")


def score(answers_path, key_path, batch_path):
    ans = json.loads(Path(answers_path).read_text(encoding="utf-8"))
    key = json.loads(Path(key_path).read_text(encoding="utf-8"))
    bad = []
    for pid, right in key["pick"].items():
        if ans.get("pick", {}).get(pid) != right:
            bad.append(f"pick {pid}: key {right!r}, solver {ans.get('pick', {}).get(pid)!r}")
    for sid, gaps in key["stories"].items():
        got = ans.get("stories", {}).get(sid, {})
        for g, right in gaps.items():
            if str(got.get(g, "")).lower() != right.lower():
                bad.append(f"story {sid} gap {g}: key {right!r}, solver {got.get(g)!r}")
    total = len(key["pick"]) + sum(len(g) for g in key["stories"].values())
    print(f"{total - len(bad)} of {total} agree with the key; ambiguous flagged by solver: {ans.get('ambiguous', [])}")
    for line in bad:
        print("  DISAGREE", line)
    return 1 if bad else 0


if __name__ == "__main__":
    a = sys.argv[1:]
    if len(a) == 4 and a[1] == "--score":
        sys.exit(score(a[2], a[3], a[0]))
    elif len(a) == 3:
        make(*a)
    else:
        print(__doc__)
        sys.exit(2)
