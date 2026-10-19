# Phase 0: Decisions and word intake (2026-10-19)

## What was built
- `source/wordlist-raw.txt`: the word list as transcribed, one entry per line (headword | parts of speech | level).
- `scripts/build_wordlist.py` and its output `content/wordlist.json` (6,009 entries, with spellings taught, part of speech list, level and a function-word flag).
- `docs/PLAN.md` (written first, then updated with these findings).

## Source
The owner's PDF could not be uploaded to the build session. The owner pasted its text instead. The text is the CEEC Senior High English Reference Word List (高中英文參考詞彙表): a level-sorted section and an alphabetical section with the level on every entry. The alphabetical section was transcribed because each entry carries its own level.

## Checks run
| Check | Result |
|---|---|
| `python3 scripts/build_wordlist.py` parses every line | 6,009 entries, 0 unparsable lines, 0 unknown parts of speech |
| Entries per level | 1,002 / 1,000 / 1,002 / 1,002 / 1,002 / 1,001. A missing page would leave one level about 120 short, so the list looks complete. |
| Duplicate headwords | none |
| Alphabetical order | 3 breaks, all explained (*café*, *o'clock*, *T-shirt* sort by punctuation) |
| Function words flagged | 65 (articles, pronouns, auxiliaries), 55 in Level 1 |

## Defects found and fixed during transcription
- Seventeen entries had the headword and part of speech run together in the PDF text (for example "bitn.2" for *bit n. 2*): bit, eye, joy, guy, gum, law, rod, ox, web, rob, wed, sea, put, die, car, opt, mat.
- Entries broken across lines were re-joined (for example *advertise(ment)/ad*, *subway/underground/metro*, *chairperson/chair/chairman/chairwoman*).
- Page headers and page numbers were left out.

## Not verified
The transcription was typed from pasted text and was not compared with the PDF file. When the file is available, extract it with `pdftotext -layout` and compare the entry count and the per-level counts with the numbers above, and spot-check 100 random entries.

## Open items carried forward
- Re-check against the original PDF (above).
- Confirm the CEEC list's reuse terms before selling.

## Owner sign-off
No, not yet.
