# Watch and listen buttons on the lesson page (2026-10-19)

## What the owner asked for
At each level (Beginner, Intermediate, Advanced) a button to watch the video (English) and a button to listen to the in-depth conversation (Chinese), with a short line underneath each. English when the app is in English, Chinese when it is in Chinese.

## What was built
- **Two buttons on the lesson page**, in a "Watch and listen" card under the level picker. They follow the level the student has chosen, so each level opens its own video and its own conversation.
  - English: "Watch the video" with "Watch now: English video", and "Listen to an in-depth conversation" with "Listen now: Chinese conversation about the words".
  - Chinese: 觀看影片 with 立即觀看：英文影片, and 收聽深入對談 with 立即收聽：關於這些單字的中文對談.
- **The links live in one file, `content/media.json`.** Per lesson and level there is a `video` link and a `talk` link. Paste the Cloudflare link between the quotation marks, run `python3 scripts/build_demo.py` for the single-file build, and the button opens it in a new tab. No code change is needed.
- **Until a link is added** the button is dimmed and shows "Coming soon" (即將推出). Tapping it shows a short message. Only links that start with `https://` are used; anything else is ignored.
- **Checker:** `python3 scripts/check_batch.py --all` now also checks `content/media.json` (every lesson has all three levels, each link is empty or `https://`, no unknown keys). Six new tests, 35 in all.
- Screenshots 21 to 23 in `docs/audit/screens/`: the buttons before links exist, with links, and in Chinese on a phone.

## Checks run
| Check | Result |
|---|---|
| Checker and its tests | 0 errors; 35 of 35 tests |
| Browser test, app folder and single-file demo | 39 of 39 on both; new checks cover the two buttons and subtitles at every level, links per level opening in a new tab, an `http://` and a `javascript:` link being ignored, the Chinese text, and a 390 px phone |

## Not verified
- No real link has been opened, because no link exists yet. The test uses made-up addresses.
- The two buttons open the link in a new tab. They do not play the video inside the app, so the owner's Cloudflare page decides how it plays.
- The Chinese wording of the buttons was written by me and has not had a Chinese reviewer.
- Real touch devices, Safari and Firefox are untested.

## Owner sign-off
No, not yet.
