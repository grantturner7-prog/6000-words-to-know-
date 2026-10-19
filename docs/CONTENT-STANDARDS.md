# Content standards for a batch

Every batch passes these gates before it is published. Gates 1 to 8 are automatic: `python3 scripts/check_batch.py content/batches/b001.json` (or `--all`). The checker itself is tested by `python3 scripts/test_check_batch.py`, which breaks a copy of Batch 1 in 24 ways and confirms each one is caught. Gates 9 to 11 need people.

Standing rules from the owner apply to all text: refer to learners as "students"; positive wording (the app says "Almost! Try another one", never "Wrong"); no remark about any group of people; no real student names; original sentences only.

## What a batch holds
20 words, in 4 sets of 5 (the sets come from `content/batches.json`, never edited by hand). For each word:

| Field | Rule |
|---|---|
| `headword`, `pos` | One of the spellings the word list teaches; the one part of speech taught in this batch. |
| `forms` | Every spelling used anywhere in the batch (hold, holds, held, holding). |
| `defEN` | 10 words or fewer, in plain English, for the one sense taught. |
| `zhTW` | Traditional Chinese (Taiwan usage), for the same sense. Separate senses with "；". |
| `emoji` | Optional picture cue. |
| `examples` | One sentence per level with the word marked as `{word}`. |
| `pick` | Three answer choices from the same batch that clearly do not fit, per level. |
| `frames` | One Sentence Maker frame per level (see below). |
| `confusable` | At least two look-alike spellings for the Spelling Bee, none of them correct. |

Per level, two stories of 10 gaps each. Every word is a gap exactly once at each level.

## The three levels
| | Beginner | Intermediate | Advanced |
|---|---|---|---|
| Sentence length | up to 8 words | up to 12 | up to 18 |
| Story part length | 45 to 90 words | 80 to 130 | 110 to 175 |
| Other words allowed | Level 1 of the word list | Levels 1 and 2 | Levels 1 to 3 |
| Grammar | present simple, *is/are*, *can*, *will* | past simple, *going to*, *and/but/because* | *when/if/so/although*, *who/that* |
| Support | Chinese on, hint always shown | Chinese on, hint shown, 2 extra letters in Build it | hint on request, 3 extra letters |

Names (Sam, Amy), numbers, days, months, seasons, countries and the words "English" and "Chinese" are allowed at every level.

## The gates
1. **Count and sets.** Exactly 20 words, ids match `content/batches.json`, each word in its planned set.
2. **Complete fields.** Every field above is present; `zhTW` contains Chinese characters; `defEN` is at most 10 words.
3. **Sentence caps.** Every example, story sentence and Sentence Maker sentence stays within its level's word cap.
4. **Vocabulary band.** Every word except the taught words comes from the allowed word-list levels (above). The checker reduces each token to its base form (plurals, past tenses, *-ing*, *-er*, *-ly*, irregular verbs, contractions). This gate matters most: it means students never meet a word that has not been taught, and the list's own levels set the difficulty.
5. **Examples.** Exactly one marked word, which is a listed form. No sentence appears twice in the batch.
6. **Answer choices.** Three different distractors, each a word of the batch, none equal to the answer.
7. **Sentence Maker frames.** 2 to 4 rows, 2 to 5 tiles per row, exactly one target row whose every tile contains the word, no repeated tile, at most 100 combinations.
8. **Stories.** Gap marks `[[1]]` to `[[10]]` in order; ten gaps per part; each gap form is a listed form of its word; every word is a gap exactly once per level; no banned word; status `published` needs `reviewedBy` and `reviewedOn`.
9. **Grammar of every frame sentence (people).** The checker lists every combination (`--frames`), but it cannot judge grammar. A frame is grammatical by construction only if every tile in a row works with every tile in the other rows. Rules that keep this true:
   - Use past tense, modals (*can, will, may*) or one subject class per row, so agreement never changes. Never mix *I/we/they* with *-s* verbs, or *My teacher* with a bare verb.
   - A tile that begins a clause (*because*, *while*, *after*) is fine. A tile that needs a comma before it (*but*, *so*, *although* after a short clause) is not; use *because/while/after/when/until* in a "why/when" row.
   - Keep the meaning true. No row may produce a false fact ("Bees can swim").
10. **Independent review.** `python3 scripts/make_review_packs.py` makes two packs. A fresh reviewer who has not seen the key solves every gap-fill item and story blind; any disagreement means the item is ambiguous and is rewritten. A second reviewer reads every Sentence Maker sentence and every Chinese meaning. Fix every high and medium finding, then re-run the checker.
11. **Teacher sign-off.** A teacher reads the batch, fills `reviewedBy` and `reviewedOn`, and sets status to `published`. Until then the status stays `draft` and the app shows the batch only as a free sample.

## Provenance
Content written by an AI records that in `provenance.writtenBy` ("AI draft, original text"). Nothing is copied from a published text.

## Changing the rules
Change the numbers in `scripts/check_batch.py` and this page together, add a test in `scripts/test_check_batch.py`, and say why in the audit file of the phase that needed it.
