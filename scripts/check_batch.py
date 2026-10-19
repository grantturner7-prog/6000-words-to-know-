#!/usr/bin/env python3
"""Gate for one batch file (docs/CONTENT-STANDARDS.md).

Usage:
  python3 scripts/check_batch.py content/batches/b001.json
  python3 scripts/check_batch.py content/batches/b001.json --frames     # also print every Sentence Maker sentence
  python3 scripts/check_batch.py --all                                   # every file in content/batches/

Exit status 1 when any error is found. Warnings never fail the run.

The vocabulary band uses the word list itself: a Beginner text may use only Level 1 words
(plus names, numbers, days, months and countries), Intermediate up to Level 2, Advanced up to
Level 3. Students therefore never meet a word that has not been, or is not about to be, taught.
"""
import itertools
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

LEVELS = ("beginner", "intermediate", "advanced")
BAND = {"beginner": 1, "intermediate": 2, "advanced": 3}
SENTENCE_CAP = {"beginner": 8, "intermediate": 12, "advanced": 18}
ARTICLE_WORDS = {"beginner": (90, 190), "intermediate": (160, 270), "advanced": (220, 360)}
GAPS_PER_ARTICLE = 20
WORDS_PER_BATCH = 20
BANNED = {"stupid", "dumb", "idiot", "retard", "scam", "unfair"}   # student-facing wording rule

# Words outside the list that every text may use (appendix of the list, names, languages).
ALLOWED = set("""
sam amy tom lily lucy ben anna joe mia kim jack emma lisa david mary john ken
english chinese mandarin taiwanese japanese
one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen
seventeen eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety
first second third fourth fifth sixth seventh eighth ninth tenth
monday tuesday wednesday thursday friday saturday sunday
january february march april may june july august september october november december
spring summer autumn fall winter
argentina australia brazil canada china france germany india indonesia italy japan malaysia mexico
philippines russia singapore korea spain taiwan thailand turkey vietnam
africa antarctica asia europe america
okay ok oh hello hi wow yay
""".split())

IRREGULAR = {
    "be": "am is are was were been being", "do": "does did done doing", "have": "has had having",
    "go": "goes went gone going", "see": "saw seen", "take": "took taken", "make": "made",
    "come": "came", "give": "gave given", "get": "got gotten", "know": "knew known",
    "think": "thought", "tell": "told", "say": "said", "find": "found", "bring": "brought",
    "buy": "bought", "eat": "ate eaten", "drink": "drank drunk", "run": "ran", "sit": "sat",
    "stand": "stood", "teach": "taught", "hold": "held", "feel": "felt", "keep": "kept",
    "leave": "left", "lose": "lost", "meet": "met", "pay": "paid", "ride": "rode ridden",
    "ring": "rang rung", "sing": "sang sung", "sleep": "slept", "speak": "spoke spoken",
    "spend": "spent", "swim": "swam", "write": "wrote written", "begin": "began begun",
    "break": "broke broken", "choose": "chose chosen", "draw": "drew drawn", "drive": "drove driven",
    "fall": "fell fallen", "fly": "flew flown", "forget": "forgot forgotten", "grow": "grew grown",
    "hear": "heard", "hide": "hid hidden", "lend": "lent", "send": "sent", "steal": "stole stolen",
    "throw": "threw thrown", "wear": "wore worn", "win": "won", "build": "built", "catch": "caught",
    "fight": "fought", "sell": "sold", "shake": "shook shaken", "wake": "woke woken",
    "lay": "laid", "lie": "lay lain", "child": "children", "man": "men", "woman": "women",
    "foot": "feet", "tooth": "teeth", "mouse": "mice", "can": "could", "will": "would",
    "shall": "should", "may": "might", "good": "better best", "bad": "worse worst",
    "well": "better", "much": "more most", "many": "more most", "little": "less least",
    "leaf": "leaves", "knife": "knives", "wife": "wives", "life": "lives", "shelf": "shelves",
}


def norm(word):
    return word.lower().replace("’", "'")


def variants(form):
    """Plausible inflected spellings of a list word (over-generous on purpose)."""
    f = norm(form)
    out = {f, f + "s", f + "es", f + "ed", f + "d", f + "ing", f + "er", f + "est", f + "r",
           f + "st", f + "ly", f + "ness"}
    if f.endswith("e"):
        out |= {f[:-1] + "ing", f[:-1] + "ed"}
    if f.endswith("y") and len(f) > 2:
        out |= {f[:-1] + "ies", f[:-1] + "ied", f[:-1] + "ier", f[:-1] + "iest", f[:-1] + "ily"}
    if f.endswith("le"):
        out.add(f[:-1] + "y")
    if len(f) >= 3 and f[-1] not in "aeiouwxy" and f[-2] in "aeiou" and f[-3] not in "aeiou":
        out |= {f + f[-1] + "ed", f + f[-1] + "ing", f + f[-1] + "er", f + f[-1] + "est"}
    for extra in IRREGULAR.get(f, "").split():
        out.add(extra)
    return out


def build_level_map(words):
    """surface spelling -> lowest CEEC level that teaches it."""
    level_of = {}
    for w in words:
        for form in w["forms"]:
            for v in variants(form):
                if v not in level_of or w["level"] < level_of[v]:
                    level_of[v] = w["level"]
    return level_of


CONTRACTION_BASE = {"can't": "can", "won't": "will", "don't": "do", "doesn't": "do", "didn't": "do",
                    "isn't": "be", "aren't": "be", "wasn't": "be", "weren't": "be",
                    "haven't": "have", "hasn't": "have", "couldn't": "can", "wouldn't": "will",
                    "shouldn't": "shall", "let's": "let", "o'clock": "o'clock"}


def tokens(text):
    """Lower-case word tokens, with contractions reduced to their base word."""
    out = []
    for raw in re.findall(r"[A-Za-z]+(?:['’][A-Za-z]+)?", text):
        t = norm(raw)
        if t in CONTRACTION_BASE:
            out.append(CONTRACTION_BASE[t])
        elif "'" in t:
            out.append(t.split("'")[0])
        else:
            out.append(t)
    return out


def sentences(text):
    """Split into sentences on . ! ? (keeps quotes attached)."""
    cleaned = re.sub(r"\[\[\d+\]\]", "GAPWORD", text)
    cleaned = re.sub(r"[{}]", "", cleaned)
    parts = re.split(r"(?<=[.!?])[\"”']*\s+", cleaned)
    return [p.strip() for p in parts if p.strip()]


class Report:
    def __init__(self):
        self.errors, self.warnings = [], []

    def error(self, where, msg):
        self.errors.append(f"ERROR   {where}: {msg}")

    def warn(self, where, msg):
        self.warnings.append(f"warning {where}: {msg}")


def band_problems(text, level, level_of, skip=()):
    """Words in text outside the level's band."""
    bad = []
    for t in tokens(text):
        if t in ALLOWED or t in skip or t == "gapword":
            continue
        if t.endswith("s") and t[:-1] in ALLOWED:      # Fridays, Mondays
            continue
        lv = level_of.get(t)
        if lv is None or lv > BAND[level]:
            bad.append(t if lv is None else f"{t}(L{lv})")
    return bad


def assemble(tiles):
    s = " ".join(tiles).strip()
    s = re.sub(r"\s+([,.!?])", r"\1", s)
    if s and s[0].islower():
        s = s[0].upper() + s[1:]
    if s and s[-1] not in ".!?":
        s += "."
    return s


def gloss_stems(zh, extra=()):
    """The Chinese strings that count as using a word's meaning: each ；-separated alternative of its
    zhTW (notes in brackets dropped), also without a closing 的 or 著, plus any extras the batch lists."""
    stems = set(extra)
    for alt in re.split(r"[；;]", re.sub(r"[（(][^）)]*[）)]", "", zh)):
        alt = alt.strip()
        if alt:
            stems.add(alt)
            stems.add(re.sub(r"[的著]$", "", alt))
    return {x for x in stems if x}


def uses_gloss(zh, stems):
    """True when the Chinese uses one of the stems. A two-character direction word such as 回去 or 回來
    may be split by a place, as in 回家去 or 回到餐桌旁來."""
    if any(x in zh for x in stems):
        return True
    return any(len(x) == 2 and x[1] in "來去" and re.search(re.escape(x[0]) + r"[^，。！？：；、]{1,4}" + x[1], zh) for x in stems)


def check_translations(batch, words, trans, rep, name):
    """Chinese for every example, two samples per Sentence Maker pattern, and every story part."""
    han = re.compile(r"[一-鿿]")
    extra = trans.get("extraGloss", {})
    for w in words:
        wid, where_w = w["id"], f"{name} {w['headword']}"
        stems = gloss_stems(w["zhTW"], extra.get(wid, ()))
        for lvl in LEVELS:
            where = f"{where_w} [{lvl}]"
            zh = trans.get("examples", {}).get(wid, {}).get(lvl, "")
            if not han.search(zh):
                rep.error(where, "no Chinese for the example sentence")
            elif not uses_gloss(zh, stems):
                rep.error(where, f"example's Chinese does not use the word's meaning {sorted(stems)}: {zh!r}")
            samples = trans.get("samples", {}).get(wid, {}).get(lvl, [])
            rows = w["frames"][lvl]["rows"]
            want = [assemble([r["tiles"][0] for r in rows]), assemble([r["tiles"][-1] for r in rows])]
            if len(samples) != 2:
                rep.error(where, f"{len(samples)} sample sentences, expected 2")
                continue
            for sm, en in zip(samples, want):
                if sm.get("en") != en:
                    rep.error(where, f"sample is out of date: {sm.get('en')!r} but the pattern now gives {en!r}")
                if not han.search(sm.get("zh", "")):
                    rep.error(where, f"no Chinese for the sample {en!r}")
                elif not uses_gloss(sm["zh"], stems):
                    rep.error(where, f"sample's Chinese does not use the word's meaning {sorted(stems)}: {sm['zh']!r}")
    for lvl in LEVELS:
        parts = batch.get("stories", {}).get(lvl, {}).get("parts", [])
        zhs = trans.get("stories", {}).get(lvl, [])
        if len(zhs) != len(parts):
            rep.error(f"{name} story [{lvl}]", f"{len(zhs)} Chinese parts for {len(parts)} English parts")
            continue
        for pi, (part, zh) in enumerate(zip(parts, zhs), 1):
            where = f"{name} story [{lvl}] part {pi}"
            if not han.search(zh):
                rep.error(where, "no Chinese")
                continue
            for g in part["gaps"]:
                wd = next((x for x in words if x["id"] == g["w"]), None)
                if wd and not uses_gloss(zh, gloss_stems(wd["zhTW"], extra.get(wd["id"], ()))):
                    rep.error(where, f"the Chinese never uses the meaning of {wd['headword']} ({wd['zhTW']})")


def check_batch(path, show_frames=False, translations=None):
    rep = Report()
    name = path.name
    wordlist = json.loads((ROOT / "content" / "wordlist.json").read_text(encoding="utf-8"))["words"]
    by_id = {w["id"]: w for w in wordlist}
    level_of = build_level_map(wordlist)
    plan = json.loads((ROOT / "content" / "batches.json").read_text(encoding="utf-8"))
    try:
        batch = json.loads(path.read_text(encoding="utf-8"))
    except Exception as err:  # noqa: BLE001
        rep.error(name, f"cannot read JSON: {err}")
        return rep, 0

    plan_entry = next((b for b in plan["batches"] if b["id"] == batch.get("id")), None)
    if not plan_entry:
        rep.error(name, f"batch id {batch.get('id')!r} is not in content/batches.json")
        return rep, 0

    # ---- 1. words and sets -------------------------------------------------
    words = batch.get("words", [])
    if len(words) != WORDS_PER_BATCH:
        rep.error(name, f"{len(words)} words, expected {WORDS_PER_BATCH}")
    ids = [w.get("id") for w in words]
    if sorted(ids) != sorted(plan_entry["words"]):
        rep.error(name, "word ids differ from content/batches.json")
    set_of = {}
    for si, s in enumerate(plan_entry.get("sets", []), 1):
        for wid in s:
            set_of[wid] = si
    head_to_id = {}
    for w in words:
        wid = w.get("id", "?")
        where = f"{name} {w.get('headword', wid)}"
        src = by_id.get(wid)
        if not src:
            rep.error(where, "id not in word list")
            continue
        head_to_id[w["headword"]] = wid
        if w.get("headword") not in src["forms"]:
            rep.error(where, f"headword is not one of the list's spellings {src['forms']}")
        if w.get("set") != set_of.get(wid):
            rep.error(where, f"set {w.get('set')} differs from the plan ({set_of.get(wid)})")
        if not re.search(r"[一-鿿]", w.get("zhTW", "")):
            rep.error(where, "zhTW is missing or has no Chinese characters")
        defn = w.get("defEN", "")
        if not defn or len(defn.split()) > 10:
            rep.error(where, "defEN missing or longer than 10 words")
        forms = [norm(f) for f in w.get("forms", [])]
        if norm(w["headword"]) not in forms:
            rep.error(where, "forms must include the headword")
        confusable = w.get("confusable", [])
        if len(confusable) < 2:
            rep.error(where, "needs at least 2 look-alike spellings for the Spelling Bee")
        for c in confusable:
            if norm(c) in forms:
                rep.error(where, f"look-alike spelling {c!r} is a correct form")
        if len(w["headword"]) <= 3 and not w.get("beeSkip"):
            pass   # short words are allowed; the app still offers the bee

    word_by_head = {w["headword"]: w for w in words}

    # ---- 2. examples, distractors, frames -------------------------------------
    seen_sentences = {}
    for w in words:
        where_w = f"{name} {w['headword']}"
        forms = {norm(f) for f in w.get("forms", [])}
        for lvl in LEVELS:
            where = f"{where_w} [{lvl}]"
            ex = w.get("examples", {}).get(lvl, "")
            marks = re.findall(r"\{([^{}]+)\}", ex)
            if len(marks) != 1:
                rep.error(where, f"example needs exactly one {{target}} mark: {ex!r}")
            elif norm(marks[0]) not in forms:
                rep.error(where, f"marked word {marks[0]!r} is not in forms {sorted(forms)}")
            for sent in sentences(ex):
                n = len(re.findall(r"[A-Za-z']+", sent.replace("GAPWORD", "")))
                if n > SENTENCE_CAP[lvl]:
                    rep.error(where, f"example has {n} words (cap {SENTENCE_CAP[lvl]}): {ex!r}")
            bad = band_problems(re.sub(r"[{}]", "", ex), lvl, level_of, skip=forms)
            if bad:
                rep.error(where, f"example uses words above the band: {bad}")
            key = re.sub(r"[{}]", "", ex).lower()
            if key in seen_sentences:
                rep.error(where, f"duplicate sentence (also {seen_sentences[key]})")
            seen_sentences[key] = where

            pick = w.get("pick", {}).get(lvl, [])
            if len(pick) != 3 or len(set(pick)) != 3:
                rep.error(where, "pick needs 3 different distractors")
            for d in pick:
                if d not in word_by_head:
                    rep.error(where, f"distractor {d!r} is not a word of this batch")
                elif d == w["headword"]:
                    rep.error(where, "distractor equals the answer")

            frame = w.get("frames", {}).get(lvl)
            if not frame:
                rep.error(where, "missing Sentence Maker frame")
                continue
            rows = frame.get("rows", [])
            if not 2 <= len(rows) <= 4:
                rep.error(where, f"frame has {len(rows)} rows (2 to 4 allowed)")
                continue
            targets = [r for r in rows if r.get("target")]
            if len(targets) != 1:
                rep.error(where, "frame needs exactly one target row")
            combos = 1
            for r in rows:
                tiles = r.get("tiles", [])
                if not 2 <= len(tiles) <= 5:
                    rep.error(where, f"row {r.get('label')} has {len(tiles)} tiles (2 to 5 allowed)")
                if len(set(tiles)) != len(tiles):
                    rep.error(where, f"row {r.get('label')} repeats a tile")
                combos *= max(1, len(tiles))
            if combos > 100:
                rep.error(where, f"{combos} combinations (max 100)")
            if targets:
                for t in targets[0].get("tiles", []):
                    if not (set(tokens(t)) & forms):
                        rep.error(where, f"target tile {t!r} does not contain the word")
            all_sentences = []
            for combo in itertools.product(*[r.get("tiles", []) for r in rows]):
                s = assemble(combo)
                all_sentences.append(s)
                n = len(re.findall(r"[A-Za-z']+", s))
                if n > SENTENCE_CAP[lvl]:
                    rep.error(where, f"frame sentence has {n} words (cap {SENTENCE_CAP[lvl]}): {s!r}")
                    break
            tile_text = " ".join(t for r in rows for t in r.get("tiles", []))
            bad = band_problems(tile_text, lvl, level_of, skip=forms)
            if bad:
                rep.error(where, f"frame uses words above the band: {sorted(set(bad))}")
            if show_frames:
                print(f"\n--- {w['headword']} [{lvl}] ({len(all_sentences)} sentences)")
                for s in all_sentences:
                    print("   ", s)

    # ---- 3. stories --------------------------------------------------------------
    used_by_level = {}
    for lvl in LEVELS:
        parts = batch.get("stories", {}).get(lvl, {}).get("parts", [])
        where_l = f"{name} story [{lvl}]"
        if len(parts) != 1:
            rep.error(where_l, f"{len(parts)} articles, expected 1 article of {GAPS_PER_ARTICLE} gaps")
        used = []
        for pi, part in enumerate(parts, 1):
            where = f"{where_l} part {pi}"
            text = part.get("text", "")
            gaps = part.get("gaps", [])
            marks = [int(m) for m in re.findall(r"\[\[(\d+)\]\]", text)]
            if marks != list(range(1, GAPS_PER_ARTICLE + 1)):
                rep.error(where, f"gap marks must run [[1]] to [[{GAPS_PER_ARTICLE}]] in order, found {marks}")
            if len(gaps) != GAPS_PER_ARTICLE:
                rep.error(where, f"{len(gaps)} gaps, expected {GAPS_PER_ARTICLE}")
            gap_forms = []
            for g in gaps:
                src = by_id.get(g.get("w"))
                wd = next((x for x in words if x.get("id") == g.get("w")), None)
                if not src or not wd:
                    rep.error(where, f"gap word {g.get('w')} is not in this batch")
                    continue
                if norm(g.get("form", "")) not in {norm(f) for f in wd["forms"]}:
                    rep.error(where, f"gap form {g.get('form')!r} is not a form of {wd['headword']}")
                used.append(g["w"])
                gap_forms.append(norm(g.get("form", "")))
            plain = re.sub(r"\[\[\d+\]\]", " ", text)
            n_words = len(re.findall(r"[A-Za-z']+", plain)) + len(gaps)
            lo, hi = ARTICLE_WORDS[lvl]
            if not lo <= n_words <= hi:
                rep.error(where, f"{n_words} words (allowed {lo} to {hi})")
            for sent in sentences(text):
                n = len(re.findall(r"[A-Za-z']+", sent))
                if n > SENTENCE_CAP[lvl]:
                    rep.error(where, f"sentence has {n} words (cap {SENTENCE_CAP[lvl]}): {sent!r}")
            bad = band_problems(plain, lvl, level_of)
            if bad:
                rep.error(where, f"words above the band: {sorted(set(bad))}")
            # a target word of this batch must not appear as plain text in its own part
            plain_tokens = set(tokens(plain))
            for g in gaps:
                wd = next((x for x in words if x.get("id") == g.get("w")), None)
                if wd and plain_tokens & {norm(f) for f in wd["forms"]}:
                    rep.warn(where, f"{wd['headword']} also appears as plain text in its own part")
            if not part.get("title"):
                rep.warn(where, "no title")
            for t in tokens(part.get("title", "")):
                if t in BANNED:
                    rep.error(where, f"banned word {t!r}")
            # a title is shown above the gaps, so it must not spell out one of the answers
            part_forms = set()
            for g in gaps:
                wd = next((x for x in words if x.get("id") == g.get("w")), None)
                if wd:
                    part_forms |= {norm(f) for f in wd["forms"]}
            leaked = sorted(set(tokens(part.get("title", ""))) & part_forms)
            if leaked:
                rep.error(where, f"the title shows a word that is a gap in this part: {leaked}")
        if sorted(used) != sorted(ids):
            missing = sorted(set(ids) - set(used))
            extra = [u for u in set(used) if used.count(u) > 1]
            rep.error(where_l, f"every word must be a gap exactly once; missing {missing}, repeated {extra}")
        used_by_level[lvl] = used

    # ---- 3b. Chinese translations ---------------------------------------------------------
    if translations is None:
        tpath = ROOT / "content" / "translations" / f"{batch.get('id')}.json"
        translations = json.loads(tpath.read_text(encoding="utf-8")) if tpath.exists() else None
    if translations is None:
        rep.warn(name, "no Chinese sentence translations yet (content/translations)")
    else:
        check_translations(batch, words, translations, rep, name)

    # ---- 4. wording and provenance -----------------------------------------------------
    blob = json.dumps(batch, ensure_ascii=False).lower()
    for b in BANNED:
        if re.search(rf"\b{b}\b", blob):
            rep.error(name, f"banned word {b!r} appears in the batch")
    prov = batch.get("provenance", {})
    if batch.get("status") == "published" and not (prov.get("reviewedBy") and prov.get("reviewedOn")):
        rep.error(name, "status is published but reviewedBy / reviewedOn are empty")
    if batch.get("status") != "published":
        rep.warn(name, f"status is {batch.get('status')!r}; not yet reviewed for sale")
    return rep, len(words)


def main(argv):
    show = "--frames" in argv
    args = [a for a in argv if not a.startswith("--")]
    if "--all" in argv:
        paths = sorted((ROOT / "content" / "batches").glob("b*.json"))
    else:
        paths = [Path(a) for a in args]
    if not paths:
        print(__doc__)
        return 2
    failed = False
    for p in paths:
        rep, n = check_batch(p, show)
        print(f"\n{p.name}: {n} words, {len(rep.errors)} errors, {len(rep.warnings)} warnings")
        for line in rep.errors + rep.warnings:
            print("  " + line)
        failed = failed or bool(rep.errors)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
