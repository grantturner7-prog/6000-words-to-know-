# Phase 1: Batching (2026-10-19)

## What was built
- `scripts/build_batches.py` and its output `content/batches.json`: 298 batches, 4 sets of 5 in each full batch, plus a Little Words track.

## Rules used
Level order (Stage = CEEC level). Function words leave the main stream. Inside a level, words are dealt with a stride so alphabetical neighbours (*accept, acceptable, acceptance*) fall in different batches. A swap pass then separates any two words that look like one word family. Each set takes a spread of parts of speech.

## Checks run
| Check | Result |
|---|---|
| Main words | 5,944 in 298 batches: 297 of 20 and a last batch of 4 |
| Batches per Stage | 47 / 50 / 50 / 50 / 50 / 51. Batch 48 holds the last Level 1 words and the first Level 2 words; its Stage is the majority level. |
| Little Words | 65 words in 5 batches of 13 |
| Word-family clashes inside a batch | 9 found on the first run, **0 after the swap pass** |
| Batch 1 | boring, chair, go, pleasure, sore / back, crazy, earth, hold, tea / kid, look, online, touch, well / ability, fight, mother, relative, set: common words, a mix of nouns, verbs, adjectives and adverbs |

## Defects found and fixed
- Nine batches held two members of one word family (*drive/driver*, *skill/skilled*, *persistence/persistent*). Fixed by the swap pass.

## Differences from the plan
- The plan said "order easiest first". No frequency list is used, so order inside a level is by stride, not by difficulty. Level 1 words are all basic, so this matters little for Stage 1 and more for Stages 4 to 6.
- Function words were not in the plan's batches; they form their own track.

## Open items carried forward
- Five random batches read by the owner or the teacher (the plan's audit step) are not done.
- Design the Little Words activities.
- Words with several senses (*back, well, set, relative, kid*): each batch file teaches one sense. Later batches should list the sense taught.

## Owner sign-off
No, not yet.
