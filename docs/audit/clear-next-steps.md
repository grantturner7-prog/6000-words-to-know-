# Clear next steps at the end of every activity (2026-10-19)

## What the owner reported
At the end of an activity the buttons said "Next" and "Back to the lesson" and it was not clear what each one did. The owner asked for buttons that say plainly what happens next, such as moving to the next activity.

## What changed
- **One big button names the next activity.** For example "Next activity: Sentence Maker", with one line under it saying what that activity is ("Build your own sentence"). The order is Meet the words, Pick the word, Sentence Maker, Spelling Bee, Article. If a student has skipped one, the button goes to the first one still open.
- **Two smaller buttons say where they go:** "Do this activity again" and "Go to the lesson menu". "Back to the lesson", "Play again" and the bare "Next" on end screens are gone.
- **A strip of the three stations** (Meet, Use, Article) shows where the student is. Done stations show a tick, the station that holds the next activity is highlighted, and Use counts its three activities ("2 / 3"). The banner says how many of the five activities are done at this level.
- **When all five are done** the banner says "Lesson 1 complete at Beginner level!" and the big button offers "Do Lesson 1 at Intermediate level" (Beginner to Intermediate to Advanced). At Advanced it says "Back to Today".
- **Inside an activity the buttons say what they do:** "Next sentence" (Pick the word), "Next word" (Sentence Maker, Spelling Bee, spelling games), and on the last item "See my score" or "Finish this activity".
- **Meet no longer moves on by itself.** After the 20 cards the button says "Next: match words to meanings". After the last match it waits for "Next: spell the words" (it used to jump after a second). Between the four rounds of five words it still moves on by itself.
- **Games** end with "Back to Games" and "Play this game again".
- The Chinese interface has every new line. Two Chinese lines that read "初級級別" now read "初級".

## Checks run
| Check | Result |
|---|---|
| Browser test, app folder and single-file demo (36 checks) | all pass. New checks: the label of every in-activity button on the last item; the end screen after Meet, Pick, Sentence Maker, Spelling Bee and the Article names the right next activity and link; the wrap-round to Meet; the finished lesson offers the next level and the button starts it; Advanced finished goes to Today; Match it waits for the button, also after switching the Chinese view; the games end screen; the end screen fits a 390 px phone |
| Checker on Lesson 1 and its 29 tests | unchanged, 0 errors |
| Screenshots 16 to 20 in `docs/audit/screens/` | last question, end of Pick on desktop and phone, Match it finished, end of the Article on a phone |

## Not verified
- No student has used the new end screens, so whether the wording is clear to students is still unchecked. A teacher or a short trial should read "Next activity", "Do this activity again" and "Go to the lesson menu".
- The Chinese wording of the new lines was written by me and has not had a Chinese reviewer.
- Real touch devices, Safari and Firefox are untested, as before.

## Owner sign-off
No, not yet.
