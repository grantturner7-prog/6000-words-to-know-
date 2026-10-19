# Genesis 6,000 English Words to Know

A web app that teaches 6,000 English words to second-language students in Taiwan, 20 words at a time, at three levels (Beginner, Intermediate, Advanced). Students tap, drag and play: no typing and no AI marking. Tapping any word shows its meaning in English and Traditional Chinese, and one switch turns the Chinese on or off. Liquid-glass design in light and dark, the same family as the IELTS app.

The word list is the College Entrance Examination Center (CEEC) Senior High English Reference Word List, six levels of about 1,000 words. Its levels are the app's six Stages.

**Status:** Phases 0 to 4 are built (see `docs/PLAN.md` and `docs/audit/`). Batches 1 and 2 (40 words) are playable at all three levels. The other 296 batches are planned but not written. Neither written batch has been reviewed by a teacher yet, so both are drafts.

## Try it
- **Easiest:** open `demo/Genesis-6000-Words.html` in a browser. One file, no server, works offline.
- **From the folder:** `python3 -m http.server 8000` in this folder, then open `http://localhost:8000/app/`.

## What is where
| Path | What it holds |
|---|---|
| `docs/PLAN.md` | The project plan: science behind the batch design, the three levels, phases and audits, open questions |
| `docs/CONTENT-STANDARDS.md` | The gates every batch must pass |
| `docs/audit/` | One audit file per finished phase, with screenshots in `docs/audit/screens/` |
| `source/wordlist-raw.txt` | The word list as transcribed (headword, part of speech, level) |
| `content/wordlist.json` | The same list as data, 6,009 entries |
| `content/batches.json` | Which words go in which batch and set (298 batches) |
| `content/batches/b001.json`, `b002.json` | Batches 1 and 2 in full |
| `app/` | The front end: plain HTML, CSS and JavaScript, no build step |
| `audio/` | Where recorded or neural-voice clips go, and how to list them; empty until the owner chooses a voice |
| `demo/` | The single-file build of the app |
| `scripts/` | Build, check and test scripts |

## Commands
```
python3 scripts/build_wordlist.py          # source/wordlist-raw.txt  -> content/wordlist.json
python3 scripts/build_batches.py           # content/wordlist.json    -> content/batches.json
python3 scripts/check_batch.py --all       # the content gates, for every batch
python3 scripts/test_check_batch.py        # tests that the gates catch broken batches
NODE_PATH=$(npm root -g) node scripts/e2e.cjs            # plays Batches 1 and 2 in a real browser (needs playwright)
DEMO=1 NODE_PATH=$(npm root -g) node scripts/e2e.cjs     # the same test against the single-file demo
python3 scripts/build_demo.py              # rebuild demo/Genesis-6000-Words.html
python3 scripts/audio_manifest.py          # how many audio clips the written batches need
python3 scripts/make_review_packs.py ...   # packs for independent review (see CONTENT-STANDARDS.md)
```

## Rules for this project
Students are always "students". Wording is positive. Nothing characterises any group of people. All sentences, stories and meanings are original; only headwords, parts of speech and levels come from the CEEC list. Interface text lives in `app/js/i18n.js`, in English and Traditional Chinese.
