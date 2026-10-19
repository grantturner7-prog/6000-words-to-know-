# Batch 1: Chinese translations and the three level PDFs (2026-10-19)

## What was built
- `content/translations/b001.json`: Chinese for all 60 example sentences, 120 sample sentences (the first and the last tile of every row of every Sentence Maker pattern) and the 6 story parts, plus a table of the names and family words used.
- Three PDFs of 10 pages each in `docs/pdf/`: `batch-001-beginner.pdf`, `batch-001-intermediate.pdf` and `batch-001-advanced.pdf`. Each holds the 20 words in four sets of five with their Chinese meanings, then for every word the example sentence, the Sentence Maker pattern and two sample sentences, all with Chinese, then the level's story in two parts with Chinese and a gap-by-gap word table. The text is selectable and the Chinese fonts are embedded.
- `scripts/make_level_pdfs.py` builds the PDFs from the batch and translation files, so they cannot drift from the app.
- Two app meanings changed because the sentences needed them: **hold** now shows 拿著；抱著；握住；扶著 and **pleasure** shows 樂趣；愉快的事.

## Checks run
| Check | Result |
|---|---|
| New checker gate for translations: every example, sample and story has Chinese; every example and sample uses the word's own Chinese meaning; every story's Chinese uses the meaning of each of its gap words; every sample's English still equals what its pattern builds | 0 errors on Batch 1; 4 new tests, 29 in all, pass |
| Independent Chinese review, round 1 (Taiwan usage, accuracy, matching the app meanings, consistency, suitability for children) | 33 findings: 1 high, 14 medium, 18 low; all applied |
| Independent Chinese review, round 2, on the corrected text | 12 findings: 0 high, 2 medium, 10 low; 11 applied |
| Browser test on the app folder and the single-file demo after the meaning changes | 35 of 35 on both |
| PDF text extraction | Chinese and English text extract cleanly from all three PDFs |

## Defects found and fixed
- The advanced story said "we" made the tea where the English says the grandfather did.
- Chinese that was literal or stiff, and words not used in Taiwan: 小弟弟 (also unsuitable for a children's video), 群眾, 隊伍, 越來越暖, 台 for a piano, 當…時.
- Family words that were inconsistent or too specific. The choices are now fixed in the translation file and shown on the first page of every PDF.

## Left as it is
- Batch 1, Beginner, relative: the first sample sentence is the same as the example sentence ("A relative visits us today."), because the pattern's first tiles build it.

## Decisions for the owner or a teacher
- Family words: 奶奶 and 爺爺 for grandmother and grandfather, 阿姨 for aunt, 叔叔 for uncle, 哥哥 for brother, 姊姊 for sister, 表兄弟姊妹 for cousins. Each implies a side of the family or an age. Change them in one place, `terms` in the translation file, and the PDFs and checks follow.
- A word's Chinese meaning in the app is the one the owner will teach. The Chinese conversations should use these meanings, and `docs/pdf/` shows them.

## Not verified
- No teacher has read the Chinese. Both reviews were by AI readers.
- The PDFs have not been loaded into NotebookLM or Gemini.
- Batch 2 has no Chinese yet, so it has no PDFs.

## Owner sign-off
No, not yet.
