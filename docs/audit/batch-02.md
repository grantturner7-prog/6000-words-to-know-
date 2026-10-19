# Batch 2, the next 20 words (2026-10-19)

> **Update, same day:** the owner had not asked for a second lesson. It is no longer in the app, the checker or the PDFs. The file is kept as `content/drafts/b002.json` in the old two-part story format and would need the one-article format (see `one-lesson-flow.md`) before it is used. The rest of this note is the record of how it was checked.

## What was built
- `content/batches/b002.json`: able, east, lose, mountain, only, bad, file, pm, remember, towel, born, chance, god, shake, west, cross, holiday, kill, sorry, teach. Per word: meanings in English and Traditional Chinese, a picture cue, three examples, three sets of answer choices, three Sentence Maker frames and look-alike spellings. Six stories of 10 gaps. 1,200 Sentence Maker sentences in all. Status `draft`.
- The app now handles more than one batch. Today and Games follow a batch chosen with chips, Progress lists every written batch, and the Batches tab opens Batches 1 and 2 as the free sample.
- Voices: see "Voices" below.
- Screenshots 13 to 15 in `docs/audit/screens/` show Today with the batch chips, a Batch 2 story on a phone, and the voice settings.

## Checks run
| Check | Result |
|---|---|
| `scripts/check_batch.py --all` | 0 errors in both batches. The first run on Batch 2 found 15 errors, all vocabulary band or sentence length, and all fixed. |
| `scripts/test_check_batch.py` | 25 of 25 pass. One new test and rule: a story title may not show a word that is a gap in that story. |
| Every Sentence Maker sentence read in full | done by me, then by two independent readers |
| Browser test (`scripts/e2e.cjs`, real Chromium) | 34 checks on the app folder and on the single-file demo. It plays both batches, switches batches, checks the voice picker, and checks for sideways scrolling on a 390 px phone at all three levels. |
| Blind solve, three rounds on the draft, the first fixes and the final text | 120 of 120 matched in every round; the solver never flagged an ambiguous item |
| Language review, round 1 | 65 findings: 2 high, 25 medium, 38 low. Nearly all fixed. |
| Language review, round 2 | 26 findings: 0 high, 8 medium, 18 low. Nearly all fixed. |

## Defects found and fixed
- A wrong tense with a time word ("The sun goes down in the west now") and a wrong preposition ("a holiday at the sea").
- Sentence Maker combinations that were false or illogical: pronouns that did not match ("We ... with my class"), a time that did not suit the action, a reason clause that did not follow, "shook the tree although it was heavy".
- Meanings: `file` was defined as a place, `east` and `west` gave only the direction, `kill` and `holiday` had Chinese glosses wider than the sense taught.
- Two story titles showed their own answers ("Up the Mountain"). Gaps where a second word fitted (lose or remember, kill or shake) now have a clue that fits one word.
- Safety and tone: crossing a river, a bridge that shakes with no adult, children in rain with no teacher, a goddess woken by a loud farmer, food called bad, characters in gender-coded roles. All reworded.
- The Batch 1 hub overflowed a 390 px phone at Advanced level when a story title was long. Fixed in the style sheet and now tested at every level.

## Decisions for the owner or a teacher
- **god and goddess.** The CEEC list has one entry, "god/goddess", so the card teaches both and the Sentence Maker uses both. A reviewer would rather teach only "god". Every god sentence is framed as an old story and is neutral.
- **kill** is taught only for plants and animals, with plant examples. A teacher may want to leave it for a later stage.
- **pm** is a time word, not a spoken word. It stays because it is in the list.
- **east and west** share a batch because the batch planner separates them into different sets of five but not different batches. Their sentences keep them apart.
- Intermediate Sentence Maker rows are short and rarely use and, but or because. They are correct, so they were left as they are in both batches. A later pass could add a clause row.
- **god/goddess in a story gap.** The Intermediate story uses the form "goddess", as other stories use "held" or "killed".

## Voices
The owner found the speech robotic. The app speaks with the voices installed on each device, and the old code took the first English voice it found, which on some devices is an old or novelty voice. Now:
- Voices are ranked: neural and "Natural" voices first, then Premium and Enhanced, then Google and well-known system voices; novelty and old desktop voices come last.
- Settings has a Voice list with a Listen button, and a Speaking speed switch. The normal pace is close to natural speed (0.95) and slow is 0.72.
- Not fixed: the quality ceiling is still the device. A phone or computer with only one basic voice will sound basic. Hugging Face and GitHub are blocked in this build environment, so I could not create neural audio files here.
- The reliable fix is recorded or neural audio files for every word, example and story. The app now plays any clip listed in `audio/index.json` and falls back to the device voice, and `scripts/audio_manifest.py` lists what is needed: about 25,000 clips and 1.8 million characters for the whole course, estimated from the two written batches. No clips exist yet. That needs a choice from the owner (see PLAN, open question 6).

## Not tested or not verified
- No teacher has read Batch 2 and no students have tried it. The reviews above were by AI readers. Gate 11 is open.
- Fixes made after the second language review were checked by the machine gates, by me and by a third blind solve, not by a third language reviewer.
- Voice ranking was tested with sample voice lists, not on real iPhone, Mac, Windows or Android devices.
- The clip player was tested with a stand-in, because no clip files exist yet.
- Real touch dragging, Safari and Firefox, as in Phase 4.

## Owner sign-off
No, not yet.
