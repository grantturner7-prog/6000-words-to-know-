# Genesis 6,000 English Words to Know: project plan

Drafted 2026-10-19. Status (2026-10-19): the word list arrived as pasted text, and **Phases 0 to 4 are built and audited** (`docs/audit/`). Batches 1 and 2 are playable at all three levels. Batch 1 also has its Chinese translations and three level PDFs for the owner's videos (`docs/audit/batch-01-chinese-and-pdfs.md`). Next: the owner's videos and conversations for Batch 1, a teacher's read of both batches, a decision on voices, and a trial with a few students, then Phase 5.

## Owner decisions, second review (2026-10-19)
1. **Batches.** Each batch has 20 words, which gives 298 batches for the 5,944 main words, plus the 65 Little Words. The course is self-paced: a student may finish as many batches in a week as they like. The suggested pace is one batch a week, with the owner's video for that batch (section 5 has the arithmetic).
2. **What a batch holds.** At each level, in this order: **Watch** (the owner's video, English with Chinese subtitles, in the owner's own voice), **Talk** (an English conversation and a Chinese conversation that use the batch's words), **Meet** (flashcards), **Spell** (drag-and-drop spelling), **Use** (pick the word, Sentence Maker) and **Read** (an article with drag-and-drop gaps). Beginner, Intermediate and Advanced open the same 20 words at a higher level, each with its own recording. Watch and Talk are new; the rest is built.
3. **No accounts, no monthly bill.** Progress is saved in the student's own browser or app on their own device, and no student information is kept. A save code moves progress to another device. The owner records the videos and voices with a professional microphone.

4. **Per level (confirmed 2026-10-19).** One batch is 20 words and has three levels. Each level has its own video, its own English conversation, its own Chinese conversation and its own story: three of each per batch, which is 894 videos for the course. The Chinese conversation is in Chinese with the English words kept inside it, to explain how to use the words. The owner makes the videos and the conversations (with Gemini and NotebookLM) from one PDF per level that this project supplies, and hosts them with a video and audio service of their own (Cloudflare), linked into the app afterwards. This project does not make the videos or conversations.

What this project supplies for each batch: a PDF per level with the 20 words, the Chinese meanings, the example sentences, the sentence patterns with sample sentences, the story, and the Chinese for all of it (`docs/pdf/`, made by `scripts/make_level_pdfs.py` from `content/translations/`).

## 1. The product in one paragraph
A web app for phone, iPad and desktop (it must work inside LINE's browser) that teaches 6,000 English words to second-language students in Taiwan, roughly grades 6 to 9 and up. Words arrive in **batches of 20**. Each batch is learned at three levels, **Beginner, Intermediate and Advanced**, with tap-and-drag activities only: no typing and no AI marking. Tapping any word shows its meaning in English and Traditional Chinese, and one switch turns the Chinese on or off. The look is the same liquid-glass design as the IELTS app, in light and dark. Sold as *Genesis 6,000 English Words to Know* for NT$399 (about US$10), one purchase.

## What the word list turned out to be
The PDF is the **Senior High English Reference Word List** from the College Entrance Examination Center (CEEC), sorted by level (第一級 to 第六級) and again alphabetically. Facts from the transcription (`docs/audit/phase-0.md`):

| | |
|---|---|
| Entries | **6,009** (the "6,000 words"). Levels 1 to 6 hold 1,002 / 1,000 / 1,002 / 1,002 / 1,002 / 1,001. |
| Spellings taught | 6,202, because some entries pair words (*actor/actress*, *agree(ment)*, *he (him, his, himself)*). |
| Function words | 65 (articles, pronouns, auxiliaries such as *the, I, will, can*), 55 of them in Level 1. They cannot be taught by dragging a word into a story gap, so they form a separate **Little Words** track (5 batches of 13), still to be designed. |
| Batches | **298**: 297 of 20 words and a last one of 4. Stage = CEEC level, about 50 batches each. |
| Why the levels matter | Each level is about 1,000 words, so the list already has a difficulty ladder. The app uses it twice: to order the batches, and as the **vocabulary band** of every text (a Beginner story may use only Level 1 words besides the taught ones). |

## 2. Rules for the whole build
1. **One phase at a time, each ending in a small audit** filed at `docs/audit/phase-N.md`. The next phase starts after the owner signs off (same method as the TOEIC plan).
2. **Content stays data** (`content/...`), validated by a script, never buried in code.
3. **Original content only.** Headwords, parts of speech and levels come from the CEEC list, a public exam-centre document (reuse terms still to be confirmed before the product is sold). Every definition, translation, example sentence, story and activity is written new.
4. **Standing owner rules carry over:** refer to learners as "students"; positive wording ("Try another word", never "Wrong"); at most three items per breakdown on student screens; no remarks about any group of people; no real student names.
5. **Honest claims.** No promises of fluency or exam scores (see section 12).
6. **Independent brand.** As with Genesis TOEIC, the app does not mention any other product.

## 3. Recommendations at a glance
| Question | Recommendation |
|---|---|
| Batch size | **20 words per batch**, taught as **4 sets of 5**. Five is the most a student should meet before practising. |
| Weekly pace | Default **one batch a week** (about 20 minutes a day, five days). Offer **two a week** for students who want to finish sooner. |
| How long is 6,000? | 298 batches. At one a week that is about 7.5 school years; at two a week about 3.75 (table in section 5). Present the app as a **library to move through at your own pace**, not a one-year course. |
| Levels | Defined by **sentence and text rules**, not by splitting the word list. Every word can be met at all three levels. |
| Article length | **One article per level per batch, in two short parts** (10 words each), so no text is long and no text is crowded with gaps. |
| "Use the word in my own sentence" | **Sentence Maker**: students build their own sentence from tiles. Every combination is grammatical by design, so no marking is needed. |
| Spelling | Drag-and-tap letter tiles, missing letters, and listen-and-choose. All touch, no keyboard. |
| Chinese | One switch, remembered. A new student starts with Chinese **On at Beginner** and **Off at Intermediate and Advanced**. |
| Level order | **Free choice with a gentle nudge to climb** (stars for each level), not locks. A paying student should reach everything. |
| Placement | A short check at the start, so students skip words they already know. Early batches of a 6,000 list may be familiar. |

## 4. The science: what it supports and what is judgement
Status key: **checked** = source confirmed by web search on 2026-10-19; **secondary** = confirmed through summaries of the paper, so read the paper before quoting numbers in marketing.

| Finding | Source | What it means for the app | Status |
|---|---|---|---|
| Working memory holds about four chunks at once | Cowan (2001), *Behavioral and Brain Sciences* 24 | A new word bundles sound, spelling and meaning. Keep sets small: **5 words, then practise** before the next set. The number 5 is my judgement, tested in the pilot. | checked |
| Spaced practice beats massed practice; the best gap grows with how long the memory must last | Cepeda et al. (2006), *Psychological Bulletin* 132 | Words return in later sets, in the Intermediate and Advanced passes, and in a daily **Quick Review** (a simple five-box schedule at 1, 3, 7, 14 and 30 days; the intervals are a design choice). | checked |
| Being tested beats re-reading for delayed retention | Roediger and Karpicke (2006), *Psychological Science* 17 | Every activity asks the student to recall or choose. Word cards are a short first step, not the main activity. | checked |
| More meaningful encounters bring larger gains, from about three and rising near ten | Webb (2007), *Applied Linguistics* 28 | Each word appears about **10 times in a first pass** (cards, match, build, pick, sentence, bee, story, reviews) and more than 20 once all three levels are done. | secondary |
| Words close in meaning are harder to learn together | Tinkham and Waring, summarised in Nation (2000), *TESOL Journal* 9 | A batch mixes **unrelated words** and never puts two words from one family together. The connection comes from the **story**, which helps. | secondary |
| First-language glosses help retention, at least for lower-level learners | Laufer and Shmueli (1997), *RELC Journal* 28; later results are mixed | Chinese is on by default at Beginner, and the student controls the switch. | secondary |
| Comfortable reading needs about 98% known words (95% can work in some settings) | Hu and Nation (2000); Nation (2006); Van Zeeland and Schmitt (2012) | In every story, all words **except the 20 targets** come from a controlled frequency band for that level. Targets are taught first and glossed on tap, so the story is practice, not a first meeting. | secondary |
| About 8,000 to 9,000 word families are needed for 98% of written text | Nation (2006), *Canadian Modern Language Review* | 6,000 words is a strong base, not independence. Say "words to know", never "read anything". | checked |
| Taiwan guidance expects at least 1,200 words by the end of junior high, with a 2,000-word reference list; the exam centre (CEEC) publishes its own lists, including a 7,000-word list | Taiwan 12-year curriculum guidelines; CEEC | 6,000 is a senior-high-to-university-entrance goal. Early batches may be known already, which is why placement matters. | checked; confirm current figures before marketing |

Not relied on: a 2019 meta-analysis (Uchihara, Webb and Yanagisawa) supports the value of repetition, but its effect size could not be confirmed, so no number from it appears here.

## 5. Pace: how many words a week
Cognitive load sets the **size of a set (5)**. Retention depends far more on **review than on intake**, so the weekly pace is a motivation and time decision more than a memory limit. I recommend piloting before fixing it.

| Plan | Batches a week | New words a week | Weeks for 298 batches | Calendar years (52 weeks) | School years (40 weeks) |
|---|---|---|---|---|---|
| Gentle (suggested) | 1 | 20 | 298 | 5.7 | 7.5 |
| Steady | 2 | 40 | 149 | 2.9 | 3.7 |
| Fast | 3 | 60 | 100 | 1.9 | 2.5 |
| One a school day | 5 | 100 | 60 | 1.1 | 1.5 |

Grades 6 to 9 are four school years, about 160 school weeks. To finish the 5,944 main words in that time a student needs about two batches a week. The course does not cap the pace; the owner's decision is that students may do as many batches in a week as they want.

**A Gentle week** (my estimate, to confirm in the pilot): four 10-minute sessions, one per set of 5 new words, plus a Story session of about 15 minutes, plus a 5-minute Quick Review each day. That is about 20 minutes a day. Earlier batches come back at Intermediate and Advanced in later weeks, which supplies the spacing.

## 6. The three levels
Levels change the **sentences, the story, the support and the traps**, not the word list. The labels below (CEFR) are internal guides and never shown to students. The Advanced level stops at the top of what these students can read with confidence (low B1), by design. The checker script enforces the numbers; the pilot tunes them. (Story lengths were raised after drafting: ten gaps with one target word per sentence do not fit in 40 to 60 words.)

| | Beginner | Intermediate | Advanced |
|---|---|---|---|
| Student goal | Use the word in a very simple sentence | Use it in a short, natural sentence with a detail | Use it in a longer sentence with a reason, time or contrast |
| Internal target | A1 | A2 | A2+ to low B1 |
| Sentences | Up to 8 words. Present simple, *is/are*, *I like/have/want*, *can* | Up to 12 words. Simple past, *will/going to*, *and/but/because* | Up to 18 words. *when/if/so/although*, *who/that*, comparisons |
| Story length (each of 2 parts) | 45 to 90 words | 80 to 130 words | 110 to 175 words |
| Other words in the story | Level 1 words of the CEEC list only (about 1,000) | Levels 1 and 2 | Levels 1 to 3 |
| Chinese switch (first run) | On | Off | Off |
| Build it (spelling) | All letters given, scrambled | Plus 2 or 3 extra letters | Extra letters, audio only |
| Other choices offered | Different parts of speech, easy to rule out | Same part of speech | Same part of speech, close in meaning or spelling |

## 7. Anatomy of one batch
At the top of a batch: the **level switch** (Beginner, Intermediate, Advanced), the **Chinese switch**, and the three stations. Each station holds three activities.

*Update (2026-10-19):* the owner has added two stations in front of these three, **Watch** (the owner's video) and **Talk** (an English and a Chinese conversation); see "Owner decisions". The three stations below are built and tested. Watch and Talk wait on questions 9 to 11 in section 14.

**Station 1: Meet** (run once per set of 5 words, about 10 minutes)
1. **Word cards.** Tap to see the English meaning, the Chinese (if on), a sentence at the chosen level, and hear the word.
2. **Match it.** Drag each word onto its meaning (English, Chinese or a picture).
3. **Build it.** Drag letter tiles to spell the word.

**Station 2: Use** (all 20 words, about 15 minutes)
1. **Pick the word.** Choose the word that fits a sentence with a gap.
2. **Sentence Maker.** Build your own sentence from tiles (section 8).
3. **Spelling Bee.** Hear the word, choose the correct spelling.

**Station 3: Story** (about 10 minutes)
1. **Read** the story at the chosen level; tap any word to peek at its meaning.
2. **Fill the gaps.** Drag words from the word bank into the gaps, Part 1 then Part 2.
3. **Check.** Each gap is marked. Words that do not fit return to the bank for another try. After two tries the answer is shown with a short reason. Stars are awarded per level.

Words that need practice enter the Quick Review schedule automatically.

## 8. Sentence Maker: "use the word in your own sentence" with no typing and no AI
The student builds a sentence from short rows of tiles. The sentence is theirs, because they choose the tiles. It is always grammatical, because every row is written so that **any** choice from each row fits the others. The target word has its own row, and it must be used.

Format illustration only (not a batch word):

| Row 1 (who) | Row 2 (target) | Row 3 (what) |
|---|---|---|
| I / My sister / My friend | can **borrow** | a pen / a book / your bike |

That frame gives 27 sentences, all correct. Intermediate adds a time tile (*Yesterday*, *Last week*) and a past form. Advanced adds a reason tile (*because I need it*, *but I forgot mine*).

- The chosen sentence is saved to **My Sentences** in Progress, so students and teachers can see it later.
- The checker script lists every combination of every frame and rejects any frame built outside the approved templates.
- Honest limit: this is guided production, not free writing. For this audience and without marking, it is the right trade.

## 9. Spelling and games
All games are touch-first, last about two minutes, never take lives away, and feed the Quick Review schedule.

**Spelling (3)**
1. **Build it.** Letter tiles into slots (also inside Station 1).
2. **Missing Letters.** A word with one to three letters missing; tap the right letters.
3. **Spelling Bee.** Hear it, choose the right spelling from look-alike options.

**Arcade (3)**, in the Games tab
1. **Word Rain.** Glass bubbles fall with words; drag the right one into the basket for the clue.
2. **Memory Match.** Pair each word with its meaning.
3. **Speed Match.** A 60-second round of quick matches, with a personal best.

## 10. App shape
- **Four tabs:** Today, Batches, Games, Progress. A glass **sidebar** on iPad and desktop, a floating glass **tab bar** on phone (as in the IELTS app).
- **Screens:** Welcome ("Welcome to Genesis 6,000 English Words to Know"), Login and Account, Today (continue the current batch, Quick Review, streak), Batches (298 batches in 6 Stages, one per CEEC level), Batch hub, the three station players, **Word Peek** (the tap-a-word popover), Games, Progress (words learned, stars, My Sentences).
- **Account panel:** interface language (Traditional Chinese or English), Light or Dark, reduce animation, Chinese switch, sign out.
- **Design:** reuse the tokens and components from the IELTS app (`app/css/app.css` and `docs/design/glass.css`: glass fill, 22 px blur, light edge, sheen, light and dark themes). Level colours: **Beginner mint, Intermediate amber, Advanced violet**, taken from the existing palette.
- **Tech:** static front end with no build step (as in IELTS). Drag and drop uses **Pointer Events**, with a **tap-then-tap** alternative, because the browser's built-in drag API is unreliable on touch. Interface strings live in translation files from day one. Progress is stored on the device first and syncs once accounts exist.

## 11. Content data and the checker
Files: `content/wordlist.json` (all 6,000 headwords from the PDF), `content/batches.json` (which 20 words go in which batch and set), and `content/batches/b001.json` and so on. Field sketch for one batch:

```json
{
  "id": "b001", "stage": 1, "status": "draft",
  "words": [{
    "id": "w0001", "headword": "...", "pos": "verb", "set": 1,
    "forms": ["..."],
    "zhTW": "...", "defEN": "...",
    "examples": { "beginner": "...", "intermediate": "...", "advanced": "..." },
    "frames":   { "beginner": {}, "intermediate": {}, "advanced": {} },
    "confusableSpellings": ["..."]
  }],
  "stories": {
    "beginner":     { "parts": [{ "text": "... {w0001} ...", "gaps": ["w0001"] }] },
    "intermediate": { "parts": [] },
    "advanced":     { "parts": [] }
  },
  "provenance": { "writtenBy": "...", "prompt": "...", "reviewedBy": "", "reviewedOn": "" }
}
```

`scripts/check_batch.py` gates a batch before it is published:
1. Exactly 20 words, 4 sets of 5; every id exists in the word list.
2. Every word has English meaning, Chinese, example sentences at all three levels, and a Sentence Maker frame.
3. Sentence length stays within each level's cap.
4. In each story, every non-target word is inside the level's frequency band; every target appears; each part has 10 gaps.
5. No duplicated sentences, no duplicated gaps, no two words from one family in a batch.
6. Every frame passes the approved-template check, and every combination is enumerated.
7. Student-facing text contains no negative wording from the banned list.
8. A reviewer name and date are recorded before status can become `published`.

The vocabulary band for gate 4 uses the CEEC list itself, so no outside frequency list or licence is needed.

**Scale, honestly:** about 190 small pieces of content per batch (per word: meaning, Chinese, three example sentences, three Sentence Maker frames and a look-alike spelling, plus six story parts), so about 56,000 across 298 batches. Writing is the easy part. Quality assurance is the long pole. Plan on templates, the checker and **sampled** teacher review (every piece for Batches 1 to 5, then a fixed sample).

## 12. Commerce, access and claims
- **Price:** NT$399 (about US$10), one purchase, lifetime access. Reuse the commerce engine described in the IELTS repo's `docs/MONETISATION.md` (accounts, entitlement gate, ECPay or NewebPay, the seven-day-cancellation consent, e-invoice, refunds page) as a new product.
- **Free sample:** Batches 1 and 2 open to everyone, so a buyer sees all three levels first.
- **Gate:** paid batches are served only after the server checks the entitlement. Static JSON files are public, so the demo build is for testing only.
- **Claims guard:** "6,000 words" must be true on the day of sale, or the store labels what is live (for example "Stages 1 and 2 of 6 available now"). No fluency or exam-score promises. Check Taiwan consumer-protection and advertising rules before any result claim.

## 13. Phases, each ending in an audit
**Phase 0: Decisions and word intake.** Deliverables: this plan signed off; the PDF received; `content/wordlist.json` extracted (headword, part of speech if given, original order, source page). Audit: the count matches the PDF; duplicates and odd entries listed; the owner confirms the order and any level information in the PDF.

**Status (2026-10-19):** Done. 6,009 entries transcribed and parsed; counts per level are consistent with six levels of about 1,000. The original PDF file was not available, so the transcription should be re-checked against it (`docs/audit/phase-0.md`).

**Phase 1: Batching.** Deliverables: a batch-builder script and `content/batches.json`. Rules: order easiest first; mix parts of speech; one word per family per batch; avoid near-synonyms together. Audit: five random batches read by the owner or the teacher.

**Status (2026-10-19):** Done, with one change from the plan: function words leave the main stream (the Little Words track), and ordering inside a level is by alphabetical stride, not easiest-first, because no frequency list is used. 298 batches, no word-family clashes (`docs/audit/phase-1.md`).

**Phase 2: Content standards and checker.** Deliverables: `docs/CONTENT-STANDARDS.md` and `scripts/check_batch.py` (section 11). Audit: the checker catches each defect in a set of deliberately broken sample batches.

**Status (2026-10-19):** Done. `docs/CONTENT-STANDARDS.md`, `scripts/check_batch.py`, and 24 tests that break a copy of Batch 1 in one way each (`docs/audit/phase-2.md`).

**Phase 3: Design system and app shell.** Deliverables: Welcome screen, sidebar and tab bar, light and dark, account panel, the Chinese switch, Word Peek, translation files. Audit: screenshots on phone, iPad and desktop in both themes; contrast check; every string in translation files.

**Status (2026-10-19):** Done. Welcome, Today, Batches, Games, Progress, Settings, Word Peek, light and dark, English and Traditional Chinese, phone to desktop (`docs/audit/phase-3.md`, screenshots in `docs/audit/screens/`).

**Phase 4: Batch 1 vertical slice (first 20 words).** Deliverables: Batch 1 written at all three levels; the three station players; Build it, Missing Letters and Spelling Bee; drag and drop with tap alternative; the Check flow. Audit: checker has 0 errors; a blind solve (independent AI solver) agrees with every key; teacher review filed; 3 to 5 students try it and the notes are filed.

**Status (2026-10-19):** Built and checked by machine and by two independent AI reviewers. **Still open from this phase's audit list:** teacher review and a trial with 3 to 5 students (`docs/audit/phase-4.md`). Games Build it, Missing Letters and Spelling Bee are done; the arcade games are Phase 5.

**Batch 2 (2026-10-19):** written and reviewed with the same gates (`docs/audit/batch-02.md`). It took a first draft that the checker rejected 15 times, then two rounds of AI language review (65 findings, then 26) and three blind solves. Plan on that much review effort for every batch, plus a teacher's read, when sizing the remaining 296.

**Phase 5: Games, Quick Review, Progress.** Deliverables: the three arcade games, the five-box Quick Review, stars, streak, My Sentences, a placement check. Audit: Quick Review schedule tested with simulated days; each game played end to end on a phone.

**Phase 6: Content at scale.** Deliverables: Stage 1 (Batches 1 to 50), then each further Stage. Audit per Stage: checker clean, sample review done, blind-solve sample passed.

**Phase 7: Accounts and purchase.** Deliverables: accounts, the entitlement gate, checkout in test mode, then live. Audit: a test purchase flows to unlock; paid files are confirmed unreachable without the entitlement.

**Phase 8: Pilot and launch.** Deliverables: a pilot of at least 30 students over four weeks with set accuracy, one-week and four-week retention, and time on task; fixes; status from `draft` to `published`. Thirty students can flag problems and tune the pace; they cannot support learning-gain claims.

## 14. Open questions for the owner (with my recommendation)
Answered by the build: the PDF is the public CEEC list (question 1 of the first draft), and its levels give the Stage structure.

1. **Reuse terms of the CEEC list.** It is a public exam-centre document and only headwords, parts of speech and levels are used. Please confirm its reuse terms (or the permission you hold) before the product is sold.
2. **Little Words.** Do you want the 65 function words taught as their own short track with grammar-pattern activities? *Recommended: yes, at the end of Stage 1.*
3. **Default pace:** one batch a week with a two-a-week option? *Recommended: yes.*
4. **Level order:** free choice with a nudge to climb, or locks? *Built as free choice.*
5. **Launch scope:** all 298 batches on day one, or Stage by Stage? *Recommended: decide once a teacher has timed the review of Batch 1.*
6. **Audio:** the app speaks with the voices installed on each device. They are ranked so the most natural one is used, and Settings lets a student pick another, but the owner found the result robotic on their device and quality will vary. Recorded or neural text-to-speech files for every word and example, reviewed by the teacher, would sound the same on every device. *Recommended: yes, before launch. Choose one:* (a) the owner or a teacher records the clips; (b) a commercial text-to-speech service with a licence for a paid product, which needs an account and key from the owner; (c) keep device voices only. The app already plays a clip when one is listed in `audio/index.json` and falls back to the device voice otherwise (`audio/README.md`), so clips can be added without rebuilding. From the two written batches, the full course is about 25,000 clips and 1.8 million characters (`python3 scripts/audio_manifest.py`); at typical neural-voice prices of a few to a few tens of US dollars per million characters, that is a small cost, to be confirmed with the chosen provider.
7. **Engine:** build the learning app and content in this repo, then connect it to the shared accounts and payments engine as its own product (the TOEIC pattern)? *Recommended: yes.*
8. **Reviewer:** who is the teacher who signs off each batch, and what share of later batches do they read in full?
9. **Videos: decided.** One per level, so three per batch (see Owner decisions, point 4). Recording and editing time for 894 videos is the owner's largest piece of work; Batch 1 will show how long one batch takes.
10. **The Chinese conversation: decided.** Chinese with the English words kept inside it.
11. **Video hosting: decided as Cloudflare.** Cloudflare has two products that matter. Stream is simple but bills for minutes stored and for minutes watched, so the bill grows with every student. R2 stores ordinary video files and charges for storage, not for downloads, so it stays small as students grow. *Recommended: R2 with plain MP4 files and a subtitle file for each video, unless Stream's convenience is worth a bill that grows. Check Cloudflare's current prices before choosing.*

## 15. Risks
- **Content volume and quality assurance** (section 11).
- **Order inside a level.** The list is alphabetical within each level, and the batches deal words by stride rather than easiest-first. A frequency list could improve this later.
- **Early batches may be known already.** Placement and skip-ahead address this.
- **The pace is a judgement** until the pilot supplies data.
- **Licences:** the CEEC list's reuse terms, and any picture or audio source. Picture cues are emoji today; speech uses the browser's own voice.
