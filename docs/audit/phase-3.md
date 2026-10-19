# Phase 3: Design system and app shell (2026-10-19)

## What was built
`app/`: `index.html`, `css/app.css` (the liquid-glass tokens from the IELTS app), `js/i18n.js` (all student-facing text, English and Traditional Chinese), `js/core.js` (saved state, theme, speech, router, Word Peek, settings), `js/dnd.js` (drag and drop plus tap alternative), `js/views-shell.js`, `js/views-batch.js`, `js/main.js`, icon and manifest. A single-file build: `scripts/build_demo.py` -> `demo/Genesis-6000-Words.html`.

Screens: Welcome ("Welcome to Genesis 6,000 English Words to Know"), Today, Batches (298 batches in 6 Stages), Batch hub, Games, Progress, Settings, Word Peek. Sidebar on large screens, floating glass tab bar on phones. Level colours: Beginner mint, Intermediate amber, Advanced violet. Screenshots are in `docs/audit/screens/`.

## Checks run
| Check | Result |
|---|---|
| `scripts/e2e.cjs` (real Chromium): welcome title, name entry, light and dark, English and Chinese interface, Batches, Chinese switch, Word Peek, phone width | all pass (the full run is 27 checks; see Phase 4) |
| No sideways scrolling at 390 px on Today, Batches, hub, Games, Progress, word card, story, Sentence Maker | pass |
| No console errors across the whole run | pass |
| The single-file demo opened from disk (`file://`) | the same 27 checks pass |
| Page contract for the hosted page (no pop-up dialogs, explicit body background, light fallback when no theme is set, safe-area side padding) | applied |

## Defects found and fixed
- The colourful background was hidden because the body's own background painted over it. Fixed with stacking order.
- Switches in Settings lost their accent colour because the dialog sat outside the level colour scope.
- Match it on a phone needed scrolling between the words and their meanings. Words now wrap compactly above the meanings.
- Gap numbers overlapped the word once a gap was filled.
- "Sound is off" appeared on every automatic spoken word. It now appears only when a student presses a speaker button.
- "Clear my progress" used the browser's confirm pop-up, which the hosted page cannot show. It now confirms inside the page.

## Not tested
- Real touch dragging on a phone or tablet. Dragging was tested with a mouse in Chromium; the tap-a-word-then-tap-a-gap alternative is tested.
- Safari and Firefox.
- A formal contrast check with a tool, and screen-reader use. Buttons have labels and focus is visible, but this was not audited.
- Speech: the app uses the browser's voice; it was checked only for failing quietly when no voice exists.

## Open items carried forward
- Offline use (a service worker) and an install icon beyond the basic one.
- Placement check and Quick Review (Phase 5).

## Owner sign-off
No, not yet.
