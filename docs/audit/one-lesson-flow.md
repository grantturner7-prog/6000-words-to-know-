# One lesson, 20 words, one article per level (2026-10-19)

## What the owner reported
- The app showed two lessons when one had been asked for.
- The 20 words were split into sets of five and parts of ten, which was not what the owner asked for.
- In the spelling game, after one wrong letter was corrected, all the letters disappeared.

## What changed
- **Spelling bug fixed.** The drag-and-tap helper added a new set of listeners every time a screen redrew its words. After a word or two, one tap ran old code that put the letter into a tray that no longer existed. It now attaches once per screen and only swaps in the new options. Reproduced first in a real browser (five letters became four), then fixed, and the browser test now checks that no letter vanishes on the first two words.
- **One flow for all 20 words.** Meet, Pick the word, Sentence Maker, Spelling Bee, Build it and Missing Letters each cover all 20 words in one run. The hub shows three stations with no sets or parts. Match it shows five words on screen at a time so it fits a phone, and counts the whole lesson ("Matched 10 of 20").
- **One article per level with 20 gaps.** Each level's two stories were joined into one article with a short bridge sentence (Beginner is one Sunday, Intermediate is told by one person at camp and at the school fair, Advanced goes from a rainy day to Lucy's party). The word bank holds all 20 words, and the star comes when the article is finished.
- **Lesson, not batch.** The app, the PDFs and the reading sheet say Lesson; files keep `b001`.
- **The second lesson is out of the app.** It was written on my own initiative, not at the owner's request. It sits in `content/drafts/b002.json` in the old two-part format and is not checked, tested or shown.
- Progress is now one value per station. Older saves with sets and parts, and older save codes, are folded into the new shape.

## Checks run
| Check | Result |
|---|---|
| Checker on Lesson 1 with the new article rules (20 gaps, 90 to 190, 160 to 270 and 220 to 360 words) | 0 errors |
| Checker tests | 29 of 29 |
| Blind solve of the new 20-gap articles (all 20 words in the bank) and the 60 pick items | 120 of 120 matched; two gaps were flagged as soft ambiguities and given clearer clues |
| Browser test in a real browser, app folder and single-file demo | 33 of 33 on both, including all 20 words in every activity, the spelling fix and the word bank staying on screen |
| The three level PDFs | rebuilt: Lesson 1 Beginner 10 pages, Intermediate 11, Advanced 11 |

## Not verified
- The bridge sentences and the first-person Intermediate article were checked by the blind solver and by me, but not by a language reviewer or a Chinese reviewer. The new Chinese for them follows the same checks as the rest.
- No teacher has read Lesson 1, and no students have tried the 20-word flow. Twenty words in one sitting is more than the five-word sets the plan was built on; the owner chose it, and the pilot should measure it.
- Real touch dragging and Safari and Firefox are untested.

## Owner sign-off
No, not yet.
