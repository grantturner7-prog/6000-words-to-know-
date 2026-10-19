# Genesis 6,000 English Words to Know

A web app that teaches 6,000 English words to second-language students in Taiwan, one lesson of 20 words at a time, at three levels (Beginner, Intermediate, Advanced). Students tap, drag and play: no typing and no AI marking. Tapping any word shows its meaning in English and Traditional Chinese, and one switch turns the Chinese on or off. Liquid-glass design in light and dark, the same family as the IELTS app.

The word list is the College Entrance Examination Center (CEEC) Senior High English Reference Word List, six levels of about 1,000 words. Its levels are the app's six Stages.

**Status:** Phases 0 to 4 are built (see `docs/PLAN.md` and `docs/audit/`). Lesson 1 (20 words) is playable at all three levels. The other 297 lessons are planned but not written. Lesson 1 has not been reviewed by a teacher yet, so it is a draft. A second lesson was written early and is kept out of the app in `content/drafts/` until the owner asks for it.

**Words used:** a *lesson* is 20 words. Files and code call it a *batch* (`b001` is Lesson 1).

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
| `content/batches/b001.json` | Lesson 1 in full |
| `content/drafts/b002.json` | A second lesson written early, not in the app |
| `content/translations/b001.json` | The Chinese for Batch 1's sentences, sample sentences and stories |
| `content/media.json` | The Cloudflare links for each lesson and level: the English video (`video`) and the Chinese conversation (`talk`). Paste a link between the quotation marks and rebuild the demo; an empty one shows "Coming soon" |
| `docs/pdf/` | One PDF per level for each lesson with Chinese: the words, patterns, samples and article, for making the videos |
| `app/` | The front end: plain HTML, CSS and JavaScript, no build step |
| `docs/recording/` | One reading sheet per written lesson, for recording the video and voice |
| `audio/` | Where recorded or neural-voice clips go, and how to list them; empty until the owner chooses a voice |
| `demo/` | The single-file build of the app |
| `scripts/` | Build, check and test scripts |

## Commands
```
python3 scripts/build_wordlist.py          # source/wordlist-raw.txt  -> content/wordlist.json
python3 scripts/build_batches.py           # content/wordlist.json    -> content/batches.json
python3 scripts/check_batch.py --all       # the content gates, for every batch
python3 scripts/test_check_batch.py        # tests that the gates catch broken batches
NODE_PATH=$(npm root -g) node scripts/e2e.cjs            # plays Lesson 1 in a real browser (needs playwright)
DEMO=1 NODE_PATH=$(npm root -g) node scripts/e2e.cjs     # the same test against the single-file demo
python3 scripts/build_demo.py              # rebuild demo/Genesis-6000-Words.html
python3 scripts/audio_manifest.py          # how many audio clips the written batches need
python3 scripts/make_recording_sheet.py --all   # reading sheets in docs/recording/
python3 scripts/make_level_pdfs.py --all        # one PDF per level in docs/pdf/ (needs node and playwright)
python3 scripts/make_review_packs.py ...   # packs for independent review (see CONTENT-STANDARDS.md)
```

## Rules for this project
Students are always "students". Wording is positive. Nothing characterises any group of people. All sentences, stories and meanings are original; only headwords, parts of speech and levels come from the CEEC list. Interface text lives in `app/js/i18n.js`, in English and Traditional Chinese.
