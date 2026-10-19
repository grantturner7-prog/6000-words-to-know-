# Phase 2: Content standards and checker (2026-10-19)

## What was built
- `docs/CONTENT-STANDARDS.md`: the gates and the fields of a batch file.
- `scripts/check_batch.py`: gates 1 to 8, automatic.
- `scripts/test_check_batch.py`: 24 tests.
- `scripts/make_review_packs.py`: packs for independent review (gate 10).

## Checks run
| Check | Result |
|---|---|
| `python3 scripts/test_check_batch.py` | 24 tests pass. Each breaks a copy of Batch 1 in one way (word above the band, sentence too long, missing mark, wrong gap count, repeated gap, distractor equal to the answer, frame without a target row, a Chinese field with no Chinese, banned word, "published" with no reviewer, and others) and confirms the gate reports it. |
| `python3 scripts/check_batch.py content/batches/b001.json` | 0 errors, 1 warning (status is draft) |

## Defects found by the checker while Batch 1 was written
- One Beginner Sentence Maker tile used *swimming*, a Level 2 word. Replaced with *running*.

## Defects the checker cannot find, found by reading every sentence
Reading all 1,276 generated Sentence Maker sentences found eight problems that no automatic gate can see: a plural and a singular subject sharing one verb (*Our teacher work hard*), *very sore that* instead of *so sore that*, four clauses that needed a comma (*but*, *so*, *although*), one present/past tense mix, and one contradiction (*sometimes fight … every day*). All were rewritten. This is why gate 9 (grammar by construction) and gate 10 (independent review) exist.

## Open items carried forward
- Gate 9 depends on a person or a second reviewer; see Phase 4.
- The band check reduces words to base forms with simple rules plus a table of irregular verbs. It is generous, so a rare false pass is possible; the independent review is the backstop.

## Owner sign-off
No, not yet.
