# Phase 4: Batch 1, the first 20 words (2026-10-19)

## What was built
`content/batches/b001.json`: the 20 words of Batch 1 (boring, go, sore, back, crazy, look, ability, fight, relative, tea, chair, pleasure, hold, touch, earth, set, kid, mother, well, online), each with an English meaning, a Traditional Chinese meaning, a picture cue, one example per level, answer choices, a Sentence Maker frame per level and look-alike spellings. Per level there are two stories of 10 gaps, so every word is a gap once at each level. Status is `draft`.

The players for each activity live in `app/js/views-batch.js`: word cards, Match it, Build it, Pick the word, Sentence Maker, Spelling Bee and the story gap fill (drag a word, or tap a word and then a gap). The Games tab opens Build it, Missing Letters and Spelling Bee.

Review tools: `scripts/make_review_packs.py` makes a blind question pack and a hidden key (and scores answers against it), plus a language pack for a reader. `scripts/build_demo.py` rebuilds the single-file demo.

## Checks run
| Check | Result |
|---|---|
| `scripts/check_batch.py content/batches/b001.json` (gates 1 to 8) | 0 errors; one warning, the status is `draft` |
| `scripts/test_check_batch.py` (breaks a copy of Batch 1 in 24 ways) | 24 of 24 caught |
| Every Sentence Maker sentence listed with `--frames` and read in full | done; 8 grammar problems found and fixed in the first pass |
| `scripts/e2e.cjs` in real Chromium: the whole of Batch 1, both builds | 27 passed, 0 failed (see the last run in the sign-off block) |
| Blind solve, round 1 (a reader who never saw the key) | 120 of 120 items matched the key after the first fixes |
| Blind solve, round 2, after the language fixes | 120 of 120 matched; the reader flagged one story as weakly ambiguous (a shy kid or relative) and it was rewritten |
| Language review, round 1 (every example, frame sentence, story and Chinese meaning) | 55 findings; every high and medium finding fixed, and most low ones |
| Language review, round 2 | 13 findings: 0 high, 5 medium, 8 low; all 13 applied |

## Defects found and fixed
- A band error: "swimming" was a word above the allowed levels in a Beginner text.
- Eight Sentence Maker combinations were ungrammatical or false. Rows now keep one subject class or a modal, so every combination reads well.
- The blind reader could not tell *mother* from *relative* in one story, and *kid* from *relative* in another. Each gap now has a clue that fits one word.
- Round 1 language review: odd collocations, unclear examples and several Chinese meanings that needed a better Taiwan usage (for example *back*, *hold*, *set*, *mother*, *well*).
- Round 2 language review:
  - the touch example no longer reads as permission to touch a hot cup;
  - a Sentence Maker row no longer says a mother drove students to school on a Sunday;
  - *well* and *kid* tiles now combine sensibly;
  - Beginner *chair* no longer puts a shared chair under "we" and "they";
  - in the Beginner dinner story both parents cook, Sam sets the table, and Amy calms the pets by looking at the dog and speaking, then touching the cat once they are quiet.

## Not tested or not verified
- **No teacher has read Batch 1.** The two reviews above were done by AI readers. They find ambiguity and awkward wording well, but they are not a teacher's judgement of what a grade 6 to 9 student in Taiwan finds easy. Gate 11 is open.
- **The fixes made after the round 2 reviews were checked by the machine gates and read by me, but not given to a third independent reader.**
- No students have tried it. A trial with 3 to 5 students at each level is still needed.
- Real touch dragging on a phone or tablet. Mouse dragging and the tap alternative are tested.
- Safari and Firefox.
- The Chinese meanings were read by an AI reviewer. A Taiwan-based teacher should check them.
- The word list was typed from the owner's pasted text. It was not compared with the original PDF (see Phase 0).
- Speech uses the browser's voice. Voice quality varies by device and was not reviewed.

## Open items carried forward
- Teacher review and a short student trial of Batch 1.
- Phase 5: placement check, Quick Review, spaced repeats across batches.
- The remaining 297 batches, written one at a time with the same gates.
- The Little Words track (65 function words held out of the batches).
- Accounts and payments (NT$399).

## Owner sign-off
No, not yet.
