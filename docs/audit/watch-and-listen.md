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
- **Plays inside the lesson page (added the same day).** Tapping a button opens a player panel under the two buttons, with a close button and a small "Open in a new tab" link. It plays three kinds of link in the page: a Google Drive file (shown in Drive's own player), a direct video file (mp4, webm, m4v, mov) and a direct audio file (mp3, m4a, wav, ogg, aac). Any other kind of link still opens in a new tab. One player at a time; changing level or language closes it.
- **Preview windows that block other sites' players.** The claude.ai preview refuses to show another site's player, so there the panel says "Open it in a new tab to play it." with a button. A browser test reproduces that refusal and checks the message. On the app's own web address, or from the single-file demo opened from a computer, the player should play in the page.
- Screenshots 21 to 26 in `docs/audit/screens/`: the buttons before links exist, with links, and in Chinese on a phone.

## Checks run
| Check | Result |
|---|---|
| Checker and its tests | 0 errors; 35 of 35 tests |
| Browser test, app folder and single-file demo | 44 of 44 on both; new checks cover the two buttons and subtitles at every level, which kinds of link play in the page and which open a new tab, the Drive player frame with its close button and no new tab, an audio file that loads and starts playing, an `http://` and a `javascript:` link being ignored, the message shown where a window refuses other sites' players, the Chinese text, and a 390 px phone |

## Not verified
- Links added so far: Lesson 1 Beginner video and Beginner conversation, both Google Drive files supplied by the owner. The other four are empty and show Coming soon. Drive could not be reached from this build environment, so neither file was opened here. The owner needs to open both in a private browser window to confirm they are set to Anyone with the link.
- The browser test checks the app against whatever is written in `content/media.json`, and uses made-up addresses for the rest.
- Drive's real player has not been seen working inside the page. Drive could not be reached from this build environment, so the test uses a stand-in page for Drive and checks the player address, the frame, the close button and the fallback. The first real check is the owner opening the demo file or the app's own address and pressing play.
- Sound: a Drive player inside a page starts when the student presses its play button. Some browsers do not let a page start sound by itself.
- The Chinese wording of the buttons was written by me and has not had a Chinese reviewer.
- Real touch devices, Safari and Firefox are untested.

## Owner sign-off
No, not yet.
