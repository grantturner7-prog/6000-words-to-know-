# Recorded audio

The app speaks with the device's voice. To use recorded or neural-voice clips instead, put the files in this folder and list them in `index.json`:

```json
{
  "mountain": "words/mountain.mp3",
  "we can see a mountain from here.": "sentences/b001-mountain-beginner.mp3"
}
```

- The key is the exact text the app speaks, in lower case, with `{ }` marks removed and spaces collapsed (the same text the Listen buttons use).
- The value is a path relative to this folder, or a full `https://` address.
- Where a clip exists it is played; everywhere else the device voice speaks. Students' own saved Sentence Maker sentences always use the device voice.
- `python3 scripts/audio_manifest.py` lists every text a written batch needs and how many characters that is, so the work can be quoted or scheduled.
- The single-file demo reads the index but not the clip files, so it uses the device voice.
- Clips need a licence that allows use in a paid product, and the teacher should listen to them before they ship.
